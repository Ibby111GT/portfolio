import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HomeView from "@/components/home/HomeView";
import TailoredExperience from "@/components/home/TailoredExperience";
import baseProfileJson from "@/public/data/base_profile.json";
import type { BaseProfile } from "@/lib/types";

export const metadata: Metadata = {
  // Tailored payloads are per-application artifacts, not public pages.
  robots: { index: false, follow: false },
};

const baseProfile = baseProfileJson as BaseProfile;

/**
 * Dynamic target of the middleware rewrite for /?ref=<id>. Reads the ref
 * server-side and hands off to the client tailored experience; the payload
 * itself is still fetched client-side from /data/<id>.json, exactly as the
 * Hermes pipeline expects.
 */
export default async function TailoredPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  const params = await searchParams;
  const refToken = Array.isArray(params.ref) ? params.ref[0] : params.ref;

  if (!refToken) {
    redirect("/");
  }

  return (
    <TailoredExperience
      refToken={refToken}
      profile={baseProfile}
      home={<HomeView profile={baseProfile} />}
    />
  );
}
