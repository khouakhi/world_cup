"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import type { League, BracketPrediction } from "@/types";
import { BRACKET_POINTS } from "@/types";
import { Crown } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";

interface Team {
  id: number;
  name: string;
  logo: string | null;
}

export default function BracketPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [bracket, setBracket] = useState<Partial<BracketPrediction>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const leaguesRes = await fetch("/api/leagues");
      if (leaguesRes.status === 401) {
        router.push("/auth");
        return;
      }
      const leaguesData = await leaguesRes.json();
      setLeague(
        leaguesData.leagues?.find((l: League) => l.id === leagueId) ?? null
      );

      const teamsRes = await fetch("/api/matches", { method: "POST" });
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams ?? []);

      const bracketRes = await fetch(`/api/bracket?league_id=${leagueId}`);
      const bracketData = await bracketRes.json();
      if (bracketData.bracket) setBracket(bracketData.bracket);
    }
    load();
  }, [leagueId, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const semiIds = bracket.semi_finalist_ids ?? [];
    const semiNames = bracket.semi_finalist_names ?? [];

    const res = await fetch("/api/bracket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        league_id: leagueId,
        champion_team_id: bracket.champion_team_id,
        champion_team_name: bracket.champion_team_name,
        runner_up_team_id: bracket.runner_up_team_id,
        runner_up_team_name: bracket.runner_up_team_name,
        semi_finalist_ids: semiIds,
        semi_finalist_names: semiNames,
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to save");
    } else {
      setMessage("Bracket saved!");
      setBracket(data.bracket);
    }
  }

  function selectTeam(
    field: "champion" | "runner_up" | "semi",
    team: Team,
    index?: number
  ) {
    if (field === "champion") {
      setBracket((b) => ({
        ...b,
        champion_team_id: team.id,
        champion_team_name: team.name,
      }));
    } else if (field === "runner_up") {
      setBracket((b) => ({
        ...b,
        runner_up_team_id: team.id,
        runner_up_team_name: team.name,
      }));
    } else if (field === "semi" && index !== undefined) {
      const ids = [...(bracket.semi_finalist_ids ?? [])];
      const names = [...(bracket.semi_finalist_names ?? [])];
      ids[index] = team.id;
      names[index] = team.name;
      setBracket((b) => ({
        ...b,
        semi_finalist_ids: ids,
        semi_finalist_names: names,
      }));
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <Nav leagueName={league?.name} leagueId={leagueId} />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <Crown className="h-6 w-6 text-gold-400" />
          Bracket Challenge
        </h1>
        <p className="mb-6 text-sm text-white/60">
          Predict before the tournament starts. Champion {BRACKET_POINTS.champion} pts ·
          Runner-up {BRACKET_POINTS.runnerUp} pts · Semi-finalists{" "}
          {BRACKET_POINTS.semiFinalist} pts each
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <TeamSelect
            label="🏆 Champion"
            teams={teams}
            selectedId={bracket.champion_team_id}
            onSelect={(t) => selectTeam("champion", t)}
          />
          <TeamSelect
            label="🥈 Runner-up"
            teams={teams}
            selectedId={bracket.runner_up_team_id}
            onSelect={(t) => selectTeam("runner_up", t)}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Semi-finalists (pick 4)
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <TeamSelect
                  key={i}
                  label={`Semi ${i + 1}`}
                  teams={teams}
                  selectedId={bracket.semi_finalist_ids?.[i]}
                  onSelect={(t) => selectTeam("semi", t, i)}
                  compact
                />
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving || bracket.is_locked} className="btn-primary w-full">
            {saving ? "Saving…" : bracket.is_locked ? "Bracket locked" : "Save bracket"}
          </button>

          {message && (
            <p className={`text-sm ${message.includes("saved") ? "text-green-400" : "text-red-400"}`}>
              {message}
            </p>
          )}
        </form>
      </main>
      <MobileNav leagueId={leagueId} />
    </div>
  );
}

function TeamSelect({
  label,
  teams,
  selectedId,
  onSelect,
  compact = false,
}: {
  label: string;
  teams: Team[];
  selectedId?: number | null;
  onSelect: (team: Team) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "card p-4"}>
      {!compact && <label className="mb-2 block text-sm font-semibold">{label}</label>}
      {compact && <label className="mb-1 block text-xs text-white/60">{label}</label>}
      <select
        className="input"
        value={selectedId ?? ""}
        onChange={(e) => {
          const team = teams.find((t) => t.id === parseInt(e.target.value, 10));
          if (team) onSelect(team);
        }}
      >
        <option value="">Select team…</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
