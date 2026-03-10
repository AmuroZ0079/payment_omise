'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    OmiseCard: any;
  }
}

interface CheckoutFormProps {
  amount: number;       // บาท
  description: string;
  email: string;
}

export default function CheckoutForm({ amount, description, email }: CheckoutFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  // โหลด Omise.js
  useEffect(() => {
    if (document.querySelector('script[src="https://cdn.omise.co/omise.js"]')) return;
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
    setResult(null);

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

          if (data.authorizeUri) {
            // 3DS redirect
            window.location.href = data.authorizeUri;
            return;
          }

          if (data.success) {
            router.push(`/payment/success?charge_id=${data.chargeId}`);
          } else {
            setResult({ success: false, message: data.error || 'ชำระเงินไม่สำเร็จ กรุณาลองใหม่' });
            setLoading(false);
          }
        } catch {
          setResult({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่' });
          setLoading(false);
        }
      },
      onFormClosed: () => setLoading(false),
    });
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-lg font-bold mb-1">{description}</h2>
      <p className="text-gray-500 mb-4">ยอดชำระ: ฿{amount.toLocaleString()}</p>

      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'กำลังดำเนินการ...' : `ชำระด้วยบัตร ฿${amount.toLocaleString()}`}
      </button>

      {result && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
