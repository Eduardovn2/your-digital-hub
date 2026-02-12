import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface AdminSettingsContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playNotificationSound: () => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

export const AdminSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. Declaração do estado do som
// No início do seu Provider
const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
  const saved = localStorage.getItem("admin_sound_enabled");
  return saved ? JSON.parse(saved) : true;
});

  // Salva a preferência no navegador
  useEffect(() => {
    localStorage.setItem("admin_sound_enabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  // 2. Função interna para manipular o arquivo de áudio
  const playAudio = () => {
    try {
      const audio = new Audio("/notification.mp3");
      audio.play().catch(err => {
        console.warn("Reprodução automática bloqueada pelo navegador. Interaja com a página primeiro.", err);
      });
    } catch (error) {
      console.error("Erro ao carregar arquivo de áudio:", error);
    }
  };

  // 3. Função que o sistema chama para notificar
  const playNotificationSound = () => {
    if (soundEnabled) {
      playAudio();
    } else {
      console.log("Notificação visual emitida, mas som está desativado.");
    }
  };

  // 4. Função para alternar o som (usada no botão de configurações)
const toggleSound = () => {
  setSoundEnabled((prev: boolean) => {
    const newState = !prev;
    
    // Usamos newState aqui para o toast mostrar a mensagem correta
    toast.info(newState ? "Som ativado" : "Som desativado");
    
    return newState;
  });
};

  // Retorna o provedor com todos os valores declarados
  return (
    <AdminSettingsContext.Provider value={{ 
      soundEnabled, 
      toggleSound, 
      playNotificationSound 
    }}>
      {children}
    </AdminSettingsContext.Provider>
  );
};

// Hook customizado para usar o contexto
export const useAdminSettings = () => {
  const context = useContext(AdminSettingsContext);
  if (context === undefined) {
    throw new Error("useAdminSettings deve ser usado dentro de um AdminSettingsProvider");
  }
  return context;
};