import { Plus, Search, FolderGit2, Github, Database, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { ProjectCard } from './ProjectCard';
import { GitHubRepoSelector } from './GitHubRepoSelector';
import { SupabaseProjectSelector } from './SupabaseProjectSelector';
import { useVisudev } from '../lib/visudev/store';

interface ProjectsOverviewProps {
  onProjectSelect?: (project: any) => void;
  onNewProject?: () => void;
}

export function ProjectsOverview({ onProjectSelect, onNewProject }: ProjectsOverviewProps) {
  const { projects, setActiveProject, addProject, updateProject, deleteProject, startScan } = useVisudev();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubAccessToken, setGithubAccessToken] = useState('');
  const [deployedUrl, setDeployedUrl] = useState('');
  const [supabaseProjectId, setSupabaseProjectId] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseManagementToken, setSupabaseManagementToken] = useState('');

  const handleCreateProject = async () => {
    setIsLoading(true);
    try {
      // Create project locally
      const newProject = {
        name: projectName,
        github_repo: githubRepo,
        github_branch: githubBranch,
        github_access_token: githubAccessToken,
        deployed_url: deployedUrl,
        supabase_project_id: supabaseProjectId,
        supabase_anon_key: supabaseAnonKey,
        description: `GitHub: ${githubRepo}${deployedUrl ? ` | Live: ${deployedUrl}` : ''}`,
      };

      addProject(newProject);
      
      console.log('✅ Project created locally:', newProject);
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setStep(1);
      resetForm();
      
    } catch (error) {
      console.error('❌ Error creating project:', error);
      alert('Fehler beim Erstellen des Projekts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject) return;
    
    setIsLoading(true);
    try {
      const updatedProject = {
        ...editingProject,
        name: projectName,
        github_repo: githubRepo,
        github_branch: githubBranch,
        github_access_token: githubAccessToken,
        deployed_url: deployedUrl,
        supabase_project_id: supabaseProjectId,
        supabase_anon_key: supabaseAnonKey,
        description: `GitHub: ${githubRepo}${deployedUrl ? ` | Live: ${deployedUrl}` : ''}`,
      };

      updateProject(updatedProject);
      
      console.log('✅ Project updated locally:', updatedProject);
      
      // Close dialog and reset
      setIsEditDialogOpen(false);
      setEditingProject(null);
      resetForm();
      
    } catch (error) {
      console.error('❌ Error updating project:', error);
      alert('Fehler beim Aktualisieren des Projekts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Projekt wirklich löschen?')) return;
    
    try {
      deleteProject(id);
      console.log('✅ Project deleted locally:', id);
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      alert('Fehler beim Löschen des Projekts');
    }
  };

  const handleProjectClick = (project: any) => {
    console.log('Project clicked:', project.id);
    console.log('[ProjectsOverview] Full project data:', project);
    setActiveProject(project);
    
    // Trigger parent handler if provided
    if (onProjectSelect) {
      onProjectSelect(project);
    }
  };

  const handleEditClick = (project: any) => {
    setEditingProject(project);
    setProjectName(project.name || '');
    setGithubRepo(project.github_repo || '');
    setGithubBranch(project.github_branch || 'main');
    setGithubAccessToken(project.github_access_token || '');
    setDeployedUrl(project.deployed_url || '');
    setSupabaseProjectId(project.supabase_project_id || '');
    setSupabaseAnonKey(project.supabase_anon_key || '');
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setProjectName('');
    setGithubRepo('');
    setGithubBranch('main');
    setGithubAccessToken('');
    setDeployedUrl('');
    setSupabaseProjectId('');
    setSupabaseAnonKey('');
    setSupabaseManagementToken('');
  };

  const handleNextStep = () => {
    if (step === 1 && !projectName.trim()) {
      alert('Bitte gib einen Projektnamen ein');
      return;
    }
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.github_repo?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900">Projekte</h1>
            <p className="text-sm text-gray-500 mt-1">
              {projects.length} {projects.length === 1 ? 'Projekt' : 'Projekte'} • Analyzer-First Mode
            </p>
          </div>
          <Button onClick={() => { setIsDialogOpen(true); onNewProject?.(); }}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Projekt
          </Button>
        </div>

        {/* Search */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Projekte durchsuchen..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
              onEdit={() => handleEditClick(project)}
              onDelete={() => handleDeleteProject(project.id)}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <FolderGit2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery ? 'Keine Projekte gefunden' : 'Noch keine Projekte'}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {searchQuery ? 'Versuche eine andere Suchanfrage' : 'Erstelle dein erstes Projekt um loszulegen'}
            </p>
            {!searchQuery && (
              <Button onClick={() => { setIsDialogOpen(true); onNewProject?.(); }}>
                <Plus className="w-4 h-4 mr-2" />
                Projekt erstellen
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Projekt erstellen</DialogTitle>
            <DialogDescription>
              Schritt {step} von 3
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="projectName">Projektname *</Label>
                  <Input
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="z.B. Meine App"
                  />
                </div>

                <div>
                  <Label>GitHub Repository *</Label>
                  <GitHubRepoSelector
                    onRepoSelect={(repo) => {
                      setGithubRepo(repo.full_name);
                      setGithubBranch(repo.default_branch || 'main');
                    }}
                    accessToken={githubAccessToken}
                  />
                  <Input
                    className="mt-2"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    placeholder="username/repository"
                  />
                </div>

                <div>
                  <Label htmlFor="githubBranch">Branch</Label>
                  <Input
                    id="githubBranch"
                    value={githubBranch}
                    onChange={(e) => setGithubBranch(e.target.value)}
                    placeholder="main"
                  />
                </div>

                <div>
                  <Label htmlFor="githubToken">GitHub Access Token (optional)</Label>
                  <Input
                    id="githubToken"
                    type="password"
                    value={githubAccessToken}
                    onChange={(e) => setGithubAccessToken(e.target.value)}
                    placeholder="ghp_..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nur für private Repositories nötig
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="deployedUrl">Deployed URL (optional)</Label>
                  <Input
                    id="deployedUrl"
                    value={deployedUrl}
                    onChange={(e) => setDeployedUrl(e.target.value)}
                    placeholder="https://myapp.vercel.app"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Für automatische Screenshots der Live-App
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Supabase Projekt (optional)</Label>
                  <SupabaseProjectSelector
                    onProjectSelect={(project) => {
                      setSupabaseProjectId(project.id);
                      setSupabaseAnonKey(project.anon_key || '');
                    }}
                    managementToken={supabaseManagementToken}
                  />
                </div>

                <div>
                  <Label htmlFor="supabaseToken">Supabase Management Token</Label>
                  <Input
                    id="supabaseToken"
                    type="password"
                    value={supabaseManagementToken}
                    onChange={(e) => setSupabaseManagementToken(e.target.value)}
                    placeholder="sbp_..."
                  />
                </div>

                <div>
                  <Label htmlFor="supabaseProjectId">Supabase Project ID</Label>
                  <Input
                    id="supabaseProjectId"
                    value={supabaseProjectId}
                    onChange={(e) => setSupabaseProjectId(e.target.value)}
                    placeholder="abc123..."
                  />
                </div>

                <div>
                  <Label htmlFor="supabaseAnonKey">Supabase Anon Key</Label>
                  <Input
                    id="supabaseAnonKey"
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJ..."
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <div>
                {step > 1 && (
                  <Button variant="outline" onClick={handlePreviousStep}>
                    Zurück
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setStep(1); }}>
                  Abbrechen
                </Button>
                {step < 3 ? (
                  <Button onClick={handleNextStep}>
                    Weiter
                  </Button>
                ) : (
                  <Button onClick={handleCreateProject} disabled={isLoading}>
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Projekt erstellen
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Projekt bearbeiten</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="editProjectName">Projektname</Label>
              <Input
                id="editProjectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="editGithubRepo">GitHub Repository</Label>
              <Input
                id="editGithubRepo"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="editGithubBranch">Branch</Label>
              <Input
                id="editGithubBranch"
                value={githubBranch}
                onChange={(e) => setGithubBranch(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="editDeployedUrl">Deployed URL</Label>
              <Input
                id="editDeployedUrl"
                value={deployedUrl}
                onChange={(e) => setDeployedUrl(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); setEditingProject(null); resetForm(); }}>
                Abbrechen
              </Button>
              <Button onClick={handleUpdateProject} disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Speichern
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
