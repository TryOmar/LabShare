"use client";

import React, { useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useDragAndDrop } from "@/hooks/lab/useDragAndDrop";
import { usePasteHandler } from "@/hooks/lab/usePasteHandler";
import { useFileUpload } from "@/hooks/lab/useFileUpload";
import { useUploadForm } from "@/hooks/lab/useUploadForm";
import { detectLanguageFromContent } from "@/lib/lab/uploadUtils";
import { DETECTED_LANGUAGES } from "@/lib/lab/fileUtils";
import { isCodeFile } from "@/lib/lab/fileUtils";

interface UploadModalProps {
  labId: string;
  onClose: (shouldNavigateBack?: boolean) => void;
}

export function UploadModal({ labId, onClose }: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // File upload management
  const {
    files,
    pastedCodeFiles,
    error: fileError,
    addFiles,
    removeFile,
    removePastedCodeFile,
    addPastedCodeFile,
    setError: setFileError,
  } = useFileUpload();

  // Drag and drop
  const {
    isDragging,
    isDraggingOverPage,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useDragAndDrop();

  // Paste area state
  const [showPasteArea, setShowPasteArea] = React.useState(false);

  // Paste handler
  const pasteHandler = usePasteHandler({
    onFilesPasted: addFiles,
    showPasteArea,
    setShowPasteArea,
  });

  // Upload form
  const {
    title,
    isAnonymous,
    loading,
    error: formError,
    setTitle,
    setIsAnonymous,
    handleSubmit,
  } = useUploadForm({
    labId,
    files,
    pastedCodeFiles,
    onSuccess: () => onClose(),
    onError: (error) => setFileError(error),
  });

  const error = fileError || formError;

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  // Handle drop in drop zone
  const handleDropWithFiles = (e: React.DragEvent) => {
    handleDrop(e);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // Add pasted code as a file
  const handleAddPastedCode = () => {
    if (!pasteHandler.pastedContent.trim()) {
      setFileError("Please paste some code first");
      return;
    }
    
    const filename = pasteHandler.pastedFileName.trim() || `code.${pasteHandler.language}`;
    
    addPastedCodeFile({
      filename,
      language: pasteHandler.language,
      content: pasteHandler.pastedContent,
    });
    
    pasteHandler.setPastedContent("");
    pasteHandler.setPastedFileName("");
    setFileError("");
  };

  // Handle backdrop click - only close if clicking directly on backdrop, not modal content
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop (not on modal content)
    // Don't close if user has text selected (they might be selecting text in an input)
    const selection = window.getSelection();
    const hasSelection = selection && selection.toString().length > 0;
    
    if (e.target === e.currentTarget && !hasSelection) {
      onClose();
    }
  };

  return (
    <>
      {/* Global drag overlay - appears when dragging files anywhere on the page */}
      {isDraggingOverPage && (
        <div 
          className="fixed inset-0 bg-white/80 backdrop-blur-md z-[60] flex items-center justify-center pointer-events-none animate-fade-in"
        >
          <div className="bg-gradient-card border-4 border-primary border-dashed rounded-2xl p-12 max-w-2xl mx-4 shadow-modern-xl transform transition-all duration-300 scale-105 animate-scale-in backdrop-blur-sm">
            <div className="text-center">
              <svg 
                className="mx-auto h-16 w-16 text-primary mb-4 animate-bounce" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              <h3 className="text-lg sm:text-2xl font-bold text-foreground mb-2">Drop files to upload</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Release to add files to your submission</p>
            </div>
          </div>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto animate-fade-in"
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-gradient-card border border-border/50 p-4 sm:p-5 lg:p-7 max-w-lg w-full my-4 max-h-[90vh] overflow-y-auto rounded-2xl shadow-modern-xl backdrop-blur-sm animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Upload Solution
          </h2>

          <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="space-y-3 sm:space-y-4 w-full min-w-0">
            {/* Title */}
            <div>
              <label className="block text-sm sm:text-base text-foreground font-semibold mb-2.5">Solution Name</label>
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onSelect={(e) => e.stopPropagation()}
                onDragStart={(e) => e.stopPropagation()}
                className="w-full px-4 py-3 text-sm sm:text-base border border-border/50 bg-white/80 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-modern transition-all duration-300 backdrop-blur-sm hover:border-primary/30"
                required
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-2">
              <Switch
                id="submission-anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
                disabled={loading}
              />
              <Label htmlFor="submission-anonymous" className="text-sm text-foreground cursor-pointer">
                Submit anonymously
              </Label>
            </div>

            {/* Combined Upload & Paste Box */}
            <div>
              <label className="block text-sm sm:text-base text-foreground font-semibold mb-2.5">Files & Code</label>
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropWithFiles}
                className={`border-2 border-dashed rounded-xl p-4 sm:p-5 lg:p-7 transition-all duration-300 w-full min-w-0 ${
                  isDragging 
                    ? 'border-primary bg-primary/10 scale-105 shadow-primary-lg' 
                    : 'border-border/50 bg-white/80 hover:bg-accent/30 hover:border-primary/40 shadow-modern backdrop-blur-sm'
                }`}
              >
                <div className="text-center">
                  {isDragging ? (
                    <>
                      <svg 
                        className="mx-auto h-12 w-12 text-primary mb-3 animate-pulse" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                        />
                      </svg>
                      <p className="text-lg font-semibold text-foreground mb-1">
                        Drop files here
                      </p>
                      <p className="text-sm text-gray-600">
                        Release to upload
                      </p>
                    </>
                  ) : (
                    <>
                      <svg 
                        className="mx-auto h-10 w-10 text-gray-400 mb-3" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                        />
                      </svg>
                      <p className="text-sm text-foreground mb-2">
                        <span className="font-semibold">Drag files here</span> or{' '}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-primary hover:text-primary/80 underline font-medium transition-colors duration-200"
                        >
                          browse
                        </button>
                        {' '}or{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasteArea(true);
                            setTimeout(() => pasteHandler.pasteTextareaRef.current?.focus(), 10);
                          }}
                          className="text-primary hover:text-primary/80 underline font-medium transition-colors duration-200"
                        >
                          paste code
                        </button>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Press Ctrl+V to paste files or code
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="*/*"
                />

                {/* Paste Code Area - Only show when user clicks paste or presses Ctrl+V */}
                {showPasteArea && (
                  <div className="space-y-2 mt-4 border-t border-border/30 pt-4 w-full min-w-0">
                    <div className="flex justify-between items-center mb-2.5">
                      <label className="text-sm text-foreground font-semibold">Paste Code</label>
                      <button
                        type="button"
                        onClick={pasteHandler.handleCancelPaste}
                        className="text-xs text-muted-foreground hover:text-primary underline transition-colors duration-200 flex-shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                    <textarea
                      ref={pasteHandler.pasteTextareaRef}
                      value={pasteHandler.pastedContent}
                      onChange={(e) => {
                        const newContent = e.target.value;
                        pasteHandler.setPastedContent(newContent);
                        // Auto-detect language as user types/pastes
                        if (newContent.trim().length > 10) {
                          const detectedLang = detectLanguageFromContent(newContent);
                          pasteHandler.setLanguage(detectedLang);
                        }
                      }}
                      onPaste={pasteHandler.handleTextareaPaste}
                      placeholder="Paste code here (Ctrl+V)..."
                      rows={6}
                      className="w-full min-w-0 px-4 py-3 border border-border/50 bg-white/80 text-foreground font-mono text-xs sm:text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-modern transition-all duration-300 backdrop-blur-sm resize-y"
                    />
                    {pasteHandler.pastedContent && (
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <input
                          type="text"
                          value={pasteHandler.pastedFileName}
                          onChange={(e) => pasteHandler.setPastedFileName(e.target.value)}
                          placeholder="File name (optional)"
                          className="flex-1 min-w-0 px-3 py-2 border border-border/50 bg-white/80 text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                        />
                        <select
                          value={pasteHandler.language}
                          onChange={(e) => pasteHandler.setLanguage(e.target.value)}
                          className="w-full sm:w-auto sm:min-w-[120px] px-3 py-2 border border-border/50 bg-white/80 text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                        >
                          <option value="text">text</option>
                          {Object.entries(DETECTED_LANGUAGES)
                            .filter(([ext, lang]) => lang !== "text") // Remove duplicate "text"
                            .map(([ext, lang]) => (
                              <option key={ext} value={lang}>
                                {lang}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            handleAddPastedCode();
                            // Keep paste area open for next paste
                            pasteHandler.setPastedContent("");
                            pasteHandler.setPastedFileName("");
                            pasteHandler.pasteTextareaRef.current?.focus();
                          }}
                          className="w-full sm:w-auto sm:min-w-[80px] px-4 py-2 gradient-primary text-primary-foreground font-semibold hover:gradient-primary-hover rounded-lg transition-all duration-300 shadow-primary hover:shadow-primary-lg text-sm whitespace-nowrap"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* File List */}
            {(files.length > 0 || pastedCodeFiles.length > 0) && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pastedCodeFiles.map((file, index) => (
                  <div
                    key={`pasted-${index}`}
                    className="flex items-center justify-between p-2.5 border border-border/50 bg-white/80 rounded-lg backdrop-blur-sm"
                  >
                    <span className="text-xs text-foreground truncate flex-1">📄 {file.filename}</span>
                    <button
                      type="button"
                      onClick={() => removePastedCodeFile(index)}
                      className="ml-2 text-muted-foreground hover:text-destructive text-sm transition-colors duration-200"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {files.map((file, index) => {
                  const isCode = isCodeFile(file.name);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 border border-border/50 bg-white/80 rounded-lg backdrop-blur-sm"
                    >
                      <span className="text-xs text-foreground truncate flex-1">
                        {isCode ? '📄' : '📎'} {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="ml-2 text-muted-foreground hover:text-destructive text-sm transition-colors duration-200"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="animate-slide-up">
                <p className="text-destructive text-sm font-medium">{error}</p>
                {error.toLowerCase().includes('mime type') && error.toLowerCase().includes('not supported') && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Think this should be fixed? <a href="https://github.com/TryOmar/LabShare/issues/new" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">Open an issue</a> or <a href="https://forms.gle/25mEvcjTPrhA6THf9" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline transition-colors duration-200">report it</a>.
                  </p>
                )}
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3">
              <button
                type="submit"
                disabled={loading || (files.length === 0 && pastedCodeFiles.length === 0)}
                className="flex-1 gradient-primary text-primary-foreground font-semibold py-3 sm:py-3.5 text-sm sm:text-base rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-primary hover:shadow-primary-lg"
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
              <button
                type="button"
                onClick={() => onClose(true)}
                className="flex-1 border border-border/50 text-foreground font-semibold py-3 sm:py-3.5 text-sm sm:text-base rounded-lg hover:bg-accent/50 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

