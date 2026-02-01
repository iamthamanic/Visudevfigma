import { useState } from "react";
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
          <ProjectsPage onProjectSelect={handleProjectSelect} onNewProject={handleNewProject} />
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

        {activeScreen === "settings" && activeProject && <SettingsPage project={activeProject} />}

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
