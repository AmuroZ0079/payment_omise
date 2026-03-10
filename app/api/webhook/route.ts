import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, data } = body;

    if (key === 'charge.complete') {
      const charge = data;

      await supabase
        .from('transactions')
        .update({
          status: charge.status,
          updated_at: new Date().toISOString(),
        })
        .eq('charge_id', charge.id);

      console.log(`Charge ${charge.id} updated to ${charge.status}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 400 });
  }
}
