import { Order } from "@/types/store";
import React, { forwardRef } from "react";

interface Props {
  order: Order; 
  paperSize: "58mm" | "80mm";
  storeName?: string; 
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, Props>(({ order, paperSize, storeName }, ref) => {
  if (!order) return null;

  return (
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      {/* MÁGICA DE IMPRESSÃO TÉRMICA: 
        Força o navegador a usar o papel em rolo (auto altura) e remove quebras de página
      */}
      <style>
        {`
          @media print {
            @page {
              margin: 0;
              size: ${paperSize === "58mm" ? "58mm" : "80mm"} auto;
            }
            body, html {
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              overflow: visible !important;
            }
          }
        `}
      </style>

      <div
        ref={ref}
        className="print-receipt"
        style={{
          width: "100%",
          minWidth: paperSize === "58mm" ? "200px" : "280px", 
          margin: "0 auto",
          padding: "0", 
          boxSizing: "border-box",
          fontFamily: "'Courier New', Courier, monospace", 
          fontSize: paperSize === "58mm" ? "12px" : "14px",
          lineHeight: "1.2",
          color: "black",
          backgroundColor: "white",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          overflow: "visible", // Garante que nada fique escondido
          height: "auto"       // Força a altura dinâmica
        }}
      >
        {/* CABEÇALHO */}
        <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "10px" }}>
          <div style={{ fontSize: paperSize === "58mm" ? "18px" : "20px", textTransform: "uppercase" }}>
            {storeName || "PEDIDO DELIVERY"}
          </div>
          <div style={{ marginTop: "4px", fontSize: "14px" }}>Pedido #{order.id?.slice(0, 6).toUpperCase()}</div>
          <div style={{ fontSize: "11px", fontWeight: "normal" }}>
            {new Date(order.created_at).toLocaleString("pt-BR")}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed black", margin: "5px 0" }} />

        {/* DADOS DO CLIENTE PARA O MOTOBOY */}
        <div style={{ marginBottom: "10px", marginTop: "5px" }}>
          <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "4px", fontSize: "13px", borderBottom: "1px solid black", display: "inline-block", width: "100%" }}>
            DADOS DE ENTREGA
          </div>
          <div style={{ fontWeight: "bold", fontSize: "14px", marginTop: "4px" }}>
            👤 {order.customer_name}
          </div>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>
            📞 {order.customer_phone}
          </div>
          <div style={{ fontSize: "13px", marginTop: "4px", fontWeight: "bold", padding: "4px 2px", border: "1px solid black", borderRadius: "2px" }}>
            📍 {order.customer_address}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed black", margin: "5px 0" }} />

        {/* ITENS DO PEDIDO PARA A COZINHA */}
        <div style={{ marginBottom: "10px", marginTop: "5px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px", fontSize: "13px" }}>ITENS DO PEDIDO:</div>
          
          {Array.isArray(order.items) ? order.items.map((item, i) => {
            let itemName = item.product_name;
            let itemObs = "";
            
            if (itemName.includes("(")) {
              const parts = itemName.split("(");
              itemName = parts[0].trim();
              itemObs = parts[1].replace(")", "").trim(); 
            }

            return (
              <div key={i} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px" }}>
                  <span style={{ flex: 1, paddingRight: "5px" }}>{item.quantity}x {itemName}</span>
                  <span>R$ {(item.product_price * item.quantity).toFixed(2)}</span>
                </div>
                {itemObs && (
                  <div style={{ fontSize: "12px", marginLeft: "10px", fontStyle: "italic", fontWeight: "bold" }}>
                    ↳ {itemObs}
                  </div>
                )}
              </div>
            );
          }) : <div>Sem itens cadastrados</div>}
        </div>

        <div style={{ borderTop: "2px solid black", margin: "5px 0" }} />

        {/* TOTAIS E PAGAMENTO */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "black", fontSize: "15px", marginTop: "5px" }}>
          <span>TOTAL:</span>
          <span>R$ {Number(order.total).toFixed(2)}</span>
        </div>

        <div style={{ marginTop: "8px", fontSize: "13px" }}>
          <div>Pagar com: <span style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "14px" }}>{order.payment_method === 'dinheiro' ? 'DINHEIRO' : order.payment_method === 'pix' ? 'PIX' : 'CARTÃO'}</span></div>
          
          {order.change_for ? (
            <div style={{ fontWeight: "bold", marginTop: "4px", border: "1px dashed black", padding: "4px", display: "inline-block", width: "100%", textAlign: "center" }}>
              Troco para: R$ {Number(order.change_for).toFixed(2)}
            </div>
          ) : null}
          
          {order.delivery_fee ? (
            <div style={{ marginTop: "4px" }}>Taxa de entrega: R$ {Number(order.delivery_fee).toFixed(2)}</div>
          ) : null}
        </div>

        <div style={{ textAlign: "center", marginTop: "15px", fontSize: "11px" }}>
          <div style={{ fontWeight: "bold" }}>*** FIM DO PEDIDO ***</div>
          <div style={{ marginTop: "2px" }}>Obrigado pela preferência!</div>
        </div>
        
        {/* Espaço extra GRANDE no final para a guilhotina da impressora cortar no lugar certo (em branco) */}
        <div style={{ height: "35mm" }} />
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = "ReceiptTemplate";