'use client';
import { useState } from 'react';

interface QRPaymentProps {
  amount: number;       // บาท
  description: string;
  email: string;
}

export default function QRPayment({ amount, description, email }: QRPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateQR = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/charge', {
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
          <p className="text-xs text-gray-400 mt-3">QR Code จะหมดอายุใน 15 นาที</p>
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
