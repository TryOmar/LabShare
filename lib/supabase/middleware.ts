import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { verifySession } from "@/lib/auth/sessions";
import { extractFingerprint } from "@/lib/auth/fingerprint";
import { clearAuthCookies } from "@/lib/auth";
// Import config validation to ensure JWT_SECRET is set at startup
import "@/lib/config";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
      auth: {
        persistSession: false,
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check for JWT-based authentication (for custom auth flow)
  const accessToken = request.cookies.get("access_token")?.value;
  let isAuthenticated = false;

  if (accessToken) {
    // Verify JWT and session
    const tokenResult = await verifyToken(accessToken);
    if (tokenResult) {
      const fingerprint = await extractFingerprint(request);
      if (fingerprint) {
        const sessionResult = await verifySession(
          tokenResult.sessionId,
          fingerprint
        );
        if (sessionResult) {
          isAuthenticated = true;
        } else {
          // Session invalid or fingerprint mismatch
          // Clear cookies and redirect to login
          const url = request.nextUrl.clone();
          url.pathname = "/login";
          const redirectResponse = NextResponse.redirect(url);
          clearAuthCookies(redirectResponse);
          return redirectResponse;
        }
      } else {
        // Fingerprint missing but token is valid - this shouldn't happen in normal flow
        // but could occur if fingerprint cookie was deleted. Clear auth and redirect.
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        const redirectResponse = NextResponse.redirect(url);
        clearAuthCookies(redirectResponse);
        return redirectResponse;
      }
    }
  }

  // Redirect unauthenticated users to login (except for login page, public routes, and API routes)
  // Allow access if user has Supabase auth OR JWT-based auth
  if (
    !user &&
    !isAuthenticated &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/about") &&
    !request.nextUrl.pathname.startsWith("/public") &&
    !request.nextUrl.pathname.startsWith("/submission") &&
    !request.nextUrl.pathname.startsWith("/api")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
