import { NextRequest, NextResponse } from 'next/server';
import { omise } from '@/lib/omise';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { amount, description, email } = await req.json();

    // Step 1: สร้าง Source สำหรับ PromptPay
    const source = await omise.sources.create({
      type: 'promptpay',
      amount: amount,
      currency: 'thb',
    });

    // Step 2: สร้าง Charge โดยใช้ source
    const charge = await omise.charges.create({
      amount: amount,
      currency: 'thb',
      source: source.id,
      description: description,
      metadata: { email },
      return_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
    });

    // ดึง QR image URL
    const qrImage = charge.source?.scannable_code?.image?.download_uri;

    // บันทึกลง Supabase
    await supabase.from('transactions').insert({
      charge_id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      payment_method: 'promptpay',
      description: description,
      customer_email: email,
      metadata: charge,
    });

    return NextResponse.json({
      success: true,
      chargeId: charge.id,
      status: charge.status,
      qrImage,
    });

  } catch (error: any) {
    console.error('PromptPay error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
