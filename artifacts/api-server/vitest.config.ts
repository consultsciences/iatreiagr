import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    forceRerunTriggers: [
      "**/package.json/**",
      "**/vitest.config.*/**",
      "**/vite.config.*/**",
      path.resolve(__dirname, "../../lib/api-zod/**"),
      path.resolve(__dirname, "../../lib/db/**"),
    ],
  },
});
