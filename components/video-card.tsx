import Link from "next/link";
import Image from "next/image";
import type { VideoWithRelations } from "@/types";
import { PlatformBadge } from "./platform-badge";
import { Clock } from "lucide-react";

function formatDuration(secs: number | null): string | null {
  if (!secs) return null;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoCard({ video }: { video: VideoWithRelations }) {
  const duration = formatDuration(video.duration_sec);

  return (
    <Link href={`/videos/${video.id}`}
      className="group block rounded-xl border border-gray-200 bg-white overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-300">🎬</div>
        )}
        {duration && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-mono">
            {duration}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold line-clamp-2 mb-2 leading-snug text-gray-900">{video.title}</p>
        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
          <PlatformBadge platform={video.platform} />
          {video.genres.slice(0, 2).map((g) => (
            <span key={g.id} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">{g.name}</span>
          ))}
          {video.dishes && video.dishes.slice(0, 1).map((d) => (
            <span key={d.id} className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">{d.name}</span>
          ))}
          {video.ingredients.slice(0, 1).map((i) => (
            <span key={i.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{i.name}</span>
          ))}
        </div>
        {video.influencer && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {video.influencer.avatar_url ? (
              <Image
                src={video.influencer.avatar_url}
                alt={video.influencer.name}
                width={18}
                height={18}
                className="rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-[18px] h-[18px] rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-[10px] text-gray-500">
                {video.influencer.name.charAt(0)}
              </div>
            )}
            <p className="text-xs text-gray-400 truncate">{video.influencer.name}</p>
          </div>
        )}
        {video.published_at && (
          <p className="text-xs mt-0.5 flex items-center gap-1 text-gray-400">
            <Clock size={10} />
            {new Date(video.published_at).toLocaleDateString("ja-JP")}
          </p>
        )}
      </div>
    </Link>
  );
}
