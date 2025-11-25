import { redirect } from "next/navigation";
import LabsClientPage from "./clientPage";
import { requireAuth } from "@/lib/auth";
import { getLabsAction } from "@/app/api/labs/action";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";

export default async function LabsPage() {
  const cookieStore = await cookies();
  const authResult = await requireAuth(cookieStore);
  
  if ("error" in authResult) {
    redirect("/login");
  }
  
  const studentId = authResult.studentId;

  try {
    // Fetch labs data using cached action
    const labsData = await getCachedLabs(studentId, cookieStore);

    if ("error" in labsData) {
       if (labsData.status === 401) {
         redirect("/login");
       }
       // Handle other errors gracefully, maybe redirect or show empty state
       console.error("Error loading labs:", labsData.error);
       // Fallback to empty structure if needed, but let's propagate error behavior if critical
       // For now, redirecting to login on critical failures is a safe default or error page
       if (labsData.status === 500) {
          throw new Error(typeof labsData.error === 'string' ? labsData.error : "Failed to load labs");
       }
    }

    // Use type assertion or check since we handled error above
    // The structure from action is guaranteed if no error
    const data = labsData as any; 

    return (
      <LabsClientPage
        student={data.student}
        track={data.track}
        courses={data.courses || []}
        labsByCourse={data.labsByCourse || {}}
      />
    );
  } catch (error) {
    console.error("Error loading labs page:", error);
    redirect("/login");
  }
}

// Helper to cache labs data with studentId as key
const getCachedLabs = async (studentId: string, cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return unstable_cache(
    async () => getLabsAction(cookieStore),
    ["labs", studentId],
    {
      tags: [`labs-${studentId}`],
      revalidate: 100,
    }
  )();
};
