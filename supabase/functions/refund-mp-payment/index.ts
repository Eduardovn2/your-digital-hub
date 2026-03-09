import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// Configuração de CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Resposta JSON padronizada
function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// EDGE FUNCTION: refund-mp-payment
//
// Responsabilidade:
//   1. Recebe o orderId do pedido a ser cancelado
//   2. Busca o pedido e o mp_payment_id associado
//   3. Busca o mp_access_token da loja dona do pedido
//   4. Se houver pagamento MP registrado, solicita o estorno via API do Mercado Pago
//   5. Atualiza o status do pedido para 'cancelled' no banco
//   6. Retorna mensagem em português com o resultado
// ─────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  // Responde ao preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Inicializa cliente Supabase com service role (acesso total) ──────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[refund-mp-payment] Variáveis de ambiente não configuradas.");
      return jsonResponse(
        { error: "Configuração interna inválida. Contate o suporte." },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── 2. Valida o corpo da requisição ──────────────────────────────────────
    let body: { orderId?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse(
        { error: "Corpo da requisição inválido. Envie um JSON com { orderId }." },
        400
      );
    }

    const { orderId } = body;

    if (!orderId || typeof orderId !== "string") {
      return jsonResponse(
        { error: "O campo 'orderId' é obrigatório e deve ser uma string." },
        400
      );
    }

    // ── 3. Busca o pedido no banco ───────────────────────────────────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, store_id, status, total, payment_method, mp_payment_id, customer_name, notes")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("[refund-mp-payment] Pedido não encontrado:", orderError);
      return jsonResponse(
        { error: `Pedido #${orderId.slice(-6).toUpperCase()} não encontrado.` },
        404
      );
    }

    // ── 4. Verifica se o pedido já está cancelado ────────────────────────────
    if (order.status === "cancelled") {
      return jsonResponse(
        {
          success: true,
          refunded: false,
          message: `O pedido #${order.id.slice(-6).toUpperCase()} já estava cancelado.`,
        },
        200
      );
    }

    // ── 5. Busca o access_token do Mercado Pago da loja ──────────────────────
    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id, name, mp_access_token")
      .eq("id", order.store_id)
      .single();

    if (storeError || !store) {
      console.error("[refund-mp-payment] Loja não encontrada:", storeError);
      return jsonResponse(
        { error: "Loja associada ao pedido não encontrada." },
        404
      );
    }

    // ── 6. Cancela o pedido no banco (independente do estorno MP) ────────────
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);

    if (updateError) {
      console.error("[refund-mp-payment] Erro ao cancelar pedido no banco:", updateError);
      return jsonResponse(
        { error: "Erro ao cancelar o pedido. Tente novamente." },
        500
      );
    }

    // ── 7. Verifica se há pagamento MP para estornar ─────────────────────────
    const hasMpPayment =
      order.mp_payment_id &&
      store.mp_access_token &&
      order.payment_method !== "cash"; // Dinheiro não tem estorno digital

    if (!hasMpPayment) {
      // Sem pagamento MP registrado — apenas cancela
      const motivo = !order.mp_payment_id
        ? "Nenhum pagamento eletrônico registrado para este pedido."
        : order.payment_method === "cash"
        ? "Pagamento em dinheiro não requer estorno digital."
        : "Conta do Mercado Pago não configurada na loja.";

      console.log(
        `[refund-mp-payment] Pedido ${orderId} cancelado sem estorno MP. Motivo: ${motivo}`
      );

      return jsonResponse({
        success: true,
        refunded: false,
        message: `Pedido #${order.id.slice(-6).toUpperCase()} cancelado com sucesso. ${motivo}`,
        detail: motivo,
      });
    }

    // ── 8. Solicita o estorno via API do Mercado Pago ────────────────────────
    console.log(
      `[refund-mp-payment] Solicitando estorno MP para payment_id=${order.mp_payment_id}, valor=R$${order.total}`
    );

    const mpRefundUrl = `https://api.mercadopago.com/v1/payments/${order.mp_payment_id}/refunds`;

    const mpResponse = await fetch(mpRefundUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${store.mp_access_token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `refund-${orderId}-${Date.now()}`,
      },
      // Corpo vazio = estorno total do valor pago
      body: JSON.stringify({}),
    });

    const mpData = await mpResponse.json();

    // ── 9. Trata a resposta do Mercado Pago ──────────────────────────────────
    if (!mpResponse.ok) {
      // O estorno falhou no MP, mas o pedido já foi cancelado no banco
      const mpErrorMsg =
        mpData?.message ||
        mpData?.error ||
        `Código de erro MP: ${mpResponse.status}`;

      console.error(
        `[refund-mp-payment] Estorno MP falhou para pedido ${orderId}:`,
        mpData
      );

      return jsonResponse(
        {
          success: true, // Pedido foi cancelado no banco
          refunded: false,
          message: `Pedido #${order.id.slice(-6).toUpperCase()} cancelado, mas o estorno automático falhou.`,
          detail: `Erro do Mercado Pago: ${mpErrorMsg}. Entre em contato com o suporte para processar o reembolso manualmente.`,
          mp_error: mpData,
        },
        200 // 200 pois o cancelamento no banco foi bem-sucedido
      );
    }

    // ── 10. Estorno aprovado — registra o ID do estorno no pedido ────────────
    const refundId = mpData?.id ?? null;

    if (refundId) {
      // Salva o ID do estorno para rastreabilidade (coluna mp_refund_id opcional)
      await supabase
        .from("orders")
        .update({ notes: `[ESTORNO MP #${refundId}] ${order.notes ?? ""}`.trim() })
        .eq("id", orderId);
    }

    console.log(
      `[refund-mp-payment] ✅ Estorno aprovado para pedido ${orderId}. Refund ID: ${refundId}`
    );

    // ── 11. Retorna sucesso com mensagem em português ─────────────────────────
    return jsonResponse({
      success: true,
      refunded: true,
      refund_id: refundId,
      message: `✅ Pedido #${order.id.slice(-6).toUpperCase()} cancelado e reembolso de R$ ${order.total.toFixed(2).replace(".", ",")} processado com sucesso!`,
      detail: `O valor de R$ ${order.total.toFixed(2).replace(".", ",")} será devolvido para ${order.customer_name} em até 10 dias úteis, conforme as políticas do Mercado Pago.`,
      mp_refund: mpData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro interno desconhecido.";
    console.error("[refund-mp-payment] Erro não tratado:", err);

    return jsonResponse(
      {
        error: "Ocorreu um erro inesperado ao processar o cancelamento.",
        detail: message,
      },
      500
    );
  }
});
