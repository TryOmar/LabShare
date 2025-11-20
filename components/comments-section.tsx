"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
          isAnonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      setNewComment("");
      setIsAnonymous(false);
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

      loadComments();
    } catch (err) {
      console.error("Error updating comment anonymity:", err);
      alert("Failed to update anonymity setting. Please try again.");
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
    <div className="border border-black p-4">
      <h3 className="font-bold text-black mb-4 text-lg">
        Comments ({comments.length})
      </h3>

      {/* Add Comment */}
      <form onSubmit={handleAddComment} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment... (supports **bold**, `code`, and \`\`\`code blocks\`\`\`)"
          rows={3}
          className="w-full px-3 py-2 border border-black bg-white text-black text-sm resize-none"
          disabled={submitting}
        />
        <div className="mt-2 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Switch
              id="comment-anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              disabled={submitting}
            />
            <Label htmlFor="comment-anonymous" className="text-sm text-black cursor-pointer">
              Post anonymously
            </Label>
          </div>
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="border border-gray-300 p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-black">
                    {comment.students?.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(comment.created_at)}
                  </p>
                </div>
                {comment.student_id === studentId && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Switch
                        id={`comment-anonymous-${comment.id}`}
                        checked={comment.is_anonymous || false}
                        onCheckedChange={() => handleToggleAnonymity(comment.id, comment.is_anonymous || false)}
                      />
                      <Label htmlFor={`comment-anonymous-${comment.id}`} className="text-xs text-gray-600 cursor-pointer">
                        Anonymous
                      </Label>
                    </div>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="text-sm text-black prose prose-sm max-w-none">
                <p dangerouslySetInnerHTML={{ __html: renderMarkdown(comment.content) }} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-sm">No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}
