import { Order } from "@/types/store";

// Esta função prepara o objeto para ser impresso
export const printOrder = async (orderId: string, storeId: string) => {
  console.log(`Iniciando processo de impressão para o pedido: ${orderId}`);
  
  // Aqui você pode disparar um evento customizado ou logar a intenção.
  // Como o print depende de um componente React (DOM), 
  // o gatilho real acontece no componente de logística.
  window.dispatchEvent(new CustomEvent('TRIGGER_PRINT', { detail: { orderId } }));
};

// Configurações salvas no LocalStorage
export const getPrinterConfig = () => {
  const saved = localStorage.getItem("printer_settings");
  return saved ? JSON.parse(saved) : { autoPrint: false, paperSize: "80mm" };
};