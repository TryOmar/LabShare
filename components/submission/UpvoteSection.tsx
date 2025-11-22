"use client";

import React from "react";
import type { Submission } from "@/lib/submission/types";

interface UpvoteSectionProps {
  submission: Submission | null;
  isOwner: boolean;
  isUpvoting: boolean;
  onToggleUpvote: () => void;
}

export function UpvoteSection({
  submission,
  isOwner,
  isUpvoting,
  onToggleUpvote,
}: UpvoteSectionProps) {
  return (
    <div className="mt-8 pt-6 border-t border-border/50 animate-slide-up">
      <div className="flex flex-col items-center justify-center gap-4 py-6">
        {!isOwner ? (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Found this submission helpful?
            </p>
            <button
              onClick={onToggleUpvote}
              disabled={isUpvoting}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-200 font-semibold ${
                submission?.user_has_upvoted
                  ? "bg-primary/10 text-primary border-2 border-primary/30 hover:bg-primary/20 hover:scale-105"
                  : "bg-accent/50 text-muted-foreground border-2 border-border/50 hover:bg-accent hover:border-primary/40 hover:text-primary hover:scale-105"
              } ${
                isUpvoting
                  ? "opacity-50 cursor-not-allowed scale-100"
                  : "cursor-pointer active:scale-95"
              } shadow-modern hover:shadow-primary/20`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 transition-transform duration-200 ${
                  submission?.user_has_upvoted ? "fill-current scale-110" : ""
                }`}
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span>
                {submission?.user_has_upvoted ? "Upvoted" : "Upvote"}
              </span>
              <span className="font-bold">
                {submission?.upvote_count || 0}
              </span>
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Your submission has received
            </p>
            <div className="flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/50 text-muted-foreground border-2 border-border/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span className="font-bold text-lg">
                {submission?.upvote_count || 0}
              </span>
              <span className="font-semibold">
                {submission?.upvote_count === 1 ? "upvote" : "upvotes"}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

