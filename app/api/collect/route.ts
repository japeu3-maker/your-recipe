import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { fetchChannelVideos, fetchVideoDetails } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();

  const { influencer_id, reset_date } = await request.json();
  if (!influencer_id) {
    return NextResponse.json({ error: "influencer_id required" }, { status: 400 });
  }

  const { data: influencer, error: infErr } = await supabase
    .from("influencers")
    .select("*")
    .eq("id", influencer_id)
    .single();

  if (infErr || !influencer) {
    return NextResponse.json({ error: "Influencer not found" }, { status: 404 });
  }

  if (influencer.platform !== "youtube" || !influencer.channel_id) {
    return NextResponse.json({ error: "Only YouTube channels support auto-collection" }, { status: 400 });
  }

  let videosFound = 0;
  let videosAdded = 0;
  let errorMessage: string | null = null;

  try {
    const publishedAfter = reset_date ? undefined : (influencer.last_collected_at ?? undefined);
    const { videoIds } = await fetchChannelVideos(
      influencer.channel_id,
      publishedAfter
    );

    videosFound = videoIds.length;

    if (videoIds.length > 0) {
      const details = await fetchVideoDetails(videoIds);

      for (const video of details) {
        const { error: insertErr } = await supabase.from("videos").insert({
          platform: "youtube",
          platform_id: video.videoId,
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnailUrl,
          published_at: video.publishedAt,
          duration_sec: video.durationSec,
          influencer_id,
        });

        if (!insertErr) {
          videosAdded++;
          // Trigger async classification (fire-and-forget)
          const baseUrl = request.nextUrl.origin;
          fetch(`${baseUrl}/api/classify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ platform: "youtube", platform_id: video.videoId }),
          }).catch(() => {});
        }
      }
    }

    // Update last_collected_at
    await supabase
      .from("influencers")
      .update({ last_collected_at: new Date().toISOString() })
      .eq("id", influencer_id);
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
  }

  // Log the collection run
  await supabase.from("collection_logs").insert({
    influencer_id,
    triggered_by: "admin",
    videos_found: videosFound,
    videos_added: videosAdded,
    error_message: errorMessage,
  });

  return NextResponse.json({ videos_found: videosFound, videos_added: videosAdded, error: errorMessage });
}
