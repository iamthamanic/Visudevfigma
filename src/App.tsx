import { useState } from 'react';
import { ProjectsOverview } from './components/ProjectsOverview';
import { AppFlowScreenNew } from './components/AppFlowScreenNew';
import { BlueprintNew } from './components/BlueprintNew';
import { DataScreenNew } from './components/DataScreenNew';
import { LogsPanelNew } from './components/LogsPanelNew';
import { SettingsPanel } from './components/SettingsPanel';
import { Sidebar } from './components/Sidebar';
import { VisudevProvider, useVisudev } from './lib/visudev/store';

type Screen = 'projects' | 'appflow' | 'blueprint' | 'data' | 'logs' | 'settings';

function AppContent() {
  const [activeScreen, setActiveScreen] = useState<Screen>('projects');
  const { activeProject } = useVisudev();

  const handleProjectSelect = () => {
    // Navigate to appflow when a project is selected
    setActiveScreen('appflow');
  };

  const handleNewProject = () => {
    // Navigate to projects screen when "Neues Projekt" is clicked
    setActiveScreen('projects');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={(screen) => setActiveScreen(screen as Screen)}
        onNewProject={handleNewProject}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeScreen === 'projects' && (
          <ProjectsOverview 
            onProjectSelect={handleProjectSelect}
            onNewProject={handleNewProject}
          />
        )}
        
        {activeScreen === 'appflow' && activeProject && (
          <AppFlowScreenNew
            projectId={activeProject.id}
            githubRepo={activeProject.github_repo}
            githubBranch={activeProject.github_branch}
            githubToken={activeProject.github_access_token}
            deployedUrl={activeProject.deployed_url}
          />
        )}
        
        {activeScreen === 'blueprint' && activeProject && (
          <BlueprintNew projectId={activeProject.id} />
        )}
        
        {activeScreen === 'data' && activeProject && (
          <DataScreenNew projectId={activeProject.id} />
        )}
        
        {activeScreen === 'logs' && activeProject && (
          <LogsPanelNew projectId={activeProject.id} />
        )}
        
        {activeScreen === 'settings' && (
          <SettingsPanel project={activeProject || { id: '', name: '' }} />
        )}

        {/* Show message when no project selected */}
        {!activeProject && activeScreen !== 'projects' && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Kein Projekt ausgewählt</p>
              <button
                onClick={() => setActiveScreen('projects')}
                className="text-sm text-primary hover:underline"
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

export default function App() {
  return (
    <VisudevProvider>
      <AppContent />
    </VisudevProvider>
  );
}