import CheckoutForm from '@/components/CheckoutForm';
import QRPayment from '@/components/QRPayment';

interface CheckoutPageProps {
  searchParams: { amount?: string; description?: string };
}

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const amount = Number(searchParams.amount) || 100;
  const description = searchParams.description || 'สินค้าทดสอบ';
  const email = 'test@example.com';

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-6 py-10 px-4">
      <h1 className="text-2xl font-bold">ชำระเงิน</h1>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        <div className="flex-1">
          <h2 className="text-center font-semibold mb-3 text-gray-600">บัตรเครดิต / เดบิต</h2>
          <CheckoutForm amount={amount} description={description} email={email} />
        </div>

        <div className="flex-1">
          <h2 className="text-center font-semibold mb-3 text-gray-600">PromptPay QR</h2>
          <QRPayment amount={amount} description={description} email={email} />
        </div>
      </div>
    </main>
  );
}
