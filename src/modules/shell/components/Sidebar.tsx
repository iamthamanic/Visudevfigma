import { Fragment, useState, type ComponentType, type SVGProps } from "react";
import clsx from "clsx";
import { File, Loader2 } from "lucide-react";
import { useVisudev } from "../../../lib/visudev/store";
import { useAuth } from "../../../contexts/useAuth";
import { AuthDialog } from "../../../components/AuthDialog";
import { RunnerStatusControl } from "./RunnerStatusControl";
import {
  AppFlowIcon,
  BlueprintIcon,
  DataIcon,
  LogsIcon,
  PlusIcon,
  SettingsIcon,
} from "./SidebarIcons";
import logoImage from "../../../assets/visudev-logo.png";
import type { ShellScreen } from "../types";
import styles from "../styles/Sidebar.module.css";

interface SidebarProps {
  activeScreen: ShellScreen;
  onNavigate: (screen: ShellScreen) => void;
  onNewProject: () => void;
}

type ScanType = "appflow" | "blueprint" | "data";

type NavItem = {
  key: ShellScreen;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  requiresProject?: boolean;
  scanType?: ScanType;
};

const navItems: NavItem[] = [
  { key: "projects", label: "Projekte", icon: File },
  {
    key: "appflow",
    label: "App Flow",
    icon: AppFlowIcon,
    requiresProject: true,
    scanType: "appflow",
  },
  {
    key: "blueprint",
    label: "Blueprint",
    icon: BlueprintIcon,
    requiresProject: true,
    scanType: "blueprint",
  },
  {
    key: "data",
    label: "Data",
    icon: DataIcon,
    requiresProject: true,
    scanType: "data",
  },
  {
    key: "logs",
    label: "Logs",
    icon: LogsIcon,
    requiresProject: true,
  },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({ activeScreen, onNavigate, onNewProject }: SidebarProps) {
  const { activeProject, scanStatuses } = useVisudev();
  const { user, loading: authLoading, signOut } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const renderScanIndicator = (scanType: ScanType) => {
    const status = scanStatuses[scanType];
    if (status.status === "running") {
      return (
        <span className={styles.scanIndicator}>
          <Loader2 className={styles.scanIcon} />
          <span>{status.progress}%</span>
        </span>
      );
    }
    return null;
  };

  return (
    <aside className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerBrandRow}>
          <div className={styles.logoWrapper}>
            <img src={logoImage} alt="VisuDEV Logo" className={styles.logoImage} />
          </div>
          <div className={styles.brand}>
            <span className={styles.brandTitle}>VisuDEV</span>
            <span className={styles.brandSubtitle}>Visualize Code</span>
          </div>
        </div>
        <RunnerStatusControl />
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive = activeScreen === item.key;
          const isDisabled = Boolean(item.requiresProject && !activeProject);
          const Icon = item.icon;

          return (
            <Fragment key={item.key}>
              <button
                type="button"
                onClick={() => (!isDisabled ? onNavigate(item.key) : undefined)}
                disabled={isDisabled}
                className={clsx(
                  styles.navButton,
                  isActive && styles.navButtonActive,
                  isDisabled && styles.navButtonDisabled,
                )}
                aria-label={`Zu ${item.label} wechseln`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={styles.navIcon} aria-hidden="true" />
                <span className={styles.navLabel}>{item.label}</span>
                {item.scanType ? renderScanIndicator(item.scanType) : null}
              </button>

              {item.key === "projects" && activeProject ? (
                <div className={styles.activeProject}>
                  <span className={styles.activeProjectName}>{activeProject.name}</span>
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </nav>

      {!authLoading && (
        <div className={styles.authBlock}>
          {user ? (
            <div className={styles.authUser}>
              <span className={styles.authEmail} title={user.email ?? undefined}>
                {user.email ?? user.id.slice(0, 8)}
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                className={styles.authSignOut}
                aria-label="Abmelden"
              >
                Abmelden
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAuthDialogOpen(true)}
              className={styles.authSignIn}
              aria-label="Anmelden"
            >
              Anmelden
            </button>
          )}
        </div>
      )}

      <div className={styles.footer}>
        <button
          type="button"
          onClick={onNewProject}
          className={styles.newProjectButton}
          aria-label="Neues Projekt erstellen"
        >
          <PlusIcon className={styles.navIcon} aria-hidden="true" />
          <span className={styles.newProjectLabel}>Neues Projekt</span>
        </button>
      </div>

      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </aside>
  );
}
