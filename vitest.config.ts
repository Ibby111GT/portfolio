import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Minimal, self-contained test config. The unit suite covers pure library
// logic and catalog data integrity — no DOM and no Next/Vite plugins needed,
// so it stays fast and isolated from the Cloudflare/RSC build pipeline.
export default defineConfig({
  resolve: {
    // Mirror tsconfig's "@/*" so tests can import app modules that use it.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**", "node_modules/**"],
  },
});
