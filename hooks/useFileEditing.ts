import { useState } from "react";
import type { CodeFile, Attachment } from "@/lib/submission/types";

interface UseFileEditingResult {
  // Edit states
  editingCodeFileId: string | null;
  editCodeFilename: string;
  editCodeContent: string;
  editCodeLanguage: string;
  
  // Rename states
  renamingCodeFileId: string | null;
  renamingAttachmentId: string | null;
  renameCodeFilename: string;
  renameAttachmentFilename: string;
  
  // Edit handlers
  startEditCodeFile: (file: CodeFile) => void;
  cancelEditCodeFile: () => void;
  setEditCodeFilename: (value: string) => void;
  setEditCodeContent: (value: string) => void;
  setEditCodeLanguage: (value: string) => void;
  
  // Rename handlers
  startRenameCodeFile: (file: CodeFile) => void;
  cancelRenameCodeFile: () => void;
  setRenameCodeFilename: (value: string) => void;
  startRenameAttachment: (attachment: Attachment) => void;
  cancelRenameAttachment: () => void;
  setRenameAttachmentFilename: (value: string) => void;
  
  // Reset all editing states
  resetAllEditing: () => void;
}

/**
 * Hook to manage file editing and renaming states
 */
export function useFileEditing(): UseFileEditingResult {
  const [editingCodeFileId, setEditingCodeFileId] = useState<string | null>(null);
  const [editCodeFilename, setEditCodeFilename] = useState("");
  const [editCodeContent, setEditCodeContent] = useState("");
  const [editCodeLanguage, setEditCodeLanguage] = useState("");
  
  const [renamingCodeFileId, setRenamingCodeFileId] = useState<string | null>(null);
  const [renamingAttachmentId, setRenamingAttachmentId] = useState<string | null>(null);
  const [renameCodeFilename, setRenameCodeFilename] = useState("");
  const [renameAttachmentFilename, setRenameAttachmentFilename] = useState("");

  const startEditCodeFile = (file: CodeFile) => {
    setEditingCodeFileId(file.id);
    setEditCodeFilename(file.filename);
    setEditCodeContent(file.content);
    setEditCodeLanguage(file.language);
    setRenamingCodeFileId(null);
    setRenamingAttachmentId(null);
  };

  const cancelEditCodeFile = () => {
    setEditingCodeFileId(null);
    setEditCodeFilename("");
    setEditCodeContent("");
    setEditCodeLanguage("");
  };

  const startRenameCodeFile = (file: CodeFile) => {
    setRenamingCodeFileId(file.id);
    setRenameCodeFilename(file.filename);
    setEditingCodeFileId(null);
    setRenamingAttachmentId(null);
  };

  const cancelRenameCodeFile = () => {
    setRenamingCodeFileId(null);
    setRenameCodeFilename("");
  };

  const startRenameAttachment = (attachment: Attachment) => {
    setRenamingAttachmentId(attachment.id);
    setRenameAttachmentFilename(attachment.filename);
    setRenamingCodeFileId(null);
    setEditingCodeFileId(null);
  };

  const cancelRenameAttachment = () => {
    setRenamingAttachmentId(null);
    setRenameAttachmentFilename("");
  };

  const resetAllEditing = () => {
    cancelEditCodeFile();
    cancelRenameCodeFile();
    cancelRenameAttachment();
  };

  return {
    editingCodeFileId,
    editCodeFilename,
    editCodeContent,
    editCodeLanguage,
    renamingCodeFileId,
    renamingAttachmentId,
    renameCodeFilename,
    renameAttachmentFilename,
    startEditCodeFile,
    cancelEditCodeFile,
    setEditCodeFilename,
    setEditCodeContent,
    setEditCodeLanguage,
    startRenameCodeFile,
    cancelRenameCodeFile,
    setRenameCodeFilename,
    startRenameAttachment,
    cancelRenameAttachment,
    setRenameAttachmentFilename,
    resetAllEditing,
  };
}

