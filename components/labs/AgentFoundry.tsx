"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Bot,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

interface SourceDocument {
  id: string;
  name: string;
  text: string;
}

interface Chunk {
  id: string;
  source: string;
  text: string;
  tokens: string[];
}

interface Match extends Chunk {
  score: number;
}

const SAMPLE_DOCS: SourceDocument[] = [
  {
    id: "incident-policy",
    name: "incident-response-policy.txt",
    text: "Severity 1 incidents require immediate acknowledgement, an incident commander, and stakeholder updates every 30 minutes. Preserve logs before remediation. Customer communication must be approved by the communications lead. Severity 2 incidents require acknowledgement within 30 minutes and an owner within one hour.",
  },
  {
    id: "access-standard",
    name: "access-control-standard.txt",
    text: "Privileged access must use phishing-resistant multifactor authentication. Access reviews occur quarterly. Dormant privileged accounts are disabled after 30 days. Emergency access is time limited, logged, and reviewed by a separate administrator after use.",
  },
  {
    id: "vendor-guide",
    name: "vendor-risk-guide.txt",
    text: "Critical vendors receive annual security reviews. Evidence includes an independent assurance report, breach notification terms, recovery objectives, and the vendor's subcontractor list. Exceptions need a named business owner, expiration date, and compensating controls.",
  },
];

const ROLE_OPTIONS = [
  {
    id: "security",
    name: "Security policy analyst",
    instruction:
      "Answer as a security policy analyst. Distinguish requirements from recommendations and cite every source.",
  },
  {
    id: "operations",
    name: "Operations runbook assistant",
    instruction:
      "Answer as an operations coordinator. Return the ordered actions, owner, and timing supported by the sources.",
  },
  {
    id: "compliance",
    name: "Compliance evidence reviewer",
    instruction:
      "Answer as a compliance reviewer. Identify the control, expected evidence, and any unresolved gap.",
  },
] as const;

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "from",
  "that",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "must",
  "should",
  "have",
  "has",
  "are",
  "was",
  "were",
  "into",
  "during",
]);

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function chunkDocuments(documents: SourceDocument[]) {
  const size = 380;
  const overlap = 70;
  return documents.flatMap((document) => {
    const chunks: Chunk[] = [];
    for (let start = 0; start < document.text.length; start += size - overlap) {
      const text = document.text.slice(start, start + size).trim();
      if (text) {
        chunks.push({
          id: `${document.id}-${chunks.length + 1}`,
          source: document.name,
          text,
          tokens: tokenize(text),
        });
      }
    }
    return chunks;
  });
}

function retrieve(chunks: Chunk[], query: string): Match[] {
  const queryTokens = tokenize(query);
  return chunks
    .map((chunk) => {
      const unique = new Set(chunk.tokens);
      const overlap = queryTokens.filter((token) => unique.has(token)).length;
      const phraseBonus = chunk.text.toLowerCase().includes(query.toLowerCase())
        ? 3
        : 0;
      return {
        ...chunk,
        score: queryTokens.length
          ? Math.min(100, Math.round(((overlap + phraseBonus) / queryTokens.length) * 100))
          : 0,
      };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function groundedAnswer(matches: Match[], query: string, role: string) {
  if (!matches.length) {
    return "I could not find enough support in the indexed sources. Add a relevant document or ask a narrower question.";
  }
  const queryTokens = tokenize(query);
  const sentences = matches
    .flatMap((match) =>
      match.text
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => ({
          sentence,
          source: match.source,
          overlap: tokenize(sentence).filter((token) =>
            queryTokens.includes(token),
          ).length,
        })),
    )
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 3);
  return `${role}: ${sentences
    .map((item) => `${item.sentence} [${item.source}]`)
    .join(" ")}`;
}

export default function AgentFoundry() {
  const [documents, setDocuments] = useState<SourceDocument[]>(SAMPLE_DOCS);
  const [roleId, setRoleId] = useState<(typeof ROLE_OPTIONS)[number]["id"]>(
    "security",
  );
  const [query, setQuery] = useState(
    "What must happen during a Severity 1 incident?",
  );
  const [indexed, setIndexed] = useState(true);
  const [matches, setMatches] = useState<Match[]>(() =>
    retrieve(
      chunkDocuments(SAMPLE_DOCS),
      "What must happen during a Severity 1 incident?",
    ),
  );
  const [answer, setAnswer] = useState(() =>
    groundedAnswer(
      retrieve(
        chunkDocuments(SAMPLE_DOCS),
        "What must happen during a Severity 1 incident?",
      ),
      "What must happen during a Severity 1 incident?",
      ROLE_OPTIONS[0].name,
    ),
  );
  const [status, setStatus] = useState(
    "Sample knowledge base indexed locally.",
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const role = ROLE_OPTIONS.find((item) => item.id === roleId) ?? ROLE_OPTIONS[0];
  const chunks = useMemo(() => chunkDocuments(documents), [documents]);

  async function addFiles(files: FileList) {
    const additions: SourceDocument[] = [];
    for (const file of Array.from(files).slice(0, 8)) {
      if (file.size > 1_000_000) continue;
      additions.push({
        id: `file-${file.name}-${file.lastModified}`,
        name: file.name.slice(0, 70),
        text: await file.text(),
      });
    }
    if (additions.length) {
      setDocuments((current) => [...current, ...additions]);
      setIndexed(false);
      setStatus(
        `${additions.length} local file${additions.length === 1 ? "" : "s"} added. Rebuild the index before asking.`,
      );
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function buildIndex() {
    setIndexed(true);
    setMatches([]);
    setAnswer("");
    setStatus(
      `${chunks.length} chunks indexed from ${documents.length} sources. Ready for retrieval.`,
    );
  }

  function runAgent() {
    if (!indexed) {
      setStatus("Build the index first so the new documents can be searched.");
      return;
    }
    const results = retrieve(chunks, query);
    setMatches(results);
    setAnswer(groundedAnswer(results, query, role.name));
    setStatus(
      results.length
        ? `${results.length} grounded passages retrieved. No external model or API was called.`
        : "No supported answer found. The agent refused to invent one.",
    );
  }

  function exportManifest() {
    const manifest = {
      name: "Foundry Agent",
      role: role.name,
      system_instruction: role.instruction,
      retrieval: {
        method: "local lexical scoring",
        top_k: 4,
        sources: documents.map((document) => document.name),
        chunks: chunks.length,
      },
      safety: {
        answer_only_from_context: true,
        cite_sources: true,
        refuse_when_unsupported: true,
      },
    };
    const blob = new Blob([JSON.stringify(manifest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "agent-foundry-manifest.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-[#07070a] px-4 pb-28 pt-28 text-white sm:px-6 md:pt-32">
      <div className="mx-auto max-w-[1450px]">
        <Link
          href="/projects#interactive-labs"
          className="font-mono text-xs uppercase tracking-[0.18em] text-white/65 hover:text-white"
        >
          &lt;- All projects
        </Link>

        <header className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-blue-300/30 bg-blue-300/10 text-blue-200">
                <Sparkles size={17} />
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-blue-200/60">
                Local retrieval agent factory
              </p>
            </div>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl lg:text-[7rem] lg:leading-[0.84]">
              AGENT
              <span className="text-blue-300">/</span>FOUNDRY
            </h1>
            <p className="mt-7 max-w-3xl text-base leading-8 text-white/48 md:text-lg">
              Turn local documents into a role-specific, citation-first agent.
              Inspect every chunk it retrieves, test refusal behavior, and
              export the resulting agent contract.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-300/20 bg-blue-300/[0.04] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
              Practical use
            </p>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Prototype internal policy assistants, runbook agents, and
              compliance-review workflows before connecting a production LLM
              or vector database.
            </p>
          </div>
        </header>

        <section className="mt-12 grid overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c0b10] xl:grid-cols-[360px_minmax(0,1fr)_390px]">
          <aside className="border-b border-white/10 p-5 md:p-7 xl:border-b-0 xl:border-r">
            <SectionLabel icon={<Bot size={14} />} text="1 · Define the agent" />
            <label className="mt-5 block">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
                Agent role
              </span>
              <select
                value={roleId}
                onChange={(event) =>
                  setRoleId(
                    event.target.value as (typeof ROLE_OPTIONS)[number]["id"],
                  )
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white/70"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                System instruction
              </p>
              <p className="mt-2 text-[11px] leading-5 text-white/65">
                {role.instruction}
              </p>
            </div>

            <SectionLabel
              icon={<Upload size={14} />}
              text="2 · Add knowledge"
              className="mt-8"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/18 text-xs font-semibold text-white/55 hover:border-blue-300/35 hover:bg-blue-300/[0.04]"
            >
              <Upload size={14} /> Add local text files
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".txt,.md,.csv,.json,text/plain,text/csv,application/json"
              className="sr-only"
              aria-label="Add local knowledge files"
              onChange={(event) => {
                if (event.target.files) void addFiles(event.target.files);
              }}
            />
            <div className="mt-4 space-y-2">
              {documents.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3 py-3"
                >
                  <FileText size={13} className="shrink-0 text-blue-200/55" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-white/50">
                    {source.name}
                  </span>
                  <span className="font-mono text-[10px] text-white/55">
                    {source.text.length}c
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={buildIndex}
              className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-300 px-4 text-xs font-semibold text-black"
            >
              <Database size={14} /> Build searchable index
            </button>
          </aside>

          <div className="min-w-0 p-5 md:p-7">
            <SectionLabel icon={<Search size={14} />} text="3 · Ask and inspect" />
            <label className="mt-5 block">
              <span className="sr-only">Question for the agent</span>
              <textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/12 bg-black/30 p-4 text-sm leading-6 text-white/75 outline-none focus:border-blue-300/45"
              />
            </label>
            <button
              type="button"
              onClick={runAgent}
              className="relative z-10 mt-3 inline-flex min-h-11 scroll-mb-28 items-center gap-2 rounded-full bg-white px-5 text-xs font-semibold text-black"
            >
              <Play size={13} /> Run grounded agent
            </button>
            <p
              role="status"
              aria-live="polite"
              className="mt-4 font-mono text-[10px] text-blue-200/55"
            >
              {status}
            </p>

            <div
              role="region"
              aria-label="Grounded response"
              className="mt-7 rounded-[1.5rem] border border-white/10 bg-black/25 p-5"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-blue-300" />
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/60">
                  Grounded response
                </p>
              </div>
              <p className="mt-5 min-h-24 text-sm leading-7 text-white/65">
                {answer ||
                  "Run the agent to create an answer from retrieved passages."}
              </p>
            </div>

            <div className="mt-7 grid gap-3">
              {matches.map((match, index) => (
                <article
                  key={match.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-blue-200/60">
                      Match {index + 1} · {match.source}
                    </p>
                    <span className="rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] text-white/60">
                      {match.score}% relevance
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-white/65">
                    {match.text}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="border-t border-white/10 p-5 md:p-7 xl:border-l xl:border-t-0">
            <SectionLabel
              icon={<CheckCircle2 size={14} />}
              text="4 · Verify the contract"
            />
            <dl className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Sources" value={String(documents.length)} />
              <Metric label="Chunks" value={String(chunks.length)} />
              <Metric label="Top K" value="4" />
              <Metric label="External calls" value="0" />
            </dl>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/60">
                Pipeline
              </p>
              <ol className="mt-4 space-y-4">
                {[
                  ["Parse", "Read permitted text locally."],
                  ["Chunk", "Split with controlled overlap."],
                  ["Retrieve", "Rank passages against the question."],
                  ["Ground", "Compose only from matched evidence."],
                  ["Cite", "Attach the source to each claim."],
                ].map(([title, detail], index) => (
                  <li
                    key={title}
                    className="grid grid-cols-[24px_1fr] gap-3"
                  >
                    <span className="font-mono text-[10px] text-blue-200/55">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white/65">
                        {title}
                      </p>
                      <p className="mt-1 text-[10px] leading-5 text-white/60">
                        {detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <button
              type="button"
              onClick={exportManifest}
              className="mt-6 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-white/14 text-xs font-semibold text-white/60 hover:bg-white/[0.04]"
            >
              <Download size={13} /> Export agent manifest
            </button>
            <p className="mt-4 text-[10px] leading-5 text-white/55">
              This browser lab uses deterministic retrieval and extractive
              synthesis so every result is inspectable. A production deployment
              could replace those stages with embeddings and an LLM while
              preserving the same contract.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}

function SectionLabel({
  icon,
  text,
  className = "",
}: {
  icon: ReactNode;
  text: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/60 ${className}`}
    >
      <span className="text-blue-200/55">{icon}</span>
      {text}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <dt className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/55">
        {label}
      </dt>
      <dd className="mt-2 font-mono text-sm text-white/70">{value}</dd>
    </div>
  );
}
