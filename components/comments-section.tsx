"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [submissionId, refreshKey]);

  const loadComments = async () => {
    try {
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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      setNewComment("");
      loadComments();
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;

    try {
      const response = await fetch(
        `/api/submission/${submissionId}/comments/${commentId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete comment");
      }

      loadComments();
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const renderMarkdown = (content: string) => {
    let html = content;

    // Code blocks
    html = html.replace(/\`\`\`(.*?)\`\`\`/gs, "<pre><code>$1</code></pre>");

    // Inline code
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    return html;
  };

  return (
    <div className="border border-border/50 p-5 rounded-xl shadow-modern-lg backdrop-blur-sm bg-gradient-card animate-slide-up">
      <h3 className="font-bold text-foreground mb-5 text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
        Comments ({comments.length})
      </h3>

      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... (supports **bold**, `code`, and \`\`\`code blocks\`\`\`)"
          rows={3}
          className="w-full px-4 py-3 border border-border/50 bg-white/80 text-foreground text-sm resize-none rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-modern transition-all duration-300 backdrop-blur-sm hover:border-primary/30"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="mt-3 px-5 py-2.5 gradient-primary text-primary-foreground font-semibold rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-primary hover:shadow-primary-lg"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment, index) => (
            <div 
              key={comment.id} 
              className="border border-border/50 p-4 rounded-xl bg-white/80 backdrop-blur-sm shadow-modern hover:shadow-modern-lg transition-all duration-300 hover-lift"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {comment.students?.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(comment.created_at)}
                  </p>
                </div>
                {comment.student_id === studentId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-destructive hover:text-destructive/80 underline transition-colors duration-200 font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="text-sm text-foreground prose prose-sm max-w-none">
                <p dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
