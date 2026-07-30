/**
 * Client-side password strength analysis, informed by NIST SP 800-63B-4:
 * length dominates, bl!ocklisted secrets are fatal regardless of composition,
 * and no arbitrary complexity mandates. This is a direct descendant of the
 * passaudit tool's heuristics, ported to run entirely in the browser — no
 * value ever leaves the page.
 *
 * Pure and deterministic so it can be unit-tested without a DOM.
 */

export type Verdict = "critical" | "weak" | "fair" | "strong" | "excellent";

export interface Finding {
  kind: "blocker" | "warning" | "good";
  message: string;
}

export interface StrengthResult {
  entropyBits: number;
  guesses: number;
  crackTime: string;
  verdict: Verdict;
  score: number; // 0..100 for the meter
  findings: Finding[];
  poolSize: number;
}

// A compact block-list of the most common breached passwords and base words.
// Real deployments use lists of millions; this captures the usual suspects.
const COMMON = new Set([
  "password", "123456", "123456789", "12345678", "12345", "1234567",
  "qwerty", "abc123", "111111", "123123", "admin", "letmein", "welcome",
  "monkey", "dragon", "sunshine", "princess", "football", "iloveyou",
  "1234567890", "000000", "qwertyuiop", "password1", "qazwsx", "trustno1",
  "superman", "batman", "master", "shadow", "michael", "jennifer", "hunter",
  "harley", "ranger", "buster", "soccer", "hockey", "killer", "george",
  "sexy", "andrew", "charlie", "thomas", "robert", "access", "love",
  "secret", "summer", "winter", "spring", "autumn", "changeme", "passw0rd",
  "starwars", "whatever", "zaq12wsx", "google", "test", "guest", "root",
]);

const KEYBOARD_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];
const LEET: Record<string, string> = { "@": "a", "4": "a", "3": "e", "1": "i", "!": "i", "0": "o", "$": "s", "5": "s", "7": "t" };

function poolSize(password: string): number {
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^A-Za-z0-9]/.test(password)) pool += 33;
  return pool;
}

function normalizeLeet(password: string): string {
  return password
    .toLowerCase()
    .split("")
    .map((char) => LEET[char] ?? char)
    .join("");
}

function hasSequence(lower: string): boolean {
  for (let index = 0; index < lower.length - 2; index += 1) {
    const a = lower.charCodeAt(index);
    const b = lower.charCodeAt(index + 1);
    const c = lower.charCodeAt(index + 2);
    if (b - a === 1 && c - b === 1) return true; // abc / 123
    if (a - b === 1 && b - c === 1) return true; // cba / 321
  }
  return false;
}

function hasKeyboardWalk(lower: string): boolean {
  return KEYBOARD_ROWS.some((row) => {
    for (let index = 0; index < row.length - 3; index += 1) {
      const run = row.slice(index, index + 4);
      if (lower.includes(run) || lower.includes(run.split("").reverse().join(""))) {
        return true;
      }
    }
    return false;
  });
}

function hasRepeats(password: string): boolean {
  return /(.)\1\1/.test(password);
}

function humanizeTime(seconds: number): string {
  if (seconds < 1) return "instantly";
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [365, "day"],
    [100, "year"],
    [Infinity, "century"],
  ];
  let value = seconds;
  let label = "second";
  for (const [factor, name] of units) {
    label = name;
    if (value < factor) break;
    value /= factor;
  }
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  if (rounded > 1e6) return "effectively forever";
  return `${rounded.toLocaleString()} ${label}${rounded === 1 ? "" : "s"}`;
}

export function analyzePassword(password: string): StrengthResult {
  const findings: Finding[] = [];
  const pool = poolSize(password);
  const length = password.length;
  const entropyBits = length > 0 ? Math.round(length * Math.log2(Math.max(pool, 1)) * 10) / 10 : 0;
  const guesses = Math.pow(2, entropyBits);
  // Offline attacker benchmark: ~100 billion guesses/second (fast GPU rig).
  const seconds = guesses / 1e11;

  const lower = password.toLowerCase();
  const normalized = normalizeLeet(password);
  const isCommon = COMMON.has(lower) || COMMON.has(normalized);
  // Strip trailing digits/symbols to catch "password1", "monkey!" style bases.
  const base = normalized.replace(/[^a-z]/g, "");
  const isCommonBase = base.length >= 4 && COMMON.has(base);

  if (length === 0) {
    return {
      entropyBits: 0, guesses: 0, crackTime: "—", verdict: "critical",
      score: 0, findings: [], poolSize: 0,
    };
  }

  if (isCommon || isCommonBase) {
    findings.push({ kind: "blocker", message: "This is on the breached-password block-list — it would be tried in the first seconds of any attack." });
  }
  if (length < 8) {
    findings.push({ kind: "blocker", message: `Only ${length} characters. NIST-informed guidance sets 8 as the floor and rewards much longer.` });
  } else if (length < 12) {
    findings.push({ kind: "warning", message: `${length} characters is acceptable but short. Aim for 12+ — length beats symbols.` });
  } else {
    findings.push({ kind: "good", message: `${length} characters — length is the single biggest factor, and this is a healthy amount.` });
  }

  if (hasSequence(lower)) {
    findings.push({ kind: "warning", message: "Contains a run like \"abc\" or \"123\" — guessers try these early." });
  }
  if (hasKeyboardWalk(lower)) {
    findings.push({ kind: "warning", message: "Contains a keyboard pattern like \"qwer\" — not as random as it looks." });
  }
  if (hasRepeats(password)) {
    findings.push({ kind: "warning", message: "Has a character repeated three or more times in a row." });
  }
  if (/^(19|20)\d{2}$/.test(password) || /(19|20)\d{2}/.test(password)) {
    findings.push({ kind: "warning", message: "Contains a 4-digit year — a very common and predictable filler." });
  }
  if (pool >= 60 && length >= 12 && !isCommon && !isCommonBase) {
    findings.push({ kind: "good", message: "Mixes character types across a long secret — a large search space to brute-force." });
  }

  // Score: driven mostly by entropy, but a block-list hit caps it hard.
  let score = Math.min(100, Math.round((entropyBits / 90) * 100));
  const hasBlocker = findings.some((finding) => finding.kind === "blocker");
  if (hasBlocker) {
    score = Math.min(score, 15);
  } else {
    const warnings = findings.filter((finding) => finding.kind === "warning").length;
    score = Math.max(0, score - warnings * 8);
  }

  let verdict: Verdict;
  if (hasBlocker || score < 20) verdict = "critical";
  else if (score < 40) verdict = "weak";
  else if (score < 60) verdict = "fair";
  else if (score < 82) verdict = "strong";
  else verdict = "excellent";

  return {
    entropyBits,
    guesses,
    crackTime: hasBlocker ? "instantly (block-listed)" : humanizeTime(seconds),
    verdict,
    score,
    findings,
    poolSize: pool,
  };
}

export const VERDICT_META: Record<Verdict, { label: string; tone: "alert" | "warn" | "accent" | "good" }> = {
  critical: { label: "Critical — do not use", tone: "alert" },
  weak: { label: "Weak", tone: "alert" },
  fair: { label: "Fair", tone: "warn" },
  strong: { label: "Strong", tone: "accent" },
  excellent: { label: "Excellent", tone: "good" },
};
