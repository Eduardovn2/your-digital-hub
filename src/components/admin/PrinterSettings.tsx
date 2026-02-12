import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, Zap, FileText, Settings, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export function PrinterSettings() {
  const [config, setConfig] = useState({
    autoPrint: false,
    paperSize: "80mm",
    numCopies: 1
  });

  useEffect(() => {
    const saved = localStorage.getItem("printer_settings");
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  const updateConfig = (newConfig: any) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    localStorage.setItem("printer_settings", JSON.stringify(updated));
    toast.success("Preferências de impressão salvas!");
  };

  return (
    <Card className="bg-white/60 backdrop-blur-xl border-white/50 shadow-xl overflow-hidden transition-all hover:shadow-2xl">
      {/* Decoração Lateral */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Printer className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl font-black text-slate-800 tracking-tight">
              Central de Impressão
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Configure como os cupons térmicos serão gerados neste computador.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* SEÇÃO: IMPRESSÃO AUTOMÁTICA */}
        <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/60 shadow-sm transition-colors hover:bg-white/60">
          <div className="flex gap-3 items-start">
            <Zap className={`h-5 w-5 mt-0.5 ${config.autoPrint ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`} />
            <div className="space-y-0.5">
              <Label className="text-base font-bold text-slate-700">Fluxo Automático</Label>
              <p className="text-[11px] text-slate-500 font-medium">
                O papel sai sozinho assim que o pedido é confirmado.
              </p>
            </div>
          </div>
          <Switch 
            checked={config.autoPrint}
            onCheckedChange={(val) => updateConfig({ autoPrint: val })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SEÇÃO: TAMANHO DO PAPEL */}
          <div className="space-y-2.5">
            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FileText className="h-3 w-3" /> Tamanho do Papel
            </Label>
            <Select 
              value={config.paperSize} 
              onValueChange={(val) => updateConfig({ paperSize: val })}
            >
              <SelectTrigger className="bg-white/80 border-slate-200 h-12 rounded-xl focus:ring-primary shadow-sm">
                <SelectValue placeholder="Selecione o tamanho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58mm">58mm (Culinária/Portátil)</SelectItem>
                <SelectItem value="80mm">80mm (Padrão Profissional)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* SEÇÃO: COPIAS (Visual apenas por enquanto) */}
          <div className="space-y-2.5">
            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Settings className="h-3 w-3" /> Vias por Pedido
            </Label>
            <Select 
              value={config.numCopies.toString()} 
              onValueChange={(val) => updateConfig({ numCopies: parseInt(val) })}
            >
              <SelectTrigger className="bg-white/80 border-slate-200 h-12 rounded-xl shadow-sm">
                <SelectValue placeholder="Vias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Via (Padrão)</SelectItem>
                <SelectItem value="2">2 Vias (Cozinha + Balcão)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* BOTÃO DE TESTE GRÁFICO */}
        <Button 
          variant="secondary" 
          className="w-full h-12 gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl border border-slate-200 transition-all active:scale-95"
          onClick={() => window.print()}
        >
          <PlayCircle className="h-4 w-4" />
          Imprimir Cupom de Teste
        </Button>

      </CardContent>
    </Card>
  );
}