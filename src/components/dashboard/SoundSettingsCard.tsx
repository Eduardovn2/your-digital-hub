import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminSettings } from "@/contexts/AdminSettingsContext";
import { BellRing, PlayCircle, Volume2 } from "lucide-react";

export function SoundSettingsCard() {
  const { soundEnabled, toggleSound, testSound } = useAdminSettings();

  const handleToggle = (checked: boolean) => {
    toggleSound();
    if (checked) {
      // Toca o som ao ligar para liberar o navegador
      testSound();
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-xl border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
            <BellRing className="h-5 w-5 text-primary" /> Notificações Sonoras
        </CardTitle>
        <CardDescription>
          Receba um alerta sonoro quando chegar um novo pedido.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-4 border rounded-xl bg-white/50">
          <div className="space-y-1">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-slate-500" />
              Alerta Sonoro
            </Label>
            <p className="text-xs text-slate-500 max-w-[250px]">
              Reproduz "notification.mp3" a cada novo pedido.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* BOTÃO DE TESTE: SÓ APARECE SE COPIAR ESTE CÓDIGO */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={testSound}
              className="h-8 text-xs font-bold text-slate-600 hover:text-primary border-slate-200"
              title="Testar se o som está funcionando"
            >
              <PlayCircle className="h-3.5 w-3.5 mr-1.5" /> 
              Testar Som
            </Button>

            <Switch
              checked={soundEnabled}
              onCheckedChange={handleToggle}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}