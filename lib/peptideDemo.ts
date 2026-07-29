export type PeptideStatus = "Active" | "Completed" | "Paused";
export type PeptideQuality = "Validated" | "Review";

export interface PeptideRecord {
  id: string;
  name: string;
  focus: string;
  stage: string;
  status: PeptideStatus;
  quality: PeptideQuality;
  completeness: number;
  updated: string;
  owner: string;
  source: string;
  sourceId?: string;
  summary: string;
  practical: string;
  lineage: Array<{ step: string; detail: string }>;
}

export const PEPTIDE_RECORDS: PeptideRecord[] = [
  {
    id: "PXR-104",
    name: "Northstar-104",
    focus: "Metabolic signaling",
    stage: "Exploratory cohort",
    status: "Active",
    quality: "Validated",
    completeness: 100,
    updated: "2026-07-24",
    owner: "Metabolic Research Unit",
    source: "Synthetic study operations export",
    sourceId: "SRC-OPS-104-A",
    summary:
      "A fictional early research program used to demonstrate a current, fully traceable record.",
    practical:
      "A coordinator could confirm the latest operational snapshot arrived before a review meeting.",
    lineage: [
      { step: "Ingested", detail: "Received the synthetic operations export." },
      { step: "Validated", detail: "Required identifiers and dates passed." },
      { step: "Published", detail: "Added the normalized record to the registry." },
    ],
  },
  {
    id: "PXR-218",
    name: "Aster-218",
    focus: "Tissue repair signaling",
    stage: "Feasibility review",
    status: "Completed",
    quality: "Validated",
    completeness: 100,
    updated: "2026-07-18",
    owner: "Translational Evidence Team",
    source: "Synthetic document registry",
    sourceId: "SRC-DOC-218-C",
    summary:
      "A fictional completed record with a complete evidence package and provenance trail.",
    practical:
      "A data steward could package a consistent record for review without sharing raw source documents.",
    lineage: [
      { step: "Ingested", detail: "Loaded the synthetic document manifest." },
      { step: "Reconciled", detail: "Matched documents to one program ID." },
      { step: "Closed", detail: "Certified the data package as complete." },
    ],
  },
  {
    id: "PXR-307",
    name: "Meridian-307",
    focus: "Immune response modeling",
    stage: "Data-quality review",
    status: "Paused",
    quality: "Review",
    completeness: 92,
    updated: "2026-06-30",
    owner: "Immunology Data Group",
    source: "Synthetic laboratory feed",
    summary:
      "A fictional paused record intentionally missing a source ID so the quality control has something real to catch.",
    practical:
      "An operations lead would route this record back to its source owner before anybody relies on it.",
    lineage: [
      { step: "Ingested", detail: "Received a partial synthetic laboratory payload." },
      { step: "Quarantined", detail: "Missing source identity prevented certification." },
    ],
  },
  {
    id: "PXR-411",
    name: "Cedar-411",
    focus: "Neuroendocrine signaling",
    stage: "Observational cohort",
    status: "Active",
    quality: "Validated",
    completeness: 100,
    updated: "2026-07-26",
    owner: "Neuroscience Operations",
    source: "Synthetic cohort platform API",
    sourceId: "SRC-API-411-B",
    summary:
      "A fictional API-sourced record with a recent refresh and a fully traceable transformation history.",
    practical:
      "An analyst could verify the scheduled source refresh arrived and compare it with other programs.",
    lineage: [
      { step: "Extracted", detail: "Pulled the synthetic incremental API page." },
      { step: "Deduplicated", detail: "Removed repeated fictional subject keys." },
      { step: "Published", detail: "Updated the normalized cohort snapshot." },
    ],
  },
  {
    id: "PXR-526",
    name: "Harbor-526",
    focus: "Cardiovascular signaling",
    stage: "Retrospective analysis",
    status: "Completed",
    quality: "Validated",
    completeness: 100,
    updated: "2026-07-09",
    owner: "Cardiovascular Analytics",
    source: "Synthetic warehouse snapshot",
    sourceId: "SRC-WHS-526-F",
    summary:
      "A fictional warehouse record demonstrating certified metrics and retained transformation history.",
    practical:
      "A BI analyst could export a governed subset while preserving enough provenance for an audit.",
    lineage: [
      { step: "Snapshotted", detail: "Created the synthetic warehouse extract." },
      { step: "Transformed", detail: "Applied shared fictional measure definitions." },
      { step: "Certified", detail: "Data-quality rules passed for reporting." },
    ],
  },
  {
    id: "PXR-859",
    name: "Willow-859",
    focus: "Endocrine signaling",
    stage: "Protocol planning",
    status: "Paused",
    quality: "Validated",
    completeness: 100,
    updated: "2026-07-03",
    owner: "Protocol Design Office",
    source: "Synthetic planning workbook",
    sourceId: "SRC-PLAN-859-E",
    summary:
      "A fictional planning record showing that paused work can still have complete, trustworthy data.",
    practical:
      "A portfolio lead could separate an operational pause from a data-quality problem.",
    lineage: [
      { step: "Uploaded", detail: "Received the synthetic planning workbook." },
      { step: "Standardized", detail: "Mapped it to the shared registry model." },
      { step: "Paused", detail: "Retained the valid record during review." },
    ],
  },
];

