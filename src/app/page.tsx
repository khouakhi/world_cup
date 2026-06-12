import Image from "next/image";
import Link from "next/link";
import {
  Trophy,
  Target,
  Star,
  Crown,
  ChevronRight,
  UserPlus,
  KeyRound,
  Timer,
  Users,
} from "lucide-react";
import { BRACKET_POINTS } from "@/types";
import { ScoringHelpBox } from "@/components/ScoringHelpBox";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1920&q=80";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh]">
        <Image
          src={HERO_IMAGE}
          alt="Football on a green pitch"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />

        <div className="absolute inset-0 bg-gradient-to-b from-pitch-900/85 via-pitch-900/75 to-pitch-900" />
        <div className="hero-pitch-lines absolute inset-0 opacity-60" />
        <div className="hero-glow absolute inset-0" />

        <div className="relative mx-auto flex min-h-[85vh] max-w-4xl flex-col px-4 pb-16 pt-10 md:px-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-7 w-7 text-gold-400" />
              <span className="font-bold tracking-tight">World Cup Predictions</span>
            </div>
            <Link
              href="/auth"
              className="hidden rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition hover:bg-white/20 sm:inline-flex"
            >
              Sign in
            </Link>
          </header>

          <div className="mt-auto pb-8">
            <div className="scoreboard-glow mb-6 inline-flex items-center gap-3 rounded-2xl border border-gold-400/30 bg-black/30 px-4 py-2 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-gold-400" />
              </span>
              <span className="text-sm font-semibold tracking-wide text-gold-400">
                FIFA WORLD CUP 2026
              </span>
            </div>

            <h1 className="mb-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-6xl">
              Predict.
              <br />
              <span className="text-gold-400">Compete.</span>
              <br />
              Win bragging rights.
            </h1>

            <p className="mb-8 max-w-xl text-lg text-white/75 md:text-xl">
              A private league for family and football friends. Three challenges,
              one leaderboard, plenty of banter.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth"
                className="btn-primary group px-8 py-3.5 text-lg shadow-lg shadow-gold-500/20"
              >
                Join the league
                <ChevronRight className="ml-1 h-5 w-5 transition group-hover:translate-x-0.5" />
              </Link>
              <Link href="/auth" className="btn-secondary px-8 py-3.5 text-lg">
                I have an account
              </Link>
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm text-white/50">
              <Timer className="h-4 w-4 shrink-0" />
              Predictions lock 15 minutes before kick-off
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 border-t border-white/10 pt-6 text-sm text-white/50">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gold-400" />
              Private league · invite only
            </span>
            <span>USA · Canada · Mexico</span>
            <span>11 June to 19 July 2026</span>
          </div>
        </div>
      </section>

      {/* How to join */}
      <section className="border-t border-white/10 bg-pitch-800 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">
            How to join
          </h2>
          <ol className="space-y-6">
            <JoinStep
              step={1}
              icon={<UserPlus className="h-6 w-6 text-gold-400" />}
              title="Create your account"
              text="Sign up with your email and a password (at least 6 characters). It only takes a minute."
            />
            <JoinStep
              step={2}
              icon={<KeyRound className="h-6 w-6 text-gold-400" />}
              title="Enter the invite code"
              text="After signing in, you will join the World Cup 2026 league automatically. If asked, enter the 6-character invite code shared by the organiser."
            />
            <JoinStep
              step={3}
              icon={<Trophy className="h-6 w-6 text-gold-400" />}
              title="Start predicting"
              text="Open Matches to predict scores, pick your captain, and fill in your bracket before the deadline."
            />
          </ol>
        </div>
      </section>

      {/* Three challenges */}
      <section className="relative bg-pitch-900 px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">Three challenges</h2>
            <p className="mx-auto max-w-2xl text-white/60">
              Three ways to earn points throughout the tournament. Play all three
              for the best chance to top the table.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <ChallengeCard
              icon={<Target className="h-6 w-6 text-gold-400" />}
              title="1. Score predictions"
              summary="Predict the full-time score for every match."
              points={[
                "Exact score: 5 points",
                "Correct goal difference: 2 points",
                "Correct result (win/draw/loss): 1 point",
                "Submit before kick-off (locks 15 min before)",
              ]}
            />
            <ChallengeCard
              icon={<Star className="h-6 w-6 text-gold-400" />}
              title="2. Captain's pick"
              summary="Double your points on one match each day."
              points={[
                "Pick one match per matchday as your captain",
                "All points from that match are doubled",
                "Example: exact score (5 pts) becomes 10 pts",
                "Choose before the first match of the day kicks off",
              ]}
            />
            <ChallengeCard
              icon={<Crown className="h-6 w-6 text-gold-400" />}
              title="3. Bracket challenge"
              summary="Predict the tournament winner before it starts."
              points={[
                `Champion: ${BRACKET_POINTS.champion} points`,
                `Runner-up: ${BRACKET_POINTS.runnerUp} points`,
                `Each correct semi-finalist: ${BRACKET_POINTS.semiFinalist} points`,
                "Submit by Saturday 13 June at midnight (UK time)",
                "Locks as soon as you save — no changes after",
              ]}
            />
          </div>
        </div>
      </section>

      {/* How points work — always visible */}
      <section className="border-t border-white/10 bg-pitch-800 px-4 py-16 md:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-3xl font-bold md:text-4xl">
            How points work
          </h2>
          <ScoringHelpBox defaultOpen />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 bg-gradient-to-r from-pitch-800 to-pitch-900 px-4 py-16 md:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <Trophy className="mb-4 h-12 w-12 text-gold-400" />
          <h2 className="mb-3 text-2xl font-bold md:text-3xl">Ready for kick-off?</h2>
          <p className="mb-8 max-w-lg text-white/65">
            Create your account and join the World Cup 2026 league today.
          </p>
          <Link href="/auth" className="btn-primary px-10 py-3.5 text-lg">
            Get started (it&apos;s free)
          </Link>
        </div>
      </section>
    </main>
  );
}

function JoinStep({
  step,
  icon,
  title,
  text,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li className="card flex gap-4 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-lg font-bold text-gold-400">
        {step}
      </div>
      <div>
        <div className="mb-1 flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{title}</h3>
        </div>
        <p className="text-sm text-white/65">{text}</p>
      </div>
    </li>
  );
}

function ChallengeCard({
  icon,
  title,
  summary,
  points,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  points: string[];
}) {
  return (
    <div className="card p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="inline-flex rounded-xl bg-white/10 p-2.5">{icon}</div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-white/60">{summary}</p>
        </div>
      </div>
      <ul className="space-y-2 text-sm text-white/70">
        {points.map((point) => (
          <li key={point} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400/80" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
