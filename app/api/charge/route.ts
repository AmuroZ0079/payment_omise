import { NextRequest, NextResponse } from 'next/server';
import { omise } from '@/lib/omise';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { token, amount, description, email, paymentMethod } = await req.json();

    // สร้าง Charge กับ Omise
    const charge = await omise.charges.create({
      amount: amount, // หน่วยเป็นสตางค์ เช่น 10000 = 100 บาท
      currency: 'thb',
      card: token,    // token จาก Omise.js (frontend)
      description: description,
      metadata: { email },
      return_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
    });

    // บันทึกลง Supabase
    await supabase.from('transactions').insert({
      charge_id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status,
      payment_method: paymentMethod || 'card',
      description: description,
      customer_email: email,
      metadata: charge,
    });

    return NextResponse.json({
      success: charge.status === 'successful',
      chargeId: charge.id,
      status: charge.status,
      authorizeUri: charge.authorize_uri, // สำหรับ 3DS
    });

  } catch (error: any) {
    console.error('Charge error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
