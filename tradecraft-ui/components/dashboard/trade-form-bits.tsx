"use client";

import { useRef, useState, type ClipboardEvent } from "react";
import type { ReactNode } from "react";
import {
  nextShotId,
  normalizeTvUrl,
  shotFromFile,
  type Shot,
} from "@/lib/dashboard/trade-media";
import { MicroLabel } from "./ui";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <MicroLabel>{label}</MicroLabel>
      {children}
      {hint ? (
        <p className="text-xs leading-4 text-subtle-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export const inputCls =
  "h-9 w-full rounded-lg border border-input bg-card px-3 font-sans text-sm text-foreground outline-none placeholder:text-subtle-foreground focus:border-ring";

export const textAreaCls =
  "min-h-20 w-full resize-y rounded-lg border border-input bg-card p-3 font-sans text-sm text-foreground outline-none placeholder:text-subtle-foreground focus:border-ring";

export function PillSingle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: readonly { value: T; label: string }[];
  value: string;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={[
              "flex h-8 items-center rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              active
                ? "border-transparent bg-accent text-foreground"
                : "border-border text-muted-foreground hover:bg-surface-high hover:text-foreground",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function PillMulti({
  options,
  values,
  onToggle,
  ariaLabel,
}: {
  options: readonly { value: string; label: string }[];
  values: string[];
  onToggle: (v: string) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(o.value)}
            className={[
              "flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring",
              active
                ? "border-transparent bg-accent text-foreground"
                : "border-border text-muted-foreground hover:bg-surface-high hover:text-foreground",
            ].join(" ")}
          >
            {active ? <span aria-hidden="true">✓</span> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FileButton({
  label,
  accept,
  multiple,
  onFiles,
  onFileObjects,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  onFiles: (names: string[]) => void;
  onFileObjects?: (files: File[]) => void;
}) {
  return (
    <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-input px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground">
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) {
            onFiles(files.map((f) => f.name));
            onFileObjects?.(files);
          }
          e.target.value = "";
        }}
      />
    </label>
  );
}

function ShotThumb({ shot, onRemove }: { shot: Shot; onRemove: () => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-background">
      {broken ? (
        <a
          href={shot.tvUrl ?? shot.src}
          target="_blank"
          rel="noreferrer"
          className="flex h-24 items-center justify-center p-2 text-center text-xs text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
        >
          Image failed to load — open original
        </a>
      ) : (
        <img
          src={shot.src}
          alt={shot.name}
          loading="lazy"
          onError={() => setBroken(true)}
          className="h-24 w-full object-cover"
        />
      )}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">
          {shot.tvUrl ? "TV · " : ""}
          {shot.name}
        </span>
        <button
          type="button"
          aria-label={`Remove ${shot.name}`}
          onClick={onRemove}
          className="grid size-6 flex-none place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function ShotField({
  label,
  hint,
  shots,
  onChange,
  uploadLabel,
}: {
  label: string;
  hint?: string;
  shots: Shot[];
  onChange: (shots: Shot[]) => void;
  uploadLabel: string;
}) {
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const zoneRef = useRef<HTMLDivElement>(null);

  const addFiles = (files: File[]) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    onChange([...shots, ...imgs.map(shotFromFile)]);
  };

  const onPaste = (e: ClipboardEvent) => {
    const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!files.length) return;
    e.preventDefault();
    addFiles(files);
  };

  const addUrl = () => {
    try {
      const n = normalizeTvUrl(url);
      const name = n.tvUrl ? n.tvUrl.split("/x/")[1]?.replace(/\/.*$/, "") || "tv-snapshot" : n.src.split("/").pop() || "image";
      onChange([
        ...shots,
        {
          id: nextShotId(),
          name: n.tvUrl ? `tv-${name}.png` : name,
          src: n.src,
          tvUrl: n.tvUrl,
          owned: false,
        },
      ]);
      setUrl("");
      setUrlError("");
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Could not add this URL.");
    }
  };

  const remove = (id: string) => {
    const target = shots.find((s) => s.id === id);
    if (target?.owned) {
      try {
        URL.revokeObjectURL(target.src);
      } catch {
        /* ignore */
      }
    }
    onChange(shots.filter((s) => s.id !== id));
  };

  return (
    <div className="grid min-w-0 gap-1.5">
      <MicroLabel>{label}</MicroLabel>
      <div
        ref={zoneRef}
        tabIndex={0}
        onPaste={onPaste}
        aria-label={`${label} — focus here and press Ctrl+V to paste a screenshot`}
        className="grid gap-2 rounded-lg border border-dashed border-input p-2.5 transition-colors focus:border-ring"
      >
        <span className="text-xs leading-4 text-subtle-foreground">
          Upload, focus here and press Ctrl+V to paste, or add a TradingView link below.
        </span>
        <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-input px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground">
          {uploadLabel}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="https://www.tradingview.com/x/… or image URL"
            aria-label="TradingView or image URL"
            className="h-9 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 font-mono text-xs text-foreground outline-none placeholder:text-subtle-foreground focus:border-ring"
          />
          <button
            type="button"
            onClick={addUrl}
            className="h-9 flex-none rounded-lg border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
          >
            Add
          </button>
        </div>
        {urlError ? <p className="text-xs text-loss">{urlError}</p> : null}
        {shots.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {shots.map((s) => (
              <ShotThumb key={s.id} shot={s} onRemove={() => remove(s.id)} />
            ))}
          </div>
        ) : null}
      </div>
      {hint ? (
        <p className="text-xs leading-4 text-subtle-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
