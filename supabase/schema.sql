-- ================================================================
-- Your Recipe: Supabase Schema
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================================

-- インフルエンサー
create table influencers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  platform     text not null check (platform in ('youtube','instagram','tiktok')),
  channel_id   text,
  handle       text,
  avatar_url   text,
  is_active    boolean default true,
  last_collected_at timestamptz,
  created_at   timestamptz default now()
);

-- ジャンルマスタ
create table genres (
  id    serial primary key,
  slug  text unique not null,
  name  text not null
);

-- 食材マスタ
create table ingredients (
  id    serial primary key,
  slug  text unique not null,
  name  text not null
);

-- 動画（メインテーブル）
create table videos (
  id              uuid primary key default gen_random_uuid(),
  platform        text not null check (platform in ('youtube','instagram','tiktok')),
  platform_id     text not null,
  url             text not null,
  title           text not null,
  description     text,
  thumbnail_url   text,
  published_at    timestamptz,
  duration_sec    int,
  influencer_id   uuid references influencers(id) on delete set null,
  ai_classified   boolean default false,
  ai_raw_response text,
  is_reviewed     boolean default false,
  is_published    boolean default true,
  unique (platform, platform_id),
  created_at      timestamptz default now()
);

-- 動画↔ジャンル（多対多）
create table video_genres (
  video_id  uuid references videos(id) on delete cascade,
  genre_id  int references genres(id) on delete cascade,
  source    text default 'ai' check (source in ('ai','manual')),
  primary key (video_id, genre_id)
);

-- 動画↔食材（多対多）
create table video_ingredients (
  video_id      uuid references videos(id) on delete cascade,
  ingredient_id int references ingredients(id) on delete cascade,
  source        text default 'ai' check (source in ('ai','manual')),
  primary key (video_id, ingredient_id)
);

-- シチュエーションマスタ
create table situations (
  id    serial primary key,
  slug  text unique not null,
  name  text not null
);

-- 動画↔シチュエーション（多対多）
create table video_situations (
  video_id     uuid references videos(id) on delete cascade,
  situation_id int references situations(id) on delete cascade,
  source       text default 'ai' check (source in ('ai','manual')),
  primary key (video_id, situation_id)
);

create index on video_situations(situation_id);

alter table situations enable row level security;
create policy "public read" on situations for select using (true);

alter table video_situations enable row level security;
create policy "public read" on video_situations for select using (true);

-- 収集ログ
create table collection_logs (
  id             serial primary key,
  influencer_id  uuid references influencers(id) on delete set null,
  triggered_by   text not null default 'admin',
  videos_found   int default 0,
  videos_added   int default 0,
  error_message  text,
  ran_at         timestamptz default now()
);

-- 管理者プロフィール
create table profiles (
  id       uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean default false
);

-- ================================================================
-- Indexes
-- ================================================================
create index on videos(platform);
create index on videos(influencer_id);
create index on videos(is_published, published_at desc);
create index on videos(ai_classified);
create index on video_genres(genre_id);
create index on video_ingredients(ingredient_id);

-- ================================================================
-- Row Level Security
-- ================================================================
alter table videos enable row level security;
create policy "public read" on videos for select using (is_published = true);

alter table genres enable row level security;
create policy "public read" on genres for select using (true);

alter table ingredients enable row level security;
create policy "public read" on ingredients for select using (true);

alter table video_genres enable row level security;
create policy "public read" on video_genres for select using (true);

alter table video_ingredients enable row level security;
create policy "public read" on video_ingredients for select using (true);

alter table influencers enable row level security;
create policy "public read" on influencers for select using (is_active = true);

-- ================================================================
-- Seed: Genres（ジャンル）
-- ================================================================
insert into genres (slug, name) values
  ('japanese', '和食'),
  ('italian', 'イタリアン'),
  ('chinese', '中華'),
  ('french', 'フレンチ'),
  ('korean', '韓国料理'),
  ('american', 'アメリカン'),
  ('mexican', 'メキシカン'),
  ('thai', 'タイ料理'),
  ('indian', 'インド料理'),
  ('other', 'その他');

-- ================================================================
-- ================================================================
-- Seed: Situations（シチュエーション）
-- ================================================================
insert into situations (slug, name) values
  ('quick', '時短・簡単'),
  ('entertaining', 'おもてなし'),
  ('bento', 'お弁当'),
  ('diet', 'ダイエット'),
  ('meal-prep', '作り置き'),
  ('snack', 'おつまみ'),
  ('breakfast', '朝ごはん'),
  ('lunch', '昼ごはん'),
  ('dinner', '夜ごはん'),
  ('kids', '子供向け');

-- ================================================================
-- Seed: Ingredients（食材）
-- ================================================================
insert into ingredients (slug, name) values
  ('chicken', '鶏肉'),
  ('beef', '牛肉'),
  ('pork', '豚肉'),
  ('fish', '魚'),
  ('shrimp', 'エビ'),
  ('tofu', '豆腐'),
  ('pasta', 'パスタ'),
  ('rice', 'ご飯'),
  ('noodles', '麺'),
  ('potato', 'じゃがいも'),
  ('onion', '玉ねぎ'),
  ('garlic', 'にんにく'),
  ('tomato', 'トマト'),
  ('cheese', 'チーズ'),
  ('egg', '卵'),
  ('butter', 'バター'),
  ('cream', '生クリーム'),
  ('soy-sauce', '醤油'),
  ('miso', '味噌'),
  ('chocolate', 'チョコレート'),
  ('flour', '小麦粉'),
  ('sugar', '砂糖'),
  ('olive-oil', 'オリーブオイル'),
  ('salmon', 'サーモン'),
  ('tuna', 'マグロ'),
  ('mushroom', 'きのこ'),
  ('carrot', 'にんじん'),
  ('cabbage', 'キャベツ'),
  ('spinach', 'ほうれん草'),
  ('ginger', '生姜'),
  ('sesame', 'ごま');
