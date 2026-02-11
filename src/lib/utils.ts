import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 👇 ADICIONE ESSA FUNÇÃO NOVA
export function formatPhone(value: string) {
  if (!value) return "";
  
  // Remove tudo que não é dígito
  let v = value.replace(/\D/g, "");
  
  // Limita a 11 dígitos
  if (v.length > 11) v = v.substring(0, 11);

  // Aplica a máscara (XX) 9XXXX-XXXX
  if (v.length > 10) {
    return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } 
  // Máscara parcial enquanto digita
  else if (v.length > 6) {
    return v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } 
  else if (v.length > 2) {
    return v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  }
  
  return v;
}