import type { BaseProfile, TailoredPayload } from "@/lib/types";

export function mergeTailoredIntoView(
  base: BaseProfile,
  tailored: TailoredPayload,
): BaseProfile {
  const bullets =
    tailored.resume_overrides?.tailored_bullets ??
    tailored.resume_overrides?.tailored_bullet_objects?.map((b) => b.bullet) ??
    base.bullets;

  const keywords = tailored.ats_keywords ?? tailored.security_keywords ?? base.ats_keywords;

  const sandbox = tailored.sandbox_project;
  const projects = sandbox
    ? [
        {
          title: sandbox.title,
          summary: sandbox.problem_statement,
        },
        ...base.projects,
      ]
    : base.projects;

  return {
    ...base,
    headline: tailored.role_title ?? base.headline,
    bullets,
    ats_keywords: keywords,
    projects,
  };
}

export function actionLabelForAsset(type: string, title: string): string {
  const normalized = type.toLowerCase();
  if (normalized === "spl" || normalized === "kql") {
    return `Review ${title || "Detection Query"}`;
  }
  if (normalized === "powershell") {
    return `Run ${title || "Automation Script"}`;
  }
  if (normalized === "rbac_schema") {
    return `Analyze ${title || "IAM Rules"}`;
  }
  return `Execute ${title || "Task"}`;
}
