"use client";

import React from "react";
import type { ExecutionResult } from "@/lib/submission/types";

interface ExecutionResultsProps {
  result: ExecutionResult;
  userInput: string;
  onClose: () => void;
}

export function ExecutionResults({
  result,
  userInput,
  onClose,
}: ExecutionResultsProps) {
  return (
    <div className="border-t border-border/30 bg-muted/30">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Execution Results
          </h3>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Close
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs font-semibold rounded ${
              result.status.id === 3
                ? "bg-green-100 text-green-800"
                : result.status.id === 6
                ? "bg-red-100 text-red-800"
                : result.status.id >= 7 && result.status.id <= 12
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {result.status.description}
          </span>
          <span className="text-xs text-muted-foreground">
            Time: {result.time}s | Memory:{" "}
            {result.memory
              ? `${(result.memory / 1024).toFixed(2)} MB`
              : "N/A"}
          </span>
        </div>

        {/* Input (if provided) */}
        {userInput && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">
              Input Used:
            </label>
            <pre className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs font-mono text-blue-900 overflow-x-auto whitespace-pre-wrap break-words">
              {userInput || "(no input)"}
            </pre>
          </div>
        )}

        {/* Output */}
        {result.stdout && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Output:
            </label>
            <pre className="p-3 bg-white/80 border border-border/50 rounded-lg text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-words">
              {result.stdout || "(no output)"}
            </pre>
          </div>
        )}

        {/* Error/Stderr */}
        {result.stderr && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-destructive">
              Error:
            </label>
            <pre className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-800 overflow-x-auto whitespace-pre-wrap break-words">
              {result.stderr}
            </pre>
          </div>
        )}

        {/* Message (if any) */}
        {result.message && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}

