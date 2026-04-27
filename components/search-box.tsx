"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  size?: "sm" | "lg";
  placeholder?: string;
  defaultValue?: string;
}

export function SearchBox({ size = "sm", placeholder = "料理名・食材で検索...", defaultValue = "" }: SearchBoxProps) {
  const [query, setQuery] = useState(defaultValue);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/videos?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/videos");
    }
  }

  if (size === "lg") {
    return (
      <form onSubmit={handleSubmit} className="relative w-full max-w-xl mx-auto">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-5 pr-14 py-3.5 rounded-full border-2 outline-none transition-all text-sm"
          style={{
            borderColor: "#e8e0d5",
            background: "#fff",
            color: "#1a1714",
            fontFamily: "'Noto Sans JP', sans-serif",
            fontWeight: 300,
          }}
          onFocus={(e) => (e.target.style.borderColor = "#f97316")}
          onBlur={(e) => (e.target.style.borderColor = "#e8e0d5")}
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
          style={{ background: "#f97316" }}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="white" strokeWidth="1.5" />
            <path d="M9.5 9.5L13 13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="pl-3 pr-9 py-1.5 rounded-full border outline-none transition-all text-xs w-44 focus:w-56"
        style={{
          borderColor: "#e8e0d5",
          background: "#f5f0ea",
          color: "#1a1714",
          fontFamily: "'Noto Sans JP', sans-serif",
          fontWeight: 300,
          transition: "width 0.2s ease, border-color 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#f97316";
          e.target.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e8e0d5";
          e.target.style.background = "#f5f0ea";
        }}
      />
      <button
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 15 15" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </form>
  );
}
