"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/creative", label: "Creative" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="nav-enter fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] min-[414px]:bottom-auto min-[414px]:top-[calc(1.5rem+env(safe-area-inset-top))] left-1/2 z-50 -translate-x-1/2">
      <div className="relative h-12 w-max max-w-[calc(100vw-1rem)] rounded-full bg-white/80 px-2.5 backdrop-blur-xl backdrop-saturate-[180%] shadow-[0_0_0_0.5px_rgba(0,0,0,0.1),0_4px_28px_rgba(0,0,0,0.09),inset_0_1px_0_rgba(255,255,255,1)] dark:bg-[#111]/75 dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.12),0_4px_28px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.12)]">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent dark:via-white/30 rounded-full" />
        <div className="relative flex h-full items-center gap-2 min-[360px]:gap-3">
          <Link
            href="/"
            aria-label="Ibrahim Hussain — home"
            className="flex h-11 shrink-0 items-center px-1.5 text-sm font-bold tracking-tight text-fg transition-opacity duration-200 hover:opacity-70"
          >
            IH
          </Link>
          <nav className="flex items-center gap-0.5">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : link.href === "/projects"
                    ? pathname.startsWith("/projects") ||
                      pathname.startsWith("/labs") ||
                      pathname.startsWith("/work")
                    : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="relative flex h-11 items-center px-2 text-[13px] min-[360px]:px-2.5 min-[390px]:px-3 min-[390px]:text-sm"
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
