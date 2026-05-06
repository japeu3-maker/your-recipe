import { createServiceClient } from "@/lib/supabase-server";
import type { MetadataRoute } from "next";

const SITE_URL = "https://your-recipe-jp.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServiceClient();
  const { data: videos } = await supabase
    .from("videos")
    .select("id, updated_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(1000);

  const videoUrls = (videos ?? []).map((v) => ({
    url: `${SITE_URL}/videos/${v.id}`,
    lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const genres = ["japanese", "italian", "korean", "chinese", "french", "american", "thai", "indian", "other"];
  const situations = ["quick", "dinner", "lunch", "breakfast", "entertaining", "bento", "meal-prep", "diet", "snack", "kids"];
  const dishes = ["karaage", "hambagu", "curry", "ginger-pork", "donburi", "udon", "onigiri", "sandwich"];

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/videos`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    ...genres.map((g) => ({ url: `${SITE_URL}/videos?genre=${g}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...situations.map((s) => ({ url: `${SITE_URL}/videos?situation=${s}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...dishes.map((d) => ({ url: `${SITE_URL}/videos?dish=${d}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...videoUrls,
  ];
}
