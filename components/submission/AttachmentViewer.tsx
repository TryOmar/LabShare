"use client";

import React from "react";
import { formatDateTime } from "@/lib/utils";
import { formatFileSize, isImageAttachment } from "@/lib/submission/utils";
import type { Attachment } from "@/lib/submission/types";

interface AttachmentViewerProps {
  attachment: Attachment;
  showImagePreview: boolean;
  onTogglePreview: () => void;
}

export function AttachmentViewer({
  attachment,
  showImagePreview,
  onTogglePreview,
}: AttachmentViewerProps) {
  const isImage = isImageAttachment(attachment);

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden shadow-modern backdrop-blur-sm bg-gradient-card w-full min-w-0">
      {/* Attachment Header */}
      <div className="bg-muted/50 border-b border-border/30 p-3 sm:p-4 flex justify-between items-center rounded-t-xl">
        <div>
          <p className="font-semibold text-foreground">{attachment.filename}</p>
          <div className="mt-2 flex gap-2 items-center">
            <span className="text-xs text-muted-foreground">
              {attachment.mime_type}
            </span>
            <span className="text-xs text-muted-foreground/80">
              • {formatFileSize(attachment.file_size)}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {attachment.downloadUrl ? (
            <a
              href={attachment.downloadUrl}
              download={attachment.filename}
              className="px-4 py-2 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary rounded-lg font-semibold transition-all duration-200 shadow-modern"
            >
              Download
            </a>
          ) : (
            <button
              disabled
              className="px-4 py-2 text-xs border border-border/30 bg-muted/50 text-muted-foreground font-semibold cursor-not-allowed rounded-lg"
            >
              Download Unavailable
            </button>
          )}
          {attachment.downloadUrl && isImage && (
            <button
              onClick={onTogglePreview}
              className="px-4 py-2 text-xs border border-border/50 bg-white/80 text-foreground hover:bg-accent/50 hover:border-primary/40 hover:text-primary rounded-lg font-semibold transition-all duration-200 shadow-modern"
            >
              {showImagePreview ? "Info" : "Preview"}
            </button>
          )}
        </div>
      </div>

      {/* Attachment Preview or Info */}
      {showImagePreview && attachment.downloadUrl && isImage ? (
        <div className="w-full bg-gray-100 flex items-start justify-center p-6 min-h-[400px] max-h-[80vh] overflow-auto">
          <img
            src={attachment.downloadUrl}
            alt={attachment.filename}
            className="max-w-full h-auto object-contain rounded-lg shadow-modern"
            onError={() => {
              console.error("Failed to load image");
              onTogglePreview();
            }}
          />
        </div>
      ) : (
        <div className="p-6 bg-muted/30">
          <p className="text-muted-foreground text-sm">
            This file is stored in storage. Click the download button to retrieve
            it.
          </p>
          <p className="text-xs text-muted-foreground/80 mt-2">
            Uploaded: {formatDateTime(attachment.created_at)}
          </p>
        </div>
      )}
    </div>
  );
}

