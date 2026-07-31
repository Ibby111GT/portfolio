import type { Metadata } from "next";
import LabShell from "@/components/LabShell";
import AlgorithmSystemsLab from "@/components/labs/AlgorithmSystemsLab";

export const metadata: Metadata = {
  title: "Flowline — Autonomous Factory Lab",
  description:
    "Operate an autonomous material-handling simulation with queues, AGVs, and rerouting.",
  alternates: { canonical: "/labs/flowline" },
  openGraph: {
    title: "Flowline — Ibrahim Hussain",
    description:
      "An agent-based material-handling simulation with real queues, failures, and rerouting.",
    url: "/labs/flowline",
    images: ["/og.png"],
  },
};

export default function FlowlinePage() {
  return (
    <LabShell
      slug="flowline"
      eyebrow="Industrial systems simulation"
      title="Flowline"
      description="Run a small factory floor: lots queue at each station, autonomous vehicles carry them downstream, and breaking a machine forces the whole line to reroute. Throughput and bottlenecks respond in real time."
    >
      <AlgorithmSystemsLab mode="flowline" />
    </LabShell>
  );
}
