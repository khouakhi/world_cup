"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/Nav";
import { TeamPicker, type TeamOption } from "@/components/TeamPicker";
import type { League, BracketPrediction } from "@/types";
import { BRACKET_POINTS } from "@/types";
import { Clock, Crown, Lock } from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import {
  formatBracketDeadlineCountdown,
  getBracketDeadlineLabel,
  isBracketSubmissionOpen,
} from "@/lib/bracket-deadline";
import { apiFetch } from "@/lib/api-client";

export default function BracketPage() {
  const params = useParams();
  const router = useRouter();
  const leagueId = params.id as string;

  const [league, setLeague] = useState<League | null>(null);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");
  const [bracket, setBracket] = useState<Partial<BracketPrediction>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [submissionOpen, setSubmissionOpen] = useState(true);
  const [countdown, setCountdown] = useState<string | null>(
    formatBracketDeadlineCountdown()
  );

  useEffect(() => {
    async function load() {
      const leaguesRes = await apiFetch("/api/leagues");
      if (leaguesRes.status === 401) {
        router.push("/auth");
        return;
      }
      const leaguesData = await leaguesRes.json();
      setLeague(
        leaguesData.leagues?.find((l: League) => l.id === leagueId) ?? null
      );

      setTeamsLoading(true);
      setTeamsError("");
      const teamsRes = await apiFetch("/api/matches", { method: "POST" });
      const teamsData = await teamsRes.json();
      if (!teamsRes.ok) {
        setTeamsError(teamsData.error ?? "Could not load teams");
        setTeams([]);
      } else {
        const sorted = [...(teamsData.teams ?? [])].sort((a: TeamOption, b: TeamOption) =>
          a.name.localeCompare(b.name)
        );
        setTeams(sorted);
      }
      setTeamsLoading(false);

      const bracketRes = await apiFetch(`/api/bracket?league_id=${leagueId}`);
      const bracketData = await bracketRes.json();
      if (bracketData.bracket) setBracket(bracketData.bracket);
      if (typeof bracketData.submission_open === "boolean") {
        setSubmissionOpen(bracketData.submission_open);
      }
    }
    load();
  }, [leagueId, router]);

  useEffect(() => {
    const tick = () => {
      setSubmissionOpen(isBracketSubmissionOpen());
      setCountdown(formatBracketDeadlineCountdown());
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const semiIds = bracket.semi_finalist_ids ?? [];
    const semiNames = bracket.semi_finalist_names ?? [];

    const res = await apiFetch("/api/bracket", {
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
      setMessage("Bracket saved and locked!");
      setBracket(data.bracket);
    }
  }

  const isLocked = Boolean(bracket.is_locked);
  const isReadOnly = isLocked || !submissionOpen;

  function selectTeam(
    field: "champion" | "runner_up" | "semi",
    team: TeamOption,
    index?: number
  ) {
    if (isReadOnly) return;
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
        <p className="mb-4 text-sm text-white/60">
          Champion {BRACKET_POINTS.champion} pts · Runner-up {BRACKET_POINTS.runnerUp}{" "}
          pts · Semi-finalists {BRACKET_POINTS.semiFinalist} pts each. Your picks lock as
          soon as you save — choose carefully.
        </p>

        <div className="card mb-6 flex items-start gap-3 p-4 text-sm">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-white/60" />
          <div>
            <p className="font-medium text-white/90">
              Deadline: {getBracketDeadlineLabel()}
            </p>
            {submissionOpen && countdown && (
              <p className="mt-1 text-white/60">{countdown}</p>
            )}
            {!submissionOpen && (
              <p className="mt-1 text-red-400">Submissions are now closed.</p>
            )}
          </div>
        </div>

        {isLocked && (
          <div className="card mb-6 flex items-center gap-3 p-4 text-sm text-gold-400">
            <Lock className="h-5 w-5 shrink-0" />
            <span>Your bracket is locked. You cannot change your picks.</span>
          </div>
        )}

        {!isLocked && !submissionOpen && (
          <div className="card mb-6 flex items-center gap-3 p-4 text-sm text-red-400">
            <Lock className="h-5 w-5 shrink-0" />
            <span>
              The deadline has passed and you did not submit a bracket in time.
            </span>
          </div>
        )}

        {teamsLoading && (
          <p className="mb-4 text-sm text-white/50">Loading World Cup teams…</p>
        )}
        {teamsError && (
          <p className="card mb-4 p-4 text-sm text-red-400">{teamsError}</p>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <TeamPicker
            label="🏆 Champion"
            teams={teams}
            selectedId={bracket.champion_team_id}
            onSelect={(t) => selectTeam("champion", t)}
            placeholder="Choose champion…"
            disabled={isReadOnly}
          />
          <TeamPicker
            label="🥈 Runner-up"
            teams={teams}
            selectedId={bracket.runner_up_team_id}
            onSelect={(t) => selectTeam("runner_up", t)}
            placeholder="Choose runner-up…"
            disabled={isReadOnly}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Semi-finalists (pick 4)
            </label>
            <div className="relative grid gap-3 overflow-visible sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <TeamPicker
                  key={i}
                  label={`Semi ${i + 1}`}
                  teams={teams}
                  selectedId={bracket.semi_finalist_ids?.[i]}
                  onSelect={(t) => selectTeam("semi", t, i)}
                  compact
                  placeholder="Choose team…"
                  disabled={isReadOnly}
                />
              ))}
            </div>
          </div>

          {!isReadOnly && (
            <button
              type="submit"
              disabled={saving || teamsLoading || teams.length === 0}
              className="btn-primary w-full"
            >
              {saving ? "Saving…" : "Save and lock bracket"}
            </button>
          )}

          {message && (
            <p
              className={`text-sm ${message.includes("saved") ? "text-green-400" : "text-red-400"}`}
            >
              {message}
            </p>
          )}
        </form>
      </main>
      <MobileNav leagueId={leagueId} />
    </div>
  );
}
