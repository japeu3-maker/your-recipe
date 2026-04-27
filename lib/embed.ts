import type { Platform } from "@/types";

export function detectPlatform(url: string): Platform | null {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/tiktok\.com/.test(url)) return "tiktok";
  return null;
}

export function extractInstagramId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?]+)/);
  return m ? m[1] : null;
}

export function extractTikTokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  return m ? m[1] : null;
}

export async function fetchInstagramOEmbed(url: string): Promise<{
  title: string;
  authorName: string;
  thumbnailUrl: string | null;
  html: string;
} | null> {
  try {
    const endpoint = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}&omitscript=true`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title ?? "",
      authorName: data.author_name ?? "",
      thumbnailUrl: data.thumbnail_url ?? null,
      html: data.html ?? "",
    };
  } catch {
    return null;
  }
}

export async function fetchTikTokOEmbed(url: string): Promise<{
  title: string;
  authorName: string;
  thumbnailUrl: string | null;
  html: string;
} | null> {
  try {
    const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title ?? "",
      authorName: data.author_name ?? "",
      thumbnailUrl: data.thumbnail_url ?? null,
      html: data.html ?? "",
    };
  } catch {
    return null;
  }
}
