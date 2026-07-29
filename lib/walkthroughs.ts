import type { ReadingItem, WalkthroughStep } from "@/components/ProjectWalkthrough";

export interface Walkthrough {
  plain: string;
  steps: WalkthroughStep[];
  reading: ReadingItem[];
  practical: string;
}

const PIPELINE_STEPS: WalkthroughStep[] = [
  {
    action: "Press Run pipeline.",
    detail:
      "The five stages light up in order and the record counters climb. Nothing is downloaded or sent anywhere - the data is generated in your browser.",
  },
  {
    action: "Watch the counts move between zones.",
    detail:
      "Records land in the raw zone first, then a smaller number reaches the validated zone, and a much smaller number reaches the governed zone. Data gets filtered and summarized as it moves.",
  },
  {
    action: "Press Inject schema fault, then run it again.",
    detail:
      "This simulates a source system quietly changing its data format - the single most common way real pipelines break.",
  },
  {
    action: "Watch it fail on purpose.",
    detail:
      "The run stops mid-way, records are quarantined, and the last two stages are blocked. That is deliberate: a good pipeline refuses to publish data it cannot trust rather than serving wrong numbers.",
  },
  {
    action: "Press Apply fix & replay.",
    detail:
      "The contract is patched and the held-back records are reprocessed. The failed check flips to RECOVERED and the pipeline finishes.",
  },
  {
    action: "Press Download run manifest.",
    detail:
      "You get a JSON file recording exactly what happened - counts, stage states, the fault, the fix. This is the receipt an auditor or on-call engineer would ask for.",
  },
];

const PIPELINE_READING: ReadingItem[] = [
  {
    label: "Ingestion",
    body: "Collecting data from source systems. Each source has its own speed - some stream continuously, some drop a file every few minutes.",
  },
  {
    label: "Raw / validated / governed",
    body: "Three storage zones. Raw is an untouched copy kept for audits, validated is cleaned and checked, governed is the trustworthy version people are allowed to use.",
  },
  {
    label: "Transformation",
    body: "Where messy inputs become consistent records: enforcing the expected format, joining sources together, and removing duplicates.",
  },
  {
    label: "Quality checks",
    body: "Automated tests that run every time. PASS means the data met the rule, FAIL means it did not, HELD means the check never got to run because an earlier stage stopped.",
  },
  {
    label: "Quarantined records",
    body: "Rows pulled aside because they broke a rule. They are not deleted - they wait for a fix and then get reprocessed.",
  },
  {
    label: "Lineage",
    body: "The paper trail showing which original source a final number came from. When an executive asks 'where did this figure come from?', this answers it.",
  },
];

export const WALKTHROUGHS: Record<string, Walkthrough> = {
  "threat-hunt": {
    plain:
      "This is a security investigation you can actually play. A company employee's account has been taken over, and the evidence is scattered across twelve log entries from three different systems - the login service, the laptop, and the cloud file storage. Some of those entries are the attacker. Most are ordinary staff doing ordinary things. Your job is to pick out the ones that prove the break-in.",
    steps: [
      {
        action: "Read the twelve events in the table.",
        detail:
          "Each row is one thing that happened, in time order, with who did it, from what device and IP address, and what the system recorded.",
      },
      {
        action: "Use the search box or the hunt pivots.",
        detail:
          "Typing 'mfa' or clicking a preset filters the list, the same way an analyst narrows a search instead of reading everything at once.",
      },
      {
        action: "Click the + next to events you believe are the attacker.",
        detail:
          "That marks the row as evidence. The three mission objectives on the right flip to LINKED as you connect each part of the attack.",
      },
      {
        action: "Press Submit finding.",
        detail:
          "You get a confidence score. Picking real attacker events raises it, picking innocent activity lowers it - because in real work, accusing the wrong person or system wastes everyone's time.",
      },
      {
        action: "Press Reset and try a different theory.",
        detail: "Nothing is saved and nothing is scored against you.",
      },
    ],
    reading: [
      {
        label: "Source tag",
        body: "Which system reported the event: identity (the login service), endpoint (the laptop), or cloud (online file and email storage).",
      },
      {
        label: "Severity dot",
        body: "The colored dot is how alarming that single event looks on its own, from routine grey through to critical red.",
      },
      {
        label: "Tactic",
        body: "The attacker's goal at that moment, using the industry-standard MITRE ATT&CK vocabulary - for example 'MFA fatigue' means spamming someone with login approval prompts until they tap yes.",
      },
      {
        label: "Impossible travel",
        body: "The same account signing in from two places too far apart for one person to physically travel between. A classic sign of a stolen account.",
      },
      {
        label: "Confidence score",
        body: "How well your selected evidence proves the case: complete attack chain and no false accusations scores highest.",
      },
    ],
    practical:
      "This is the core daily skill of a security operations analyst. When an alert fires, someone has to decide within minutes whether it is a real break-in or a false alarm, and then prove it with evidence rather than a hunch. Getting it wrong in either direction is costly: miss a real intrusion and data walks out the door, chase a false one and the business stops for nothing.",
  },
  "data-systems/cybersecurity": {
    plain:
      "Security teams drown in data. Login records, laptop activity, and cloud audit logs all arrive separately, in different formats, describing the same people and machines by different names. This pipeline is the plumbing that pulls those feeds together, cleans them up, and turns them into a short list of things actually worth investigating.",
    steps: PIPELINE_STEPS,
    reading: [
      ...PIPELINE_READING,
      {
        label: "Risk score",
        body: "A number attached to a user, device, or address summarizing how suspicious its combined behavior looks, so analysts start with the worst one.",
      },
    ],
    practical:
      "Every organization with a security team runs some version of this. Without it, an analyst has to manually cross-reference three consoles to answer a single question, which is why intrusions sit undetected for weeks. With it, the question is a lookup.",
  },
  "data-systems/finance": {
    plain:
      "A finance team's numbers live in several places at once: the accounting ledger, the system that bills customers, and the spreadsheets used for forecasting. They update on different schedules and rarely agree. This pipeline pulls all three together, automatically matches invoices to ledger entries, and flags the handful that do not line up so a human can look at them.",
    steps: PIPELINE_STEPS,
    reading: [
      ...PIPELINE_READING,
      {
        label: "Reconciliation",
        body: "Checking that two independent records of the same money agree - for example, an invoice you sent against the payment recorded in the books.",
      },
      {
        label: "Exceptions",
        body: "The transactions that did not match automatically. The goal is to keep this list short enough for a person to review.",
      },
    ],
    practical:
      "This is what stands between a company and a painful month-end close. Done manually it is spreadsheets, late nights, and errors that surface during an audit. Automated, the finance team spends its time on the few genuine discrepancies instead of matching thousands of rows by hand.",
  },
  "data-systems/healthcare": {
    plain:
      "A hospital records the same patient visit in several unconnected systems: the clinical record, the insurance claim, and the lab results. Each uses its own standards and its own patient identifiers, and all of it is legally protected health information. This pipeline harmonizes those feeds into one reliable operational picture while keeping the sensitive parts locked down.",
    steps: PIPELINE_STEPS,
    reading: [
      ...PIPELINE_READING,
      {
        label: "FHIR and HL7",
        body: "The standard formats hospitals use to exchange clinical data. Think of them as agreed-upon file layouts so two different vendors' systems can talk.",
      },
      {
        label: "Tokenization",
        body: "Replacing a real patient identifier with a meaningless stand-in before the data reaches analytics, so staff can count and measure without seeing who the patient is.",
      },
      {
        label: "Minimum necessary",
        body: "A HIPAA principle: people should only be able to see the least patient information required to do their job.",
      },
    ],
    practical:
      "Hospitals use this kind of pipeline to answer operational questions in near real time - how full is each unit, which patients are waiting on lab results, where are discharges backing up. The privacy controls are not optional decoration; mishandling this data carries regulatory penalties.",
  },
};
