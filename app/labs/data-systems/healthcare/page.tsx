import LabCaseStudy from "@/components/LabCaseStudy";
import LabShell from "@/components/LabShell";
import ProjectWalkthrough from "@/components/ProjectWalkthrough";
import DataPipelineLab from "@/components/labs/DataPipelineLab";
import { DATA_SCENARIOS } from "@/lib/dataScenarios";
import { WALKTHROUGHS } from "@/lib/walkthroughs";

const scenario = DATA_SCENARIOS.healthcare;
const walkthrough = WALKTHROUGHS["data-systems/healthcare"];

export default function HealthcareDataSystemsPage() {
  return (
    <LabShell
      eyebrow={scenario.eyebrow}
      title={scenario.title}
      description="Run a protected clinical pipeline end to end: validate FHIR encounters, claims batches, and HL7 lab results, tokenize PHI into governed models, then inject a contract fault and replay the quarantined batch."
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
