export interface WalkthroughStep {
  action: string;
  detail: string;
}

export interface ReadingItem {
  label: string;
  body: string;
}

export default function ProjectWalkthrough({
  plain,
  steps,
  reading,
  practical,
}: {
  plain: string;
  steps: WalkthroughStep[];
  reading: ReadingItem[];
  practical: string;
}) {
  return (
    <section
      id="plain-english"
      className="mt-20 scroll-mt-32 border-t border-border pt-16"
    >
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            In plain English
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-fg md:text-4xl">
            What this is, in plain English.
          </h2>
          <p className="mt-6 max-w-md text-base leading-7 text-fg-muted">{plain}</p>
          <div className="mt-8 rounded-xl border border-border bg-surface/50 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              Where this is actually used
            </h3>
            <p className="mt-3 text-sm leading-7 text-fg-muted">{practical}</p>
          </div>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              Try it: step by step
            </h3>
            <ol className="mt-6 space-y-5">
              {steps.map((step, index) => (
                <li key={step.action} className="flex gap-5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border font-mono text-xs text-fg">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">{step.action}</p>
                    <p className="mt-1.5 text-sm leading-6 text-fg-muted">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-fg">
              What you are looking at
            </h3>
            <dl className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {reading.map((item) => (
                <div key={item.label}>
                  <dt className="font-mono text-xs uppercase tracking-wider text-fg">
                    {item.label}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-6 text-fg-muted">
                    {item.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
