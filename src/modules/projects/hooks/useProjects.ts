/**
 * useProjects — race-safe project list state; composes mutations from useProjectMutations.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "../../../lib/visudev/types";
import { projectsApiAdapter } from "../services/projects.api-adapter";
import { toSafeClientError } from "../services/projects.errors";
import type { ProjectsApiPort } from "../services/projects.port";
import { fetchProjects } from "../services/projects.service";
import { useProjectMutations } from "./useProjectMutations";

export function useProjects(port: ProjectsApiPort = projectsApiAdapter) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  const refresh = useCallback(async () => {
    const token = ++requestGeneration.current;
    setLoading(true);
    try {
      const fetchResult = await fetchProjects(port);
      if (token !== requestGeneration.current) return;
      if (fetchResult.success) {
        setProjects(fetchResult.data || []);
        setError(null);
      } else {
        setProjects([]);
        setError(toSafeClientError(fetchResult.error, "Failed to fetch projects"));
      }
    } catch {
      if (token !== requestGeneration.current) return;
      setProjects([]);
      setError("Failed to fetch projects");
    } finally {
      if (token === requestGeneration.current) setLoading(false);
    }
  }, [port]);

  useEffect(() => {
    void refresh();
    return () => {
      requestGeneration.current += 1;
    };
  }, [refresh]);

  const mutations = useProjectMutations(refresh, port);

  return {
    projects,
    loading,
    error,
    refresh,
    ...mutations,
  };
}
