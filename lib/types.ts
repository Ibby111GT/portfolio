export type SandboxAssetType = "spl" | "kql" | "powershell" | "rbac_schema";

export interface SandboxAsset {
  type: SandboxAssetType | string;
  title: string;
  description: string;
  content: string;
  runnable: boolean;
}

export interface BaseProfile {
  full_name: string;
  headline: string;
  location: string;
  email: string;
  skills: {
    splunk: string;
    azure_ad: string;
    windows_laps: string;
  };
  education: {
    school: string;
    degree: string;
    graduation: string;
    details: string;
  };
  certifications: string[];
  projects: Array<{
    title: string;
    summary: string;
  }>;
  bullets: string[];
  ats_keywords: string[];
}

export interface TailoredPayload {
  tracker_id?: string;
  role_title?: string;
  focus_area?: string;
  job_url?: string;
  generated_at?: string;
  ats_keywords?: string[];
  security_keywords?: string[];
  tooling_requirements?: string[];
  resume_overrides?: {
    tailored_bullets?: string[];
    tailored_bullet_objects?: Array<{ bullet: string }>;
    reframing_strategy?: string;
    short_essays?: Record<string, string>;
    achievement_mappings?: Array<{
      requirement: string;
      evidence: string;
      source?: string;
    }>;
  };
  sandbox_project?: {
    title: string;
    slug?: string;
    problem_statement: string;
    technical_case_study: string;
    target_company_context: string;
    focus_area?: string;
    sandbox_assets: SandboxAsset[];
    capstone_mappings?: Array<{
      achievement: string;
      role_requirement: string;
    }>;
  };
}

export interface PortfolioViewState {
  mode: "base" | "tailored";
  ref: string | null;
  profile: BaseProfile;
  tailored: TailoredPayload | null;
}
