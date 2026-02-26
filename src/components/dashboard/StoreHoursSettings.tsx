import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Clock, CalendarDays, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface StoreHoursSettingsProps {
  storeId: string;
}

const DAYS_OF_WEEK = [
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
  { id: 0, label: "Domingo" },
];

export function StoreHoursSettings({ storeId }: StoreHoursSettingsProps) {
  const queryClient = useQueryClient();
  
  const [openingTime, setOpeningTime] = useState("18:00");
  const [closingTime, setClosingTime] = useState("23:00");
  const [daysOpen, setDaysOpen] = useState<number[]>([]);
  const [isAutoControl, setIsAutoControl] = useState(true);
  const [recordId, setRecordId] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["store-hours", storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("store_hours")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      setOpeningTime(settings.opening_time || "18:00");
      setClosingTime(settings.closing_time || "23:00");
      setDaysOpen(settings.days_open || []);
      setIsAutoControl(settings.is_auto_control ?? true);
      setRecordId(settings.id);
    }
  }, [settings]);

  const toggleDay = (dayId: number) => {
    setDaysOpen(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId) 
        : [...prev, dayId].sort()
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        store_id: storeId,
        opening_time: openingTime,
        closing_time: closingTime,
        days_open: daysOpen,
        is_auto_control: isAutoControl
      };

      if (recordId) {
        const { error } = await supabase
          .from("store_hours")
          .update(payload)
          .eq("id", recordId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("store_hours")
          .insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-hours"] });
      toast.success("Horários de funcionamento atualizados! 🕒");
    },
    onError: (error) => toast.error("Erro ao salvar: " + error.message),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
    </div>
  );

  return (
    <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-[2.5rem]">
      {/* Barra de destaque colorida */}
      <div className="h-2 bg-gradient-to-r from-amber-400 to-orange-500 w-full" />
      
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-black flex items-center gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          Funcionamento
        </CardTitle>
        <CardDescription className="font-medium">
          Automatize a abertura e fecho da sua loja online.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8">
        
        {/* Switch Principal Gourmet */}
        <div className={`flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${
          isAutoControl 
            ? "bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/30" 
            : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
        }`}>
          <div className="space-y-1">
            <Label className="text-base font-bold text-slate-800 dark:text-slate-200">Controlo Automático</Label>
            <p className="text-xs text-slate-500 font-medium max-w-[200px] leading-tight">
              O site mudará o estado (Aberto/Fechado) sozinho.
            </p>
          </div>
          <Switch 
            checked={isAutoControl} 
            onCheckedChange={setIsAutoControl}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        <div className={`space-y-8 transition-all duration-500 ${!isAutoControl ? "opacity-30 grayscale pointer-events-none scale-95" : "opacity-100"}`}>
          
          {/* Seleção de Dias com Visual de Botão */}
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <CalendarDays className="h-3 w-3" /> Dias de Atendimento
            </Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isSelected = daysOpen.includes(day.id);
                return (
                  <button 
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`px-4 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                      isSelected 
                        ? "bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-200 dark:shadow-none scale-105" 
                        : "bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-800 hover:border-amber-200"
                    }`}
                  >
                    {day.label.slice(0, 3).toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs de Horário Estilizados */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hora de Abertura</Label>
              <div className="relative group">
                <Clock className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-amber-500 transition-colors" />
                <Input 
                  type="time" 
                  className="pl-11 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hora de Fecho</Label>
              <div className="relative group">
                <Clock className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                <Input 
                  type="time" 
                  className="pl-11 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Dica de Mestre Integrada */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex gap-3 items-start border border-blue-100 dark:border-blue-900/30">
            <Sparkles className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
              Dica: Manter os horários atualizados evita que receba pedidos quando a cozinha está fechada, melhorando a sua nota com os clientes!
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Button 
            onClick={() => saveMutation.mutate()} 
            disabled={saveMutation.isPending} 
            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            {saveMutation.isPending ? (
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
            ) : (
              <Save className="mr-2 h-5 w-5 text-amber-400" />
            )}
            Atualizar Funcionamento
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}