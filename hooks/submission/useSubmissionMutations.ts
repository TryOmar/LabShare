import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  Submission,
  CodeFile,
  Attachment,
  ExecutionResult,
} from "@/lib/submission/types";
import {
  updateSubmissionAnonymity,
  updateCodeFile,
  renameCodeFile as renameCodeFileApi,
  deleteCodeFile as deleteCodeFileApi,
  renameAttachment as renameAttachmentApi,
  deleteAttachment as deleteAttachmentApi,
  toggleUpvote,
  deleteSubmission as deleteSubmissionApi,
  runCode,
} from "@/lib/submission/api";

interface UseSubmissionMutationsProps {
  submissionId: string;
  submission: Submission | null;
  setSubmission: (submission: Submission | null) => void;
  isOwner: boolean;
  selectedCodeFile: CodeFile | null;
  setSelectedCodeFile: (file: CodeFile | null) => void;
  selectedAttachment: Attachment | null;
  setSelectedAttachment: (attachment: Attachment | null) => void;
  reloadSubmission: () => Promise<void>;
  onCommentsRefresh?: () => void;
}

export function useSubmissionMutations({
  submissionId,
  submission,
  setSubmission,
  isOwner,
  selectedCodeFile,
  setSelectedCodeFile,
  selectedAttachment,
  setSelectedAttachment,
  reloadSubmission,
  onCommentsRefresh,
}: UseSubmissionMutationsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isRunningCode, setIsRunningCode] = useState(false);

  const handleToggleAnonymity = async (currentValue: boolean) => {
    if (!submission) return;

    try {
      const updatedSubmission = await updateSubmissionAnonymity(
        submissionId,
        !currentValue
      );
      setSubmission(updatedSubmission);
      toast.success("Anonymity setting updated");
    } catch (err) {
      console.error("Error updating submission anonymity:", err);
      toast.error("Failed to update anonymity setting. Please try again.");
    }
  };

  const handleToggleUpvote = async () => {
    if (!submission || isOwner || isUpvoting) return;

    // Store previous state for potential rollback
    const previousSubmission = { ...submission };
    const previousUpvoteCount = submission.upvote_count || 0;
    const previousUserHasUpvoted = submission.user_has_upvoted || false;

    // Optimistically update UI immediately
    const newUpvoteCount = previousUserHasUpvoted
      ? previousUpvoteCount - 1
      : previousUpvoteCount + 1;
    const newUserHasUpvoted = !previousUserHasUpvoted;

    setSubmission({
      ...submission,
      upvote_count: newUpvoteCount,
      user_has_upvoted: newUserHasUpvoted,
    });
    setIsUpvoting(true);

    try {
      const data = await toggleUpvote(submissionId);

      // Update with server response to ensure consistency
      setSubmission({
        ...submission,
        upvote_count: data.upvoteCount,
        user_has_upvoted: data.upvoted,
      });
    } catch (err) {
      console.error("Error toggling upvote:", err);

      // Revert to previous state on error
      setSubmission(previousSubmission);

      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to toggle upvote. Please try again."
      );
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleDeleteSubmission = async () => {
    setIsDeleting(true);
    try {
      await deleteSubmissionApi(submissionId);
      toast.success("Submission deleted successfully!");
      router.push("/labs");
    } catch (err) {
      console.error("Error deleting submission:", err);
      toast.error("Failed to delete submission. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleUpdateCodeFile = async (
    codeFileId: string,
    data: { filename: string; content: string; language: string }
  ) => {
    try {
      await updateCodeFile(submissionId, codeFileId, data);
      toast.success("Code file updated successfully!");
      await reloadSubmission();
      onCommentsRefresh?.();
    } catch (err) {
      console.error("Error updating code file:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update code file"
      );
      throw err;
    }
  };

  const handleRenameCodeFile = async (codeFileId: string, filename: string) => {
    try {
      await renameCodeFileApi(submissionId, codeFileId, filename);
      toast.success("File renamed successfully!");
      await reloadSubmission();
      onCommentsRefresh?.();
    } catch (err) {
      console.error("Error renaming code file:", err);
      toast.error(err instanceof Error ? err.message : "Failed to rename file");
      throw err;
    }
  };

  const handleDeleteCodeFile = async (codeFileId: string) => {
    setIsDeleting(true);
    try {
      await deleteCodeFileApi(submissionId, codeFileId);
      toast.success("Code file deleted successfully!");
      if (selectedCodeFile?.id === codeFileId) {
        setSelectedCodeFile(null);
      }
      await reloadSubmission();
      onCommentsRefresh?.();
    } catch (err) {
      console.error("Error deleting code file:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete code file"
      );
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRenameAttachment = async (
    attachmentId: string,
    filename: string
  ) => {
    try {
      await renameAttachmentApi(submissionId, attachmentId, filename);
      toast.success("Attachment renamed successfully!");
      await reloadSubmission();
      onCommentsRefresh?.();
    } catch (err) {
      console.error("Error renaming attachment:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to rename attachment"
      );
      throw err;
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    setIsDeleting(true);
    try {
      await deleteAttachmentApi(submissionId, attachmentId);
      toast.success("Attachment deleted successfully!");
      if (selectedAttachment?.id === attachmentId) {
        setSelectedAttachment(null);
      }
      await reloadSubmission();
      onCommentsRefresh?.();
    } catch (err) {
      console.error("Error deleting attachment:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete attachment"
      );
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRunCode = async (
    code: string,
    language: string,
    stdin: string
  ): Promise<ExecutionResult | null> => {
    if (language.toLowerCase() !== "cpp" && language.toLowerCase() !== "c++") {
      toast.error("Run button is only available for C++ code");
      return null;
    }

    setIsRunningCode(true);

    try {
      const result = await runCode({
        code,
        language: "cpp",
        stdin: stdin || "",
      });

      if (result.status.id === 3) {
        toast.success("Code executed successfully!");
      } else if (result.status.id === 6) {
        toast.error("Compilation error");
      } else if (result.status.id >= 7 && result.status.id <= 12) {
        toast.error(`Runtime error: ${result.status.description}`);
      } else {
        toast.info(result.status.description);
      }

      return result;
    } catch (err) {
      console.error("Error running code:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to execute code"
      );
      return null;
    } finally {
      setIsRunningCode(false);
    }
  };

  return {
    isDeleting,
    isUpvoting,
    isRunningCode,
    handleToggleAnonymity,
    handleToggleUpvote,
    handleDeleteSubmission,
    handleUpdateCodeFile,
    handleRenameCodeFile,
    handleDeleteCodeFile,
    handleRenameAttachment,
    handleDeleteAttachment,
    handleRunCode,
  };
}

