/**
 * JSON file storage for Local Engine (~/.visudev).
 * Location: local-engine/src/storage/file-store.ts
 */

import fs from "node:fs/promises";
import path from "node:path";

const writeLocks = new Map<string, Promise<void>>();

async function withFileLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const previous = writeLocks.get(filePath) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  writeLocks.set(
    filePath,
    previous.then(() => current),
  );
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (writeLocks.get(filePath) === current) {
      writeLocks.delete(filePath);
    }
  }
}

export async function ensureVisuDevDir(baseDir: string): Promise<void> {
  await fs.mkdir(baseDir, { recursive: true });
  await fs.mkdir(path.join(baseDir, "projects"), { recursive: true });
  await fs.mkdir(path.join(baseDir, "runs"), { recursive: true });
  await fs.mkdir(path.join(baseDir, "previews"), { recursive: true });
  await fs.mkdir(path.join(baseDir, "logs"), { recursive: true });
}

export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

export async function writeJsonFile<T>(filePath: string, data: T): Promise<void> {
  await withFileLock(filePath, async () => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
    const payload = `${JSON.stringify(data, null, 2)}\n`;
    await fs.writeFile(tempPath, payload, "utf8");
    await fs.rename(tempPath, filePath);
  });
}

export async function appendJsonLog<T>(filePath: string, entry: T): Promise<void> {
  await withFileLock(filePath, async () => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, "utf8");
  });
}

export async function removePath(targetPath: string): Promise<void> {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}
