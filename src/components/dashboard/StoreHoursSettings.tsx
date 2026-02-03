import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Clock } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface StoreHoursSettingsProps {
  storeId: string;
}

const DAYS_OF_WEEK = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
];

export function StoreHoursSettings({ storeId }: StoreHoursSettingsProps) {
  const queryClient = useQueryClient();
  
  // Estado local alinhado com seu Banco de Dados
  const [openingTime, setOpeningTime] = useState("18:00");
  const [closingTime, setClosingTime] = useState("23:00");
  const [daysOpen, setDaysOpen] = useState<number[]>([]);
  const [isAutoControl, setIsAutoControl] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);

  // 1. Busca configurações existentes
  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-hours", storeId],
    queryFn: async () => {
      // Tenta buscar a configuração única desta loja
      const { data, error } = await supabase
        .from("store_hours")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle(); // Usa maybeSingle pois pode não existir ainda

      if (error) throw error;
      return data;
    },
  });

  // 2. Carrega dados no estado
  useEffect(() => {
    if (settings) {
      setOpeningTime(settings.opening_time || "18:00");
      setClosingTime(settings.closing_time || "23:00");
      setDaysOpen(settings.days_open || []);
      setIsAutoControl(settings.is_auto_control ?? true);
      setRecordId(settings.id);
    }
  }, [settings]);

  // 3. Função para alternar dias
  const toggleDay = (dayId: number) => {
    setDaysOpen(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId) 
        : [...prev, dayId].sort()
    );
  };

  // 4. Mutação para Salvar
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        store_id: storeId,
        opening_time: openingTime,
        closing_time: closingTime,
        days_open: daysOpen,
        is_auto_control: isAutoControl
      };

      let error;
      
      if (recordId) {
        // Atualiza existente
        const { error: updateError } = await supabase
          .from("store_hours")
          .update(payload)
          .eq("id", recordId);
        error = updateError;
      } else {
        // Cria novo
        const { error: insertError } = await supabase
          .from("store_hours")
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-hours"] });
      toast.success("Horários atualizados!");
    },
    onError: (error) => toast.error("Erro ao salvar: " + error.message),
  });

  if (isLoading) return <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de Funcionamento</CardTitle>
        <CardDescription>
          Defina os dias e o horário padrão que sua loja opera.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Controle Automático */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
          <div className="space-y-0.5">
            <Label className="text-base">Abrir/Fechar Automaticamente</Label>
            <p className="text-sm text-slate-500">
              O site mudará status baseado nos horários abaixo.
            </p>
          </div>
          <Switch 
            checked={isAutoControl} 
            onCheckedChange={setIsAutoControl}
          />
        </div>

        <div className={!isAutoControl ? "opacity-50 pointer-events-none" : ""}>
          {/* Seleção de Dias */}
          <div className="space-y-3 mb-6">
            <Label>Dias de Funcionamento</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = daysOpen.includes(day.id);
                return (
                  <div 
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`cursor-pointer px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                      isSelected 
                        ? "bg-primary text-white border-primary shadow-sm" 
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {day.label.slice(0, 3)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seleção de Horário (Global) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Abertura</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="time" 
                  className="pl-9"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fechamento</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="time" 
                  className="pl-9"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full sm:w-auto">
            {saveMutation.isPending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}