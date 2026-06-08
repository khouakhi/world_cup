import Link from "next/link";
import { Trophy, Target, Star, Crown, Medal, Award } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm">
            <Trophy className="h-4 w-4 text-gold-400" />
            FIFA World Cup 2026
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            World Cup Predictions
          </h1>
          <p className="mx-auto max-w-xl text-lg text-white/70">
            A private league for family and football friends. Predict scores,
            pick your captain, challenge the bracket — and crown the top 3.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth" className="btn-primary px-8 py-3 text-lg">
              Get started
            </Link>
            <Link href="/auth" className="btn-secondary px-8 py-3 text-lg">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <FeatureCard
            icon={<Target className="h-6 w-6 text-gold-400" />}
            title="Score predictions"
            description="1 pt result · 2 pts goal difference · 5 pts exact score"
          />
          <FeatureCard
            icon={<Star className="h-6 w-6 text-gold-400" />}
            title="Captain's pick"
            description="One match per day worth double points"
          />
          <FeatureCard
            icon={<Medal className="h-6 w-6 text-gold-400" />}
            title="Top 3 podium"
            description="Predict 1st, 2nd & 3rd — auto-scored at the end"
          />
          <FeatureCard
            icon={<Crown className="h-6 w-6 text-gold-400" />}
            title="Bracket challenge"
            description="Predict champion, runner-up & semi-finalists"
          />
          <FeatureCard
            icon={<Award className="h-6 w-6 text-gold-400" />}
            title="Badges & banter"
            description="Oracle, Chaos Agent, Knockout King & more"
          />
        </div>

        <div className="card p-6 text-center text-sm text-white/60">
          <p>
            Fixtures and results sync automatically via API-Football.
            Your data is stored securely in Firebase.
          </p>
          <p className="mt-2">
            Predictions lock 15 minutes before kick-off.
          </p>
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-3">{icon}</div>
      <h3 className="mb-1 font-semibold">{title}</h3>
      <p className="text-sm text-white/60">{description}</p>
    </div>
  );
}
