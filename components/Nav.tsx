"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/", label: "Work" },
  { href: "/creative", label: "Creative" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header
      className={`fixed bottom-4 min-[414px]:bottom-auto min-[414px]:top-10 left-1/2 -translate-x-1/2 z-[9990] transition-opacity duration-700 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative h-11 w-max rounded-full px-3 bg-white/75 dark:bg-[#111]/70 backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_4px_28px_rgba(0,0,0,0.09),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.12),0_4px_28px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/30 rounded-full" />
        <div className="relative h-full flex items-center gap-5">
          <Link
            href="/"
            className="flex items-center shrink-0 pl-1 text-sm font-bold tracking-tight text-fg transition-opacity duration-200 hover:opacity-70"
          >
            IH
          </Link>
          <nav className="flex items-center gap-0.5">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/" || pathname.startsWith("/work")
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-3 py-1.5 text-sm"
                >
                  {active ? (
                    <span className="absolute inset-0 rounded-full bg-white dark:bg-white/[0.14] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]" />
                  ) : null}
                  <span
                    className={`relative z-10 transition-colors duration-200 ${
                      active ? "text-fg font-medium" : "text-fg-muted hover:text-fg"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
