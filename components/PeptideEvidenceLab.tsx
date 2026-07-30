"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PEPTIDE_RECORDS,
  type PeptideQuality,
  type PeptideRecord,
  type PeptideStatus,
} from "@/lib/peptideDemo";

type StatusFilter = PeptideStatus | "All";
type QualityFilter = PeptideQuality | "All";

const STATUS_STYLE: Record<PeptideStatus, string> = {
  Active: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Completed: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  Paused: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

export default function PeptideEvidenceLab() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("All");
  const [quality, setQuality] = useState<QualityFilter>("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeRecord, setActiveRecord] = useState<PeptideRecord | null>(
    PEPTIDE_RECORDS[0],
  );
  const [notice, setNotice] = useState("Select a record to inspect its lineage.");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return PEPTIDE_RECORDS.filter((record) => {
      const searchable = [
        record.id,
        record.name,
        record.focus,
        record.owner,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!needle || searchable.includes(needle)) &&
        (status === "All" || record.status === status) &&
        (quality === "All" || record.quality === quality)
      );
    });
  }, [quality, query, status]);

  const metrics = useMemo(() => {
    const average = visible.length
      ? Math.round(
          visible.reduce((sum, record) => sum + record.completeness, 0) /
            visible.length,
        )
      : 0;
    const coverage = visible.length
      ? Math.round(
          (visible.filter((record) => record.sourceId).length / visible.length) *
            100,
        )
      : 0;
    return {
      active: visible.filter((record) => record.status === "Active").length,
      average,
      coverage,
    };
  }, [visible]);

  const comparison = PEPTIDE_RECORDS.filter((record) =>
    selected.includes(record.id),
  );

  useEffect(() => {
    setActiveRecord((current) => {
      if (current && visible.some((record) => record.id === current.id)) {
        return current;
      }
      return visible[0] ?? null;
    });
  }, [visible]);

  function toggleSelected(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        setNotice("Removed the record from comparison.");
        return current.filter((item) => item !== id);
      }
      if (current.length === 3) {
        setNotice("Comparison is limited to three records so it stays readable.");
        return current;
      }
      setNotice("Added the record to the side-by-side comparison.");
      return [...current, id];
    });
  }

  function reset() {
    setQuery("");
    setStatus("All");
    setQuality("All");
    setNotice("Filters reset. All synthetic records are visible.");
  }

  function exportView() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            disclosure: "Synthetic demonstration data. Not for medical use.",
            exportedAt: new Date().toISOString(),
            filters: { query, status, quality },
            records: visible,
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "peptide-evidence-view.json";
    link.click();
    URL.revokeObjectURL(link.href);
    setNotice(`Exported ${visible.length} visible synthetic records as JSON.`);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface/30">
      <div className="border-b border-red-500/20 bg-red-500/[0.06] px-5 py-4 text-sm leading-6 text-fg-muted">
        <strong className="text-fg">Synthetic demonstration data.</strong> Every
        program and identifier is fictional. This shows data operations, not
        medical guidance.
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-border border-b border-border lg:grid-cols-4 lg:divide-y-0">
        <Metric label="Records in view" value={String(visible.length)} />
        <Metric label="Active studies" value={String(metrics.active)} />
        <Metric label="Avg. completeness" value={`${metrics.average}%`} />
        <Metric label="Source coverage" value={`${metrics.coverage}%`} />
      </div>

      <div className="grid gap-3 border-b border-border p-4 lg:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
        <label className="grid gap-1.5 text-xs text-fg-muted">
          Search
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Program, ID, area, or owner"
            className="rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-fg/50"
          />
        </label>
        <label className="grid gap-1.5 text-xs text-fg-muted">
          Study status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-fg/50"
          >
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
            <option>Paused</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-xs text-fg-muted">
          Data quality
          <select
            value={quality}
            onChange={(event) => setQuality(event.target.value as QualityFilter)}
            className="rounded-lg border border-border bg-bg px-3 py-2.5 text-sm text-fg outline-none focus:border-fg/50"
          >
            <option>All</option>
            <option>Validated</option>
            <option>Review</option>
          </select>
        </label>
        <button
          type="button"
          onClick={reset}
          className="self-end rounded-lg border border-border px-4 py-2.5 text-sm text-fg-muted transition-colors hover:text-fg"
        >
          Reset
        </button>
      </div>

      <div className="grid lg:grid-cols-[1.25fr_0.75fr]">
        <div className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
            <p className="font-mono text-[11px] text-fg-muted" aria-live="polite">
              {visible.length} of {PEPTIDE_RECORDS.length} records
            </p>
            <button
              type="button"
              onClick={exportView}
              className="text-xs font-medium text-fg-muted transition-colors hover:text-fg"
            >
              Export current view ↓
            </button>
          </div>
          <div className="max-h-[590px] overflow-auto">
            {visible.length ? (
              visible.map((record) => (
                <RecordRow
                  key={record.id}
                  record={record}
                  checked={selected.includes(record.id)}
                  active={activeRecord?.id === record.id}
                  onCheck={() => toggleSelected(record.id)}
                  onOpen={() => {
                    setActiveRecord(record);
                    setNotice(`Opened ${record.name}.`);
                  }}
                />
              ))
            ) : (
              <div className="px-5 py-16 text-center">
                <p className="font-medium text-fg">No records match.</p>
                <p className="mt-2 text-sm text-fg-muted">
                  Reset the view or try a broader search.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="min-w-0 p-5 md:p-6">
          {activeRecord ? (
            <RecordDetail record={activeRecord} />
          ) : (
            <p className="text-sm text-fg-muted">Choose a record to inspect.</p>
          )}
        </aside>
      </div>

      {comparison.length ? (
        <section className="border-t border-border bg-bg/40 p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
                Side-by-side review
              </p>
              <h3 className="mt-2 text-xl font-semibold text-fg">
                {comparison.length} selected record
                {comparison.length === 1 ? "" : "s"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelected([]);
                setNotice("Comparison cleared.");
              }}
              className="text-xs font-medium text-fg-muted transition-colors hover:text-fg"
            >
              Clear comparison
            </button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {comparison.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-border bg-surface/50 p-4"
              >
                <p className="font-mono text-[10px] text-fg-muted">{record.id}</p>
                <h4 className="mt-1 font-semibold text-fg">{record.name}</h4>
                <dl className="mt-4 grid gap-3 text-xs">
                  <ComparisonField label="Status" value={record.status} />
                  <ComparisonField label="Quality" value={`${record.quality} · ${record.completeness}%`} />
                  <ComparisonField label="Stage" value={record.stage} />
                  <ComparisonField label="Owner" value={record.owner} />
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <p className="border-t border-border px-5 py-3 font-mono text-[10px] text-fg-muted" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-28 p-4">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-4 text-2xl font-semibold text-fg">{value}</p>
    </div>
  );
}

function RecordRow({
  record,
  checked,
  active,
  onCheck,
  onOpen,
}: {
  record: PeptideRecord;
  checked: boolean;
  active: boolean;
  onCheck: () => void;
  onOpen: () => void;
}) {
  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border px-4 py-4 transition-colors ${
        active ? "bg-fg/[0.045]" : "hover:bg-fg/[0.025]"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onCheck}
        aria-label={`Select ${record.name} for comparison`}
        className="h-4 w-4 accent-current"
      />
      <button type="button" onClick={onOpen} className="min-w-0 text-left">
        <span className="block truncate text-sm font-medium text-fg">
          {record.name}
        </span>
        <span className="mt-1 block truncate font-mono text-[10px] text-fg-muted">
          {record.id} · {record.focus}
        </span>
      </button>
      <div className="text-right">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${STATUS_STYLE[record.status]}`}
        >
          {record.status}
        </span>
        <span className="mt-1 block text-[10px] text-fg-muted">
          {record.quality} · {record.completeness}%
        </span>
      </div>
    </div>
  );
}

function RecordDetail({ record }: { record: PeptideRecord }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-fg-muted">
        {record.id} · record detail
      </p>
      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-fg">
        {record.name}
      </h3>
      <p className="mt-3 text-sm leading-6 text-fg-muted">{record.summary}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-xs">
        <ComparisonField label="Stage" value={record.stage} />
        <ComparisonField label="Data owner" value={record.owner} />
        <ComparisonField label="Updated" value={record.updated} />
        <ComparisonField
          label="Source identity"
          value={record.sourceId ?? "Missing — review required"}
        />
      </dl>

      <div className="mt-6 rounded-xl border border-border bg-bg/60 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-fg">
          Practical use
        </p>
        <p className="mt-2 text-xs leading-6 text-fg-muted">{record.practical}</p>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-fg">
          Data lineage
        </p>
        <p className="mt-2 text-xs leading-5 text-fg-muted">{record.source}</p>
        <ol className="mt-4 space-y-4">
          {record.lineage.map((event, index) => (
            <li key={event.step} className="flex gap-3">
              <span className="font-mono text-[10px] text-fg-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-xs font-medium text-fg">{event.step}</p>
                <p className="mt-1 text-xs leading-5 text-fg-muted">
                  {event.detail}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ComparisonField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="mt-1 text-fg">{value}</dd>
    </div>
  );
}
