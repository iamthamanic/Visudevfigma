export interface PreviewRunnerClientDeps {
  fetch: typeof fetch;
  now: () => number;
  getLocalStorage: () => Storage | null;
  getSessionStorage: () => Storage | null;
}

const previewRunnerClientDeps: PreviewRunnerClientDeps = {
  fetch: (...args) => fetch(...args),
  now: () => Date.now(),
  getLocalStorage: () => {
    try {
      return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
      return null;
    }
  },
  getSessionStorage: () => {
    try {
      return typeof sessionStorage === "undefined" ? null : sessionStorage;
    } catch {
      return null;
    }
  },
};

export function configurePreviewRunnerClientDeps(
  overrides: Partial<PreviewRunnerClientDeps>,
): void {
  Object.assign(previewRunnerClientDeps, overrides || {});
}

export function getPreviewRunnerClientDeps(): PreviewRunnerClientDeps {
  return previewRunnerClientDeps;
}
