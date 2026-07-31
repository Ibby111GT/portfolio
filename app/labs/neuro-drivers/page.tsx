import type { Metadata } from "next";
import LabShell from "@/components/LabShell";
import AlgorithmSystemsLab from "@/components/labs/AlgorithmSystemsLab";

export const metadata: Metadata = {
  title: "Neuro Drivers — Evolutionary Neural Lab",
  description:
    "Inspect live neural activations while a population evolves steering behavior.",
  alternates: { canonical: "/labs/neuro-drivers" },
  openGraph: {
    title: "Neuro Drivers — Ibrahim Hussain",
    description:
      "A hand-built 5-6-2 neural network evolved generation by generation, with a live layer inspector.",
    url: "/labs/neuro-drivers",
    images: ["/og.png"],
  },
};

export default function NeuroDriversPage() {
  return (
    <LabShell
      slug="neuro-drivers"
      eyebrow="Neuroevolution laboratory"
      title="Neuro Drivers"
      description="A population of tiny neural networks teaches itself to drive a track scattered with obstacles. Select any driver to watch its sensors, hidden layer, and steering outputs activate in real time."
    >
      <AlgorithmSystemsLab mode="neuro-drivers" />
    </LabShell>
  );
}
