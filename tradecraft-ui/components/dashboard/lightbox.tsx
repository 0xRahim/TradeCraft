"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icons";
import { IconButton } from "./ui";

export type LightboxShot = {
  name: string;
  src?: string;
  tvUrl?: string;
  section: string;
};

/**
 * Fullscreen-capable screenshot viewer over the combined entry + trade
 * shots. Arrow buttons, ←/→ keyboard nav, Esc close, filmstrip, counter,
 * and a fullscreen toggle. Touch swipe supported.
 */
export function ShotLightbox({
  shots,
  index,
  onClose,
  onIndex,
}: {
  shots: LightboxShot[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const [isFs, setIsFs] = useState(false);
  const current = shots[Math.min(index, shots.length - 1)];

  const go = useCallback(
    (d: 1 | -1) => {
      const next = index + d;
      if (next >= 0 && next < shots.length) onIndex(next);
    },
    [index, shots.length, onIndex],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Lock background scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onFs = () => setIsFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    } else {
      void boxRef.current?.requestFullscreen().catch(() => {});
    }
  }

  if (!current) return null;

  return (
    <div
      ref={boxRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Screenshot ${index + 1} of ${shots.length}`}
      className="fixed inset-0 z-50 flex flex-col bg-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 48) go(dx < 0 ? 1 : -1);
      }}
    >
      {/* Top bar */}
      <div className="flex h-14 flex-none items-center gap-2 px-4">
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          <span className="font-mono text-xs text-subtle-foreground">
            {current.section} · {index + 1}/{shots.length}
          </span>{" "}
          <span className="font-medium text-foreground">{current.name}</span>
        </span>
        <IconButton
          label={isFs ? "Exit full screen" : "Full screen"}
          onClick={toggleFullscreen}
        >
          <Icon name="expand" />
        </IconButton>
        <IconButton label="Close viewer" onClick={onClose}>
          <Icon name="x" />
        </IconButton>
      </div>

      {/* Stage */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center gap-2 px-2 pb-2 md:px-14">
        <span className="flex-none max-md:hidden">
          <IconButton label="Previous screenshot" disabled={index <= 0} onClick={() => go(-1)}>
            <Icon name="l" />
          </IconButton>
        </span>
        <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
          {current.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={current.src}
              src={current.src}
              alt={current.name}
              className="max-h-full max-w-full rounded-lg border border-border object-contain"
            />
          ) : current.tvUrl ? (
            <a
              href={current.tvUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-border bg-card px-8 py-16 text-center text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
            >
              No image stored — open the TradingView snapshot
            </a>
          ) : (
            <div className="rounded-lg border border-border bg-card px-8 py-16 text-center font-mono text-sm text-subtle-foreground">
              {current.name}
            </div>
          )}
        </div>
        <span className="flex-none max-md:hidden">
          <IconButton
            label="Next screenshot"
            disabled={index >= shots.length - 1}
            onClick={() => go(1)}
          >
            <Icon name="r" />
          </IconButton>
        </span>
        {/* Mobile arrows */}
        <button
          type="button"
          aria-label="Previous screenshot"
          disabled={index <= 0}
          onClick={() => go(-1)}
          className="absolute top-1/2 left-2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground disabled:opacity-35 md:hidden"
        >
          <Icon name="l" />
        </button>
        <button
          type="button"
          aria-label="Next screenshot"
          disabled={index >= shots.length - 1}
          onClick={() => go(1)}
          className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-card text-foreground disabled:opacity-35 md:hidden"
        >
          <Icon name="r" />
        </button>
      </div>

      {/* Filmstrip */}
      {shots.length > 1 ? (
        <div className="flex flex-none gap-2 overflow-x-auto px-4 pb-4 [scrollbar-width:none]">
          {shots.map((s, i) => (
            <button
              key={`${s.section}-${s.name}-${i}`}
              type="button"
              aria-label={`View ${s.name}`}
              onClick={() => onIndex(i)}
              className={[
                "h-14 w-20 flex-none overflow-hidden rounded-md border bg-card transition-colors",
                i === index
                  ? "border-ring"
                  : "border-border opacity-60 hover:opacity-100",
              ].join(" ")}
            >
              {s.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.src} alt="" aria-hidden="true" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full w-full place-items-center px-1 text-center font-mono text-[10px] text-subtle-foreground">
                  {s.tvUrl ? "TV ↗" : s.name}
                </span>
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
