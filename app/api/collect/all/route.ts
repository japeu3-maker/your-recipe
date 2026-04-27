import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Called by Vercel Cron — verify secret header
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const { data: influencers } = await supabase
    .from("influencers")
    .select("id")
    .eq("platform", "youtube")
    .eq("is_active", true);

  if (!influencers?.length) {
    return NextResponse.json({ message: "No active YouTube influencers" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const results = await Promise.allSettled(
    influencers.map((inf) =>
      fetch(`${baseUrl}/api/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencer_id: inf.id }),
      }).then((r) => r.json())
    )
  );

  return NextResponse.json({ collected: results.length, results });
}
