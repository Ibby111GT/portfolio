"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import TailoredExperience from "@/components/home/TailoredExperience";
import type { BaseProfile } from "@/lib/types";

/**
 * Client gate for the Hermes tailored-resume flow. Without a ?ref= token it
 * returns the server-rendered homepage untouched (React reconciles to the
 * exact markup already shipped as the Suspense fallback); with one it hands
 * off to the client-side tailored experience.
 */
export default function RefGate({
  profile,
  home,
}: {
  profile: BaseProfile;
  home: ReactNode;
}) {
  const refToken = useSearchParams().get("ref");

  if (!refToken) {
    return home;
  }

  return (
    <TailoredExperience refToken={refToken} profile={profile} home={home} />
  );
}
