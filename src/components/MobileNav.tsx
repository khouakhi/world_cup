"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, Trophy, Crown, Award, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({ leagueId }: { leagueId: string }) {
  const pathname = usePathname();

  const links = [
    { href: `/league/${leagueId}`, label: "Matches", icon: Calendar },
    { href: `/league/${leagueId}/leaderboard`, label: "Table", icon: Trophy },
    { href: `/league/${leagueId}/top-three`, label: "Top 3", icon: Medal },
    { href: `/league/${leagueId}/bracket`, label: "Bracket", icon: Crown },
    { href: `/league/${leagueId}/badges`, label: "Badges", icon: Award },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-pitch-900/95 backdrop-blur-lg md:hidden">
      <div className="flex justify-around py-2">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
              pathname === href ? "text-gold-400" : "text-white/60"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
