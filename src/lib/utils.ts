import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const UK_TIMEZONE = "Europe/London";

export function formatKickoff(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function formatMatchday(date: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date + (date.includes("T") ? "" : "T12:00:00Z")));
}

export function isMatchOpen(kickoffAt: string, isLocked: boolean): boolean {
  if (isLocked) return false;
  const lockTime = new Date(kickoffAt).getTime() - 15 * 60 * 1000;
  return Date.now() < lockTime;
}

export function getMatchResult(home: number, away: number): "H" | "D" | "A" {
  if (home > away) return "H";
  if (home < away) return "A";
  return "D";
}

export function isFinishedStatus(status: string): boolean {
  return ["FT", "AET", "PEN"].includes(status);
}

export function isLiveStatus(status: string): boolean {
  return ["1H", "HT", "2H", "ET", "P", "LIVE"].includes(status);
}
