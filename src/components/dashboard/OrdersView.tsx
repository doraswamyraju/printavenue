'use client';

import React, { useState } from 'react';
import { Order, OrderStatus } from '@/types';
import { AuthUser } from '@/lib/auth';
import {
  Download,
  Truck,
  CheckCircle2,
  Clock,
  Printer,
  Package,
  Layers,
  MapPin,
  ExternalLink
} from 'lucide-react';

interface Props {
  orders: Order[];
  user: AuthUser;
  onRefresh: () => void;
}

export const OrdersView: React.FC<Props> = ({ orders, user, onRefresh }) => {
  const isStaff = user.role === 'staff' || user.role === 'admin' || user.role === 'superadmin';
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(orders[0] || null);
  const [filter, setFilter] = useState<string>('ALL');

  // Customer only sees their orders; Admin/Staff sees all
  const filteredOrders = orders.filter((o) => {
    if (!isStaff && o.customerEmail !== user.email) return false;
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      alert('Failed to update status');
    }
  };

  const handleAddTracking = async (orderId: string) => {
    const courier = prompt('Courier Company Name (e.g., Delhivery, BlueDart, DTDC):');
    if (!courier) return;
    const awb = prompt('AWB / Tracking Number:');
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
        onRefresh();
      }
    } catch {
      alert('Failed to record tracking');
    }
  };

  // Download 100% full merged print-ready sheet (Base Artwork + Cutout Photo + Logo + Text)
  const handleDownloadCompleteSheet = (sheet: any, idx: number, orderId: string) => {
    const downloadUrl = sheet.composedPrintUrl || sheet.userImageBase64;
    if (!downloadUrl) {
      alert('No artwork file found for this sheet.');
      return;
    }
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${orderId}-READY_TO_PRINT-Sheet_${idx + 1}_${sheet.sheetTitle.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all ready-to-print sheets
  const handleDownloadAllPrintFiles = (order: Order) => {
    order.sheets.forEach((sheet, idx) => {
      const url = sheet.composedPrintUrl || sheet.userImageBase64;
      if (url) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = url;
          link.download = `${order.id}-READY_TO_PRINT-Sheet_${idx + 1}_${sheet.sheetTitle.replace(/\s+/g, '_')}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, idx * 350);
      }
    });
  };

  // HD raw download for press
  const handleDownloadPhotos = (order: Order) => {
    order.sheets.forEach((sheet, idx) => {
      if (sheet.userImageBase64) {
        const link = document.createElement('a');
        link.href = sheet.userImageBase64;
        link.download = `${order.id}-raw-photo-${idx + 1}-${sheet.sheetTitle.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">
            {isStaff ? 'Production & Order Fulfillment Queue' : 'My Orders & Real-Time Tracking'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Database records for production, courier tracking, and print inspection.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['ALL', 'Order Placed', 'Artwork Approved', 'In Printing', 'Dispatched', 'Delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                filter === st
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Orders list (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-500 text-xs">
              No orders found in database matching this filter.
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
                      ? 'bg-slate-800 border-rose-500 ring-1 ring-rose-500/40 shadow-lg'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-rose-400">
                      {ord.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-slate-300 border border-slate-700">
                      {ord.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline">
                    <div>
                      <p className="font-bold text-sm text-white">{ord.customerName}</p>
                      <p className="text-[11px] text-slate-400">{ord.productTitle} &middot; {ord.quantity} pcs</p>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-400">
                      ₹{ord.totalAmount}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800">
                    <span>{new Date(ord.createdAt).toLocaleDateString()}</span>
                    <span>{ord.sheets.length} Sheets</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Selected Order Details (7 cols) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-lg font-black text-white">{selectedOrder.id}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Placed: {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>

                {isStaff && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadAllPrintFiles(selectedOrder)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                      title="Download complete merged print artwork for all sheets in this order"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Complete Print Files (All Sheets)
                    </button>

                    <button
                      onClick={() => handleDownloadPhotos(selectedOrder)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
                      title="Download raw customer uploads"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Raw Photos
                    </button>
                  </div>
                )}
              </div>

              {/* Status Update Bar for Staff */}
              {isStaff && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Update Production Stage
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {['Order Placed', 'Artwork Approved', 'In Printing', 'Dispatched', 'Delivered'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedOrder.id, st as OrderStatus)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          selectedOrder.status === st
                            ? 'bg-rose-600 text-white font-bold'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                    <button
                      onClick={() => handleAddTracking(selectedOrder.id)}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1"
                    >
                      <Truck className="w-3 h-3" /> Add AWB Tracking
                    </button>
                  </div>
                </div>
              )}

              {/* Courier info */}
              {selectedOrder.trackingNumber && (
                <div className="p-4 bg-blue-950/60 rounded-2xl border border-blue-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-blue-200 block">Courier: {selectedOrder.courierName}</span>
                    <span className="text-blue-400 font-mono">AWB #{selectedOrder.trackingNumber}</span>
                  </div>
                  {selectedOrder.trackingUrl && (
                    <a
                      href={selectedOrder.trackingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
                    >
                      Track Shipment
                    </a>
                  )}
                </div>
              )}

              {/* Shipping info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Customer Info
                  </span>
                  <p className="font-bold text-white text-sm">{selectedOrder.customerName}</p>
                  <p className="text-slate-300">{selectedOrder.customerPhone}</p>
                  <p className="text-slate-400">{selectedOrder.customerEmail}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Delivery Address
                  </span>
                  <p className="text-slate-200">{selectedOrder.shippingAddress.street}</p>
                  <p className="text-slate-300 font-semibold">
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                  </p>
                </div>
              </div>

              {/* Sheets Gallery */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-rose-500" />
                  Customized Sheets Preview ({selectedOrder.sheets.length} Sheets)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {selectedOrder.sheets.map((sheet, idx) => (
                    <div
                      key={sheet.sheetId || idx}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2"
                    >
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
                        <span>{sheet.sheetTitle}</span>
                        <span className="font-mono text-slate-500">#{idx + 1}</span>
                      </div>
                      <div className="aspect-[4/3] rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center">
                        {sheet.composedPrintUrl || sheet.userImageBase64 ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={sheet.composedPrintUrl || sheet.userImageBase64}
                            alt={sheet.sheetTitle}
                            className="w-full h-full object-cover pointer-events-none select-none"
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

                      {/* Download Print Sheet Button */}
                      {isStaff && (sheet.composedPrintUrl || sheet.userImageBase64) && (
                        <button
                          type="button"
                          onClick={() => handleDownloadCompleteSheet(sheet, idx, selectedOrder.id)}
                          className="w-full py-1.5 px-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1 transition shadow"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download Print Sheet</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 text-slate-500 text-xs">
              Select an order from the list to view specifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

