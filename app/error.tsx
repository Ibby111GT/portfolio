"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[80vh] place-items-center px-5 py-24">
      <section
        role="alert"
        className="mx-auto w-full max-w-2xl border border-alert/35 bg-[var(--surface)] p-7 shadow-2xl shadow-black/10 sm:p-10"
      >
        <div className="flex h-11 w-11 items-center justify-center border border-alert/35 bg-alert/10 text-alert">
          <TriangleAlert size={20} aria-hidden="true" />
        </div>
        <p className="mt-6 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-alert">
          Interface recovery
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          This module did not load cleanly.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--muted)] sm:text-base">
          Your browser session is safe. Retry the module; if the problem
          remains, return to the project catalog and open another experience.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex min-h-11 items-center gap-2 bg-[var(--foreground)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--background)] transition-opacity hover:opacity-80"
        >
          <RotateCcw size={15} aria-hidden="true" />
          Retry module
        </button>
      </section>
    </main>
  );
}
