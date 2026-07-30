import { notFound } from "next/navigation";
import AtlasImpossible from "@/components/creative/AtlasImpossible";
import CabinetryStudio from "@/components/creative/CabinetryStudio";
import LumenCity from "@/components/creative/LumenCity";
import PanelStudio from "@/components/creative/PanelStudio";
import SentinelObservatory from "@/components/creative/SentinelObservatory";
import SignalBloom from "@/components/creative/SignalBloom";
import Verdant from "@/components/creative/Verdant";
import WardrobeAtelier from "@/components/creative/WardrobeAtelier";
import WoodObjectIndex from "@/components/creative/WoodObjectIndex";
import VelocityAtelier from "@/components/creative/VelocityAtelier";
import { CREATIVE_PROJECTS } from "@/lib/creativeProjects";

export function generateStaticParams() {
  return CREATIVE_PROJECTS.map((project) => ({ slug: project.slug }));
}

export default async function CreativeProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = CREATIVE_PROJECTS.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  switch (project.slug) {
    case "cabinetry-studio":
      return <CabinetryStudio project={project} />;
    case "panel-studio":
      return <PanelStudio project={project} />;
    case "wardrobe-atelier":
      return <WardrobeAtelier project={project} />;
    case "wood-object-index":
      return <WoodObjectIndex project={project} />;
    case "apex-hypercars":
      return <VelocityAtelier project={project} />;
    case "park-operator":
      return <AtlasImpossible project={project} />;
    case "signal-bloom":
      return <SignalBloom project={project} />;
    case "sentinel-observatory":
      return <SentinelObservatory project={project} />;
    case "verdant":
      return <Verdant project={project} />;
    case "lumen-city":
      return <LumenCity project={project} />;
    default:
      notFound();
  }
}
