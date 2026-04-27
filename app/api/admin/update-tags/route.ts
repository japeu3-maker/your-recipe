import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const { video_id, genre_ids, ingredient_ids, dish_ids } = await request.json();

  if (!video_id) {
    return NextResponse.json({ error: "video_id required" }, { status: 400 });
  }

  await supabase.from("video_genres").delete().eq("video_id", video_id);
  if (genre_ids?.length) {
    await supabase.from("video_genres").insert(
      genre_ids.map((genre_id: number) => ({ video_id, genre_id, source: "manual" }))
    );
  }

  await supabase.from("video_ingredients").delete().eq("video_id", video_id);
  if (ingredient_ids?.length) {
    await supabase.from("video_ingredients").insert(
      ingredient_ids.map((ingredient_id: number) => ({ video_id, ingredient_id, source: "manual" }))
    );
  }

  await supabase.from("video_dishes").delete().eq("video_id", video_id);
  if (dish_ids?.length) {
    await supabase.from("video_dishes").insert(
      dish_ids.map((dish_id: number) => ({ video_id, dish_id, source: "manual" }))
    );
  }

  await supabase.from("videos").update({ is_reviewed: true }).eq("id", video_id);

  return NextResponse.json({ success: true });
}
