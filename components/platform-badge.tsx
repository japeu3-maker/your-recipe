import type { Platform } from "@/types";
import { Play } from "lucide-react";

const PLATFORM_CONFIG: Record<Platform, { label: string; className: string }> = {
  youtube: { label: "YouTube", className: "bg-red-100 text-red-600" },
  instagram: { label: "Instagram", className: "bg-pink-100 text-pink-600" },
  tiktok: { label: "TikTok", className: "bg-gray-100 text-gray-600" },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const config = PLATFORM_CONFIG[platform];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      {platform === "youtube" && <Play size={10} />}
      {config.label}
    </span>
  );
}
