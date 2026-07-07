/**
 * Delete confirmation flow for ProjectsPage (guest/local vs password).
 * Location: src/modules/projects/hooks/useProjectDeleteConfirm.ts
 */

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { isLocalHostUI } from "../../../lib/visudev/guest-mode";

interface UseProjectDeleteConfirmOptions {
  isGuest: boolean;
  userEmail: string | undefined;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: { message?: string } | null }>;
  deleteProject: (id: string) => Promise<void>;
}

export function useProjectDeleteConfirm({
  isGuest,
  userEmail,
  signInWithPassword,
  deleteProject,
}: UseProjectDeleteConfirmOptions) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteConfirmProjectId, setDeleteConfirmProjectId] = useState<string | null>(null);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const skipDeletePassword = isGuest || isLocalHostUI();

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteConfirmProjectId(id);
    setDeleteConfirmPassword("");
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirmClose = useCallback(() => {
    setIsDeleteConfirmOpen(false);
    setDeleteConfirmProjectId(null);
    setDeleteConfirmPassword("");
  }, []);

  const handleDeleteConfirmSubmit = useCallback(async () => {
    if (!deleteConfirmProjectId) return;
    if (!skipDeletePassword && !deleteConfirmPassword.trim()) return;

    setIsDeleteLoading(true);
    try {
      if (!skipDeletePassword) {
        const email = userEmail;
        if (!email) {
          toast.error("Nicht angemeldet. Bitte zuerst anmelden.");
          return;
        }
        const { error } = await signInWithPassword(email, deleteConfirmPassword.trim());
        if (error) {
          toast.error("Falsches Passwort. Löschen abgebrochen.");
          return;
        }
      }
      await deleteProject(deleteConfirmProjectId);
      handleDeleteConfirmClose();
      toast.success("Projekt wurde gelöscht.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.warn("[useProjectDeleteConfirm] delete failed:", message);
      toast.error("Fehler beim Löschen des Projekts");
    } finally {
      setIsDeleteLoading(false);
    }
  }, [
    deleteConfirmPassword,
    deleteConfirmProjectId,
    deleteProject,
    handleDeleteConfirmClose,
    signInWithPassword,
    skipDeletePassword,
    userEmail,
  ]);

  return {
    isDeleteConfirmOpen,
    deleteConfirmProjectId,
    deleteConfirmPassword,
    setDeleteConfirmPassword,
    isDeleteLoading,
    skipDeletePassword,
    handleDeleteClick,
    handleDeleteConfirmClose,
    handleDeleteConfirmSubmit,
  };
}
