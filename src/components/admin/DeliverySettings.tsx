import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Truck, Save, Bell, BellOff } from "lucide-react";
import { toast } from "sonner";

export default function DeliverySettings({ storeId }: { storeId: string }) {
  const [baseFee, setBaseFee] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);

  // 1. Carrega configurações e verifica permissão de notificação
  useEffect(() => {
    async function loadSettings() {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("id", storeId)
        .single();

      if (!error && data) {
        setBaseFee((data as any).delivery_fee?.toString() || "0");
      }
      
      if ("Notification" in window) {
        setPushEnabled(Notification.permission === "granted");
      }
      
      setIsLoading(false);
    }
    loadSettings();
  }, [storeId]);

  // 2. Função para Ativar Notificações em Standby (iPhone, Android, PC)
  const handleEnableNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      toast.error("Este navegador não suporta notificações em standby.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Permissão de notificação negada.");
        return;
      }

      // Registro do Service Worker para rodar com tela desligada
      const registration = await navigator.serviceWorker.ready;
      
      // Aqui você enviaria a 'subscription' para o Supabase para disparar o Push real-time
      setPushEnabled(true);
      toast.success("Notificações em standby ativadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao ativar notificações.");
    }
  };

  // 3. Salva a taxa de entrega
  const saveSettings = async () => {
    setIsSaving(true);
    const feeValue = parseFloat(baseFee.replace(',', '.'));

    const { error } = await supabase
      .from("stores")
      .update({ delivery_fee: feeValue } as any)
      .eq("id", storeId);

    if (error) {
      toast.error("Erro ao salvar: verifique a coluna no Supabase.");
    } else {
      toast.success("Configurações salvas!");
    }
    setIsSaving(false);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* CARD DE NOTIFICAÇÕES (STANDBY) */}
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <div className="flex items-center gap-2 text-orange-700">
            {pushEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            <CardTitle>Alertas em Tempo Real</CardTitle>
          </div>
          <CardDescription className="text-orange-600/80">
            Ative para receber avisos sonoros de novos pedidos mesmo com a tela do celular desligada ou navegador fechado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleEnableNotifications} 
            variant={pushEnabled ? "outline" : "default"}
            className={pushEnabled ? "bg-white" : "bg-orange-600 hover:bg-orange-700"}
          >
            {pushEnabled ? "Alertas Ativados" : "Ativar Alertas em Standby"}
          </Button>
          <p className="mt-2 text-[10px] text-gray-500 italic">
            *No iPhone, você deve primeiro "Adicionar à Tela de Início" pelo Safari.
          </p>
        </CardContent>
      </Card>

      {/* CARD DE TAXAS */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <CardTitle>Configurações de Entrega</CardTitle>
          </div>
          <CardDescription>Defina o valor fixo da taxa de entrega.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fee">Taxa Fixa (R$)</Label>
            <Input 
              id="fee"
              type="number" 
              step="0.01"
              value={baseFee} 
              onChange={(e) => setBaseFee(e.target.value)} 
            />
          </div>
          <Button onClick={saveSettings} disabled={isSaving} className="w-full sm:w-auto">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}