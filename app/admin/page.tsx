import { createClient } from "@/lib/supabase-server";
import { Video, Users, CheckCircle, Clock } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: totalVideos },
    { count: pendingClassification },
    { count: pendingReview },
    { count: totalInfluencers },
  ] = await Promise.all([
    supabase.from("videos").select("*", { count: "exact", head: true }),
    supabase.from("videos").select("*", { count: "exact", head: true }).eq("ai_classified", false),
    supabase.from("videos").select("*", { count: "exact", head: true }).eq("is_reviewed", false),
    supabase.from("influencers").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const stats = [
    { label: "総動画数", value: totalVideos ?? 0, icon: Video, color: "text-blue-600 bg-blue-50" },
    { label: "アクティブインフルエンサー", value: totalInfluencers ?? 0, icon: Users, color: "text-green-600 bg-green-50" },
    { label: "分類待ち", value: pendingClassification ?? 0, icon: Clock, color: "text-orange-600 bg-orange-50" },
    { label: "レビュー待ち", value: pendingReview ?? 0, icon: CheckCircle, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">ダッシュボード</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
