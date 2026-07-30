import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-[80vh] place-items-center px-5 py-24">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-surface p-7 shadow-2xl shadow-black/10 sm:p-10">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
          404 · route not found
        </p>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">
          This path is off the map.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-fg-muted sm:text-base">
          The page may have moved, but every working lab, project, and case
          study is still available from the main catalog.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-bg transition-opacity hover:opacity-80"
          >
            <Compass size={15} aria-hidden="true" />
            Browse projects
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
