import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// ✅ Utilidad para clases Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


