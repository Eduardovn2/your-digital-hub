import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDeliveryZones, useCreateDeliveryZone, useUpdateDeliveryZone, useDeleteDeliveryZone } from "@/hooks/useDeliveryZones";
import { Plus, Trash2, Loader2, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DeliveryZonesSettingsProps {
  storeId: string;
}

export function DeliveryZonesSettings({ storeId }: DeliveryZonesSettingsProps) {
  const { data: zones, isLoading } = useDeliveryZones(storeId);
  const createZone = useCreateDeliveryZone();
  const updateZone = useUpdateDeliveryZone();
  const deleteZone = useDeleteDeliveryZone();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newZone, setNewZone] = useState({ name: "", cep_prefix: "", fee: "" });

  const handleCreate = async () => {
    if (!newZone.name) return;
    
    await createZone.mutateAsync({
      store_id: storeId,
      name: newZone.name,
      cep_prefix: newZone.cep_prefix || null,
      fee: parseFloat(newZone.fee) || 0,
      is_active: true,
    });
    
    setNewZone({ name: "", cep_prefix: "", fee: "" });
    setIsDialogOpen(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateZone.mutateAsync({
      id,
      storeId,
      updates: { is_active: isActive },
    });
  };

  const handleDelete = async (id: string) => {
    await deleteZone.mutateAsync({ id, storeId });
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
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Zonas de Entrega
          </h4>
          <p className="text-sm text-muted-foreground">Configure taxas por bairro ou CEP</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova Zona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Zona de Entrega</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Bairro/Região *</Label>
                <Input
                  value={newZone.name}
                  onChange={(e) => setNewZone(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Centro, Jardins..."
                />
              </div>
              <div className="space-y-2">
                <Label>Prefixo do CEP (opcional)</Label>
                <Input
                  value={newZone.cep_prefix}
                  onChange={(e) => setNewZone(prev => ({ ...prev, cep_prefix: e.target.value }))}
                  placeholder="Ex: 01310"
                  maxLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label>Taxa de Entrega (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newZone.fee}
                  onChange={(e) => setNewZone(prev => ({ ...prev, fee: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreate}
                disabled={createZone.isPending || !newZone.name}
              >
                {createZone.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar Zona"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {zones && zones.length > 0 ? (
        <div className="space-y-2">
          {zones.map(zone => (
            <div 
              key={zone.id} 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{zone.name}</span>
                  {zone.cep_prefix && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      CEP: {zone.cep_prefix}
                    </span>
                  )}
                </div>
                <span className="text-sm text-primary font-semibold">
                  R$ {zone.fee.toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Switch
                  checked={zone.is_active}
                  onCheckedChange={(checked) => handleToggle(zone.id, checked)}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-destructive"
                  onClick={() => handleDelete(zone.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Nenhuma zona configurada</p>
          <p className="text-sm">Adicione bairros e suas taxas de entrega</p>
        </div>
      )}
    </div>
  );
}
