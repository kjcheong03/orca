import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface TailoredGuidance {
  id: string;
  hazard: 'covid' | 'dengue';
  target: string;
  source: string;
  title: string;
  url: string;
  blurb: string | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hazard = searchParams.get('hazard');
  const targetsParam = searchParams.get('targets') ?? '';
  const targets = targetsParam.split(',').map((t) => t.trim()).filter(Boolean);
  if (!hazard || (hazard !== 'covid' && hazard !== 'dengue')) {
    return NextResponse.json([] as TailoredGuidance[]);
  }
  if (targets.length === 0) return NextResponse.json([] as TailoredGuidance[]);
  let sb;
  try { sb = supabaseAdmin(); } catch { return NextResponse.json([] as TailoredGuidance[]); }
  const { data, error } = await sb
    .from('tailored_guidance')
    .select('id, hazard, target, source, title, url, blurb')
    .eq('hazard', hazard)
    .in('target', targets);
  if (error) { console.error(error); return NextResponse.json([] as TailoredGuidance[]); }
  return NextResponse.json((data ?? []) as TailoredGuidance[]);
}
