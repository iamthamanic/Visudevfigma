/**
 * Search state for DependenciesView — Cmd+K focuses the graph search field.
 */

import { useEffect, useRef, useState, type RefObject } from "react";

export interface DependenciesSearchState {
  searchQuery: string;
  searchInputRef: RefObject<HTMLInputElement>;
  setSearchQuery: (value: string) => void;
  resetSearch: () => void;
}

export function useDependenciesSearch(): DependenciesSearchState {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest("[data-deps-canvas='true']")) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    searchQuery,
    searchInputRef,
    setSearchQuery,
    resetSearch: () => setSearchQuery(""),
  };
}
