import { useCallback, useEffect, useRef, useState } from "react";
import type cytoscape from "cytoscape";
import { mountCytoscapeGraph } from "./_mount.js";
import { releaseCytoscapeMount } from "./_release.js";
import { syncGraphElements } from "./_sync.js";
import type { LayoutPreset } from "./_layout.js";
import type { ValidatedGraphCanvasInput } from "./_validate.js";

export function useCytoscapeGraphMount(
  validated: ValidatedGraphCanvasInput,
  layoutPreset: LayoutPreset = "default",
) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const graphRef = useRef<cytoscape.Core | null>(null);
  const elementsRef = useRef({ nodes: validated.nodes, edges: validated.edges });
  const layoutPresetRef = useRef(layoutPreset);
  const mountGenerationRef = useRef(0);
  const hasGraph = validated.hasRenderableNodes;

  layoutPresetRef.current = layoutPreset;

  useEffect(() => {
    elementsRef.current = { nodes: validated.nodes, edges: validated.edges };
  }, [validated.nodes, validated.edges]);

  const setContainerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container || !hasGraph) {
      setInitError(null);
      return () => {
        releaseCytoscapeMount(graphRef, null);
      };
    }

    const generation = ++mountGenerationRef.current;
    let disposed = false;
    let disposeMount: (() => void) | null = null;
    setInitError(null);
    const latestElements = elementsRef.current;
    const mountPreset = layoutPresetRef.current;

    void (async () => {
      try {
        const isStale = () => disposed || generation !== mountGenerationRef.current;
        const mounted = await mountCytoscapeGraph(
          container,
          latestElements.nodes,
          latestElements.edges,
          isStale,
          mountPreset,
        );
        if (!mounted || isStale()) {
          mounted?.cleanup();
          return;
        }

        const mountedGraph = mounted.graph;
        disposeMount = () => {
          mounted.cleanup();
          if (graphRef.current === mountedGraph) {
            graphRef.current = null;
          }
        };
        graphRef.current = mountedGraph;

        try {
          syncGraphElements(
            mountedGraph,
            elementsRef.current.nodes,
            elementsRef.current.edges,
            mountPreset,
          );
        } catch (error) {
          if (isStale()) return;
          releaseCytoscapeMount(graphRef, disposeMount);
          disposeMount = null;
          void error;
          console.warn("[GraphCanvas] Failed to sync graph elements.");
          setInitError("Graph konnte nicht geladen werden.");
          return;
        }
      } catch (error) {
        if (disposed || generation !== mountGenerationRef.current) return;
        void error;
        console.warn("[GraphCanvas] Failed to initialize Cytoscape.");
        setInitError("Graph konnte nicht geladen werden.");
      }
    })();

    return () => {
      disposed = true;
      releaseCytoscapeMount(graphRef, disposeMount);
      disposeMount = null;
    };
  }, [container, hasGraph]);

  return { setContainerRef, hasGraph, initError, graphRef };
}
