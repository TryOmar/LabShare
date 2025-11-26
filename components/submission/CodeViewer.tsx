"use client";

import React from "react";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { languageColors, mapLanguageToPrism } from "@/lib/submission/utils";
import type { CodeFile, ExecutionResult } from "@/lib/submission/types";
import { ExecutionResults } from "./ExecutionResults";

interface CodeViewerProps {
  file: CodeFile;
  isOwner: boolean;
  editingCodeFileId: string | null;
  editCodeFilename: string;
  editCodeContent: string;
  editCodeLanguage: string;
  showHtmlPreview: boolean;
  isRunningCode: boolean;
  userInput: string;
  executionResult: ExecutionResult | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onFilenameChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onToggleHtmlPreview: () => void;
  onRunCode: () => void;
  onUserInputChange: (value: string) => void;
  onCloseExecutionResults: () => void;
}

export function CodeViewer({
  file,
  isOwner,
  editingCodeFileId,
  editCodeFilename,
  editCodeContent,
  editCodeLanguage,
  showHtmlPreview,
  isRunningCode,
  userInput,
  executionResult,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onFilenameChange,
  onContentChange,
  onLanguageChange,
  onToggleHtmlPreview,
  onRunCode,
  onUserInputChange,
  onCloseExecutionResults,
}: CodeViewerProps) {
  const isEditing = editingCodeFileId === file.id;
  const isHtml = file.language.toLowerCase() === "html";
  const isCpp =
    file.language.toLowerCase() === "cpp" ||
    file.language.toLowerCase() === "c++";

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden shadow-modern backdrop-blur-sm bg-gradient-card w-full min-w-0">
      {/* File Header */}
      <div
        className={`bg-muted/50 border-b border-border/30 p-3 sm:p-4 flex justify-between rounded-t-xl ${
          isEditing ? "items-start" : "items-center"
        }`}
      >
        <div className="flex-1 pr-4 min-w-0">
          {isEditing ? (
            // Edit mode - show filename input and language selector
            <div className="space-y-2 w-full">
              <input
                type="text"
                value={editCodeFilename}
                onChange={(e) => onFilenameChange(e.target.value)}
                className="w-full px-3 py-2 border border-border/50 bg-white/80 text-foreground text-sm font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="Filename"
              />
              <select
                value={editCodeLanguage}
                onChange={(e) => onLanguageChange(e.target.value)}
                className="px-3 py-2 border border-border/50 bg-white/80 text-foreground text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              >
                <option value="text">text</option>
                <option value="javascript">javascript</option>
                <option value="typescript">typescript</option>
                <option value="python">python</option>
                <option value="java">java</option>
                <option value="c">c</option>
                <option value="cpp">cpp</option>
                <option value="csharp">csharp</option>
                <option value="php">php</option>
                <option value="ruby">ruby</option>
                <option value="go">go</option>
                <option value="rust">rust</option>
                <option value="SQL">SQL</option>
                <option value="HTML">HTML</option>
                <option value="CSS">CSS</option>
              </select>
            </div>
          ) : (
            // View mode - show filename and language badge
            <>
              <p className="font-semibold text-foreground">{file.filename}</p>
              <span
                className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${
                  languageColors[file.language] || languageColors.text
                }`}
              >
                {file.language.toUpperCase()}
              </span>
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            {isOwner && (
              <button
                onClick={onStartEdit}
                className="px-3 py-1.5 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary rounded-lg transition-all duration-200 shadow-modern"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(file.content);
                toast.success("Copied to clipboard!");
              }}
              className="px-3 py-1.5 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary rounded-lg transition-all duration-200 shadow-modern"
            >
              Copy
            </button>
            {isHtml && (
              <button
                onClick={onToggleHtmlPreview}
                className="px-3 py-1.5 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary rounded-lg transition-all duration-200 shadow-modern"
              >
                {showHtmlPreview ? "Code" : "Preview"}
              </button>
            )}
          </div>
        )}
        {isOwner && isEditing && (
          <div className="flex gap-2 flex-shrink-0 pt-0.5">
            <button
              onClick={onSaveEdit}
              className="px-3 py-1.5 text-xs gradient-primary text-primary-foreground hover:gradient-primary-hover rounded-lg transition-all duration-200 shadow-primary hover:shadow-primary-lg"
            >
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="px-3 py-1.5 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 rounded-lg transition-all duration-200 shadow-modern"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Code Content - Edit or View or Preview */}
      {isEditing ? (
        <div className="p-4 sm:p-5 bg-white/80 backdrop-blur-sm w-full min-w-0 overflow-x-auto">
          <textarea
            value={editCodeContent}
            onChange={(e) => onContentChange(e.target.value)}
            className="w-full min-w-full px-4 py-3 border border-border/50 bg-white/80 text-foreground font-mono text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 shadow-modern"
            rows={25}
            placeholder="Code content"
            style={{
              fontFamily: "monospace",
              resize: "vertical",
              whiteSpace: "pre",
              overflowWrap: "normal",
              overflowX: "auto",
            }}
          />
        </div>
      ) : showHtmlPreview && isHtml ? (
        <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] border-t border-border/30 bg-white">
          <iframe
            srcDoc={file.content}
            className="w-full h-full border-0"
            title="HTML Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      ) : (
        <>
          <div className="w-full overflow-x-auto bg-gray-50">
            <pre className="p-0 m-0 text-xs sm:text-sm leading-relaxed min-w-full">
              <SyntaxHighlighter
                language={mapLanguageToPrism(file.language)}
                style={oneLight}
                PreTag="div"
                showLineNumbers={true}
                wrapLongLines={false}
                customStyle={{
                  margin: 0,
                  background: "transparent",
                  overflow: "auto",
                }}
                className="!p-3 sm:!p-4 text-xs sm:text-sm leading-relaxed"
                codeTagProps={{
                  style: {
                    fontFamily: "monospace",
                    fontSize: "inherit",
                  }
                }}
              >
                {file.content}
              </SyntaxHighlighter>
            </pre>
          </div>

          {/* User Input Section (for C++ files) */}
          {isCpp && (
            <div className="border-t border-border/30 bg-muted/20 p-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-1.5">
                <div className="flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-muted-foreground"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                  <span className="text-xs font-medium text-muted-foreground">
                    Input (stdin)
                  </span>
                </div>
                <button
                  onClick={onRunCode}
                  disabled={isRunningCode}
                  className="w-full sm:w-auto px-3 py-1.5 text-xs border border-border/50 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 hover:text-green-800 rounded-lg transition-all duration-200 shadow-modern disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  {isRunningCode ? (
                    <>
                      <div className="spinner h-3 w-3 border-2 border-green-600 border-t-transparent rounded-full"></div>
                      Running...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                      </svg>
                      Run
                    </>
                  )}
                </button>
              </div>
              <textarea
                value={userInput}
                onChange={(e) => onUserInputChange(e.target.value)}
                placeholder="Input (stdin)..."
                rows={2}
                disabled={isRunningCode}
                className="w-full px-3 py-2 border border-border/40 bg-white/60 text-foreground font-mono text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>
          )}

          {/* Execution Results */}
          {executionResult && (
            <ExecutionResults
              result={executionResult}
              userInput={userInput}
              onClose={onCloseExecutionResults}
            />
          )}
        </>
      )}
    </div>
  );
}

