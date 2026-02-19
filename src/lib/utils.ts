import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatED(value: number) {
  return `ED$ ${formatNumber(value)}`;
}

export function formatCompactNumber(value: number) {
  if (value < 1000000) return formatNumber(value);
  return new Intl.NumberFormat('pt-BR', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export const LEVELS = [
  { min: 0, name: "Iniciante", color: "text-blue-400" },
  { min: 100, name: "Aprendiz", color: "text-cyan-400" },
  { min: 300, name: "Investidor", color: "text-emerald-400" },
  { min: 600, name: "Estrategista", color: "text-amber-400" },
  { min: 1000, name: "Mestre das Finanças", color: "text-purple-400" },
];

export function getLevelInfo(xp: number) {
  const level = [...LEVELS].reverse().find(l => xp >= l.min) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1] || null;
  return { ...level, nextLevel };
}
