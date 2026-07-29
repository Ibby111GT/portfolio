import Link from "next/link";
import LabCard from "@/components/LabCard";
import Reveal from "@/components/Reveal";
import { LABS } from "@/lib/labs";

export default function LabsPage() {
  return (
    <main className="min-h-screen px-6 pb-32 pt-36 md:px-8 md:pt-44">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            Build / break / learn
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight text-fg md:text-7xl">
            Interactive labs, not screenshots.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
            Four working systems that demonstrate detection thinking and
            data engineering across security, finance, and healthcare. Every
            lab runs entirely in the browser on deterministic synthetic data.
          </p>
          <p className="mt-4 text-base leading-8 text-fg-muted">
            Looking for the command-line security tools too?{" "}
            <Link
              href="/projects"
              className="text-fg underline underline-offset-4 transition-opacity hover:opacity-70"
            >
              See every project in one catalog
            </Link>
            .
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {LABS.map((lab, index) => (
            <Reveal key={lab.slug} delay={index * 90}>
              <LabCard lab={lab} />
            </Reveal>
          ))}
        </div>
      </div>
    </main>
  );
}
