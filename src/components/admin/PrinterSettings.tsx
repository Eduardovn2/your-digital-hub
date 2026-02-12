import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, Settings2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function PrinterSettings() {
  const [config, setConfig] = useState({
    autoPrint: false,
    paperSize: "80mm",
  });

  // Carrega as configurações ao abrir a tela
  useEffect(() => {
    const saved = localStorage.getItem("printer_settings");
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  // Salva no LocalStorage sempre que mudar
  const updateConfig = (newConfig: any) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem("printer_settings", JSON.stringify(updated));
    toast.success("Configuração de impressão salva!");
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-primary" />
          <CardTitle>Configurações da Impressora</CardTitle>
        </div>
        <CardDescription>
          Configure como o sistema deve se comportar ao receber novos pedidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* IMPRESSÃO AUTOMÁTICA */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="space-y-0.5">
            <Label className="text-base font-bold text-slate-700">Impressão Automática</Label>
            <p className="text-xs text-slate-500">
              Imprimir o cupom assim que o pedido chegar na cozinha.
            </p>
          </div>
          <Switch 
            checked={config.autoPrint}
            onCheckedChange={(val) => updateConfig({ autoPrint: val })}
          />
        </div>

        {/* TAMANHO DO PAPEL */}
        <div className="space-y-3">
          <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Tamanho do Papel (Térmico)
          </Label>
          <Select 
            value={config.paperSize} 
            onValueChange={(val) => updateConfig({ paperSize: val })}
          >
            <SelectTrigger className="w-full h-12 bg-white">
              <SelectValue placeholder="Selecione o tamanho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="58mm">58mm (Impressoras Pequenas/Bluetooth)</SelectItem>
              <SelectItem value="80mm">80mm (Impressoras Padrão/Bematech)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* BOTÃO DE TESTE */}
        <Button 
          variant="outline" 
          className="w-full gap-2 border-dashed"
          onClick={() => window.print()} // Teste rápido do navegador
        >
          <CheckCircle2 className="h-4 w-4" />
          Testar Impressão de Página
        </Button>

      </CardContent>
    </Card>
  );
}