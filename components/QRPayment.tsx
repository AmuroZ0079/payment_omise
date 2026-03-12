'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface QRPaymentProps {
  amount: number;       // บาท
  description: string;
  email: string;
}

export default function QRPayment({ amount, description, email }: QRPaymentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll status ทุก 3 วินาที เมื่อมี QR แล้ว
  useEffect(() => {
    if (!chargeId) return;

    intervalRef.current = setInterval(async () => {
      const res = await fetch(`/api/charge-status?chargeId=${chargeId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.status === 'successful') {
        clearInterval(intervalRef.current!);
        router.push('/payment/success');
      }
    }, 3000);

    return () => clearInterval(intervalRef.current!);
  }, [chargeId, router]);

  const handleGenerateQR = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/promptpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: { type: 'promptpay' },
          amount: amount * 100,
          description,
          email,
          paymentMethod: 'promptpay',
        }),
      });

      const data = await res.json();

      if (data.qrImage) {
        setQrImage(data.qrImage);
        setChargeId(data.chargeId);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md text-center">
      <p className="text-gray-500 mb-4">ยอดชำระ: ฿{amount.toLocaleString()}</p>

      {qrImage ? (
        <div>
          <p className="text-sm text-gray-600 mb-3">สแกน QR ด้วยแอปธนาคาร</p>
          <img src={qrImage} alt="PromptPay QR" className="mx-auto w-48 h-48" />
          <p className="text-xs text-gray-400 mt-2">QR Code จะหมดอายุใน 15 นาที</p>
          <p className="text-xs text-blue-500 mt-1 animate-pulse">รอรับการชำระเงิน...</p>
        </div>
      ) : (
        <button
          onClick={handleGenerateQR}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'กำลังสร้าง QR...' : `สร้าง QR PromptPay ฿${amount.toLocaleString()}`}
        </button>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg text-sm bg-red-100 text-red-800">{error}</div>
      )}
    </div>
  );
}
