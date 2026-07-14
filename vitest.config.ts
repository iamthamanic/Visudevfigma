import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "local-engine/**/*.{test,spec}.ts",
      "shared/**/*.{test,spec}.ts",
    ],
    environmentMatchGlobs: [["local-engine/**", "node"]],
    exclude: ["src/supabase/functions/**"],
    passWithNoTests: true,
  },
});
