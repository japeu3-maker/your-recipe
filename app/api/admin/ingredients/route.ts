import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("ingredients").select("*").order("name");
  return NextResponse.json(data ?? []);
}
