import { Banknote, CreditCard, Coins, AlertTriangle, Smartphone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SiPix } from "react-icons/si";
import { useEffect } from "react";

interface CartPaymentProps {
  pagamento: "pix" | "cartão" | "dinheiro" | "pix_online" | "cartao_online" | "pix_entrega" | "cartao_entrega";
  setPagamento: (value: "pix" | "cartão" | "dinheiro" | "pix_online" | "cartao_online" | "pix_entrega" | "cartao_entrega") => void;
  pagamentoTipo: "online" | "entrega";
  setPagamentoTipo: (value: "online" | "entrega") => void;
  trocoPara: string;
  setTrocoPara: (value: string) => void;
  totalFinal: number;
  hasMercadoPago?: boolean;
  acceptsOnlinePayment?: boolean;
  acceptsCashOnDelivery?: boolean;
}

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(",", ".")) || 0;
};

export function CartPayment({ 
  pagamento, 
  setPagamento, 
  pagamentoTipo,
  setPagamentoTipo,
  trocoPara, 
  setTrocoPara, 
  totalFinal,
  hasMercadoPago = false,
  acceptsOnlinePayment = true,
  acceptsCashOnDelivery = true
}: CartPaymentProps) {
  
  useEffect(() => {
    if (!hasMercadoPago && pagamentoTipo === "online") {
      setPagamentoTipo("entrega");
    }
  }, [hasMercadoPago, pagamentoTipo, setPagamentoTipo]);

  useEffect(() => {
    if (pagamentoTipo === "online" && hasMercadoPago) {
      if (pagamento !== "pix_online" && pagamento !== "cartao_online") {
        setPagamento("pix_online");
      }
    } else {
      // Quando muda para "entrega" - só converte online → entrega, mantém dinheiro
      if (pagamento === "pix_online") {
        setPagamento("pix_entrega");
      } else if (pagamento === "cartao_online") {
        setPagamento("cartao_entrega");
      }
      // Remove force de "pix_entrega" - dinheiro fica livre!
    }
  }, [pagamentoTipo, hasMercadoPago]);

  const paymentOptions = [];

  if (pagamentoTipo === "online" && hasMercadoPago) {
    paymentOptions.push(
      { id: "pix_online", label: "Pix", icon: SiPix, color: "text-emerald-600" },
      { id: "cartao_online", label: "Cartão", icon: CreditCard, color: "text-yellow-500" }
    );
  } else if (pagamentoTipo === "entrega") {
    paymentOptions.push(
      { id: "pix_entrega", label: "Pix", icon: SiPix, color: "text-emerald-600" },
      { id: "cartao_entrega", label: "Cartão", icon: CreditCard, color: "text-yellow-500" },
      { id: "dinheiro", label: "Dinheiro", icon: Coins, color: "text-emerald-500" }
    );
  }

  const hasPaymentOptions = paymentOptions.length > 0;
  useEffect(() => {
    if (!hasPaymentOptions && pagamento !== "dinheiro") {
      setPagamento("dinheiro");
    }
  }, [hasPaymentOptions, pagamento, setPagamento]);

  return (
    <div className="relative p-5 space-y-4 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden transition-all hover:bg-white/70">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

      <Label className="relative text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
        <Banknote className="h-3.5 w-3.5" />
        Forma de Pagamento
      </Label>

      {acceptsOnlinePayment && acceptsCashOnDelivery && hasMercadoPago && (
        <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div 
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
              pagamentoTipo === "online" 
                ? "bg-emerald-100 border-2 border-emerald-500 text-emerald-700" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            onClick={() => setPagamentoTipo("online")}
          >
            <Smartphone className="h-4 w-4" />
            <span className="text-xs font-bold">Pagamento Online</span>
          </div>
          <div 
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
              pagamentoTipo === "entrega" 
                ? "bg-blue-100 border-2 border-blue-500 text-blue-700" 
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
            onClick={() => setPagamentoTipo("entrega")}
          >
            <Coins className="h-4 w-4" />
            <span className="text-xs font-bold">Pagar na Entrega</span>
          </div>
        </div>
      )}

      {!hasMercadoPago || !acceptsOnlinePayment ? (
        <div className="relative flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200/50 mt-1 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
            <b>A loja optou por nao receber pagamentos onlines.</b>
          </p>
        </div>
      ) : null}

      <div className="relative grid grid-cols-3 gap-3">
        {paymentOptions.map((option) => {
          const isSelected = pagamento === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setPagamento(option.id as any)}
              className={`relative overflow-hidden p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200 group border ${
                isSelected
                  ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]"
                  : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <option.icon className={`h-5 w-5 drop-shadow-sm transition-colors ${
                isSelected ? "text-white" : option.color
              }`} />
              
              <span className="text-[9px] font-black uppercase tracking-wider">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {(pagamento === "dinheiro" || pagamento === "pix_entrega" || pagamento === "cartao_entrega") && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 pt-1">
          {pagamento === "dinheiro" && (
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-700 font-bold ml-1">
                Troco para quanto?
              </Label>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold group-focus-within:text-slate-900 transition-colors">
                  R$
                </span>
                <Input
                  placeholder="0,00"
                  value={trocoPara}
                  onChange={(e) => setTrocoPara(e.target.value)}
                  className="pl-9 bg-white border-slate-200 h-11 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400 rounded-xl"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                />
              </div>

              {trocoPara && parseCurrency(trocoPara) > totalFinal ? (
                <div className="flex justify-between items-center bg-slate-100 p-4 rounded-xl border border-slate-200 animate-in zoom-in-95">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Coins className="h-4 w-4 text-slate-400" />
                    Seu troco:
                  </span>
                  <span className="text-lg font-black text-slate-900">
                    R$ {(parseCurrency(trocoPara) - totalFinal).toFixed(2)}
                  </span>
                </div>
              ) : null}

              {trocoPara && parseCurrency(trocoPara) > 0 && parseCurrency(trocoPara) < totalFinal && (
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-center animate-in fade-in">
                  <p className="text-[10px] text-slate-400 font-medium">
                    Valor menor que o total (R$ {totalFinal.toFixed(2)})
                  </p>
                </div>
              )}
            </div>
          )}
          
          {(pagamento === "pix_entrega" || pagamento === "cartao_entrega") && (
            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 animate-in fade-in">
              <p className="text-xs text-blue-700 font-medium">
                Pagamento será recebido no momento da entrega.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

