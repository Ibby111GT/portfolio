import Link from "next/link";
import DetailFooterNavigation from "@/components/DetailFooterNavigation";
import DetailNavigator from "@/components/DetailNavigator";

export default function LabShell({
  eyebrow,
  title,
  description,
  slug,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  slug: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 pb-28 pt-28 sm:px-6 md:pt-32">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/projects"
          className="font-mono text-xs uppercase tracking-[0.18em] text-fg-muted transition-colors hover:text-fg"
        >
          &lt;- All projects
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
        <DetailNavigator
          accent="red"
          readingTime="Use it first · 8 min deep dive"
          label="Choose your depth"
          items={[
            { href: "#experience", label: "Run the lab" },
            { href: "#plain-english", label: "Plain-English guide" },
            { href: "#technical-details", label: "Technical details" },
          ]}
          className="mb-10"
        />
        <div id="experience" className="scroll-mt-32">
          {children}
        </div>
        <DetailFooterNavigation currentSlug={slug} className="mt-24" />
      </div>
    </main>
  );
}
