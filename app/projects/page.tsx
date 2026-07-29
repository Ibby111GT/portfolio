import ProjectCatalog from "@/components/ProjectCatalog";
import Reveal from "@/components/Reveal";

export const metadata = {
  title: "Projects — Ibrahim Hussain",
  description:
    "One catalog of working security tools, browser labs, data applications, and professional case studies, each with a plain-English walkthrough.",
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen px-6 pb-32 pt-36 md:px-8 md:pt-44">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            Build / break / learn
          </p>
          <h1 className="mt-4 max-w-4xl text-5xl font-bold tracking-tight text-fg md:text-7xl">
            Everything I have built, in one place.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
            This is the single catalog: working browser labs, downloadable
            tools, data applications, and professional case studies. Every
            entry explains what to do, what you are looking at, how it works,
            and where someone would use it — no specialist background needed.
          </p>
        </Reveal>

        <Reveal className="mt-14" delay={80}>
          <ProjectCatalog />
        </Reveal>
      </div>
    </main>
  );
}
