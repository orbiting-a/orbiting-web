import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

async function deleteFromStorage(url: string | null) {
  if (!url) return;
  try {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const accountId = process.env.NEXT_PUBLIC_R2_ACCOUNT_ID;
    const accessKeyId = process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY;
    const r2Bucket = process.env.NEXT_PUBLIC_R2_BUCKET || "orbit-media";
    const r2PublicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

    if (accountId && accessKeyId && secretAccessKey && r2PublicUrl) {
      const r2Client = new S3Client({
        region: "auto",
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
      const prefix = `${r2PublicUrl}/`;
      if (url.startsWith(prefix)) {
        const key = url.slice(prefix.length);
        await r2Client.send(new DeleteObjectCommand({ Bucket: r2Bucket, Key: key }));
      }
    }
  } catch {
    // non-fatal - file stays in storage
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && serviceKey && url.includes("/storage/v1/object/public/")) {
      const admin = createServerClient(supabaseUrl, serviceKey, {
        cookies: { getAll: async () => [], setAll: async () => {} },
      });
      const parts = url.split("/storage/v1/object/public/");
      if (parts.length > 1) {
        const bucketPath = parts[1];
        const slashIdx = bucketPath.indexOf("/");
        if (slashIdx > 0) {
          const bucket = bucketPath.slice(0, slashIdx);
          const objPath = bucketPath.slice(slashIdx + 1).split("?")[0];
          await admin.storage.from(bucket).remove([objPath]);
        }
      }
    }
  } catch {
    // non-fatal
  }
}

export async function POST(req: Request) {
  try {
    const { messageId } = await req.json();
    if (!messageId) {
      return NextResponse.json({ error: "messageId required" }, { status: 400 });
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

    const { data: msg } = await admin
      .from("messages")
      .select("channel_id, sender_id, media_url")
      .eq("id", messageId)
      .single();

    if (!msg) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const { data: membership } = await admin
      .from("channel_members")
      .select("user_id")
      .eq("channel_id", msg.channel_id)
      .eq("user_id", user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this channel" }, { status: 403 });
    }

    await deleteFromStorage(msg.media_url);

    const { error: de } = await admin
      .from("messages")
      .delete()
      .eq("id", messageId);

    if (de) {
      return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal error" },
      { status: 500 }
    );
  }
}
