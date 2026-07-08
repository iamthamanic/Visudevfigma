/**
 * Merge runtime crawl screenshot URLs into screen list.
 * Location: local-engine/src/lib/runtime-screenshots.ts
 */

type RuntimeCapture = {
  screenId?: string;
  screenshotUrl?: string;
};

type RuntimePayload = {
  stateScreens?: RuntimeCapture[];
};

type ScreenLike = {
  id: string;
  screenshotUrl?: string;
  screenshotStatus?: string;
};

export function applyRuntimeScreenshots<T extends ScreenLike>(
  screens: T[],
  runtime: RuntimePayload | null | undefined,
): T[] {
  const captureByScreenId = new Map(
    (runtime?.stateScreens ?? [])
      .filter((capture) => capture.screenId && capture.screenshotUrl)
      .map((capture) => [capture.screenId as string, capture.screenshotUrl as string]),
  );
  if (captureByScreenId.size === 0) {
    return screens;
  }
  return screens.map((screen) => {
    const screenshotUrl = captureByScreenId.get(screen.id);
    if (!screenshotUrl) {
      return screen;
    }
    return {
      ...screen,
      screenshotUrl,
      screenshotStatus: "ok",
    };
  });
}
