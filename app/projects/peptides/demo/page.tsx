import type { Metadata } from "next";
import Link from "next/link";
import PeptideEvidenceLab from "@/components/PeptideEvidenceLab";

export const metadata: Metadata = {
  title: "Peptide Evidence Explorer — Live Demo",
  description:
    "A working synthetic healthcare data registry with quality, provenance, comparison, and export.",
  alternates: { canonical: "/projects/peptides/demo" },
  openGraph: {
    title: "Peptide Evidence Explorer — Live Demo",
    description:
      "A working synthetic healthcare data registry with quality, provenance, comparison, and export.",
    url: "/projects/peptides/demo",
    images: ["/og.png"],
  },
};

export default function PeptideDemoPage() {
  return (
    <main className="min-h-screen px-4 pb-28 pt-28 sm:px-6 md:pt-32">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/projects/peptides"
          className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-fg"
        >
          &lt;- Peptide Evidence Explorer case study
        </Link>

        <header className="mb-10 mt-8 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            Live healthcare data application
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg md:text-6xl">
            Peptide Evidence Explorer
          </h1>
          <p className="mt-4 text-base leading-7 text-fg-muted md:text-lg">
            Search the registry, change the quality filters, open the record
            that needs review, compare up to three programs, and export the
            current view. Every row is fictional.
          </p>
        </header>

        <PeptideEvidenceLab />

        <section className="mt-12 grid gap-5 border-t border-border pt-10 md:grid-cols-3">
          <Explanation
            number="01"
            title="What to do"
            body="Start by filtering Data quality to Review. Open Meridian-307 and read why it was quarantined. Then reset and compare two other records."
          />
          <Explanation
            number="02"
            title="What you are seeing"
            body="Status describes the fictional workflow. Quality describes whether its data is complete and traceable. They are deliberately separate."
          />
          <Explanation
            number="03"
            title="Why it matters"
            body="In real healthcare operations, people need to catch incomplete records and trace values before a report or decision depends on them."
          />
        </section>
      </div>
    </main>
  );
}

function Explanation({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <article className="rounded-xl border border-border bg-surface/40 p-5">
      <p className="font-mono text-[10px] text-fg-muted">{number}</p>
      <h2 className="mt-3 text-lg font-semibold text-fg">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-fg-muted">{body}</p>
    </article>
  );
}

