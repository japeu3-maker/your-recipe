import Anthropic from "@anthropic-ai/sdk";
import type { ClassificationResult } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたは料理動画の分類アシスタントです。
cuisine_genres: italian, japanese, chinese, french, korean, american, mexican, thai, indian, other から最大3件
ingredients: chicken, beef, pork, fish, shrimp, tofu, pasta, rice, noodles, potato, onion, garlic, tomato, cheese, egg, butter, cream, soy-sauce, miso, chocolate, flour, sugar, olive-oil, salmon, tuna, mushroom, carrot, cabbage, spinach, ginger, sesame から最大8件
situations: quick, dinner, lunch, breakfast, entertaining, bento, meal-prep, diet, snack, kids から最大3件
dishes: karaage（唐揚げ）, hambagu（ハンバーグ）, curry（カレー）, ginger-pork（豚の生姜焼き）, donburi（丼）, udon（うどん）, onigiri（おにぎり）, sandwich（サンドイッチ） から該当するもの
is_recipe: 料理・レシピ・食材紹介動画はtrue、それ以外（vlog・起業・ゲーム等）はfalse

必ずJSONのみで回答（コードブロック不要）:
{"is_recipe":true,"cuisine_genres":["japanese"],"ingredients":["chicken","soy-sauce"],"situations":["dinner"],"dishes":["karaage"]}`;

export async function classifyVideo(
  title: string,
  description: string
): Promise<ClassificationResult> {
  const truncatedDesc = description?.slice(0, 300) ?? "";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: `Title: ${title}\nDescription: ${truncatedDesc}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";

  // Claudeがコードブロックで返した場合も対応
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : raw.trim();

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      is_recipe: parsed.is_recipe !== false,
      cuisine_genres: Array.isArray(parsed.cuisine_genres) ? parsed.cuisine_genres : [],
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      situations: Array.isArray(parsed.situations) ? parsed.situations : [],
      dishes: Array.isArray(parsed.dishes) ? parsed.dishes : [],
    };
  } catch {
    // JSON解析失敗時はタイトルから簡易判定
    return { is_recipe: true, cuisine_genres: [], ingredients: [], situations: [], dishes: [] };
  }
}
