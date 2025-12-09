"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
    id: string;
    type: "submission" | "comment" | "student_joined" | "upvote" | "session" | "lab_unlock";
    date: string;
    actor: string;
    action: string;
    target: string;
    meta?: string;
}

type FilterType = "all" | "submission" | "comment" | "upvote" | "session" | "lab_unlock" | "student_joined";

export function RecentActivitySection() {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const response = await fetch("/api/admin/activity", {
                    method: "GET",
                    credentials: "include",
                });
                if (response.ok) {
                    const data = await response.json();
                    setActivities(data.activity || []);
                }
            } catch (error) {
                console.error("Error loading activity:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
    }, []);

    const filteredActivities = activities.filter(
        (item) => filter === "all" || item.type === filter
    );

    const getActivityIcon = (type: string) => {
        switch (type) {
            case "submission":
                return (
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                );
            case "comment":
                return (
                    <div className="p-2 rounded-full bg-green-50 text-green-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                );
            case "student_joined":
                return (
                    <div className="p-2 rounded-full bg-purple-50 text-purple-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                    </div>
                );
            case "upvote":
                return (
                    <div className="p-2 rounded-full bg-pink-50 text-pink-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                    </div>
                );
            case "session":
                return (
                    <div className="p-2 rounded-full bg-orange-50 text-orange-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                    </div>
                );
            case "lab_unlock":
                return (
                    <div className="p-2 rounded-full bg-teal-50 text-teal-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="p-2 rounded-full bg-gray-50 text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                );
        }
    };

    const filters: { id: FilterType; label: string }[] = [
        { id: "all", label: "All Activity" },
        { id: "submission", label: "Submissions" },
        { id: "comment", label: "Comments" },
        { id: "upvote", label: "Upvotes" },
        { id: "session", label: "Sessions" },
        { id: "lab_unlock", label: "Unlocks" },
        { id: "student_joined", label: "New Students" },
    ];

    return (
        <div className="space-y-4">
            <div className="border border-border/50 p-4 sm:p-6 rounded-xl shadow-modern backdrop-blur-sm bg-gradient-card">
                <div className="mb-6">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                        Recent Activity
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Monitoring submissions, comments, new students, logins, and engagement.
                    </p>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {filters.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all duration-200 border ${filter === f.id
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-white/50 text-foreground border-border/50 hover:bg-white hover:border-primary/30"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="spinner h-5 w-5"></div>
                        <span className="ml-2 text-muted-foreground">Loading activity...</span>
                    </div>
                ) : filteredActivities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        {filter === "all" ? "No recent activity found." : "No activity found for this filter."}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredActivities.map((item) => (
                            <div
                                key={`${item.type}-${item.id}`}
                                className="flex items-start gap-4 p-4 rounded-lg bg-white/50 border border-border/40 hover:bg-white/80 transition-all duration-200 animate-slide-up"
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {getActivityIcon(item.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                                        <p className="text-sm font-medium text-foreground">
                                            <span className="font-semibold text-primary/90">{item.actor}</span>{" "}
                                            <span className="text-muted-foreground">{item.action}</span>{" "}
                                            <span className="font-medium">{item.target}</span>
                                        </p>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                                        </span>
                                    </div>
                                    {item.meta && (
                                        <p className="text-sm text-muted-foreground/80 mt-1 line-clamp-1 italic">
                                            "{item.meta}"
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
