import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { detectPlatform, fetchInstagramOEmbed, fetchTikTokOEmbed, extractInstagramId, extractTikTokId } from "@/lib/embed";
import { extractYouTubeId, fetchVideoDetails } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const { url, influencer_id, manual_description } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const platform = detectPlatform(url);
  if (!platform) {
    return NextResponse.json({ error: "Unsupported platform URL" }, { status: 400 });
  }

  let videoData: {
    platform_id: string;
    title: string;
    description: string;
    thumbnail_url: string | null;
    published_at: string | null;
    duration_sec: number | null;
  } | null = null;

  if (platform === "youtube") {
    const videoId = extractYouTubeId(url);
    if (!videoId) return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    const details = await fetchVideoDetails([videoId]);
    if (!details[0]) return NextResponse.json({ error: "YouTube video not found" }, { status: 404 });
    const v = details[0];
    videoData = {
      platform_id: videoId,
      title: v.title,
      description: manual_description ?? v.description,
      thumbnail_url: v.thumbnailUrl,
      published_at: v.publishedAt,
      duration_sec: v.durationSec,
    };
  } else if (platform === "instagram") {
    const shortcode = extractInstagramId(url);
    if (!shortcode) return NextResponse.json({ error: "Invalid Instagram URL" }, { status: 400 });
    const oembed = await fetchInstagramOEmbed(url);
    videoData = {
      platform_id: shortcode,
      title: oembed?.title ?? manual_description ?? "Instagram動画",
      description: manual_description ?? oembed?.title ?? "",
      thumbnail_url: oembed?.thumbnailUrl ?? null,
      published_at: null,
      duration_sec: null,
    };
  } else if (platform === "tiktok") {
    const tiktokId = extractTikTokId(url);
    if (!tiktokId) return NextResponse.json({ error: "Invalid TikTok URL" }, { status: 400 });
    const oembed = await fetchTikTokOEmbed(url);
    videoData = {
      platform_id: tiktokId,
      title: oembed?.title ?? manual_description ?? "TikTok動画",
      description: manual_description ?? oembed?.title ?? "",
      thumbnail_url: oembed?.thumbnailUrl ?? null,
      published_at: null,
      duration_sec: null,
    };
  }

  if (!videoData) {
    return NextResponse.json({ error: "Failed to fetch video metadata" }, { status: 500 });
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("videos")
    .insert({
      platform,
      platform_id: videoData.platform_id,
      url,
      title: videoData.title,
      description: videoData.description,
      thumbnail_url: videoData.thumbnail_url,
      published_at: videoData.published_at,
      duration_sec: videoData.duration_sec,
      influencer_id: influencer_id ?? null,
    })
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ error: "この動画はすでに登録されています" }, { status: 409 });
    }
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Trigger classification
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ video_id: inserted.id }),
  }).catch(() => {});

  return NextResponse.json({ success: true, video: inserted });
}
