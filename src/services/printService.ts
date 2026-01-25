import { supabase } from "@/integrations/supabase/client";

export async function printOrder(orderId: string, storeId: string): Promise<{ printed: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('print-order', {
      body: { orderId, storeId }
    });

    if (error) {
      console.error('Print order error:', error);
      return { printed: false, message: error.message };
    }

    return {
      printed: data?.printed ?? false,
      message: data?.message ?? 'Impressão não disponível'
    };
  } catch (error) {
    console.error('Print order error:', error);
    return { printed: false, message: 'Erro ao conectar com o serviço de impressão' };
  }
}
