import Link from "next/link";

export default function LabShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 pb-28 pt-28 sm:px-6 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/labs"
          className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-fg"
        >
          &lt;- All labs
        </Link>
        <div className="mb-8 mt-8 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-fg-muted">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-fg md:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted md:text-lg">
            {description}
          </p>
        </div>
        {children}
      </div>
    </main>
  );
}
