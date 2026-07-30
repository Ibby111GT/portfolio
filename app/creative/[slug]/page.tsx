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
  "continuum-engine": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/ContinuumEngine"),
    { loading: LoadingCreativeExperience },
  ),
  "digital-biosphere": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/DigitalBiosphere"),
    { loading: LoadingCreativeExperience },
  ),
  murmuration: dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/EmergentSystems"),
    { loading: LoadingCreativeExperience },
  ),
  "automata-atlas": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/EmergentSystems"),
    { loading: LoadingCreativeExperience },
  ),
  "load-path": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/EmergentSystems"),
    { loading: LoadingCreativeExperience },
  ),
  terraform: dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/EmergentSystems"),
    { loading: LoadingCreativeExperience },
  ),
  "blocktown-stories": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/PlayableWorlds"),
    { loading: LoadingCreativeExperience },
  ),
  "slipstream-circuit": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/PlayableWorlds"),
    { loading: LoadingCreativeExperience },
  ),
  "lantern-vale": dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/PlayableWorlds"),
    { loading: LoadingCreativeExperience },
  ),
  frameforge: dynamic<CreativeExperienceProps>(
    () => import("@/components/creative/PlayableWorlds"),
    { loading: LoadingCreativeExperience },
  ),
};

export function generateStaticParams() {
  return CREATIVE_PROJECTS.map((project) => ({ slug: project.slug }));
}

// Unknown slugs get a real HTTP 404 instead of a 200 with a client-rendered
// not-found panel (a soft 404 to crawlers).
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = CREATIVE_PROJECTS.find((item) => item.slug === slug);
  const title = project
    ? `${project.title} — Interactive Creative Prototype`
    : "Creative Project — Ibrahim Hussain";

  return {
    title,
    description: project?.description,
    alternates: { canonical: `/creative/${slug}` },
    openGraph: {
      title,
      description: project?.description,
      url: `/creative/${slug}`,
      type: "article",
      images: ["/og.png"],
    },
    twitter: { title, description: project?.description },
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
