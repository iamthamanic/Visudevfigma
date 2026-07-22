/**
 * useProject — race-safe single-project fetch by id; port injectable for DIP.
 */
import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../lib/visudev/types";
import { projectsApiAdapter } from "../services/projects.api-adapter";
import { toSafeClientError } from "../services/projects.errors";
import type { ProjectsApiPort } from "../services/projects.port";
import { fetchProject, normalizeProjectId } from "../services/projects.service";

export function useProject(projectId: string | null, port: ProjectsApiPort = projectsApiAdapter) {
  const resolvedId = projectId ? normalizeProjectId(projectId) : null;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(() => Boolean(resolvedId));
  const [error, setError] = useState<string | null>(null);
  const requestGeneration = useRef(0);

  useEffect(() => {
    const token = ++requestGeneration.current;
    if (!resolvedId) {
      setProject(null);
      setError(null);
      setLoading(false);
      return () => {
        requestGeneration.current += 1;
      };
    }

    setLoading(true);
    void (async () => {
      try {
        const fetchResult = await fetchProject(resolvedId, port);
        if (token !== requestGeneration.current) return;
        if (fetchResult.success && fetchResult.data) {
          setProject(fetchResult.data);
          setError(null);
        } else {
          setProject(null);
          setError(toSafeClientError(fetchResult.error, "Failed to fetch project"));
        }
      } catch {
        if (token !== requestGeneration.current) return;
        setProject(null);
        setError("Failed to fetch project");
      } finally {
        if (token === requestGeneration.current) setLoading(false);
      }
    })();

    return () => {
      requestGeneration.current += 1;
    };
  }, [resolvedId, port]);

  return { project, loading, error };
}
