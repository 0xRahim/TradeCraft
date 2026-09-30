"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { Chip, IconButton, MicroLabel } from "@/components/dashboard/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import {
  gradeLabel,
  gradeTone,
  loadJournal,
  saveJournal,
  TODAY,
  type JournalData,
  type JournalFile,
} from "@/lib/dashboard/journal-store";
import { renderMarkdown } from "./markdown";

type Filter = "all" | "hi" | "lo" | "un";
type ViewMode = "edit" | "split" | "prev";

const PAGE_TEMPLATE = `# Untitled

## Bias

## Key levels
-

## Invalidation

## Checklist
- [ ] HTF bias confirmed
- [ ] Session liquidity marked
`;

const OUTCOMES = [
  ["pending", "Pending"],
  ["played", "Played out"],
  ["invalid", "Invalidated"],
] as const;

const TOOLBAR: { key: string; label: string; icon: IconName; prefix?: string }[] = [
  { key: "h", label: "Heading", icon: "h", prefix: "# " },
  { key: "bold", label: "Bold (⌘B)", icon: "bold" },
  { key: "italic", label: "Italic (⌘I)", icon: "italic" },
  { key: "list", label: "Bullet list", icon: "list", prefix: "- " },
  { key: "task", label: "Checklist", icon: "task", prefix: "- [ ] " },
  { key: "quote", label: "Quote", icon: "quote", prefix: "> " },
  { key: "code", label: "Code", icon: "code" },
];

function dayLabel(d: string): [string, string] {
  const x = new Date(d + "T00:00:00");
  return [
    x.toLocaleDateString("en", { month: "short", day: "numeric" }),
    x.toLocaleDateString("en", { weekday: "short" }),
  ];
}

function avg(nums: number[]): string {
  return nums.length
    ? (nums.reduce((x, y) => x + y, 0) / nums.length).toFixed(1)
    : "—";
}

function findFile(days: JournalData, id: string | null): [string, JournalFile] | null {
  if (!id) return null;
  for (const d of Object.keys(days)) {
    const f = days[d].files.find((x) => x.id === id);
    if (f) return [d, f];
  }
  return null;
}

function initJournal(): {
  days: JournalData;
  sel: string | null;
  open: Record<string, boolean>;
} {
  const stored = loadJournal();
  const hash =
    typeof window !== "undefined" ? window.location.hash.slice(1) : "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(hash) && stored[hash]?.files.length) {
    return {
      days: stored,
      sel: stored[hash].files[0].id,
      open: { [TODAY]: true, "2026-09-28": true, [hash]: true },
    };
  }
  const day = stored[TODAY]?.files.length ? TODAY : null;
  const first =
    (day && stored[day].files[0]?.id) ||
    Object.keys(stored)
      .sort()
      .reverse()
      .map((d) => stored[d].files[0]?.id)
      .find(Boolean) ||
    null;
  return {
    days: stored,
    sel: first ?? null,
    open: { [TODAY]: true, "2026-09-28": true },
  };
}

export function JournalView() {
  const [boot] = useState(initJournal);
  const [days, setDays] = useState<JournalData>(boot.days);
  const [sel, setSel] = useState<string | null>(boot.sel);
  const [open, setOpen] = useState<Record<string, boolean>>(boot.open);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [mode, setMode] = useState<ViewMode>("split");
  const [saving, setSaving] = useState(false);
  const [armed, setArmed] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const daysRef = useRef(days);
  useEffect(() => {
    daysRef.current = days;
  });

  /* deep-link hash (e.g. from a trade's "View analysis") */
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.slice(1);
      const d = daysRef.current;
      if (/^\d{4}-\d{2}-\d{2}$/.test(hash) && d[hash]?.files.length) {
        setOpen((o) => ({ ...o, [hash]: true }));
        setSel(d[hash].files[0].id);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const sortedDays = useMemo(() => Object.keys(days).sort().reverse(), [days]);

  /* tree model */
  const matchesGrade = (g: number | null) =>
    filter === "hi"
      ? (g ?? 0) >= 8
      : filter === "lo"
        ? !!g && g <= 4
        : filter === "un"
          ? !g
          : true;
  const matchesFile = (f: JournalFile) =>
    !q || (f.n + " " + f.b).toLowerCase().includes(q);

  const visible = sortedDays.filter((d) => {
    const y = days[d];
    if (!matchesGrade(y.g)) return false;
    if (q && !y.files.some(matchesFile)) return false;
    return true;
  });

  function persist(next: JournalData) {
    setDays(next);
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveJournal(next);
      setSaving(false);
    }, 400);
  }

  function mutate(fn: (d: JournalData) => void) {
    const next: JournalData = JSON.parse(JSON.stringify(days));
    fn(next);
    persist(next);
  }

  function select(id: string) {
    setSel(id);
    const found = findFile(days, id);
    if (found) setOpen((o) => ({ ...o, [found[0]]: true }));
  }

  function addPage(day: string) {
    const next: JournalData = JSON.parse(JSON.stringify(days));
    next[day] = next[day] || { g: null, o: "pending", files: [] };
    const f = { id: "f" + Date.now(), n: "untitled", b: PAGE_TEMPLATE };
    next[day].files.push(f);
    setQ("");
    setOpen((o) => ({ ...o, [day]: true }));
    persist(next);
    setSel(f.id);
  }

  function goDay(delta: -1 | 1) {
    const asc = [...sortedDays].reverse();
    const cur = findFile(days, sel);
    const i = cur ? asc.indexOf(cur[0]) : -1;
    for (let j = i + delta; j >= 0 && j < asc.length; j += delta) {
      if (days[asc[j]].files.length) {
        select(days[asc[j]].files[0].id);
        return;
      }
    }
  }

  /* textarea helpers */
  function wrap(a: string, b: string) {
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value: v } = ta;
    ta.value = v.slice(0, s) + a + v.slice(s, e) + b + v.slice(e);
    ta.selectionStart = s + a.length;
    ta.selectionEnd = e + a.length;
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function prefixLine(p: string) {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const v = ta.value;
    const i = v.lastIndexOf("\n", s - 1) + 1;
    ta.value = v.slice(0, i) + p + v.slice(i);
    ta.selectionStart = ta.selectionEnd = s + p.length;
    ta.focus();
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function onToolbar(key: string) {
    if (key === "bold") wrap("**", "**");
    else if (key === "italic") wrap("*", "*");
    else if (key === "code") wrap("`", "`");
    else prefixLine(TOOLBAR.find((t) => t.key === key)?.prefix ?? "");
  }

  const grades = sortedDays
    .map((d) => days[d].g)
    .filter((g): g is number => !!g);

  const cur = findFile(days, sel);
  const curDay = cur ? days[cur[0]] : null;
  const curFile = cur ? cur[1] : null;
  const words = curFile?.b.trim() ? curFile.b.trim().split(/\s+/).length : 0;

  return (
    <>
      <Topbar
        crumb={
          <>
            Overview / <b className="font-medium text-foreground">Journal</b>
          </>
        }
      />
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl leading-8 font-medium tracking-tight">Journal</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Store your daily thesis, grade it, and look back on it later.
          </p>
        </div>
        <div className="flex gap-2">
          <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-accent">
            <Icon name="cal" />
            New day
            <input
              type="date"
              className="absolute h-0 w-0 opacity-0"
              tabIndex={-1}
              aria-hidden="true"
              value={TODAY}
              onChange={(e) => {
                if (e.target.value) addPage(e.target.value);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => addPage(TODAY)}
            className="flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            <Icon name="plus" />
            New page
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:h-[calc(100vh-176px)] lg:min-h-140">
        {/* Tree */}
        <aside className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card max-lg:max-h-85">
          <div className="flex flex-col gap-3 border-b border-border p-4">
            <div className="relative">
              <span className="absolute top-2.5 left-2.5 text-subtle-foreground">
                <Icon name="search" />
              </span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value.trim().toLowerCase())}
                placeholder="Search pages..."
                aria-label="Search pages"
                className="h-9 w-full rounded-lg border border-input bg-card pr-3 pl-8 font-sans text-sm text-foreground outline-none placeholder:text-subtle-foreground focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "All"],
                  ["hi", "8+"],
                  ["lo", "≤4"],
                  ["un", "Ungraded"],
                ] as [Filter, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFilter(v)}
                  className={`h-7 rounded-full border border-border px-2.5 font-mono text-xs font-medium transition-colors ${filter === v ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-6">
              <div>
                <MicroLabel>Avg grade</MicroLabel>
                <div className="mt-0.5 font-mono text-xl leading-6 font-semibold">
                  {avg(grades)}
                </div>
              </div>
              <div>
                <MicroLabel>Days</MicroLabel>
                <div className="mt-0.5 font-mono text-xl leading-6 font-semibold">
                  {sortedDays.length}
                </div>
              </div>
              <div className="ml-auto flex h-7 items-end gap-0.5" aria-hidden="true">
                {grades
                  .slice(0, 14)
                  .reverse()
                  .map((g, i) => (
                    <i
                      key={i}
                      title={`${g}/10`}
                      className={`w-1.5 rounded-full ${g >= 7 ? "bg-chart-1" : g >= 5 ? "bg-chart-2" : "bg-chart-4"}`}
                      style={{ height: `${g * 10}%`, minHeight: 2 }}
                    />
                  ))}
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2" role="tree">
            {visible.length ? (
              visible.map((d) => {
                const y = days[d];
                const files = y.files.filter(matchesFile);
                const [a, b] = dayLabel(d);
                const isOpen = !!open[d] || !!q;
                const month = d.slice(0, 7);
                const showMonth =
                  visible.indexOf(d) === 0 ||
                  visible[visible.indexOf(d) - 1].slice(0, 7) !== month;
                return (
                  <div key={d}>
                    {showMonth ? (
                      <div className="flex justify-between px-2 pt-4 pb-2 font-mono text-xs font-medium tracking-widest text-subtle-foreground uppercase">
                        <span>
                          {new Date(d + "T00:00:00").toLocaleDateString("en", {
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span>
                          avg{" "}
                          {avg(
                            sortedDays
                              .filter((x) => x.startsWith(month))
                              .map((x) => days[x].g)
                              .filter((g): g is number => !!g),
                          )}
                        </span>
                      </div>
                    ) : null}
                    <div className="group flex items-center gap-1">
                      <button
                        type="button"
                        data-nav
                        data-d={d}
                        aria-expanded={isOpen}
                        onClick={() => setOpen((o) => ({ ...o, [d]: !isOpen }))}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight" || e.key === "ArrowLeft")
                            setOpen((o) => ({ ...o, [d]: e.key === "ArrowRight" }));
                        }}
                        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
                      >
                        <Icon
                          name="chev"
                          className={`size-3.5 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                        />
                        <Icon name="folder" />
                        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis text-left text-foreground">
                          {a}{" "}
                          <em className="font-normal text-subtle-foreground not-italic">
                            {b}
                          </em>
                        </span>
                        {y.g ? (
                          <Chip variant={gradeTone(y.g)}>{y.g}/10</Chip>
                        ) : (
                          <Chip>—</Chip>
                        )}
                      </button>
                      <button
                        type="button"
                        title={`New page in ${a}`}
                        aria-label={`New page in ${a}`}
                        onClick={() => addPage(d)}
                        className="grid size-7 flex-none place-items-center rounded-lg text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100"
                      >
                        <Icon name="plus" />
                      </button>
                    </div>
                    {isOpen ? (
                      <div className="mt-0.5 mb-1 ml-4.5 border-l border-border pl-2">
                        {files.length ? (
                          files.map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              data-nav
                              data-f={f.id}
                              onClick={() => select(f.id)}
                              className={`flex h-8 w-full items-center gap-2 rounded-lg px-2 pl-3 text-left text-sm transition-colors ${f.id === sel ? "bg-accent text-foreground" : "font-normal text-muted-foreground hover:bg-surface-high hover:text-foreground"}`}
                            >
                              <Icon name="file" />
                              <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                                {f.n}.md
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-subtle-foreground">
                            Empty folder
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-subtle-foreground">
                No matches
              </div>
            )}
          </div>
        </aside>

        {/* Editor */}
        <section className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card lg:min-h-180">
          {!cur || !curDay || !curFile ? (
            <div className="m-auto px-4 py-16 text-center text-muted-foreground">
              <Icon name="file" className="mx-auto size-6" />
              <div className="mt-2 text-sm font-semibold text-foreground">
                No page selected
              </div>
              <div className="mt-0.5 text-xs">
                Pick a page from the tree or create a new one.
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <div className="flex min-w-0 gap-2 overflow-hidden font-mono text-xs whitespace-nowrap text-subtle-foreground">
                  <span>Journal</span>/<span>{cur[0]}</span>/
                  <b className="overflow-hidden text-ellipsis font-medium text-foreground">
                    {curFile.n}.md
                  </b>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <span className="min-w-16 text-right font-mono text-xs text-subtle-foreground">
                    {saving ? "Saving…" : "Saved"}
                  </span>
                  <div className="flex h-8 overflow-hidden rounded-lg border border-border" role="group" aria-label="Layout">
                    {(["edit", "split", "prev"] as ViewMode[]).map((v, i) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setMode(v)}
                        className={`px-3 text-sm font-medium capitalize transition-colors ${i > 0 ? "border-l border-border" : ""} ${mode === v ? "bg-card text-foreground" : "bg-surface-high text-muted-foreground hover:text-foreground"}`}
                      >
                        {v === "edit" ? "Edit" : v === "split" ? "Split" : "Preview"}
                      </button>
                    ))}
                  </div>
                  <IconButton label="Older day" onClick={() => goDay(-1)}>
                    <Icon name="l" />
                  </IconButton>
                  <button
                    type="button"
                    title="Jump to today"
                    onClick={() => {
                      if (days[TODAY]?.files[0]) select(days[TODAY].files[0].id);
                      else addPage(TODAY);
                    }}
                    className="h-8 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    Today
                  </button>
                  <IconButton label="Newer day" onClick={() => goDay(1)}>
                    <Icon name="r" />
                  </IconButton>
                  <span className={armed ? "rounded-lg bg-loss-container text-on-loss-container" : ""}>
                    <IconButton
                      label={armed ? "Click again to confirm" : "Delete page"}
                      onClick={() => {
                        if (!armed) {
                          setArmed(true);
                          if (armTimer.current) clearTimeout(armTimer.current);
                          armTimer.current = setTimeout(() => setArmed(false), 2500);
                        } else {
                          setArmed(false);
                          mutate((d) => {
                            d[cur[0]].files = d[cur[0]].files.filter(
                              (f) => f.id !== sel,
                            );
                          });
                          const rest = curDay.files.filter((f) => f.id !== sel);
                          if (rest[0]) setSel(rest[0].id);
                          else {
                            const alt = sortedDays.find((x) => days[x].files.length && x !== cur[0]);
                            setSel(alt ? days[alt].files[0].id : null);
                          }
                        }
                      }}
                    >
                      <Icon name="trash" />
                    </IconButton>
                  </span>
                </div>
              </div>

              <div className="px-6 pt-6 pb-4">
                <div className="mb-4 flex items-baseline gap-1">
                  <input
                    value={curFile.n}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[/\\]/g, "").trim() || "untitled";
                      mutate((d) => {
                        d[cur[0]].files.find((f) => f.id === sel)!.n = v;
                      });
                    }}
                    placeholder="Untitled"
                    aria-label="Page title"
                    className="min-w-0 flex-1 border-0 bg-transparent text-2xl leading-8 font-medium tracking-tight text-foreground outline-none placeholder:text-subtle-foreground"
                  />
                  <span className="font-mono text-sm text-subtle-foreground">.md</span>
                </div>
                <div className="grid grid-cols-[88px_1fr] items-center gap-x-4 gap-y-3">
                  <span className="text-sm text-muted-foreground">Date</span>
                  <span className="font-mono text-sm">
                    {cur[0]} · {dayLabel(cur[0])[1]}
                  </span>
                  <span className="text-sm text-muted-foreground">Day grade</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`Grade ${n}`}
                        onClick={() =>
                          mutate((d) => {
                            d[cur[0]].g = d[cur[0]].g === n ? null : n;
                          })
                        }
                        className={`size-7 rounded-lg border border-border font-mono text-xs font-medium transition-colors ${
                          curDay.g === n
                            ? n >= 7
                              ? "border-profit-border bg-profit-container text-on-profit-container"
                              : n >= 5
                                ? "border-warning-border bg-warning-container text-on-warning-container"
                                : "border-loss-border bg-loss-container text-on-loss-container"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {curDay.g ? `${curDay.g}/10 · ${gradeLabel(curDay.g)}` : "Not graded"}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">Outcome</span>
                  <div className="flex h-8 overflow-hidden rounded-lg border border-border">
                    {OUTCOMES.map(([v, label], i) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => mutate((d) => { d[cur[0]].o = v; })}
                        className={`px-3 text-sm font-medium transition-colors ${i > 0 ? "border-l border-border" : ""} ${curDay.o === v ? "bg-card text-foreground" : "bg-surface-high text-muted-foreground hover:text-foreground"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-1 border-y border-border px-4 py-2">
                {TOOLBAR.map((tool) => (
                  <IconButton
                    key={tool.key}
                    label={tool.label}
                    onClick={() => onToolbar(tool.key)}
                  >
                    <Icon name={tool.icon} />
                  </IconButton>
                ))}
              </div>

              <div
                className={`grid min-h-50 flex-1 ${mode === "split" ? "grid-cols-1 xl:grid-cols-2" : "grid-cols-1"}`}
              >
                {mode !== "prev" ? (
                  <div className="flex min-h-0">
                    <textarea
                      ref={taRef}
                      value={curFile.b}
                      onChange={(e) =>
                        mutate((d) => {
                          d[cur[0]].files.find((f) => f.id === sel)!.b = e.target.value;
                        })
                      }
                      onKeyDown={(e) => {
                        if (
                          (e.metaKey || e.ctrlKey) &&
                          (e.key === "b" || e.key === "i") &&
                          document.activeElement === taRef.current
                        ) {
                          e.preventDefault();
                          if (e.key === "b") wrap("**", "**");
                          else wrap("*", "*");
                        }
                      }}
                      spellCheck={false}
                      placeholder="Write your thesis in Markdown..."
                      className="w-full flex-1 resize-none border-0 bg-transparent p-6 font-mono text-sm leading-6 text-foreground outline-none placeholder:text-subtle-foreground"
                      style={{ tabSize: 2 }}
                    />
                  </div>
                ) : null}
                {mode !== "edit" ? (
                  <article
                    className={`journal-preview min-w-0 overflow-auto p-6 ${mode === "split" ? "border-border max-xl:border-t xl:border-l" : ""}`}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(curFile.b) }}
                  />
                ) : null}
              </div>

              <div className="flex justify-between border-t border-border px-4 py-2 font-mono text-xs text-subtle-foreground">
                <span>
                  {words} words · {Math.max(1, Math.round(words / 200))} min read
                </span>
                <span>Markdown</span>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}
