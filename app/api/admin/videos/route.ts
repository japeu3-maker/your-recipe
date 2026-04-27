import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("videos")
    .select("id,platform,title,thumbnail_url,ai_classified,is_reviewed,is_published,video_genres(genre_id),video_ingredients(ingredient_id),video_dishes(dish_id)")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient();
  const { id, ...updates } = await request.json();

  const { error } = await supabase.from("videos").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
