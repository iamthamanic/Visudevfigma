import { FolderGit2, Github, Database, Calendar, MoreVertical, Globe } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useProject } from '../contexts/ProjectContext';

interface Project {
  id: string;
  name: string;
  github_repo?: string;
  github_branch?: string;
  supabase_project_id?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectCardProps {
  project: any;
  onDelete?: (id: string) => void;
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void; // NEW: Edit callback
}

export function ProjectCard({ project, onDelete, onClick, onEdit }: ProjectCardProps) {
  const { activeProject, setActiveProject } = useProject();
  const isActive = activeProject?.id === project.id;

  const formattedDate = new Date(project.createdAt).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`bg-white border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer group ${
        isActive 
          ? 'border-[#03ffa3] bg-[rgba(3,255,163,0.05)] shadow-md' 
          : 'border-gray-200'
      }`}
      onClick={() => onClick?.(project.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-[rgb(3,255,163)]/10 rounded-lg flex items-center justify-center">
          <FolderGit2 className="w-6 h-6 text-[rgb(3,255,163)]" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onClick?.(project.id);
            }}>
              Öffnen
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => {
              e.stopPropagation();
              onEdit?.(project.id);
            }}>
              Bearbeiten
            </DropdownMenuItem>
            {isActive && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                setActiveProject(null);
              }}>
                Abwählen
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Möchten Sie dieses Projekt wirklich löschen?')) {
                  onDelete?.(project.id);
                }
              }}
            >
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-lg mb-2">{project.name}</h3>

      <div className="space-y-2 mb-4">
        {project.github_repo && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Github className="w-4 h-4" />
            <span className="truncate">{project.github_repo}</span>
            {project.github_branch && (
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {project.github_branch}
              </span>
            )}
          </div>
        )}
        {project.supabase_project_id && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Database className="w-4 h-4" />
            <span className="truncate">{project.supabase_project_id}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Globe className="w-4 h-4 text-gray-600" />
          {project.deployed_url ? (
            <span className="truncate text-gray-600">{project.deployed_url}</span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(project.id);
              }}
              className="text-gray-400 hover:text-[rgb(3,255,163)] transition-colors italic"
            >
              Deployed URL hinzufügen...
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500 pt-4 border-t border-gray-100">
        <Calendar className="w-3 h-3" />
        <span>Erstellt am {formattedDate}</span>
      </div>
    </div>
  );
}