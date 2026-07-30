import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import {
  CREATIVE_PROJECTS,
  type CreativeProject,
} from "@/lib/creativeProjects";

interface CreativeExperienceProps {
  project: CreativeProject;
}

function LoadingCreativeExperience() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] px-6 text-white">
      <div className="text-center">
        <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-white" />
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
          Loading interactive system
        </p>
      </div>
    </main>
  );
}

const EXPERIENCES: Record<
  string,
  ComponentType<CreativeExperienceProps>
> = {
  "cabinetry-studio": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/CabinetryStudio"),
    { loading: LoadingCreativeExperience },
  ),
  "panel-studio": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/PanelStudio"),
    { loading: LoadingCreativeExperience },
  ),
  "wardrobe-atelier": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/WardrobeAtelier"),
    { loading: LoadingCreativeExperience },
  ),
  "wood-object-index": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/WoodObjectIndex"),
    { loading: LoadingCreativeExperience },
  ),
  "apex-hypercars": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/VelocityAtelier"),
    { loading: LoadingCreativeExperience },
  ),
  "park-operator": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/AtlasImpossible"),
    { loading: LoadingCreativeExperience },
  ),
  "signal-bloom": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/SignalBloom"),
    { loading: LoadingCreativeExperience },
  ),
  "sentinel-observatory": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/SentinelObservatory"),
    { loading: LoadingCreativeExperience },
  ),
  verdant: dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/Verdant"),
    { loading: LoadingCreativeExperience },
  ),
  "lumen-city": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/LumenCity"),
    { loading: LoadingCreativeExperience },
  ),
};

export function generateStaticParams() {
  return CREATIVE_PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = CREATIVE_PROJECTS.find((item) => item.slug === slug);

  return {
    title: project
      ? `${project.title} — Interactive Creative Prototype`
      : "Creative Project — Ibrahim Hussain",
    description: project?.description,
  };
}

export default async function CreativeProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = CREATIVE_PROJECTS.find((item) => item.slug === slug);
  const Experience = EXPERIENCES[slug];

  if (!project || !Experience) {
    notFound();
  }

  return <Experience project={project} />;
}
