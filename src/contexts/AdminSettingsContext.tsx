import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { toast } from "sonner";

interface AdminSettingsContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playNotificationSound: () => void;
  testSound: () => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Estado inicial
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("admin_sound_enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Inicializa o áudio
  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.load();

    // --- DESTRAVADOR DE SOM ---
    // Adiciona um ouvinte no documento inteiro
    const unlockAudio = () => {
      if (audioRef.current) {
        // Tenta tocar e pausar imediatamente só para liberar a permissão
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          console.log("🔓 Áudio desbloqueado pelo navegador!");
        }).catch(() => {});
        
        // Remove o ouvinte após o primeiro clique (já conseguimos a permissão)
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('keydown', unlockAudio);
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("admin_sound_enabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev: boolean) => !prev);
  };

  const playAudio = (isTest = false) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = 0;
    const playPromise = audioRef.current.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (isTest) toast.success("Som funcionando!");
        })
        .catch((error) => {
          console.error("Erro áudio:", error);
          if (error.name === "NotAllowedError") {
            toast.error("Clique em qualquer lugar da tela para ativar o som dos pedidos!");
          }
        });
    }
  };

  const playNotificationSound = () => {
    if (soundEnabled) playAudio(false);
  };

  const testSound = () => {
    playAudio(true);
  };

  return (
    <AdminSettingsContext.Provider value={{ soundEnabled, toggleSound, playNotificationSound, testSound }}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export const useAdminSettings = () => {
  const context = useContext(AdminSettingsContext);
  if (!context) throw new Error("useAdminSettings deve ser usado dentro de um AdminSettingsProvider");
  return context;
};