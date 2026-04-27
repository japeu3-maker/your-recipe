import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { classifyVideo } from "@/lib/claude";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();

  const body = await request.json().catch(() => ({}));
  const limit = Math.min(Number(body.limit) || 50, 100);

  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, description")
    .eq("ai_classified", false)
    .limit(limit);

  if (!videos || videos.length === 0) {
    return NextResponse.json({ classified: 0, message: "未分類の動画はありません" });
  }

  const [{ data: allGenres }, { data: allIngredients }, { data: allSituations }, { data: allDishes }] = await Promise.all([
    supabase.from("genres").select("id, slug"),
    supabase.from("ingredients").select("id, slug"),
    supabase.from("situations").select("id, slug"),
    supabase.from("dishes").select("id, slug"),
  ]);

  const genreMap = new Map((allGenres ?? []).map((g: { id: number; slug: string }) => [g.slug, g.id]));
  const ingredientMap = new Map((allIngredients ?? []).map((i: { id: number; slug: string }) => [i.slug, i.id]));
  const situationMap = new Map((allSituations ?? []).map((s: { id: number; slug: string }) => [s.slug, s.id]));
  const dishMap = new Map((allDishes ?? []).map((d: { id: number; slug: string }) => [d.slug, d.id]));

  let classified = 0;

  // 並列で5件ずつのチャンクで処理（Claude APIレート制限対策）
  const CONCURRENCY = 5;
  for (let i = 0; i < videos.length; i += CONCURRENCY) {
    const chunk = videos.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (video) => {
    try {
      const result = await classifyVideo(video.title, video.description ?? "");

      const genreRows = result.cuisine_genres
        .map((slug) => genreMap.get(slug)).filter(Boolean)
        .map((genre_id) => ({ video_id: video.id, genre_id, source: "ai" }));
      if (genreRows.length > 0) {
        await supabase.from("video_genres").upsert(genreRows, { onConflict: "video_id,genre_id" });
      }

      const ingredientRows: { video_id: string; ingredient_id: number; source: string }[] = [];
      for (const slug of result.ingredients) {
        let id = ingredientMap.get(slug);
        if (!id) {
          const { data: newIng } = await supabase
            .from("ingredients").insert({ slug, name: slug }).select("id").single();
          if (newIng) { id = newIng.id; ingredientMap.set(slug, id); }
        }
        if (id) ingredientRows.push({ video_id: video.id, ingredient_id: id, source: "ai" });
      }
      if (ingredientRows.length > 0) {
        await supabase.from("video_ingredients").upsert(ingredientRows, { onConflict: "video_id,ingredient_id" });
      }

      const situationRows = (result.situations ?? [])
        .map((slug) => situationMap.get(slug)).filter(Boolean)
        .map((situation_id) => ({ video_id: video.id, situation_id, source: "ai" }));
      if (situationRows.length > 0) {
        await supabase.from("video_situations").upsert(situationRows, { onConflict: "video_id,situation_id" });
      }

      const dishRows = (result.dishes ?? [])
        .map((slug) => dishMap.get(slug)).filter(Boolean)
        .map((dish_id) => ({ video_id: video.id, dish_id, source: "ai" }));
      if (dishRows.length > 0) {
        await supabase.from("video_dishes").upsert(dishRows, { onConflict: "video_id,dish_id" });
      }

      await supabase.from("videos")
        .update({
          ai_classified: true,
          is_published: result.is_recipe,
          ai_raw_response: JSON.stringify(result),
        })
        .eq("id", video.id);

      classified++;
    } catch {
      // continue on error
    }
    }));
  }

  const { count: remaining } = await supabase
    .from("videos").select("id", { count: "exact", head: true }).eq("ai_classified", false);

  return NextResponse.json({ classified, remaining: remaining ?? 0 });
}
