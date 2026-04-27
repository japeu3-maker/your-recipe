"use client";

import { useEffect } from "react";
import type { Platform } from "@/types";
import { extractYouTubeId } from "@/lib/youtube";
import Image from "next/image";
import Link from "next/link";

interface VideoEmbedProps {
  platform: Platform;
  url: string;
  thumbnailUrl?: string | null;
  title?: string;
}

export function VideoEmbed({ platform, url, thumbnailUrl, title }: VideoEmbedProps) {
  useEffect(() => {
    if (platform === "instagram") {
      const script = document.createElement("script");
      script.src = "//www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
    if (platform === "tiktok") {
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [platform]);

  if (platform === "youtube") {
    const videoId = extractYouTubeId(url);
    if (!videoId) return <EmbedFallback url={url} thumbnailUrl={thumbnailUrl} title={title} />;
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title ?? "YouTube video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
          loading="lazy"
        />
      </div>
    );
  }

  if (platform === "instagram") {
    return (
      <div className="flex justify-center">
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{ maxWidth: "540px", width: "100%" }}
        />
      </div>
    );
  }

  if (platform === "tiktok") {
    return (
      <div className="flex justify-center">
        <blockquote
          className="tiktok-embed"
          cite={url}
          data-video-id={url.match(/video\/(\d+)/)?.[1] ?? ""}
          style={{ maxWidth: "605px", minWidth: "325px" }}
        >
          <section />
        </blockquote>
      </div>
    );
  }

  return <EmbedFallback url={url} thumbnailUrl={thumbnailUrl} title={title} />;
}

function EmbedFallback({ url, thumbnailUrl, title }: { url: string; thumbnailUrl?: string | null; title?: string }) {
  return (
    <Link href={url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video w-full rounded-xl overflow-hidden bg-gray-100 group">
      {thumbnailUrl && (
        <Image src={thumbnailUrl} alt={title ?? "動画サムネイル"} fill className="object-cover" />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
        <span className="text-white text-sm font-medium underline">動画を開く ↗</span>
      </div>
    </Link>
  );
}
