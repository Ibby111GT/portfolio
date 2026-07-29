export type DataDomain = "cybersecurity" | "finance" | "healthcare";

export interface DataSource {
  name: string;
  kind: string;
  cadence: string;
  volume: number;
}

export interface DataMetric {
  label: string;
  value: string;
  context: string;
}

export interface PreviewRow {
  entity: string;
  source: string;
  status: string;
  score: string;
}

export interface QualityProfile {
  duplicates: number;
  rejected: number;
  goldRows: number;
  quarantine: number;
}

export interface DataScenario {
  slug: DataDomain;
  eyebrow: string;
  title: string;
  description: string;
  accent: "lime" | "amber" | "red";
  records: number;
  warehouse: string;
  model: string;
  policy: string;
  sources: DataSource[];
  metrics: DataMetric[];
  preview: PreviewRow[];
  previewLabels: { entity: string; score: string };
  transforms: string[];
  controls: string[];
  checks: string[];
  quality: QualityProfile;
  fault: string;
  faultRemedy: string;
  faultCheckIndex: number;
  caseStudy: {
    challenge: string;
    solution: string;
    architecture: string[];
    decisions: string[];
    competencies: string[];
    outcomes: Array<{ value: string; label: string }>;
  };
}

export const DATA_SCENARIOS: Record<DataDomain, DataScenario> = {
  cybersecurity: {
    slug: "cybersecurity",
    eyebrow: "Cybersecurity data engineering",
    title: "SentinelStream",
    description:
      "A governed telemetry pipeline that turns identity, endpoint, and cloud events into detection-ready security data.",
    accent: "lime",
    records: 1_284_440,
    warehouse: "Security Lakehouse",
    model: "gold.security_findings",
    policy: "NIST / least privilege",
    sources: [
      { name: "Entra ID", kind: "SaaS API", cadence: "60 sec", volume: 412_480 },
      { name: "Endpoint EDR", kind: "Event stream", cadence: "Live", volume: 761_320 },
      { name: "Cloud audit", kind: "Object files", cadence: "5 min", volume: 110_640 },
    ],
    metrics: [
      { label: "High-risk identities", value: "17", context: "3 require action" },
      { label: "Detection coverage", value: "94.2%", context: "MITRE mapped" },
      { label: "Mean ingest delay", value: "38s", context: "Within SLA" },
    ],
    preview: [
      { entity: "a.chen", source: "identity", status: "Elevated", score: "92" },
      { entity: "FIN-LT-044", source: "endpoint", status: "Investigate", score: "87" },
      { entity: "185.220.101.17", source: "cloud", status: "Blocked", score: "99" },
      { entity: "svc-backup", source: "identity", status: "Cleared", score: "12" },
      { entity: "HQ-WS-112", source: "endpoint", status: "Cleared", score: "8" },
    ],
    previewLabels: { entity: "Entity", score: "Risk" },
    transforms: [
      "Enforce per-source event contracts (fields, types, enums)",
      "Normalize to a common security event model (actor, asset, ip, action)",
      "Resolve identities across Entra ID, EDR, and cloud audit",
      "Deduplicate on (source, event_id), then score entity risk",
    ],
    controls: [
      "NIST 800-53 AC-6 - least-privilege roles on gold models",
      "AU-9 - raw zone is append-only for forensic replay",
      "SC-28 - column-level encryption for tokens and credentials",
    ],
    checks: [
      "Event schema contract",
      "Identity-to-device join",
      "Timestamp freshness",
      "Privileged field access",
    ],
    quality: {
      duplicates: 18_240,
      rejected: 3_112,
      goldRows: 5_214,
      quarantine: 21_466,
    },
    fault: "EDR agent_version changed from string to object",
    faultRemedy:
      "Patch the EDR contract to accept structured agent_version, backfill the parsed field, and replay quarantined events.",
    faultCheckIndex: 0,
    caseStudy: {
      challenge:
        "Security telemetry arrives at different speeds and with incompatible identities, leaving analysts to manually correlate users, devices, IPs, and cloud actions.",
      solution:
        "SentinelStream applies source contracts, normalizes events into a common security model, resolves entities, and publishes detection-ready findings with lineage and access controls.",
      architecture: [
        "Ingestion - Entra ID sign-in API on 60-second pulls, a live EDR event stream, and 5-minute cloud audit file drops land side by side.",
        "Storage - append-only bronze events, validated silver events, and governed gold findings, encrypted with least-privilege roles.",
        "Transformation - schema contracts, normalization into one security event model, identity resolution, and deduplication.",
        "Analytics - MITRE-mapped detection coverage, entity risk scoring, and SOC-facing findings in gold.security_findings.",
        "Observability & governance - stage health, freshness and quality gates, source-to-finding lineage, NIST-aligned controls.",
      ],
      decisions: [
        "Keep raw events immutable for forensic replay.",
        "Use deterministic identity resolution before risk scoring.",
        "Fail closed when critical detection fields drift.",
      ],
      competencies: [
        "Streaming and batch ingestion",
        "Detection engineering data models",
        "Entity resolution and risk scoring",
        "NIST-aligned governance",
      ],
      outcomes: [
        { value: "1.28M", label: "Events processed per simulated run" },
        { value: "38 sec", label: "End-to-end freshness target" },
        { value: "4", label: "Automated quality and control gates" },
        { value: "100%", label: "Lineage from source to finding" },
      ],
    },
  },
  finance: {
    slug: "finance",
    eyebrow: "Finance data engineering",
    title: "LedgerPulse",
    description:
      "A reconciled finance pipeline that combines ledger, billing, and forecast data into trusted operating metrics.",
    accent: "amber",
    records: 486_280,
    warehouse: "Finance Data Warehouse",
    model: "mart.finance_position",
    policy: "SOX / segregation of duties",
    sources: [
      { name: "General ledger", kind: "Database CDC", cadence: "2 min", volume: 297_410 },
      { name: "Billing platform", kind: "SaaS API", cadence: "5 min", volume: 152_330 },
      { name: "Forecast files", kind: "Managed files", cadence: "Daily", volume: 36_540 },
    ],
    metrics: [
      { label: "Cash position", value: "$8.42M", context: "+3.8% this week" },
      { label: "Unreconciled", value: "$12.4K", context: "6 transactions" },
      { label: "Forecast variance", value: "2.1%", context: "Within threshold" },
    ],
    preview: [
      { entity: "INV-10482", source: "billing", status: "Matched", score: "100" },
      { entity: "JE-88210", source: "ledger", status: "Review", score: "74" },
      { entity: "COST-NA-07", source: "forecast", status: "Approved", score: "96" },
      { entity: "INV-10511", source: "billing", status: "Matched", score: "100" },
      { entity: "JE-88342", source: "ledger", status: "Matched", score: "98" },
    ],
    previewLabels: { entity: "Document", score: "Match" },
    transforms: [
      "Validate ledger and billing contracts (account, currency, period)",
      "Conform accounts to a shared chart-of-accounts dimension",
      "Match invoices to journal entries; route breaks to review",
      "Deduplicate CDC replays and snapshot close periods",
    ],
    controls: [
      "SOX - preparer and approver separation on every publish",
      "Immutable close-period snapshots for audit replay",
      "mart.finance_position readable by controller role only",
    ],
    checks: [
      "Debit-credit balance",
      "Invoice-to-ledger match",
      "Close-period freshness",
      "Segregation of duties",
    ],
    quality: {
      duplicates: 4_921,
      rejected: 1_102,
      goldRows: 12_480,
      quarantine: 184,
    },
    fault: "Billing currency_code arrived empty for 184 invoices",
    faultRemedy:
      "Backfill currency_code from each billing account's default currency and replay the 184 quarantined invoices.",
    faultCheckIndex: 1,
    caseStudy: {
      challenge:
        "Finance teams lose time reconciling ledger entries, invoices, and spreadsheet forecasts that update on different schedules and use different account structures.",
      solution:
        "LedgerPulse standardizes account dimensions, matches transactions, quarantines exceptions, and publishes governed finance marts for reporting and anomaly review.",
      architecture: [
        "Ingestion - general-ledger change-data capture every 2 minutes, billing API pulls every 5, and daily managed forecast files.",
        "Storage - immutable bronze transactions, validated silver entries, and governed marts with close-period snapshots.",
        "Transformation - contract validation, chart-of-accounts conforming, invoice-to-ledger matching, and CDC deduplication.",
        "Analytics - cash position, reconciliation exceptions, and forecast variance in mart.finance_position.",
        "Observability & governance - balance and match gates, close-period freshness, lineage, and SOX segregation of duties.",
      ],
      decisions: [
        "Balance every transformation before publishing.",
        "Separate preparer and approver responsibilities.",
        "Preserve close-period snapshots for repeatable reporting.",
      ],
      competencies: [
        "Change-data capture and API ingestion",
        "SQL-style dimensional modeling",
        "Financial reconciliation logic",
        "SOX-aware governance",
      ],
      outcomes: [
        { value: "486K", label: "Records processed per simulated run" },
        { value: "99.7%", label: "Automated transaction match rate" },
        { value: "6", label: "Exceptions routed for review" },
        { value: "2 min", label: "Ledger freshness target" },
      ],
    },
  },
  healthcare: {
    slug: "healthcare",
    eyebrow: "Healthcare data engineering",
    title: "CareFlow",
    description:
      "A protected clinical data pipeline that harmonizes FHIR, claims, and lab feeds into reliable care operations data.",
    accent: "red",
    records: 742_610,
    warehouse: "Protected Health Lake",
    model: "gold.patient_flow",
    policy: "HIPAA / minimum necessary",
    sources: [
      { name: "FHIR encounters", kind: "FHIR API", cadence: "90 sec", volume: 331_270 },
      { name: "Claims clearinghouse", kind: "Secure batch", cadence: "Hourly", volume: 268_190 },
      { name: "Lab results", kind: "HL7 stream", cadence: "Live", volume: 143_150 },
    ],
    metrics: [
      { label: "Active encounters", value: "1,248", context: "Across 4 facilities" },
      { label: "Capacity pressure", value: "82%", context: "2 units elevated" },
      { label: "Quality completeness", value: "99.1%", context: "Above target" },
    ],
    preview: [
      { entity: "ENC-774102", source: "FHIR", status: "Active", score: "98" },
      { entity: "CLM-228441", source: "claims", status: "Validated", score: "100" },
      { entity: "LAB-993820", source: "HL7", status: "Priority", score: "91" },
      { entity: "ENC-774556", source: "FHIR", status: "Discharged", score: "97" },
      { entity: "LAB-993901", source: "HL7", status: "Routine", score: "99" },
    ],
    previewLabels: { entity: "Record", score: "Quality" },
    transforms: [
      "Validate FHIR R4 encounter and X12 837 claim contracts",
      "Tokenize protected identifiers before analytics zones",
      "Resolve patient identity across encounter, claim, and lab",
      "Deduplicate HL7 retransmits and conform code sets",
    ],
    controls: [
      "HIPAA minimum necessary - BI reads de-identified views only",
      "PHI crosswalk restricted to an audited break-glass role",
      "Encryption at rest and in transit across every zone",
    ],
    checks: [
      "FHIR resource validation",
      "Patient identity match",
      "Clinical result freshness",
      "PHI minimum-necessary access",
    ],
    quality: {
      duplicates: 9_845,
      rejected: 2_210,
      goldRows: 8_730,
      quarantine: 12_908,
    },
    fault: "Claims feed changed member_id to subscriber_identifier",
    faultRemedy:
      "Map subscriber_identifier back to member_id in the claims contract and replay the quarantined batch.",
    faultCheckIndex: 1,
    caseStudy: {
      challenge:
        "Clinical, claims, and lab systems describe the same patient journey with different standards, identifiers, and delivery patterns while handling highly sensitive data.",
      solution:
        "CareFlow validates healthcare contracts, tokenizes protected identifiers, resolves patient records, and publishes minimum-necessary operational data products.",
      architecture: [
        "Ingestion - FHIR encounter API every 90 seconds, hourly secure claims batches, and a live HL7 lab stream.",
        "Storage - immutable bronze payloads, tokenized silver records, and governed gold models inside a protected health lake.",
        "Transformation - FHIR and X12 contract validation, PHI tokenization, patient identity resolution, and retransmit deduplication.",
        "Analytics - patient flow, capacity pressure, and data completeness in gold.patient_flow.",
        "Observability & governance - clinical quality gates, freshness monitors, lineage, and HIPAA minimum-necessary access.",
      ],
      decisions: [
        "Tokenize PHI before analytics processing.",
        "Retain source-standard identifiers in a restricted crosswalk.",
        "Quarantine uncertain patient matches instead of guessing.",
      ],
      competencies: [
        "FHIR, HL7, and secure batch ingestion",
        "Master patient identity patterns",
        "Clinical data quality controls",
        "HIPAA-aware access design",
      ],
      outcomes: [
        { value: "742K", label: "Records processed per simulated run" },
        { value: "99.1%", label: "Clinical field completeness" },
        { value: "<90 sec", label: "Encounter freshness target" },
        { value: "0", label: "Raw PHI fields exposed to BI" },
      ],
    },
  },
};

export const DATA_DOMAINS = Object.keys(DATA_SCENARIOS) as DataDomain[];
