import { Order } from "@/types/store";
import React, { forwardRef } from "react";

interface Props {
  order: Order; // Agora usando seu tipo real
  paperSize: "58mm" | "80mm";
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, Props>(({ order, paperSize }, ref) => {
  if (!order) return null;

  return (
    /* Técnica de esconder sem remover do DOM para a biblioteca de print encontrar */
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        className="print-receipt"
        style={{
          width: paperSize === "58mm" ? "52mm" : "74mm", // Margem de segurança pequena
          padding: "2mm",
          fontFamily: "'Courier New', Courier, monospace", // Fonte mono é padrão em térmicas
          fontSize: "12px",
          lineHeight: "1.2",
          color: "black",
          backgroundColor: "white",
          whiteSpace: "pre-wrap"
        }}
      >
        {/* CABEÇALHO */}
        <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "10px" }}>
          <div style={{ fontSize: "16px", textTransform: "uppercase" }}>Sua Loja</div>
          <div>Pedido #{order.id?.slice(0, 4).toUpperCase()}</div>
          <div style={{ fontSize: "10px", fontWeight: "normal" }}>
            {new Date(order.created_at).toLocaleString("pt-BR")}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed black", margin: "5px 0" }} />

        {/* CLIENTE */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontWeight: "bold" }}>CLIENTE:</div>
          <div>{order.customer_name}</div>
          <div>{order.customer_phone}</div>
          <div style={{ fontSize: "11px" }}>{order.customer_address}</div>
        </div>

        <div style={{ borderTop: "1px dashed black", margin: "5px 0" }} />

        {/* ITENS */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px" }}>ITENS:</div>
          {Array.isArray(order.items) ? order.items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
              <span style={{ flex: 1 }}>{item.quantity}x {item.product_name}</span>
              <span style={{ marginLeft: "10px" }}>
                R$ {(item.product_price * item.quantity).toFixed(2)}
              </span>
            </div>
          )) : <div>Sem itens cadastrados</div>}
        </div>

        <div style={{ borderTop: "1px solid black", margin: "5px 0" }} />

        {/* TOTAIS */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}>
          <span>TOTAL:</span>
          <span>R$ {Number(order.total).toFixed(2)}</span>
        </div>

        <div style={{ marginTop: "5px", fontSize: "11px" }}>
          <div>Pagamento: <span style={{ fontWeight: "bold", textTransform: "uppercase" }}>{order.payment_method}</span></div>
          {order.change_for ? (
            <div>Troco para: R$ {Number(order.change_for).toFixed(2)}</div>
          ) : null}
          {order.delivery_fee ? (
            <div>Taxa de entrega: R$ {Number(order.delivery_fee).toFixed(2)}</div>
          ) : null}
        </div>

        <div style={{ textAlign: "center", marginTop: "15px", fontSize: "10px" }}>
          <div>--- FIM DO PEDIDO ---</div>
          <div>Obrigado pela preferência!</div>
        </div>
        
        {/* Espaço extra no final para a guilhotina da impressora não cortar o texto */}
        <div style={{ height: "10mm" }} />
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = "ReceiptTemplate";