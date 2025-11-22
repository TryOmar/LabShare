import { useCallback } from "react";
import type { CodeFile, Attachment } from "@/lib/submission/types";

interface UseFileOperationsProps {
  // File editing state
  editingCodeFileId: string | null;
  editCodeFilename: string;
  editCodeContent: string;
  editCodeLanguage: string;
  renamingCodeFileId: string | null;
  renamingAttachmentId: string | null;
  renameCodeFilename: string;
  renameAttachmentFilename: string;
  
  // Mutation handlers
  handleUpdateCodeFile: (id: string, data: { filename: string; content: string; language: string }) => Promise<void>;
  handleRenameCodeFile: (id: string, filename: string) => Promise<void>;
  handleRenameAttachment: (id: string, filename: string) => Promise<void>;
  handleDeleteCodeFile: (id: string) => Promise<void>;
  handleDeleteAttachment: (id: string) => Promise<void>;
  
  // File editing handlers
  cancelEditCodeFile: () => void;
  cancelRenameCodeFile: () => void;
  cancelRenameAttachment: () => void;
  
  // Comments refresh
  onCommentsRefresh: () => void;
}

interface UseFileOperationsResult {
  // Save handlers
  saveCodeFile: () => Promise<void>;
  saveCodeFileRename: () => Promise<void>;
  saveAttachmentRename: () => Promise<void>;
  
  // Delete handlers
  deleteCodeFile: (id: string) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
}

/**
 * Hook to combine file editing state with mutation handlers
 */
export function useFileOperations({
  editingCodeFileId,
  editCodeFilename,
  editCodeContent,
  editCodeLanguage,
  renamingCodeFileId,
  renamingAttachmentId,
  renameCodeFilename,
  renameAttachmentFilename,
  handleUpdateCodeFile,
  handleRenameCodeFile,
  handleRenameAttachment,
  handleDeleteCodeFile,
  handleDeleteAttachment,
  cancelEditCodeFile,
  cancelRenameCodeFile,
  cancelRenameAttachment,
  onCommentsRefresh,
}: UseFileOperationsProps): UseFileOperationsResult {
  const saveCodeFile = useCallback(async () => {
    if (!editingCodeFileId) return;
    try {
      await handleUpdateCodeFile(editingCodeFileId, {
        filename: editCodeFilename,
        content: editCodeContent,
        language: editCodeLanguage,
      });
      cancelEditCodeFile();
      onCommentsRefresh();
    } catch (err) {
      // Error already handled in mutations hook
      throw err;
    }
  }, [
    editingCodeFileId,
    editCodeFilename,
    editCodeContent,
    editCodeLanguage,
    handleUpdateCodeFile,
    cancelEditCodeFile,
    onCommentsRefresh,
  ]);

  const saveCodeFileRename = useCallback(async () => {
    if (!renamingCodeFileId) return;
    try {
      await handleRenameCodeFile(renamingCodeFileId, renameCodeFilename);
      cancelRenameCodeFile();
      onCommentsRefresh();
    } catch (err) {
      // Error already handled in mutations hook
      throw err;
    }
  }, [
    renamingCodeFileId,
    renameCodeFilename,
    handleRenameCodeFile,
    cancelRenameCodeFile,
    onCommentsRefresh,
  ]);

  const saveAttachmentRename = useCallback(async () => {
    if (!renamingAttachmentId) return;
    try {
      await handleRenameAttachment(renamingAttachmentId, renameAttachmentFilename);
      cancelRenameAttachment();
      onCommentsRefresh();
    } catch (err) {
      // Error already handled in mutations hook
      throw err;
    }
  }, [
    renamingAttachmentId,
    renameAttachmentFilename,
    handleRenameAttachment,
    cancelRenameAttachment,
    onCommentsRefresh,
  ]);

  const deleteCodeFile = useCallback(
    async (id: string) => {
      try {
        await handleDeleteCodeFile(id);
        onCommentsRefresh();
      } catch (err) {
        // Error already handled in mutations hook
        throw err;
      }
    },
    [handleDeleteCodeFile, onCommentsRefresh]
  );

  const deleteAttachment = useCallback(
    async (id: string) => {
      try {
        await handleDeleteAttachment(id);
        onCommentsRefresh();
      } catch (err) {
        // Error already handled in mutations hook
        throw err;
      }
    },
    [handleDeleteAttachment, onCommentsRefresh]
  );

  return {
    saveCodeFile,
    saveCodeFileRename,
    saveAttachmentRename,
    deleteCodeFile,
    deleteAttachment,
  };
}

