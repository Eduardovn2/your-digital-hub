import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { orderId, paymentMethod, storeId } = await req.json();

    if (!orderId || !paymentMethod || !storeId) {
      return new Response(
        JSON.stringify({ error: 'orderId, paymentMethod e storeId são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Busca o pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Busca o token do Mercado Pago da loja
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('mp_access_token, mp_public_key, name, slug')
      .eq('id', storeId)
      .single();

    if (storeError || !store?.mp_access_token) {
      return new Response(
        JSON.stringify({ error: 'Loja sem integração com Mercado Pago configurada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = store.mp_access_token;
    const baseUrl = Deno.env.get('SUPABASE_URL')!.replace('/rest/v1', '');
    const webhookUrl = `${baseUrl}/functions/v1/mp-webhook`;

    // 3. Monta os itens do pedido
    const itemsArray = Array.isArray(order.items)
      ? order.items
      : (typeof order.items === 'string' ? JSON.parse(order.items) : []);

    const mpItems = itemsArray.length > 0
      ? itemsArray.map((item: any) => ({
          id: item.product_id || orderId,
          title: item.product_name || item.name || 'Item',
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.product_price || item.price) || Number(order.total),
          currency_id: 'BRL',
        }))
      : [{
          id: orderId,
          title: `Pedido #${orderId.slice(0, 6).toUpperCase()}`,
          quantity: 1,
          unit_price: Number(order.total),
          currency_id: 'BRL',
        }];

    // 4. PIX — usa Payments API
    if (paymentMethod === 'pix') {
      const pixPayload = {
        transaction_amount: Number(order.total),
        description: `Pedido #${orderId.slice(0, 6).toUpperCase()} — ${store.name}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@vianadelivery.com.br',
          first_name: order.customer_name?.split(' ')[0] || 'Cliente',
          last_name: order.customer_name?.split(' ').slice(1).join(' ') || 'Delivery',
          identification: { type: 'CPF', number: '00000000000' },
        },
        notification_url: webhookUrl,
        external_reference: orderId,
      };

      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': orderId,
        },
        body: JSON.stringify(pixPayload),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok || mpData.error) {
        console.error('Erro MP PIX:', mpData);
        return new Response(
          JSON.stringify({ error: mpData.message || 'Erro ao criar pagamento PIX no Mercado Pago' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Salva o mp_payment_id no pedido para rastreamento e estorno futuro
      await supabase
        .from('orders')
        .update({ mp_payment_id: String(mpData.id) })
        .eq('id', orderId);

      const qrCode = mpData.point_of_interaction?.transaction_data?.qr_code;
      const qrCodeBase64 = mpData.point_of_interaction?.transaction_data?.qr_code_base64;

      return new Response(
        JSON.stringify({
          payment_id: mpData.id,
          qr_code: qrCode,
          qr_code_base64: qrCodeBase64,
          status: mpData.status,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. CARTÃO — usa Checkout Pro (Preferences API)
    if (paymentMethod === 'cartão' || paymentMethod === 'card') {
      const origin = req.headers.get('origin') || `https://${store.slug}.vianadelivery.com.br`;

      const preferencePayload = {
        items: mpItems,
        payer: {
          name: order.customer_name || 'Cliente',
          phone: { area_code: order.customer_phone?.slice(0, 2) || '21', number: order.customer_phone?.slice(2) || '' },
        },
        back_urls: {
          success: `${origin}/${store.slug}?payment=success&order=${orderId}`,
          failure: `${origin}/${store.slug}?payment=failure&order=${orderId}`,
          pending: `${origin}/${store.slug}?payment=pending&order=${orderId}`,
        },
        auto_return: 'approved',
        notification_url: webhookUrl,
        external_reference: orderId,
        statement_descriptor: store.name?.slice(0, 22) || 'Delivery',
      };

      const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencePayload),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok || mpData.error) {
        console.error('Erro MP Checkout Pro:', mpData);
        return new Response(
          JSON.stringify({ error: mpData.message || 'Erro ao criar preferência de pagamento' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // ✅ SALVA mp_preference_id para webhook
      await supabase
        .from('orders')
        .update({ mp_payment_id: String(mpData.id) })
        .eq('id', orderId);

      return new Response(
        JSON.stringify({
          preference_id: mpData.id,
          init_point: mpData.init_point,
          sandbox_init_point: mpData.sandbox_init_point,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método de pagamento inválido. Use: pix ou cartão' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Erro em process-payment:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
