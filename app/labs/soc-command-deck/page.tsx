import type { Metadata } from "next";
import LabCaseStudy from "@/components/LabCaseStudy";
import LabShell from "@/components/LabShell";
import ProjectWalkthrough from "@/components/ProjectWalkthrough";
import SocCommandDeck from "@/components/labs/SocCommandDeck";
import { WALKTHROUGHS } from "@/lib/walkthroughs";

const walkthrough = WALKTHROUGHS["soc-command-deck"];

export const metadata: Metadata = {
  title: "SOC Command Deck — Ibrahim Hussain",
  description:
    "An interactive security operations dashboard: a live synthetic alert stream, analyst triage, a MITRE ATT&CK heatmap, and a real-time risk index. Runs entirely in your browser.",
};

export default function SocCommandDeckPage() {
  return (
    <LabShell
      slug="soc-command-deck"
      eyebrow="Security operations · interactive dashboard"
      title="SOC Command Deck"
      description="Step into the analyst's seat. A live stream of synthetic detections arrives on the clock — acknowledge, escalate, and resolve them while the KPIs, MITRE ATT&CK heatmap, and risk index recompute in real time. The same detection logic behind the LogSentry tool, expressed as a product you can operate."
    >
      <SocCommandDeck />
      <ProjectWalkthrough
        plain={walkthrough.plain}
        steps={walkthrough.steps}
        reading={walkthrough.reading}
        practical={walkthrough.practical}
      />
      <LabCaseStudy
        challenge="Security teams drown in isolated alerts. The hard skill is not spotting one signal — it is triaging a moving queue under time pressure, deciding what to escalate, and keeping a live read on how exposed the organization is right now."
        solution="SOC Command Deck recreates that seat. A seeded generator streams believable detections tagged to MITRE ATT&CK tactics; the analyst triages each one and can inject an attack burst to feel the queue spike. Every action instantly recomputes the open-alert KPIs, the tactic heatmap, and a weighted risk index — the numbers a shift lead actually watches."
        architecture={[
          "Alert generator — a deterministic PRNG produces detections from a rule table modeled on real logsentry signals, each carrying tactic, host, actor, and severity.",
          "Triage state machine — every alert moves new → acknowledged → escalated → resolved, and each transition is reflected across the whole dashboard.",
          "Risk index — a severity-weighted score over the active queue, escalations weighted higher, sampled onto a live trend line.",
          "MITRE ATT&CK heatmap — active alert weight bucketed by tactic and shaded by intensity, so hot techniques surface at a glance.",
          "Bounded live feed — the queue self-prunes resolved rows so it streams indefinitely without unbounded growth.",
        ]}
        decisions={[
          "Make it operable, not just watchable: the value is in triaging, so every control changes the numbers.",
          "Weight escalations into the risk score — an escalated critical should read hotter than an untouched one.",
          "Keep it fully synthetic and offline: no real telemetry, no network, safe to run anywhere.",
        ]}
        competencies={[
          "Security operations & alert triage",
          "MITRE ATT&CK tactic mapping",
          "Detection engineering intuition",
          "Real-time dashboard & state design",
        ]}
        outcomes={[
          { value: "14", label: "Detection rules across 10 ATT&CK tactics" },
          { value: "Live", label: "Streaming queue with analyst triage" },
          { value: "0", label: "Network calls — fully client-side" },
          { value: "100%", label: "Synthetic data — safe to operate" },
        ]}
      />
    </LabShell>
  );
}
