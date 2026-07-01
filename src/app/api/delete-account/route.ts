import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Get the auth token from the request headers
    const authHeader = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a Supabase client with the service role key (server-side only)
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        cookies: {
          getAll() {
            return [];
          },
          setAll() {
            // noop — this is a server-side admin client
          },
        },
      }
    );

    // Verify the user's identity using their auth token
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(authHeader);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid user token" }, { status: 401 });
    }

    // Delete profile row first (profiles has ON DELETE CASCADE to auth.users,
    // but we do it explicitly for safety)
    const { error: profileDeleteError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileDeleteError) {
      console.error("Failed to delete profile:", profileDeleteError.message);
      // Continue anyway to try deleting the auth user
    }

    // Delete the auth user using the service role (bypasses RLS)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError.message);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
