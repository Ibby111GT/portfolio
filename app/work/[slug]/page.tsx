import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CaseDiagram from "@/components/CaseDiagram";
import CountUp from "@/components/CountUp";
import DetailFooterNavigation from "@/components/DetailFooterNavigation";
import DetailNavigator from "@/components/DetailNavigator";
import Reveal from "@/components/Reveal";
import PrivateAiLab from "@/components/labs/PrivateAiLab";
import TenantControlPlane from "@/components/labs/TenantControlPlane";
import { CASE_STUDIES, getCaseStudy } from "@/lib/caseStudies";

const PRIVATE_AI_SOURCES = [
  {
    label: "Texas Senate Bill 6 — enrolled text",
    detail: "Large-load interconnection and demand-management framework.",
    href: "https://capitol.texas.gov/tlodocs/89R/billtext/html/SB00006F.htm",
  },
  {
    label: "ERCOT long-term load forecast",
    detail: "2025–2031 forecast update and data-center growth assumptions.",
    href: "https://www.ercot.com/files/docs/2025/04/07/8.1-Long-Term-Load-Forecast-Update-2025-2031-and-Methodology-Changes.pdf",
  },
  {
    label: "Caterpillar G3520K HR",
    detail: "Public 2.5 MW continuous-power generator specification.",
    href: "https://www.cat.com/en_ZA/news/engine-press-releases/caterpillar-unveils-new-g3500k-series-gas-generator-sets.html",
  },
  {
    label: "Lenovo on-premise AI TCO",
    detail: "Public cloud-versus-owned infrastructure assumptions and limits.",
    href: "https://lenovopress.lenovo.com/lp2368-on-premise-vs-cloud-generative-ai-total-cost-of-ownership-2026-edition",
  },
];

interface WorkPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CASE_STUDIES.map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = getCaseStudy(slug);
  return {
    title: study
      ? `${study.title} — Ibrahim Hussain`
      : "Case Study — Ibrahim Hussain",
    description: study?.tagline,
  };
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  if (!study) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg">
      <section
        id="overview"
        className="relative flex scroll-mt-32 flex-col justify-center overflow-hidden"
      >
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-32 md:pt-40 pb-16 w-full">
          <Link
            href="/projects#professional-work"
            className="inline-flex min-h-11 items-center text-sm text-fg-muted transition-colors hover:text-fg"
          >
            ← Professional work
          </Link>
          <div className="flex flex-col items-center text-center mb-16">
            <Reveal className="flex items-center gap-2.5 mb-6 flex-wrap justify-center">
              {study.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] md:text-xs uppercase tracking-widest text-fg-muted bg-surface border border-border rounded-md px-2.5 py-1"
                >
                  {tag}
                </span>
              ))}
            </Reveal>
            <Reveal blur delay={100}>
              <h1 className="text-4xl md:text-6xl font-bold text-fg leading-tight tracking-tight mb-4">
                {study.title}
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-xl md:text-2xl text-fg-muted font-light max-w-xl mb-8">
                {study.tagline}
              </p>
            </Reveal>
            <Reveal delay={280}>
              <p className="text-base text-fg-muted max-w-lg leading-relaxed mb-10">
                {study.description}
              </p>
            </Reveal>
            <Reveal delay={360} className="w-full max-w-2xl">
              <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-border rounded-2xl overflow-hidden border border-border bg-surface/60">
                {study.stats.slice(0, 3).map((stat) => (
                  <div key={stat.label} className="px-4 py-5 text-center">
                    <p className="text-xl md:text-2xl font-semibold text-fg">
                      <CountUp
                        value={stat.value}
                        prefix={stat.prefix}
                        suffix={stat.suffix}
                      />
                    </p>
                    <p className="mt-1 text-[10px] md:text-[11px] uppercase tracking-wider text-fg-muted">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <CaseDiagram diagram={study.diagram} />
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-12 md:px-8">
        <DetailNavigator
          readingTime="3 min summary · 10 min full case"
          label="Choose your depth"
          items={[
            { href: "#plain-english", label: "Plain-English summary" },
            ...(study.slug === "private-ai-feasibility"
              ? [{ href: "#experience", label: "Explore the model" }]
              : []),
            { href: "#technical-details", label: "Decisions & evidence" },
            { href: "#outcomes", label: "Outcomes" },
          ]}
        />
      </div>

      <section
        id="plain-english"
        className="scroll-mt-32 border-y border-border bg-surface/25 py-20 md:py-24"
      >
        <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-[0.8fr_1.2fr] md:px-8">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted mb-4">
              Plain-English walkthrough
            </p>
            <h2 className="max-w-sm text-3xl font-bold tracking-tight text-fg md:text-4xl">
              What this work means in practice.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-base leading-8 text-fg-muted">
              {study.plainLanguage}
            </p>
            <div className="mt-8 grid gap-4">
              {study.whatToLookFor.map((item, index) => (
                <div
                  key={item}
                  className="flex gap-4 rounded-xl border border-border bg-bg/70 p-4"
                >
                  <span className="font-mono text-xs text-fg-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-6 text-fg-muted">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-border bg-bg/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg">
                Practical use
              </p>
              <p className="mt-3 text-sm leading-7 text-fg-muted">
                {study.practicalUse}
              </p>
            </div>
            <div className="mt-4 rounded-xl border border-border bg-bg/70 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg">
                Evidence and confidentiality
              </p>
              <p className="mt-3 text-sm leading-7 text-fg-muted">
                {study.evidenceBoundary}
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {study.slug === "private-ai-feasibility" ? (
        <section
          id="experience"
          className="mx-auto max-w-6xl scroll-mt-32 px-6 py-20 md:px-8 md:py-24"
        >
          <Reveal>
            <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted mb-4">
              Explore the analysis
            </p>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-fg md:text-4xl">
              The constraint we designed inside.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted">
              Move the facility size and switch the power sources on and off. The
              two things the whole recommendation rested on — staying under the
              legal threshold, and taking nothing from the public grid — either
              hold or break in front of you.
            </p>
          </Reveal>
          <Reveal delay={100} className="mt-10">
            <PrivateAiLab />
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-4 text-xs leading-6 text-fg-muted">
              Simplified model built from the team&apos;s final deliverables. Component
              specifications, the 75 MW threshold, and the scoring criteria are the
              study&apos;s own; the arithmetic is illustrative rather than an
              engineering sizing tool.
            </p>
          </Reveal>

          <Reveal className="mt-24">
            <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted mb-4">
              Beyond the study
            </p>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-fg md:text-4xl">
              The layer that decides whether it sells.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted">
              The study proves the facility can be built. It stops before the
              operational question: which tenants actually go in it. For regulated
              customers those are not two decisions — a megawatt and a compliance
              obligation arrive together, and an operator has to hold both at once.
              This is the control plane I would build for that, and the piece of the
              engagement closest to my own work in identity and access.
            </p>
            <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                "Admit one tenant.",
                "Inspect its imported control gaps.",
                "Remediate a missing control.",
                "Watch readiness change.",
                "Admit all tenants to expose the capacity limit.",
              ].map((step, index) => (
                <li
                  key={step}
                  className="rounded-xl border border-border bg-surface/50 p-4"
                >
                  <span className="font-mono text-[10px] text-fg-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-2 text-xs leading-5 text-fg-muted">{step}</p>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={100} className="mt-10">
            <TenantControlPlane />
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-4 text-xs leading-6 text-fg-muted">
              Tenants are synthetic. The control mappings — isolation, audit
              logging, data-handling agreements, residency, and access review —
              are representative operating assumptions, not an exhaustive legal
              or compliance checklist.
            </p>
          </Reveal>
        </section>
      ) : null}

      <section
        id="technical-details"
        className="mx-auto max-w-5xl scroll-mt-32 px-6 py-24 md:px-8 md:py-32"
      >
        <Reveal>
          <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted mb-4">
            The Problem
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-fg mb-6 max-w-xl tracking-tight">
            {study.problem.title}
          </h2>
          <p className="text-base text-fg-muted max-w-lg leading-relaxed">
            {study.problem.body}
          </p>
        </Reveal>
      </section>

      <section className="py-24 md:py-32 border-y border-border">
        <div className="max-w-3xl mx-auto px-6 md:px-8 flex flex-col items-center text-center gap-8">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted">
              Goal
            </p>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl md:text-5xl font-bold text-fg leading-tight tracking-tight">
              {study.tagline}
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <div className="flex flex-wrap justify-center gap-3">
              {study.goals.map((goal) => (
                <span
                  key={goal}
                  className="px-4 py-2 rounded-full border border-border bg-surface text-sm text-fg"
                >
                  {goal}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="py-24 md:py-32 max-w-5xl mx-auto px-6 md:px-8">
        <Reveal>
          <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted mb-4">
            What I Did
          </p>
        </Reveal>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {study.actions.map((action, index) => (
            <Reveal key={action.title} delay={index * 80}>
              <div className="h-full p-6 md:p-8 rounded-2xl border border-border bg-surface/60 flex flex-col gap-3">
                <span className="text-sm font-semibold tracking-widest uppercase text-fg-muted">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-fg tracking-tight">
                  {action.title}
                </h3>
                <p className="text-sm md:text-base text-fg-muted leading-relaxed">
                  {action.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id="outcomes"
        className="scroll-mt-32 border-t border-border bg-surface/30 py-24 md:py-32"
      >
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <Reveal className="flex flex-col items-center text-center mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted mb-4">
              {study.slug === "private-ai-feasibility"
                ? "Modeled recommendation"
                : "Outcomes"}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-fg tracking-tight">
              {study.slug === "private-ai-feasibility"
                ? "What the feasibility model projected."
                : "What it added up to."}
            </h2>
            {study.slug === "private-ai-feasibility" ? (
              <p className="mt-4 max-w-xl text-sm leading-6 text-fg-muted">
                Capstone feasibility model · proposed facility not constructed.
                Values below describe the evaluated scenario and design targets,
                not realized investment or operating performance.
              </p>
            ) : null}
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {study.outcomes.map((stat) => (
              <Reveal key={stat.label}>
                <div className="p-5 rounded-2xl border border-border bg-bg text-center h-full">
                  <p className="text-2xl md:text-3xl font-semibold text-fg">
                    <CountUp
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </p>
                  <p className="mt-1.5 text-[11px] uppercase tracking-wider text-fg-muted">
                    {stat.label}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24 border-t border-border">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <Reveal>
            <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted mb-8">
              Learnings
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {study.learnings.map((learning, index) => (
              <Reveal key={learning} delay={index * 100}>
                <div className="flex flex-col gap-4">
                  <span className="text-2xl text-fg-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base text-fg leading-relaxed">{learning}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {study.slug === "private-ai-feasibility" ? (
        <section className="border-t border-border bg-surface/20 py-20 md:py-24">
          <div className="mx-auto max-w-5xl px-6 md:px-8">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-fg-muted">
                Sources and assumptions
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-fg md:text-4xl">
                Public references behind the model.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-fg-muted">
                These links support the public regulatory, load-growth,
                equipment, and cost assumptions shown here. Client source
                documents remain private, and every dollar or capacity figure
                on this page should be read as a feasibility input—not a
                construction commitment.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {PRIVATE_AI_SOURCES.map((source, index) => (
                <Reveal key={source.href} delay={index * 60}>
                  <a
                    href={source.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex h-full items-start justify-between gap-5 rounded-2xl border border-border bg-bg p-5 transition-colors hover:border-fg/30"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-fg">
                        {source.label}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-fg-muted">
                        {source.detail}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-fg-muted transition-transform group-hover:translate-x-1"
                    >
                      ↗
                    </span>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <div className="mx-auto max-w-5xl px-6 pb-24 pt-8 md:px-8">
        <DetailFooterNavigation
          currentSlug={study.slug}
          collectionLabel="Back to professional work"
        />
      </div>
    </main>
  );
}
