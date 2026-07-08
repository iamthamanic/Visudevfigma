/**
 * Minimal Node 22 sqlite typings for local Data introspection.
 * Location: local-engine/src/types/node-sqlite.d.ts
 */

declare module "node:sqlite" {
  export class DatabaseSync {
    constructor(path: string, options?: { readOnly?: boolean });
    prepare(sql: string): {
      all(): unknown[];
    };
    close(): void;
  }
}
