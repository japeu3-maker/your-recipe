import { createClient } from "@/lib/supabase-server";
import { Header } from "@/components/header";
import { VideoCard } from "@/components/video-card";
import type { VideoWithRelations } from "@/types";
import { notFound } from "next/navigation";

export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: genre } = await supabase.from("genres").select("*").eq("slug", slug).single();
  if (!genre) notFound();

  const { data: vgRows } = await supabase
    .from("video_genres")
    .select("video_id")
    .eq("genre_id", genre.id)
    .limit(48);

  const videoIds = (vgRows ?? []).map((r: { video_id: string }) => r.video_id);

  let videos: VideoWithRelations[] = [];
  if (videoIds.length > 0) {
    const { data: rawVideos } = await supabase
      .from("videos")
      .select("*, influencer:influencers(*), video_genres(genre_id), video_ingredients(ingredient_id)")
      .in("id", videoIds)
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false });

    const [{ data: genres }, { data: ingredients }] = await Promise.all([
      supabase.from("genres").select("*"),
      supabase.from("ingredients").select("*"),
    ]);

    const genreMap = new Map((genres ?? []).map((g: { id: number; slug: string; name: string }) => [g.id, g]));
    const ingredientMap = new Map((ingredients ?? []).map((i: { id: number; slug: string; name: string }) => [i.id, i]));

    videos = (rawVideos ?? []).map((v: Record<string, unknown>) => ({
      ...v,
      genres: (v.video_genres as { genre_id: number }[]).map((g) => genreMap.get(g.genre_id)).filter(Boolean),
      ingredients: (v.video_ingredients as { ingredient_id: number }[]).map((i) => ingredientMap.get(i.ingredient_id)).filter(Boolean),
    })) as VideoWithRelations[];
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-1">ジャンル</p>
          <h1 className="text-3xl font-bold text-gray-900">{genre.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{videos.length}件の動画</p>
        </div>
        {videos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p>このジャンルの動画はまだありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos.map((video) => <VideoCard key={video.id} video={video} />)}
          </div>
        )}
      </main>
    </div>
  );
}
