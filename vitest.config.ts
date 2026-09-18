import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // Vitest resolves the browser build of this package, which throws on
      // import. The tests exercise server modules directly, so map to the
      // package's no-op variant.
      "server-only": path.resolve(__dirname, "node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});