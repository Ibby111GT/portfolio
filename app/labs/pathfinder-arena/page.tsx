import type { Metadata } from "next";
import AlgorithmSystemsLab from "@/components/labs/AlgorithmSystemsLab";

export const metadata: Metadata = {
  title: "Pathfinder Arena — Algorithm Lab",
  description: "Compare A*, Dijkstra, breadth-first, and depth-first search in an editable maze.",
  alternates: { canonical: "/labs/pathfinder-arena" },
};

export default function PathfinderArenaPage() {
  return <AlgorithmSystemsLab mode="pathfinder-arena" />;
}
