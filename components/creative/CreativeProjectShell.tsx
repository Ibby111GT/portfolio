"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { CreativeProject } from "@/lib/creativeProjects";

export default function CreativeProjectShell({
  project,
  children,
}: {
  project: CreativeProject;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <div className="relative z-30 mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 pb-5 pt-28 md:px-8 md:pt-32">
        <Link
          href="/creative"
          className="text-xs font-medium text-white/55 transition-colors hover:text-white"
        >
          ← Creative playground
        </Link>
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 rounded-full ${
              project.accent === "red" ? "bg-alert" : "bg-accent"
            }`}
          />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">
            {project.number} · {project.category}
          </span>
        </div>
      </div>
      {children}
    </main>
  );
}
