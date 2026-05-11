import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ro-RO", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("ro-RO", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

export const MOOD_EMOJIS = ["😢", "😔", "😕", "😐", "🙂", "😊", "😄", "😁", "🤩", "🥳"];


export function getMoodLabel(score: number): string {
  const labels = ["Foarte rău", "Rău", "Nu prea bine", "Mediu", "Ok", "Bine", "Destul de bine", "Bine rău", "Foarte bine", "Excelent"];
  return labels[score - 1] || "Necunoscut";
}

export function getMoodColor(score: number): string {
  if (score <= 3) return "#ef4444";
  if (score <= 5) return "#f59e0b";
  if (score <= 7) return "#38bdf8";
  return "#4ade80";
}

export function getSentimentConfig(sentiment: string) {
  switch (sentiment) {
    case "pozitiv":
      return { color: "#4ade80", label: "Pozitiv", glow: "0 0 20px rgba(74,222,128,0.4)" };
    case "negativ":
      return { color: "#f87171", label: "Negativ", glow: "0 0 20px rgba(248,113,113,0.4)" };
    default:
      return { color: "#a78bfa", label: "Neutru", glow: "0 0 20px rgba(167,139,250,0.4)" };
  }
}
