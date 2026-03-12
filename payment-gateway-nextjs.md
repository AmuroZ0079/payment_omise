# Payment Gateway Project — Next.js + React + Supabase + Vercel

## Stack
- **Backend**: Next.js 14 (App Router + API Routes)
- **Frontend**: React (Next.js)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Payment**: Omise (Sandbox)

---

## โครงสร้าง Project

```
payment-gateway-demo/
├── app/
│   ├── page.tsx                  # หน้า Shop / เลือกสินค้า
│   ├── checkout/
│   │   └── page.tsx              # หน้า Checkout
│   ├── payment/
│   │   ├── success/page.tsx      # หน้า Success
│   │   └── failed/page.tsx       # หน้า Failed
│   └── api/
│       ├── charge/route.ts       # API สร้าง charge
│       ├── webhook/route.ts      # รับ webhook จาก Omise
│       └── transactions/route.ts # ดึงข้อมูล transactions
├── components/
│   ├── CheckoutForm.tsx          # ฟอร์มกรอกบัตร (Omise.js)
│   ├── QRPayment.tsx             # แสดง QR PromptPay
│   └── TransactionList.tsx       # แสดงรายการ transactions
├── lib/
│   ├── omise.ts                  # Omise client
│   └── supabase.ts               # Supabase client
└── .env.local
```

---

## Environment Variables (.env.local)

```env
# Omise Keys (ได้จาก dashboard.omise.co)
OMISE_PUBLIC_KEY=pkey_test_xxxxxxxxxx
OMISE_SECRET_KEY=skey_test_xxxxxxxxxx

# Supabase (ได้จาก supabase.com project settings)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## Supabase — สร้าง Table

```sql
-- รัน SQL นี้ใน Supabase SQL Editor

create table transactions (
  id uuid default gen_random_uuid() primary key,
  charge_id text unique not null,         -- Omise charge ID
  amount integer not null,                -- จำนวนเงิน (สตางค์)
  currency text default 'thb',
  status text not null,                   -- pending / successful / failed
  payment_method text,                    -- card / promptpay
  description text,
  customer_email text,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index สำหรับ query เร็ว
create index on transactions(status);
create index on transactions(created_at desc);
```

---

## Install Dependencies

```bash
npx create-next-app@latest payment-gateway-demo --typescript --tailwind --app
cd payment-gateway-demo

npm install omise
npm install @supabase/supabase-js
npm install @supabase/ssr
```

---

## lib/omise.ts

```typescript
const Omise = require('omise');

export const omise = Omise({
  publicKey: process.env.OMISE_PUBLIC_KEY,
  secretKey: process.env.OMISE_SECRET_KEY,
});
```

---

## lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ใช้ service role สำหรับ server-side
);
```

---

## app/api/charge/route.ts — สร้าง Charge

```typescript
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
```

---

## app/api/webhook/route.ts — รับ Webhook จาก Omise

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { key, data } = body;

    // Event ที่ต้องจัดการ
    if (key === 'charge.complete') {
      const charge = data;

      // อัปเดต status ใน Supabase
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
```

---

## app/api/transactions/route.ts — ดึง Transactions

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ transactions: data });
}
```

---

## components/CheckoutForm.tsx — ฟอร์มชำระเงิน

```tsx
'use client';
import { useEffect, useState } from 'react';

declare global {
  interface Window { OmiseCard: any; }
}

interface CheckoutFormProps {
  amount: number;       // บาท
  description: string;
  email: string;
}

export default function CheckoutForm({ amount, description, email }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // โหลด Omise.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.omise.co/omise.js';
    script.onload = () => {
      window.OmiseCard.configure({
        publicKey: process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY,
      });
    };
    document.body.appendChild(script);
  }, []);

  const handlePayment = () => {
    setLoading(true);

    window.OmiseCard.open({
      amount: amount * 100,       // แปลงเป็นสตางค์
      currency: 'THB',
      frameLabel: 'My Shop',
      submitLabel: `ชำระ ฿${amount.toLocaleString()}`,
      onCreateTokenSuccess: async (token: string) => {
        try {
          const res = await fetch('/api/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token,
              amount: amount * 100,
              description,
              email,
              paymentMethod: 'card',
            }),
          });

          const data = await res.json();

          if (data.success) {
            setResult({ success: true, message: 'ชำระเงินสำเร็จ!' });
          } else {
            setResult({ success: false, message: 'ชำระเงินไม่สำเร็จ กรุณาลองใหม่' });
          }
        } catch (err) {
          setResult({ success: false, message: 'เกิดข้อผิดพลาด' });
        } finally {
          setLoading(false);
        }
      },
      onFormClosed: () => setLoading(false),
    });
  };

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-2">{description}</h2>
      <p className="text-gray-600 mb-4">ยอดชำระ: ฿{amount.toLocaleString()}</p>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'กำลังดำเนินการ...' : `ชำระ ฿${amount.toLocaleString()}`}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded-lg ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
```

---

## app/checkout/page.tsx — หน้า Checkout

```tsx
import CheckoutForm from '@/components/CheckoutForm';

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <CheckoutForm
        amount={500}
        description="สินค้าทดสอบ"
        email="test@example.com"
      />
    </main>
  );
}
```

---

## บัตรทดสอบ (Sandbox)

| เลขบัตร | ผลลัพธ์ |
|---------|--------|
| 4242 4242 4242 4242 | ✅ สำเร็จ |
| 4111 1111 1111 1111 | ❌ ล้มเหลว |
| Expiry | 12/2026 (อนาคต) |
| CVV | 123 |

---

## Deploy บน Vercel

```bash
# 1. Push ขึ้น GitHub ก่อน
git init
git add .
git commit -m "init payment gateway"
git push origin main

# 2. ไป vercel.com → Import Repository
# 3. ใส่ Environment Variables ทั้งหมดใน Vercel Dashboard
# 4. Deploy!
```

### ตั้ง Webhook URL ใน Omise Dashboard
```
https://your-app.vercel.app/api/webhook
```

---

## Flow สรุป

```
1. ลูกค้ากด "ชำระเงิน"
2. Omise.js popup ขึ้นมา → ลูกค้ากรอกบัตร
3. Omise.js ส่งบัตรไปที่ Omise → ได้ token กลับมา
4. ส่ง token → /api/charge
5. Backend สร้าง charge กับ Omise
6. บันทึก transaction ลง Supabase
7. แสดงผล success / failed
8. Omise ส่ง Webhook → /api/webhook → อัปเดต status
```

---

## Next Steps (เพิ่มเติม)

- [ ] เพิ่ม QR PromptPay (`source.type = 'promptpay'`)
- [ ] หน้า Dashboard แสดง transactions ทั้งหมด
- [ ] ส่ง Email ยืนยันด้วย Resend หรือ Nodemailer
- [ ] เพิ่ม Refund API
- [ ] Auth ด้วย Supabase Auth
