'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Download,
  Truck,
  Printer,
  ChevronRight,
  Plus,
  ExternalLink
} from 'lucide-react';
import { Order, Product, OrderStatus } from '@/types';

interface Props {
  initialOrders: Order[];
  initialProducts: Product[];
}

export const AdminDashboard: React.FC<Props> = ({
  initialOrders,
  initialProducts,
}) => {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products] = useState<Product[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<'orders' | 'products'>('orders');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    orders[0] || null
  );

  // Status updating handler
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch {
      alert('Failed to update status');
    }
  };

  // Add courier dispatch info
  const handleAddTracking = async (orderId: string) => {
    const courier = prompt('Enter Courier Partner Name (e.g., Delhivery, BlueDart, DTDC):');
    if (!courier) return;
    const awb = prompt('Enter AWB / Tracking Number:');
    if (!awb) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Dispatched',
          courierName: courier,
          trackingNumber: awb,
          trackingUrl: `https://www.google.com/search?q=${encodeURIComponent(courier + ' tracking ' + awb)}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? data.order : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(data.order);
        }
      }
    } catch {
      alert('Failed to save tracking details');
    }
  };

  // Download all high-res photos for commercial printing press
  const handleDownloadHDAssets = (order: Order) => {
    order.sheets.forEach((sheet, idx) => {
      if (sheet.userImageBase64) {
        const link = document.createElement('a');
        link.href = sheet.userImageBase64;
        link.download = `${order.id}-sheet-${idx + 1}-${sheet.sheetTitle.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const filteredOrders = orders.filter((o) =>
    filterStatus === 'ALL' ? true : o.status === filterStatus
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col">
      {/* Admin Nav */}
      <header className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center text-white font-black text-sm shadow-md">
              PA
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block">
                PrintAvenue Production & Admin Hub
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Port 5091 &middot; Live Operations
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
              target="_blank"
            >
              Customer Store <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'orders'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Orders Queue ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'products'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Products & Templates ({products.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {activeTab === 'orders' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Orders List (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {['ALL', 'Order Placed', 'Artwork Approved', 'In Printing', 'Dispatched'].map(
                (st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-semibold transition ${
                      filterStatus === st
                        ? 'bg-white text-slate-900 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            {/* Orders Feed */}
            <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-800 text-slate-500 text-xs">
                  No orders match this status filter.
                </div>
              ) : (
                filteredOrders.map((ord) => {
                  const isSelected = selectedOrder?.id === ord.id;
                  return (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col gap-2 ${
                        isSelected
                          ? 'bg-slate-800 border-rose-500 ring-1 ring-rose-500/50'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-rose-400">
                          {ord.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-200">
                          {ord.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-baseline">
                        <div>
                          <p className="font-bold text-sm text-white">
                            {ord.customerName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {ord.productTitle} &middot; {ord.quantity} pcs
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-sm text-emerald-400">
                            ₹{ord.totalAmount}
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-700/50">
                        <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                        <span>{ord.sheets.length} Sheets Designed</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Order Details & HD Print Operations (7 cols) */}
          <div className="lg:col-span-7">
            {selectedOrder ? (
              <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/70 flex flex-col gap-6">
                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-white">
                        {selectedOrder.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600/20 text-rose-400 border border-rose-500/30">
                        {selectedOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadHDAssets(selectedOrder)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Raw HD Photos
                    </button>
                  </div>
                </div>

                {/* Workflow Status Actions */}
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Update Production Stage:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Order Placed',
                      'Artwork Approved',
                      'In Printing',
                      'Binding & Packaging',
                      'Dispatched',
                      'Delivered',
                    ].map((st) => (
                      <button
                        key={st}
                        onClick={() =>
                          handleUpdateStatus(selectedOrder.id, st as OrderStatus)
                        }
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          selectedOrder.status === st
                            ? 'bg-rose-600 text-white font-bold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                    <button
                      onClick={() => handleAddTracking(selectedOrder.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1"
                    >
                      <Truck className="w-3 h-3" /> Add Tracking AWB
                    </button>
                  </div>
                </div>

                {/* Customer Info & Shipping Address */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Customer Info
                    </span>
                    <p className="font-bold text-white text-sm">
                      {selectedOrder.customerName}
                    </p>
                    <p className="text-slate-300">{selectedOrder.customerPhone}</p>
                    <p className="text-slate-400">{selectedOrder.customerEmail || 'No email provided'}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/60">
                    <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">
                      Delivery Address
                    </span>
                    <p className="text-slate-200">
                      {selectedOrder.shippingAddress.street}
                    </p>
                    <p className="text-slate-300 font-semibold">
                      {selectedOrder.shippingAddress.city},{' '}
                      {selectedOrder.shippingAddress.state} -{' '}
                      {selectedOrder.shippingAddress.pincode}
                    </p>
                  </div>
                </div>

                {/* Print Sheet Inspection Gallery */}
                <div>
                  <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-rose-500" />
                    Customer Customized Sheets ({selectedOrder.sheets.length} Sheets for Press)
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedOrder.sheets.map((sheet, idx) => (
                      <div
                        key={sheet.sheetId || idx}
                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                          <span>{sheet.sheetTitle}</span>
                          <span className="font-mono text-slate-500">#{idx + 1}</span>
                        </div>
                        <div className="aspect-[4/3] rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center">
                          {sheet.userImageBase64 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sheet.userImageBase64}
                              alt={sheet.sheetTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-600">No Image</span>
                          )}
                        </div>
                        {sheet.customText && (
                          <p className="text-[10px] text-amber-400 italic truncate">
                            &ldquo;{sheet.customText}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-slate-800/40 rounded-3xl border border-slate-800 text-slate-500 text-sm">
                Select an order from the left to view customer artwork and print specifications.
              </div>
            )}
          </div>
        </main>
      ) : (
        /* Products & Template Management Tab */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold text-white">
                Products & Multi-Template Architecture
              </h2>
              <p className="text-xs text-slate-400">
                Manage products, sheets, and pre-designed layout options for customers.
              </p>
            </div>
            <button
              onClick={() => alert('Product builder modal: New product can be defined here')}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
            >
              <Plus className="w-4 h-4" /> Add New Calendar Product
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl bg-slate-800 border border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-700 text-slate-300">
                      {p.category.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-rose-400">₹{p.basePrice}</span>
                  </div>
                  <h3 className="font-bold text-base text-white">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {p.description}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-slate-900 text-xs space-y-1">
                    <div className="text-slate-400">
                      Sheets: <span className="text-white font-bold">{p.sheets.length} Sheets</span>
                    </div>
                    <div className="text-slate-400">
                      Dimensions: <span className="text-white">{p.dimensions}</span>
                    </div>
                    <div className="text-slate-400">
                      Paper: <span className="text-white">{p.paperQuality}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-700/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {p.sheets.reduce((acc, s) => acc + s.templates.length, 0)} total design templates
                  </span>
                  <Link
                    href={`/customize/${p.slug}`}
                    target="_blank"
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                  >
                    Test Studio <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
};

