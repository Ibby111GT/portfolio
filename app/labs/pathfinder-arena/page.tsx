import type { Metadata } from "next";
import LabShell from "@/components/LabShell";
import AlgorithmSystemsLab from "@/components/labs/AlgorithmSystemsLab";

export const metadata: Metadata = {
  title: "Pathfinder Arena — Algorithm Lab",
  description:
    "Compare A*, Dijkstra, breadth-first, and depth-first search in an editable maze.",
  alternates: { canonical: "/labs/pathfinder-arena" },
  openGraph: {
    title: "Pathfinder Arena — Ibrahim Hussain",
    description:
      "Compare four classic search algorithms exploring the same maze, cell by cell.",
    url: "/labs/pathfinder-arena",
    images: ["/og.png"],
  },
};

export default function PathfinderArenaPage() {
  return (
    <LabShell
      slug="pathfinder-arena"
      eyebrow="Graph search laboratory"
      title="Pathfinder Arena"
      description="Edit one maze and watch A*, Dijkstra, breadth-first, and depth-first search explore it. The tinted footprints show exactly how much work each algorithm does to reach the same goal."
    >
      <AlgorithmSystemsLab mode="pathfinder-arena" />
    </LabShell>
  );
}
