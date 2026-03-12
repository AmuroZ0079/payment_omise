import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const chargeId = req.nextUrl.searchParams.get('chargeId');
  if (!chargeId) {
    return NextResponse.json({ error: 'chargeId required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('status')
    .eq('charge_id', chargeId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ status: data.status });
}
