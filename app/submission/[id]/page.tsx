"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/navigation";
import CommentsSection from "@/components/comments-section";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { useSubmission } from "@/hooks/submission/useSubmission";
import { useSubmissionMutations } from "@/hooks/submission/useSubmissionMutations";
import { useFileEditing } from "@/hooks/submission/useFileEditing";
import { usePreviewStates } from "@/hooks/submission/usePreviewStates";
import { useCodeExecution } from "@/hooks/submission/useCodeExecution";
import { useDialogStates } from "@/hooks/submission/useDialogStates";
import { useFileOperations } from "@/hooks/submission/useFileOperations";
import { useFileSelection } from "@/hooks/submission/useFileSelection";
import { useCommentsRefresh } from "@/hooks/submission/useCommentsRefresh";
import { AddFilesModal } from "@/components/submission/AddFilesModal";
import { SubmissionHeader } from "@/components/submission/SubmissionHeader";
import { FileSidebar } from "@/components/submission/FileSidebar";
import { CodeViewer } from "@/components/submission/CodeViewer";
import { AttachmentViewer } from "@/components/submission/AttachmentViewer";
import { UpvoteSection } from "@/components/submission/UpvoteSection";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function SubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id as string;

  // Main submission data hook
  const {
    submission,
    codeFiles,
    attachments,
    selectedCodeFile,
    selectedAttachment,
    student,
    track,
    isOwner,
    loading,
    error,
    setSubmission,
    setSelectedCodeFile,
    setSelectedAttachment,
    reloadSubmission,
  } = useSubmission(submissionId);

  // Comments refresh hook
  const { commentsRefreshKey, refreshComments } = useCommentsRefresh();

  // Mutations hook
  const {
    isDeleting,
    isUpvoting,
    isRunningCode,
    isRenamingSubmission,
    handleToggleAnonymity,
    handleRenameSubmission,
    handleToggleUpvote,
    handleDeleteSubmission,
    handleUpdateCodeFile,
    handleRenameCodeFile,
    handleRenameAttachment,
    handleDeleteCodeFile,
    handleDeleteAttachment,
    handleRunCode,
  } = useSubmissionMutations({
    submissionId,
    submission,
    setSubmission,
    isOwner,
    selectedCodeFile,
    setSelectedCodeFile,
    selectedAttachment,
    setSelectedAttachment,
    reloadSubmission,
    onCommentsRefresh: refreshComments,
  });

  // File editing hook
  const fileEditing = useFileEditing();

  // Preview states hook
  const previewStates = usePreviewStates({
    selectedCodeFile,
    selectedAttachment,
  });

  // Code execution hook
  const codeExecution = useCodeExecution();

  // Dialog states hook
  const dialogStates = useDialogStates();

  // File operations hook (combines editing with mutations)
  const fileOperations = useFileOperations({
    ...fileEditing,
    handleUpdateCodeFile,
    handleRenameCodeFile,
    handleRenameAttachment,
    handleDeleteCodeFile,
    handleDeleteAttachment,
    cancelEditCodeFile: fileEditing.cancelEditCodeFile,
    cancelRenameCodeFile: fileEditing.cancelRenameCodeFile,
    cancelRenameAttachment: fileEditing.cancelRenameAttachment,
    onCommentsRefresh: refreshComments,
  });

  // File selection hook
  const fileSelection = useFileSelection({
    setSelectedCodeFile,
    setSelectedAttachment,
    resetPreviews: previewStates.resetPreviews,
    resetExecution: codeExecution.resetExecution,
    resetAllEditing: fileEditing.resetAllEditing,
  });

  // Mobile sheet state
  const [mobileFileSheetOpen, setMobileFileSheetOpen] = React.useState(false);

  // Handle start edit code file (needs to also select the file)
  const handleStartEditCodeFile = (
    file: NonNullable<typeof selectedCodeFile>
  ) => {
    fileSelection.handleSelectCodeFile(file);
    fileEditing.startEditCodeFile(file);
    codeExecution.resetExecution();
  };

  // Handle run code
  const handleRunCodeLocal = async () => {
    if (!selectedCodeFile) return;
    const result = await handleRunCode(
      selectedCodeFile.content,
      selectedCodeFile.language,
      codeExecution.userInput
    );
    if (result) {
      codeExecution.setExecutionResult(result);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-white to-accent/20 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="spinner h-5 w-5"></div>
          <p className="text-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
        <Navigation student={student} track={track} />
        <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
          <div className="border-2 border-destructive/50 bg-destructive/10 rounded-xl p-6 sm:p-8 shadow-modern-lg animate-slide-up backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h2 className="text-xl font-bold text-destructive">
                Access Denied
              </h2>
            </div>
            <p className="text-destructive/90 mb-5 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push("/labs")}
              className="px-5 py-2.5 gradient-primary text-primary-foreground font-semibold rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-primary hover:shadow-primary-lg"
            >
              Back to Labs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle delete operations
  const handleDeleteCodeFileConfirm = async () => {
    if (!dialogStates.codeFileToDelete) return;
    try {
      await fileOperations.deleteCodeFile(dialogStates.codeFileToDelete.id);
      if (selectedCodeFile?.id === dialogStates.codeFileToDelete.id) {
        setSelectedCodeFile(null);
      }
      dialogStates.closeDeleteCodeFileDialog();
    } catch (err) {
      // Error already handled
    }
  };

  const handleDeleteAttachmentConfirm = async () => {
    if (!dialogStates.attachmentToDelete) return;
    try {
      await fileOperations.deleteAttachment(dialogStates.attachmentToDelete.id);
      if (selectedAttachment?.id === dialogStates.attachmentToDelete.id) {
        setSelectedAttachment(null);
      }
      dialogStates.closeDeleteAttachmentDialog();
    } catch (err) {
      // Error already handled
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
      <Navigation student={student} track={track} />

      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        {submission?.labs?.courses && submission?.labs && (
          <div className="mb-4 sm:mb-6 animate-slide-up">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/labs?course=${submission.labs.courses.id}`}
                      className="hover:text-primary transition-colors duration-200"
                    >
                      {submission.labs.courses.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/lab/${submission.labs.id}`}
                      className="hover:text-primary transition-colors duration-200"
                    >
                      Lab {submission.labs.lab_number}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{submission.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}

        {/* Header */}
        <SubmissionHeader
          submission={submission}
          isOwner={isOwner}
          student={student}
          isUpvoting={isUpvoting}
          isRenamingSubmission={isRenamingSubmission}
          onToggleAnonymity={handleToggleAnonymity}
          onToggleUpvote={handleToggleUpvote}
          onRenameSubmission={handleRenameSubmission}
          onBack={() => router.back()}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Mobile File Sidebar Button */}
          <div className="lg:hidden">
            <Sheet open={mobileFileSheetOpen} onOpenChange={setMobileFileSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary shadow-modern backdrop-blur-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  Files
                  {selectedCodeFile && (
                    <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">
                      {selectedCodeFile.filename}
                    </span>
                  )}
                  {selectedAttachment && !selectedCodeFile && (
                    <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">
                      {selectedAttachment.filename}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Files</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  {/* Add Files Button */}
                  {isOwner && (
                    <div className="mb-4">
                      <button
                        onClick={() => {
                          dialogStates.setShowAddFilesModal(true);
                        }}
                        className="w-full px-4 py-2.5 border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary text-sm font-semibold rounded-lg transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
                      >
                        + Add Files
                      </button>
                    </div>
                  )}

                  {/* File Sidebar */}
                  <FileSidebar
                    codeFiles={codeFiles}
                    attachments={attachments}
                    selectedCodeFile={selectedCodeFile}
                    selectedAttachment={selectedAttachment}
                    isOwner={isOwner}
                    renamingCodeFileId={fileEditing.renamingCodeFileId}
                    renamingAttachmentId={fileEditing.renamingAttachmentId}
                    renameCodeFilename={fileEditing.renameCodeFilename}
                    renameAttachmentFilename={fileEditing.renameAttachmentFilename}
                    onSelectCodeFile={(file) => {
                      fileSelection.handleSelectCodeFile(file);
                      setMobileFileSheetOpen(false);
                    }}
                    onSelectAttachment={(attachment) => {
                      fileSelection.handleSelectAttachment(attachment);
                      setMobileFileSheetOpen(false);
                    }}
                    onStartEditCodeFile={(file) => handleStartEditCodeFile(file)}
                    onStartRenameCodeFile={fileEditing.startRenameCodeFile}
                    onCancelRenameCodeFile={fileEditing.cancelRenameCodeFile}
                    onSaveCodeFileRename={fileOperations.saveCodeFileRename}
                    onDeleteCodeFile={dialogStates.openDeleteCodeFileDialog}
                    onStartRenameAttachment={fileEditing.startRenameAttachment}
                    onCancelRenameAttachment={fileEditing.cancelRenameAttachment}
                    onSaveAttachmentRename={fileOperations.saveAttachmentRename}
                    onDeleteAttachment={dialogStates.openDeleteAttachmentDialog}
                    onRenameCodeFilenameChange={fileEditing.setRenameCodeFilename}
                    onRenameAttachmentFilenameChange={
                      fileEditing.setRenameAttachmentFilename
                    }
                    onResetPreview={fileSelection.handleResetPreview}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden lg:block w-full lg:w-auto">
            {/* Add Files Button */}
            {isOwner && (
              <div className="mb-4">
                <button
                  onClick={() => dialogStates.setShowAddFilesModal(true)}
                  className="w-full px-4 py-2.5 border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary text-sm font-semibold rounded-lg transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
                >
                  + Add Files
                </button>
              </div>
            )}

            {/* File Sidebar */}
            <FileSidebar
              codeFiles={codeFiles}
              attachments={attachments}
              selectedCodeFile={selectedCodeFile}
              selectedAttachment={selectedAttachment}
              isOwner={isOwner}
              renamingCodeFileId={fileEditing.renamingCodeFileId}
              renamingAttachmentId={fileEditing.renamingAttachmentId}
              renameCodeFilename={fileEditing.renameCodeFilename}
              renameAttachmentFilename={fileEditing.renameAttachmentFilename}
              onSelectCodeFile={fileSelection.handleSelectCodeFile}
              onSelectAttachment={fileSelection.handleSelectAttachment}
              onStartEditCodeFile={(file) => handleStartEditCodeFile(file)}
              onStartRenameCodeFile={fileEditing.startRenameCodeFile}
              onCancelRenameCodeFile={fileEditing.cancelRenameCodeFile}
              onSaveCodeFileRename={fileOperations.saveCodeFileRename}
              onDeleteCodeFile={dialogStates.openDeleteCodeFileDialog}
              onStartRenameAttachment={fileEditing.startRenameAttachment}
              onCancelRenameAttachment={fileEditing.cancelRenameAttachment}
              onSaveAttachmentRename={fileOperations.saveAttachmentRename}
              onDeleteAttachment={dialogStates.openDeleteAttachmentDialog}
              onRenameCodeFilenameChange={fileEditing.setRenameCodeFilename}
              onRenameAttachmentFilenameChange={
                fileEditing.setRenameAttachmentFilename
              }
              onResetPreview={fileSelection.handleResetPreview}
            />
          </div>

          {/* Code Viewer + Attachments + Comments */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 w-full min-w-0">
            {/* Code File Viewer */}
            {selectedCodeFile ? (
              <CodeViewer
                file={selectedCodeFile}
                isOwner={isOwner}
                editingCodeFileId={fileEditing.editingCodeFileId}
                editCodeFilename={fileEditing.editCodeFilename}
                editCodeContent={fileEditing.editCodeContent}
                editCodeLanguage={fileEditing.editCodeLanguage}
                showHtmlPreview={previewStates.showHtmlPreview}
                isRunningCode={isRunningCode}
                userInput={codeExecution.userInput}
                executionResult={codeExecution.executionResult}
                onStartEdit={() => handleStartEditCodeFile(selectedCodeFile)}
                onCancelEdit={fileEditing.cancelEditCodeFile}
                onSaveEdit={fileOperations.saveCodeFile}
                onFilenameChange={fileEditing.setEditCodeFilename}
                onContentChange={fileEditing.setEditCodeContent}
                onLanguageChange={fileEditing.setEditCodeLanguage}
                onToggleHtmlPreview={previewStates.toggleHtmlPreview}
                onRunCode={handleRunCodeLocal}
                onUserInputChange={codeExecution.setUserInput}
                onCloseExecutionResults={() =>
                  codeExecution.setExecutionResult(null)
                }
              />
            ) : selectedAttachment ? (
              <AttachmentViewer
                attachment={selectedAttachment}
                showImagePreview={previewStates.showImagePreview}
                onTogglePreview={previewStates.toggleImagePreview}
              />
            ) : (
              <p className="text-muted-foreground">No file selected</p>
            )}

            {/* Comments Section */}
            {submission && (
              <CommentsSection
                submissionId={submission.id}
                studentId={student?.id || ""}
                studentName={student?.name || ""}
                refreshKey={commentsRefreshKey}
              />
            )}

            {/* Upvote Section */}
            {submission && (
              <UpvoteSection
                submission={submission}
                isOwner={isOwner}
                isUpvoting={isUpvoting}
                onToggleUpvote={handleToggleUpvote}
              />
            )}
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 animate-slide-up">
            <button
              onClick={() => dialogStates.setDeleteSubmissionDialogOpen(true)}
              className="w-full sm:w-auto px-6 py-2.5 border border-destructive/50 text-destructive font-semibold rounded-lg hover:bg-destructive/10 hover:border-destructive transition-all duration-300 shadow-modern"
            >
              Delete Submission
            </button>
          </div>
        )}

        {/* Add Files Modal */}
        {dialogStates.showAddFilesModal && (
          <AddFilesModal
            submissionId={submissionId}
            onClose={() => {
              dialogStates.setShowAddFilesModal(false);
              reloadSubmission().catch(() => {
                toast.error("Failed to reload submission data");
              });
              refreshComments();
            }}
          />
        )}

        {/* Delete Confirmation Dialogs */}
        <DeleteConfirmationDialog
          open={dialogStates.deleteSubmissionDialogOpen}
          onOpenChange={dialogStates.setDeleteSubmissionDialogOpen}
          title="Delete Submission"
          description="Are you sure you want to delete this submission? This action cannot be undone and will delete all associated files and comments."
          onConfirm={handleDeleteSubmission}
          isLoading={isDeleting}
        />

        <DeleteConfirmationDialog
          open={dialogStates.deleteCodeFileDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              dialogStates.closeDeleteCodeFileDialog();
            } else {
              dialogStates.setDeleteCodeFileDialogOpen(true);
            }
          }}
          title="Delete Code File"
          description={`Are you sure you want to delete "${dialogStates.codeFileToDelete?.filename}"? This action cannot be undone.`}
          onConfirm={handleDeleteCodeFileConfirm}
          isLoading={isDeleting}
        />

        <DeleteConfirmationDialog
          open={dialogStates.deleteAttachmentDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              dialogStates.closeDeleteAttachmentDialog();
            } else {
              dialogStates.setDeleteAttachmentDialogOpen(true);
            }
          }}
          title="Delete Attachment"
          description={`Are you sure you want to delete "${dialogStates.attachmentToDelete?.filename}"? This action cannot be undone.`}
          onConfirm={handleDeleteAttachmentConfirm}
          isLoading={isDeleting}
        />
      </div>
    </div>
  );
}
