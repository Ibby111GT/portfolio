import type { Metadata } from "next";
import AgentFoundry from "@/components/labs/AgentFoundry";

export const metadata: Metadata = {
  title: "Agent/Foundry — Local Retrieval Agent Factory",
  description:
    "Build a role-specific, citation-first document agent and inspect its complete local retrieval pipeline.",
  alternates: { canonical: "/labs/agent-foundry" },
  openGraph: {
    title: "Agent/Foundry — Local Retrieval Agent Factory",
    description:
      "A working, local-first agent factory for document ingestion, retrieval, grounding, and manifest export.",
    url: "/labs/agent-foundry",
    type: "website",
    images: ["/og.png"],
  },
};

export default function AgentFoundryPage() {
  return <AgentFoundry />;
}
