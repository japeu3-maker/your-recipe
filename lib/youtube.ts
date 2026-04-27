import type { YouTubeVideoMetadata } from "@/types";

const API_KEY = process.env.YOUTUBE_API_KEY!;
const BASE = "https://www.googleapis.com/youtube/v3";

function parseDuration(iso: string): number | null {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  return h * 3600 + m * 60 + s;
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  // Uploads playlist is channelId with UC -> UU
  if (channelId.startsWith("UC")) {
    return "UU" + channelId.slice(2);
  }
  // Fallback: fetch from channels API
  const params = new URLSearchParams({ part: "contentDetails", id: channelId, key: API_KEY });
  const res = await fetch(`${BASE}/channels?${params}`);
  if (!res.ok) throw new Error(`YouTube channels failed: ${res.status}`);
  const data = await res.json();
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads ?? null;
}

export async function fetchChannelVideos(
  channelId: string,
  publishedAfter?: string,
  maxVideos = 500
): Promise<{ videoIds: string[] }> {
  const playlistId = await getUploadsPlaylistId(channelId);
  const videoIds: string[] = [];
  let pageToken: string | undefined;
  const cutoff = publishedAfter ? new Date(publishedAfter) : null;

  while (videoIds.length < maxVideos) {
    const params = new URLSearchParams({
      part: "contentDetails,snippet",
      playlistId,
      maxResults: "50",
      key: API_KEY,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(`${BASE}/playlistItems?${params}`);
    if (!res.ok) throw new Error(`YouTube playlistItems failed: ${res.status}`);
    const data = await res.json();

    const items: { contentDetails: { videoId: string }; snippet: { publishedAt: string } }[] =
      data.items ?? [];

    let reachedCutoff = false;
    for (const item of items) {
      if (cutoff && new Date(item.snippet.publishedAt) <= cutoff) {
        reachedCutoff = true;
        break;
      }
      videoIds.push(item.contentDetails.videoId);
    }

    if (reachedCutoff || !data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return { videoIds };
}

export async function fetchVideoDetails(
  videoIds: string[]
): Promise<YouTubeVideoMetadata[]> {
  if (videoIds.length === 0) return [];

  const results: YouTubeVideoMetadata[] = [];

  // Process in chunks of 50 (API limit)
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      id: chunk.join(","),
      key: API_KEY,
    });

    const res = await fetch(`${BASE}/videos?${params}`);
    if (!res.ok) throw new Error(`YouTube videos.list failed: ${res.status}`);
    const data = await res.json();

    for (const item of data.items ?? []) {
      results.push({
        videoId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl:
          item.snippet.thumbnails.maxres?.url ??
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.medium?.url ??
          `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
        publishedAt: item.snippet.publishedAt,
        durationSec: parseDuration(item.contentDetails.duration),
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
      });
    }
  }

  return results;
}

export interface ChannelInfo {
  channelId: string;
  name: string;
  avatarUrl: string | null;
  handle: string | null;
}

// URL or @handle or channel ID からチャンネル情報を取得
export async function fetchChannelInfo(input: string): Promise<ChannelInfo> {
  // @handle形式: @ryuji825 or https://youtube.com/@ryuji825
  const handleMatch = input.match(/@([\w.-]+)/);
  // channel/UC... 形式
  const channelIdMatch = input.match(/channel\/(UC[\w-]+)/);
  // 直接UC...
  const directIdMatch = input.match(/^(UC[\w-]+)$/);

  let params: URLSearchParams;

  if (handleMatch) {
    params = new URLSearchParams({
      part: "snippet",
      forHandle: handleMatch[1],
      key: API_KEY,
    });
  } else if (channelIdMatch || directIdMatch) {
    const id = channelIdMatch?.[1] ?? directIdMatch?.[1];
    params = new URLSearchParams({ part: "snippet", id: id!, key: API_KEY });
  } else {
    // URLとして試す（カスタムURL等）
    params = new URLSearchParams({
      part: "snippet",
      forHandle: input.replace(/.*youtube\.com\//, "").replace(/\/$/, ""),
      key: API_KEY,
    });
  }

  const res = await fetch(`${BASE}/channels?${params}`);
  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error("チャンネルが見つかりませんでした");

  return {
    channelId: item.id,
    name: item.snippet.title,
    avatarUrl:
      item.snippet.thumbnails?.high?.url ??
      item.snippet.thumbnails?.medium?.url ??
      item.snippet.thumbnails?.default?.url ??
      null,
    handle: item.snippet.customUrl ?? null,
  };
}

export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}
