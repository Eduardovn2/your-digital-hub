import { Banknote, CreditCard, Coins, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SiPix } from "react-icons/si"; // <-- Adicionámos o ícone do PIX aqui

interface CartPaymentProps {
  pagamento: "pix" | "cartão" | "dinheiro";
  setPagamento: (value: "pix" | "cartão" | "dinheiro") => void;
  trocoPara: string;
  setTrocoPara: (value: string) => void;
  totalFinal: number;
}

const parseCurrency = (value: string) => {
  if (!value) return 0;
  return parseFloat(value.replace(",", ".")) || 0;
};

export function CartPayment({ 
  pagamento, 
  setPagamento, 
  trocoPara, 
  setTrocoPara, 
  totalFinal 
}: CartPaymentProps) {
  
  return (
    <div className="relative p-5 space-y-4 rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md shadow-sm overflow-hidden transition-all hover:bg-white/70">
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

      <Label className="relative text-[11px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
        <Banknote className="h-3.5 w-3.5" />
        Forma de Pagamento
      </Label>

      <div className="relative grid grid-cols-3 gap-3">
        {["pix", "cartão", "dinheiro"].map((m) => (
          <button
            key={m}
            onClick={() => setPagamento(m as any)}
            className={`relative overflow-hidden p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all duration-200 group border ${
              pagamento === m
                ? "bg-slate-900 border-slate-900 text-white shadow-lg scale-[1.02]"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
            }`}
          >
            {/* Ícones com cores condicionais (Coloridos se inativos, Brancos se ativos) */}
            {m === "pix" && <SiPix className={`h-5 w-5 drop-shadow-sm transition-colors ${pagamento === m ? "text-white" : "text-emerald-600"}`} />}
            {m === "cartão" && <CreditCard className={`h-5 w-5 drop-shadow-sm transition-colors ${pagamento === m ? "text-white" : "text-yellow-500"}`} />}
            {m === "dinheiro" && <Coins className={`h-5 w-5 drop-shadow-sm transition-colors ${pagamento === m ? "text-white" : "text-emerald-500"}`} />}
            
            <span className="text-[9px] font-black uppercase tracking-wider">
              {m === "dinheiro" ? "Dinheiro" : m === "cartão" ? "Cartão" : "Pix"}
            </span>
          </button>
        ))}
      </div>

      {/* Seção de Troco */}
      {pagamento === "dinheiro" && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-300 space-y-3 pt-1">
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
                className="pl-9 bg-white border-slate-200 h-11 text-sm font-bold text-slate-900 focus:bg-white focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400 rounded-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                type="number"
                inputMode="decimal"
                step="0.01"
              />
            </div>
          </div>

          {/* BOX RESULTADO */}
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
    </div>
  );
}