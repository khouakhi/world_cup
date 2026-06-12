"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { MatchCard } from "@/components/MatchCard";
import { formatMatchday } from "@/lib/utils";
import type { Match, Prediction, League } from "@/types";
import { ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import { ScoringHelpBox } from "@/components/ScoringHelpBox";
import { apiFetch, isFirebaseSignedIn } from "@/lib/api-client";

type MatchWithPreview = Match & {
  preview?: { preview_text: string; fun_fact: string | null } | null;
};

export default function LeaguePage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<MatchWithPreview[]>([]);
  const [matchdays, setMatchdays] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [captainMatchId, setCaptainMatchId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    if (!(await isFirebaseSignedIn())) {
      router.replace("/auth");
      return;
    }

    const leaguesRes = await apiFetch("/api/leagues");
    const leaguesData = await leaguesRes.json();
    const current = leaguesData.leagues?.find((l: League) => l.id === leagueId);
    setLeague(current ?? null);

    const matchQuery = selectedDay ? `?matchday=${selectedDay}` : "";
    const matchesRes = await apiFetch(`/api/matches${matchQuery}`);
    const matchesData = await matchesRes.json();
    setMatches(matchesData.matches ?? []);
    setMatchdays(matchesData.matchdays ?? []);

    const activeDay = selectedDay || matchesData.selected_matchday || "";
    if (!selectedDay && matchesData.selected_matchday) {
      setSelectedDay(matchesData.selected_matchday);
    }

    const predsRes = await apiFetch(`/api/predictions?league_id=${leagueId}`);
    const predsData = await predsRes.json();
    setPredictions(predsData.predictions ?? []);

    if (activeDay) {
      const capRes = await apiFetch(
        `/api/captain?league_id=${leagueId}&matchday=${activeDay}`
      );
      const capData = await capRes.json();
      setCaptainMatchId(capData.captain_pick?.match_id ?? null);
    }
  }, [leagueId, selectedDay, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handlePredict(matchId: string, home: number, away: number) {
    const res = await apiFetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        league_id: leagueId,
        match_id: matchId,
        home_score: home,
        away_score: away,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setPredictions((prev) => {
        const index = prev.findIndex((p) => p.match_id === matchId);
        if (index >= 0) {
          const next = [...prev];
          next[index] = data.prediction;
          return next;
        }
        return [...prev, data.prediction];
      });
    }
  }

  async function handleCaptainPick(matchId: string) {
    await apiFetch("/api/captain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        league_id: leagueId,
        matchday: selectedDay,
        match_id: matchId,
      }),
    });
    setCaptainMatchId(matchId);
  }

  async function copyInvite() {
    if (!league) return;
    await navigator.clipboard.writeText(league.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const dayIndex = matchdays.indexOf(selectedDay);

  return (
    <div className="min-h-screen">
      <Nav leagueName={league?.name} leagueId={leagueId} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        {league && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Invite code</p>
              <button
                type="button"
                onClick={copyInvite}
                className="flex items-center gap-2 font-mono text-lg font-bold text-gold-400"
              >
                {league.invite_code}
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        {matchdays.length > 0 && (
          <div className="mb-6 flex items-center justify-between">
            <button
              type="button"
              disabled={dayIndex <= 0}
              onClick={() => setSelectedDay(matchdays[dayIndex - 1])}
              className="btn-secondary p-2 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="text-sm text-white/60">Matchday</div>
              <div className="font-semibold">{formatMatchday(selectedDay)}</div>
            </div>
            <button
              type="button"
              disabled={dayIndex >= matchdays.length - 1}
              onClick={() => setSelectedDay(matchdays[dayIndex + 1])}
              className="btn-secondary p-2 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        <ScoringHelpBox defaultOpen />

        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="card p-8 text-center text-white/60">
              No matches for this day yet. Fixtures will appear here once the
              tournament schedule is available.
            </div>
          ) : (
            matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                leagueId={leagueId}
                prediction={predictions.find((p) => p.match_id === match.id)}
                isCaptain={captainMatchId === match.id}
                onPredict={handlePredict}
                onCaptainPick={handleCaptainPick}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
