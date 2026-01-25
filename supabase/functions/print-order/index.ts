import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  created_at: string;
  items: OrderItem[];
}

interface PrinterSettings {
  printer_ip: string;
  printer_port: number;
  paper_width: number;
  is_enabled: boolean;
}

// ESC/POS commands
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const CUT = GS + 'V' + '\x00';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_LEFT = ESC + 'a' + '\x00';
const DOUBLE_HEIGHT = GS + '!' + '\x10';
const NORMAL_SIZE = GS + '!' + '\x00';
const LINE = '--------------------------------';

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function buildReceipt(order: Order, storeName: string): string {
  let receipt = '';
  
  // Initialize printer
  receipt += INIT;
  
  // Store name header
  receipt += ALIGN_CENTER;
  receipt += DOUBLE_HEIGHT;
  receipt += BOLD_ON;
  receipt += storeName + '\n';
  receipt += NORMAL_SIZE;
  receipt += BOLD_OFF;
  receipt += '\n';
  
  // Order number
  receipt += BOLD_ON;
  receipt += `PEDIDO #${order.id.slice(-6).toUpperCase()}\n`;
  receipt += BOLD_OFF;
  receipt += formatDate(order.created_at) + '\n';
  receipt += LINE + '\n';
  
  // Customer info
  receipt += ALIGN_LEFT;
  receipt += BOLD_ON;
  receipt += 'CLIENTE:\n';
  receipt += BOLD_OFF;
  receipt += order.customer_name + '\n';
  receipt += order.customer_phone + '\n';
  
  if (order.customer_address) {
    receipt += '\n' + BOLD_ON + 'ENDERECO:\n' + BOLD_OFF;
    receipt += order.customer_address + '\n';
  }
  
  receipt += LINE + '\n';
  
  // Items
  receipt += BOLD_ON + 'ITENS:\n' + BOLD_OFF;
  
  for (const item of order.items) {
    receipt += `${item.quantity}x ${item.product_name}\n`;
    receipt += `   ${formatCurrency(item.product_price)} = ${formatCurrency(item.subtotal)}\n`;
  }
  
  receipt += LINE + '\n';
  
  // Totals
  receipt += `Subtotal: ${formatCurrency(order.subtotal)}\n`;
  
  if (order.delivery_fee > 0) {
    receipt += `Taxa Entrega: ${formatCurrency(order.delivery_fee)}\n`;
  }
  
  receipt += BOLD_ON + DOUBLE_HEIGHT;
  receipt += `TOTAL: ${formatCurrency(order.total)}\n`;
  receipt += NORMAL_SIZE + BOLD_OFF;
  
  // Notes
  if (order.notes) {
    receipt += LINE + '\n';
    receipt += BOLD_ON + 'OBS:\n' + BOLD_OFF;
    receipt += order.notes + '\n';
  }
  
  receipt += '\n\n';
  receipt += ALIGN_CENTER;
  receipt += 'Obrigado pela preferencia!\n';
  receipt += '\n\n\n';
  
  // Cut paper
  receipt += CUT;
  
  return receipt;
}

async function sendToPrinter(printerIp: string, printerPort: number, data: string): Promise<boolean> {
  try {
    const conn = await Deno.connect({
      hostname: printerIp,
      port: printerPort,
    });
    
    const encoder = new TextEncoder();
    await conn.write(encoder.encode(data));
    conn.close();
    
    return true;
  } catch (error) {
    console.error('Printer connection error:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { orderId, storeId } = await req.json();
    
    if (!orderId || !storeId) {
      return new Response(
        JSON.stringify({ error: 'orderId and storeId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get printer settings
    const { data: printerSettings, error: printerError } = await supabase
      .from('printer_settings')
      .select('*')
      .eq('store_id', storeId)
      .single();
    
    if (printerError || !printerSettings) {
      return new Response(
        JSON.stringify({ error: 'Printer not configured', printed: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!printerSettings.is_enabled) {
      return new Response(
        JSON.stringify({ error: 'Printing disabled', printed: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get store name
    const { data: store } = await supabase
      .from('stores')
      .select('name')
      .eq('id', storeId)
      .single();
    
    const storeName = store?.name || 'Loja';
    
    // Build receipt
    const receipt = buildReceipt(order as Order, storeName);
    
    // Send to printer
    const printed = await sendToPrinter(
      printerSettings.printer_ip,
      printerSettings.printer_port,
      receipt
    );
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        printed,
        message: printed ? 'Pedido impresso com sucesso' : 'Falha ao conectar com a impressora'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: unknown) {
    console.error('Print order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
