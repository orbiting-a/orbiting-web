import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
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
              const allCookies = cookieStore.getAll();
              allCookies.forEach((cookie) => {
                if (cookie.name.startsWith(baseName)) {
                  const match = cookie.name.match(/^(sb-.*-auth-token)\.(\d+)$/);
                  if (match) {
                    const index = parseInt(match[2], 10);
                    if (index > maxIndex) {
                      cookieStore.set(cookie.name, "", { maxAge: -1, path: "/" });
                    }
                  }
                }
              });
            }

            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
