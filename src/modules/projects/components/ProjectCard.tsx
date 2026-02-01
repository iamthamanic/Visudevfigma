import type { MouseEvent } from "react";
import clsx from "clsx";
import { Calendar, Database, FolderGit2, Github, Globe, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Button } from "../../../components/ui/button";
import { useVisudev } from "../../../lib/visudev/store";
import type { Project } from "../../../lib/visudev/types";
import styles from "../styles/ProjectCard.module.css";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
  onClick?: (project: Project) => void;
  onEdit?: (project: Project) => void;
}

export function ProjectCard({ project, onDelete, onClick, onEdit }: ProjectCardProps) {
  const { activeProject, setActiveProject } = useVisudev();
  const isActive = activeProject?.id === project.id;

  const formattedDate = new Date(project.createdAt).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const handleOpen = (event: MouseEvent) => {
    event.stopPropagation();
    onClick?.(project);
  };

  const handleEdit = (event: MouseEvent) => {
    event.stopPropagation();
    onEdit?.(project);
  };

  const handleUnselect = (event: MouseEvent) => {
    event.stopPropagation();
    setActiveProject(null);
  };

  const handleDelete = (event: MouseEvent) => {
    event.stopPropagation();
    onDelete?.(project.id);
  };

  return (
    <div
      className={clsx(styles.card, isActive && styles.cardActive)}
      onClick={() => onClick?.(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.(project);
        }
      }}
    >
      <div className={styles.header}>
        <div className={styles.iconBadge}>
          <FolderGit2 className={styles.icon} aria-hidden="true" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(event: MouseEvent) => event.stopPropagation()}>
            <Button variant="ghost" size="sm" className={styles.dropdownButton}>
              <MoreVertical aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleOpen}>Öffnen</DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>Bearbeiten</DropdownMenuItem>
            {isActive && <DropdownMenuItem onClick={handleUnselect}>Abwählen</DropdownMenuItem>}
            <DropdownMenuItem className={styles.dropdownDanger} onClick={handleDelete}>
              Löschen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className={styles.title}>{project.name}</h3>

      <div className={styles.metaList}>
        {project.github_repo && (
          <div className={styles.metaRow}>
            <Github className={styles.icon} aria-hidden="true" />
            <span className={styles.metaRowText}>{project.github_repo}</span>
            {project.github_branch && (
              <span className={styles.branchBadge}>{project.github_branch}</span>
            )}
          </div>
        )}
        {project.supabase_project_id && (
          <div className={styles.metaRow}>
            <Database className={styles.icon} aria-hidden="true" />
            <span className={styles.metaRowText}>{project.supabase_project_id}</span>
          </div>
        )}
        <div className={styles.metaRow}>
          <Globe className={styles.icon} aria-hidden="true" />
          {project.deployed_url ? (
            <span className={styles.metaRowText}>{project.deployed_url}</span>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit?.(project);
              }}
              className={styles.deployedLink}
            >
              Deployed URL hinzufügen...
            </button>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <Calendar className={styles.icon} aria-hidden="true" />
        <span>Erstellt am {formattedDate}</span>
      </div>
    </div>
  );
}
