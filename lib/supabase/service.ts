import { createClient } from "@supabase/supabase-js";

/**
 * Create a Supabase client with service role key
 * Use this for operations that require elevated permissions (like storage uploads)
 * WARNING: Never expose the service role key to the client-side
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your .env.local file.");
  }

  // Validate key format (should start with eyJ)
  if (!serviceRoleKey.startsWith('eyJ')) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY appears to be invalid. It should be a JWT token starting with 'eyJ'");
  }

  // Create client with service role key
  // Service role bypasses RLS and doesn't need signed URLs
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

