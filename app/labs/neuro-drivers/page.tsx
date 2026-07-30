import type { Metadata } from "next";
import AlgorithmSystemsLab from "@/components/labs/AlgorithmSystemsLab";

export const metadata: Metadata = {
  title: "Neuro Drivers — Evolutionary Neural Lab",
  description: "Inspect live neural activations while a population evolves steering behavior.",
  alternates: { canonical: "/labs/neuro-drivers" },
};

export default function NeuroDriversPage() {
  return <AlgorithmSystemsLab mode="neuro-drivers" />;
}
