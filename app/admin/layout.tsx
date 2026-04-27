import Link from "next/link";
import { LayoutDashboard, Video, Users, RefreshCw, PlusCircle, LogOut } from "lucide-react";

const navItems = [
  { href: "/admin", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/admin/videos", label: "動画管理", icon: Video },
  { href: "/admin/influencers", label: "インフルエンサー", icon: Users },
  { href: "/admin/collect", label: "YouTube収集", icon: RefreshCw },
  { href: "/admin/add-video", label: "動画を手動追加", icon: PlusCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-5 border-b border-gray-200">
          <Link href="/" className="text-lg font-bold text-orange-500">Your Recipe</Link>
          <p className="text-xs text-gray-500 mt-0.5">管理画面</p>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-gray-200">
          <Link
            href="/admin/login"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <LogOut size={14} />
            ログアウト
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
