"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mulberry32 } from "@/lib/seededRandom";

/**
 * SOC Command Deck — an interactive security operations dashboard driven by a
 * seeded synthetic alert stream. New detections arrive on a clock; the analyst
 * triages them (acknowledge, escalate, resolve); KPIs, a MITRE ATT&CK tactic
 * heatmap, and a risk trend update live. This is logsentry's detection logic
 * expressed as a product you can operate. Nothing here touches the network.
 */

type Severity = "critical" | "high" | "medium" | "low";
type Status = "new" | "ack" | "escalated" | "resolved";

interface Alert {
  id: string;
  seq: number;
  minute: number; // minutes since shift start
  rule: string;
  tactic: string;
  severity: Severity;
  host: string;
  actor: string;
  status: Status;
}

const TACTICS = [
  "Initial Access",
  "Execution",
  "Persistence",
  "Privilege Escalation",
  "Credential Access",
  "Discovery",
  "Lateral Movement",
  "Collection",
  "Command & Control",
  "Exfiltration",
];

// Detection rules mirror the kind of signal logsentry emits, tagged by tactic.
const RULES: { rule: string; tactic: string; severity: Severity }[] = [
  { rule: "Impossible-travel sign-in", tactic: "Initial Access", severity: "high" },
  { rule: "MFA fatigue — repeated push denies", tactic: "Credential Access", severity: "high" },
  { rule: "Brute-force lockout threshold", tactic: "Credential Access", severity: "medium" },
  { rule: "Encoded PowerShell launch", tactic: "Execution", severity: "high" },
  { rule: "New service installed", tactic: "Persistence", severity: "medium" },
  { rule: "Scheduled task created", tactic: "Persistence", severity: "medium" },
  { rule: "Token privilege escalation", tactic: "Privilege Escalation", severity: "critical" },
  { rule: "LSASS memory access", tactic: "Credential Access", severity: "critical" },
  { rule: "Network share enumeration", tactic: "Discovery", severity: "low" },
  { rule: "Remote WMI execution", tactic: "Lateral Movement", severity: "high" },
  { rule: "Mass file access spike", tactic: "Collection", severity: "medium" },
  { rule: "Beacon to rare domain", tactic: "Command & Control", severity: "high" },
  { rule: "Large outbound transfer", tactic: "Exfiltration", severity: "critical" },
  { rule: "Port scan from internal host", tactic: "Discovery", severity: "low" },
];

const HOSTS = [
  "WIN-APP01", "WIN-DC02", "FIN-WKS17", "HR-WKS04", "SRV-SQL03",
  "VPN-GW01", "WEB-EDGE2", "DEV-BUILD9", "OPS-JUMP1", "MKT-WKS22",
];
const ACTORS = [
  "j.rivera", "svc-backup", "a.chen", "admin", "m.okafor",
  "t.nguyen", "svc-sql", "k.patel", "r.silva", "guest",
];

const SEVERITY_META: Record<
  Severity,
  { label: string; weight: number; tone: string; chip: string }
> = {
  critical: { label: "Critical", weight: 10, tone: "text-alert", chip: "border-alert/50 bg-alert-soft text-alert" },
  high: { label: "High", weight: 6, tone: "text-alert", chip: "border-alert/40 bg-alert-soft text-alert" },
  medium: { label: "Medium", weight: 3, tone: "text-accent", chip: "border-accent/40 bg-accent-soft text-accent" },
  low: { label: "Low", weight: 1, tone: "text-fg-muted", chip: "border-border bg-surface text-fg-muted" },
};

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export default function SocCommandDeck() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [riskHistory, setRiskHistory] = useState<number[]>([]);
  const [running, setRunning] = useState(true);
  const [filter, setFilter] = useState<Severity | "all">("all");
  const [triaged, setTriaged] = useState(0);
  const seqRef = useRef(0);
  const minuteRef = useRef(0);
  const rngRef = useRef(mulberry32(0x50c1a1));

  const makeAlert = useCallback((burst = false): Alert => {
    const rng = rngRef.current;
    // Bursts skew toward the nastier end of the rule table.
    const pick = burst
      ? RULES[Math.floor(rng() * rng() * RULES.length)]
      : RULES[Math.floor(rng() * RULES.length)];
    seqRef.current += 1;
    minuteRef.current += Math.max(1, Math.round(rng() * 3));
    return {
      id: `A-${(seqRef.current + 4820).toString(36).toUpperCase()}`,
      seq: seqRef.current,
      minute: minuteRef.current,
      rule: pick.rule,
      tactic: pick.tactic,
      severity: pick.severity,
      host: HOSTS[Math.floor(rng() * HOSTS.length)],
      actor: ACTORS[Math.floor(rng() * ACTORS.length)],
      status: "new",
    };
  }, []);

  // Seed an initial queue on mount (client-only — no hydration mismatch).
  useEffect(() => {
    const initial = Array.from({ length: 6 }, () => makeAlert());
    setAlerts(initial.reverse());
  }, [makeAlert]);

  const pushAlerts = useCallback(
    (count: number, burst = false) => {
      setAlerts((current) => {
        const additions = Array.from({ length: count }, () => makeAlert(burst));
        const next = [...additions.reverse(), ...current];
        // Keep the board bounded: drop the oldest resolved rows first.
        if (next.length > 44) {
          const keep: Alert[] = [];
          const overflow = next.length - 44;
          let dropped = 0;
          for (let index = next.length - 1; index >= 0; index -= 1) {
            if (dropped < overflow && next[index].status === "resolved") {
              dropped += 1;
              continue;
            }
            keep.unshift(next[index]);
          }
          return keep.slice(0, 44);
        }
        return next;
      });
    },
    [makeAlert],
  );

  // Live stream clock.
  useEffect(() => {
    if (!running) {
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      return;
    }
    const timer = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      pushAlerts(rngRef.current() > 0.7 ? 2 : 1);
    }, 2600);
    return () => window.clearInterval(timer);
  }, [running, pushAlerts]);

  const activeAlerts = useMemo(
    () => alerts.filter((alert) => alert.status !== "resolved"),
    [alerts],
  );

  const risk = useMemo(() => {
    const raw = activeAlerts.reduce(
      (sum, alert) =>
        sum + SEVERITY_META[alert.severity].weight * (alert.status === "escalated" ? 1.5 : 1),
      0,
    );
    return Math.min(100, Math.round(raw));
  }, [activeAlerts]);

  // Sample the risk score onto the trend line whenever it moves.
  useEffect(() => {
    setRiskHistory((current) => {
      const next = [...current, risk];
      return next.slice(-48);
    });
  }, [risk]);

  const kpis = useMemo(() => {
    const open = activeAlerts.length;
    const critical = activeAlerts.filter((a) => a.severity === "critical").length;
    const escalated = alerts.filter((a) => a.status === "escalated").length;
    const acknowledged = alerts.filter((a) => a.status !== "new").length;
    const ackRate = alerts.length ? Math.round((acknowledged / alerts.length) * 100) : 100;
    return { open, critical, escalated, ackRate };
  }, [activeAlerts, alerts]);

  const heatmap = useMemo(() => {
    const counts = new Map<string, number>();
    activeAlerts.forEach((alert) => {
      counts.set(alert.tactic, (counts.get(alert.tactic) ?? 0) + SEVERITY_META[alert.severity].weight);
    });
    const max = Math.max(1, ...Array.from(counts.values()));
    return TACTICS.map((tactic) => ({
      tactic,
      value: counts.get(tactic) ?? 0,
      intensity: (counts.get(tactic) ?? 0) / max,
    }));
  }, [activeAlerts]);

  const setStatus = useCallback((id: string, status: Status) => {
    setAlerts((current) =>
      current.map((alert) => (alert.id === id ? { ...alert, status } : alert)),
    );
    setTriaged((count) => count + 1);
  }, []);

  const visible = useMemo(
    () =>
      filter === "all"
        ? alerts
        : alerts.filter((alert) => alert.severity === filter),
    [alerts, filter],
  );

  return (
    <div className="rounded-2xl border border-border bg-surface/40 p-4 sm:p-6">
      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-full ${running ? "bg-alert animate-pulse" : "bg-fg-muted"}`}
          />
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted">
            {running ? "Live feed" : "Paused"} · shift +{minuteRef.current}m
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => pushAlerts(4, true)}
            className="rounded-lg border border-alert/40 bg-alert-soft px-3 py-1.5 text-xs font-medium text-alert transition-opacity hover:opacity-80"
          >
            Inject attack burst
          </button>
          <button
            type="button"
            onClick={() => setRunning((value) => !value)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-fg/40"
          >
            {running ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Open alerts", value: kpis.open, tone: "text-fg" },
          { label: "Critical", value: kpis.critical, tone: kpis.critical ? "text-alert" : "text-fg" },
          { label: "Escalated", value: kpis.escalated, tone: "text-accent" },
          { label: "Triaged", value: `${kpis.ackRate}%`, tone: "text-fg" },
        ].map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-bg/60 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
              {tile.label}
            </p>
            <p className={`mt-1 font-mono text-3xl ${tile.tone}`}>{tile.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Alert feed */}
        <div className="min-w-0 rounded-xl border border-border bg-bg/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted">
              Alert queue
            </p>
            <div
              className="flex max-w-full flex-wrap gap-1"
              role="group"
              aria-label="Filter by severity"
            >
              {(["all", ...SEVERITIES] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={filter === option}
                  onClick={() => setFilter(option)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                    filter === option ? "bg-fg text-bg" : "text-fg-muted hover:text-fg"
                  }`}
                >
                  {option === "all" ? "All" : SEVERITY_META[option].label}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-3 min-w-0 max-h-[460px] space-y-2 overflow-y-auto pr-1">
            {visible.length === 0 ? (
              <li className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-fg-muted">
                No alerts at this severity. The queue is clear.
              </li>
            ) : null}
            {visible.map((alert) => (
              <li
                key={alert.id}
                className={`min-w-0 rounded-lg border p-3 transition-colors ${
                  alert.status === "resolved"
                    ? "border-border/60 bg-surface/30 opacity-55"
                    : alert.status === "escalated"
                      ? "border-alert/40 bg-alert-soft"
                      : "border-border bg-surface/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${SEVERITY_META[alert.severity].chip}`}>
                        {SEVERITY_META[alert.severity].label}
                      </span>
                      <span className="font-mono text-[11px] text-fg-muted">{alert.id}</span>
                      <span className="font-mono text-[11px] text-fg-muted">+{alert.minute}m</span>
                    </div>
                    <p className="mt-1.5 truncate text-sm font-medium text-fg">{alert.rule}</p>
                    <p className="mt-0.5 truncate text-xs text-fg-muted">
                      {alert.tactic} · {alert.host} · {alert.actor}
                    </p>
                  </div>
                  {alert.status !== "resolved" ? (
                    <div className="flex shrink-0 flex-col gap-1">
                      {alert.status === "new" ? (
                        <button
                          type="button"
                          onClick={() => setStatus(alert.id, "ack")}
                          className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-fg transition-colors hover:border-fg/40"
                        >
                          Acknowledge
                        </button>
                      ) : null}
                      {alert.status !== "escalated" ? (
                        <button
                          type="button"
                          onClick={() => setStatus(alert.id, "escalated")}
                          className="rounded-md border border-alert/40 px-2 py-1 text-[10px] font-medium text-alert transition-colors hover:bg-alert-soft"
                        >
                          Escalate
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setStatus(alert.id, "resolved")}
                        className="rounded-md border border-accent/40 px-2 py-1 text-[10px] font-medium text-accent transition-colors hover:bg-accent-soft"
                      >
                        Resolve
                      </button>
                    </div>
                  ) : (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-accent">
                      resolved
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right column: risk trend + heatmap */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-bg/40 p-4">
            <div className="flex items-center justify-between">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted">
                Risk index
              </p>
              <span className={`font-mono text-2xl ${risk > 60 ? "text-alert" : risk > 30 ? "text-accent" : "text-fg"}`}>
                {risk}
              </span>
            </div>
            <RiskTrend history={riskHistory} />
          </div>

          <div className="rounded-xl border border-border bg-bg/40 p-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted">
              MITRE ATT&CK coverage
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {heatmap.map((cell) => (
                <div
                  key={cell.tactic}
                  className="rounded-md border border-border px-2 py-1.5"
                  style={{
                    background:
                      cell.intensity > 0
                        ? `color-mix(in srgb, var(--alert) ${Math.round(cell.intensity * 60)}%, transparent)`
                        : undefined,
                  }}
                  title={`${cell.tactic}: ${cell.value}`}
                >
                  <p className="truncate text-[10px] font-medium text-fg">{cell.tactic}</p>
                  <p className="font-mono text-[10px] text-fg-muted">{cell.value || "—"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-bg/40 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fg-muted">
              Analyst actions this session
            </p>
            <p className="mt-1 font-mono text-2xl text-fg">{triaged}</p>
            <p className="mt-1 text-xs leading-5 text-fg-muted">
              Every acknowledge, escalate, and resolve recomputes the KPIs, the
              risk index, and the tactic heatmap in real time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskTrend({ history }: { history: number[] }) {
  const width = 260;
  const height = 64;
  if (history.length < 2) {
    return (
      <div className="mt-3 flex h-16 items-center justify-center text-xs text-fg-muted">
        Collecting telemetry…
      </div>
    );
  }
  const max = Math.max(20, ...history);
  const step = width / (history.length - 1);
  const points = history
    .map((value, index) => `${(index * step).toFixed(1)},${(height - (value / max) * height).toFixed(1)}`)
    .join(" ");
  const last = history[history.length - 1];
  const stroke = last > 60 ? "var(--alert)" : "var(--accent)";
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-16 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <polyline
        points={`0,${height} ${points} ${width},${height}`}
        fill={stroke}
        fillOpacity="0.08"
        stroke="none"
      />
    </svg>
  );
}
