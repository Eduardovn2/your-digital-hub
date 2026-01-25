import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useStoreHours, useUpsertStoreHours } from "@/hooks/useStoreHours";
import { DAYS_OF_WEEK } from "@/types/store";
import { Clock, Loader2 } from "lucide-react";

interface StoreHoursSettingsProps {
  storeId: string;
}

export function StoreHoursSettings({ storeId }: StoreHoursSettingsProps) {
  const { data: hours, isLoading } = useStoreHours(storeId);
  const upsertHours = useUpsertStoreHours();
  
  const [formData, setFormData] = useState({
    opening_time: "08:00",
    closing_time: "22:00",
    days_open: [1, 2, 3, 4, 5, 6] as number[],
    is_auto_control: true,
  });

  useEffect(() => {
    if (hours) {
      setFormData({
        opening_time: hours.opening_time.slice(0, 5),
        closing_time: hours.closing_time.slice(0, 5),
        days_open: hours.days_open,
        is_auto_control: hours.is_auto_control,
      });
    }
  }, [hours]);

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days_open: prev.days_open.includes(day)
        ? prev.days_open.filter(d => d !== day)
        : [...prev.days_open, day].sort()
    }));
  };

  const handleSave = async () => {
    await upsertHours.mutateAsync({
      storeId,
      hours: {
        store_id: storeId,
        opening_time: formData.opening_time,
        closing_time: formData.closing_time,
        days_open: formData.days_open,
        is_auto_control: formData.is_auto_control,
      },
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
          <Clock className="h-4 w-4" />
          Horário de Funcionamento
        </h4>
        <p className="text-sm text-muted-foreground">Configure quando sua loja está aberta</p>
      </div>

      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Switch
          checked={formData.is_auto_control}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_auto_control: checked }))}
        />
        <div>
          <Label>Controle Automático</Label>
          <p className="text-xs text-muted-foreground">Abrir/fechar a loja automaticamente no horário</p>
        </div>
      </div>

      {formData.is_auto_control && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário de Abertura</Label>
              <Input
                type="time"
                value={formData.opening_time}
                onChange={(e) => setFormData(prev => ({ ...prev, opening_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário de Fechamento</Label>
              <Input
                type="time"
                value={formData.closing_time}
                onChange={(e) => setFormData(prev => ({ ...prev, closing_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dias de Funcionamento</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <label
                  key={day.value}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-colors
                    ${formData.days_open.includes(day.value) 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-muted/50 border-transparent'
                    }
                  `}
                >
                  <Checkbox
                    checked={formData.days_open.includes(day.value)}
                    onCheckedChange={() => handleDayToggle(day.value)}
                  />
                  <span className="text-sm">{day.label.slice(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <Button 
        onClick={handleSave} 
        disabled={upsertHours.isPending}
        className="w-full"
      >
        {upsertHours.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Salvar Horário"
        )}
      </Button>
    </div>
  );
}
