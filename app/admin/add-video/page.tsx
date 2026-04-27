"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { Influencer } from "@/types";
import { PlusCircle, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminAddVideo() {
  const [url, setUrl] = useState("");
  const [influencerId, setInfluencerId] = useState("");
  const [description, setDescription] = useState("");
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("influencers").select("*").eq("is_active", true)
      .then(({ data }) => setInfluencers(data ?? []));
  }, []);

  function detectPlatform(url: string) {
    if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
    if (/instagram\.com/.test(url)) return "instagram";
    if (/tiktok\.com/.test(url)) return "tiktok";
    return null;
  }

  const platform = detectPlatform(url);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/add-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          influencer_id: influencerId || null,
          manual_description: description || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: "動画を追加しました。AI分類が実行されます。" });
        setUrl("");
        setDescription("");
        setInfluencerId("");
      } else {
        setResult({ success: false, message: data.error ?? "エラーが発生しました" });
      }
    } catch (err) {
      setResult({ success: false, message: String(err) });
    }
    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">動画を手動追加</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">動画URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube / Instagram / TikTokのURL"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            {url && (
              <p className="text-xs mt-1 text-gray-500">
                検出プラットフォーム:{" "}
                <span className={`font-medium ${platform ? "text-green-600" : "text-red-500"}`}>
                  {platform ?? "不明なURL"}
                </span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">インフルエンサー（任意）</label>
            <select
              value={influencerId}
              onChange={(e) => setInfluencerId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">選択しない</option>
              {influencers.map((inf) => (
                <option key={inf.id} value={inf.id}>{inf.name} ({inf.platform})</option>
              ))}
            </select>
          </div>

          {(platform === "instagram" || platform === "tiktok") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明文（AI分類精度向上のため任意で入力）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="動画の説明や使用食材などを入力すると分類精度が上がります"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
            </div>
          )}

          {result && (
            <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {result.success ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
              {result.message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !platform}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg text-sm disabled:opacity-50"
          >
            <PlusCircle size={16} />
            {loading ? "追加中..." : "動画を追加"}
          </button>
        </form>
      </div>
    </div>
  );
}
