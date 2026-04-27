"use client";

import { useEffect, useState } from "react";
import { RefreshCw, CheckCircle, XCircle, Zap, RotateCcw, Trash2, PlusCircle } from "lucide-react";

interface Influencer {
  id: string;
  name: string;
  channel_id: string | null;
  platform: string;
  last_collected_at: string | null;
}

interface CollectResult {
  influencer_id: string;
  name: string;
  videos_found: number;
  videos_added: number;
  error: string | null;
}

export default function AdminCollect() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [collecting, setCollecting] = useState<string | null>(null);
  const [results, setResults] = useState<CollectResult[]>([]);
  const [classifying, setClassifying] = useState(false);
  const [classifyResult, setClassifyResult] = useState<{ classified: number; remaining: number } | null>(null);
  const [unclassifiedCount, setUnclassifiedCount] = useState<number>(0);
  const [resetting, setResetting] = useState(false);
  const [addUrl, setAddUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<{ success?: boolean; name?: string; error?: string } | null>(null);

  useEffect(() => {
    loadInfluencers();
    loadUnclassifiedCount();
  }, []);

  async function loadInfluencers() {
    const res = await fetch("/api/admin/influencers");
    const data = await res.json();
    setInfluencers((Array.isArray(data) ? data : []).filter((i: Influencer) => i.platform === "youtube"));
  }

  async function loadUnclassifiedCount() {
    const res = await fetch("/api/admin/influencers"); // reuse to get count via videos API
    // Get unclassified count separately
    const res2 = await fetch("/api/admin/stats");
    if (res2.ok) {
      const d = await res2.json();
      setUnclassifiedCount(d.unclassified ?? 0);
    }
  }

  async function handleCollect(inf: Influencer, resetDate = false) {
    setCollecting(inf.id);
    try {
      const res = await fetch("/api/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ influencer_id: inf.id, reset_date: resetDate }),
      });
      const data = await res.json();
      setResults((prev) => [
        { influencer_id: inf.id, name: inf.name, ...data },
        ...prev,
      ]);
      loadInfluencers();
      loadUnclassifiedCount();
    } catch (err) {
      setResults((prev) => [
        { influencer_id: inf.id, name: inf.name, videos_found: 0, videos_added: 0, error: String(err) },
        ...prev,
      ]);
    }
    setCollecting(null);
  }

  async function handleReset() {
    if (!confirm("全動画の分類タグをリセットします。よろしいですか？")) return;
    setResetting(true);
    const res = await fetch("/api/admin/reset-classifications", { method: "POST" });
    const data = await res.json();
    setClassifyResult(null);
    setUnclassifiedCount(data.unclassified ?? 0);
    setResetting(false);
  }

  async function handleBatchClassify() {
    setClassifying(true);
    setClassifyResult(null);
    let totalClassified = 0;
    let remaining = 0;
    try {
      // 残り0になるまで自動でループ
      while (true) {
        const res = await fetch("/api/classify/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: 50 }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        totalClassified += data.classified ?? 0;
        remaining = data.remaining ?? 0;
        // 進捗をリアルタイム表示
        setClassifyResult({ classified: totalClassified, remaining });
        if (remaining === 0 || (data.classified ?? 0) === 0) break;
      }
    } catch (err) {
      console.error(err);
      setClassifyResult({ classified: totalClassified, remaining: -1 });
    }
    setClassifying(false);
    loadUnclassifiedCount();
  }

  async function handleAddInfluencer(e: React.FormEvent) {
    e.preventDefault();
    if (!addUrl.trim()) return;
    setAdding(true);
    setAddResult(null);
    try {
      const res = await fetch("/api/admin/add-influencer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: addUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddResult({ error: data.error });
      } else {
        setAddResult({ success: true, name: data.influencer.name });
        setAddUrl("");
        loadInfluencers();
      }
    } catch (err) {
      setAddResult({ error: String(err) });
    }
    setAdding(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">YouTube動画収集</h1>

      {/* YouTuber URL追加フォーム */}
      <div className="bg-white border border-orange-100 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <PlusCircle size={16} className="text-orange-500" />
          YouTuberを追加
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          YouTubeのURLを貼るだけで自動登録します
          <span className="text-xs text-gray-400 ml-2">例: https://www.youtube.com/@ryuji825</span>
        </p>
        <form onSubmit={handleAddInfluencer} className="flex gap-2">
          <input
            type="text"
            value={addUrl}
            onChange={(e) => setAddUrl(e.target.value)}
            placeholder="https://www.youtube.com/@チャンネル名"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
          />
          <button
            type="submit"
            disabled={adding || !addUrl.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 shrink-0"
          >
            {adding ? "取得中..." : "追加"}
          </button>
        </form>
        {addResult && (
          <p className={`text-sm mt-2 font-medium ${addResult.success ? "text-green-600" : "text-red-600"}`}>
            {addResult.success ? `✓ 「${addResult.name}」を追加しました！` : `⚠️ ${addResult.error}`}
          </p>
        )}
      </div>

      {/* Influencer collect section */}
      <div className="space-y-3 mb-8">
        {influencers.length === 0 && (
          <p className="text-gray-500 text-sm">YouTubeインフルエンサーがいません。先にインフルエンサーを追加してください。</p>
        )}
        {influencers.map((inf) => (
          <div key={inf.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div>
              <p className="font-medium text-gray-900 text-sm">{inf.name}</p>
              <p className="text-xs text-gray-400 font-mono">{inf.channel_id}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                最終収集: {inf.last_collected_at
                  ? new Date(inf.last_collected_at).toLocaleString("ja-JP")
                  : "未収集"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCollect(inf, true)}
                disabled={collecting === inf.id}
                title="last_collected_atをリセットして全件再収集"
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs disabled:opacity-50"
              >
                <RotateCcw size={12} className={collecting === inf.id ? "animate-spin" : ""} />
                全件再収集
              </button>
              <button
                onClick={() => handleCollect(inf, false)}
                disabled={collecting === inf.id}
                className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
              >
                <RefreshCw size={13} className={collecting === inf.id ? "animate-spin" : ""} />
                {collecting === inf.id ? "収集中..." : "新着収集"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reset section */}
      <div className="bg-white border border-red-100 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">分類リセット</h2>
            <p className="text-sm text-gray-500 mt-0.5">全動画のタグをクリアして再分類できる状態にする</p>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Trash2 size={14} className={resetting ? "animate-pulse" : ""} />
            {resetting ? "リセット中..." : "分類をリセット"}
          </button>
        </div>
      </div>

      {/* Batch classify section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">AI一括分類</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              未分類の動画にジャンル・食材・シチュエーションを自動タグ付け
            </p>
            {classifyResult && (
              <p className={`text-sm mt-1 font-medium ${classifyResult.remaining === -1 ? "text-red-600" : "text-green-600"}`}>
                {classifyResult.remaining === -1
                  ? "⚠️ エラーが発生しました。もう一度押してください"
                  : classifyResult.remaining > 0
                    ? `処理中... ${classifyResult.classified}件分類済み / 残り${classifyResult.remaining}件`
                    : `✓ ${classifyResult.classified}件を分類しました（完了）`
                }
              </p>
            )}
          </div>
          <button
            onClick={handleBatchClassify}
            disabled={classifying}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Zap size={14} className={classifying ? "animate-pulse" : ""} />
            {classifying ? "分類中..." : "一括分類を実行"}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 mb-3">収集結果</h2>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className={`flex items-start gap-3 border rounded-xl px-4 py-3 text-sm ${r.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
                {r.error
                  ? <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                  : <CheckCircle size={16} className="text-green-600 mt-0.5 shrink-0" />
                }
                <div>
                  <p className="font-medium text-gray-900">{r.name}</p>
                  {r.error
                    ? <p className="text-red-600 text-xs mt-0.5">{r.error}</p>
                    : <p className="text-gray-600 text-xs mt-0.5">発見: {r.videos_found}件 / 追加: {r.videos_added}件</p>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
