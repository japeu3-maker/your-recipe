"use client";

import { useEffect, useState } from "react";
import type { Influencer, Platform } from "@/types";
import { PlusCircle, Trash2, Play, Pencil, X, Check } from "lucide-react";

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
};

export default function AdminInfluencers() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", platform: "youtube" as Platform, channel_id: "", handle: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", platform: "youtube" as Platform, channel_id: "", handle: "" });

  useEffect(() => { loadInfluencers(); }, []);

  async function loadInfluencers() {
    setLoading(true);
    const res = await fetch("/api/admin/influencers");
    const data = await res.json();
    setInfluencers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/influencers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "エラーが発生しました");
    } else {
      setForm({ name: "", platform: "youtube", channel_id: "", handle: "" });
      setShowForm(false);
      loadInfluencers();
    }
    setSaving(false);
  }

  function startEdit(inf: Influencer) {
    setEditingId(inf.id);
    setEditForm({
      name: inf.name,
      platform: inf.platform,
      channel_id: inf.channel_id ?? "",
      handle: inf.handle ?? "",
    });
  }

  async function handleEdit(id: string) {
    const res = await fetch("/api/admin/influencers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    if (res.ok) {
      setEditingId(null);
      loadInfluencers();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("削除しますか？")) return;
    await fetch("/api/admin/influencers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadInfluencers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">インフルエンサー管理</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <PlusCircle size={16} /> 追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-900">新しいインフルエンサー</h2>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">名前</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">プラットフォーム</label>
              <select value={form.platform} onChange={e => setForm(f => ({...f, platform: e.target.value as Platform}))}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
            {form.platform === "youtube" && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">チャンネルID</label>
                <input value={form.channel_id} onChange={e => setForm(f => ({...f, channel_id: e.target.value}))}
                  placeholder="UCxxxxxxxxxx" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ハンドル（@名前）</label>
              <input value={form.handle} onChange={e => setForm(f => ({...f, handle: e.target.value}))}
                placeholder="@influencer" className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded-lg text-sm">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">名前</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">プラットフォーム</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">チャンネルID / ハンドル</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">最終収集</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {influencers.map((inf) => (
                <tr key={inf.id} className="hover:bg-gray-50">
                  {editingId === inf.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm" />
                      </td>
                      <td className="px-4 py-2">
                        <select value={editForm.platform} onChange={e => setEditForm(f => ({...f, platform: e.target.value as Platform}))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm">
                          <option value="youtube">YouTube</option>
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input value={editForm.channel_id} onChange={e => setEditForm(f => ({...f, channel_id: e.target.value}))}
                          placeholder="UCxxxxxxxxxx" className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-mono" />
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs">—</td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(inf.id)}
                            className="text-green-600 hover:text-green-700 p-1 rounded hover:bg-green-50">
                            <Check size={15} />
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                            <X size={15} />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 font-medium text-gray-900">{inf.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          inf.platform === "youtube" ? "bg-red-100 text-red-700" :
                          inf.platform === "instagram" ? "bg-pink-100 text-pink-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {inf.platform === "youtube" && <Play size={10} />}
                          {PLATFORM_LABELS[inf.platform]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{inf.channel_id ?? inf.handle ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {(inf as Influencer & { last_collected_at?: string }).last_collected_at
                          ? new Date((inf as Influencer & { last_collected_at?: string }).last_collected_at!).toLocaleDateString("ja-JP")
                          : "未収集"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => startEdit(inf)}
                            className="text-gray-400 hover:text-blue-500 transition-colors p-1 rounded hover:bg-blue-50">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(inf.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {influencers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">インフルエンサーがいません。「追加」ボタンから登録してください。</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
