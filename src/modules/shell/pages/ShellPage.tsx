import { useEffect, useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../../contexts/useAuth";
import { useVisudev } from "../../../lib/visudev/store";
import { Sidebar } from "../components/Sidebar";
import type { ShellScreen } from "../types";
import styles from "../styles/ShellPage.module.css";

const ProjectsPage = lazy(() =>
  import("../../projects").then((m) => ({ default: m.ProjectsPage })),
);
const AppFlowPage = lazy(() => import("../../appflow").then((m) => ({ default: m.AppFlowPage })));
const BlueprintPage = lazy(() =>
  import("../../blueprint").then((m) => ({ default: m.BlueprintPage })),
);
const DataPage = lazy(() => import("../../data").then((m) => ({ default: m.DataPage })));
const LogsPage = lazy(() => import("../../logs").then((m) => ({ default: m.LogsPage })));
const SettingsPage = lazy(() =>
  import("../../settings").then((m) => ({ default: m.SettingsPage })),
);

export function ShellPage() {
  const [activeScreen, setActiveScreen] = useState<ShellScreen>("projects");
  const { activeProject, setPreviewAccessToken } = useVisudev();
  const { session } = useAuth();

  useEffect(() => {
    setPreviewAccessToken(session?.access_token ?? null);
  }, [session?.access_token, setPreviewAccessToken]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected") {
      setActiveScreen("settings");
      const path = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", path);
    }
  }, []);

  const handleProjectSelect = () => {
    setActiveScreen("appflow");
  };

  const handleNewProject = () => {
    setActiveScreen("projects");
  };

  return (
    <div className={styles.root}>
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={setActiveScreen}
        onNewProject={handleNewProject}
      />

      <main className={styles.main}>
        <Suspense
          fallback={
            <div className={styles.suspenseFallback}>
              <Loader2 className={styles.suspenseSpinner} aria-hidden="true" />
              <p className={styles.suspenseText}>Lade...</p>
            </div>
          }
        >
          {activeScreen === "projects" && (
            <ProjectsPage
              onProjectSelect={handleProjectSelect}
              onNewProject={handleNewProject}
              onOpenSettings={() => setActiveScreen("settings")}
            />
          )}

          {activeScreen === "appflow" && activeProject && (
            <AppFlowPage
              projectId={activeProject.id}
              githubRepo={activeProject.github_repo}
              githubBranch={activeProject.github_branch}
            />
          )}

          {activeScreen === "blueprint" && activeProject && (
            <BlueprintPage projectId={activeProject.id} />
          )}

          {activeScreen === "data" && activeProject && <DataPage projectId={activeProject.id} />}

          {activeScreen === "logs" && activeProject && <LogsPage projectId={activeProject.id} />}

          {activeScreen === "settings" && <SettingsPage project={activeProject ?? null} />}

          {!activeProject && activeScreen !== "projects" && (
            <div className={styles.emptyState}>
              <div className={styles.emptyCard}>
                <p className={styles.emptyTitle}>Kein Projekt ausgewählt</p>
                <button
                  type="button"
                  onClick={() => setActiveScreen("projects")}
                  className={styles.emptyAction}
                >
                  Projekt auswählen
                </button>
              </div>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
}
