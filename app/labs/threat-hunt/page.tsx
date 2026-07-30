import type { Metadata } from "next";
import LabCaseStudy from "@/components/LabCaseStudy";
import LabShell from "@/components/LabShell";
import ProjectWalkthrough from "@/components/ProjectWalkthrough";
import ThreatHuntLab from "@/components/labs/ThreatHuntLab";
import { WALKTHROUGHS } from "@/lib/walkthroughs";

const walkthrough = WALKTHROUGHS["threat-hunt"];

export const metadata: Metadata = {
  title: "SignalTrace Threat Hunt — Ibrahim Hussain",
  description:
    "Investigate a synthetic identity-led intrusion across authentication, endpoint, and cloud telemetry, then submit an evidence-scored finding.",
  alternates: { canonical: "/labs/threat-hunt" },
  openGraph: {
    title: "SignalTrace Threat Hunt — Ibrahim Hussain",
    description:
      "Investigate a synthetic identity-led intrusion and submit an evidence-scored finding.",
    url: "/labs/threat-hunt",
    images: ["/og.png"],
  },
};

export default function ThreatHuntPage() {
  return (
    <LabShell
      slug="threat-hunt"
      eyebrow="Detection engineering simulation"
      title="SignalTrace"
      description="Hunt an identity-led intrusion across authentication, endpoint, and cloud telemetry. Select the events that prove the attack chain, then submit your finding."
    >
      <ThreatHuntLab />
      <ProjectWalkthrough
        plain={walkthrough.plain}
        steps={walkthrough.steps}
        reading={walkthrough.reading}
        practical={walkthrough.practical}
      />
      <LabCaseStudy
        challenge="Alert queues show isolated signals - a failed login here, a PowerShell launch there - while real intrusions unfold across identity, endpoint, and cloud telemetry at once. Proving an attack chain means correlating sources under time pressure without drowning in benign noise."
        solution="SignalTrace recreates that decision: a 39-minute MFA-fatigue intrusion hidden inside routine telemetry. The analyst pivots across sources with hunt presets, links evidence to kill-chain objectives, and submits a finding scored on precision - benign selections lower confidence."
        architecture={[
          "Telemetry layer - 12 correlated identity, endpoint, and cloud events with analyst-grade fields: actor, asset, IP, action, tactic, severity.",
          "Attack narrative - an MFA-fatigue compromise chaining initial access, discovery, execution, collection, and persistence.",
          "Hunt console - free-text search, per-source filters, and preset pivots over a live-filtered event table.",
          "Objective tracker - initial access, endpoint execution, and cloud collection link up as supporting evidence is selected.",
          "Scoring engine - precision-weighted confidence where true positives build the case, noise and missed links reduce it.",
        ]}
        decisions={[
          "Bury the attack in believable benign activity - noise is the hard part of hunting.",
          "Score precision, not volume: selecting everything is penalized.",
          "Reward the complete kill chain with a correlation bonus instead of isolated hits.",
        ]}
        competencies={[
          "Threat hunting methodology",
          "MITRE ATT&CK-style tactic mapping",
          "Cross-source telemetry correlation",
          "Evidence-based incident reporting",
        ]}
        outcomes={[
          { value: "12", label: "Correlated events across three telemetry sources" },
          { value: "8", label: "Malicious events hidden in benign noise" },
          { value: "39 min", label: "Attack window to reconstruct" },
          { value: "0", label: "Network calls - fully client-side" },
        ]}
      />
    </LabShell>
  );
}
