import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import DetailFooterNavigation from "@/components/DetailFooterNavigation";
import DetailNavigator from "@/components/DetailNavigator";
import { CommandList, OutputBlock } from "@/components/TerminalBlock";
import { TOOL_DOCS, TOOL_SLUGS } from "@/lib/toolProjects";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return TOOL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = TOOL_DOCS[slug];
  return {
    title: doc ? `${doc.name} — Ibrahim Hussain` : "Project — Ibrahim Hussain",
    description: doc?.intro,
  };
}

export default async function ToolProjectPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const doc = TOOL_DOCS[slug];
  if (!doc) notFound();

  return (
    <main className="min-h-screen px-4 pb-28 pt-28 sm:px-6 md:pt-32">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/projects"
          className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-fg"
        >
          &lt;- All projects
        </Link>

        <header className="mb-16 mt-8">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            {doc.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg md:text-6xl">
            {doc.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted md:text-lg">
            {doc.intro}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {doc.liveHref ? (
              <Link
                href={doc.liveHref}
                className="rounded-lg bg-fg px-4 py-2 text-sm font-medium text-bg transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {doc.liveLabel ?? "Open live demo"}
              </Link>
            ) : null}
            <a
              href={doc.repo}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-fg/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              View source on GitHub
            </a>
            <a
              href={`${doc.repo}/actions`}
              target="_blank"
              rel="noreferrer noopener"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-fg/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              View CI verification
            </a>
            <span className="font-mono text-xs text-fg-muted">
              {doc.language}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {doc.stack.map((item) => (
              <span
                key={item}
                className="rounded-full border border-border bg-surface/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-muted"
              >
                {item}
              </span>
            ))}
          </div>
        </header>

        <DetailNavigator
          readingTime="3 min overview · 10 min deep dive"
          label="Choose your depth"
          items={[
            { href: "#overview", label: "Plain-English overview" },
            { href: "#run-it", label: "Run it" },
            { href: "#read-output", label: "Read the output" },
            { href: "#technical-details", label: "Technical details" },
            { href: "#verification", label: "Verification" },
          ]}
          className="mb-14"
        />

        <section
          id="overview"
          className="grid scroll-mt-32 gap-10 border-t border-border pt-14 lg:grid-cols-[0.8fr_1.2fr]"
        >
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
              In plain English
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-fg">
              From problem to working tool.
            </h2>
            <div className="mt-8 rounded-xl border border-border bg-surface/50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
                The problem
              </h3>
              <p className="mt-3 text-sm leading-7 text-fg-muted">
                {doc.problem}
              </p>
            </div>
          </div>
          <div className="space-y-5">
            {doc.plain.map((paragraph) => (
              <p key={paragraph} className="text-base leading-8 text-fg-muted">
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section
          id="run-it"
          className="mt-20 scroll-mt-32 border-t border-border pt-14"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
            Run it yourself
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-fg-muted">
            Copy these in order. The demo needs no arguments, no account, and no
            setup beyond having Python installed.
          </p>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <CommandList label="Quickstart" lines={doc.quickstart} />
            <OutputBlock label={doc.sampleLabel} output={doc.sample} />
          </div>
        </section>

        <section
          id="read-output"
          className="mt-20 scroll-mt-32 border-t border-border pt-14"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
            What you are looking at
          </h2>
          <dl className="mt-8 grid gap-x-10 gap-y-6 md:grid-cols-2">
            {doc.reading.map((item) => (
              <div key={item.label}>
                <dt className="font-mono text-xs uppercase tracking-wider text-fg">
                  {item.label}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-fg-muted">
                  {item.body}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          id="technical-details"
          className="mt-20 scroll-mt-32 border-t border-border pt-14"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-4">
            {doc.howItWorks.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-5 border-b border-border pb-4"
              >
                <span className="font-mono text-xs text-fg-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-fg-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          id="verification"
          className="mt-20 grid scroll-mt-32 gap-10 border-t border-border pt-14 lg:grid-cols-2"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-fg md:text-3xl">
              Where this is used
            </h2>
            <ul className="mt-6 space-y-4">
              {doc.practical.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-fg-muted">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface/50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
                Safety and scope
              </h3>
              <p className="mt-3 text-sm leading-7 text-fg-muted">{doc.safety}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface/50 p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
                Verified locally
              </h3>
              <ul className="mt-3 space-y-2">
                {doc.verified.map((item) => (
                  <li
                    key={item}
                    className="font-mono text-[11px] leading-5 text-fg-muted"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
        <DetailFooterNavigation currentSlug={slug} className="mt-24" />
      </div>
    </main>
  );
}
