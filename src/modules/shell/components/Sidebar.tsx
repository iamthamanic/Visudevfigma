import { Fragment, type SVGProps } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import { useVisudev } from "../../../lib/visudev/store";
import svgPaths from "../../../imports/svg-mni0z0xtlg";
import logoImage from "figma:asset/3305ba5fc95fb7f7afe99537b027f7238dc7c767.png";
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
  icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  requiresProject?: boolean;
  scanType?: ScanType;
};

const navItems: NavItem[] = [
  { key: "projects", label: "Projekte", icon: ProjectsIcon },
  {
    key: "appflow",
    label: "App/Flow",
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
        <div className={styles.logoWrapper}>
          <img src={logoImage} alt="VisuDEV Logo" className={styles.logoImage} />
        </div>
        <div className={styles.brand}>
          <span className={styles.brandTitle}>VisuDEV</span>
          <span className={styles.brandSubtitle}>Visualize Code</span>
        </div>
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

      <div className={styles.footer}>
        <button type="button" onClick={onNewProject} className={styles.newProjectButton}>
          <PlusIcon className={styles.navIcon} aria-hidden="true" />
          <span className={styles.newProjectLabel}>Neues Projekt</span>
        </button>
      </div>
    </aside>
  );
}

function ProjectsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d={svgPaths.p1f5dba00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d={svgPaths.p17f7d000}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d={svgPaths.p42d6b00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
    </svg>
  );
}

function AppFlowIcon(props: SVGProps<SVGSVGElement>) {
  return <ProjectsIcon {...props} />;
}

function BlueprintIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M5 2.5V12.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d={svgPaths.p3a3cf580}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d={svgPaths.p34c9bb80}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d={svgPaths.p13cf9c00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
    </svg>
  );
}

function DataIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d={svgPaths.p2e7662c0}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d={svgPaths.pbd81000}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d={svgPaths.p2a44e700}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
    </svg>
  );
}

function LogsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <g clipPath="url(#logsIconClip)">
        <path
          d={svgPaths.p363df2c0}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.66667"
        />
      </g>
      <defs>
        <clipPath id="logsIconClip">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d={svgPaths.p2483b8c0}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d={svgPaths.p3b27f100}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="none" {...props}>
      <path
        d="M4.16667 10H15.8333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
      <path
        d="M10 4.16667V15.8333"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.66667"
      />
    </svg>
  );
}
