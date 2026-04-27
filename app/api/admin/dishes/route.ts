import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServiceClient();
  const { data } = await supabase.from("dishes").select("*").order("id");
  return NextResponse.json(data ?? []);
}
