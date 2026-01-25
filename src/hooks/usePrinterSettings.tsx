import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PrinterSettings, PrinterSettingsInsert, PrinterSettingsUpdate } from "@/types/store";
import { toast } from "sonner";

export function usePrinterSettings(storeId: string | undefined) {
  return useQuery({
    queryKey: ["printer-settings", storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from("printer_settings")
        .select("*")
        .eq("store_id", storeId)
        .maybeSingle();

      if (error) throw error;
      return data as PrinterSettings | null;
    },
    enabled: !!storeId,
  });
}

export function useUpsertPrinterSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeId, settings }: { storeId: string; settings: Partial<PrinterSettingsInsert> }) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("printer_settings")
        .select("id")
        .eq("store_id", storeId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("printer_settings")
          .update(settings)
          .eq("store_id", storeId)
          .select()
          .single();

        if (error) throw error;
        return data as PrinterSettings;
      } else {
        const insertData: PrinterSettingsInsert = {
          store_id: storeId,
          printer_ip: settings.printer_ip || "",
          printer_port: settings.printer_port || 9100,
          is_enabled: settings.is_enabled ?? true,
          paper_width: settings.paper_width || 80,
        };

        const { data, error } = await supabase
          .from("printer_settings")
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        return data as PrinterSettings;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["printer-settings", data.store_id] });
      toast.success("Configurações da impressora salvas!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });
}
