/**
 * Utility functions for handling anonymous content display
 * Provides reusable functions to process submissions and comments with anonymous support
 */

interface StudentInfo {
  id: string;
  name: string;
  email?: string;
}

interface AnonymousContent {
  is_anonymous?: boolean;
  student_id: string;
  students?: StudentInfo;
}

/**
 * Hides student info for anonymous content if user is not the owner
 * @param content - Submission or comment object with is_anonymous and student_id
 * @param currentStudentId - ID of the current authenticated user
 * @returns Content with student info hidden if anonymous and not owner
 */
export function processAnonymousContent<T extends AnonymousContent>(
  content: T,
  currentStudentId: string
): T {
  if (content.is_anonymous && content.student_id !== currentStudentId) {
    return {
      ...content,
      students: {
        id: '',
        name: 'Anonymous',
        ...(content.students?.email !== undefined && { email: '' }),
      },
    };
  }
  return content;
}

/**
 * Processes an array of anonymous content items
 * @param items - Array of submissions or comments
 * @param currentStudentId - ID of the current authenticated user
 * @returns Array with student info hidden for anonymous items (non-owners)
 */
export function processAnonymousContentArray<T extends AnonymousContent>(
  items: T[],
  currentStudentId: string
): T[] {
  return items.map(item => processAnonymousContent(item, currentStudentId));
}

/**
 * Gets the anonymity status of a submission
 * @param supabase - Supabase client instance
 * @param submissionId - ID of the submission
 * @returns Promise resolving to is_anonymous boolean (defaults to false)
 */
export async function getSubmissionAnonymityStatus(
  supabase: Awaited<ReturnType<typeof import('./supabase/server').createClient>>,
  submissionId: string
): Promise<boolean> {
  const { data: submission } = await supabase
    .from("submissions")
    .select("is_anonymous")
    .eq("id", submissionId)
    .single();

  return submission?.is_anonymous || false;
}

