import type { Metadata } from "next";
import AlgorithmSystemsLab from "@/components/labs/AlgorithmSystemsLab";

export const metadata: Metadata = {
  title: "Flowline — Autonomous Factory Lab",
  description: "Operate an autonomous material-handling simulation with queues, AGVs, and rerouting.",
  alternates: { canonical: "/labs/flowline" },
};

export default function FlowlinePage() {
  return <AlgorithmSystemsLab mode="flowline" />;
}
