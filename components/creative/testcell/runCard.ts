import { MPH_PER_MS, type RunResult } from "./physics";

// Renders a 1200x630 spec card for a completed run and downloads it as a
// PNG — the same toDataURL/anchor pattern SignalBloom uses for frame export.
export function exportRunCard(result: RunResult, paintName: string): void {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
  const sans = "ui-sans-serif, system-ui, sans-serif";

  context.fillStyle = "#050505";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "rgba(255,255,255,0.14)";
  context.lineWidth = 2;
  context.strokeRect(24, 24, width - 48, height - 48);

  context.fillStyle = "rgba(255,255,255,0.45)";
  context.font = `600 16px ${mono}`;
  context.fillText("APEX HYPERCARS · TEST CELL", 64, 84);

  context.fillStyle = "#ffffff";
  context.font = `600 44px ${sans}`;
  context.fillText("APX-01 performance run", 64, 140);

  context.fillStyle = "rgba(255,255,255,0.55)";
  context.font = `400 20px ${mono}`;
  context.fillText(
    `${paintName}  ·  ${result.config.aero} aero  ·  ${result.config.wheelSize}" wheels`,
    64,
    180,
  );

  const rows: Array<[string, string]> = result.milestones.map((milestone) => [
    milestone.label,
    milestone.value,
  ]);
  context.font = `400 22px ${mono}`;
  rows.forEach(([label, value], index) => {
    const y = 250 + index * 52;
    context.fillStyle = "rgba(255,255,255,0.4)";
    context.fillText(label, 64, y);
    context.fillStyle = "#ffffff";
    context.fillText(value, 320, y);
  });

  // Mini speed trace, lower right.
  const chart = { x: 640, y: 240, w: 470, h: 300 };
  context.strokeStyle = "rgba(255,255,255,0.12)";
  context.lineWidth = 1;
  context.strokeRect(chart.x, chart.y, chart.w, chart.h);
  const samples = result.samples;
  if (samples.length > 1) {
    const duration = samples[samples.length - 1].t;
    const maxMph = Math.max(result.topSpeedMph, 1);
    context.beginPath();
    context.strokeStyle = "#60a5fa";
    context.lineWidth = 3;
    const stride = Math.max(1, Math.floor(samples.length / chart.w));
    for (let index = 0; index < samples.length; index += stride) {
      const sample = samples[index];
      const x = chart.x + (sample.t / duration) * chart.w;
      const y =
        chart.y +
        chart.h -
        (Math.min(sample.v * MPH_PER_MS, maxMph) / maxMph) * (chart.h - 12);
      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
  }
  context.fillStyle = "rgba(255,255,255,0.35)";
  context.font = `400 14px ${mono}`;
  context.fillText(
    `speed trace · ${result.durationS.toFixed(1)} s to ${result.topSpeedMph} mph`,
    chart.x,
    chart.y + chart.h + 28,
  );

  const anchor = document.createElement("a");
  anchor.download = "apex-run-card.png";
  anchor.href = canvas.toDataURL("image/png");
  anchor.click();
}
