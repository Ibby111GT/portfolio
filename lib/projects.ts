export type ProjectKind = "lab" | "tool" | "case";
export type ProjectFilter = "security" | "data" | "work";
export type ProjectAccent = "blue" | "red";

export interface CatalogProject {
  slug: string;
  name: string;
  kind: ProjectKind;
  category: string;
  filter: ProjectFilter;
  tagline: string;
  plain: string;
  href: string;
  repo?: string;
  stack: string[];
  signal: string;
  /** Automated test count for tool repos — the source of truth for every
   *  aggregate figure on the site, never parsed out of prose. */
  testCount?: number;
  accent: ProjectAccent;
}

export const FILTERS: Array<{ id: ProjectFilter | "all"; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "security", label: "Cybersecurity" },
  { id: "data", label: "Data engineering" },
  { id: "work", label: "Professional case studies" },
];

export const PROJECTS: CatalogProject[] = [
  {
    slug: "soc-command-deck",
    name: "SOC Command Deck",
    kind: "lab",
    category: "Security operations",
    filter: "security",
    tagline:
      "Triage a streaming alert queue and watch risk change with every analyst decision.",
    plain:
      "Sit in the analyst's chair. Synthetic detections stream in on the clock; you acknowledge, escalate, and resolve them while the KPIs, a MITRE ATT&CK heatmap, and a live risk index recompute in real time. LogSentry's detection logic as an operable product.",
    href: "/labs/soc-command-deck",
    stack: ["React", "TypeScript", "MITRE ATT&CK"],
    signal: "14-rule synthetic alert stream",
    accent: "red",
  },
  {
    slug: "security-checkup",
    name: "Security Checkup",
    kind: "lab",
    category: "Identity security",
    filter: "security",
    tagline:
      "Compare safe sample passwords and see exactly which patterns weaken them.",
    plain:
      "A password strength checker you can trust with a password, because it never transmits one. Entropy, a breached-password block-list, and pattern detection all run in your browser — the PassAudit heuristics made useful to anyone.",
    href: "/labs/security-checkup",
    stack: ["TypeScript", "NIST SP 800-63B-4", "Privacy-first"],
    signal: "100% client-side · unit-tested",
    accent: "red",
  },
  {
    slug: "threat-hunt",
    name: "SignalTrace",
    kind: "lab",
    category: "Detection engineering",
    filter: "security",
    tagline: "Find the evidence that proves a simulated account takeover.",
    plain:
      "A hands-on security investigation. Twelve log entries, some of them an attacker, most of them ordinary staff. Pick the evidence that proves the break-in and get scored on accuracy.",
    href: "/labs/threat-hunt",
    stack: ["React", "TypeScript", "MITRE ATT&CK"],
    signal: "12-event synthetic investigation",
    accent: "red",
  },
  {
    slug: "sentinelstream",
    name: "SentinelStream",
    kind: "lab",
    category: "Cybersecurity data engineering",
    filter: "data",
    tagline:
      "Run a security-data pipeline, break its schema, and recover safely.",
    plain:
      "A working data pipeline you can run, break, and repair. It shows how scattered security logs become a short list of things worth investigating - and what happens when a source system changes format.",
    href: "/labs/data-systems/cybersecurity",
    stack: ["Pipeline design", "Data contracts", "NIST controls"],
    signal: "Simulates a 1.28M-event pipeline run",
    accent: "red",
  },
  {
    slug: "ledgerpulse",
    name: "LedgerPulse",
    kind: "lab",
    category: "Finance data engineering",
    filter: "data",
    tagline:
      "Reconcile billing and ledger records, then isolate the exceptions.",
    plain:
      "The plumbing behind a clean month-end close: match invoices to the accounting ledger automatically, quarantine what does not line up, and hand a person only the genuine exceptions.",
    href: "/labs/data-systems/finance",
    stack: ["Reconciliation", "Dimensional modeling", "SOX controls"],
    signal: "Simulates a 486K-record reconciliation",
    accent: "blue",
  },
  {
    slug: "careflow",
    name: "CareFlow",
    kind: "lab",
    category: "Healthcare data engineering",
    filter: "data",
    tagline:
      "Combine clinical, claims, and lab data while protecting patient information.",
    plain:
      "One patient visit is recorded in three unconnected hospital systems. This pipeline stitches them into a single operational picture while keeping protected health information locked down.",
    href: "/labs/data-systems/healthcare",
    stack: ["FHIR / HL7", "Data quality", "HIPAA controls"],
    signal: "Simulates a 742K-record clinical pipeline",
    accent: "blue",
  },
  {
    slug: "threatlens",
    name: "ThreatLens",
    kind: "tool",
    category: "Threat intelligence",
    filter: "security",
    tagline: "Score suspicious IPs, domains, and file hashes offline.",
    plain:
      "Paste in an IP address, domain, or file fingerprint and get back a risk score with the reasoning - no paid subscription and no API key required.",
    href: "/projects/threatlens",
    repo: "https://github.com/Ibby111GT/threatlens",
    stack: ["Python", "MITRE ATT&CK", "Zero dependencies"],
    signal: "30 tests passing",
    testCount: 30,
    accent: "red",
  },
  {
    slug: "netrecon",
    name: "NetRecon",
    kind: "tool",
    category: "Network security",
    filter: "security",
    tagline:
      "Find services exposed by a machine you are authorized to test.",
    plain:
      "A port scanner: it checks which network services a computer is exposing, identifies what they are, and reports anything that should not be reachable.",
    href: "/projects/netrecon",
    repo: "https://github.com/Ibby111GT/netrecon",
    stack: ["Python", "Concurrency", "Sockets"],
    signal: "68 tests passing · safe demo",
    testCount: 68,
    accent: "red",
  },
  {
    slug: "logsentry",
    name: "LogSentry",
    kind: "tool",
    category: "Log analysis",
    filter: "security",
    tagline:
      "Turn noisy server logs into a prioritized list of suspicious activity.",
    plain:
      "Servers record millions of routine events. This reads through them and flags the patterns that suggest someone is trying to break in, ranked by how serious they are.",
    href: "/projects/logsentry",
    repo: "https://github.com/Ibby111GT/logsentry",
    stack: ["Python", "Detection rules", "MITRE ATT&CK"],
    signal: "54 tests passing · 12 rules",
    testCount: 54,
    accent: "red",
  },
  {
    slug: "passaudit",
    name: "PassAudit",
    kind: "tool",
    category: "Identity security",
    filter: "security",
    tagline:
      "Audit password strength offline using length, pattern, and compromised-password checks.",
    plain:
      "Tests how easily a password could be guessed, using modern rules: length matters far more than cramming in symbols, and anything already on a breach list is worthless.",
    href: "/projects/passaudit",
    repo: "https://github.com/Ibby111GT/passaudit",
    stack: ["Python", "NIST SP 800-63B-4", "Entropy analysis"],
    signal: "62 tests passing · fully offline",
    testCount: 62,
    accent: "red",
  },
  {
    slug: "webrecon",
    name: "WebRecon",
    kind: "tool",
    category: "Web security",
    filter: "security",
    tagline:
      "Check the public security settings a website exposes to every visitor.",
    plain:
      "Looks at the settings a website publishes to every visitor - its security headers, cookie flags, and certificate - and reports what is missing or expiring.",
    href: "/projects/webrecon",
    repo: "https://github.com/Ibby111GT/webrecon",
    stack: ["Python", "TLS", "HTTP security headers"],
    signal: "34 tests passing · read-only",
    testCount: 34,
    accent: "red",
  },
  {
    slug: "peptides",
    name: "Peptide Evidence Explorer",
    kind: "tool",
    category: "Healthcare data operations",
    filter: "data",
    tagline:
      "Trace, filter, compare, and export synthetic healthcare research records.",
    plain:
      "A working healthcare data application that turns scattered fictional study records into one governed registry. Filter the data, inspect its source history, compare programs, and export the exact view on screen.",
    href: "/projects/peptides",
    repo: "https://github.com/Ibby111GT/Peptides",
    stack: ["JavaScript", "Data quality", "Provenance"],
    signal: "Live demo · 17 integrity tests",
    testCount: 17,
    accent: "blue",
  },
];

// Professional engagements. These are jobs and client work rather than things
// built from scratch, so they keep their own case-study pages and simply
// appear in the catalog alongside everything else.
export const WORK_PROJECTS: CatalogProject[] = [
  {
    slug: "ut-system-security",
    name: "University of Texas System",
    kind: "case",
    category: "Information security internship",
    filter: "work",
    tagline:
      "Built login-detection dashboards and rotated local administrator passwords across 500+ endpoints.",
    plain:
      "Built dashboards that watch for unusual logins across university systems, and rolled out automatic local-administrator password rotation to more than 500 computers.",
    href: "/work/ut-system-security",
    stack: ["SPL dashboards", "Windows LAPS", "Intune"],
    signal: "500+ endpoints hardened",
    accent: "red",
  },
  {
    slug: "private-ai-feasibility",
    name: "Private AI Feasibility Study",
    kind: "case",
    category: "Senior capstone consulting",
    filter: "work",
    tagline:
      "Led a five-person feasibility study for a sub-75 MW, behind-the-meter AI facility.",
    plain:
      "Led a feasibility engagement assessing whether a sub-75 MW, behind-the-meter AI facility could be sited in Richardson without adding load to the public grid.",
    href: "/work/private-ai-feasibility",
    stack: ["Infrastructure strategy", "Capacity modeling", "Client delivery"],
    signal: "20 MW modeled pilot · below 75 MW threshold",
    accent: "blue",
  },
  {
    slug: "chief-technology-group",
    name: "Chief Technology Group",
    kind: "case",
    category: "Cloud engineering internship",
    filter: "work",
    tagline:
      "Hardened Azure access and firewall policies while resolving 200+ client incidents.",
    plain:
      "Tightened the firewall and permission rules protecting client cloud environments, and resolved more than 200 support incidents while keeping those systems available.",
    href: "/work/chief-technology-group",
    stack: ["Azure Firewall", "IAM", "Azure DevOps"],
    signal: "200+ incidents resolved",
    accent: "blue",
  },
  {
    slug: "roomi-group",
    name: "Roomi Group Corp",
    kind: "case",
    category: "Identity and access management",
    filter: "work",
    tagline:
      "Managed account access from hire to exit for more than 200 employees.",
    plain:
      "Owned who could access what for more than 200 employees — setting up accounts on day one, and making sure access was fully removed the day someone left.",
    href: "/work/roomi-group",
    stack: ["Azure AD", "RBAC", "Provisioning"],
    signal: "3+ years, 200+ identities",
    accent: "blue",
  },
];

export const ALL_CATALOG_ENTRIES: CatalogProject[] = [
  ...PROJECTS,
  ...WORK_PROJECTS,
];

export function getProject(slug: string): CatalogProject | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

export const TOOL_PROJECTS = PROJECTS.filter((project) => project.kind === "tool");
export const LAB_PROJECTS = PROJECTS.filter((project) => project.kind === "lab");

export const TOTAL_TOOL_TESTS = TOOL_PROJECTS.reduce(
  (total, project) => total + (project.testCount ?? 0),
  0,
);
