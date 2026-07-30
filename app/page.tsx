import { Suspense } from "react";
import type { Metadata } from "next";
import HomeView from "@/components/home/HomeView";
import RefGate from "@/components/home/RefGate";
import baseProfileJson from "@/public/data/base_profile.json";
import type { BaseProfile } from "@/lib/types";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const baseProfile = baseProfileJson as BaseProfile;

/**
 * Server component. The Suspense fallback IS the full homepage: useSearchParams
 * inside RefGate defers that subtree during static prerender, so the fallback
 * is what ships in the HTML — complete hero, stats, case studies, tools, and
 * labs. On hydration without ?ref= RefGate returns the identical markup; with
 * ?ref= it swaps in the Hermes tailored experience client-side.
 */
export default function HomePage() {
  const home = <HomeView profile={baseProfile} />;

  return (
    <Suspense fallback={home}>
      <RefGate profile={baseProfile} home={home} />
    </Suspense>
  );
}
