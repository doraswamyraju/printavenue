'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ShieldCheck, Truck, ArrowRight } from 'lucide-react';
import { Order, CustomizedSheetItem } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<{
    productId: string;
    productTitle: string;
    year: number;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    sheets: CustomizedSheetItem[];
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem('printavenue_cart');
    if (raw) {
      try {
        setCart(JSON.parse(raw));
      } catch {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  if (!cart) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-500">Loading your cart...</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.phone || !formData.street || !formData.pincode) {
      setError('Please fill in all required shipping and contact details.');
      return;
    }

    setLoading(true);

    try {
      const orderPayload: Partial<Order> = {
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        productId: cart.productId,
        productTitle: cart.productTitle,
        year: cart.year,
        quantity: cart.quantity,
        unitPrice: cart.unitPrice,
        totalAmount: cart.totalAmount,
        sheets: cart.sheets,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        throw new Error('Failed to create order. Please try again.');
      }

      const data = await res.json();
      sessionStorage.removeItem('printavenue_cart');
      router.push(`/orders/${data.order.id}?success=true`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-700 hover:text-rose-600 transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">Back to Store</span>
          </Link>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Secure Checkout
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Complete Your Print Order
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review design summary and enter shipping destination.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Shipping Form */}
          <form onSubmit={handleSubmit} className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 uppercase tracking-wider">
              1. Delivery & Contact Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. ramesh@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address / Flat / Landmark *
              </label>
              <textarea
                required
                rows={2}
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                placeholder="House no, Building, Street, Area"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pincode *
                </label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="Pincode"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Standard delivery within 4–6 business days</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 transition disabled:opacity-50"
            >
              {loading ? 'Submitting Order...' : `Place Order (₹${cart.totalAmount})`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Order Summary Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 uppercase tracking-wider">
                Order Summary
              </h2>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Item:</span>
                  <span className="font-semibold text-slate-900 text-right">{cart.productTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Year:</span>
                  <span className="font-bold text-rose-600">{cart.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sheets Customized:</span>
                  <span className="font-semibold text-slate-900">{cart.sheets.length} Sheets</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quantity:</span>
                  <span className="font-bold text-slate-900">{cart.quantity} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Price Per Unit:</span>
                  <span className="font-semibold text-slate-900">₹{cart.unitPrice}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-slate-100 text-sm font-bold">
                  <span className="text-slate-900">Total Payable:</span>
                  <span className="text-rose-600 font-black">₹{cart.totalAmount}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
                <span className="font-bold">✨ HD Printing Guarantee:</span> Your uploaded photos will be rendered at commercial 300 DPI for sharp, vibrant printing on 300 GSM art card stock.
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <span>Orders are processed directly by our in-house printing unit.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

