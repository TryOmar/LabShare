"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManageStudentsSection } from "@/components/admin/ManageStudentsSection";
import { ManageCoursesSection } from "@/components/admin/ManageCoursesSection";
import { RecentActivitySection } from "@/components/admin/RecentActivitySection";

interface Student {
    id: string;
    name: string;
    email: string;
    track_id: string;
}

interface Track {
    id: string;
    code: string;
    name: string;
}

/**
 * Admin Dashboard page with tabs for different admin actions.
 * Only accessible to users with admin privileges.
 */
export default function AdminDashboardPage() {
    const router = useRouter();
    const [student, setStudent] = useState<Student | null>(null);
    const [track, setTrack] = useState<Track | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("recent-activity"); /** Default to Recent Activity */

    useEffect(() => {
        const checkAccess = async () => {
            try {
                // Check authentication
                const authResponse = await fetch("/api/auth/status", {
                    method: "GET",
                    credentials: "include",
                });

                if (!authResponse.ok) {
                    router.push("/login");
                    return;
                }

                const authData = await authResponse.json();
                if (!authData.authenticated) {
                    router.push("/login");
                    return;
                }

                // Check admin status
                const adminResponse = await fetch("/api/admin/status", {
                    method: "GET",
                    credentials: "include",
                });

                if (!adminResponse.ok) {
                    router.push("/dashboard");
                    return;
                }

                const adminData = await adminResponse.json();
                if (!adminData.isAdmin) {
                    router.push("/dashboard");
                    return;
                }

                setIsAdmin(true);

                // Load dashboard data for navigation
                const dashboardResponse = await fetch("/api/dashboard", {
                    method: "GET",
                    credentials: "include",
                });

                if (dashboardResponse.ok) {
                    const dashboardData = await dashboardResponse.json();
                    setStudent(dashboardData.student);
                    setTrack(dashboardData.track);
                }
            } catch (err) {
                console.error("Error checking access:", err);
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAccess();
    }, [router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-white to-accent/20 animate-fade-in">
                <div className="flex items-center gap-3">
                    <div className="spinner h-5 w-5"></div>
                    <p className="text-foreground font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (isAdmin === false) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-white to-accent/10 animate-fade-in">
            <Navigation student={student} track={track} />

            <div className="flex-1 p-4 sm:p-6 w-full max-w-6xl mx-auto">
                <div className="mb-6 sm:mb-8 px-2 sm:px-4 animate-slide-up">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        Admin Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Monitor activity and manage the platform.
                    </p>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full animate-slide-up"
                >
                    <TabsList className="grid w-full grid-cols-3 lg:max-w-2xl mx-auto mb-6 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger
                            value="recent-activity"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-modern text-sm sm:text-base rounded-lg transition-all"
                        >
                            Recent Activity
                        </TabsTrigger>
                        <TabsTrigger
                            value="manage-students"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-modern text-sm sm:text-base rounded-lg transition-all"
                        >
                            Manage Students
                        </TabsTrigger>
                        <TabsTrigger
                            value="manage-courses"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-modern text-sm sm:text-base rounded-lg transition-all"
                        >
                            Manage Courses
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="recent-activity" className="mt-0">
                        <RecentActivitySection />
                    </TabsContent>

                    <TabsContent value="manage-students" className="mt-0">
                        <ManageStudentsSection />
                    </TabsContent>

                    <TabsContent value="manage-courses" className="mt-0">
                        <ManageCoursesSection />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
