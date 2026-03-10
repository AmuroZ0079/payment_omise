import Link from 'next/link';

export default function FailedPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 px-4">
      <div className="bg-white rounded-xl shadow-md p-10 text-center max-w-sm w-full">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">ชำระเงินไม่สำเร็จ</h1>
        <p className="text-gray-500 text-sm mb-6">
          กรุณาตรวจสอบข้อมูลบัตรและลองใหม่อีกครั้ง
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/checkout"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ลองใหม่
          </Link>
          <Link
            href="/"
            className="inline-block text-gray-500 hover:text-gray-700"
          >
            กลับหน้าร้านค้า
          </Link>
        </div>
      </div>
    </main>
  );
}
