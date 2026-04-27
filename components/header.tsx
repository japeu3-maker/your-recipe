import Link from "next/link";
import { Search, UtensilsCrossed } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-orange-500 text-lg shrink-0">
          <UtensilsCrossed size={22} />
          Your Recipe
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm text-gray-600">
          <Link href="/videos" className="hover:text-orange-500 transition-colors">動画一覧</Link>
          <Link href="/genres/japanese" className="hover:text-orange-500 transition-colors">和食</Link>
          <Link href="/genres/italian" className="hover:text-orange-500 transition-colors">イタリアン</Link>
          <Link href="/genres/korean" className="hover:text-orange-500 transition-colors">韓国料理</Link>
        </nav>
        <div className="flex-1" />
        <Link href="/videos" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5">
          <Search size={14} />
          検索・フィルター
        </Link>
      </div>
    </header>
  );
}
