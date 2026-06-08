"use client";

import { useState } from "react";
import { Trophy, Users, Plus } from "lucide-react";
import type { League } from "@/types";

interface LeagueSelectorProps {
  onCreated: (league: League) => void;
  onJoined: (league: League) => void;
}

export function LeagueSelector({ onCreated, onJoined }: LeagueSelectorProps) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create league");
      onCreated(data.league);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", invite_code: code.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join league");
      onJoined(data.league);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "choose") {
    return (
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">Get started</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("create")}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
          >
            <Plus className="h-8 w-8 text-gold-400" />
            <span className="font-semibold">Create a league</span>
            <span className="text-xs text-white/60">Invite family & friends</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
          >
            <Users className="h-8 w-8 text-gold-400" />
            <span className="font-semibold">Join with code</span>
            <span className="text-xs text-white/60">Enter a 6-character code</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <button
        type="button"
        onClick={() => setMode("choose")}
        className="mb-4 text-sm text-white/60 hover:text-white"
      >
        ← Back
      </button>

      {mode === "create" ? (
        <form onSubmit={handleCreate}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Trophy className="h-5 w-5 text-gold-400" />
            Create your league
          </h2>
          <input
            className="input mb-4"
            placeholder="e.g. Khouakhi Family WC 2026"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating…" : "Create league"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5 text-gold-400" />
            Join a league
          </h2>
          <input
            className="input mb-4 text-center text-2xl font-bold tracking-widest uppercase"
            placeholder="ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            maxLength={6}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Joining…" : "Join league"}
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
