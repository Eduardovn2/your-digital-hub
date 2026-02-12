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
  
  // 1. PERSISTÊNCIA: Carrega o estado inicial do localStorage de forma segura
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("admin_sound_enabled");
      // Se não houver nada salvo, o padrão é TRUE (ligado)
      return saved !== null ? JSON.parse(saved) : true;
    } catch (e) {
      return true;
    }
  });

  // 2. INICIALIZAÇÃO: Cria o objeto de áudio apenas uma vez
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio("/notification.mp3");
      audioRef.current.load();
    }

    // --- DESTRAVADOR DE SOM (ESSENCIAL PARA O NAVEGADOR) ---
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          console.log("🔓 Áudio desbloqueado com sucesso!");
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('touchstart', unlockAudio);
        }).catch(() => {});
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // 3. ATUALIZAÇÃO: Sempre que mudar o som, salva no localStorage
  useEffect(() => {
    localStorage.setItem("admin_sound_enabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
    // Mostra um aviso rápido da mudança
    toast.info(!soundEnabled ? "Som das notificações ativado" : "Som das notificações desativado");
  };

  const playAudio = (isTest = false) => {
    if (!audioRef.current) return;

    // Reinicia o áudio para tocar do começo, mesmo se já estiver tocando
    audioRef.current.currentTime = 0;
    
    audioRef.current.play()
      .then(() => {
        if (isTest) toast.success("Som funcionando perfeitamente!");
      })
      .catch((error) => {
        console.error("Erro ao reproduzir áudio:", error);
        if (isTest) toast.error("Clique na tela antes de testar o som.");
      });
  };

  const playNotificationSound = () => {
    if (soundEnabled) playAudio(false);
  };

  const testSound = () => {
    // O teste ignora se o som está desativado (para você saber que o arquivo existe)
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