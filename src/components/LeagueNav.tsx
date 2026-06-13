"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Trophy, Crown, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export const LEAGUE_NAV_LINKS = [
  { suffix: "", label: "Get Your Picks In", shortLabel: "Picks", icon: Calendar },
  { suffix: "/leaderboard", label: "League Table", shortLabel: "Table", icon: Trophy },
  { suffix: "/bracket", label: "Knockout Guess", shortLabel: "Bracket", icon: Crown },
  { suffix: "/badges", label: "Honours", shortLabel: "Honours", icon: Award },
] as const;

function leagueHref(leagueId: string, suffix: string) {
  return `/league/${leagueId}${suffix}`;
}

function isLinkActive(pathname: string, leagueId: string, suffix: string) {
  const href = leagueHref(leagueId, suffix);
  if (suffix === "") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function LeagueNavDesktop({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1 md:flex"
      aria-label="League sections"
    >
      {LEAGUE_NAV_LINKS.map(({ suffix, label, icon: Icon }) => {
        const href = leagueHref(leagueId, suffix);
        const active = isLinkActive(pathname, leagueId, suffix);

        return (
          <Link
            key={suffix}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
              active
                ? "bg-gold-500 text-pitch-900 shadow-sm"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function LeagueNavMobile({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();

  return (
    <nav
      className="border-t border-white/10 bg-[#0f172a]/95 md:hidden"
      aria-label="League sections"
    >
      <div className="mx-auto flex max-w-5xl justify-around px-1 py-1">
        {LEAGUE_NAV_LINKS.map(({ suffix, label, shortLabel, icon: Icon }) => {
          const href = leagueHref(leagueId, suffix);
          const active = isLinkActive(pathname, leagueId, suffix);

          return (
            <Link
              key={suffix}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 transition",
                active ? "text-gold-400" : "text-white/50 hover:text-white/80"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition",
                  active ? "bg-gold-500/15 ring-1 ring-gold-400/30" : "bg-transparent"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-medium leading-none">
                {shortLabel ?? label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
