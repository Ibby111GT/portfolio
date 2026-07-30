export default function Loading() {
  return (
    <main
      aria-label="Loading page"
      aria-busy="true"
      className="mx-auto min-h-[80vh] w-full max-w-7xl px-5 py-24 sm:px-8"
    >
      <div className="h-3 w-28 animate-pulse bg-accent/35" />
      <div className="mt-8 h-14 max-w-3xl animate-pulse bg-[var(--surface)] sm:h-20" />
      <div className="mt-4 h-5 max-w-xl animate-pulse bg-[var(--surface)]" />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-52 animate-pulse border border-[var(--border)] bg-[var(--surface)]"
          />
        ))}
      </div>
      <p className="sr-only">Loading the selected portfolio experience.</p>
    </main>
  );
}
