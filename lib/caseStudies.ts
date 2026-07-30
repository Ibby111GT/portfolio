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

export interface CaseDiagramStage {
  label: string;
  detail?: string;
  /** accent = nominal/system, alert = the constraint or risk being managed. */
  tone?: "accent" | "alert" | "neutral";
}

export interface CaseDiagram {
  caption: string;
  stages: CaseDiagramStage[];
  callout?: { label: string; body: string };
}

export interface CaseStudy {
  slug: string;
  tags: string[];
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  stats: CaseStat[];
  glow: "blue" | "red";
  featured?: boolean;
  deliverables?: string[];
  diagram: CaseDiagram;
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
      "Led a 5-person UT Dallas capstone team advising DFW Technology, in partnership with the City of Richardson, on private AI data-centre feasibility.",
    tagline: "Siting AI compute under a hard regulatory ceiling.",
    description:
      "ITSS 4395 Senior Capstone at UT Dallas. As Group Lead I ran a 5-person consulting team and served as primary client point of contact for DFW Technology, evaluating whether a private AI data centre could be built in Richardson without adding load to an already strained Texas grid.",
    stats: [
      { value: 15, prefix: "Top ", label: "Of 6,000+ students at UTDsolv" },
      { value: 75, suffix: " MW", label: "Regulatory ceiling designed under" },
      { value: 5, label: "Person team led" },
    ],
    glow: "blue",
    featured: true,
    deliverables: [
      "Feasibility Study",
      "Joint Policy Framework",
      "5-Year Financial Model",
      "90-Day Implementation Plan",
    ],
    diagram: {
      caption: "Recommended architecture — 20 MW Edge Tier pilot",
      stages: [
        {
          label: "On-site generation",
          detail: "30–40 MW solar, 10 × 2.5 MW gas gensets, 20 MW / 80 MWh battery",
          tone: "accent",
        },
        {
          label: "Behind the meter",
          detail: "Power never crosses the public grid connection",
          tone: "accent",
        },
        {
          label: "20 MW facility",
          detail: "Deliberately under the 75 MW review threshold",
          tone: "alert",
        },
        {
          label: "Regulated SME tenants",
          detail: "Healthcare, finance, legal, public sector",
        },
      ],
      callout: {
        label: "Load added to the Oncor grid",
        body: "Zero. That is the entire argument — the city captures the investment and the jobs without its residents absorbing the power cost.",
      },
    },
    plainLanguage:
      "AI runs on electricity, and Texas is running short of it. A new state law adds large-load review and operating requirements at 75 megawatts or greater, and residents are increasingly hostile to projects that raise their power bills. Our client wanted to build AI infrastructure in Richardson anyway. My team's job was to work out whether there was a version of that project that was actually buildable — and we found one: keep the facility deliberately under the legal threshold, generate its power on site so it takes nothing from the public grid, and sell to the customers the giant cloud providers ignore.",
    whatToLookFor: [
      "The explorer below is the real constraint we worked inside: move the slider to 75 MW or higher and the project enters the large-load review process.",
      "Switching off the on-site generators shows the whole argument collapsing — the moment the facility pulls from the public grid, the political case for it disappears.",
      "The three alternatives were scored against seven criteria. The one we recommended failed exactly one of them, and most of our deliverables existed to fix that one.",
    ],
    practicalUse:
      "This is what feasibility work actually looks like: not asking whether something is technically possible, but finding the version of it that survives contact with regulation, economics, and public opinion. Any organization facing an infrastructure decision with a hard legal limit runs some form of this analysis before spending money.",
    problem: {
      title: "The grid says no.",
      body: "Three pressures converged on Richardson at once. Texas grid operators expect large-load demand to grow from 87 to 138 gigawatts by 2030, heavily concentrated in the territory serving the city. Senate Bill 6 and its implementing processes add extensive study and operating requirements for loads of 75 megawatts or more. And a whole segment of customers — healthcare, finance, legal, and public-sector organizations — need AI compute they can keep control of, but cannot use shared public cloud and cannot justify building at hyperscale. The client already ran a 1–2 MW AI lab in Richardson. The question was whether it could grow into something meaningful without triggering the very constraints strangling everyone else.",
    },
    goals: ["Stay under SB 6", "Add zero grid load", "Serve regulated SMEs"],
    actions: [
      {
        title: "Led the engagement and set the constraint",
        body: "Ran a 5-person team as primary client contact across market, policy, financial, and risk workstreams. The decision that shaped everything else was treating the 75 MW threshold not as a limit to negotiate but as a design constraint to build under deliberately.",
      },
      {
        title: "Scored three strategies against seven criteria",
        body: "Chasing a hyperscale campus, expanding the existing colocation business, or building a sub-threshold Edge Tier hub — judged on capital intensity, speed to market, SB 6 exposure, asset alignment, differentiation, political feasibility, and replicability. The Edge Tier option met every criterion except political feasibility.",
      },
      {
        title: "Designed power that bypasses the grid",
        body: "A behind-the-meter hybrid for the 20 MW pilot: 30–40 MW of single-axis tracking solar across roughly 125 acres, ten Caterpillar G3520K gas generators at 2.5 MW each with N+2 redundancy, and a 20 MW / 80 MWh battery built from Texas-made Tesla Megapacks. Because it generates its own power, the facility adds nothing to the public grid — which is what turns a politically toxic project into a defensible one.",
      },
      {
        title: "Anchored every component to something already running",
        body: "A student proposal is easy to dismiss, so nothing rested on a vendor promise. Behind-the-meter gas at scale was already live in Texas — 210 generators powering Stargate. Solar-plus-battery hybrids for data centres had Google's $20B energy parks landing in 2026. Tenant economics came from a published Lenovo benchmark: under four months to breakeven, 80%+ savings over five years.",
      },
      {
        title: "Wrote the framework that fixes the weak criterion",
        body: "Political feasibility was the one failing score, so the deliverables targeted it: a joint framework splitting eight workstreams between client and city, and a 90-day plan — council moves the zoning overlay and Chapter 312 tax framework to first reading, then EPC selection and the air-permit pre-application, then anchor-tenant letters of intent and groundbreaking readiness.",
      },
    ],
    outcomes: [
      { value: 15, prefix: "Top ", label: "Capstone ranking at UTDsolv Expo" },
      { value: 200, prefix: "$", suffix: "M+", label: "Capital investment modeled" },
      { value: 0, label: "Megawatts added to the public grid" },
    ],
    learnings: [
      "The best answer to a hard constraint is often to design under it on purpose rather than argue with it.",
      "A recommendation that fails one criterion is not a dead recommendation — it tells you exactly what the rest of the work has to be.",
      "Solar is energy, not capacity. Learning why that distinction decides the whole architecture was the most useful engineering lesson of the project.",
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
    glow: "red",
    diagram: {
      caption: "Detection pipeline and credential hardening",
      stages: [
        {
          label: "Authentication events",
          detail: "Sign-in and endpoint activity across enterprise systems",
        },
        {
          label: "SPL dashboards",
          detail: "Login trends, IP anomalies, event volume",
          tone: "accent",
        },
        {
          label: "Analyst triage",
          detail: "Abnormal authentication surfaced for investigation",
          tone: "accent",
        },
        {
          label: "LAPS enforcement",
          detail: "Local admin passwords rotated automatically on 500+ endpoints",
          tone: "alert",
        },
      ],
      callout: {
        label: "Why both halves",
        body: "Dashboards find the intrusion you are already having. Rotating every local administrator password removes the shared credential an intruder would use to spread — visibility first, then the control that shrinks the blast radius.",
      },
    },
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
    glow: "blue",
    diagram: {
      caption: "Client cloud traffic and access path",
      stages: [
        {
          label: "Inbound / outbound traffic",
          detail: "Client Azure and Citrix environments",
        },
        {
          label: "Azure Firewall policy",
          detail: "Hardened rules narrowing what may enter or leave",
          tone: "alert",
        },
        {
          label: "IAM least privilege",
          detail: "Role assignments reviewed and reduced",
          tone: "alert",
        },
        {
          label: "Client workloads",
          detail: "Kept available through 200+ resolved incidents",
          tone: "accent",
        },
      ],
      callout: {
        label: "The tension",
        body: "Every rule that shrinks the attack surface can also break something a business depends on. The work is finding the narrowest policy that still lets legitimate traffic through.",
      },
    },
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
    glow: "red",
    diagram: {
      caption: "Identity lifecycle for 200+ employees",
      stages: [
        {
          label: "Joiner",
          detail: "Account provisioned with the access the role needs, nothing more",
          tone: "accent",
        },
        {
          label: "Mover",
          detail: "Role change means access is re-granted, not accumulated",
          tone: "accent",
        },
        {
          label: "Azure AD groups",
          detail: "RBAC policy is the single place permission is decided",
        },
        {
          label: "Leaver",
          detail: "De-provisioned the day someone departs",
          tone: "alert",
        },
      ],
      callout: {
        label: "The failure this prevents",
        body: "Access accumulates silently. Someone who changes roles three times ends up holding all three sets of permissions, and a departed account nobody closed is an unlocked door with no one watching it.",
      },
    },
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
