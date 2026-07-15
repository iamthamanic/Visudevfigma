/**
 * Global Blueprint shell header — project/branch pills, scan status, actions.
 * Location: src/modules/blueprint/components/
 */

import { Bell, Download, Loader2, RefreshCw, User } from "lucide-react";
import type { ScanStatus } from "../../../lib/visudev/types.js";
import { StatusBadge } from "./ui/StatusBadge.js";
import styles from "../styles/BlueprintShellHeader.module.css";

export type BlueprintScanChipStatus = ScanStatus;

interface BlueprintShellHeaderProps {
  projectName?: string;
  branchLabel?: string;
  scanStatus: BlueprintScanChipStatus;
  lastScannedLabel?: string | null;
  isRescanning?: boolean;
  notificationCount?: number;
  onRescan: () => void;
  onExportJson: () => void;
  rescanDisabled?: boolean;
}

function scanStatusVariant(
  status: BlueprintScanChipStatus,
  isRescanning: boolean,
): "running" | "confirmed" | "missing" | "critical" | "unknown" {
  if (isRescanning || status === "running") return "running";
  if (status === "completed") return "confirmed";
  if (status === "failed") return "critical";
  if (status === "idle") return "missing";
  return "unknown";
}

function scanStatusLabel(status: BlueprintScanChipStatus, isRescanning: boolean): string {
  if (isRescanning || status === "running") return "Analysiere…";
  if (status === "completed") return "Scan abgeschlossen";
  if (status === "failed") return "Scan fehlgeschlagen";
  if (status === "idle") return "Noch nicht gescannt";
  return "Unbekannt";
}

function truncateLabel(value: string | undefined, maxLength: number): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function normalizeNotificationCount(count: number | undefined): number {
  if (count == null || !Number.isFinite(count)) return 0;
  const rounded = Math.floor(count);
  if (rounded <= 0) return 0;
  return Math.min(rounded, 99);
}

export function BlueprintShellHeader({
  projectName,
  branchLabel,
  scanStatus,
  lastScannedLabel = null,
  isRescanning = false,
  notificationCount = 0,
  onRescan,
  onExportJson,
  rescanDisabled = false,
}: BlueprintShellHeaderProps): JSX.Element {
  const statusVariant = scanStatusVariant(scanStatus, isRescanning);
  const statusLabel = scanStatusLabel(scanStatus, isRescanning);
  const showSpinner = isRescanning || scanStatus === "running";
  const safeProjectName = truncateLabel(projectName, 48) ?? "Kein Projekt";
  const safeBranchLabel = truncateLabel(branchLabel, 32) ?? "main";
  const safeNotificationCount = normalizeNotificationCount(notificationCount);
  const notificationAria =
    safeNotificationCount > 0
      ? `Benachrichtigungen (${safeNotificationCount})`
      : "Benachrichtigungen";

  return (
    <header className={styles.root}>
      <div className={styles.leading}>
        <div className={styles.pillGroup}>
          <span className={styles.projectPill} title={projectName?.trim() || "Kein Projekt"}>
            {safeProjectName}
          </span>
          <span className={styles.branchPill} title={branchLabel?.trim() || "main"}>
            {safeBranchLabel}
          </span>
          <span className={styles.blueprintBadge}>Blueprint</span>
        </div>
        <div className={styles.scanStatusGroup}>
          <StatusBadge variant={statusVariant} label={statusLabel} testId="blueprint-scan-badge" />
          {lastScannedLabel && scanStatus === "completed" && !isRescanning ? (
            <span className={styles.lastScannedHint}>Zuletzt gescannt: {lastScannedLabel}</span>
          ) : null}
        </div>
      </div>

      <div className={styles.trailing}>
        <button type="button" className={styles.iconButton} aria-label={notificationAria}>
          <Bell className={styles.icon} aria-hidden="true" />
          {safeNotificationCount > 0 ? (
            <span className={styles.notificationBadge}>{safeNotificationCount}</span>
          ) : null}
        </button>

        <span className={styles.avatar} aria-label="Benutzerprofil" role="img">
          <User className={styles.icon} aria-hidden="true" />
        </span>

        <button
          type="button"
          onClick={onExportJson}
          className={styles.secondaryButton}
          aria-label="Blueprint als JSON exportieren"
        >
          <Download className={styles.icon} aria-hidden="true" />
          Export JSON
        </button>

        <button
          type="button"
          onClick={onRescan}
          disabled={rescanDisabled}
          className={styles.primaryButton}
          aria-label="Blueprint neu analysieren"
        >
          {showSpinner ? (
            <Loader2 className={`${styles.icon} ${styles.spinner}`} aria-hidden="true" />
          ) : (
            <RefreshCw className={styles.icon} aria-hidden="true" />
          )}
          Neu analysieren
        </button>
      </div>
    </header>
  );
}
