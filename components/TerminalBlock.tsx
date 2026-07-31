export interface TerminalLine {
  command: string;
  comment?: string;
}

export function CommandList({
  label,
  lines,
}: {
  label: string;
  lines: TerminalLine[];
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#070a0f]">
      <div className="border-b border-white/10 px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/65">
          {label}
        </p>
      </div>
      <div className="overflow-x-auto px-4 py-4">
        <pre className="min-w-0 font-mono text-xs leading-6 text-white/80">
          {lines.map((line) => (
            <span key={line.command} className="block">
              {line.comment ? (
                <span className="block text-white/60"># {line.comment}</span>
              ) : null}
              <span className="text-blue-300">$ </span>
              {line.command}
              {"\n"}
            </span>
          ))}
        </pre>
      </div>
    </div>
  );
}

export function OutputBlock({
  label,
  output,
}: {
  label: string;
  output: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#070a0f]">
      <div className="border-b border-white/10 px-4 py-2.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/65">
          {label}
        </p>
      </div>
      <div className="overflow-x-auto px-4 py-4">
        <pre className="min-w-0 whitespace-pre font-mono text-[11px] leading-5 text-white/70">
          {output}
        </pre>
      </div>
    </div>
  );
}
