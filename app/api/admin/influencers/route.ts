import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("influencers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createServiceClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("influencers")
    .insert({
      name: body.name,
      platform: body.platform,
      channel_id: body.channel_id || null,
      handle: body.handle || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServiceClient();
  const { id, name, platform, channel_id, handle } = await request.json();

  const { error } = await supabase
    .from("influencers")
    .update({ name, platform, channel_id: channel_id || null, handle: handle || null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServiceClient();
  const { id } = await request.json();

  const { error } = await supabase.from("influencers").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
