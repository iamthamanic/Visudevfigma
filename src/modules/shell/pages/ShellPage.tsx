import { useEffect, useState } from "react";
import { ProjectsPage } from "../../projects";
import { AppFlowPage } from "../../appflow";
import { BlueprintPage } from "../../blueprint";
import { DataPage } from "../../data";
import { LogsPage } from "../../logs";
import { SettingsPage } from "../../settings";
import { useVisudev } from "../../../lib/visudev/store";
import { Sidebar } from "../components/Sidebar";
import type { ShellScreen } from "../types";
import styles from "../styles/ShellPage.module.css";

export function ShellPage() {
  const [activeScreen, setActiveScreen] = useState<ShellScreen>("projects");
  const { activeProject } = useVisudev();

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
      </main>
    </div>
  );
}
