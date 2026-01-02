"use client";

import React from "react";
import Link from "next/link";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { languageColors, mapLanguageToPrism } from "@/lib/submission/utils";
import { formatDateTime } from "@/lib/utils";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Submission, CodeFile, Attachment } from "@/lib/submission/types";
import type { AccessStatus } from "@/lib/submission/api";

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
 * Attachment icon SVG component
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

/**
 * Lock icon SVG component
 */
function LockIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
        </svg>
    );
}

interface BlurredSubmissionViewProps {
    submission: Submission;
    codeFiles: CodeFile[];
    attachments: Attachment[];
    accessStatus: AccessStatus;
}

/**
 * Displays a blurred/locked submission view for users without access.
 * Mirrors the structure of the unlocked view but with blurred code content.
 */
export function BlurredSubmissionView({
    submission,
    codeFiles,
    attachments,
    accessStatus,
}: BlurredSubmissionViewProps) {
    const [selectedFile, setSelectedFile] = React.useState<CodeFile | null>(
        codeFiles[0] || null
    );

    const lab = submission.labs;
    const course = lab?.courses;

    // Build the CTA link
    const ctaLink = accessStatus.requiresLogin
        ? `/login?redirect=${encodeURIComponent(`/lab/${accessStatus.labId}?upload=true`)}`
        : `/lab/${accessStatus.labId}?upload=true`;

    const ctaText = accessStatus.requiresLogin
        ? "Login & Submit to Unlock"
        : "Submit Your Solution to Unlock";

    return (
        <div className="space-y-6">
            {/* Breadcrumb Navigation */}
            {course && lab && (
                <div className="animate-slide-up">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link
                                        href={`/labs?course=${course.id}`}
                                        className="hover:text-primary transition-colors duration-200"
                                    >
                                        {course.name}
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link
                                        href={`/lab/${lab.id}`}
                                        className="hover:text-primary transition-colors duration-200"
                                    >
                                        Lab {lab.lab_number}: {lab.title}
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>{submission.title}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            )}

            {/* Header - Same structure as SubmissionHeader */}
            <div className="mb-6 sm:mb-8 animate-slide-up">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground break-words bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            {submission.title}
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground mt-1 break-words">
                            by {submission.is_anonymous ? "Anonymous" : (submission.students?.name || "Unknown")}
                        </p>
                    </div>
                    <Link
                        href={`/lab/${lab?.id || ""}`}
                        className="px-4 sm:px-5 py-2.5 text-sm sm:text-base border border-border/50 text-foreground font-semibold rounded-lg hover:bg-accent/50 hover:border-primary/40 hover:text-primary whitespace-nowrap flex-shrink-0 transition-all duration-300 shadow-modern hover:shadow-primary/10 backdrop-blur-sm"
                    >
                        Back
                    </Link>
                </div>

                {/* Metadata - Similar to SubmissionHeader but without interactive elements */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4 flex-wrap items-start sm:items-center">
                    <span className="whitespace-nowrap">{submission.view_count} views</span>
                    <span className="break-words">
                        Created: {submission.created_at && formatDateTime(submission.created_at)}
                    </span>
                    {/* Upvote count - read only */}
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
                        <span className="font-medium">{submission.upvote_count || 0} upvotes</span>
                    </span>
                    <span className="break-words">
                        Last edited: {submission.updated_at && formatDateTime(submission.updated_at)}
                    </span>
                    {/* Anonymous indicator - just shown, not toggle */}
                    {submission.is_anonymous && (
                        <span className="px-2 py-1 rounded-lg bg-muted/50 text-muted-foreground text-xs">
                            Anonymous
                        </span>
                    )}
                </div>
            </div>


            {/* Main Content - Same grid structure as unlocked view */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* File Sidebar - Similar to FileSidebar but without edit actions */}
                <div className="lg:col-span-1">
                    <div className="w-full lg:w-auto">
                        {/* Code Files List */}
                        {codeFiles.length > 0 && (
                            <div className="mb-6">
                                <h3 className="font-bold text-foreground mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                    Code Files
                                </h3>
                                <div className="space-y-2">
                                    {codeFiles.map((file) => (
                                        <button
                                            key={file.id}
                                            onClick={() => setSelectedFile(file)}
                                            className={`w-full flex items-center gap-2 text-left p-2.5 border rounded-lg text-xs truncate transition-all duration-200 ${selectedFile?.id === file.id
                                                ? "gradient-primary text-primary-foreground border-primary shadow-primary"
                                                : "bg-white/80 text-foreground border-border/50 hover:bg-accent/50 hover:border-primary/40 shadow-modern backdrop-blur-sm"
                                                }`}
                                            title={file.filename}
                                        >
                                            <FileIcon className="h-4 w-4 flex-shrink-0" />
                                            <span className="truncate">{file.filename}</span>
                                        </button>
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
                                        <div
                                            key={attachment.id}
                                            className="w-full flex items-center gap-2 p-2.5 border rounded-lg text-xs bg-white/80 text-muted-foreground border-border/50 shadow-modern backdrop-blur-sm"
                                            title={attachment.filename}
                                        >
                                            <AttachmentIcon className="h-4 w-4 flex-shrink-0" />
                                            <span className="truncate">{attachment.filename}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {codeFiles.length === 0 && attachments.length === 0 && (
                            <div className="text-muted-foreground text-sm">No files</div>
                        )}
                    </div>
                </div>

                {/* Code Viewer with Blur - Similar structure to CodeViewer */}
                <div className="lg:col-span-3">
                    <div className="relative border border-border/50 rounded-xl overflow-hidden shadow-modern backdrop-blur-sm bg-gradient-card w-full min-w-0">
                        {selectedFile ? (
                            <>
                                {/* File Header - Same as CodeViewer */}
                                <div className="bg-muted/50 border-b border-border/30 p-3 sm:p-4 flex justify-between items-center rounded-t-xl">
                                    <div className="flex-1 pr-4 min-w-0">
                                        <p className="font-semibold text-foreground">{selectedFile.filename}</p>
                                        <span
                                            className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded ${languageColors[selectedFile.language] || languageColors.text
                                                }`}
                                        >
                                            {selectedFile.language.toUpperCase()}
                                        </span>
                                    </div>
                                    {/* Hidden copy button - not functional for locked view */}
                                    <div className="flex flex-wrap gap-2 flex-shrink-0 opacity-50">
                                        <span className="px-3 py-1.5 text-xs border border-border/50 bg-white/80 text-muted-foreground rounded-lg shadow-modern cursor-not-allowed">
                                            Copy
                                        </span>
                                    </div>
                                </div>

                                {/* Code Content with Syntax Highlighting + Blur Overlay */}
                                <div className="relative">
                                    {/* Actual code with syntax highlighting */}
                                    <div className="w-full overflow-x-auto bg-gray-50">
                                        <pre className="p-0 m-0 text-xs sm:text-sm leading-relaxed min-w-full">
                                            <SyntaxHighlighter
                                                language={mapLanguageToPrism(selectedFile.language)}
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
                                                {selectedFile.content}
                                            </SyntaxHighlighter>
                                        </pre>
                                    </div>

                                    <div className="absolute inset-0 bg-white/20 backdrop-blur-[1.5px] z-10 flex items-start justify-center pt-8">
                                        <div className="text-center p-6 bg-white rounded-2xl shadow-xl border border-border/50 max-w-sm mx-4">
                                            <div className="mb-4">
                                                <LockIcon className="h-12 w-12 mx-auto text-amber-500" />
                                            </div>
                                            <p className="text-muted-foreground mb-4 text-sm">
                                                Submit your solution to unlock this code
                                            </p>
                                            <Link
                                                href={ctaLink}
                                                className="inline-block px-6 py-2.5 gradient-primary text-primary-foreground font-semibold rounded-lg hover:gradient-primary-hover transition-all duration-300 shadow-primary"
                                            >
                                                {ctaText}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="p-6 text-center text-muted-foreground">
                                No file selected
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
