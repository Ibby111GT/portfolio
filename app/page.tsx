import type { Metadata } from "next";
import HomeView from "@/components/home/HomeView";
import baseProfileJson from "@/public/data/base_profile.json";
import type { BaseProfile } from "@/lib/types";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const baseProfile = baseProfileJson as BaseProfile;

/**
 * Fully static server component — the complete homepage ships in the
 * prerendered HTML with no Suspense deferral. The Hermes tailored-resume
 * flow (/?ref=<id>) is served by middleware.ts, which rewrites those
 * requests to the dynamic /tailored route; the visible URL contract is
 * unchanged.
 */
export default function HomePage() {
  return <HomeView profile={baseProfile} />;
}
