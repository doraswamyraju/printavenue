'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  Sliders,
  CheckCircle2,
  Calendar,
  Sparkles,
  Image as ImageIcon
} from 'lucide-react';
import { Product, DesignTemplate } from '@/types';

interface Props {
  product: Product;
  allProducts: Product[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TemplateBuilderModal: React.FC<Props> = ({
  product,
  allProducts,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([product.id]);
  const [selectedSheetNumber, setSelectedSheetNumber] = useState<number>(1); // e.g., Sheet 1 (Jan), Sheet 7 (Jul), etc.
  const [templateName, setTemplateName] = useState('');
  const [styleTheme, setStyleTheme] = useState<'modern' | 'minimal' | 'bold' | 'classic' | 'polaroid'>('modern');

  // Background artwork (e.g. the full floral/beach illustration)
  const [artworkImage, setArtworkImage] = useState<string>('');
  
  // Custom Photo Frame Coordinates on top of the Artwork (Percentages 0-100)
  const [imageLayout, setImageLayout] = useState({
    x: 8,
    y: 7,
    width: 39,
    height: 79,
    borderRadius: 22,
  });

  // Calendar Coordinates
  const [calendarLayout, setCalendarLayout] = useState({
    x: 50,
    y: 8,
    width: 44,
    height: 78,
    theme: 'dark' as 'dark' | 'light' | 'accent' | 'minimal',
    hasArtworkCalendar: false, // If the artwork already contains the printed calendar numbers (like the user image)
  });

  const [shapeType, setShapeType] = useState<'rect' | 'circle' | 'polygon'>('rect');
  const [polygonPoints, setPolygonPoints] = useState('0% 0%, 100% 0%, 100% 100%, 0% 100%');
  const [isSaving, setIsSaving] = useState(false);

  // Sample photo to preview how customer's picture will sit inside the frame
  const sampleCustomerPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';

  if (!isOpen) return null;

  // Handle uploading full template background artwork
  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setArtworkImage(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleProductSelection = (prodId: string) => {
    if (selectedProductIds.includes(prodId)) {
      if (selectedProductIds.length > 1) {
        setSelectedProductIds(selectedProductIds.filter((id) => id !== prodId));
      }
    } else {
      setSelectedProductIds([...selectedProductIds, prodId]);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name.');
      return;
    }

    setIsSaving(true);
    try {
      const newTemplate: DesignTemplate = {
        id: `tpl-${Date.now()}`,
        name: templateName.trim(),
        style: styleTheme,
        imageLayout: {
          x: imageLayout.x,
          y: imageLayout.y,
          width: imageLayout.width,
          height: imageLayout.height,
          borderRadius: shapeType === 'rect' ? imageLayout.borderRadius : 0,
          objectFit: 'cover',
          shapeType,
          polygonPoints: shapeType === 'polygon' ? polygonPoints : undefined,
        },
        calendarLayout: {
          x: calendarLayout.x,
          y: calendarLayout.y,
          width: calendarLayout.hasArtworkCalendar ? 0 : calendarLayout.width,
          height: calendarLayout.hasArtworkCalendar ? 0 : calendarLayout.height,
          theme: calendarLayout.theme,
        },
        background: {
          type: artworkImage ? 'image' : 'color',
          value: artworkImage || '#FFFFFF',
        },
      };

      // Save across all selected products
      for (const prodId of selectedProductIds) {
        const targetProd = allProducts.find((p) => p.id === prodId) || product;
        const targetSheet = targetProd.sheets[selectedSheetNumber] || targetProd.sheets[0];

        await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: prodId,
            sheetId: targetSheet.id,
            template: newTemplate,
          }),
        });
      }

      alert('Template successfully saved and assigned to selected products & sheets!');
      onSaved();
      onClose();
    } catch {
      alert('Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Admin Custom Artwork & Field Mapper Studio
              </h3>
              <p className="text-xs text-slate-400">
                Upload your graphic template (illustrations, flowers, pre-printed dates) and define where customer photos sit.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left: Interactive Live Artwork Stage (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800">
            <div className="w-full flex justify-between items-center mb-3 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                Live Field Visualizer
              </span>
              <span className="text-rose-400 font-semibold text-[11px]">
                Drag sliders on the right to position photo field
              </span>
            </div>

            {/* Canvas Stage */}
            <div
              className="relative w-full shadow-2xl rounded-xl overflow-hidden border border-slate-700 select-none bg-slate-800"
              style={{
                aspectRatio: '1.414',
                backgroundImage: artworkImage ? `url(${artworkImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!artworkImage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <ImageIcon className="w-10 h-10 stroke-1" />
                  <span>No background artwork uploaded yet (using default white)</span>
                </div>
              )}

              {/* Marked Photo Zone (Customer Photo Preview) */}
              <div
                className="absolute overflow-hidden shadow-2xl border-2 border-dashed border-rose-500 transition-all flex items-center justify-center"
                style={{
                  left: `${imageLayout.x}%`,
                  top: `${imageLayout.y}%`,
                  width: `${imageLayout.width}%`,
                  height: `${imageLayout.height}%`,
                  borderRadius: shapeType === 'rect' ? `${imageLayout.borderRadius}px` : undefined,
                  clipPath:
                    shapeType === 'polygon'
                      ? `polygon(${polygonPoints})`
                      : shapeType === 'circle'
                      ? 'circle(50% at 50% 50%)'
                      : undefined,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleCustomerPhoto}
                  alt="Customer Upload Simulation"
                  className="w-full h-full object-cover pointer-events-none"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[9px] font-mono text-emerald-300 font-bold">
                  CUSTOMER PHOTO SLOT
                </div>
              </div>

              {/* Dynamic Calendar Grid Box (Only if artwork does NOT already have the dates printed) */}
              {!calendarLayout.hasArtworkCalendar && (
                <div
                  className="absolute p-2 rounded border border-dashed border-blue-400 bg-white/20 backdrop-blur-sm flex flex-col justify-center items-center text-slate-900"
                  style={{
                    left: `${calendarLayout.x}%`,
                    top: `${calendarLayout.y}%`,
                    width: `${calendarLayout.width}%`,
                    height: `${calendarLayout.height}%`,
                  }}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Dynamic Calendar Box
                  </span>
                  <span className="text-[9px] text-slate-700">Auto-generated grid overlay</span>
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Customer photos will be automatically fitted and clipped inside this designated slot!
              </p>
            </div>
          </div>

          {/* Right: Upload Artwork, Mark Fields & Assign Products (5 cols) */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            {/* Step 1: Upload Template Artwork File */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-rose-400">
                  1. Template Artwork Image
                </span>
                {artworkImage && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Artwork Loaded
                  </span>
                )}
              </div>

              <label className="w-full py-3 px-3 rounded-xl border border-dashed border-slate-700 hover:border-rose-500 bg-slate-900 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-rose-400" />
                <span>{artworkImage ? 'Replace Template Image' : 'Upload Template File (JPG / PNG / SVG)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hasPrintedCalendar"
                  checked={calendarLayout.hasArtworkCalendar}
                  onChange={(e) =>
                    setCalendarLayout({
                      ...calendarLayout,
                      hasArtworkCalendar: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700"
                />
                <label htmlFor="hasPrintedCalendar" className="text-[11px] text-slate-300 font-medium">
                  This artwork already contains the printed calendar dates (e.g. July 2027)
                </label>
              </div>
            </div>

            {/* Step 2: Mark Products where this template is available */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-400 block">
                2. Available In Which Products:
              </span>
              <div className="space-y-1.5">
                {allProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      onClick={() => toggleProductSelection(p.id)}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-rose-950/40 border-rose-800 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-xs">{p.title}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="w-4 h-4 rounded text-rose-600"
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Template Name & Target Month Sheet */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 block">
                3. Name & Month Sheet
              </span>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Template Title:
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. Summer Beach July 2027"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Apply to Sheet (Month):
                </label>
                <select
                  value={selectedSheetNumber}
                  onChange={(e) => setSelectedSheetNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                >
                  {product.sheets.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      Sheet #{s.sheetNumber}: {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 4: Mark Photo Slot Field Coordinates */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-blue-400">
                  4. Mark Photo Field Position (%):
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Round: {imageLayout.borderRadius}px
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400">X Position: {imageLayout.x}%</span>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={imageLayout.x}
                    onChange={(e) => setImageLayout({ ...imageLayout, x: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Y Position: {imageLayout.y}%</span>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={imageLayout.y}
                    onChange={(e) => setImageLayout({ ...imageLayout, y: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Width: {imageLayout.width}%</span>
                  <input
                    type="range"
                    min="15"
                    max="95"
                    value={imageLayout.width}
                    onChange={(e) => setImageLayout({ ...imageLayout, width: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Height: {imageLayout.height}%</span>
                  <input
                    type="range"
                    min="15"
                    max="95"
                    value={imageLayout.height}
                    onChange={(e) => setImageLayout({ ...imageLayout, height: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Corner Radius: {imageLayout.borderRadius}px</span>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={imageLayout.borderRadius}
                    onChange={(e) => setImageLayout({ ...imageLayout, borderRadius: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving Template...' : 'Save Template to Products'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
