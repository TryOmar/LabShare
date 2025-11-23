"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Submission, Student } from "@/lib/submission/types";

interface SubmissionHeaderProps {
  submission: Submission | null;
  isOwner: boolean;
  student: Student | null;
  isUpvoting: boolean;
  onToggleAnonymity: (currentValue: boolean) => void;
  onToggleUpvote: () => void;
  onBack?: () => void;
}

export function SubmissionHeader({
  submission,
  isOwner,
  student,
  isUpvoting,
  onToggleAnonymity,
  onToggleUpvote,
  onBack,
}: SubmissionHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 sm:mb-8 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {submission?.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
            by{" "}
            {submission?.is_anonymous && !isOwner
              ? "Anonymous"
              : submission?.students?.name || "Unknown"}
          </p>
        </div>
        {isOwner && onBack && (
          <button
            onClick={onBack}
            className="px-4 sm:px-5 py-2.5 text-sm sm:text-base border border-border/50 text-foreground font-semibold rounded-lg hover:bg-accent/50 hover:border-primary/40 hover:text-primary whitespace-nowrap flex-shrink-0 transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
          >
            Back
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 flex-wrap items-center">
        <span>{submission?.view_count} views</span>
        <span className="break-words">
          Created:{" "}
          {submission?.created_at && formatDateTime(submission.created_at)}
        </span>
        {/* Upvote Button (for non-owners) */}
        {!isOwner && (
          <button
            onClick={onToggleUpvote}
            disabled={isUpvoting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
              submission?.user_has_upvoted
                ? "bg-[#007bff]/10 text-[#007bff] border border-[#007bff]/30 hover:bg-[#007bff]/20"
                : "bg-accent/50 text-muted-foreground border border-border/50 hover:bg-accent hover:border-[#007bff]/40 hover:text-[#007bff]"
            } ${
              isUpvoting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${
                submission?.user_has_upvoted ? "fill-current" : ""
              }`}
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="font-medium">{submission?.upvote_count || 0}</span>
          </button>
        )}
        {/* Upvote Count (read-only for owners) */}
        {isOwner && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/50 text-muted-foreground border border-border/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span className="font-medium">
              {submission?.upvote_count || 0} upvotes
            </span>
          </span>
        )}
        {isOwner && (
          <>
            <span className="break-words">
              Last edited:{" "}
              {submission?.updated_at && formatDateTime(submission.updated_at)}
            </span>
            <div className="flex items-center gap-2">
              <Switch
                id="submission-anonymous-toggle"
                checked={submission?.is_anonymous || false}
                onCheckedChange={() =>
                  onToggleAnonymity(submission?.is_anonymous || false)
                }
              />
              <Label
                htmlFor="submission-anonymous-toggle"
                className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
              >
                Anonymous
              </Label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
