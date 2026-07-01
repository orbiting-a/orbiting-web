import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Force HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    request.headers.get("x-forwarded-proto") === "http"
  ) {
    const url = new URL(request.url);
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 301 });
  }

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
          let baseName = "";
          let maxIndex = -1;

          cookiesToSet.forEach(({ name }) => {
            if (name.includes("-auth-token")) {
              const match = name.match(/^(sb-.*-auth-token)(?:\.(\d+))?$/);
              if (match) {
                baseName = match[1];
                if (match[2] !== undefined) {
                  maxIndex = Math.max(maxIndex, parseInt(match[2], 10));
                }
              }
            }
          });

          if (baseName) {
            const allCookies = request.cookies.getAll();
            allCookies.forEach((cookie) => {
              if (cookie.name.startsWith(baseName)) {
                const match = cookie.name.match(/^(sb-.*-auth-token)\.(\d+)$/);
                if (match) {
                  const index = parseInt(match[2], 10);
                  if (index > maxIndex) {
                    cookiesToSet.push({
                      name: cookie.name,
                      value: "",
                      options: { maxAge: -1, path: "/" }
                    });
                  }
                }
              }
            });
          }

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
    }
  );

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasUser = !!user;

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ["/feed", "/search", "/settings", "/orbit", "/profile", "/chat", "/notifications", "/discover", "/radar", "/wallet", "/create-orbit", "/create-activity", "/admin"];
  const isProtectedRoute = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedRoute && !hasUser) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ["/login", "/signup", "/otp", "/update-profile", "/forgot-password", "/reset-password"];
  const isAuthRoute = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthRoute && hasUser) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
