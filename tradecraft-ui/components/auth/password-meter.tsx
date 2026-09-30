import {
  passwordScoreLabels,
  scorePassword,
  type PasswordScore,
} from "@/lib/auth/password";

const scoreColors: Record<PasswordScore, string> = {
  0: "",
  1: "bg-loss",
  2: "bg-warning",
  3: "bg-foreground",
  4: "bg-profit",
};

export function PasswordMeter({ password }: { password: string }) {
  const score = scorePassword(password);
  return (
    <div>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < score ? scoreColors[score] : "bg-accent"
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-xs text-subtle-foreground">
        <span>{passwordScoreLabels[score]}</span>
      </div>
    </div>
  );
}
