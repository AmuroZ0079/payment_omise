import Link from 'next/link';
import TransactionList from '@/components/TransactionList';

const PRODUCTS = [
  { id: 1, name: 'สินค้า A', description: 'สินค้าทดสอบชิ้นที่ 1', price: 100 },
  { id: 2, name: 'สินค้า B', description: 'สินค้าทดสอบชิ้นที่ 2', price: 250 },
  { id: 3, name: 'สินค้า C', description: 'สินค้าทดสอบชิ้นที่ 3', price: 500 },
];

export default function ShopPage() {
  return (
    <main className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">ร้านค้าทดสอบ</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {PRODUCTS.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-3">
            <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
              🛍️
            </div>
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p className="text-gray-500 text-sm flex-1">{product.description}</p>
            <p className="text-blue-600 font-bold text-xl">฿{product.price.toLocaleString()}</p>
            <Link
              href={`/checkout?amount=${product.price}&description=${encodeURIComponent(product.name)}`}
              className="block text-center bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ซื้อเลย
            </Link>
          </div>
        ))}
      </div>

      <TransactionList />
    </main>
  );
}
