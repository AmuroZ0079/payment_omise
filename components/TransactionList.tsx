'use client';
import { useEffect, useState } from 'react';

interface Transaction {
  id: string;
  charge_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  description: string;
  customer_email: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  successful: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = () => {
    setLoading(true);
    fetch('/api/transactions')
      .then((r) => r.json())
      .then((data) => setTransactions(data.transactions ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) return <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>;
  if (!transactions.length) return <p className="text-center text-gray-400 py-8">ยังไม่มีรายการ</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">รายการชำระเงินล่าสุด</h2>
        <button onClick={fetchTransactions} className="text-sm text-blue-600 hover:underline">
          รีเฟรช
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-white rounded-xl shadow-md overflow-hidden">
          <thead className="bg-gray-100 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">วันที่</th>
              <th className="text-left px-4 py-3">รายการ</th>
              <th className="text-left px-4 py-3">ช่องทาง</th>
              <th className="text-right px-4 py-3">ยอด</th>
              <th className="text-center px-4 py-3">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(tx.created_at).toLocaleString('th-TH')}
                </td>
                <td className="px-4 py-3">{tx.description}</td>
                <td className="px-4 py-3 capitalize">{tx.payment_method}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  ฿{(tx.amount / 100).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLE[tx.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
