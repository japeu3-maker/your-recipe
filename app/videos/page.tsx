import { createClient } from "@/lib/supabase-server";
import { VideoCard } from "@/components/video-card";
import { Logo } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import type { VideoWithRelations } from "@/types";
import Link from "next/link";

interface SearchParams {
  genre?: string;
  ingredient?: string;
  situation?: string;
  dish?: string;
  platform?: string;
  q?: string;
}

async function getVideoIdsByTag(
  table: "video_dishes" | "video_genres" | "video_situations" | "video_ingredients",
  masterTable: "dishes" | "genres" | "situations" | "ingredients",
  fkColumn: "dish_id" | "genre_id" | "situation_id" | "ingredient_id",
  slug: string,
): Promise<string[] | null> {
  const supabase = await createClient();
  const { data: master } = await supabase.from(masterTable).select("id").eq("slug", slug).single();
  if (!master) return [];
  const { data: rows } = await supabase.from(table).select("video_id").eq(fkColumn, master.id);
  return (rows ?? []).map((r: { video_id: string }) => r.video_id);
}

async function getVideos(params: SearchParams): Promise<VideoWithRelations[]> {
  const supabase = await createClient();

  // 各タグフィルタを先にDB側で適用 → 動画IDの絞り込みリストを取る
  const idFilters: string[][] = [];
  if (params.dish) {
    const ids = await getVideoIdsByTag("video_dishes", "dishes", "dish_id", params.dish);
    if (ids) idFilters.push(ids);
  }
  if (params.genre) {
    const ids = await getVideoIdsByTag("video_genres", "genres", "genre_id", params.genre);
    if (ids) idFilters.push(ids);
  }
  if (params.situation) {
    const ids = await getVideoIdsByTag("video_situations", "situations", "situation_id", params.situation);
    if (ids) idFilters.push(ids);
  }
  if (params.ingredient) {
    const ids = await getVideoIdsByTag("video_ingredients", "ingredients", "ingredient_id", params.ingredient);
    if (ids) idFilters.push(ids);
  }

  // 複数フィルタはAND（積集合）
  let allowedIds: string[] | null = null;
  if (idFilters.length > 0) {
    allowedIds = idFilters.reduce((acc, cur) => acc.filter((id) => cur.includes(id)));
    if (allowedIds.length === 0) return [];
  }

  let query = supabase
    .from("videos")
    .select(`
      *,
      influencer:influencers(*),
      genres:video_genres(genre:genres(*)),
      ingredients:video_ingredients(ingredient:ingredients(*)),
      situations:video_situations(situation:situations(*)),
      dishes:video_dishes(dish:dishes(*))
    `)
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(200);

  if (allowedIds) query = query.in("id", allowedIds);
  if (params.platform) query = query.eq("platform", params.platform);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  const { data } = await query;
  if (!data) return [];

  return data.map((v: {
    genres: { genre: { id: number; slug: string; name: string } | null }[];
    ingredients: { ingredient: { id: number; slug: string; name: string } | null }[];
    situations: { situation: { id: number; slug: string; name: string } | null }[];
    dishes: { dish: { id: number; slug: string; name: string } | null }[];
    [key: string]: unknown;
  }) => ({
    ...v,
    genres: v.genres.map((g) => g.genre).filter(Boolean),
    ingredients: v.ingredients.map((i) => i.ingredient).filter(Boolean),
    situations: v.situations.map((s) => s.situation).filter(Boolean),
    dishes: v.dishes.map((d) => d.dish).filter(Boolean),
  })) as VideoWithRelations[];
}

const GENRE_OPTIONS = [
  { slug: "japanese", name: "和食" }, { slug: "italian", name: "イタリアン" },
  { slug: "korean", name: "韓国料理" }, { slug: "chinese", name: "中華" },
  { slug: "french", name: "フレンチ" }, { slug: "american", name: "アメリカン" },
  { slug: "thai", name: "タイ料理" }, { slug: "indian", name: "インド料理" },
  { slug: "other", name: "その他" },
];

const SITUATION_OPTIONS = [
  { slug: "quick", name: "時短・簡単" }, { slug: "dinner", name: "夜ごはん" },
  { slug: "lunch", name: "昼ごはん" }, { slug: "breakfast", name: "朝ごはん" },
  { slug: "entertaining", name: "おもてなし" }, { slug: "bento", name: "お弁当" },
  { slug: "meal-prep", name: "作り置き" }, { slug: "diet", name: "ダイエット" },
  { slug: "snack", name: "おつまみ" }, { slug: "kids", name: "子供向け" },
];

const DISH_OPTIONS = [
  { slug: "karaage", name: "唐揚げ" }, { slug: "hambagu", name: "ハンバーグ" },
  { slug: "curry", name: "カレー" }, { slug: "ginger-pork", name: "豚の生姜焼き" },
  { slug: "donburi", name: "丼" }, { slug: "udon", name: "うどん" },
  { slug: "onigiri", name: "おにぎり" }, { slug: "sandwich", name: "サンドイッチ" },
];

const INGREDIENT_OPTIONS = [
  { slug: "chicken", name: "鶏肉" }, { slug: "beef", name: "牛肉" },
  { slug: "pork", name: "豚肉" }, { slug: "fish", name: "魚" },
  { slug: "egg", name: "卵" }, { slug: "tofu", name: "豆腐" },
  { slug: "pasta", name: "パスタ" }, { slug: "rice", name: "ご飯" },
  { slug: "noodles", name: "麺" }, { slug: "tomato", name: "トマト" },
  { slug: "cheese", name: "チーズ" }, { slug: "mushroom", name: "きのこ" },
];

export default async function VideosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const videos = await getVideos(params);

  function buildUrl(updates: Partial<SearchParams>) {
    const next = { ...params, ...updates };
    Object.keys(next).forEach((k) => { if (!next[k as keyof SearchParams]) delete next[k as keyof SearchParams]; });
    const qs = new URLSearchParams(next as Record<string, string>).toString();
    return `/videos${qs ? `?${qs}` : ""}`;
  }

  const activeFilters = [params.genre, params.situation, params.dish, params.ingredient, params.platform].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <StylishHeader q={params.q} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">動画一覧</h1>
          {activeFilters > 0 && (
            <Link href="/videos" className="text-xs px-2.5 py-1 rounded-full border border-orange-400 text-orange-500">
              ✕ フィルター解除
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 mb-6 space-y-3">

          {/* 料理で探す */}
          <FilterRow label="料理">
            {DISH_OPTIONS.map((d) => (
              <FilterPill key={d.slug} href={buildUrl({ dish: params.dish === d.slug ? undefined : d.slug })}
                active={params.dish === d.slug} color="yellow">{d.name}</FilterPill>
            ))}
          </FilterRow>

          {/* ジャンル */}
          <FilterRow label="ジャンル">
            {GENRE_OPTIONS.map((g) => (
              <FilterPill key={g.slug} href={buildUrl({ genre: params.genre === g.slug ? undefined : g.slug })}
                active={params.genre === g.slug} color="orange">{g.name}</FilterPill>
            ))}
          </FilterRow>

          {/* 食材 */}
          <FilterRow label="食材">
            {INGREDIENT_OPTIONS.map((i) => (
              <FilterPill key={i.slug} href={buildUrl({ ingredient: params.ingredient === i.slug ? undefined : i.slug })}
                active={params.ingredient === i.slug} color="green">{i.name}</FilterPill>
            ))}
          </FilterRow>

          {/* シチュエーション */}
          <FilterRow label="シチュ">
            {SITUATION_OPTIONS.map((s) => (
              <FilterPill key={s.slug} href={buildUrl({ situation: params.situation === s.slug ? undefined : s.slug })}
                active={params.situation === s.slug} color="purple">{s.name}</FilterPill>
            ))}
          </FilterRow>

          {/* Platform */}
          <FilterRow label="媒体">
            {[{ value: "youtube", label: "YouTube" }, { value: "instagram", label: "Instagram" }, { value: "tiktok", label: "TikTok" }].map((p) => (
              <FilterPill key={p.value} href={buildUrl({ platform: params.platform === p.value ? undefined : p.value })}
                active={params.platform === p.value} color="gray">{p.label}</FilterPill>
            ))}
          </FilterRow>
        </div>

        <p className="text-sm mb-4 text-gray-500">{videos.length}件の動画</p>

        {videos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">この条件に合う動画が見つかりませんでした</p>
            <Link href="/videos" className="text-sm text-orange-500 hover:underline">すべての動画を見る</Link>
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

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium w-10 shrink-0 text-gray-400">{label}</span>
      {children}
    </div>
  );
}

function FilterPill({ href, active, color, children }: {
  href: string; active: boolean; color: "orange" | "yellow" | "purple" | "gray" | "green"; children: React.ReactNode;
}) {
  const activeClass = {
    orange: "bg-orange-500 text-white border-orange-500",
    yellow: "bg-yellow-500 text-white border-yellow-500",
    purple: "bg-purple-500 text-white border-purple-500",
    gray: "bg-gray-600 text-white border-gray-600",
    green: "bg-green-600 text-white border-green-600",
  }[color];

  return (
    <Link href={href}
      className={`text-xs px-3 py-1 rounded-full border transition-all hover:opacity-90 ${active ? activeClass : "border-gray-200 text-gray-500 bg-white hover:border-orange-300 hover:text-orange-500"}`}>
      {children}
    </Link>
  );
}

function StylishHeader({ q }: { q?: string }) {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="shrink-0">
          <Logo size="sm" color="#f97316" />
        </Link>
        <nav className="hidden md:flex items-center gap-5 text-sm text-gray-500">
          <Link href="/videos" className="hover:text-gray-900 transition-colors">動画</Link>
          <Link href="/videos?genre=japanese" className="hover:text-gray-900 transition-colors">和食</Link>
          <Link href="/videos?situation=quick" className="hover:text-gray-900 transition-colors">時短</Link>
          <Link href="/videos?dish=karaage" className="hover:text-gray-900 transition-colors">唐揚げ</Link>
        </nav>
        <div className="flex-1" />
        <SearchBox size="sm" defaultValue={q ?? ""} />
      </div>
    </header>
  );
}
