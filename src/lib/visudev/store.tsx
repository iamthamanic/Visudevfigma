import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { Project, ScanResult, ScanStatuses, AnalysisResult } from './types';
import { projectId as supabaseProjectId, publicAnonKey } from '../../utils/supabase/info';

interface VisudevStore {
  // Projects
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'screens' | 'flows'>) => void;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => void;
  
  // Scans
  scans: ScanResult[];
  scanStatuses: ScanStatuses;
  startScan: (scanType: 'appflow' | 'blueprint' | 'data' | 'all') => Promise<void>;
  refreshScanStatus: () => Promise<void>;
}

const VisudevContext = createContext<VisudevStore | null>(null);

export function VisudevProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [scanStatuses, setScanStatuses] = useState<ScanStatuses>({
    appflow: { status: 'idle', progress: 0 },
    blueprint: { status: 'idle', progress: 0 },
    data: { status: 'idle', progress: 0 },
  });

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  
  // Auto-create Scriptony project on mount
  useEffect(() => {
    if (!hasInitializedRef.current && projects.length === 0) {
      hasInitializedRef.current = true;
      console.log('🚀 [VisuDEV] Initializing Scriptony project...');
      
      const scriptonyProject = {
        name: 'Scriptony',
        description: 'Film Screenwriting Software',
        github_repo: 'iamthamanic/Scriptonyapp',
        github_branch: 'main',
        deployed_url: 'https://scriptony.figma.site',
      };
      
      addProject(scriptonyProject);
    }
  }, []);
  
  // Auto-activate first project and trigger scan
  useEffect(() => {
    if (projects.length > 0 && !activeProject) {
      console.log('🎯 [VisuDEV] Auto-activating first project...');
      setActiveProject(projects[0]);
    }
  }, [projects, activeProject]);

  const setActiveProject = useCallback((project: Project | null) => {
    setActiveProjectState(project);
  }, []);

  const addProject = useCallback((projectData: Omit<Project, 'id' | 'createdAt' | 'screens' | 'flows'>) => {
    const newProject: Project = {
      ...projectData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      // ✅ Start with EMPTY arrays - let the analyzer populate them
      screens: [],
      flows: [],
    };
    setProjects((prev) => [...prev, newProject]);
  }, []);

  const updateProject = useCallback((project: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? project : p))
    );
    // Update active project if it's the same
    setActiveProjectState((current) => 
      current?.id === project.id ? project : current
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    // Clear active project if it was deleted
    setActiveProjectState((current) => 
      current?.id === id ? null : current
    );
    // Clean up related scans
    setScans((prev) => prev.filter((s) => s.projectId !== id));
  }, []);

  const refreshScanStatus = useCallback(async () => {
    // In local-only mode, scan status is already in state
    // This function is a no-op for compatibility
  }, []);

  const startScan = useCallback(
    async (scanType: 'appflow' | 'blueprint' | 'data' | 'all') => {
      if (!activeProject) {
        console.warn('⚠️ [VisuDEV] No active project to scan');
        return;
      }

      const scanTypes = scanType === 'all' ? ['appflow', 'blueprint', 'data'] as const : [scanType];

      for (const type of scanTypes) {
        const scanId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        console.log(`🔄 [VisuDEV] Starting ${type} scan for project ${activeProject.id}`);

        // Set status to running
        setScanStatuses((prev) => ({
          ...prev,
          [type]: { status: 'running', progress: 10 },
        }));

        // Create scan record
        const newScan: ScanResult = {
          id: scanId,
          projectId: activeProject.id,
          scanType: type,
          status: 'running',
          progress: 10,
          startedAt: timestamp,
        };

        setScans((prev) => [...prev, newScan]);

        try {
          // ONLY call visudev-analyzer Edge Function for code analysis
          console.log(`🔗 [VisuDEV] Calling visudev-analyzer for ${type}`);
          
          const analyzeResponse = await fetch(
            `https://${supabaseProjectId}.supabase.co/functions/v1/visudev-analyzer/analyze`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                repo: activeProject.github_repo || 'iamthamanic/Scriptonyapp',
                branch: activeProject.github_branch || 'main',
              }),
            }
          );

          setScanStatuses((prev) => ({
            ...prev,
            [type]: { status: 'running', progress: 50 },
          }));

          if (!analyzeResponse.ok) {
            const errorText = await analyzeResponse.text();
            console.error(`❌ [VisuDEV] Analyzer error response:`, errorText);
            throw new Error(`Analyzer returned ${analyzeResponse.status}: ${errorText}`);
          }

          const analysisData = await analyzeResponse.json();
          console.log(`✅ [VisuDEV] ${type} analysis complete!`, analysisData);
          
          // Step: Capture screenshots for all detected screens
          let screensWithScreenshots = analysisData.data?.screens || [];
          
          // ✅ TRY to capture screenshots, but fallback to placeholders on error
          if (activeProject.deployed_url && screensWithScreenshots.length > 0) {
            console.log(`📸 [VisuDEV] Capturing screenshots for ${screensWithScreenshots.length} screens...`);
            
            try {
              const screenshotResponse = await fetch(
                `https://${supabaseProjectId}.supabase.co/functions/v1/visudev-analyzer/screenshots`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    projectId: activeProject.id,
                    baseUrl: activeProject.deployed_url,
                    screens: screensWithScreenshots,
                  }),
                }
              );

              if (screenshotResponse.ok) {
                const screenshotData = await screenshotResponse.json();
                console.log(`✅ [VisuDEV] Screenshot capture complete: ${screenshotData.data?.captured}/${screensWithScreenshots.length}`);
                
                // Map screenshot URLs to screens
                screensWithScreenshots = screensWithScreenshots.map((screen: any) => {
                  const result = screenshotData.data?.results?.find((r: any) => r.screenId === screen.id);
                  return {
                    ...screen,
                    screenshotUrl: result?.url || `https://placehold.co/1200x800/1a1a1a/03ffa3?text=${encodeURIComponent(screen.name)}`,
                    screenshotStatus: result?.status || 'placeholder',
                  };
                });
              } else {
                const errorText = await screenshotResponse.text();
                console.warn(`⚠️ [VisuDEV] Screenshot API failed (${screenshotResponse.status}): ${errorText}`);
                console.log(`💡 [VisuDEV] Falling back to placeholder images`);
                
                // Fallback to placeholders
                screensWithScreenshots = screensWithScreenshots.map((screen: any) => ({
                  ...screen,
                  screenshotUrl: `https://placehold.co/1200x800/1a1a1a/03ffa3?text=${encodeURIComponent(screen.name)}`,
                  screenshotStatus: 'placeholder',
                }));
              }
            } catch (screenshotError: any) {
              console.error(`❌ [VisuDEV] Screenshot capture failed:`, screenshotError.message);
              console.log(`💡 [VisuDEV] Falling back to placeholder images`);
              
              // Fallback to placeholders
              screensWithScreenshots = screensWithScreenshots.map((screen: any) => ({
                ...screen,
                screenshotUrl: `https://placehold.co/1200x800/1a1a1a/03ffa3?text=${encodeURIComponent(screen.name)}`,
                screenshotStatus: 'placeholder',
              }));
            }
          } else {
            // No deployed URL - use placeholders
            console.log(`💡 [VisuDEV] No deployed URL, using placeholder images`);
            screensWithScreenshots = screensWithScreenshots.map((screen: any) => ({
              ...screen,
              screenshotUrl: `https://placehold.co/1200x800/1a1a1a/03ffa3?text=${encodeURIComponent(screen.name)}`,
              screenshotStatus: 'placeholder',
            }));
          }

          // Transform analyzer result into AnalysisResult
          const result: AnalysisResult = {
            screens: screensWithScreenshots,
            flows: analysisData.data?.flows || activeProject.flows,
            stats: {
              totalScreens: screensWithScreenshots.length,
              totalFlows: (analysisData.data?.flows || activeProject.flows).length,
              maxDepth: Math.max(...screensWithScreenshots.map((s: any) => s.depth || 0), 0),
            },
          };

          // Update project with new screens/flows
          const updatedProject: Project = {
            ...activeProject,
            screens: result.screens,
            flows: result.flows,
          };

          updateProject(updatedProject);

          // Update scan record
          setScans((prev) =>
            prev.map((scan) =>
              scan.id === scanId
                ? {
                    ...scan,
                    status: 'completed',
                    progress: 100,
                    result,
                    completedAt: new Date().toISOString(),
                  }
                : scan
            )
          );

          setScanStatuses((prev) => ({
            ...prev,
            [type]: { status: 'completed', progress: 100 },
          }));

        } catch (error: any) {
          console.error(`❌ [VisuDEV] ${type} scan failed:`, error.message);

          // Update scan record with error
          setScans((prev) =>
            prev.map((scan) =>
              scan.id === scanId
                ? {
                    ...scan,
                    status: 'failed',
                    progress: 0,
                    errorMessage: error.message || 'Unknown error',
                    completedAt: new Date().toISOString(),
                  }
                : scan
            )
          );

          setScanStatuses((prev) => ({
            ...prev,
            [type]: { 
              status: 'failed', 
              progress: 0, 
              error: error.message || 'Analysis failed' 
            },
          }));

          // Use existing sample data as fallback
          console.log(`💡 [VisuDEV] Using existing data for ${type}`);
        }
      }
    },
    [activeProject, updateProject]
  );

  const value: VisudevStore = {
    projects,
    activeProject,
    setActiveProject,
    addProject,
    updateProject,
    deleteProject,
    scans,
    scanStatuses,
    startScan,
    refreshScanStatus,
  };

  return (
    <VisudevContext.Provider value={value}>
      {children}
    </VisudevContext.Provider>
  );
}

export function useVisudev() {
  const ctx = useContext(VisudevContext);
  if (!ctx) {
    throw new Error('useVisudev must be used within VisudevProvider');
  }
  return ctx;
}

// Backwards compatibility alias for existing code
export const useProject = useVisudev;