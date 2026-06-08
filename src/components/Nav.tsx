"use client";

import Link from "next/link";
import { Trophy, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

interface NavProps {
  leagueName?: string;
  leagueId?: string;
}

export function Nav({ leagueName, leagueId }: NavProps) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" });
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // Session cookie cleared — client sign-out optional
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-pitch-900/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={leagueId ? `/league/${leagueId}` : "/dashboard"} className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-gold-400" />
          <span className="font-bold">
            {leagueName ? leagueName : "World Cup Predictions"}
          </span>
        </Link>

        {leagueId && (
          <nav className="hidden gap-4 text-sm md:flex">
            <Link href={`/league/${leagueId}`} className="hover:text-gold-400">
              Matches
            </Link>
            <Link href={`/league/${leagueId}/leaderboard`} className="hover:text-gold-400">
              Leaderboard
            </Link>
            <Link href={`/league/${leagueId}/top-three`} className="hover:text-gold-400">
              Top 3
            </Link>
            <Link href={`/league/${leagueId}/bracket`} className="hover:text-gold-400">
              Bracket
            </Link>
            <Link href={`/league/${leagueId}/badges`} className="hover:text-gold-400">
              Badges
            </Link>
          </nav>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1 text-sm text-white/70 hover:text-white"
          type="button"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
