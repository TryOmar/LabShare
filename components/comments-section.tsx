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
}

export default function CommentsSection({
  submissionId,
  studentId,
  studentName,
}: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [submissionId]);

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
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="mt-2 px-4 py-2 bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Post Comment"}
        </button>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="border border-gray-300 p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-black">
                    {comment.students?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDateTime(comment.created_at)}
                  </p>
                </div>
                {comment.student_id === studentId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="text-xs text-red-600 hover:text-red-800 underline"
                  >
                    Delete
                  </button>
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
