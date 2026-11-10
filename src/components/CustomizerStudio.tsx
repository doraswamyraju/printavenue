'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShoppingBag,
  Type,
  Eye
} from 'lucide-react';
import { Product, SheetDefinition, CustomizedSheetItem } from '@/types';
import { SheetRenderer } from '@/components/SheetRenderer';
import { CalendarMockupFrame } from '@/components/CalendarMockupFrame';

interface Props {
  product: Product;
}

export const CustomizerStudio: React.FC<Props> = ({ product }) => {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number>(product.defaultYear);
  const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [showFullReview, setShowFullReview] = useState<boolean>(false);

  // Initialize sheet selections state
  const [sheetData, setSheetData] = useState<Record<string, CustomizedSheetItem>>(() => {
    const initial: Record<string, CustomizedSheetItem> = {};
    product.sheets.forEach((sheet) => {
      initial[sheet.id] = {
        sheetId: sheet.id,
        sheetTitle: sheet.title,
        selectedTemplateId: sheet.templates[0]?.id || '',
        userImageBase64: undefined,
        customText: sheet.templates[0]?.textOverlay?.defaultText || '',
      };
    });
    return initial;
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentSheet: SheetDefinition = product.sheets[currentSheetIndex];
  const currentSheetItem = sheetData[currentSheet.id];
  const activeTemplate =
    currentSheet.templates.find((t) => t.id === currentSheetItem.selectedTemplateId) ||
    currentSheet.templates[0];

  // Pricing calculation based on tier slabs
  const calculateUnitPrice = (qty: number) => {
    const tier = product.tiers.find(
      (t) => qty >= t.minQty && (t.maxQty ? qty <= t.maxQty : true)
    );
    return tier ? tier.pricePerUnit : product.basePrice;
  };

  const unitPrice = calculateUnitPrice(quantity);
  const totalPrice = unitPrice * quantity;

  // Handle image upload and convert to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const base64 = loadEvent.target?.result as string;
      setSheetData((prev) => ({
        ...prev,
        [currentSheet.id]: {
          ...prev[currentSheet.id],
          userImageBase64: base64,
          originalImageFileName: file.name,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Change selected template for current sheet
  const handleSelectTemplate = (templateId: string) => {
    setSheetData((prev) => ({
      ...prev,
      [currentSheet.id]: {
        ...prev[currentSheet.id],
        selectedTemplateId: templateId,
      },
    }));
  };

  // Update optional custom text
  const handleCustomTextChange = (text: string) => {
    setSheetData((prev) => ({
      ...prev,
      [currentSheet.id]: {
        ...prev[currentSheet.id],
        customText: text,
      },
    }));
  };

  // Navigation between sheets
  const goToPrevious = () => {
    if (currentSheetIndex > 0) setCurrentSheetIndex(currentSheetIndex - 1);
  };

  const goToNext = () => {
    if (currentSheetIndex < product.sheets.length - 1) {
      setCurrentSheetIndex(currentSheetIndex + 1);
    } else {
      setShowFullReview(true);
    }
  };

  // Completion stats
  const completedSheetsCount = Object.values(sheetData).filter(
    (s) => !!s.userImageBase64
  ).length;

  const handleCheckout = () => {
    // Store customization in localStorage for the checkout flow
    const orderPayload = {
      productId: product.id,
      productTitle: product.title,
      year: selectedYear,
      quantity,
      unitPrice,
      totalAmount: totalPrice,
      sheets: Object.values(sheetData),
    };
    sessionStorage.setItem('printavenue_cart', JSON.stringify(orderPayload));
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                {product.title}
              </h1>
              <p className="text-xs text-slate-500">
                Sheet {currentSheetIndex + 1} of {product.sheets.length} &middot;{' '}
                <span className="text-rose-600 font-semibold">{currentSheet.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 pl-1.5">Year:</span>
              {product.supportedYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    selectedYear === yr
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-white'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>

            {/* Quick Review / Cart Button */}
            <button
              onClick={() => setShowFullReview(true)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Full Review ({completedSheetsCount}/{product.sheets.length})</span>
            </button>
          </div>
        </div>

        {/* Horizontal Sheet Tabs */}
        <div className="bg-slate-100/70 border-t border-slate-200 overflow-x-auto scrollbar-none py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            {product.sheets.map((sheet, idx) => {
              const isFilled = !!sheetData[sheet.id]?.userImageBase64;
              const isActive = idx === currentSheetIndex;
              return (
                <button
                  key={sheet.id}
                  onClick={() => {
                    setCurrentSheetIndex(idx);
                    setShowFullReview(false);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-rose-600 text-white shadow-sm'
                      : isFilled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isFilled && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                  <span>{sheet.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Studio View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Mockup View (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-start">
          <div className="w-full max-w-xl">
            {/* The Calendar Desk Frame Mockup */}
            <CalendarMockupFrame orientation={product.orientation}>
              <SheetRenderer
                template={activeTemplate}
                year={selectedYear}
                monthIndices={currentSheet.monthIndices}
                sheetTitle={currentSheet.title}
                userImage={currentSheetItem.userImageBase64}
                customText={currentSheetItem.customText}
                aspectRatio={currentSheet.aspectRatio}
              />
            </CalendarMockupFrame>

            {/* Step Navigation Controls under Mockup */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={goToPrevious}
                disabled={currentSheetIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Previous Sheet
              </button>

              <span className="text-xs font-bold text-slate-400">
                {currentSheetIndex + 1} / {product.sheets.length}
              </span>

              <button
                onClick={goToNext}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition"
              >
                {currentSheetIndex === product.sheets.length - 1 ? (
                  <>Review & Finish <CheckCircle2 className="w-4 h-4" /></>
                ) : (
                  <>Next Sheet <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Upload Photo & Instant Multi-Template Selector (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Step 1: Upload Photo Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  Upload Photo for {currentSheet.title}
                </h3>
              </div>
              {currentSheetItem.userImageBase64 && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Select an image from your device. It will automatically populate across all design templates below.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3.5 px-4 rounded-xl border-2 border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/50 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-4 h-4" />
              {currentSheetItem.userImageBase64 ? 'Change Photo' : 'Choose Photo (PNG / JPG / WEBP)'}
            </button>
          </div>

          {/* Step 2: Instant Multi-Template Selector */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="font-bold text-sm text-slate-900">
                  Choose Design Layout ({currentSheet.templates.length} styles)
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Live Preview
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Click any style to apply it to your current sheet.
            </p>

            {/* Grid of All Available Design Options */}
            <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {currentSheet.templates.map((tpl) => {
                const isSelected = tpl.id === activeTemplate.id;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`relative p-2 rounded-xl text-left border-2 transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'border-rose-600 bg-rose-50/20 shadow-md ring-2 ring-rose-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    {/* Live Miniature Preview of this Template with uploaded photo */}
                    <div className="w-full rounded overflow-hidden pointer-events-none">
                      <SheetRenderer
                        template={tpl}
                        year={selectedYear}
                        monthIndices={currentSheet.monthIndices}
                        sheetTitle={currentSheet.title}
                        userImage={currentSheetItem.userImageBase64}
                        customText={currentSheetItem.customText}
                        aspectRatio={currentSheet.aspectRatio}
                        className="scale-95 origin-center shadow-none border-none"
                      />
                    </div>

                    <div className="flex items-center justify-between w-full pt-1">
                      <span className="text-[11px] font-bold text-slate-800 truncate">
                        {tpl.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Custom Text */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-slate-500" />
                Custom Caption or Family Name (Optional)
              </label>
              <input
                type="text"
                value={currentSheetItem.customText || ''}
                onChange={(e) => handleCustomTextChange(e.target.value)}
                placeholder="e.g. Memories 2027 or Our Sweet Home"
                maxLength={40}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* Pricing & Slab Summary Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-baseline mb-3">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-medium">
                  Dynamic Tiered Pricing
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black text-rose-400">
                    ₹{unitPrice}
                  </span>
                  <span className="text-xs text-slate-400">/ piece</span>
                  <span className="text-xs line-through text-slate-500">
                    ₹{product.basePrice * 2}
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
                <label className="text-xs text-slate-300 font-semibold pl-1">Qty:</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="bg-slate-900 text-white text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none border border-slate-700"
                >
                  {[1, 2, 3, 4, 5, 10, 15, 20, 25, 50, 100].map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tier Slabs Table */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 mb-4">
              {product.tiers.map((tier, i) => (
                <div
                  key={i}
                  className={`p-1 rounded ${
                    quantity >= tier.minQty && (tier.maxQty ? quantity <= tier.maxQty : true)
                      ? 'bg-rose-600 text-white font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  <div>{tier.maxQty ? `${tier.minQty}-${tier.maxQty}` : `${tier.minQty}+`} pcs</div>
                  <div className="font-bold">₹{tier.pricePerUnit}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-700/80 mb-4">
              <span className="text-slate-300 font-medium">Subtotal ({quantity} items):</span>
              <span className="text-base font-extrabold text-white">₹{totalPrice}</span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition"
            >
              <ShoppingBag className="w-4 h-4" />
              Proceed to Order (₹{totalPrice})
            </button>
          </div>
        </div>
      </main>

      {/* Modal: Full Review Carousel */}
      {showFullReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  Full Calendar Review ({completedSheetsCount}/{product.sheets.length} Sheets Designed)
                </h3>
                <p className="text-xs text-slate-500">
                  Verify your photo and layout selection for all {product.sheets.length} sheets before placing order.
                </p>
              </div>
              <button
                onClick={() => setShowFullReview(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {product.sheets.map((sheet, idx) => {
                const item = sheetData[sheet.id];
                const tpl =
                  sheet.templates.find((t) => t.id === item.selectedTemplateId) ||
                  sheet.templates[0];
                return (
                  <div
                    key={sheet.id}
                    onClick={() => {
                      setCurrentSheetIndex(idx);
                      setShowFullReview(false);
                    }}
                    className="cursor-pointer group flex flex-col gap-1.5 p-2 rounded-xl border border-slate-200 hover:border-rose-500 transition hover:shadow-md"
                  >
                    <div className="rounded overflow-hidden">
                      <SheetRenderer
                        template={tpl}
                        year={selectedYear}
                        monthIndices={sheet.monthIndices}
                        sheetTitle={sheet.title}
                        userImage={item.userImageBase64}
                        customText={item.customText}
                        aspectRatio={sheet.aspectRatio}
                        className="scale-95 origin-center shadow-none border-none"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>{sheet.title}</span>
                      {item.userImageBase64 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <span className="text-[9px] text-amber-500 font-medium">Empty</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">
                Ready to print in HD 300 DPI?
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFullReview(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-white"
                >
                  Continue Editing
                </button>
                <button
                  onClick={handleCheckout}
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  Confirm & Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

