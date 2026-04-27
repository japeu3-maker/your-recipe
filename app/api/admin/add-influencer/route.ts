import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { fetchChannelInfo } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // チャンネル情報をYouTube APIから取得
  let channelInfo;
  try {
    channelInfo = await fetchChannelInfo(url);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // 既存チェック
  const { data: existing } = await supabase
    .from("influencers")
    .select("id, name")
    .eq("channel_id", channelInfo.channelId)
    .single();

  if (existing) {
    return NextResponse.json({ error: `「${existing.name}」はすでに登録済みです`, existing: true }, { status: 409 });
  }

  // 登録
  const { data, error } = await supabase
    .from("influencers")
    .insert({
      name: channelInfo.name,
      platform: "youtube",
      channel_id: channelInfo.channelId,
      handle: channelInfo.handle,
      avatar_url: channelInfo.avatarUrl,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, influencer: data, channelInfo });
}
