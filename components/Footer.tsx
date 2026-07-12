"use client";

import { useCallback, useEffect, useState } from "react";

const EMAIL = "Ibrahim.Hussain@UTDallas.edu";
const LINKEDIN = "https://linkedin.com/in/ibrahimhn";
const GITHUB = "https://github.com/Ibby111GT";

export default function Footer() {
  const [copied, setCopied] = useState(false);
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (private browsing) — theme still toggles for this page view
    }
    setDark(next);
  }, []);

  return (
    <footer className="border-t border-border">
      <div className="max-w-5xl mx-auto px-6 md:px-8 py-20 md:py-24 flex flex-col items-center text-center gap-6">
        <h2 className="text-3xl md:text-5xl font-bold text-fg tracking-tight">
          Let&apos;s build something secure together.
        </h2>
        <p className="text-base text-fg-muted max-w-sm leading-relaxed">
          I&apos;m open to internships and full-time roles in information
          security, cloud, or IT.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fg text-bg text-sm font-medium shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-fg/70 transition-all duration-200"
          >
            {copied ? "Copied!" : EMAIL}
          </button>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.82] dark:bg-white/[0.08] backdrop-blur-xl backdrop-saturate-150 shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.12),0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] text-fg text-sm font-medium hover:bg-black/[0.06] dark:hover:bg-white/[0.14] hover:shadow-none transition-all duration-200"
          >
            Resume
          </a>
          <a
            href={LINKEDIN}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-fg text-sm font-medium hover:bg-surface transition-all duration-200"
          >
            LinkedIn
          </a>
          <a
            href={GITHUB}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-fg text-sm font-medium hover:bg-surface transition-all duration-200"
          >
            GitHub
          </a>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
          <p className="text-xs text-fg-muted">
            © {new Date().getFullYear()} Ibrahim Hussain
          </p>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
          >
            {dark ? (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
                </svg>
                Light
              </>
            ) : (
              <>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                </svg>
                Dark
              </>
            )}
          </button>
        </div>
      </div>
    </footer>
  );
}
