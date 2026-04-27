import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { fetchChannelInfo } from "@/lib/youtube";

export async function POST() {
  const supabase = await createServiceClient();

  // avatar_urlが未設定のYouTubeインフルエンサーを取得
  const { data: influencers } = await supabase
    .from("influencers")
    .select("id, name, channel_id, avatar_url")
    .eq("platform", "youtube")
    .not("channel_id", "is", null);

  if (!influencers || influencers.length === 0) {
    return NextResponse.json({ updated: 0, message: "対象なし" });
  }

  let updated = 0;
  const errors: string[] = [];

  for (const inf of influencers) {
    try {
      const info = await fetchChannelInfo(inf.channel_id!);
      if (info.avatarUrl) {
        await supabase
          .from("influencers")
          .update({ avatar_url: info.avatarUrl })
          .eq("id", inf.id);
        updated++;
      }
    } catch (e) {
      errors.push(`${inf.name}: ${String(e)}`);
    }
  }

  return NextResponse.json({ updated, total: influencers.length, errors });
}
