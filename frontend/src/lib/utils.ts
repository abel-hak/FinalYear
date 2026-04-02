import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlayerTitle(xp: number): { title: string; color: string } {
  if (xp >= 2000) return { title: "Master Architect", color: "text-rose-500 font-bold" };
  if (xp >= 1200) return { title: "Code Ninja", color: "text-violet-500 font-bold" };
  if (xp >= 800) return { title: "Bug Hunter", color: "text-amber-500 font-bold" };
  if (xp >= 500) return { title: "Syntax Sorcerer", color: "text-indigo-500 font-semibold" };
  if (xp >= 300) return { title: "Logic Ranger", color: "text-emerald-500 font-semibold" };
  if (xp >= 150) return { title: "Script Kiddie", color: "text-blue-500 font-medium" };
  if (xp >= 50) return { title: "Code Apprentice", color: "text-emerald-600 font-medium" };
  return { title: "Novice Debugger", color: "text-muted-foreground font-medium" };
}
