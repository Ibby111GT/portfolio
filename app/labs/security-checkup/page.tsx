import type { Metadata } from "next";
import LabCaseStudy from "@/components/LabCaseStudy";
import LabShell from "@/components/LabShell";
import ProjectWalkthrough from "@/components/ProjectWalkthrough";
import SecurityCheckup from "@/components/labs/SecurityCheckup";
import { WALKTHROUGHS } from "@/lib/walkthroughs";

const walkthrough = WALKTHROUGHS["security-checkup"];

export const metadata: Metadata = {
  title: "Security Checkup — Ibrahim Hussain",
  description:
    "A privacy-first password strength checker. Entropy, block-list, and pattern analysis run entirely in your browser — nothing is ever sent or stored. Ported from the PassAudit tool.",
  alternates: { canonical: "/labs/security-checkup" },
  openGraph: {
    title: "Security Checkup — Ibrahim Hussain",
    description:
      "A privacy-first password strength checker that never transmits or stores a password.",
    url: "/labs/security-checkup",
    images: ["/og.png"],
  },
};

export default function SecurityCheckupPage() {
  return (
    <LabShell
      slug="security-checkup"
      eyebrow="Identity security · privacy-first tool"
      title="Security Checkup"
      description="A password strength checker you can actually trust with a password, because it never sends one. Entropy estimation, breach block-list matching, and pattern detection all run in your browser — the same NIST-informed heuristics behind the PassAudit tool, made useful to anyone."
    >
      <SecurityCheckup />
      <ProjectWalkthrough
        plain={walkthrough.plain}
        steps={walkthrough.steps}
        reading={walkthrough.reading}
        practical={walkthrough.practical}
      />
      <LabCaseStudy
        challenge="Most online 'password checkers' ask you to type a secret into someone else's server — the exact thing you should never do. And the advice they give is often outdated: piling on symbols instead of the thing that actually matters, length."
        solution="Security Checkup does the analysis where the password already is — the browser. It estimates entropy from the real character pool, checks the value and its leetspeak-normalized base against a breached-password block-list, flags sequences, keyboard walks, repeats, and years, then translates it all into a crack-time figure and plain-English guidance grounded in NIST SP 800-63B-4."
        architecture={[
          "Pure analysis module — a dependency-free, unit-tested function that takes a string and returns entropy, findings, and a verdict, with no DOM or network.",
          "Entropy model — bits derived from length × log2(character pool), the standard offline-guessing estimate.",
          "Block-list matching — direct and leetspeak-normalized comparison against common breached secrets, plus a stripped-base check that catches 'password1' and 'monkey!'.",
          "Pattern detectors — ascending/descending runs, keyboard walks, triple repeats, and embedded years.",
          "Crack-time translation — guesses at a 100-billion/second offline benchmark, humanized from 'instantly' to 'effectively forever'.",
        ]}
        decisions={[
          "Never transmit the input — privacy is the whole point, so the logic is client-only.",
          "Let length dominate the score and treat any block-list hit as fatal, per modern guidance.",
          "Keep the scoring logic in a pure module so it can be tested in isolation and reused.",
        ]}
        competencies={[
          "Applied cryptography intuition (entropy)",
          "NIST SP 800-63B-4 password guidance",
          "Privacy-by-design engineering",
          "Testable, dependency-free logic",
        ]}
        outcomes={[
          { value: "0", label: "Bytes sent — analysis is 100% local" },
          { value: "6", label: "Pattern & block-list checks" },
          { value: "NIST", label: "SP 800-63B-4 informed scoring" },
          { value: "Unit-tested", label: "Pure logic covered by Vitest" },
        ]}
      />
    </LabShell>
  );
}
