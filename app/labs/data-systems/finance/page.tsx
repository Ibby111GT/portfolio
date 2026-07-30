import type { Metadata } from "next";
import LabCaseStudy from "@/components/LabCaseStudy";
import LabShell from "@/components/LabShell";
import ProjectWalkthrough from "@/components/ProjectWalkthrough";
import DataPipelineLab from "@/components/labs/DataPipelineLab";
import { DATA_SCENARIOS } from "@/lib/dataScenarios";
import { WALKTHROUGHS } from "@/lib/walkthroughs";

const scenario = DATA_SCENARIOS.finance;
const walkthrough = WALKTHROUGHS["data-systems/finance"];

export const metadata: Metadata = {
  title: "LedgerPulse Finance Data Lab — Ibrahim Hussain",
  description:
    "Operate a reconciled finance pipeline, quarantine bad invoices, and replay them after a data-contract repair.",
  alternates: { canonical: "/labs/data-systems/finance" },
  openGraph: {
    title: "LedgerPulse Finance Data Lab — Ibrahim Hussain",
    description:
      "Operate a reconciled finance pipeline and replay quarantined invoices after a contract repair.",
    url: "/labs/data-systems/finance",
    images: ["/og.png"],
  },
};

export default function FinanceDataSystemsPage() {
  return (
    <LabShell
      slug="ledgerpulse"
      eyebrow={scenario.eyebrow}
      title={scenario.title}
      description="Run a reconciled finance pipeline end to end: capture ledger changes, billing activity, and forecasts, match transactions into governed marts, then inject a data-quality fault and replay the quarantined invoices."
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
