import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function isAdminUser(userId: string) {
  const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").filter(Boolean);
  if (adminIds.includes(userId)) return true;
  if (process.env.NEXT_PUBLIC_ADMIN_USER_ID === userId) return true;
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: async () => [], setAll: async () => {} } }
  );
  try {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return (data as any)?.role === "admin";
  } catch (e) {
    return false;
  }
}

export async function POST(req: Request) {
  try {
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
    if (!(await isAdminUser(user.id))) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const { action, target } = await req.json();
    const admin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { cookies: { getAll: async () => [], setAll: async () => {} } }
    );

    if (action === "clear_messages") {
      if (target) {
        await admin.from("messages").delete().eq("channel_id", target);
      } else {
        await admin.from("messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
      return NextResponse.json({ success: true, message: "Messages cleared" });
    }

    if (action === "clear_channel") {
      await admin.from("channel_members").delete().eq("channel_id", target);
      await admin.from("messages").delete().eq("channel_id", target);
      await admin.from("channels").delete().eq("id", target);
      return NextResponse.json({ success: true, message: "Channel deleted" });
    }

    if (action === "clear_storage") {
      try {
        const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = await import("@aws-sdk/client-s3");
        const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
        const accessKeyId = process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID;
        const secretAccessKey = process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY;
        const r2Bucket = process.env.NEXT_PUBLIC_R2_BUCKET || "orbit-media";

        if (accountId && accessKeyId && secretAccessKey) {
          const r2Client = new S3Client({
            region: "auto",
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          });

          const prefix = target || "";
          const listed = await r2Client.send(new ListObjectsV2Command({
            Bucket: r2Bucket,
            Prefix: prefix,
          }));

          if (listed.Contents && listed.Contents.length > 0) {
            const objects = listed.Contents.map((obj) => ({ Key: obj.Key! }));
            await r2Client.send(new DeleteObjectsCommand({
              Bucket: r2Bucket,
              Delete: { Objects: objects },
            }));
          }
          return NextResponse.json({ success: true, message: `Deleted ${listed.Contents?.length || 0} objects` });
        }
      } catch (e) {
        return NextResponse.json({ error: "Failed to clear storage" }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
