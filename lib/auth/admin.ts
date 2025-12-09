import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Checks if a student is an admin by looking up their email in the admins table.
 *
 * @param supabase - Supabase client instance
 * @param studentId - The student ID to check
 * @returns True if the student is an admin, false otherwise
 */
export async function checkIsAdmin(
    supabase: SupabaseClient,
    studentId: string
): Promise<boolean> {
    try {
        // Get student email
        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("email")
            .eq("id", studentId)
            .single();

        if (studentError || !student) {
            return false;
        }

        // Check if email exists in admins table (case-insensitive)
        const { data: admin, error: adminError } = await supabase
            .from("admins")
            .select("email")
            .ilike("email", student.email)
            .single();

        return !adminError && admin !== null;
    } catch {
        return false;
    }
}
