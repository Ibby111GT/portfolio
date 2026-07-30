export type LabAccent = "blue" | "red";

export interface LabDefinition {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  skills: string[];
  accent: LabAccent;
  signal: string;
}

export const LABS: LabDefinition[] = [
  {
    slug: "soc-command-deck",
    eyebrow: "Security operations",
    title: "SOC Command Deck",
    description:
      "Triage a streaming alert queue while the risk index, live KPIs, and MITRE ATT&CK heatmap respond to every analyst decision.",
    skills: ["Alert triage", "MITRE ATT&CK", "Risk telemetry"],
    accent: "red",
    signal: "Live queue · 14 detection rules",
  },
  {
    slug: "security-checkup",
    eyebrow: "Identity security",
    title: "Security Checkup",
    description:
      "Measure password entropy, breach exposure, and predictable patterns without transmitting or storing the password.",
    skills: ["Privacy by design", "NIST guidance", "Entropy"],
    accent: "red",
    signal: "100% client-side · unit-tested",
  },
  {
    slug: "threat-hunt",
    eyebrow: "Detection engineering",
    title: "SignalTrace",
    description:
      "Investigate a realistic identity attack, pivot through telemetry, and build an evidence-backed incident timeline before the attacker escapes.",
    skills: ["Threat hunting", "MITRE ATT&CK", "Telemetry analysis"],
    accent: "red",
    signal: "12 correlated events",
  },
  {
    slug: "data-systems/cybersecurity",
    eyebrow: "Cybersecurity data engineering",
    title: "SentinelStream",
    description:
      "Normalize identity, endpoint, and cloud telemetry into a governed lakehouse that powers detections, risk scoring, and SOC dashboards.",
    skills: ["Streaming", "Detection data", "NIST controls"],
    accent: "red",
    signal: "1.28M events / run",
  },
  {
    slug: "data-systems/finance",
    eyebrow: "Finance data engineering",
    title: "LedgerPulse",
    description:
      "Unify ledger, billing, and forecast data into reconciled financial models with anomaly detection and SOX-aware governance.",
    skills: ["Data contracts", "Reconciliation", "SOX controls"],
    accent: "blue",
    signal: "486K records / run",
  },
  {
    slug: "data-systems/healthcare",
    eyebrow: "Healthcare data engineering",
    title: "CareFlow",
    description:
      "Transform FHIR, claims, and lab streams into protected clinical data products with quality gates, lineage, and HIPAA controls.",
    skills: ["FHIR", "Data quality", "HIPAA governance"],
    accent: "blue",
    signal: "742K records / run",
  },
];
