interface LogoProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizes = {
  sm: { kana: "1.4rem", en: "0.55rem", gap: "4px" },
  md: { kana: "2.5rem", en: "0.9rem", gap: "8px" },
  lg: { kana: "5rem",   en: "1.8rem", gap: "14px" },
};

export function Logo({ size = "md", color = "#1a1714" }: LogoProps) {
  const s = sizes[size];
  return (
    <div style={{ textAlign: "center", lineHeight: 1, userSelect: "none" }}>
      <div style={{
        fontFamily: "'Reggae One', sans-serif",
        fontSize: s.kana,
        letterSpacing: "0.01em",
        color,
        lineHeight: 1,
      }}>
        ユアレシピ
      </div>
      <div style={{
        marginTop: s.gap,
        fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
        fontWeight: 800,
        fontSize: s.en,
        letterSpacing: "0.01em",
        color,
        lineHeight: 1,
      }}>
        Your Recipe
      </div>
    </div>
  );
}
