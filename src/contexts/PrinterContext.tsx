import { createContext, useContext, useState, useEffect } from "react";

interface PrinterSettings {
  autoPrint: boolean;
  paperSize: "58mm" | "80mm";
  copies: number;
}

interface PrinterContextType {
  settings: PrinterSettings;
  updateSettings: (newSettings: Partial<PrinterSettings>) => void;
}

const PrinterContext = createContext<PrinterContextType>({} as PrinterContextType);

export const usePrinter = () => useContext(PrinterContext);

export const PrinterProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<PrinterSettings>({
    autoPrint: false,
    paperSize: "80mm", // Padrão mais comum
    copies: 1,
  });

  // Carrega configurações salvas ao abrir
  useEffect(() => {
    const saved = localStorage.getItem("printer_settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const updateSettings = (newSettings: Partial<PrinterSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem("printer_settings", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <PrinterContext.Provider value={{ settings, updateSettings }}>
      {children}
    </PrinterContext.Provider>
  );
};