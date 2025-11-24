"use server";

import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedStudentId } from "@/lib/auth";

export async function getLabsAction() {
  try {
    // Validate authentication
    const studentId = await getAuthenticatedStudentId();
    if (!studentId) {
      return { error: "Unauthorized", status: 401 };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc("get_student_labs", {
      p_student_id: studentId,
    });

    if (error) {
      console.error("Error in labs action:", error);
      return { error: "Failed to fetch labs data", status: 500 };
    }

    // Check if the SQL function returned an application-level error (e.g. 404)
    if (data && data.error) {
      return { error: data.error, status: data.status || 500 };
    }

    return data;
  } catch (error) {
    console.error("Error in labs action:", error);
    return { error: "An error occurred", status: 500 };
  }
}
