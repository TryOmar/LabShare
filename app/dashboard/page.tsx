import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardPageClient from "./clientPage";
import { requireAuth } from "@/lib/auth";

export default async function DashboardPage() {
  // Get the base URL from headers for API calls
  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") || "http";
  const baseUrl = `${protocol}://${host}`;
    const authResult = await requireAuth();
    if ("error" in authResult) {
      return authResult.error;
    }
    const studentId = authResult.studentId;
  try {
    // Call the existing API routes
    const [dashboardResponse, labsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/dashboard`, {
        method: "GET",
        headers: {
          cookie: headersList.get("cookie") || "",
        },
        cache: "force-cache",
        next: {
          tags: [`dashboard-${studentId}`],
          revalidate: 100

        }
      }),
      fetch(`${baseUrl}/api/labs`, {
        method: "GET",
        headers: {
          cookie: headersList.get("cookie") || "",
        },
        cache: "force-cache",
        next: {
          tags: [`labs-${studentId}`],
          revalidate: 100
        }
      }),
    ]);

    // Check if unauthorized
    if (dashboardResponse.status === 401) {
      redirect("/login");
    }

    if (!dashboardResponse.ok) {
      throw new Error(`Failed to load dashboard: ${dashboardResponse.statusText}`);
    }

    const dashboardData = await dashboardResponse.json();
    const labsData = labsResponse.ok ? await labsResponse.json() : { labsByCourse: {} };

    return (
      <DashboardPageClient
        student={dashboardData.student}
        track={dashboardData.track}
        courses={dashboardData.courses || []}
        coursesWithSubmissions={dashboardData.coursesWithSubmissions || []}
        recentSubmissions={dashboardData.recentSubmissions || []}
        suggestedLabs={dashboardData.suggestedLabs || []}
        labsByCourse={labsData.labsByCourse || {}}
      />
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    redirect("/login");
  }
}