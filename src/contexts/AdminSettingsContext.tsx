import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AdminSettingsContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playNotificationSound: () => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  // 1. Inicia lendo do LocalStorage (ou true como padrão)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("admin_sound_enabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // 2. Salva no LocalStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem("admin_sound_enabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = () => {
    setSoundEnabled((prev: boolean) => !prev);
  };

  // 3. Função Global para tocar som (só toca se estiver ativado)
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    // Tenta tocar o som
    try {
      const audio = new Audio("/notification.mp3"); // Certifique-se de ter esse arquivo em /public
      audio.play().catch(e => console.log("Erro ao tocar som (interação necessária):", e));
    } catch (error) {
      console.error("Erro no áudio:", error);
    }
  };

  return (
    <AdminSettingsContext.Provider value={{ soundEnabled, toggleSound, playNotificationSound }}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export const useAdminSettings = () => {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error("useAdminSettings deve ser usado dentro de um AdminSettingsProvider");
  }
  return context;
};