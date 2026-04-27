import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await createServiceClient();

  await supabase.from("video_genres").delete().neq("video_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("video_ingredients").delete().neq("video_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("video_situations").delete().neq("video_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("video_dishes").delete().neq("video_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("videos").update({ ai_classified: false, ai_raw_response: null }).neq("id", "00000000-0000-0000-0000-000000000000");

  const { count } = await supabase.from("videos").select("id", { count: "exact", head: true }).eq("ai_classified", false);
  return NextResponse.json({ ok: true, unclassified: count });
}
