import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOrderById } from '@/lib/storage';
import { OrderStatus } from '@/types';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  Layers,
  ChevronLeft
} from 'lucide-react';

interface Props {
  params: {
    id: string;
  };
  searchParams?: {
    success?: string;
  };
}

const statusSteps: OrderStatus[] = [
  'Order Placed',
  'Artwork Approved',
  'In Printing',
  'Binding & Packaging',
  'Dispatched',
  'Delivered',
];

export default function OrderDetailsPage({ params, searchParams }: Props) {
  const order = getOrderById(params.id);

  if (!order) {
    notFound();
  }

  const currentStepIndex = statusSteps.indexOf(order.status);
  const isSuccess = searchParams?.success === 'true';

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-700 hover:text-rose-600 transition">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-bold">PrintAvenue Home</span>
          </Link>
          <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-3 py-1 rounded-md">
            Order: {order.id}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        {/* Success Banner if redirected from checkout */}
        {isSuccess && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-emerald-900">
                  Order Successfully Placed!
                </h2>
                <p className="text-xs text-emerald-700">
                  Your customized design sheets have been submitted to our digital printing queue.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-800 uppercase block">Total Paid</span>
              <span className="text-2xl font-black text-emerald-950">₹{order.totalAmount}</span>
            </div>
          </div>
        )}

        {/* Live Tracking Progress Bar */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-rose-600" /> Live Production & Delivery Status
          </h2>

          <div className="relative">
            {/* Horizontal timeline bar */}
            <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0"></div>
            <div
              className="hidden sm:block absolute top-1/2 left-0 h-1 bg-rose-600 -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width: `${Math.max(0, (currentStepIndex / (statusSteps.length - 1)) * 100)}%`,
              }}
            ></div>

            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-6 gap-4 text-center">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step} className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        isCurrent
                          ? 'bg-rose-600 text-white ring-4 ring-rose-100 scale-110'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`mt-2 text-[11px] font-semibold leading-tight ${
                        isCurrent
                          ? 'text-rose-600 font-bold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier tracking link if dispatched */}
          {order.trackingNumber && (
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-bold text-blue-900 block">Courier: {order.courierName || 'Expedited Delivery'}</span>
                  <span className="text-blue-700 font-mono">AWB Tracking #{order.trackingNumber}</span>
                </div>
              </div>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition"
                >
                  Track on Courier Site
                </a>
              )}
            </div>
          )}
        </div>

        {/* Order Details & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Customer & Shipping Details */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-500" /> Shipping Destination
            </h3>
            <p className="font-bold text-sm text-slate-900">{order.customerName}</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
              {order.shippingAddress.state} - {order.shippingAddress.pincode}
            </p>
            <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Phone: <span className="font-semibold text-slate-800">{order.customerPhone}</span>
            </p>
          </div>

          {/* Product Specs */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-500" /> Product Details
            </h3>
            <p className="font-bold text-sm text-slate-900">{order.productTitle}</p>
            <div className="text-xs text-slate-600 space-y-1">
              <div>Calendar Year: <span className="font-bold text-rose-600">{order.year}</span></div>
              <div>Sheets Count: <span className="font-semibold">{order.sheets.length} Sheets</span></div>
              <div>Total Quantity: <span className="font-bold text-slate-900">{order.quantity} pcs</span></div>
            </div>
          </div>

          {/* Payment & Invoice */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Payment Summary
            </h3>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Unit Price:</span>
                <span className="font-semibold">₹{order.unitPrice}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Quantity:</span>
                <span>{order.quantity}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-100 text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-rose-600 font-black">₹{order.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery of Customized Sheets */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-600" /> Customized Sheets Preview ({order.sheets.length} Pages)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {order.sheets.map((sheet, idx) => (
              <div key={sheet.sheetId || idx} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-700">{sheet.sheetTitle}</span>
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                  {sheet.userImageBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sheet.userImageBase64}
                      alt={sheet.sheetTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">No Photo</span>
                  )}
                </div>
                {sheet.customText && (
                  <p className="text-[10px] text-slate-500 italic truncate">
                    &ldquo;{sheet.customText}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

