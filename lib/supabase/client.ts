import { createBrowserClient } from "@supabase/ssr";

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getClient() {
  if (!supabaseClient) {
    // Suppress the GoTrueClient warning - safe in SSR context
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (
        args[0]?.toString().includes("Multiple GoTrueClient instances detected")
      ) {
        return;
      }
      originalWarn(...args);
    };

    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.warn = originalWarn;
  }

  return supabaseClient;
}

// Export singleton instance
export const supabase = getClient();

// Keep createClient for backwards compatibility
export function createClient() {
  return getClient();
}
