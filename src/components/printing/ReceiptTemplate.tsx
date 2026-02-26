import { Order } from "@/types/store";
import React, { forwardRef } from "react";

interface Props {
  order: Order; 
  paperSize: "58mm" | "80mm";
  storeName?: string; // Adicionamos o nome da loja dinâmico
}

export const ReceiptTemplate = forwardRef<HTMLDivElement, Props>(({ order, paperSize, storeName }, ref) => {
  if (!order) return null;

  return (
    /* Técnica de esconder sem remover do DOM para a biblioteca de print encontrar */
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        className="print-receipt"
        style={{
          width: paperSize === "58mm" ? "52mm" : "74mm", // Margem de segurança
          padding: "2mm",
          fontFamily: "'Courier New', Courier, monospace", // Fonte mono é padrão em térmicas
          fontSize: paperSize === "58mm" ? "11px" : "12px", // Letra ligeiramente ajustada para 58mm
          lineHeight: "1.2",
          color: "black",
          backgroundColor: "white",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word" // Evita que endereços longos cortem no papel
        }}
      >
        {/* CABEÇALHO */}
        <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "10px" }}>
          <div style={{ fontSize: "16px", textTransform: "uppercase" }}>
            {storeName || "PEDIDO DELIVERY"}
          </div>
          <div style={{ marginTop: "4px" }}>Pedido #{order.id?.slice(0, 6).toUpperCase()}</div>
          <div style={{ fontSize: "10px", fontWeight: "normal" }}>
            {new Date(order.created_at).toLocaleString("pt-BR")}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed black", margin: "5px 0" }} />

        {/* DADOS DO CLIENTE PARA O MOTOBOY */}
        <div style={{ marginBottom: "10px", marginTop: "5px" }}>
          <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "4px", fontSize: "12px", borderBottom: "1px solid black", display: "inline-block" }}>
            DADOS DE ENTREGA
          </div>
          <div style={{ fontWeight: "bold", fontSize: "13px", marginTop: "4px" }}>
            👤 {order.customer_name}
          </div>
          <div style={{ fontSize: "12px" }}>
            📞 {order.customer_phone}
          </div>
          <div style={{ fontSize: "12px", marginTop: "4px", fontWeight: "bold", padding: "2px", border: "1px solid #ccc", borderRadius: "2px" }}>
            📍 {order.customer_address}
          </div>
        </div>

        <div style={{ borderTop: "1px dashed black", margin: "5px 0" }} />

        {/* ITENS DO PEDIDO PARA A COZINHA */}
        <div style={{ marginBottom: "10px", marginTop: "5px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "5px", fontSize: "12px" }}>ITENS DO PEDIDO:</div>
          
          {Array.isArray(order.items) ? order.items.map((item, i) => {
            // Inteligência para separar o nome do produto dos complementos
            // Lê "Pastel Especial (Com: Bacon, Queijo)" e quebra as linhas
            let itemName = item.product_name;
            let itemObs = "";
            
            if (itemName.includes("(")) {
              const parts = itemName.split("(");
              itemName = parts[0].trim();
              itemObs = parts[1].replace(")", "").trim(); // Remove o parêntese final
            }

            return (
              <div key={i} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "12px" }}>
                  <span style={{ flex: 1, paddingRight: "5px" }}>{item.quantity}x {itemName}</span>
                  <span>R$ {(item.product_price * item.quantity).toFixed(2)}</span>
                </div>
                {/* IMPRIME OS COMPLEMENTOS SE EXISTIREM */}
                {itemObs && (
                  <div style={{ fontSize: "11px", marginLeft: "15px", fontStyle: "italic", fontWeight: "bold" }}>
                    ↳ {itemObs}
                  </div>
                )}
              </div>
            );
          }) : <div>Sem itens cadastrados</div>}
        </div>

        <div style={{ borderTop: "2px solid black", margin: "5px 0" }} />

        {/* TOTAIS E PAGAMENTO */}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginTop: "5px" }}>
          <span>TOTAL:</span>
          <span>R$ {Number(order.total).toFixed(2)}</span>
        </div>

        <div style={{ marginTop: "8px", fontSize: "12px" }}>
          <div>Pagar com: <span style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "13px" }}>{order.payment_method === 'dinheiro' ? 'DINHEIRO' : order.payment_method === 'pix' ? 'PIX' : 'CARTÃO'}</span></div>
          
          {order.change_for ? (
            <div style={{ fontWeight: "bold", marginTop: "2px", border: "1px dashed black", padding: "2px", display: "inline-block" }}>
              Troco para: R$ {Number(order.change_for).toFixed(2)}
            </div>
          ) : null}
          
          {order.delivery_fee ? (
            <div style={{ marginTop: "2px" }}>Taxa de entrega: R$ {Number(order.delivery_fee).toFixed(2)}</div>
          ) : null}
        </div>

        <div style={{ textAlign: "center", marginTop: "15px", fontSize: "10px" }}>
          <div style={{ fontWeight: "bold" }}>*** FIM DO PEDIDO ***</div>
          <div style={{ marginTop: "2px" }}>Obrigado pela preferência!</div>
        </div>
        
        {/* Espaço extra no final para a guilhotina da impressora não cortar o texto */}
        <div style={{ height: "15mm" }} />
      </div>
    </div>
  );
});

ReceiptTemplate.displayName = "ReceiptTemplate";