import Link from 'next/link';

interface SuccessPageProps {
  searchParams: { charge_id?: string };
}

export default function SuccessPage({ searchParams }: SuccessPageProps) {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-4">
      <div className="bg-white rounded-xl shadow-md p-10 text-center max-w-sm w-full">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-600 mb-2">ชำระเงินสำเร็จ!</h1>
        <p className="text-gray-500 text-sm mb-6">
          ขอบคุณสำหรับการสั่งซื้อ
          {searchParams.charge_id && (
            <span className="block mt-1 font-mono text-xs text-gray-400">
              {searchParams.charge_id}
            </span>
          )}
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          กลับหน้าร้านค้า
        </Link>
      </div>
    </main>
  );
}
