"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CodeFile, Attachment } from "@/lib/submission/types";

/**
 * File icon SVG component
 */
function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

/**
 * Attachment/clip icon SVG component
 */
function AttachmentIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
      />
    </svg>
  );
}

interface FileSidebarProps {
  codeFiles: CodeFile[];
  attachments: Attachment[];
  selectedCodeFile: CodeFile | null;
  selectedAttachment: Attachment | null;
  isOwner: boolean;
  renamingCodeFileId: string | null;
  renamingAttachmentId: string | null;
  renameCodeFilename: string;
  renameAttachmentFilename: string;
  onSelectCodeFile: (file: CodeFile) => void;
  onSelectAttachment: (attachment: Attachment) => void;
  onStartEditCodeFile: (file: CodeFile) => void;
  onStartRenameCodeFile: (file: CodeFile) => void;
  onCancelRenameCodeFile: () => void;
  onSaveCodeFileRename: () => void;
  onDeleteCodeFile: (fileId: string, filename: string) => void;
  onStartRenameAttachment: (attachment: Attachment) => void;
  onCancelRenameAttachment: () => void;
  onSaveAttachmentRename: () => void;
  onDeleteAttachment: (attachmentId: string, filename: string) => void;
  onRenameCodeFilenameChange: (value: string) => void;
  onRenameAttachmentFilenameChange: (value: string) => void;
  onResetPreview: () => void;
}

export function FileSidebar({
  codeFiles,
  attachments,
  selectedCodeFile,
  selectedAttachment,
  isOwner,
  renamingCodeFileId,
  renamingAttachmentId,
  renameCodeFilename,
  renameAttachmentFilename,
  onSelectCodeFile,
  onSelectAttachment,
  onStartEditCodeFile,
  onStartRenameCodeFile,
  onCancelRenameCodeFile,
  onSaveCodeFileRename,
  onDeleteCodeFile,
  onStartRenameAttachment,
  onCancelRenameAttachment,
  onSaveAttachmentRename,
  onDeleteAttachment,
  onRenameCodeFilenameChange,
  onRenameAttachmentFilenameChange,
  onResetPreview,
}: FileSidebarProps) {
  return (
    <div className="w-full lg:w-auto">
      {/* Code Files List */}
      {codeFiles.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Code Files
          </h3>
          <div className="space-y-2">
            {codeFiles.map((file) => (
              <div key={file.id} className="relative">
                {renamingCodeFileId === file.id ? (
                  // Inline rename mode
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={renameCodeFilename}
                      onChange={(e) => onRenameCodeFilenameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSaveCodeFileRename();
                        } else if (e.key === "Escape") {
                          onCancelRenameCodeFile();
                        }
                      }}
                      onBlur={(e) => {
                        // Only save on blur if the related target is not the cancel button
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (
                          !relatedTarget ||
                          !relatedTarget.closest("button[data-cancel-rename]")
                        ) {
                          onSaveCodeFileRename();
                        }
                      }}
                      autoFocus
                      className="flex-1 px-2.5 py-1.5 border border-border/50 text-xs bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    />
                    <button
                      onClick={onSaveCodeFileRename}
                      className="px-2.5 py-1.5 gradient-primary text-primary-foreground text-xs rounded-lg hover:gradient-primary-hover transition-all duration-200 shadow-primary"
                    >
                      ✓
                    </button>
                    <button
                      data-cancel-rename
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur event
                      }}
                      onClick={onCancelRenameCodeFile}
                      className="px-2.5 py-1.5 border border-border/50 text-foreground text-xs rounded-lg hover:bg-accent/50 hover:border-primary/40 transition-all duration-200 shadow-modern"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  // View mode with 3-dot menu
                  <div className="relative flex items-center">
                    <button
                      onClick={() => {
                        onSelectCodeFile(file);
                        onResetPreview();
                      }}
                      className={`flex-1 flex items-center gap-2 text-left p-2.5 border rounded-lg text-xs pr-8 transition-all duration-200 ${selectedCodeFile?.id === file.id
                          ? "gradient-primary text-primary-foreground border-primary shadow-primary"
                          : "bg-white/80 text-foreground border-border/50 hover:bg-accent/50 hover:border-primary/40 shadow-modern backdrop-blur-sm"
                        }`}
                      title={file.filename}
                    >
                      <FileIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{file.filename}</span>
                    </button>
                    {isOwner && (
                      <div className="absolute right-1 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-none ${selectedCodeFile?.id === file.id
                                  ? "text-white hover:bg-gray-700 bg-white/10"
                                  : "text-foreground hover:bg-accent/50 bg-white"
                                }`}
                              title="Options"
                              style={{
                                fontSize: "12px",
                                lineHeight: "1",
                                letterSpacing: "1px",
                              }}
                            >
                              •••
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-gradient-card border border-border/50 shadow-modern-lg min-w-[120px] p-1 rounded-lg backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartEditCodeFile(file);
                              }}
                              className="text-xs cursor-pointer focus:bg-accent/50 hover:bg-accent/30 rounded-md transition-colors duration-200"
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartRenameCodeFile(file);
                              }}
                              className="text-xs cursor-pointer focus:bg-accent/50 hover:bg-accent/30 rounded-md transition-colors duration-200"
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCodeFile(file.id, file.filename);
                              }}
                              className="text-xs cursor-pointer focus:bg-destructive/10 hover:bg-destructive/10 text-destructive rounded-md transition-colors duration-200"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div>
          <h3 className="font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Attachments
          </h3>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative">
                {renamingAttachmentId === attachment.id ? (
                  // Inline rename mode
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={renameAttachmentFilename}
                      onChange={(e) =>
                        onRenameAttachmentFilenameChange(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          onSaveAttachmentRename();
                        } else if (e.key === "Escape") {
                          onCancelRenameAttachment();
                        }
                      }}
                      onBlur={(e) => {
                        // Only save on blur if the related target is not the cancel button
                        const relatedTarget = e.relatedTarget as HTMLElement;
                        if (
                          !relatedTarget ||
                          !relatedTarget.closest("button[data-cancel-rename]")
                        ) {
                          onSaveAttachmentRename();
                        }
                      }}
                      autoFocus
                      className="flex-1 px-2.5 py-1.5 border border-border/50 text-xs bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    />
                    <button
                      onClick={onSaveAttachmentRename}
                      className="px-2.5 py-1.5 gradient-primary text-primary-foreground text-xs rounded-lg hover:gradient-primary-hover transition-all duration-200 shadow-primary"
                    >
                      ✓
                    </button>
                    <button
                      data-cancel-rename
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent blur event
                      }}
                      onClick={onCancelRenameAttachment}
                      className="px-2.5 py-1.5 border border-border/50 text-foreground text-xs rounded-lg hover:bg-accent/50 hover:border-primary/40 transition-all duration-200 shadow-modern"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  // View mode with 3-dot menu
                  <div className="relative flex items-center">
                    <button
                      onClick={() => {
                        onSelectAttachment(attachment);
                        onResetPreview();
                      }}
                      className={`flex-1 flex items-center gap-2 text-left p-2.5 border rounded-lg text-xs pr-8 transition-all duration-200 ${selectedAttachment?.id === attachment.id
                          ? "gradient-primary text-primary-foreground border-primary shadow-primary"
                          : "bg-white/80 text-foreground border-border/50 hover:bg-accent/50 hover:border-primary/40 shadow-modern backdrop-blur-sm"
                        }`}
                      title={attachment.filename}
                    >
                      <AttachmentIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{attachment.filename}</span>
                    </button>
                    {isOwner && (
                      <div className="absolute right-1 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className={`w-6 h-6 rounded-full flex items-center justify-center backdrop-blur-none ${selectedAttachment?.id === attachment.id
                                  ? "text-white hover:bg-gray-700 bg-white/10"
                                  : "text-foreground hover:bg-accent/50 bg-white"
                                }`}
                              title="Options"
                              style={{
                                fontSize: "12px",
                                lineHeight: "1",
                                letterSpacing: "1px",
                              }}
                            >
                              •••
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-gradient-card border border-border/50 shadow-modern-lg min-w-[120px] p-1 rounded-lg backdrop-blur-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartRenameAttachment(attachment);
                              }}
                              className="text-xs cursor-pointer focus:bg-accent/50 hover:bg-accent/30 rounded-md transition-colors duration-200"
                            >
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAttachment(
                                  attachment.id,
                                  attachment.filename
                                );
                              }}
                              className="text-xs cursor-pointer focus:bg-destructive/10 hover:bg-destructive/10 text-destructive rounded-md transition-colors duration-200"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {codeFiles.length === 0 && attachments.length === 0 && !isOwner && (
        <div className="text-muted-foreground text-sm">No files</div>
      )}
    </div>
  );
}

