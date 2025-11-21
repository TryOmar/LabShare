"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_anonymous?: boolean;
  students?: {
    id: string;
    name: string;
  };
  student_id: string;
}

interface CommentsSectionProps {
  submissionId: string;
  studentId: string;
  studentName: string;
  refreshKey?: number; // When this changes, reload comments
}

export default function CommentsSection({
  submissionId,
  studentId,
  studentName,
  refreshKey,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [submissionId, refreshKey]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/submission/${submissionId}/comments`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load comments");
      }

      const data = await response.json();
      setComments(data.comments || []);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/submission/${submissionId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: newComment.trim(),
          isAnonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      setNewComment("");
      setIsAnonymous(false);
      await loadComments();
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(
        `/api/submission/${submissionId}/comments/${commentToDelete}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      setDeleteDialogOpen(false);
      setCommentToDelete(null);
      await loadComments();
    } catch (err) {
      console.error("Error deleting comment:", err);
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleAnonymity = async (commentId: string, currentValue: boolean) => {
    try {
      const response = await fetch(
        `/api/submission/${submissionId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            isAnonymous: !currentValue,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update comment anonymity");
      }

      await loadComments();
    } catch (err) {
      console.error("Error updating comment anonymity:", err);
      alert("Failed to update anonymity setting. Please try again.");
    }
  };

  const renderMarkdown = (content: string) => {
    let html = content;

    // Escape HTML to prevent XSS
    html = html
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Code blocks (triple backticks)
    html = html.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-muted/50 border border-border/30 rounded-lg p-3 my-2 overflow-x-auto"><code class="text-xs font-mono">$1</code></pre>'
    );

    // Inline code (single backticks)
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-muted/50 border border-border/30 rounded px-1.5 py-0.5 text-xs font-mono text-primary">$1</code>'
    );

    // Bold (double asterisks)
    html = html.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold text-foreground">$1</strong>'
    );

    // Convert line breaks to <br>
    html = html.replace(/\n/g, "<br>");

    return html;
  };

  return (
    <>
      <div className="border border-border/50 p-5 sm:p-6 rounded-xl shadow-modern hover:shadow-modern-lg transition-shadow duration-300 backdrop-blur-sm bg-gradient-card animate-slide-up">
        <h3 className="font-bold text-foreground mb-5 text-lg sm:text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Comments ({loading ? "..." : comments.length})
        </h3>

        {/* Add Comment */}
        <form onSubmit={handleAddComment} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment... (supports **bold**, `code`, and ```code blocks```)"
            rows={4}
            className="w-full px-4 py-3 border border-border/50 bg-white/80 text-foreground text-sm resize-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 shadow-modern backdrop-blur-sm hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <Switch
                id="comment-anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                disabled={submitting}
              />
              <Label htmlFor="comment-anonymous" className="text-sm text-foreground cursor-pointer">
                Post anonymously
              </Label>
            </div>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-5 py-2.5 gradient-primary text-primary-foreground font-semibold rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-primary hover:shadow-primary-lg text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="spinner h-4 w-4"></div>
                  Posting...
                </span>
              ) : (
                "Post Comment"
              )}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2 rounded-md" />
                      <Skeleton className="h-3 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-full mb-2 rounded-md" />
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment, index) => (
              <div
                key={comment.id}
                className="border border-border/50 p-4 sm:p-5 rounded-xl bg-white/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-modern transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate">
                        {comment.students?.name || "Anonymous"}
                      </p>
                      {comment.student_id === studentId && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/30 font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(comment.created_at)}
                    </p>
                  </div>
                  {comment.student_id === studentId && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <Switch
                          id={`comment-anonymous-${comment.id}`}
                          checked={comment.is_anonymous || false}
                          onCheckedChange={() => handleToggleAnonymity(comment.id, comment.is_anonymous || false)}
                        />
                        <Label htmlFor={`comment-anonymous-${comment.id}`} className="text-xs text-muted-foreground cursor-pointer">
                          Anonymous
                        </Label>
                      </div>
                      <button
                        onClick={() => handleDeleteClick(comment.id)}
                        className="ml-3 px-3 py-1.5 text-xs border border-destructive/50 text-destructive font-medium rounded-lg hover:bg-destructive/10 hover:border-destructive transition-all duration-200 flex-shrink-0 shadow-modern"
                        aria-label="Delete comment"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div
                  className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 border border-border/30 rounded-xl bg-muted/30 backdrop-blur-sm">
              <p className="text-muted-foreground text-sm">
                No comments yet. Be the first to comment! 💬
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 border border-border/50 rounded-xl shadow-xl p-6 sm:p-6 backdrop-blur-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground text-xl font-semibold">
              Delete Comment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm mt-2">
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-3 mt-6">
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setCommentToDelete(null);
              }}
              className="border border-border/50 text-foreground hover:bg-accent/50 hover:border-primary/40 rounded-lg transition-all duration-200 px-4 py-2"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 px-4 py-2"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <div className="spinner h-4 w-4"></div>
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
