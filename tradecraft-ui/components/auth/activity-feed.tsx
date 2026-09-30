import { AuthChip } from "./auth-bits";

type FeedEntry = {
  initials: string;
  actor: string;
  verb: string;
  object: string;
  time: string;
  chips: { label: string; variant?: "default" | "profit" | "loss" }[];
  last?: boolean;
};

const entries: FeedEntry[] = [
  {
    initials: "EU",
    actor: "EURUSD",
    verb: "hit take profit on",
    object: "London Open Long",
    time: "2 mins ago",
    chips: [
      { label: "+2.4R", variant: "profit" },
      { label: "Chart.png" },
    ],
  },
  {
    initials: "NQ",
    actor: "NQ",
    verb: "stopped out of",
    object: "NY AM Fade",
    time: "1 hr ago",
    chips: [
      { label: "-1.0R", variant: "loss" },
      { label: "Stopped out" },
    ],
  },
  {
    initials: "YO",
    actor: "You",
    verb: "reviewed",
    object: "Silver Bullet",
    time: "Today",
    chips: [
      { label: "All rules followed", variant: "profit" },
      { label: "12 trades" },
    ],
    last: true,
  },
];

export function ActivityFeed() {
  return (
    <div>
      <h2 className="text-3xl leading-9 font-medium tracking-tight">
        Your edge lives in the review.
      </h2>
      <p className="mt-2 mb-10 text-muted-foreground">
        Log every trade, tag every rule, and see what your execution is really
        doing.
      </p>
      <div>
        {entries.map((entry, i) => (
          <div
            key={entry.actor + entry.object}
            className="auth-feed-entry flex gap-3"
            style={{ ["--auth-index" as string]: i }}
          >
            <div className="flex flex-col items-center">
              <div className="grid size-8 place-items-center rounded-full border-2 border-card bg-accent font-mono text-xs font-medium text-muted-foreground">
                {entry.initials}
              </div>
              {!entry.last ? <div className="my-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className="flex-1 pb-6">
              <div className="flex justify-between gap-3 text-sm">
                <div>
                  <strong className="font-medium">{entry.actor}</strong>{" "}
                  <span className="text-muted-foreground">{entry.verb}</span>{" "}
                  <strong className="font-medium">{entry.object}</strong>
                </div>
                <div className="font-mono text-xs whitespace-nowrap text-subtle-foreground">
                  {entry.time}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.chips.map((chip) => (
                  <AuthChip key={chip.label} variant={chip.variant}>
                    {chip.label}
                  </AuthChip>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
