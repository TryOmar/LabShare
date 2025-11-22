"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { detectLanguage } from "@/lib/language-detection";
import { detectedLanguages, codeExtensions } from "@/lib/submission/utils";
import { uploadFiles } from "@/lib/submission/api";

interface AddFilesModalProps {
  submissionId: string;
  onClose: () => void;
}

export function AddFilesModal({ submissionId, onClose }: AddFilesModalProps) {
  const [pastedContent, setPastedContent] = useState("");
  const [pastedFileName, setPastedFileName] = useState("");
  const [language, setLanguage] = useState("text");
  const [files, setFiles] = useState<File[]>([]);
  const [pastedCodeFiles, setPastedCodeFiles] = useState<
    Array<{ filename: string; language: string; content: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const addFiles = (newFiles: File[]) => {
    setFiles((prev) => {
      const existingNames = new Set(prev.map((f) => f.name));
      const uniqueNewFiles = newFiles.filter((f) => !existingNames.has(f.name));
      return [...prev, ...uniqueNewFiles];
    });
    setError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // Handle paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === "TEXTAREA" || target.tagName === "INPUT")
      ) {
        return;
      }

      const filesToAdd: File[] = [];
      let hasText = false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            filesToAdd.push(file);
          }
        } else if (item.kind === "string" && item.type === "text/plain") {
          hasText = true;
        }
      }

      if (filesToAdd.length > 0) {
        e.preventDefault();
        addFiles(filesToAdd);
      } else if (hasText) {
        e.preventDefault();
        const textContent = e.clipboardData?.getData("text/plain") || "";
        if (!showPasteArea) {
          setShowPasteArea(true);
        }
        setTimeout(() => {
          if (textContent) {
            setPastedContent(textContent);
            const detectedLang = detectLanguage(textContent);
            setLanguage(detectedLang);
            pasteTextareaRef.current?.focus();
            if (pasteTextareaRef.current) {
              const textarea = pasteTextareaRef.current;
              textarea.setSelectionRange(
                textarea.value.length,
                textarea.value.length
              );
            }
          }
        }, 10);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [showPasteArea]);

  const handleAddPastedCode = () => {
    if (!pastedContent.trim()) {
      setError("Please paste some code first");
      return;
    }

    const filename = pastedFileName.trim() || `code.${language}`;
    setPastedCodeFiles((prev) => [
      ...prev,
      {
        filename,
        language,
        content: pastedContent,
      },
    ]);

    setPastedContent("");
    setPastedFileName("");
    setError("");
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removePastedCodeFile = (index: number) => {
    setPastedCodeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let filesToUpload: Array<
        | { filename: string; language: string; content: string }
        | { filename: string; mimeType: string; base64: string }
      > = [];

      filesToUpload.push(...pastedCodeFiles);

      if (files.length > 0) {
        for (const file of files) {
          const ext = "." + file.name.split(".").pop()?.toLowerCase();

          if (codeExtensions.includes(ext)) {
            const content = await file.text();
            const detectedLang = detectedLanguages[ext] || "text";
            filesToUpload.push({
              filename: file.name,
              language: detectedLang,
              content,
            });
          } else {
            const base64 = await fileToBase64(file);
            filesToUpload.push({
              filename: file.name,
              mimeType: file.type || "application/octet-stream",
              base64: base64,
            });
          }
        }
      }

      if (filesToUpload.length === 0) {
        setError("Please add at least one file");
        setLoading(false);
        return;
      }

      await uploadFiles(submissionId, filesToUpload);

      toast.success("Files added successfully!");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add files");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-gradient-card border border-border/50 p-5 sm:p-7 max-w-lg w-full max-h-[90vh] overflow-y-auto my-4 rounded-2xl shadow-modern-xl backdrop-blur-sm animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-5 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Add Files
        </h2>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-foreground font-semibold mb-2">
              Files & Code
            </label>
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-5 transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/10 scale-105 shadow-primary-lg"
                  : "border-border/50 bg-white/80 hover:bg-accent/30 hover:border-primary/40 shadow-modern backdrop-blur-sm"
              }`}
            >
              <div className="text-center">
                <p className="text-sm text-foreground mb-1">
                  Drag files here or{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                  >
                    browse
                  </button>{" "}
                  or{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasteArea(true);
                      setTimeout(() => pasteTextareaRef.current?.focus(), 10);
                    }}
                    className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                  >
                    paste code
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Press Ctrl+V to paste files or code
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="*/*"
              />

              {showPasteArea && (
                <div className="space-y-2 mt-4 border-t border-border/30 pt-4">
                  <div className="flex justify-between items-center mb-2.5">
                    <label className="text-sm text-foreground font-semibold">
                      Paste Code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasteArea(false);
                        setPastedContent("");
                        setPastedFileName("");
                      }}
                      className="text-xs text-muted-foreground hover:text-primary underline transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    ref={pasteTextareaRef}
                    value={pastedContent}
                    onChange={(e) => {
                      const newContent = e.target.value;
                      setPastedContent(newContent);
                      if (newContent.trim().length > 10) {
                        const detectedLang = detectLanguage(newContent);
                        setLanguage(detectedLang);
                      }
                    }}
                    placeholder="Paste code here (Ctrl+V)..."
                    rows={4}
                    className="w-full px-4 py-3 border border-border/50 bg-white/80 text-foreground font-mono text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 shadow-modern"
                  />
                  {pastedContent && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={pastedFileName}
                        onChange={(e) => setPastedFileName(e.target.value)}
                        placeholder="File name (optional)"
                        className="flex-1 px-3 py-2 border border-border/50 bg-white/80 text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                      />
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="px-3 py-2 border border-border/50 bg-white/80 text-foreground text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                      >
                        <option value="text">text</option>
                        {Object.entries(detectedLanguages)
                          .filter(([ext, lang]) => lang !== "text")
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
                          setPastedContent("");
                          setPastedFileName("");
                          pasteTextareaRef.current?.focus();
                        }}
                        className="px-4 py-2 gradient-primary text-primary-foreground font-semibold hover:gradient-primary-hover rounded-lg transition-all duration-300 shadow-primary hover:shadow-primary-lg text-sm"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {(files.length > 0 || pastedCodeFiles.length > 0) && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pastedCodeFiles.map((file, index) => (
                <div
                  key={`pasted-${index}`}
                  className="flex items-center justify-between p-2.5 border border-border/50 bg-white/80 rounded-lg backdrop-blur-sm"
                >
                  <span className="text-xs text-foreground truncate flex-1">
                    📄 {file.filename}
                  </span>
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
                const ext = "." + file.name.split(".").pop()?.toLowerCase();
                const isCodeFile = codeExtensions.includes(ext);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 border border-border/50 bg-white/80 rounded-lg backdrop-blur-sm"
                  >
                    <span className="text-xs text-foreground truncate flex-1">
                      {isCodeFile ? "📄" : "📎"} {file.name}
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
              {error.toLowerCase().includes("mime type") &&
                error.toLowerCase().includes("not supported") && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Think this should be fixed?{" "}
                    <a
                      href="https://github.com/TryOmar/LabShare/issues/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                    >
                      Open an issue
                    </a>{" "}
                    or{" "}
                    <a
                      href="https://forms.gle/25mEvcjTPrhA6THf9"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline transition-colors duration-200"
                    >
                      report it
                    </a>
                    .
                  </p>
                )}
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="submit"
              disabled={
                loading || (files.length === 0 && pastedCodeFiles.length === 0)
              }
              className="flex-1 gradient-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:gradient-primary-hover hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-primary hover:shadow-primary-lg"
            >
              {loading ? "Adding..." : "Add Files"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-border/50 text-foreground font-semibold py-2.5 rounded-lg hover:bg-accent/50 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
