export type Platform = "youtube" | "instagram" | "tiktok";

export interface Influencer {
  id: string;
  name: string;
  platform: Platform;
  channel_id: string | null;
  handle: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Genre {
  id: number;
  slug: string;
  name: string;
}

export interface Ingredient {
  id: number;
  slug: string;
  name: string;
}

export interface Video {
  id: string;
  platform: Platform;
  platform_id: string;
  url: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  duration_sec: number | null;
  influencer_id: string | null;
  ai_classified: boolean;
  is_reviewed: boolean;
  is_published: boolean;
  created_at: string;
}

export interface VideoWithRelations extends Video {
  influencer: Influencer | null;
  genres: Genre[];
  ingredients: Ingredient[];
  situations: Situation[];
  dishes: Dish[];
}

export interface Situation {
  id: number;
  slug: string;
  name: string;
}

export interface CollectionLog {
  id: number;
  influencer_id: string | null;
  triggered_by: string;
  videos_found: number;
  videos_added: number;
  error_message: string | null;
  ran_at: string;
}

export interface Dish {
  id: number;
  slug: string;
  name: string;
}

export interface ClassificationResult {
  is_recipe: boolean;
  cuisine_genres: string[];
  ingredients: string[];
  situations: string[];
  dishes: string[];
}

export interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSec: number | null;
  channelId: string;
  channelTitle: string;
}
