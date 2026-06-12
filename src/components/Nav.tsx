"use client";

import Link from "next/link";
import { Trophy, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { LeagueNavDesktop, LeagueNavMobile } from "@/components/LeagueNav";

interface NavProps {
  leagueName?: string;
  leagueId?: string;
}

export function Nav({ leagueName, leagueId }: NavProps) {
  const router = useRouter();

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE", credentials: "include" });
    try {
      await signOut(getFirebaseAuth());
    } catch {
      // Session cookie cleared; client sign-out optional
    }
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f172a]/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href={leagueId ? `/league/${leagueId}` : "/dashboard"}
          className="flex min-w-0 shrink items-center gap-2"
        >
          <Trophy className="h-6 w-6 shrink-0 text-gold-400" />
          <span className="truncate font-bold">
            {leagueName ?? "World Cup Predictions"}
          </span>
        </Link>

        {leagueId && <LeagueNavDesktop leagueId={leagueId} />}

        <button
          onClick={handleSignOut}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          type="button"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>

      {leagueId && <LeagueNavMobile leagueId={leagueId} />}
    </header>
  );
}
