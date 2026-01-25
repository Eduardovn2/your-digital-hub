import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePrinterSettings, useUpsertPrinterSettings } from "@/hooks/usePrinterSettings";
import { Printer, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PrinterSettingsProps {
  storeId: string;
}

export function PrinterSettings({ storeId }: PrinterSettingsProps) {
  const { data: settings, isLoading } = usePrinterSettings(storeId);
  const upsertSettings = useUpsertPrinterSettings();
  
  const [formData, setFormData] = useState({
    printer_ip: "",
    printer_port: 9100,
    is_enabled: false,
    paper_width: 80,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        printer_ip: settings.printer_ip,
        printer_port: settings.printer_port,
        is_enabled: settings.is_enabled,
        paper_width: settings.paper_width,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    await upsertSettings.mutateAsync({
      storeId,
      settings: formData,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium flex items-center gap-2">
          <Printer className="h-4 w-4" />
          Impressora Térmica
        </h4>
        <p className="text-sm text-muted-foreground">Configure impressão automática de pedidos</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          A impressora deve estar conectada na mesma rede local e configurada para aceitar conexões via IP (porta 9100).
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Switch
          checked={formData.is_enabled}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
        />
        <div>
          <Label>Ativar Impressão Automática</Label>
          <p className="text-xs text-muted-foreground">Imprimir cupom automaticamente ao receber pedido</p>
        </div>
      </div>

      {formData.is_enabled && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>IP da Impressora *</Label>
              <Input
                value={formData.printer_ip}
                onChange={(e) => setFormData(prev => ({ ...prev, printer_ip: e.target.value }))}
                placeholder="Ex: 192.168.1.100"
              />
            </div>
            <div className="space-y-2">
              <Label>Porta</Label>
              <Input
                type="number"
                value={formData.printer_port}
                onChange={(e) => setFormData(prev => ({ ...prev, printer_port: parseInt(e.target.value) || 9100 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Largura do Papel</Label>
            <Select 
              value={String(formData.paper_width)} 
              onValueChange={(v) => setFormData(prev => ({ ...prev, paper_width: parseInt(v) }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58">58mm (bobina pequena)</SelectItem>
                <SelectItem value="80">80mm (bobina padrão)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <Button 
        onClick={handleSave} 
        disabled={upsertSettings.isPending || (formData.is_enabled && !formData.printer_ip)}
        className="w-full"
      >
        {upsertSettings.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Salvar Configurações"
        )}
      </Button>
    </div>
  );
}
