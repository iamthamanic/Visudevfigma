/**
 * Fullscreen toggle — keeps graph shell usable when browser blocks requestFullscreen.
 */

import { useEffect, useRef, useState } from "react";

export function useDependenciesFullscreen() {
  const shellRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(document.fullscreenElement === shellRef.current);
    };
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = async () => {
    const element = shellRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen();
        return;
      }
      if (typeof element.requestFullscreen !== "function") return;
      await element.requestFullscreen();
    } catch {
      console.warn("[DependenciesView] Fullscreen request failed.");
    }
  };

  return { shellRef, isFullscreen, toggleFullscreen };
}
