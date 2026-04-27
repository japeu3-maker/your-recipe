import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-server";
import { Logo } from "@/components/logo";
import { SearchBox } from "@/components/search-box";
import type { VideoWithRelations, Influencer } from "@/types";

export const dynamic = "force-dynamic";

const DISHES = [
  { slug: "karaage", name: "唐揚げ", emoji: "🍗" },
  { slug: "hambagu", name: "ハンバーグ", emoji: "🍔" },
  { slug: "curry", name: "カレー", emoji: "🍛" },
  { slug: "ginger-pork", name: "豚の生姜焼き", emoji: "🥩" },
  { slug: "donburi", name: "丼", emoji: "🍚" },
  { slug: "udon", name: "うどん", emoji: "🍜" },
  { slug: "onigiri", name: "おにぎり", emoji: "🍙" },
  { slug: "sandwich", name: "サンドイッチ", emoji: "🥪" },
];

const GENRES = [
  { slug: "japanese", name: "和食", emoji: "🍱" },
  { slug: "italian", name: "イタリアン", emoji: "🍝" },
  { slug: "korean", name: "韓国料理", emoji: "🌶️" },
  { slug: "chinese", name: "中華", emoji: "🥟" },
  { slug: "french", name: "フレンチ", emoji: "🥐" },
  { slug: "american", name: "アメリカン", emoji: "🍔" },
  { slug: "thai", name: "タイ料理", emoji: "🍜" },
  { slug: "indian", name: "インド料理", emoji: "🍛" },
  { slug: "mexican", name: "メキシカン", emoji: "🌮" },
  { slug: "other", name: "その他", emoji: "🍽️" },
];

const INGREDIENTS = [
  { slug: "chicken", name: "鶏肉" },
  { slug: "beef", name: "牛肉" },
  { slug: "pork", name: "豚肉" },
  { slug: "fish", name: "魚" },
  { slug: "egg", name: "卵" },
  { slug: "tofu", name: "豆腐" },
  { slug: "pasta", name: "パスタ" },
  { slug: "rice", name: "ご飯" },
  { slug: "noodles", name: "麺" },
  { slug: "tomato", name: "トマト" },
  { slug: "cheese", name: "チーズ" },
  { slug: "mushroom", name: "きのこ" },
];

const SITUATIONS = [
  { slug: "quick", name: "時短・簡単", emoji: "⚡" },
  { slug: "dinner", name: "夜ごはん", emoji: "🌙" },
  { slug: "lunch", name: "昼ごはん", emoji: "☀️" },
  { slug: "breakfast", name: "朝ごはん", emoji: "🌅" },
  { slug: "entertaining", name: "おもてなし", emoji: "🎉" },
  { slug: "bento", name: "お弁当", emoji: "🍱" },
  { slug: "meal-prep", name: "作り置き", emoji: "📦" },
  { slug: "diet", name: "ダイエット", emoji: "🥗" },
  { slug: "snack", name: "おつまみ", emoji: "🍺" },
  { slug: "kids", name: "子供向け", emoji: "👶" },
];

function formatDuration(sec: number | null): string | null {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function getInfluencers(): Promise<Influencer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("influencers")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return (data ?? []) as Influencer[];
}

async function getAllVideos(): Promise<VideoWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select(`*, influencer:influencers(*),
      genres:video_genres(genre:genres(*)),
      ingredients:video_ingredients(ingredient:ingredients(*)),
      situations:video_situations(situation:situations(*)),
      dishes:video_dishes(dish:dishes(*))`)
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(300);

  if (!data) return [];
  return data.map((v: Record<string, unknown>) => ({
    ...v,
    genres: ((v.genres as { genre: object }[]) ?? []).map((g) => g.genre),
    ingredients: ((v.ingredients as { ingredient: object }[]) ?? []).map((i) => i.ingredient),
    situations: ((v.situations as { situation: object }[]) ?? []).map((s) => s.situation),
    dishes: ((v.dishes as { dish: object }[]) ?? []).map((d) => d.dish),
  })) as VideoWithRelations[];
}

// ===== ヘッダー =====
function Header() {
  return (
    <header className="border-b sticky top-0 z-40 bg-white/95 backdrop-blur"
      style={{ borderColor: "#e8e0d5" }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
        <Link href="/" className="shrink-0">
          <Logo size="sm" color="#1a1714" />
        </Link>
        <div className="flex-1" />
        <SearchBox size="sm" />
      </div>
    </header>
  );
}

// ===== サイドバー =====
function Sidebar() {
  return (
    <aside className="w-44 shrink-0 hidden lg:block">
      <div className="sticky top-16 space-y-6 pb-8">
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-2.5"
            style={{ color: "#b0a090", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
            料理で探す
          </p>
          <ul className="space-y-px">
            {DISHES.map((d) => (
              <li key={d.slug}>
                <Link href={`/videos?dish=${d.slug}`}
                  className="flex items-center gap-2 py-1 px-1.5 rounded transition-colors hover:text-orange-500"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300, fontSize: "0.8rem", color: "#555" }}>
                  <span className="text-sm">{d.emoji}</span>{d.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="h-px" style={{ background: "#ede8e0" }} />
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-2.5"
            style={{ color: "#b0a090", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
            ジャンル
          </p>
          <ul className="space-y-px">
            {GENRES.map((g) => (
              <li key={g.slug}>
                <Link href={`/videos?genre=${g.slug}`}
                  className="flex items-center gap-2 py-1 px-1.5 rounded transition-colors hover:text-orange-500"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300, fontSize: "0.8rem", color: "#555" }}>
                  <span className="text-sm">{g.emoji}</span>{g.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="h-px" style={{ background: "#ede8e0" }} />
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-2.5"
            style={{ color: "#b0a090", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
            食材
          </p>
          <div className="flex flex-wrap gap-1">
            {INGREDIENTS.map((i) => (
              <Link key={i.slug} href={`/videos?ingredient=${i.slug}`}
                className="text-[11px] px-2 py-0.5 rounded-full border transition-colors hover:border-orange-300 hover:text-orange-500"
                style={{ borderColor: "#ddd8d0", color: "#777", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                {i.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="h-px" style={{ background: "#ede8e0" }} />
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-2.5"
            style={{ color: "#b0a090", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
            シチュエーション
          </p>
          <ul className="space-y-px">
            {SITUATIONS.map((s) => (
              <li key={s.slug}>
                <Link href={`/videos?situation=${s.slug}`}
                  className="flex items-center gap-2 py-1 px-1.5 rounded transition-colors hover:text-orange-500"
                  style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300, fontSize: "0.8rem", color: "#555" }}>
                  <span className="text-sm">{s.emoji}</span>{s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}

// ===== ヒーローバナー（ランダム動画） =====
function HeroVideo({ video }: { video: VideoWithRelations }) {
  const date = video.published_at
    ? new Date(video.published_at).toLocaleDateString("en-US", { day: "2-digit", weekday: "short", month: "long", year: "numeric" }).toUpperCase()
    : "";
  const keywords = [
    ...video.genres.slice(0, 1).map(g => g.name),
    ...video.dishes.slice(0, 1).map(d => d.name),
    ...video.situations.slice(0, 1).map(s => s.name),
  ];

  return (
    <Link href={`/videos/${video.id}`} className="group relative block rounded-2xl overflow-hidden mb-8"
      style={{ background: "#1a1714" }}>
      <div className="relative aspect-[16/7] w-full">
        {video.thumbnail_url && (
          <Image src={video.thumbnail_url} alt={video.title} fill
            sizes="100vw" className="object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
        )}
        {/* グラデーションオーバーレイ */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(26,23,20,0.85) 0%, rgba(26,23,20,0.4) 55%, rgba(26,23,20,0.1) 100%)" }} />
        {/* テキスト */}
        <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10 max-w-xl">
          {date && (
            <p className="text-[10px] tracking-[0.2em] mb-2"
              style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
              {date}
            </p>
          )}
          {keywords.length > 0 && (
            <div className="flex gap-2 mb-3">
              {keywords.map((k, i) => (
                <span key={i} className="text-[10px] tracking-[0.1em] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(249,115,22,0.85)", color: "#fff", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                  {k}
                </span>
              ))}
            </div>
          )}
          <h2 className="text-xl md:text-2xl font-bold leading-snug mb-4 line-clamp-3"
            style={{ color: "#fff", fontFamily: "'Noto Serif JP', serif", fontWeight: 700, letterSpacing: "0.01em" }}>
            {video.title}
          </h2>
          {video.influencer && (
            <div className="flex items-center gap-2">
              {video.influencer.avatar_url && (
                <Image src={video.influencer.avatar_url} alt={video.influencer.name}
                  width={24} height={24} className="rounded-full object-cover" />
              )}
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                {video.influencer.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ===== コンパクト動画カード =====
function VideoCard({ video }: { video: VideoWithRelations }) {
  const duration = formatDuration(video.duration_sec);
  return (
    <Link href={`/videos/${video.id}`} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-lg mb-2" style={{ background: "#f0ebe3" }}>
        {video.thumbnail_url ? (
          <Image src={video.thumbnail_url} alt={video.title} fill
            sizes="(max-width: 640px) 50vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🍳</div>
        )}
        {duration && (
          <span className="absolute bottom-1 right-1 text-[10px] px-1 py-px rounded font-mono bg-black/70 text-white">
            {duration}
          </span>
        )}
      </div>
      <p className="text-xs leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors"
        style={{ color: "#333", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 400 }}>
        {video.title}
      </p>
      {video.influencer && (
        <div className="flex items-center gap-1 mt-1">
          {video.influencer.avatar_url && (
            <Image src={video.influencer.avatar_url} alt={video.influencer.name}
              width={14} height={14} className="rounded-full object-cover shrink-0" />
          )}
          <p className="text-[10px] truncate" style={{ color: "#aaa", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
            {video.influencer.name}
          </p>
        </div>
      )}
    </Link>
  );
}

// ===== カテゴリ行（通常グリッド） =====
function VideoRow({ title, emoji, href, videos }: {
  title: string; emoji: string; href: string; videos: VideoWithRelations[];
}) {
  if (videos.length === 0) return null;
  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <Link href={href} className="group inline-flex items-center gap-2">
          <span>{emoji}</span>
          <h2 className="font-bold group-hover:text-orange-500 transition-colors"
            style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 700, fontSize: "0.95rem", color: "#1a1714" }}>
            {title}
          </h2>
        </Link>
        <Link href={href}
          className="text-[11px] tracking-widest hover:text-orange-500 transition-colors"
          style={{ color: "#aaa", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
          MORE →
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {videos.slice(0, 6).map((v) => <VideoCard key={v.id} video={v} />)}
      </div>
    </section>
  );
}

// ===== カテゴリ行（ヒーロー風 — 時短・簡単専用） =====
function VideoRowHero({ title, emoji, href, videos }: {
  title: string; emoji: string; href: string; videos: VideoWithRelations[];
}) {
  if (videos.length === 0) return null;
  const [featured, ...rest] = videos;
  const date = featured.published_at
    ? new Date(featured.published_at).toLocaleDateString("en-US", { day: "2-digit", weekday: "short", month: "long", year: "numeric" }).toUpperCase()
    : "";
  const keywords = [
    ...featured.genres.slice(0, 1).map(g => g.name),
    title,
  ];

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <Link href={href} className="group inline-flex items-center gap-2">
          <span>{emoji}</span>
          <h2 className="font-bold group-hover:text-orange-500 transition-colors"
            style={{ fontFamily: "'Noto Serif JP', serif", fontWeight: 700, fontSize: "0.95rem", color: "#1a1714" }}>
            {title}
          </h2>
        </Link>
        <Link href={href}
          className="text-[11px] tracking-widest hover:text-orange-500 transition-colors"
          style={{ color: "#aaa", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
          MORE →
        </Link>
      </div>

      {/* フルワイドヒーロー */}
      <Link href={`/videos/${featured.id}`}
        className="group relative block rounded-2xl overflow-hidden mb-4"
        style={{ background: "#1a1714" }}>
        <div className="relative aspect-[16/7] w-full">
          {featured.thumbnail_url && (
            <Image src={featured.thumbnail_url} alt={featured.title} fill
              sizes="100vw"
              className="object-cover opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
          )}
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(26,23,20,0.85) 0%, rgba(26,23,20,0.4) 55%, rgba(26,23,20,0.1) 100%)" }} />
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-10 max-w-xl">
            {date && (
              <p className="text-[10px] tracking-[0.2em] mb-2"
                style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                {date}
              </p>
            )}
            <div className="flex gap-2 mb-3">
              {keywords.map((k, i) => (
                <span key={i} className="text-[10px] tracking-[0.1em] px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(249,115,22,0.85)", color: "#fff", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                  {k}
                </span>
              ))}
            </div>
            <h2 className="text-xl md:text-2xl font-bold leading-snug mb-4 line-clamp-3"
              style={{ color: "#fff", fontFamily: "'Noto Serif JP', serif", fontWeight: 700, letterSpacing: "0.01em" }}>
              {featured.title}
            </h2>
            {featured.influencer && (
              <div className="flex items-center gap-2">
                {featured.influencer.avatar_url && (
                  <Image src={featured.influencer.avatar_url} alt={featured.influencer.name}
                    width={24} height={24} className="rounded-full object-cover" />
                )}
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                  {featured.influencer.name}
                </p>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* 下段: 小カード6枚 */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {rest.slice(0, 6).map((v) => <VideoCard key={v.id} video={v} />)}
      </div>
    </section>
  );
}

// ===== 料理で探すセクション =====
function DishExplorer({ dishThumbs }: {
  dishThumbs: { slug: string; name: string; emoji: string; thumb: string | null }[];
}) {
  return (
    <div className="rounded-2xl py-10 px-8 mb-12"
      style={{ background: "#fff", border: "1px solid #ede8e0" }}>
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <p className="text-[10px] tracking-[0.25em] uppercase mb-2"
          style={{ color: "#f97316", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
          ·料理で探す·
        </p>
        <h2 className="text-2xl md:text-3xl font-black tracking-wider mb-3"
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", color: "#1a1714", letterSpacing: "0.05em" }}>
          RECIPE BY DISH
        </h2>
        <p className="text-sm" style={{ color: "#999", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
          食べたい料理から動画を探そう
        </p>
      </div>

      {/* 料理グリッド */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
        {dishThumbs.map((d) => (
          <Link key={d.slug} href={`/videos?dish=${d.slug}`} className="group flex flex-col items-center gap-2">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden border-2 border-transparent group-hover:border-orange-400 transition-all duration-200"
              style={{ background: "#f0ebe3" }}>
              {d.thumb ? (
                <Image src={d.thumb} alt={d.name} fill
                  sizes="(max-width: 640px) 25vw, 12vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300 opacity-90 group-hover:opacity-100" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-3xl">{d.emoji}</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <span className="text-xs text-center group-hover:text-orange-500 transition-colors"
              style={{ color: "#555", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 400 }}>
              {d.name}
            </span>
          </Link>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link href="/videos"
          className="inline-block w-full max-w-md py-4 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "#f97316", color: "#fff", fontFamily: "'Noto Sans JP', sans-serif", letterSpacing: "0.05em" }}>
          すべての動画を見る →
        </Link>
      </div>
    </div>
  );
}

// ===== セクション区切り =====
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 mt-2">
      <span className="text-[9px] tracking-[0.25em] uppercase"
        style={{ color: "#f97316", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #f9d4b8, transparent)" }} />
    </div>
  );
}

// ===== 掲載中YouTuberセクション =====
function InfluencerSection({ influencers }: { influencers: Influencer[] }) {
  if (influencers.length === 0) return null;
  return (
    <section className="py-16 px-4" style={{ background: "#fff", borderTop: "1px solid #ede8e0" }}>
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-10">
          <p className="text-[10px] tracking-[0.25em] uppercase mb-2"
            style={{ color: "#f97316", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
            · Creator ·
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider mb-2"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", color: "#1a1714", letterSpacing: "0.05em" }}>
            FEATURED YOUTUBERS
          </h2>
          <p className="text-sm" style={{ color: "#999", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
            掲載中のクリエイター
          </p>
        </div>

        {/* クリエイターグリッド */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-6">
          {influencers.map((inf) => (
            <Link key={inf.id} href={`/videos?q=${encodeURIComponent(inf.name)}`}
              className="group flex flex-col items-center gap-3">
              {/* 円形アバター */}
              <div className="relative w-full aspect-square rounded-full overflow-hidden border-2 border-transparent group-hover:border-orange-400 transition-all duration-200"
                style={{ background: "#f0ebe3", maxWidth: "120px" }}>
                {inf.avatar_url ? (
                  <Image src={inf.avatar_url} alt={inf.name} fill
                    sizes="120px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">👨‍🍳</div>
                )}
              </div>
              {/* 名前 */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-0.5">
                  <span className="text-[10px]" style={{ color: "#f97316" }}>⊙</span>
                  <p className="text-xs font-medium leading-snug line-clamp-2 text-center group-hover:text-orange-500 transition-colors"
                    style={{ color: "#1a1714", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
                    {inf.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== フッター =====
function Footer() {
  return (
    <footer style={{ background: "#1a1714", color: "#fff" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* ロゴ＋キャッチ */}
          <div>
            <Logo size="sm" color="#fff" />
            <p className="mt-3 text-xs leading-relaxed"
              style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300, maxWidth: "240px" }}>
              料理系クリエイターの動画を<br />ジャンル・食材・料理名で探せるポータル
            </p>
          </div>

          {/* ナビ */}
          <div className="flex gap-12">
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase mb-3"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                Explore
              </p>
              <ul className="space-y-2">
                {[
                  { href: "/videos", label: "すべての動画" },
                  { href: "/videos?genre=japanese", label: "和食" },
                  { href: "/videos?genre=italian", label: "イタリアン" },
                  { href: "/videos?situation=quick", label: "時短・簡単" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}
                      className="text-xs hover:text-orange-400 transition-colors"
                      style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase mb-3"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                Dish
              </p>
              <ul className="space-y-2">
                {[
                  { href: "/videos?dish=karaage", label: "唐揚げ" },
                  { href: "/videos?dish=hambagu", label: "ハンバーグ" },
                  { href: "/videos?dish=curry", label: "カレー" },
                  { href: "/videos?dish=donburi", label: "丼" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}
                      className="text-xs hover:text-orange-400 transition-colors"
                      style={{ color: "rgba(255,255,255,0.55)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* コピーライト */}
        <div className="mt-10 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] text-center"
            style={{ color: "rgba(255,255,255,0.2)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 300 }}>
            © {new Date().getFullYear()} Your Recipe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ===== メインページ =====
export default async function Home() {
  const [allVideos, influencers] = await Promise.all([getAllVideos(), getInfluencers()]);

  // ヒーロー：最新20件からランダム
  const heroPool = allVideos.filter(v => v.thumbnail_url).slice(0, 20);
  const heroIndex = Math.floor(Math.random() * heroPool.length);
  const heroVideo = heroPool[heroIndex] ?? allVideos[0];

  // ヒーロー下6枚：全体からシャッフルしてランダム表示
  const subPool = allVideos.filter(v => v !== heroVideo && v.thumbnail_url);
  const shuffled = [...subPool].sort(() => Math.random() - 0.5).slice(0, 6);

  const byDish = (slug: string) => allVideos.filter((v) => v.dishes.some((d) => d.slug === slug));
  const byGenre = (slug: string) => allVideos.filter((v) => v.genres.some((g) => g.slug === slug));
  const bySituation = (slug: string) => allVideos.filter((v) => v.situations.some((s) => s.slug === slug));

  // 料理で探すセクション：各料理のランダムサムネ
  const dishThumbs = DISHES.map((d) => {
    const vids = byDish(d.slug).filter(v => v.thumbnail_url);
    const pick = vids.length > 0 ? vids[Math.floor(Math.random() * vids.length)] : null;
    return { ...d, thumb: pick?.thumbnail_url ?? null };
  });

  return (
    <div className="min-h-screen" style={{ background: "#faf8f5" }}>
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex gap-8">
          <Sidebar />

          <main className="flex-1 min-w-0">

            {/* ヒーロー */}
            {heroVideo && <HeroVideo video={heroVideo} />}

            {/* ランダム6枚 */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-12">
              {shuffled.map((v) => (
                <VideoCard key={v.id} video={v} />
              ))}
            </div>

            {/* 料理で探すセクション */}
            <DishExplorer dishThumbs={dishThumbs} />

            {/* BY DISH */}
            <SectionLabel label="By Dish" />
            {DISHES.map((d) => (
              <VideoRow key={d.slug} title={d.name} emoji={d.emoji}
                href={`/videos?dish=${d.slug}`} videos={byDish(d.slug)} />
            ))}

            {/* BY GENRE */}
            <SectionLabel label="By Genre" />
            {GENRES.slice(0, 6).map((g) => (
              <VideoRow key={g.slug} title={g.name} emoji={g.emoji}
                href={`/videos?genre=${g.slug}`} videos={byGenre(g.slug)} />
            ))}

            {/* BY SITUATION */}
            <SectionLabel label="By Situation" />
            {SITUATIONS.slice(0, 6).map((s) =>
              s.slug === "quick" ? (
                <VideoRowHero key={s.slug} title={s.name} emoji={s.emoji}
                  href={`/videos?situation=${s.slug}`} videos={bySituation(s.slug)} />
              ) : (
                <VideoRow key={s.slug} title={s.name} emoji={s.emoji}
                  href={`/videos?situation=${s.slug}`} videos={bySituation(s.slug)} />
              )
            )}

          </main>
        </div>
      </div>

      {/* 掲載中YouTuber */}
      <InfluencerSection influencers={influencers} />

      {/* フッター */}
      <Footer />
    </div>
  );
}
