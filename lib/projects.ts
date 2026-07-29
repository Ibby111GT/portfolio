export type ProjectKind = "lab" | "tool" | "case";
export type ProjectFilter = "security" | "data" | "work";
export type ProjectAccent = "cyan" | "lime" | "amber" | "red" | "violet";

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
  accent: ProjectAccent;
}

export const FILTERS: Array<{ id: ProjectFilter | "all"; label: string }> = [
  { id: "all", label: "Everything" },
  { id: "security", label: "Cybersecurity" },
  { id: "data", label: "Data & healthcare" },
  { id: "work", label: "Professional case studies" },
];

export const PROJECTS: CatalogProject[] = [
  {
    slug: "threat-hunt",
    name: "SignalTrace",
    kind: "lab",
    category: "Detection engineering",
    filter: "security",
    tagline: "Investigate a simulated account takeover and prove the attack chain.",
    plain:
      "A hands-on security investigation. Twelve log entries, some of them an attacker, most of them ordinary staff. Pick the evidence that proves the break-in and get scored on accuracy.",
    href: "/labs/threat-hunt",
    stack: ["React", "TypeScript", "MITRE ATT&CK"],
    signal: "12 events - runs in your browser",
    accent: "cyan",
  },
  {
    slug: "sentinelstream",
    name: "SentinelStream",
    kind: "lab",
    category: "Cybersecurity data engineering",
    filter: "data",
    tagline: "Turn identity, endpoint, and cloud telemetry into detection-ready data.",
    plain:
      "A working data pipeline you can run, break, and repair. It shows how scattered security logs become a short list of things worth investigating - and what happens when a source system changes format.",
    href: "/labs/data-systems/cybersecurity",
    stack: ["Pipeline design", "Data contracts", "NIST controls"],
    signal: "1.28M records - runs in your browser",
    accent: "lime",
  },
  {
    slug: "ledgerpulse",
    name: "LedgerPulse",
    kind: "lab",
    category: "Finance data engineering",
    filter: "data",
    tagline: "Reconcile ledger, billing, and forecast data into trusted numbers.",
    plain:
      "The plumbing behind a clean month-end close: match invoices to the accounting ledger automatically, quarantine what does not line up, and hand a person only the genuine exceptions.",
    href: "/labs/data-systems/finance",
    stack: ["Reconciliation", "Dimensional modeling", "SOX controls"],
    signal: "486K records - runs in your browser",
    accent: "amber",
  },
  {
    slug: "careflow",
    name: "CareFlow",
    kind: "lab",
    category: "Healthcare data engineering",
    filter: "data",
    tagline: "Harmonize clinical, claims, and lab feeds without exposing patient data.",
    plain:
      "One patient visit is recorded in three unconnected hospital systems. This pipeline stitches them into a single operational picture while keeping protected health information locked down.",
    href: "/labs/data-systems/healthcare",
    stack: ["FHIR / HL7", "Data quality", "HIPAA controls"],
    signal: "742K records - runs in your browser",
    accent: "red",
  },
  {
    slug: "threatlens",
    name: "ThreatLens",
    kind: "tool",
    category: "Threat intelligence",
    filter: "security",
    tagline: "Triage suspicious addresses, domains, and file hashes offline.",
    plain:
      "Paste in an IP address, domain, or file fingerprint and get back a risk score with the reasoning - no paid subscription and no API key required.",
    href: "/projects/threatlens",
    repo: "https://github.com/Ibby111GT/threatlens",
    stack: ["Python", "MITRE ATT&CK", "Zero dependencies"],
    signal: "10 tests passing",
    accent: "violet",
  },
  {
    slug: "netrecon",
    name: "NetRecon",
    kind: "tool",
    category: "Network security",
    filter: "security",
    tagline: "Find which doors are open on a machine you are authorized to test.",
    plain:
      "A port scanner: it checks which network services a computer is exposing, identifies what they are, and reports anything that should not be reachable.",
    href: "/projects/netrecon",
    repo: "https://github.com/Ibby111GT/netrecon",
    stack: ["Python", "Concurrency", "Sockets"],
    signal: "56 tests passing · safe demo",
    accent: "cyan",
  },
  {
    slug: "logsentry",
    name: "LogSentry",
    kind: "tool",
    category: "Log analysis",
    filter: "security",
    tagline: "Read server logs and surface the handful of lines that matter.",
    plain:
      "Servers record millions of routine events. This reads through them and flags the patterns that suggest someone is trying to break in, ranked by how serious they are.",
    href: "/projects/logsentry",
    repo: "https://github.com/Ibby111GT/logsentry",
    stack: ["Python", "Detection rules", "MITRE ATT&CK"],
    signal: "54 tests passing · 12 rules",
    accent: "amber",
  },
  {
    slug: "passaudit",
    name: "PassAudit",
    kind: "tool",
    category: "Identity security",
    filter: "security",
    tagline: "Check password strength against current NIST-informed guidance.",
    plain:
      "Tests how easily a password could be guessed, using modern rules: length matters far more than cramming in symbols, and anything already on a breach list is worthless.",
    href: "/projects/passaudit",
    repo: "https://github.com/Ibby111GT/passaudit",
    stack: ["Python", "NIST SP 800-63B-4", "Entropy analysis"],
    signal: "58 tests passing · fully offline",
    accent: "lime",
  },
  {
    slug: "webrecon",
    name: "WebRecon",
    kind: "tool",
    category: "Web security",
    filter: "security",
    tagline: "Inspect a website's public security configuration.",
    plain:
      "Looks at the settings a website publishes to every visitor - its security headers, cookie flags, and certificate - and reports what is missing or expiring.",
    href: "/projects/webrecon",
    repo: "https://github.com/Ibby111GT/webrecon",
    stack: ["Python", "TLS", "HTTP security headers"],
    signal: "30 tests passing · read-only",
    accent: "violet",
  },
  {
    slug: "peptides",
    name: "Peptide Evidence Explorer",
    kind: "tool",
    category: "Healthcare data operations",
    filter: "data",
    tagline: "Make synthetic research records searchable, traceable, and ready to review.",
    plain:
      "A working healthcare data application that turns scattered fictional study records into one governed registry. Filter the data, inspect its source history, compare programs, and export the exact view on screen.",
    href: "/projects/peptides",
    repo: "https://github.com/Ibby111GT/Peptides",
    stack: ["JavaScript", "Data quality", "Provenance"],
    signal: "Live demo · 11 integrity tests",
    accent: "red",
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
    tagline: "Detection dashboards and endpoint hardening at enterprise scale.",
    plain:
      "Built dashboards that watch for unusual logins across university systems, and rolled out automatic local-administrator password rotation to more than 500 computers.",
    href: "/work/ut-system-security",
    stack: ["SPL dashboards", "Windows LAPS", "Intune"],
    signal: "500+ endpoints hardened",
    accent: "cyan",
  },
  {
    slug: "private-ai-feasibility",
    name: "Private AI Feasibility Study",
    kind: "case",
    category: "Senior capstone consulting",
    filter: "work",
    tagline: "Led a five-person team advising on private AI infrastructure.",
    plain:
      "Ran the consulting engagement that answered whether an organization working with a city government could run AI on its own hardware instead of sending sensitive data to a public cloud.",
    href: "/work/private-ai-feasibility",
    stack: ["Feasibility analysis", "Data governance", "Client delivery"],
    signal: "Top 15 of 6,000+ students",
    accent: "violet",
  },
  {
    slug: "chief-technology-group",
    name: "Chief Technology Group",
    kind: "case",
    category: "Cloud engineering internship",
    filter: "work",
    tagline: "Azure firewall hardening and least-privilege access for clients.",
    plain:
      "Tightened the firewall and permission rules protecting client cloud environments, and resolved more than 200 support incidents while keeping those systems available.",
    href: "/work/chief-technology-group",
    stack: ["Azure Firewall", "IAM", "Azure DevOps"],
    signal: "200+ incidents resolved",
    accent: "lime",
  },
  {
    slug: "roomi-group",
    name: "Roomi Group Corp",
    kind: "case",
    category: "Identity and access management",
    filter: "work",
    tagline: "Identity lifecycle for a 200-person organization.",
    plain:
      "Owned who could access what for more than 200 employees — setting up accounts on day one, and making sure access was fully removed the day someone left.",
    href: "/work/roomi-group",
    stack: ["Azure AD", "RBAC", "Provisioning"],
    signal: "3+ years, 200+ identities",
    accent: "amber",
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
