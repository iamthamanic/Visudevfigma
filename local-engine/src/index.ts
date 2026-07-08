/**
 * VisuDEV Local Engine entrypoint.
 * Location: local-engine/src/index.ts
 */

import { startServer } from "./server.js";

startServer().catch((error) => {
  console.error("[visudev-local-engine] failed to start:", error);
  process.exit(1);
});
