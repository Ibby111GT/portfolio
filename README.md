# Ibrahim Hussain — Interactive Portfolio

[![CI](https://github.com/Ibby111GT/portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/Ibby111GT/portfolio/actions/workflows/ci.yml)

A portfolio built as an **interactive engineering workbench** rather than a résumé page. Every project is something you can operate in the browser — a live security operations desk, a client-side password auditor, a WebGL construction-review viewer, a GIS route planner, runnable data pipelines, and a set of generative simulations. All of it is static, self-contained, and runs with no backend and no network calls.

**Live:** https://portfolio-six-dusky-10.vercel.app

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, React 19, static export) |
| 3D / WebGL | `three` + `@react-three/fiber` + `@react-three/drei` |
| Maps / GIS | `leaflet` |
| Styling | Tailwind CSS, class-based dark mode, a two-accent (blue/red) design system |
| Fonts | Self-hosted Geist |
| Tests | Vitest (unit) + `next build` (route compilation) |
| Deploy | Vercel (production), with a Cloudflare Workers adapter available |

Everything interactive is deterministic (seeded PRNGs, fixed physics steps) and honours `prefers-reduced-motion`.

## Route directory

**Projects** — one catalog of working software (`/projects`)
- `/labs/soc-command-deck` — live security-operations dashboard: streaming synthetic alerts, analyst triage, MITRE ATT&CK heatmap, real-time risk index
- `/labs/security-checkup` — privacy-first password auditor; entropy, breach block-list, and pattern analysis run entirely in the browser
- `/labs/threat-hunt` — SignalTrace, an identity-intrusion hunt scored on precision
- `/labs/data-systems/{cybersecurity,finance,healthcare}` — runnable five-stage data pipelines you can break and repair
- `/projects/{threatlens,netrecon,logsentry,passaudit,webrecon}` — documented Python security tools (source on GitHub)
- `/projects/peptides` — a synthetic healthcare data-governance explorer

**Work** — professional case studies (`/work/[slug]`): UT System security, a private-AI feasibility capstone, cloud engineering, and identity/access management.

**Creative** — ten interactive studies (`/creative` and `/creative/[slug]`): a security threat globe, a clean-energy grid, a generative forest, a WebGL cabinetry/automotive blueprint viewer, a Leaflet expedition mapper, and a generative signal field.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build — type-checks and statically compiles every route |
| `npm start` | Serve the production build |
| `npm test` | Run the Vitest unit suite |
| `npm run lint` | Run ESLint with Next.js Core Web Vitals rules |
| `npm run test:e2e` | Run the Playwright browser smoke suite |

## Testing

Pure logic and catalog data integrity are covered by Vitest (`tests/*.test.ts`) — password-strength scoring, the seeded PRNGs behind the generative pieces, and the invariants of the project catalogs (unique slugs, valid routes, known filters). Playwright (`tests/e2e/*.spec.ts`) opens the production build at desktop and mobile widths and exercises the two security demos. `npm run build` type-checks and statically renders every page, so a broken route fails the build. Continuous integration runs lint, unit tests, the production build, and browser smoke tests on every push and pull request.

## Design system

The entire site is black, white, and two accents — **blue** for healthy/informational states and **red** for alerts and anything security-related — tuned per theme so contrast passes WCAG AA in both light and dark mode.

## License

[MIT](LICENSE) © 2026 Ibrahim Hussain
