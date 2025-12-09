"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";

/**
 * Submission preview data structure
 */
interface SubmissionPreview {
    id: string;
    title: string;
    studentName: string;
    isAnonymous: boolean;
    createdAt: string;
    upvoteCount: number;
    viewCount: number;
}

/**
 * Lab data structure
 */
interface Lab {
    id: string;
    course_id: string;
    lab_number: number;
    title: string;
    description: string;
    hasSubmission?: boolean;
    submissionCount?: number;
    latestSubmissionDate?: string | null;
    topUpvotes?: number;
    totalViews?: number;
}

/**
 * Props for LabAccordionItem
 */
interface LabAccordionItemProps {
    lab: Lab;
    index: number;
    isExpanded: boolean;
}

/**
 * LabAccordionItem displays a single lab in accordion format.
 * When expanded, it shows submission previews.
 * Users can only access full submission content after submitting their own work.
 */
export function LabAccordionItem({ lab, index, isExpanded }: LabAccordionItemProps) {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<SubmissionPreview[]>([]);
    const [hasSubmitted, setHasSubmitted] = useState(lab.hasSubmission || false);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Fetch submissions when accordion is expanded
    useEffect(() => {
        if (isExpanded && !hasLoaded) {
            fetchSubmissions();
        }
    }, [isExpanded, hasLoaded]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/labs/submissions?labId=${lab.id}`, {
                method: "GET",
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                setSubmissions(data.submissions || []);
                setHasSubmitted(data.hasSubmitted);
                setHasLoaded(true);
            }
        } catch (error) {
            console.error("Error fetching submissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmissionClick = (submissionId: string) => {
        if (hasSubmitted) {
            // User has submitted - allow access to full submission
            router.push(`/submission/${submissionId}`);
        } else {
            // User hasn't submitted - redirect to locked page
            router.push(`/lab/${lab.id}/locked`);
        }
    };

    const handleUploadClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasSubmitted) {
            // User already submitted - go to lab page to edit
            router.push(`/lab/${lab.id}`);
        } else {
            // User hasn't submitted - go to locked page first
            router.push(`/lab/${lab.id}/locked`);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffWeeks = Math.floor(diffDays / 7);

        if (diffMins < 1) return "now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffWeeks < 4) return `${diffWeeks}w ago`;
        return formatDate(dateString);
    };

    const isLocked = !hasSubmitted;

    return (
        <AccordionItem
            value={lab.id}
            className="border border-border/50 rounded-xl mb-2 sm:mb-3 overflow-hidden bg-gradient-card shadow-modern backdrop-blur-sm animate-fade-in"
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            <AccordionTrigger
                className={`px-3 sm:px-4 py-3 sm:py-4 hover:no-underline hover:bg-accent/20 transition-all duration-300 ${isLocked ? "opacity-80" : ""
                    }`}
            >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    {/* Left section: Lock icon + Title */}
                    <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        {/* Lock/Unlock Icon */}
                        {isLocked ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0 mt-0.5 sm:mt-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0 mt-0.5 sm:mt-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                />
                            </svg>
                        )}

                        {/* Lab Title */}
                        <div className="flex-1 min-w-0 text-left">
                            <h3 className={`font-semibold text-sm sm:text-base break-words ${isLocked ? "text-muted-foreground" : "text-foreground"
                                }`}>
                                Lab {lab.lab_number}: {lab.title}
                            </h3>
                            {lab.description && (
                                <p className={`text-xs sm:text-sm mt-0.5 break-words line-clamp-1 ${isLocked ? "text-muted-foreground/60" : "text-muted-foreground"
                                    }`}>
                                    {lab.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right section: Metadata badges */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-6 sm:ml-0">
                        {/* Submission Count Badge */}
                        <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded-md sm:rounded-lg flex items-center gap-1 bg-accent/50 text-muted-foreground border-border/50">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <span className="font-medium">{lab.submissionCount || 0}</span>
                        </span>

                        {/* Total Views Badge (only show if > 0) */}
                        {(lab.totalViews || 0) > 0 && (
                            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded-md sm:rounded-lg flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200/50">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                                <span className="font-medium">{lab.totalViews}</span>
                            </span>
                        )}

                        {/* Latest Activity Badge (show relative time) */}
                        {lab.latestSubmissionDate && (
                            <span className="hidden sm:flex text-xs px-2 py-1 border rounded-lg items-center gap-1 bg-green-50 text-green-700 border-green-200/50">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                                <span className="font-medium">{formatRelativeTime(lab.latestSubmissionDate)}</span>
                            </span>
                        )}

                        {/* Lab Number Badge */}
                        <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 border rounded-md sm:rounded-lg flex-shrink-0 whitespace-nowrap hidden sm:inline ${isLocked
                            ? "bg-muted/50 text-muted-foreground border-border/50"
                            : "bg-primary/10 text-primary border-primary/30 font-medium"
                            }`}>
                            Lab {lab.lab_number}
                        </span>
                    </div>
                </div>
            </AccordionTrigger>

            <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                {/* Upload/Edit Button */}
                <div className="mb-3 sm:mb-4">
                    <button
                        onClick={handleUploadClick}
                        className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-300 ${hasSubmitted
                            ? "border border-primary/30 text-primary bg-primary/10 hover:bg-primary/20"
                            : "gradient-primary text-primary-foreground hover:gradient-primary-hover shadow-primary"
                            }`}
                    >
                        {hasSubmitted ? "View / Edit My Submission" : "Submit Your Solution"}
                    </button>
                </div>

                {/* Submissions List */}
                <div className="border-t border-border/30 pt-3 sm:pt-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        Student Submissions
                        {!loading && <span className="text-xs font-normal">({submissions.length})</span>}
                    </h4>

                    {loading ? (
                        <div className="flex items-center gap-2 py-4 justify-center">
                            <div className="spinner h-4 w-4"></div>
                            <span className="text-xs sm:text-sm text-muted-foreground">Loading submissions...</span>
                        </div>
                    ) : submissions.length > 0 ? (
                        <div className="space-y-2">
                            {submissions.map((submission, subIndex) => (
                                <div
                                    key={submission.id}
                                    onClick={() => handleSubmissionClick(submission.id)}
                                    className={`p-2.5 sm:p-3 rounded-lg border transition-all duration-200 cursor-pointer ${isLocked
                                        ? "border-border/30 bg-muted/10 hover:bg-muted/20"
                                        : "border-border/50 bg-white/50 hover:bg-accent/30 hover:border-primary/40"
                                        }`}
                                    style={{ animationDelay: `${subIndex * 0.03}s` }}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs sm:text-sm font-medium break-words ${isLocked ? "text-muted-foreground" : "text-foreground"
                                                }`}>
                                                {submission.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground/80 mt-0.5 flex items-center gap-1">
                                                <span>by {submission.studentName}</span>
                                                {isLocked && (
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-3 w-3 text-muted-foreground/60"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                        />
                                                    </svg>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className="text-xs text-muted-foreground/70 hidden sm:inline">
                                                {formatDate(submission.createdAt)}
                                            </span>
                                            <span className="text-xs bg-accent/50 px-1.5 py-0.5 border border-border/30 rounded flex items-center gap-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3 text-muted-foreground"
                                                    viewBox="0 0 20 20"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.834a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                                </svg>
                                                {submission.upvoteCount}
                                            </span>
                                            <span className="text-xs bg-accent/50 px-1.5 py-0.5 border border-border/30 rounded flex items-center gap-0.5">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-3 w-3 text-muted-foreground"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={2}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    />
                                                </svg>
                                                {submission.viewCount}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Locked notice */}
                            {isLocked && submissions.length > 0 && (
                                <div className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-amber-50 border border-amber-200/50 text-amber-700">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4 flex-shrink-0"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span className="text-xs">
                                        Submit your solution to view full submission content
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground/70 py-2">
                            No submissions yet. Be the first to submit!
                        </p>
                    )}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
}
