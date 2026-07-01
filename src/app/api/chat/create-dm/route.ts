import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { targetUserId } = await req.json();
    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: async () => [], setAll: async () => {} } }
    );

    // Check existing DM
    const { data: existing } = await admin.rpc("find_dm_channel", {
      user1_id: user.id,
      user2_id: targetUserId,
    });
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    // Create channel (service role bypasses RLS)
    const { data: channel, error: ce } = await admin
      .from("channels")
      .insert({ type: "dm", created_by: user.id })
      .select()
      .single();

    if (ce || !channel) {
      return NextResponse.json({ error: "Failed to create channel" }, { status: 500 });
    }

    // Insert members (service role bypasses RLS)
    const { error: me } = await admin.from("channel_members").insert([
      { channel_id: channel.id, user_id: user.id },
      { channel_id: channel.id, user_id: targetUserId },
    ]);

    if (me) {
      return NextResponse.json({ error: "Failed to add members" }, { status: 500 });
    }

    return NextResponse.json(channel);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
