'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronLeft, Package } from 'lucide-react';

export default function TrackOrderPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderId.trim()) {
      router.push(`/orders/${orderId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-700 hover:text-rose-600 transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">PrintAvenue Home</span>
          </Link>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Track Your Order
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 mt-16 flex-1 w-full text-center">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Package className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Track Your Print Order
        </h1>
        <p className="text-xs text-slate-500 mt-1 mb-8">
          Enter your Order ID (e.g. PA-2027-1042) to see live production and courier status.
        </p>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-left text-xs font-semibold text-slate-700 mb-1">
              Order ID
            </label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g. PA-2027-xxxx"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none uppercase"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition"
          >
            <Search className="w-4 h-4" />
            Check Live Status
          </button>
        </form>
      </main>
    </div>
  );
}

