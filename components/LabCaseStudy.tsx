interface CaseStudyStat {
  value: string;
  label: string;
}

export default function LabCaseStudy({
  challenge,
  solution,
  architecture,
  decisions,
  competencies,
  outcomes,
}: {
  challenge: string;
  solution: string;
  architecture: string[];
  decisions: string[];
  competencies: string[];
  outcomes: CaseStudyStat[];
}) {
  return (
    <section className="mt-24 border-t border-border pt-20">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            Engineering case study
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-fg md:text-5xl">
            From problem to working system.
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-3">
            {outcomes.map((outcome) => (
              <div
                key={outcome.label}
                className="rounded-xl border border-border bg-surface/50 p-4"
              >
                <p className="text-2xl font-semibold text-fg">{outcome.value}</p>
                <p className="mt-1 text-xs leading-5 text-fg-muted">
                  {outcome.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          <div className="grid gap-8 md:grid-cols-2">
            <CaseBlock title="Challenge" body={challenge} />
            <CaseBlock title="Solution" body={solution} />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              Architecture
            </h3>
            <ol className="mt-5 grid gap-3">
              {architecture.map((item, index) => (
                <li
                  key={item}
                  className="flex gap-4 border-b border-border pb-3 text-sm leading-6 text-fg-muted"
                >
                  <span className="font-mono text-xs text-fg">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <BulletBlock title="Key decisions" items={decisions} />
            <BulletBlock title="Competencies shown" items={competencies} />
          </div>
        </div>
      </div>
    </section>
  );
}

function CaseBlock({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-fg-muted">{body}</p>
    </div>
  );
}

function BulletBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
        {title}
      </h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-fg-muted">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fg" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
