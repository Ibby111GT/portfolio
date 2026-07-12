"use client";

import Link from "next/link";
import CountUp from "@/components/CountUp";
import Reveal from "@/components/Reveal";

export interface ProjectStat {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export interface ProjectCardData {
  tags: string[];
  title: string;
  subtitle: string;
  stats: ProjectStat[];
  glow: "blue" | "purple" | "green" | "amber";
  featured?: boolean;
  deliverables?: string[];
  href?: string;
}

const GLOWS = {
  blue: {
    shadow: "#3c64ff28",
    left: "radial-gradient(ellipse at 20% 50%, #3c64ff88 0%, transparent 70%)",
    right: "radial-gradient(ellipse at 80% 40%, #823ce666 0%, transparent 70%)",
  },
  purple: {
    shadow: "#823ce628",
    left: "radial-gradient(ellipse at 20% 50%, #823ce688 0%, transparent 70%)",
    right: "radial-gradient(ellipse at 80% 40%, #3c64ff66 0%, transparent 70%)",
  },
  green: {
    shadow: "#22c55e28",
    left: "radial-gradient(ellipse at 20% 50%, #16a34a77 0%, transparent 70%)",
    right: "radial-gradient(ellipse at 80% 40%, #0d948866 0%, transparent 70%)",
  },
  amber: {
    shadow: "#f59e0b28",
    left: "radial-gradient(ellipse at 20% 50%, #d9770688 0%, transparent 70%)",
    right: "radial-gradient(ellipse at 80% 40%, #dc262655 0%, transparent 70%)",
  },
} as const;

export default function ProjectCard({
  card,
  delay = 0,
}: {
  card: ProjectCardData;
  delay?: number;
}) {
  const glow = GLOWS[card.glow];

  const inner = (
    <div
      className={`group relative rounded-2xl overflow-hidden flex flex-col min-h-[320px] h-full transition-transform duration-300 ${
        card.href ? "hover:-translate-y-1" : ""
      } ${card.featured ? "md:flex-row" : ""}`}
      style={{
        boxShadow: `0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.07), 0 0 24px ${glow.shadow}`,
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px z-10 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
      <div className="absolute inset-0 bg-[#08080f]" />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "0%",
          left: "-10%",
          width: "70%",
          height: "100%",
          background: glow.left,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: "0%",
          right: "-10%",
          width: "70%",
          height: "100%",
          background: glow.right,
        }}
      />

      {card.featured && card.deliverables ? (
        <div className="relative flex-shrink-0 overflow-hidden hidden md:flex md:w-[46%] md:items-center md:justify-center">
          <div className="flex items-center justify-center gap-3 px-8">
            {card.deliverables.map((item, index) => (
              <div
                key={item}
                className="rounded-xl bg-white/[0.07] border border-white/[0.09] backdrop-blur-sm px-4 py-6 w-32 text-center transition-transform duration-500 group-hover:-translate-y-1"
                style={{
                  transform: `translateY(${index === 1 ? -26 : -6}px)`,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
                }}
              >
                <p className="text-[11px] uppercase tracking-widest text-white/70 leading-relaxed">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative flex-1 overflow-hidden">
        <div className="relative z-10 px-7 py-7 md:px-10 md:py-10 flex flex-col justify-between gap-8 h-full">
          <div>
            <div className="flex gap-2 flex-wrap">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] md:text-xs uppercase tracking-widest text-white/60 bg-white/[0.09] rounded-md px-2.5 py-1"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h3 className="mt-5 text-2xl md:text-3xl font-bold text-white tracking-tight">
              {card.title}
            </h3>
            <p className="mt-2 text-sm md:text-base text-white/60 leading-relaxed max-w-md">
              {card.subtitle}
            </p>
          </div>
          <div>
            <div className="flex items-end gap-8 flex-wrap">
              {card.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl md:text-3xl font-semibold text-white">
                    <CountUp
                      value={stat.value}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                    />
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-white/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            {card.href ? (
              <p className="mt-6 text-sm font-medium text-white/70 group-hover:text-white transition-colors duration-200">
                View Case Study →
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Reveal className={card.featured ? "col-span-full" : ""} delay={delay}>
      {card.href ? (
        <Link href={card.href} className="block h-full">
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Reveal>
  );
}
