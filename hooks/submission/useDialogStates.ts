import { useState } from "react";

interface DeleteTarget {
  id: string;
  filename: string;
}

interface UseDialogStatesResult {
  // Modal states
  showAddFilesModal: boolean;
  setShowAddFilesModal: (open: boolean) => void;
  
  // Dialog states
  deleteSubmissionDialogOpen: boolean;
  setDeleteSubmissionDialogOpen: (open: boolean) => void;
  deleteCodeFileDialogOpen: boolean;
  setDeleteCodeFileDialogOpen: (open: boolean) => void;
  deleteAttachmentDialogOpen: boolean;
  setDeleteAttachmentDialogOpen: (open: boolean) => void;
  
  // Delete targets
  codeFileToDelete: DeleteTarget | null;
  attachmentToDelete: DeleteTarget | null;
  setCodeFileToDelete: (target: DeleteTarget | null) => void;
  setAttachmentToDelete: (target: DeleteTarget | null) => void;
  
  // Helpers
  openDeleteCodeFileDialog: (id: string, filename: string) => void;
  openDeleteAttachmentDialog: (id: string, filename: string) => void;
  closeDeleteCodeFileDialog: () => void;
  closeDeleteAttachmentDialog: () => void;
}

/**
 * Hook to manage all dialog and modal states
 */
export function useDialogStates(): UseDialogStatesResult {
  const [showAddFilesModal, setShowAddFilesModal] = useState(false);
  const [deleteSubmissionDialogOpen, setDeleteSubmissionDialogOpen] = useState(false);
  const [deleteCodeFileDialogOpen, setDeleteCodeFileDialogOpen] = useState(false);
  const [deleteAttachmentDialogOpen, setDeleteAttachmentDialogOpen] = useState(false);
  const [codeFileToDelete, setCodeFileToDelete] = useState<DeleteTarget | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<DeleteTarget | null>(null);

  const openDeleteCodeFileDialog = (id: string, filename: string) => {
    setCodeFileToDelete({ id, filename });
    setDeleteCodeFileDialogOpen(true);
  };

  const openDeleteAttachmentDialog = (id: string, filename: string) => {
    setAttachmentToDelete({ id, filename });
    setDeleteAttachmentDialogOpen(true);
  };

  const closeDeleteCodeFileDialog = () => {
    setDeleteCodeFileDialogOpen(false);
    setCodeFileToDelete(null);
  };

  const closeDeleteAttachmentDialog = () => {
    setDeleteAttachmentDialogOpen(false);
    setAttachmentToDelete(null);
  };

  return {
    showAddFilesModal,
    setShowAddFilesModal,
    deleteSubmissionDialogOpen,
    setDeleteSubmissionDialogOpen,
    deleteCodeFileDialogOpen,
    setDeleteCodeFileDialogOpen,
    deleteAttachmentDialogOpen,
    setDeleteAttachmentDialogOpen,
    codeFileToDelete,
    attachmentToDelete,
    setCodeFileToDelete,
    setAttachmentToDelete,
    openDeleteCodeFileDialog,
    openDeleteAttachmentDialog,
    closeDeleteCodeFileDialog,
    closeDeleteAttachmentDialog,
  };
}

