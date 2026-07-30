import type { Metadata } from "next";
import LabCaseStudy from "@/components/LabCaseStudy";
import LabShell from "@/components/LabShell";
import ProjectWalkthrough from "@/components/ProjectWalkthrough";
import DataPipelineLab from "@/components/labs/DataPipelineLab";
import { DATA_SCENARIOS } from "@/lib/dataScenarios";
import { WALKTHROUGHS } from "@/lib/walkthroughs";

const scenario = DATA_SCENARIOS.cybersecurity;
const walkthrough = WALKTHROUGHS["data-systems/cybersecurity"];

export const metadata: Metadata = {
  title: "SentinelStream Security Data Lab — Ibrahim Hussain",
  description:
    "Run, break, and recover a governed cybersecurity telemetry pipeline across ingestion, storage, transformation, analytics, and observability.",
};

export default function CybersecurityDataSystemsPage() {
  return (
    <LabShell
      eyebrow={scenario.eyebrow}
      title={scenario.title}
      description="Run a governed security telemetry pipeline end to end: ingest identity, endpoint, and cloud events, watch them land in bronze, silver, and gold zones, then inject a schema fault and recover from quarantine."
    >
      <DataPipelineLab scenario={scenario} />
      <ProjectWalkthrough
        plain={walkthrough.plain}
        steps={walkthrough.steps}
        reading={walkthrough.reading}
        practical={walkthrough.practical}
      />
      <LabCaseStudy
        challenge={scenario.caseStudy.challenge}
        solution={scenario.caseStudy.solution}
        architecture={scenario.caseStudy.architecture}
        decisions={scenario.caseStudy.decisions}
        competencies={scenario.caseStudy.competencies}
        outcomes={scenario.caseStudy.outcomes}
      />
    </LabShell>
  );
}
