import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Essa é a função que estava faltando e quebrando o Admin/Form
export function formatPhone(value: string) {
  if (!value) return "";
  
  let v = value.replace(/\D/g, "");
  
  if (v.length > 11) v = v.substring(0, 11);

  if (v.length > 10) {
    return v.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } 
  else if (v.length > 6) {
    return v.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } 
  else if (v.length > 2) {
    return v.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
  }
  
  return v;
}