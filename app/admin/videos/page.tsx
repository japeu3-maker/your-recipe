"use client";

import { useEffect, useState, useCallback } from "react";
import type { Genre, Ingredient, Dish } from "@/types";
import Image from "next/image";
import { CheckCircle, Clock, Eye, EyeOff } from "lucide-react";

interface AdminVideo {
  id: string;
  platform: string;
  title: string;
  thumbnail_url: string | null;
  ai_classified: boolean;
  is_reviewed: boolean;
  is_published: boolean;
  genres: { genre_id: number }[];
  ingredients: { ingredient_id: number }[];
  dishes: { dish_id: number }[];
}

export default function AdminVideos() {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [allGenres, setAllGenres] = useState<Genre[]>([]);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editGenres, setEditGenres] = useState<number[]>([]);
  const [editIngredients, setEditIngredients] = useState<number[]>([]);
  const [editDishes, setEditDishes] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const [videosRes, genresRes, ingredientsRes, dishesRes] = await Promise.all([
      fetch("/api/admin/videos"),
      fetch("/api/admin/genres"),
      fetch("/api/admin/ingredients"),
      fetch("/api/admin/dishes"),
    ]);
    const [vids, genres, ingredients, dishes] = await Promise.all([
      videosRes.json(),
      genresRes.json(),
      ingredientsRes.json(),
      dishesRes.json(),
    ]);
    setVideos((Array.isArray(vids) ? vids : []).map((v: Record<string, unknown>) => ({
      ...v,
      genres: (v.video_genres as { genre_id: number }[] ?? []),
      ingredients: (v.video_ingredients as { ingredient_id: number }[] ?? []),
      dishes: (v.video_dishes as { dish_id: number }[] ?? []),
    })) as AdminVideo[]);
    setAllGenres(Array.isArray(genres) ? genres : []);
    setAllIngredients(Array.isArray(ingredients) ? ingredients : []);
    setAllDishes(Array.isArray(dishes) ? dishes : []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function startEdit(video: AdminVideo) {
    setEditingId(video.id);
    setEditGenres(video.genres.map((g) => g.genre_id));
    setEditIngredients(video.ingredients.map((i) => i.ingredient_id));
    setEditDishes(video.dishes.map((d) => d.dish_id));
  }

  async function saveEdit(videoId: string) {
    setSaving(true);
    await fetch("/api/admin/update-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        video_id: videoId,
        genre_ids: editGenres,
        ingredient_ids: editIngredients,
        dish_ids: editDishes,
      }),
    });
    setSaving(false);
    setEditingId(null);
    loadData();
  }

  async function togglePublished(video: AdminVideo) {
    await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: video.id, is_published: !video.is_published }),
    });
    loadData();
  }

  const genreMap = new Map(allGenres.map((g) => [g.id, g.name]));
  const ingredientMap = new Map(allIngredients.map((i) => [i.id, i.name]));
  const dishMap = new Map(allDishes.map((d) => [d.id, d.name]));

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">動画管理・AI分類補正</h1>
      <div className="space-y-3">
        {videos.map((video) => (
          <div key={video.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex gap-4">
              {video.thumbnail_url && (
                <Image src={video.thumbnail_url} alt={video.title} width={120} height={68}
                  className="rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <p className="font-medium text-gray-900 text-sm line-clamp-2 flex-1">{video.title}</p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {video.ai_classified
                      ? <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle size={10} />分類済み</span>
                      : <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><Clock size={10} />分類待ち</span>
                    }
                    {video.is_reviewed && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">レビュー済み</span>
                    )}
                  </div>
                </div>

                {editingId === video.id ? (
                  <div className="space-y-3">
                    {/* ジャンル */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1.5">ジャンル</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allGenres.map((g) => (
                          <button key={g.id} type="button"
                            onClick={() => setEditGenres(prev => prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id])}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${editGenres.includes(g.id) ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-300 hover:border-orange-300"}`}>
                            {g.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 料理で探す */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1.5">料理で探す</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allDishes.map((d) => (
                          <button key={d.id} type="button"
                            onClick={() => setEditDishes(prev => prev.includes(d.id) ? prev.filter(x => x !== d.id) : [...prev, d.id])}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${editDishes.includes(d.id) ? "bg-yellow-500 text-white border-yellow-500" : "bg-white text-gray-600 border-gray-300 hover:border-yellow-300"}`}>
                            {d.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 食材 */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1.5">食材</p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {allIngredients.map((ing) => (
                          <button key={ing.id} type="button"
                            onClick={() => setEditIngredients(prev => prev.includes(ing.id) ? prev.filter(x => x !== ing.id) : [...prev, ing.id])}
                            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${editIngredients.includes(ing.id) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-300 hover:border-blue-300"}`}>
                            {ing.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(video.id)} disabled={saving}
                        className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg disabled:opacity-50">
                        {saving ? "保存中..." : "保存"}
                      </button>
                      <button onClick={() => setEditingId(null)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg">
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {video.genres.map((g) => (
                      <span key={g.genre_id} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{genreMap.get(g.genre_id)}</span>
                    ))}
                    {video.dishes.map((d) => (
                      <span key={d.dish_id} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{dishMap.get(d.dish_id)}</span>
                    ))}
                    {video.ingredients.map((i) => (
                      <span key={i.ingredient_id} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{ingredientMap.get(i.ingredient_id)}</span>
                    ))}
                    <button onClick={() => startEdit(video)}
                      className="text-xs text-blue-600 hover:text-blue-700 underline ml-1">
                      タグを編集
                    </button>
                    <button onClick={() => togglePublished(video)}
                      className={`text-xs flex items-center gap-1 ml-auto ${video.is_published ? "text-gray-400 hover:text-red-500" : "text-green-600 hover:text-green-700"}`}>
                      {video.is_published ? <><EyeOff size={12} />非公開にする</> : <><Eye size={12} />公開する</>}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {videos.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-12">動画がありません</p>
        )}
      </div>
    </div>
  );
}
