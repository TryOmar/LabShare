import { redirect } from "next/navigation";
import DashboardPageClient from "./clientPage";
import { requireAuth } from "@/lib/auth";
import { getDashboardAction } from "@/app/api/dashboard/action";
import { getLabsAction } from "@/app/api/labs/action";
import { unstable_cache } from "next/cache";

export default async function DashboardPage() {
  const authResult = await requireAuth();
  if ("error" in authResult) {
    redirect("/login");
  }
  const studentId = authResult.studentId;

  try {
    // Fetch data in parallel using the cached functions
    const [dashboardData, labsData] = await Promise.all([
      getCachedDashboard(studentId),
      getCachedLabs(studentId),
    ]);

    // Handle errors from actions
    if ("error" in dashboardData) {
      if (dashboardData.status === 401) {
        redirect("/login");
      }
      throw new Error(
        typeof dashboardData.error === "string"
          ? dashboardData.error
          : "Failed to load dashboard"
      );
    }

    // labsData error handling (non-critical, fallback to empty)
    const safeLabsData =
      "error" in labsData ? { labsByCourse: {} } : labsData;

    return (
      <DashboardPageClient
        student={dashboardData.student}
        track={dashboardData.track}
        courses={dashboardData.courses || []}
        coursesWithSubmissions={dashboardData.coursesWithSubmissions || []}
        recentSubmissions={dashboardData.recentSubmissions || []}
        suggestedLabs={dashboardData.suggestedLabs || []}
        labsByCourse={safeLabsData.labsByCourse || {}}
      />
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    redirect("/login");
  }
}

// Helper to cache dashboard data with studentId as key
const getCachedDashboard = async (studentId: string) => {
  return unstable_cache(
    async () => getDashboardAction(),
    ["dashboard", studentId],
    {
      tags: [`dashboard-${studentId}`],
      revalidate: 100,
    }
  )();
};

// Helper to cache labs data with studentId as key
const getCachedLabs = async (studentId: string) => {
  // this isn't needed but you know I am to lazy 
  return unstable_cache(
    async () => getLabsAction(),
    ["labs", studentId],
    {
      tags: [`labs-${studentId}`],
      revalidate: 100,
    }
  )();
};
