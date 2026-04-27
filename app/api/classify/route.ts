import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import { classifyVideo } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();

  const body = await request.json();
  // Accept either video_id (uuid) or platform+platform_id
  let video;
  if (body.video_id) {
    const { data } = await supabase.from("videos").select("*").eq("id", body.video_id).single();
    video = data;
  } else if (body.platform && body.platform_id) {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("platform", body.platform)
      .eq("platform_id", body.platform_id)
      .single();
    video = data;
  }

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  // Fetch current genres and ingredients for mapping slug→id
  const [{ data: allGenres }, { data: allIngredients }] = await Promise.all([
    supabase.from("genres").select("id, slug"),
    supabase.from("ingredients").select("id, slug"),
  ]);

  const genreMap = new Map((allGenres ?? []).map((g: { id: number; slug: string }) => [g.slug, g.id]));
  const ingredientMap = new Map((allIngredients ?? []).map((i: { id: number; slug: string }) => [i.slug, i.id]));

  let classification;
  try {
    classification = await classifyVideo(video.title, video.description ?? "");
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  // Upsert video_genres
  const genreRows = classification.cuisine_genres
    .map((slug) => genreMap.get(slug))
    .filter(Boolean)
    .map((genre_id) => ({ video_id: video.id, genre_id, source: "ai" }));

  if (genreRows.length > 0) {
    await supabase.from("video_genres").upsert(genreRows, { onConflict: "video_id,genre_id" });
  }

  // Upsert video_ingredients (insert new ingredient slugs if not in map)
  const ingredientRows: { video_id: string; ingredient_id: number; source: string }[] = [];
  for (const slug of classification.ingredients) {
    let id = ingredientMap.get(slug);
    if (!id) {
      // Auto-create new ingredient
      const { data: newIng } = await supabase
        .from("ingredients")
        .insert({ slug, name: slug })
        .select("id")
        .single();
      if (newIng) id = newIng.id;
    }
    if (id) ingredientRows.push({ video_id: video.id, ingredient_id: id, source: "ai" });
  }

  if (ingredientRows.length > 0) {
    await supabase.from("video_ingredients").upsert(ingredientRows, { onConflict: "video_id,ingredient_id" });
  }

  // Mark as classified; hide non-recipe videos
  await supabase
    .from("videos")
    .update({
      ai_classified: true,
      is_published: classification.is_recipe,
      ai_raw_response: JSON.stringify(classification),
    })
    .eq("id", video.id);

  return NextResponse.json({ success: true, classification });
}
