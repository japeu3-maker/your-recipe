import { createClient } from "@/lib/supabase-server";
import { Header } from "@/components/header";
import { VideoEmbed } from "@/components/video-embed";
import { VideoCard } from "@/components/video-card";
import { PlatformBadge } from "@/components/platform-badge";
import type { VideoWithRelations } from "@/types";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";

async function getVideo(id: string): Promise<VideoWithRelations | null> {
  const supabase = await createClient();
  const { data: video } = await supabase
    .from("videos")
    .select("*, influencer:influencers(*), video_genres(genre_id), video_ingredients(ingredient_id)")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!video) return null;

  const genreIds = (video.video_genres as { genre_id: number }[]).map((g) => g.genre_id);
  const ingredientIds = (video.video_ingredients as { ingredient_id: number }[]).map((i) => i.ingredient_id);

  const [{ data: genres }, { data: ingredients }] = await Promise.all([
    supabase.from("genres").select("*").in("id", genreIds.length > 0 ? genreIds : [0]),
    supabase.from("ingredients").select("*").in("id", ingredientIds.length > 0 ? ingredientIds : [0]),
  ]);

  return {
    ...video,
    genres: genres ?? [],
    ingredients: ingredients ?? [],
  } as VideoWithRelations;
}

async function getRelatedVideos(video: VideoWithRelations): Promise<VideoWithRelations[]> {
  if (video.genres.length === 0) return [];
  const supabase = await createClient();

  const { data: vgRows } = await supabase
    .from("video_genres")
    .select("video_id")
    .in("genre_id", video.genres.map((g) => g.id))
    .limit(20);

  const relatedIds = (vgRows ?? [])
    .map((r: { video_id: string }) => r.video_id)
    .filter((id: string) => id !== video.id)
    .slice(0, 6);

  if (relatedIds.length === 0) return [];

  const { data: relatedVideos } = await supabase
    .from("videos")
    .select("*, influencer:influencers(*), video_genres(genre_id), video_ingredients(ingredient_id)")
    .in("id", relatedIds)
    .eq("is_published", true);

  const [{ data: genres }, { data: ingredients }] = await Promise.all([
    supabase.from("genres").select("*"),
    supabase.from("ingredients").select("*"),
  ]);

  const genreMap = new Map((genres ?? []).map((g: { id: number; slug: string; name: string }) => [g.id, g]));
  const ingredientMap = new Map((ingredients ?? []).map((i: { id: number; slug: string; name: string }) => [i.id, i]));

  return (relatedVideos ?? []).map((v: Record<string, unknown>) => ({
    ...v,
    genres: (v.video_genres as { genre_id: number }[]).map((g) => genreMap.get(g.genre_id)).filter(Boolean),
    ingredients: (v.video_ingredients as { ingredient_id: number }[]).map((i) => ingredientMap.get(i.ingredient_id)).filter(Boolean),
  })) as VideoWithRelations[];
}

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getVideo(id);
  if (!video) notFound();

  const related = await getRelatedVideos(video);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Embed */}
        <VideoEmbed platform={video.platform} url={video.url} thumbnailUrl={video.thumbnail_url} title={video.title} />

        {/* Info */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 mt-4">
          <div className="flex items-start gap-3 mb-3">
            <PlatformBadge platform={video.platform} />
            {video.published_at && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={11} />
                {new Date(video.published_at).toLocaleDateString("ja-JP")}
              </span>
            )}
            <Link href={video.url} target="_blank" rel="noopener noreferrer"
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <ExternalLink size={12} />
              元動画を開く
            </Link>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-3">{video.title}</h1>

          {video.influencer && (
            <p className="text-sm text-gray-500 mb-3">by {video.influencer.name}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {video.genres.map((g) => (
              <Link key={g.id} href={`/genres/${g.slug}`}
                className="text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded-full transition-colors">
                {g.name}
              </Link>
            ))}
            {video.ingredients.map((i) => (
              <span key={i.id} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {i.name}
              </span>
            ))}
          </div>

          {video.description && (
            <p className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line line-clamp-6">
              {video.description}
            </p>
          )}
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">同じジャンルの動画</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
