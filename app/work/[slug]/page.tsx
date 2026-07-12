import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";
import { CASE_STUDIES, getCaseStudy } from "@/lib/caseStudies";

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

function HeroVisual({ label }: { label: string }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border shadow-[0_32px_80px_rgba(0,0,0,0.12)] dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)] aspect-[16/8] bg-surface">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 25% 20%, rgba(60,100,255,0.16) 0%, transparent 60%), radial-gradient(ellipse at 80% 85%, rgba(130,60,230,0.14) 0%, transparent 60%)",
        }}
      />
      <span className="absolute bottom-4 left-5 font-mono text-[10px] uppercase tracking-widest text-fg-muted">
        {label}
      </span>
    </div>
  );
}

export default async function WorkPage({ params }: WorkPageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  if (!study) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="fixed top-24 left-6 md:left-10 z-50 hidden md:block">
        <Link
          href="/"
          className="text-sm text-fg-muted hover:text-fg transition-colors duration-200 flex items-center gap-1.5"
        >
          ← Work
        </Link>
      </div>

      <section className="relative flex flex-col justify-center overflow-hidden">
        <div className="relative max-w-5xl mx-auto px-6 md:px-8 pt-32 md:pt-40 pb-16 w-full">
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
            <HeroVisual label={`${study.slug}.overview`} />
          </Reveal>
        </div>
      </section>

      <section className="py-24 md:py-32 max-w-5xl mx-auto px-6 md:px-8">
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

      <section className="py-24 md:py-32 border-t border-border bg-surface/30">
        <div className="max-w-5xl mx-auto px-6 md:px-8">
          <Reveal className="flex flex-col items-center text-center mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase text-fg-muted mb-4">
              Outcomes
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-fg tracking-tight">
              What it added up to.
            </h2>
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
    </main>
  );
}
