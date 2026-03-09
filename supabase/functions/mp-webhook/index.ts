import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // MercadoPago envia GET para validar a URL e POST com notificações
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Responde 200 imediatamente para o MP não reenviar (requisito da API deles)
  // O processamento acontece de forma assíncrona
  const responsePromise = processWebhook(req);

  // Aguarda o processamento mas já retorna 200 para o MP
  responsePromise.catch(err => console.error('Erro no webhook MP:', err));

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function processWebhook(req: Request) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // O MP envia a notificação de duas formas:
  // 1. Query params: ?id=XXX&topic=payment  (IPN antigo)
  // 2. Body JSON: { type: "payment", data: { id: "XXX" } }  (Webhooks novo)
  const url = new URL(req.url);
  const topicParam = url.searchParams.get('topic');
  const idParam = url.searchParams.get('id');

  let paymentId: string | null = null;
  let notificationType: string | null = null;

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      console.log('Webhook MP recebido:', JSON.stringify(body));

      // Formato novo (Webhooks)
      if (body.type === 'payment') {
        notificationType = 'payment';
        paymentId = String(body.data?.id);
      }
      // Formato antigo (IPN)
      else if (topicParam === 'payment' && idParam) {
        notificationType = 'payment';
        paymentId = idParam;
      }
      // merchant_order (Checkout Pro)
      else if (body.type === 'merchant_order' || topicParam === 'merchant_order') {
        notificationType = 'merchant_order';
        paymentId = String(body.data?.id || idParam);
      }
    } catch {
      // Body pode ser vazio em algumas notificações
      if (topicParam === 'payment' && idParam) {
        notificationType = 'payment';
        paymentId = idParam;
      }
    }
  }

  if (!paymentId || !notificationType) {
    console.log('Webhook ignorado: sem paymentId ou tipo desconhecido');
    return;
  }

  console.log(`Processando notificação: tipo=${notificationType}, id=${paymentId}`);

  // Para merchant_order, precisamos buscar os pagamentos associados
  if (notificationType === 'merchant_order') {
    await processMerchantOrder(supabase, paymentId);
    return;
  }

  // Para payment, processa diretamente
  await processPaymentNotification(supabase, paymentId);
}

async function processPaymentNotification(supabase: any, paymentId: string) {
  // 1. Busca o pedido pelo mp_payment_id para obter o access_token da loja
  const { data: order } = await supabase
    .from('orders')
    .select('id, store_id, status, total, customer_name')
    .eq('mp_payment_id', paymentId)
    .single();

  if (!order) {
    console.log(`Pedido com mp_payment_id=${paymentId} não encontrado. Tentando via external_reference...`);
    // Fallback: busca via external_reference na API do MP
    await processViaExternalReference(supabase, paymentId);
    return;
  }

  // 2. Busca o access_token da loja
  const { data: store } = await supabase
    .from('stores')
    .select('mp_access_token')
    .eq('id', order.store_id)
    .single();

  if (!store?.mp_access_token) {
    console.error(`Loja ${order.store_id} sem mp_access_token`);
    return;
  }

  // 3. Consulta o status real do pagamento na API do MP
  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${store.mp_access_token}` },
  });

  if (!mpResponse.ok) {
    console.error(`Erro ao consultar pagamento ${paymentId} no MP:`, await mpResponse.text());
    return;
  }

  const payment = await mpResponse.json();
  console.log(`Status do pagamento ${paymentId}: ${payment.status}`);

  await updateOrderFromPayment(supabase, order.id, payment, order.status);
}

async function processViaExternalReference(supabase: any, paymentId: string) {
  // Precisamos de algum access_token para consultar o MP
  // Buscamos todas as lojas com token e tentamos encontrar o pagamento
  const { data: stores } = await supabase
    .from('stores')
    .select('id, mp_access_token')
    .not('mp_access_token', 'is', null);

  if (!stores?.length) return;

  for (const store of stores) {
    try {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${store.mp_access_token}` },
      });

      if (!mpResponse.ok) continue;

      const payment = await mpResponse.json();

      if (!payment.external_reference) continue;

      const orderId = payment.external_reference;

      // Verifica se o pedido pertence a esta loja
      const { data: order } = await supabase
        .from('orders')
        .select('id, store_id, status')
        .eq('id', orderId)
        .eq('store_id', store.id)
        .single();

      if (!order) continue;

      // Salva o mp_payment_id para futuras consultas
      await supabase
        .from('orders')
        .update({ mp_payment_id: String(payment.id) })
        .eq('id', orderId);

      await updateOrderFromPayment(supabase, orderId, payment, order.status);
      return;
    } catch (e) {
      console.error(`Erro ao consultar MP com token da loja ${store.id}:`, e);
    }
  }
}

async function processMerchantOrder(supabase: any, merchantOrderId: string) {
  // Para Checkout Pro, a notificação vem como merchant_order
  // Precisamos buscar os pagamentos dentro da merchant_order
  const { data: stores } = await supabase
    .from('stores')
    .select('id, mp_access_token')
    .not('mp_access_token', 'is', null);

  if (!stores?.length) return;

  for (const store of stores) {
    try {
      const mpResponse = await fetch(`https://api.mercadopago.com/merchant_orders/${merchantOrderId}`, {
        headers: { 'Authorization': `Bearer ${store.mp_access_token}` },
      });

      if (!mpResponse.ok) continue;

      const merchantOrder = await mpResponse.json();

      if (!merchantOrder.external_reference) continue;

      const orderId = merchantOrder.external_reference;

      const { data: order } = await supabase
        .from('orders')
        .select('id, store_id, status')
        .eq('id', orderId)
        .eq('store_id', store.id)
        .single();

      if (!order) continue;

      // Verifica se algum pagamento foi aprovado
      const payments = merchantOrder.payments || [];
      const approvedPayment = payments.find((p: any) => p.status === 'approved');
      const pendingPayment = payments.find((p: any) => p.status === 'pending');

      if (approvedPayment) {
        await supabase
          .from('orders')
          .update({
            mp_payment_id: String(approvedPayment.id),
            status: 'paid',
          })
          .eq('id', orderId);

        console.log(`✅ Pedido ${orderId} marcado como PAGO via merchant_order`);
      } else if (pendingPayment) {
        console.log(`⏳ Pedido ${orderId} com pagamento pendente`);
      }

      return;
    } catch (e) {
      console.error(`Erro ao processar merchant_order ${merchantOrderId}:`, e);
    }
  }
}

async function updateOrderFromPayment(
  supabase: any,
  orderId: string,
  payment: any,
  currentStatus: string
) {
  const mpStatus = payment.status;
  const mpStatusDetail = payment.status_detail;

  console.log(`Atualizando pedido ${orderId}: MP status=${mpStatus} (${mpStatusDetail})`);

  // Mapeamento de status do MP para status da aplicação
  let newStatus: string | null = null;

  if (mpStatus === 'approved') {
    // Só atualiza se ainda estiver pendente (evita regressão de status)
    if (['pending', 'confirmed'].includes(currentStatus)) {
      newStatus = 'paid';
    }
  } else if (mpStatus === 'pending' || mpStatus === 'in_process') {
    // Mantém como pending — aguardando compensação bancária
    console.log(`Pagamento ${payment.id} ainda pendente/em processamento`);
  } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
    if (currentStatus === 'pending') {
      newStatus = 'cancelled';
    }
  } else if (mpStatus === 'refunded' || mpStatus === 'charged_back') {
    newStatus = 'cancelled';
  }

  if (!newStatus) {
    console.log(`Nenhuma atualização necessária para pedido ${orderId} (MP: ${mpStatus})`);
    return;
  }

  const updatePayload: any = { status: newStatus };

  // Se aprovado, registra nas notas para rastreabilidade
  if (newStatus === 'paid') {
    updatePayload.notes = `Pagamento aprovado via Mercado Pago. ID: ${payment.id}. Método: ${payment.payment_type_id || 'online'}.`;
  }

  const { error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId);

  if (error) {
    console.error(`Erro ao atualizar pedido ${orderId}:`, error);
    return;
  }

  console.log(`✅ Pedido ${orderId} atualizado para status: ${newStatus}`);
}
