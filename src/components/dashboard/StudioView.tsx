'use client';

import React, { useState } from 'react';
import { Product, SheetDefinition, CustomizedSheetItem } from '@/types';
import { AuthUser } from '@/lib/auth';
import { SheetRenderer } from '@/components/SheetRenderer';
import { CalendarMockupFrame } from '@/components/CalendarMockupFrame';
import { ProtectedPreviewShield } from '@/components/common/ProtectedPreviewShield';
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShoppingBag,
  Type,
  Eye,
  ArrowLeft,
  Maximize2,
  X
} from 'lucide-react';

import { composePrintReadySheet } from '@/lib/compositor';

interface Props {
  product: Product;
  user: AuthUser;
  onBack: () => void;
  onOrderPlaced: () => void;
}

export const StudioView: React.FC<Props> = ({
  product,
  user,
  onBack,
  onOrderPlaced,
}) => {
  const isCustomer = user.role === 'customer';
  const [selectedYear, setSelectedYear] = useState<number>(product.defaultYear);
  const [currentSheetIndex, setCurrentSheetIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [showFullReview, setShowFullReview] = useState<boolean>(false);
  const [showBroadTemplatesModal, setShowBroadTemplatesModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Global Fixed Branding Variables (Applied across all sheets)
  const [globalLogoBase64, setGlobalLogoBase64] = useState<string>('');
  const [globalBrandName, setGlobalBrandName] = useState<string>('');
  const [globalTextInputs, setGlobalTextInputs] = useState<Record<string, string>>({});
  const [showGlobalSettings, setShowGlobalSettings] = useState<boolean>(true);

  // Sheet states
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

  const currentSheet: SheetDefinition = product.sheets[currentSheetIndex];
  const currentSheetItem = sheetData[currentSheet.id];
  const activeTemplate =
    currentSheet.templates.find((t) => t.id === currentSheetItem.selectedTemplateId) ||
    currentSheet.templates[0];

  // Pricing calculation
  const calculateUnitPrice = (qty: number) => {
    const tier = product.tiers.find(
      (t) => qty >= t.minQty && (t.maxQty ? qty <= t.maxQty : true)
    );
    return tier ? tier.pricePerUnit : product.basePrice;
  };

  const unitPrice = calculateUnitPrice(quantity);
  const totalPrice = unitPrice * quantity;

  // Upload handler
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

  // Submit order directly into database with 100% full merged print-ready composites
  const handlePlaceOrder = async () => {
    setIsSubmitting(true);
    try {
      // Compose 100% complete print-ready image for each customized sheet
      const finalizedSheets: CustomizedSheetItem[] = [];

      for (const sheet of product.sheets) {
        const item = sheetData[sheet.id];
        const chosenTemplate =
          sheet.templates.find((t) => t.id === item.selectedTemplateId) || sheet.templates[0];

        let composedUrl = '';
        try {
          composedUrl = await composePrintReadySheet({
            template: chosenTemplate,
            year: selectedYear,
            monthIndices: sheet.monthIndices,
            userImageBase64: item.userImageBase64,
            globalLogoBase64: globalLogoBase64,
            globalBrandName: globalBrandName,
            globalTextInputs: globalTextInputs,
            caption: item.customText,
            targetWidth: 2480, // A5 300 DPI high resolution
            aspectRatio: parseFloat(sheet.aspectRatio) || 1.414,
          });
        } catch (composeErr) {
          console.warn(`Failed composing sheet ${sheet.title}:`, composeErr);
        }

        finalizedSheets.push({
          ...item,
          composedPrintUrl: composedUrl || item.userImageBase64,
        });
      }

      const orderPayload = {
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: '9876543210',
        shippingAddress: {
          street: '42 Print Boulevard, Design Park',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500081',
        },
        productId: product.id,
        productTitle: product.title,
        year: selectedYear,
        quantity,
        unitPrice,
        totalAmount: totalPrice,
        globalVariables: {
          logoBase64: globalLogoBase64,
          brandName: globalBrandName,
          textInputs: globalTextInputs,
        },
        sheets: finalizedSheets,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) throw new Error('Order submission failed');

      alert('Order successfully saved into database with full print-ready artwork!');
      onOrderPlaced();
    } catch {
      alert('Failed to place order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedPreviewShield enabled={isCustomer}>
      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        {/* Studio Top bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-black text-white">{product.title}</h2>
              <p className="text-xs text-slate-400">
                {product.category === 'memento' || product.category === 'banner' || product.category === 'card'
                  ? 'Print Surface'
                  : 'Sheet'} {currentSheetIndex + 1} of {product.sheets.length} &middot;{' '}
                <span className="text-rose-400 font-bold">{currentSheet.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Year Selector (Only for Calendars) */}
            {(product.category === 'desk' || product.category === 'wall') && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-500 font-bold px-2">Year:</span>
                {product.supportedYears.map((yr) => (
                  <button
                    key={yr}
                    onClick={() => setSelectedYear(yr)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      selectedYear === yr
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowFullReview(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5 text-rose-500" />
              <span>Review Sheets</span>
            </button>
          </div>
        </div>

        {/* Global Fixed Branding Setup (Applies across all 13 calendar sheets) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h3 className="font-extrabold text-sm text-white">
                Global Branding Inputs (Applies Across All Sheets Automatically)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowGlobalSettings(!showGlobalSettings)}
              className="text-xs text-cyan-400 hover:underline font-bold"
            >
              {showGlobalSettings ? 'Collapse' : 'Edit Global Branding'}
            </button>
          </div>

          {showGlobalSettings && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
              {/* Global Logo Upload */}
              <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {globalLogoBase64 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={globalLogoBase64} alt="Brand Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-slate-500 font-bold">LOGO</span>
                  )}
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-slate-300 block mb-1">
                    Brand Logo (PNG / JPG):
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 rounded-lg text-xs font-bold cursor-pointer transition">
                    <Upload className="w-3 h-3" />
                    <span>{globalLogoBase64 ? 'Change Logo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setGlobalLogoBase64(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Dynamic Styled Text Input Fields (Discovered from Active Template or fallback) */}
              {(() => {
                const slots = activeTemplate?.textSlots || (activeTemplate?.textSlot ? [activeTemplate.textSlot] : []);
                if (slots.length === 0) {
                  return (
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
                      <span className="text-[11px] font-bold text-slate-300 block mb-1">
                        Company Name / Title:
                      </span>
                      <input
                        type="text"
                        value={globalBrandName}
                        onChange={(e) => setGlobalBrandName(e.target.value)}
                        placeholder="e.g. Acme Innovations Pvt Ltd"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-bold focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>
                  );
                }

                return slots.map((slot, sIdx) => {
                  const currentValue = globalTextInputs[slot.id] !== undefined
                    ? globalTextInputs[slot.id]
                    : (slot.id === 'text-1' && globalBrandName ? globalBrandName : slot.defaultText || '');

                  return (
                    <div key={slot.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex flex-col justify-center">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-[11px] font-bold text-slate-300">
                          {slot.label ? `${slot.label}:` : `Text Input #${sIdx + 1}:`}
                        </span>
                        <span className="text-[9px] font-mono text-pink-400">
                          {slot.fontFamily}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGlobalTextInputs((prev) => ({ ...prev, [slot.id]: val }));
                          if (slot.id === 'text-1' || sIdx === 0) {
                            setGlobalBrandName(val);
                          }
                        }}
                        placeholder={slot.placeholder || slot.label || 'Enter text here...'}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-bold focus:ring-1 focus:ring-pink-500"
                      />
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>

        {/* Horizontal Sheet Selector Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-md'
                    : isFilled
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {isFilled && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                <span>{sheet.title}</span>
              </button>
            );
          })}
        </div>

        {/* Workspace: Mockup & Multi-template Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Protected Mockup Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="w-full max-w-xl">
              <CalendarMockupFrame
                orientation={product.orientation}
                productCategory={product.category}
              >
                <SheetRenderer
                  template={activeTemplate}
                  year={selectedYear}
                  monthIndices={currentSheet.monthIndices}
                  userImage={currentSheetItem.userImageBase64}
                  customText={currentSheetItem.customText}
                  globalLogo={globalLogoBase64}
                  globalBrandName={globalBrandName}
                  globalTextInputs={globalTextInputs}
                  aspectRatio={currentSheet.aspectRatio}
                  productCategory={product.category}
                />
              </CalendarMockupFrame>

              {/* Prev / Next Buttons */}
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => currentSheetIndex > 0 && setCurrentSheetIndex(currentSheetIndex - 1)}
                  disabled={currentSheetIndex === 0}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4 inline mr-1" /> Prev Sheet
                </button>

                <span className="text-xs font-mono font-bold text-slate-500">
                  {currentSheetIndex + 1} / {product.sheets.length}
                </span>

                <button
                  onClick={() => {
                    if (currentSheetIndex < product.sheets.length - 1) {
                      setCurrentSheetIndex(currentSheetIndex + 1);
                    } else {
                      setShowFullReview(true);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  {currentSheetIndex === product.sheets.length - 1 ? 'Finish & Review' : 'Next Sheet'} <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          </div>

          {/* Right: Upload & Instant Multi-Template Variations (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Upload box */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  Step 1: Upload Photo for {currentSheet.title}
                </h3>
                {currentSheetItem.userImageBase64 && (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                )}
              </div>

              <label className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-rose-500/40 hover:border-rose-500 bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>{currentSheetItem.userImageBase64 ? 'Change Uploaded Photo' : 'Select Photo (PNG / JPG / WEBP)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* 2. Instant Multi-Design options */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                  Step 2: Choose Template ({currentSheet.templates.length} Styles)
                </h3>
                <button
                  type="button"
                  onClick={() => setShowBroadTemplatesModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 text-[10px] font-bold flex items-center gap-1 transition"
                  title="Expand to full screen gallery"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Broader View</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {currentSheet.templates.map((tpl) => {
                  const isSelected = tpl.id === activeTemplate.id;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setSheetData((prev) => ({
                          ...prev,
                          [currentSheet.id]: {
                            ...prev[currentSheet.id],
                            selectedTemplateId: tpl.id,
                          },
                        }));
                      }}
                      className={`p-2 rounded-xl border-2 text-left transition flex flex-col gap-2 ${
                        isSelected
                          ? 'border-rose-600 bg-slate-800 shadow-md ring-2 ring-rose-600/30'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div className="rounded overflow-hidden pointer-events-none">
                        <SheetRenderer
                          template={tpl}
                          year={selectedYear}
                          monthIndices={currentSheet.monthIndices}
                          userImage={currentSheetItem.userImageBase64}
                          customText={currentSheetItem.customText}
                          globalLogo={globalLogoBase64}
                          globalBrandName={globalBrandName}
                          globalTextInputs={globalTextInputs}
                          aspectRatio={currentSheet.aspectRatio}
                          productCategory={product.category}
                          className="scale-95 origin-center shadow-none border-none"
                        />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-200">
                        <span className="truncate">{tpl.name}</span>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-rose-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Caption text */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Optional Caption / Date Highlight:
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={currentSheetItem.customText || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    setSheetData((prev) => ({
                      ...prev,
                      [currentSheet.id]: {
                        ...prev[currentSheet.id],
                        customText: text,
                      },
                    }));
                  }}
                  placeholder="e.g. Joyful Memories"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Pricing card & Checkout */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/60 via-slate-900 to-slate-900 border border-rose-900/40 space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-2xl font-black text-rose-400">₹{unitPrice}</span>
                  <span className="text-xs text-slate-400 ml-1">/ piece</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">Qty:</span>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="bg-slate-950 text-white text-xs font-bold rounded-lg px-2.5 py-1 border border-slate-700"
                  >
                    {[1, 2, 3, 5, 10, 20, 50, 100].map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-between text-xs pt-2 border-t border-slate-800">
                <span className="text-slate-400">Total Amount:</span>
                <span className="text-base font-extrabold text-white">₹{totalPrice}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                {isSubmitting ? 'Placing Order...' : `Submit Order (₹${totalPrice})`}
              </button>
            </div>
          </div>
        </div>

        {/* Modal: Broader Multi-Template Selection Gallery */}
        {showBroadTemplatesModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-white">
                    Choose Your Favorite Design for {currentSheet.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Viewing all available layout styles in full resolution with your uploaded photo live in action.
                  </p>
                </div>
                <button
                  onClick={() => setShowBroadTemplatesModal(false)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* High-Impact Broad Grid (3 cols on desktop) */}
              <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSheet.templates.map((tpl) => {
                  const isSelected = tpl.id === activeTemplate.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => {
                        setSheetData((prev) => ({
                          ...prev,
                          [currentSheet.id]: {
                            ...prev[currentSheet.id],
                            selectedTemplateId: tpl.id,
                          },
                        }));
                        setShowBroadTemplatesModal(false);
                      }}
                      className={`group cursor-pointer rounded-2xl border-2 p-3 transition flex flex-col gap-3 ${
                        isSelected
                          ? 'border-rose-600 bg-slate-800/90 shadow-2xl ring-2 ring-rose-600/40'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div className="rounded-xl overflow-hidden pointer-events-none shadow-md">
                        <SheetRenderer
                          template={tpl}
                          year={selectedYear}
                          monthIndices={currentSheet.monthIndices}
                          userImage={currentSheetItem.userImageBase64}
                          customText={currentSheetItem.customText}
                          globalLogo={globalLogoBase64}
                          globalBrandName={globalBrandName}
                          globalTextInputs={globalTextInputs}
                          aspectRatio={currentSheet.aspectRatio}
                          productCategory={product.category}
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="font-extrabold text-sm text-white block group-hover:text-rose-400 transition">
                            {tpl.name}
                          </span>
                          <span className="text-[10px] uppercase font-mono text-slate-500">
                            Style: {tpl.style}
                          </span>
                        </div>
                        {isSelected ? (
                          <span className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold group-hover:bg-rose-600 group-hover:text-white transition">
                            Apply This Style
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedPreviewShield>
  );
};

