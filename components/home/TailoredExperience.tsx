"use client";

import { useEffect, useState, type ReactNode } from "react";
import TailoredView from "@/components/TailoredView";
import { mergeTailoredIntoView } from "@/lib/profile";
import type { BaseProfile, TailoredPayload } from "@/lib/types";

/**
 * Fetches a Hermes tailored payload (/data/<ref>.json) and renders the
 * tailored view. The base profile arrives as a prop (bundled at build time
 * from public/data/base_profile.json — the same file the fetch used to hit),
 * so only the ref payload needs the network. Contract invariants: the `ref`
 * param name, the /data/<id>.json path, mergeTailoredIntoView, and the
 * fallback notice string are all preserved byte-for-byte.
 */
export default function TailoredExperience({
  refToken,
  profile,
  home,
}: {
  refToken: string;
  profile: BaseProfile;
  home: ReactNode;
}) {
  const [tailored, setTailored] = useState<TailoredPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTailored() {
      setLoading(true);
      setError(null);
      setTailored(null);

      try {
        const response = await fetch(
          `/data/${encodeURIComponent(refToken)}.json`,
        );

        if (response.status === 404) {
          if (!cancelled) {
            setError(
              `No tailored payload found for ref=${refToken}. Showing base profile.`,
            );
          }
          return;
        }

        if (!response.ok) {
          throw new Error(
            `Tailored payload request failed (${response.status}).`,
          );
        }

        const payload = (await response.json()) as TailoredPayload;
        if (!cancelled) {
          setTailored(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unknown load error.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTailored();

    return () => {
      cancelled = true;
    };
  }, [refToken]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (tailored) {
    return (
      <TailoredView
        profile={mergeTailoredIntoView(profile, tailored)}
        tailored={tailored}
      />
    );
  }

  return (
    <>
      {error ? (
        <p className="px-6 pt-24 text-center text-xs text-fg-muted md:pt-28">
          {error}
        </p>
      ) : null}
      {home}
    </>
  );
}

function LoadingSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl animate-pulse px-6 pt-40 sm:px-8">
      <div className="mx-auto mb-8 h-8 w-64 rounded-full bg-surface" />
      <div className="mx-auto mb-4 h-20 w-2/3 rounded-2xl bg-surface" />
      <div className="mx-auto mb-8 h-10 w-80 rounded-full bg-surface" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-surface lg:col-span-2" />
        <div className="h-64 rounded-2xl bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
      </div>
    </main>
  );
}
