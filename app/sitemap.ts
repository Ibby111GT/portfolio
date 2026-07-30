import type { MetadataRoute } from "next";
import { CASE_STUDIES } from "@/lib/caseStudies";
import { CREATIVE_PROJECTS } from "@/lib/creativeProjects";
import { TOOL_SLUGS } from "@/lib/toolProjects";
import { SITE_URL } from "@/lib/siteUrl";

export const STATIC_ROUTES = [
  "/",
  "/about",
  "/creative",
  "/projects",
  "/projects/peptides/demo",
  "/labs/threat-hunt",
  "/labs/soc-command-deck",
  "/labs/security-checkup",
  "/labs/aegis-home",
  "/labs/agent-foundry",
  "/labs/data-systems/cybersecurity",
  "/labs/data-systems/finance",
  "/labs/data-systems/healthcare",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ...STATIC_ROUTES,
    ...CASE_STUDIES.map((study) => `/work/${study.slug}`),
    ...TOOL_SLUGS.map((slug) => `/projects/${slug}`),
    ...CREATIVE_PROJECTS.map((project) => `/creative/${project.slug}`),
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route === "/" ? "" : route}`,
    changeFrequency: "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
