"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Compass, Play } from "lucide-react";
import { track } from "@vercel/analytics";
import { cn } from "@/lib/utils";

/**
 * Swap in the real walkthrough once it is recorded (YouTube/Vimeo URL).
 * Privacy-enhanced youtube-nocookie embed, loaded only when opened.
 */
export const DEMO_VIDEO_URL = "";

export function VideoModalButton({
  label = "Watch the tour",
  className,
  iconClassName,
}: {
  label?: string;
  className?: string;
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void track("cta_watch_tour");
          setOpen(true);
        }}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-parchment-400 bg-white/60 px-6 py-3 font-display text-sm font-bold text-ink-700 transition-all hover:border-moss-400 hover:bg-moss-50 active:scale-[0.98]",
          className
        )}
      >
        <Play className={cn("h-4 w-4 fill-current", iconClassName)} />
        {label}
      </button>
      {open && <VideoModal onClose={() => setOpen(false)} />}
    </>
  );
}

function VideoModal({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const hasVideo = DEMO_VIDEO_URL.length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product tour video"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 grid place-items-center bg-ink-900/55 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-parchment-400 bg-parchment-50 shadow-lift">
        <button
          ref={closeRef}
          type="button"
          aria-label="Close video"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-parchment-400 bg-parchment-50 text-ink-500 transition-colors hover:bg-parchment-200"
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {hasVideo ? (
          <div className="aspect-video w-full">
            <iframe
              src={DEMO_VIDEO_URL}
              title="Cozy Tactics product tour"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 px-8 py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border border-moss-700 bg-moss-500 text-parchment-50 shadow-[0_2px_0_0_var(--moss-700)]">
              <Compass className="h-7 w-7" />
            </span>
            <p className="font-serif-display text-2xl font-semibold text-ink-900">
              The tour is still in the editing room.
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-ink-500">
              The game itself is very much ready, though — creating a character
              takes about two minutes.
            </p>
            <a
              href="/onboarding"
              className="mt-2 inline-flex min-h-11 items-center rounded-full bg-ink-900 px-6 py-3 font-display text-sm font-bold text-parchment-50 transition-colors hover:bg-ink-700"
            >
              Start your adventure
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
