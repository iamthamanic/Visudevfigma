import { useState } from "react";
import clsx from "clsx";
import { FolderGit2, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Button } from "../../../components/ui/button";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useAuth } from "../../../contexts/AuthContext";
import { useVisudev } from "../../../lib/visudev/store";
import type { Project } from "../../../lib/visudev/types";
import { api } from "../../../utils/api";
import { ProjectCard } from "../components/ProjectCard";
import { GitHubRepoSelector } from "../components/GitHubRepoSelector";
import { SupabaseProjectSelector } from "../components/SupabaseProjectSelector";
import styles from "../styles/ProjectsPage.module.css";

interface ProjectsPageProps {
  onProjectSelect?: (project: Project) => void;
  onNewProject?: () => void;
  onOpenSettings?: () => void;
}

export function ProjectsPage({ onProjectSelect, onNewProject, onOpenSettings }: ProjectsPageProps) {
  const { session } = useAuth();
  const { projects, projectsLoading, setActiveProject, addProject, updateProject, deleteProject } =
    useVisudev();
  const accessToken = session?.access_token ?? null;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [projectName, setProjectName] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [githubBranch, setGithubBranch] = useState("main");
  const [githubAccessToken, setGithubAccessToken] = useState("");
  const [deployedUrl, setDeployedUrl] = useState("");
  const [supabaseProjectId, setSupabaseProjectId] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseManagementToken, setSupabaseManagementToken] = useState("");

  const handleCreateProject = async () => {
    setIsLoading(true);
    try {
      const newProject: Omit<Project, "id" | "createdAt" | "screens" | "flows"> = {
        name: projectName,
        github_repo: githubRepo,
        github_branch: githubBranch,
        github_access_token: githubAccessToken,
        deployed_url: deployedUrl,
        supabase_project_id: supabaseProjectId,
        supabase_anon_key: supabaseAnonKey,
        supabase_management_token: supabaseManagementToken,
        description: `GitHub: ${githubRepo}${deployedUrl ? ` | Live: ${deployedUrl}` : ""}`,
      };

      const created = addProject(newProject);
      if (githubRepo && accessToken && created.id) {
        await api.integrations.github.setProjectGitHubRepo(
          created.id,
          { repo: githubRepo, branch: githubBranch || "main" },
          accessToken,
        );
      }
      setIsDialogOpen(false);
      setStep(1);
      resetForm();
    } catch {
      toast.error("Projekt konnte nicht erstellt werden.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;

    setIsLoading(true);
    try {
      const updatedProject: Project = {
        ...editingProject,
        name: projectName,
        github_repo: githubRepo,
        github_branch: githubBranch,
        github_access_token: githubAccessToken,
        deployed_url: deployedUrl,
        supabase_project_id: supabaseProjectId,
        supabase_anon_key: supabaseAnonKey,
        supabase_management_token: supabaseManagementToken,
        description: `GitHub: ${githubRepo}${deployedUrl ? ` | Live: ${deployedUrl}` : ""}`,
      };

      updateProject(updatedProject);
      if (githubRepo && accessToken) {
        await api.integrations.github.setProjectGitHubRepo(
          editingProject.id,
          { repo: githubRepo, branch: githubBranch || "main" },
          accessToken,
        );
      }
      setIsEditDialogOpen(false);
      setEditingProject(null);
      resetForm();
    } catch {
      toast.error("Projekt konnte nicht gespeichert werden.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Projekt wirklich löschen?")) return;

    try {
      deleteProject(id);
    } catch {
      alert("Fehler beim Löschen des Projekts");
    }
  };

  const handleProjectClick = (project: Project) => {
    setActiveProject(project);
    onProjectSelect?.(project);
  };

  const handleEditClick = (project: Project) => {
    setEditingProject(project);
    setProjectName(project.name || "");
    setGithubRepo(project.github_repo || "");
    setGithubBranch(project.github_branch || "main");
    setGithubAccessToken(project.github_access_token || "");
    setDeployedUrl(project.deployed_url || "");
    setSupabaseProjectId(project.supabase_project_id || "");
    setSupabaseAnonKey(project.supabase_anon_key || "");
    setSupabaseManagementToken(project.supabase_management_token || "");
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setProjectName("");
    setGithubRepo("");
    setGithubBranch("main");
    setGithubAccessToken("");
    setDeployedUrl("");
    setSupabaseProjectId("");
    setSupabaseAnonKey("");
    setSupabaseManagementToken("");
  };

  const handleNextStep = () => {
    if (step === 1 && !projectName.trim()) {
      alert("Bitte gib einen Projektnamen ein");
      return;
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const filteredProjects = projects.filter((project) => {
    const nameMatch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const repoMatch = project.github_repo
      ? project.github_repo.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    return nameMatch || repoMatch;
  });

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Projekte</h1>
            <p className={styles.subtitle}>
              {projects.length} {projects.length === 1 ? "Projekt" : "Projekte"} • Analyzer-First
              Mode
            </p>
          </div>
          <Button
            onClick={() => {
              setIsDialogOpen(true);
              onNewProject?.();
            }}
            className={styles.primaryButton}
          >
            <Plus aria-hidden="true" />
            Neues Projekt
          </Button>
        </div>

        <div className={styles.search}>
          <Search className={styles.searchIcon} aria-hidden="true" />
          <Input
            placeholder="Projekte durchsuchen..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.grid}>
          {projectsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={`skeleton-${i}`} className={styles.skeletonCard} />
            ))
          ) : (
            filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
              onEdit={() => handleEditClick(project)}
              onDelete={() => handleDeleteProject(project.id)}
            />
          ))
          )}
        </div>

        {!projectsLoading && filteredProjects.length === 0 && (
          <div className={styles.emptyState}>
            <FolderGit2 className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>
              {searchQuery ? "Keine Projekte gefunden" : "Noch keine Projekte"}
            </p>
            <p className={styles.emptyHint}>
              {searchQuery
                ? "Versuche eine andere Suchanfrage"
                : "Erstelle dein erstes Projekt um loszulegen"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => {
                  setIsDialogOpen(true);
                  onNewProject?.();
                }}
                className={styles.primaryButton}
              >
                <Plus aria-hidden="true" />
                Projekt erstellen
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>Neues Projekt erstellen</DialogTitle>
            <DialogDescription>Schritt {step} von 3</DialogDescription>
          </DialogHeader>

          <div className={styles.stackLg}>
            {step === 1 && (
              <div className={styles.stackMd}>
                <div className={styles.stackSm}>
                  <Label htmlFor="projectName">Projektname *</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    placeholder="z.B. Meine App"
                  />
                </div>

                <div className={styles.stackSm}>
                  <Label>GitHub Repository *</Label>
                  <GitHubRepoSelector
                    projectId={null}
                    onSelect={(repoFullName, branch) => {
                      setGithubRepo(repoFullName);
                      setGithubBranch(branch || "main");
                    }}
                    onOpenSettings={onOpenSettings}
                    initialRepo={githubRepo}
                    initialBranch={githubBranch}
                  />
                  <Input
                    className={styles.inputSpacing}
                    value={githubRepo}
                    onChange={(event) => setGithubRepo(event.target.value)}
                    placeholder="username/repository"
                  />
                </div>

                <div className={styles.stackSm}>
                  <Label htmlFor="githubBranch">Branch</Label>
                  <Input
                    id="githubBranch"
                    value={githubBranch}
                    onChange={(event) => setGithubBranch(event.target.value)}
                    placeholder="main"
                  />
                </div>

                <div className={styles.stackSm}>
                  <Label htmlFor="githubToken">GitHub Access Token (optional)</Label>
                  <Input
                    id="githubToken"
                    type="password"
                    value={githubAccessToken}
                    onChange={(event) => setGithubAccessToken(event.target.value)}
                    placeholder="ghp_..."
                  />
                  <p className={`${styles.fieldHint} ${styles.fieldHintSpacing}`}>
                    Nur für private Repositories nötig
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.stackMd}>
                <div className={styles.stackSm}>
                  <Label htmlFor="deployedUrl">Deployed URL (optional)</Label>
                  <Input
                    id="deployedUrl"
                    value={deployedUrl}
                    onChange={(event) => setDeployedUrl(event.target.value)}
                    placeholder="https://myapp.vercel.app"
                  />
                  <p className={`${styles.fieldHint} ${styles.fieldHintSpacing}`}>
                    Für automatische Screenshots der Live-App
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={styles.stackMd}>
                <div className={styles.stackSm}>
                  <Label>Supabase Projekt (optional)</Label>
                  <SupabaseProjectSelector
                    onSelect={(projectId, anonKey, managementToken) => {
                      setSupabaseProjectId(projectId);
                      setSupabaseAnonKey(anonKey);
                      setSupabaseManagementToken(managementToken);
                    }}
                    initialProjectId={supabaseProjectId}
                    initialAnonKey={supabaseAnonKey}
                  />
                </div>

                <div className={styles.stackSm}>
                  <Label htmlFor="supabaseToken">Supabase Management Token</Label>
                  <Input
                    id="supabaseToken"
                    type="password"
                    value={supabaseManagementToken}
                    onChange={(event) => setSupabaseManagementToken(event.target.value)}
                    placeholder="sbp_..."
                  />
                </div>

                <div className={styles.stackSm}>
                  <Label htmlFor="supabaseProjectId">Supabase Project ID</Label>
                  <Input
                    id="supabaseProjectId"
                    value={supabaseProjectId}
                    onChange={(event) => setSupabaseProjectId(event.target.value)}
                    placeholder="abc123..."
                  />
                </div>

                <div className={styles.stackSm}>
                  <Label htmlFor="supabaseAnonKey">Supabase Anon Key</Label>
                  <Input
                    id="supabaseAnonKey"
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(event) => setSupabaseAnonKey(event.target.value)}
                    placeholder="eyJ..."
                  />
                </div>
              </div>
            )}

            <div className={styles.actionsRow}>
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={handlePreviousStep}>
                    Zurück
                  </Button>
                )}
              </div>
              <div className={styles.actionsGroup}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                    setStep(1);
                  }}
                >
                  Abbrechen
                </Button>
                {step < 3 ? (
                  <Button onClick={handleNextStep}>Weiter</Button>
                ) : (
                  <Button onClick={handleCreateProject} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className={clsx(styles.inlineIcon, styles.spinner)} aria-hidden="true" />
                        Wird erstellt…
                      </>
                    ) : (
                      "Projekt erstellen"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className={styles.dialogContent}>
          <DialogHeader>
            <DialogTitle>Projekt bearbeiten</DialogTitle>
          </DialogHeader>

          <div className={styles.stackMd}>
            <div className={styles.stackSm}>
              <Label htmlFor="editProjectName">Projektname</Label>
              <Input
                id="editProjectName"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </div>

            <div className={styles.stackSm}>
              <Label htmlFor="editGithubRepo">GitHub Repository</Label>
              <Input
                id="editGithubRepo"
                value={githubRepo}
                onChange={(event) => setGithubRepo(event.target.value)}
              />
            </div>

            <div className={styles.stackSm}>
              <Label htmlFor="editGithubBranch">Branch</Label>
              <Input
                id="editGithubBranch"
                value={githubBranch}
                onChange={(event) => setGithubBranch(event.target.value)}
              />
            </div>

            <div className={styles.stackSm}>
              <Label htmlFor="editDeployedUrl">Deployed URL</Label>
              <Input
                id="editDeployedUrl"
                value={deployedUrl}
                onChange={(event) => setDeployedUrl(event.target.value)}
              />
            </div>

            <div className={styles.actionsRow}>
              <div />
              <div className={styles.actionsGroup}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingProject(null);
                    resetForm();
                  }}
                >
                  Abbrechen
                </Button>
                <Button onClick={handleUpdateProject} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className={clsx(styles.inlineIcon, styles.spinner)} aria-hidden="true" />
                      Wird gespeichert…
                    </>
                  ) : (
                    "Speichern"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
