export interface CaseStat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface CaseSection {
  title: string;
  body: string;
}

export interface CaseStudy {
  slug: string;
  tags: string[];
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  stats: CaseStat[];
  glow: "blue" | "purple" | "green" | "amber";
  featured?: boolean;
  deliverables?: string[];
  plainLanguage: string;
  whatToLookFor: string[];
  practicalUse: string;
  problem: CaseSection;
  goals: string[];
  actions: CaseSection[];
  outcomes: CaseStat[];
  learnings: string[];
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "private-ai-feasibility",
    tags: ["Capstone", "Consulting", "2026"],
    title: "Private AI Infrastructure Feasibility Study",
    subtitle:
      "Led a 5-person UT Dallas capstone team advising DFW Technology, in partnership with the City of Richardson, on private AI data warehouse feasibility.",
    tagline: "Advising on private AI infrastructure for the public sector.",
    description:
      "ITSS 4395 Senior Capstone at UT Dallas. As Project Lead & Systems Analyst, I ran a 5-person consulting team and served as primary client point of contact for DFW Technology, advising on the feasibility of deploying private AI data warehouses in partnership with the City of Richardson.",
    stats: [
      { value: 15, prefix: "Top ", label: "Of 6,000+ students at UTDsolv" },
      { value: 5, label: "Person team led" },
      { value: 4, label: "Client deliverables" },
    ],
    glow: "purple",
    featured: true,
    deliverables: ["Feasibility Report", "Risk Assessment", "Data Flow Diagrams"],
    plainLanguage:
      "The client wanted the benefits of AI without sending sensitive municipal information to a public service. My job was to turn that broad question into something leaders could actually decide: what hardware and controls would be required, which risks would remain, and whether the organization had the people and policies to operate it responsibly.",
    whatToLookFor: [
      "The problem section explains the business decision, not just the technology.",
      "The action cards show how requirements became architecture, governance, risk analysis, and client-ready deliverables.",
      "The outcomes describe delivery and external recognition; they do not pretend a feasibility study was a production deployment.",
    ],
    practicalUse:
      "A city partner or regulated organization can use this kind of study before committing budget. It reveals hidden costs, privacy obligations, operational gaps, and decision points while changing direction is still inexpensive.",
    problem: {
      title: "AI ambitions, private data.",
      body: "Organizations working with municipal stakeholders want AI capabilities without pushing sensitive data into public cloud services. DFW Technology needed a grounded answer: is a private AI data warehouse feasible, and what would it take in infrastructure, governance, and policy compliance?",
    },
    goals: ["AI infrastructure", "Data governance", "Policy compliance"],
    actions: [
      {
        title: "Led the consulting engagement",
        body: "Ran a 5-person team as primary client point of contact — scoping the study, coordinating workstreams, and presenting to DFW Technology and municipal stakeholders.",
      },
      {
        title: "Translated requirements into recommendations",
        body: "Turned client and City of Richardson stakeholder requirements into structured system recommendations covering AI infrastructure, data governance, and policy compliance frameworks.",
      },
      {
        title: "Produced the deliverables",
        body: "Authored a feasibility report, data flow diagrams, and risk assessments, and delivered a final client-facing presentation.",
      },
    ],
    outcomes: [
      { value: 15, prefix: "Top ", label: "Capstone ranking at UTDsolv Expo" },
      { value: 6000, suffix: "+", label: "Students in the field" },
      { value: 4, label: "Deliverables shipped" },
    ],
    learnings: [
      "Consulting is translation — stakeholders describe outcomes, and the team needs systems.",
      "Governance and compliance shape AI architecture as much as the technology does.",
    ],
  },
  {
    slug: "ut-system-security",
    tags: ["Information Security", "Internship", "2025"],
    title: "University of Texas System",
    subtitle:
      "SPL detection dashboards for login trends and IP anomalies, plus Windows LAPS enforcement across Active Directory and hybrid environments.",
    tagline: "Detection engineering and endpoint hardening at enterprise scale.",
    description:
      "As an Information Security Intern at the UT System, I build the visibility and controls a large enterprise relies on — SPL detection dashboards, Windows LAPS enforcement, and Intune security policy across managed assets.",
    stats: [
      { value: 500, suffix: "+", label: "Endpoints hardened with LAPS" },
      { value: 4, label: "Security functions delivered" },
    ],
    glow: "blue",
    plainLanguage:
      "A large university system produces more login activity than a person can read. I built views that turn that flood into patterns an analyst can recognize, then helped remove a separate credential risk by making every managed computer rotate its local administrator password automatically.",
    whatToLookFor: [
      "The dashboard work is about making unusual login behavior visible among normal university activity.",
      "The LAPS work is preventive: one stolen local password should not unlock hundreds of computers.",
      "The endpoint count shows operational scale, while the action cards explain the security controls behind the number.",
    ],
    practicalUse:
      "Security teams use this combination to find suspicious access faster and limit how far an attacker can move if one device is compromised. Detection shows where to look; credential rotation reduces the damage available there.",
    problem: {
      title: "Visibility first, then control.",
      body: "Enterprise systems generate a flood of authentication events. Without dashboards tuned to login trends, IP anomalies, and event volume, threats hide in the noise — and static local admin passwords leave every endpoint carrying the same credential risk.",
    },
    goals: ["Threat visibility", "Faster triage", "Credential hygiene"],
    actions: [
      {
        title: "Built SPL detection dashboards",
        body: "Designed and deployed SPL-based dashboards monitoring login trends, IP anomalies, and event volume across enterprise systems — improving threat visibility and accelerating incident triage.",
      },
      {
        title: "Enforced Windows LAPS",
        body: "Developed and enforced LAPS policies across Active Directory and hybrid environments, automating local admin password rotation across 500+ endpoints.",
      },
      {
        title: "Hardened endpoints with Intune",
        body: "Contributed to Microsoft Intune security policy deployment — endpoint compliance, device management, and mobile security posture across managed assets.",
      },
      {
        title: "Hunted abnormal authentication",
        body: "Assisted security monitoring and log analysis to identify abnormal authentication behavior and potential indicators of compromise.",
      },
    ],
    outcomes: [
      { value: 500, suffix: "+", label: "Endpoints with rotated credentials" },
      { value: 100, suffix: "%", label: "Local admin passwords automated" },
    ],
    learnings: [
      "A dashboard is a detection hypothesis — build it around the behavior you expect an attacker to show.",
      "Endpoint hardening wins come from policy that enforces itself, not from documentation.",
    ],
  },
  {
    slug: "chief-technology-group",
    tags: ["Cloud Security", "Internship", "2024"],
    title: "Chief Technology Group",
    subtitle:
      "Azure Firewall hardening, IAM least-privilege improvements, and legacy migration to Azure DevOps for enterprise clients.",
    tagline: "Hardening Azure environments for enterprise clients.",
    description:
      "As a Cloud Engineer Intern in Houston, I worked across client Azure and Citrix environments — securing traffic flows, keeping systems available, and supporting the move to modern cloud tooling.",
    stats: [
      { value: 200, suffix: "+", label: "Incidents resolved" },
      { value: 2, label: "Platforms monitored (Azure, Citrix)" },
    ],
    glow: "green",
    plainLanguage:
      "Client cloud systems must let legitimate work through without leaving unnecessary paths open to attackers. I helped tighten those network and identity rules, kept Azure and Citrix services healthy, and supported the move from older infrastructure practices into a more repeatable DevOps workflow.",
    whatToLookFor: [
      "Firewall hardening controls which traffic may enter or leave a client environment.",
      "Least-privilege identity work limits each account to the access its role actually needs.",
      "The incident count represents day-to-day reliability work alongside longer-term security improvement.",
    ],
    practicalUse:
      "Organizations use these controls to reduce the number of ways an attacker can reach a system without interrupting the services employees and customers rely on.",
    problem: {
      title: "Client clouds, real stakes.",
      body: "Enterprise clients depend on Azure environments that must stay both open enough to run the business and closed enough to shrink the attack surface — while legacy infrastructure ages out underneath them.",
    },
    goals: ["Reduce attack surface", "Maintain availability", "Modernize tooling"],
    actions: [
      {
        title: "Hardened Azure Firewall policies",
        body: "Configured and hardened firewall policies to secure inbound and outbound traffic flows and reduce attack surface across client cloud environments.",
      },
      {
        title: "Kept client environments healthy",
        body: "Monitored Azure and Citrix environments, resolving 200+ technical incidents while maintaining system performance and availability.",
      },
      {
        title: "Supported the DevOps migration",
        body: "Helped migrate legacy infrastructure to Azure DevOps, improving CI/CD workflows and cloud governance practices.",
      },
      {
        title: "Tightened IAM",
        body: "Assisted with IAM role management and access control improvements to align with least-privilege principles.",
      },
    ],
    outcomes: [
      { value: 200, suffix: "+", label: "Incidents resolved" },
      { value: 2, label: "Platforms monitored (Azure, Citrix)" },
    ],
    learnings: [
      "Least privilege is a process, not a setting — access creeps unless someone owns reviewing it.",
      "Incident volume drops when the environment is hardened before the ticket exists.",
    ],
  },
  {
    slug: "roomi-group",
    tags: ["IAM", "Systems Administration", "2020–2023"],
    title: "Roomi Group Corp",
    subtitle:
      "Identity and access management with Azure Active Directory — RBAC enforcement and secure provisioning across the organization.",
    tagline: "Identity-first IT for a growing organization.",
    description:
      "Over three and a half years in Houston, I ran identity and access for the organization — Azure Active Directory, RBAC policies, and the provisioning processes that keep access aligned with the org chart.",
    stats: [
      { value: 200, suffix: "+", label: "Employees managed" },
      { value: 3, suffix: "+", label: "Years in role" },
    ],
    glow: "amber",
    plainLanguage:
      "Identity management is the process of making sure the right person has the right access for the right amount of time. I handled that lifecycle for a growing organization: creating accounts, changing access when roles changed, and removing it promptly when people left.",
    whatToLookFor: [
      "Provisioning is the controlled setup of a new employee's accounts and permissions.",
      "RBAC assigns access by job role instead of granting one-off permissions that are hard to track.",
      "De-provisioning closes accounts and removes access so former employees do not leave behind an open door.",
    ],
    practicalUse:
      "Every organization needs this discipline. It reduces accidental data exposure, makes audits easier, and prevents old or overpowered accounts from becoming a quiet security risk.",
    problem: {
      title: "Access is the first control.",
      body: "In a growing company, every hire, role change, and departure is an access event. Without disciplined identity management, permissions accumulate and departed accounts linger — each one an open door.",
    },
    goals: ["Right-sized access", "Clean lifecycle", "Protected endpoints"],
    actions: [
      {
        title: "Managed identity for 200+ employees",
        body: "Administered identity and access controls through Azure Active Directory, enforcing RBAC policies and security best practices.",
      },
      {
        title: "Built secure provisioning",
        body: "Implemented secure user provisioning and de-provisioning processes, reducing access risk during employee transitions.",
      },
      {
        title: "Supported endpoint security",
        body: "Maintained endpoint and account security policies protecting organizational data and systems.",
      },
    ],
    outcomes: [
      { value: 200, suffix: "+", label: "Identities under RBAC" },
      { value: 3, suffix: "+", label: "Years of clean lifecycle management" },
    ],
    learnings: [
      "Provisioning and de-provisioning discipline prevents more incidents than any detection tool.",
      "IT support is security work — every reset password and permission request is a control point.",
    ],
  },
];

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((study) => study.slug === slug);
}
