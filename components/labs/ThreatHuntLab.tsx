"use client";

import { useMemo, useState } from "react";

type Source = "identity" | "endpoint" | "cloud";

interface HuntEvent {
  id: string;
  time: string;
  source: Source;
  actor: string;
  asset: string;
  ip: string;
  action: string;
  summary: string;
  tactic: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  malicious: boolean;
}

const EVENTS: HuntEvent[] = [
  { id: "e01", time: "08:41:03", source: "identity", actor: "a.chen", asset: "Entra ID", ip: "10.24.8.14", action: "login_success", summary: "Interactive sign-in from managed Dallas workstation", tactic: "Baseline", severity: "info", malicious: false },
  { id: "e02", time: "09:02:17", source: "identity", actor: "a.chen", asset: "Entra ID", ip: "185.220.101.17", action: "login_failure", summary: "Password accepted; MFA challenge denied from Frankfurt", tactic: "Valid accounts", severity: "medium", malicious: true },
  { id: "e03", time: "09:02:29", source: "identity", actor: "a.chen", asset: "Entra ID", ip: "185.220.101.17", action: "mfa_burst", summary: "Seven push challenges generated in 42 seconds", tactic: "MFA fatigue", severity: "high", malicious: true },
  { id: "e04", time: "09:03:11", source: "identity", actor: "a.chen", asset: "Entra ID", ip: "185.220.101.17", action: "login_success", summary: "MFA approved; impossible travel velocity 8,170 km/h", tactic: "Valid accounts", severity: "critical", malicious: true },
  { id: "e05", time: "09:05:44", source: "cloud", actor: "a.chen", asset: "SharePoint", ip: "185.220.101.17", action: "file_search", summary: "Search for board, payroll, acquisition, and password", tactic: "Discovery", severity: "medium", malicious: true },
  { id: "e06", time: "09:09:06", source: "endpoint", actor: "a.chen", asset: "FIN-LT-044", ip: "10.24.31.44", action: "remote_session", summary: "New remote management session created via cloud token", tactic: "Lateral movement", severity: "high", malicious: true },
  { id: "e07", time: "09:09:22", source: "endpoint", actor: "a.chen", asset: "FIN-LT-044", ip: "10.24.31.44", action: "powershell", summary: "Encoded PowerShell launched by management host process", tactic: "Execution", severity: "critical", malicious: true },
  { id: "e08", time: "09:10:13", source: "endpoint", actor: "system", asset: "FIN-LT-044", ip: "10.24.31.44", action: "defender_scan", summary: "Scheduled quick scan completed with no detections", tactic: "Baseline", severity: "info", malicious: false },
  { id: "e09", time: "09:12:55", source: "cloud", actor: "a.chen", asset: "SharePoint", ip: "185.220.101.17", action: "bulk_download", summary: "842 files downloaded through Graph API in 91 seconds", tactic: "Collection", severity: "critical", malicious: true },
  { id: "e10", time: "09:14:02", source: "cloud", actor: "backup-svc", asset: "SharePoint", ip: "10.24.2.8", action: "bulk_download", summary: "Nightly retention export resumed after maintenance", tactic: "Baseline", severity: "low", malicious: false },
  { id: "e11", time: "09:17:48", source: "identity", actor: "m.rojas", asset: "Entra ID", ip: "10.24.9.20", action: "password_reset", summary: "Help desk verified password reset from corporate network", tactic: "Baseline", severity: "info", malicious: false },
  { id: "e12", time: "09:20:31", source: "cloud", actor: "a.chen", asset: "Exchange", ip: "185.220.101.17", action: "inbox_rule", summary: "Rule created to hide security notifications and forward finance mail", tactic: "Persistence", severity: "high", malicious: true },
];

const SOURCE_STYLES: Record<Source, string> = {
  identity: "border-blue-300/25 bg-blue-300/15 text-blue-200",
  endpoint: "border-blue-300/50 bg-transparent text-blue-200",
  cloud: "border-white/25 bg-white/10 text-white/70",
};

const SEVERITY_DOTS = {
  info: "bg-slate-500",
  low: "bg-blue-400",
  medium: "border border-red-400 bg-transparent",
  high: "bg-red-400",
  critical: "bg-red-500",
};

const PRESETS = [
  { label: "Identity burst", query: "mfa", source: "identity" as const },
  { label: "Execution trail", query: "powershell", source: "endpoint" as const },
  { label: "Cloud collection", query: "download", source: "cloud" as const },
];

export default function ThreatHuntLab() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const visibleEvents = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return EVENTS.filter((event) => {
      const sourceMatches = source === "all" || event.source === source;
      const queryMatches =
        !needle ||
        [event.actor, event.asset, event.ip, event.action, event.summary, event.tactic]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return sourceMatches && queryMatches;
    });
  }, [query, source]);

  const maliciousIds = useMemo(
    () => new Set(EVENTS.filter((event) => event.malicious).map((event) => event.id)),
    [],
  );
  const truePositives = [...selected].filter((id) => maliciousIds.has(id)).length;
  const falsePositives = selected.size - truePositives;
  const chainBonus = ["e04", "e07", "e09"].every((id) => selected.has(id)) ? 20 : 0;
  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round((truePositives / maliciousIds.size) * 80 + chainBonus - falsePositives * 8),
    ),
  );

  const toggleEvidence = (id: string) => {
    setSubmitted(false);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setQuery("");
    setSource("all");
    setSelected(new Set());
    setSubmitted(false);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#070a0f] text-white shadow-2xl shadow-black/30">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-300 opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-300" />
          </span>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/65">Case IR-2026-071</p>
            <p className="mt-0.5 text-sm font-medium">Suspected identity compromise</p>
          </div>
        </div>
        <div className="flex items-center gap-5 font-mono text-xs text-white/50">
          <span>{EVENTS.length} events</span>
          <span>39 min window</span>
          <span className="text-red-300">SEV-1</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="border-b border-white/10 p-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative flex-1">
                <span className="sr-only">Search telemetry</span>
                <span className="pointer-events-none absolute left-3 top-2.5 font-mono text-xs text-blue-300">q:</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="actor, IP, action, tactic..."
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-9 pr-3 font-mono text-xs text-white outline-none transition focus:border-blue-300/50"
                />
              </label>
              <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                {(["all", "identity", "endpoint", "cloud"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={source === item}
                    onClick={() => setSource(item)}
                    className={`rounded-md px-3 py-1.5 font-mono text-[10px] uppercase transition ${
                      source === item ? "bg-white text-black" : "text-white/65 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-white/60">Hunt pivots</span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setQuery(preset.query);
                    setSource(preset.source);
                  }}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/55 transition hover:border-blue-300/30 hover:text-blue-200"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#0b0e13] font-mono text-[10px] uppercase tracking-wider text-white/60">
                <tr>
                  <th className="px-4 py-3 font-normal">Evidence</th>
                  <th className="px-3 py-3 font-normal">Time</th>
                  <th className="px-3 py-3 font-normal">Source</th>
                  <th className="px-3 py-3 font-normal">Actor / asset</th>
                  <th className="px-3 py-3 font-normal">Telemetry</th>
                  <th className="px-3 py-3 font-normal">Tactic</th>
                </tr>
              </thead>
              <tbody>
                {visibleEvents.map((event) => {
                  const active = selected.has(event.id);
                  return (
                    <tr
                      key={event.id}
                      className={`border-t border-white/[0.06] transition ${active ? "bg-blue-300/[0.07]" : "hover:bg-white/[0.025]"}`}
                    >
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleEvidence(event.id)}
                          aria-pressed={active}
                          aria-label={`${active ? "Remove" : "Add"} ${event.id} as evidence`}
                          className={`flex h-6 w-6 items-center justify-center rounded-md border font-mono text-xs transition ${
                            active
                              ? "border-blue-300 bg-blue-300 text-black"
                              : "border-white/15 text-white/60 hover:border-blue-300/50 hover:text-blue-200"
                          }`}
                        >
                          {active ? "+" : ""}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-[11px] text-white/65">{event.time}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded border px-2 py-1 font-mono text-[10px] uppercase ${SOURCE_STYLES[event.source]}`}>
                          {event.source}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-mono text-xs text-white/80">{event.actor}</p>
                        <p className="mt-1 font-mono text-[10px] text-white/60">{event.asset} / {event.ip}</p>
                      </td>
                      <td className="max-w-md px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${SEVERITY_DOTS[event.severity]}`} />
                          <code className="text-[11px] text-blue-100/70">{event.action}</code>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-white/60">{event.summary}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[11px] text-white/65">{event.tactic}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleEvents.length === 0 ? (
              <p className="px-5 py-16 text-center font-mono text-xs text-white/60">No telemetry matches this pivot.</p>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col bg-white/[0.018] p-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">Mission</p>
            <h2 className="mt-2 text-lg font-medium">Prove the attack chain</h2>
            <p className="mt-2 text-xs leading-5 text-white/50">
              Select only the events that support initial access, execution,
              collection, or persistence. Benign activity reduces confidence.
            </p>
          </div>

          <div className="mt-6 space-y-2">
            {["Initial access", "Endpoint execution", "Cloud collection"].map((objective, index) => {
              const complete =
                index === 0
                  ? ["e03", "e04"].some((id) => selected.has(id))
                  : index === 1
                    ? selected.has("e07")
                    : selected.has("e09");
              return (
                <div key={objective} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2.5">
                  <span className="text-xs text-white/60">{objective}</span>
                  <span className={`font-mono text-[10px] ${complete ? "text-blue-200" : "text-white/55"}`}>
                    {complete ? "LINKED" : "OPEN"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase text-white/60">Evidence selected</p>
                <p className="mt-1 text-3xl font-semibold">{selected.size}</p>
              </div>
              {submitted ? (
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase text-white/60">Confidence</p>
                  <p className={`mt-1 text-3xl font-semibold ${score >= 80 ? "text-blue-200" : score >= 55 ? "text-red-200" : "text-red-300"}`}>
                    {score}%
                  </p>
                </div>
              ) : null}
            </div>
            {submitted ? (
              <div className={`mt-4 rounded-lg border p-3 text-xs leading-5 ${
                score >= 80
                  ? "border-blue-300/25 bg-blue-300/10 text-blue-100"
                  : "border-red-300/25 bg-red-300/10 text-red-100"
              }`}>
                {score >= 80
                  ? "High-confidence compromise confirmed. Revoke sessions, isolate FIN-LT-044, and preserve cloud audit logs."
                  : `Finding needs stronger evidence. ${maliciousIds.size - truePositives} malicious event(s) remain unlinked; ${falsePositives} benign event(s) add noise.`}
              </div>
            ) : null}
          </div>

          <div className="mt-auto flex gap-2 pt-6">
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={selected.size === 0}
              className="flex-1 rounded-lg bg-blue-300 px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Submit finding
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-white/55 transition hover:bg-white/[0.05] hover:text-white"
            >
              Reset
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
