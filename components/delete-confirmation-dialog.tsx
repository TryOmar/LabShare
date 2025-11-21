"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

/**
 * Reusable delete confirmation dialog component
 * 
 * @example
 * ```tsx
 * <DeleteConfirmationDialog
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Delete Submission"
 *   description="Are you sure you want to delete this submission? This action cannot be undone."
 *   onConfirm={handleDelete}
 *   isLoading={deleting}
 * />
 * ```
 */
export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
  confirmButtonText = "Delete",
  cancelButtonText = "Cancel",
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white dark:bg-gray-900 border border-border/50 rounded-xl shadow-xl p-6 sm:p-6 backdrop-blur-none">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-foreground text-xl font-semibold">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm mt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-3 mt-6">
          <AlertDialogCancel
            onClick={() => onOpenChange(false)}
            className="border border-border/50 text-foreground hover:bg-accent/50 hover:border-primary/40 rounded-lg transition-all duration-200 px-4 py-2"
            disabled={isLoading}
          >
            {cancelButtonText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-white hover:bg-destructive/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 px-4 py-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="spinner h-4 w-4"></div>
                Deleting...
              </span>
            ) : (
              confirmButtonText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

