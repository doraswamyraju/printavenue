'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Trash2,
  RotateCcw,
  Move,
  Info
} from 'lucide-react';
import { Product, DesignTemplate } from '@/types';

interface Point {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
}

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
  const [selectedSheetNumber, setSelectedSheetNumber] = useState<number>(6); // Default e.g. July (Sheet 7 / index 6)
  const [templateName, setTemplateName] = useState('');
  const [artworkImage, setArtworkImage] = useState<string>('');

  // Mode: 'polygon' (interactive freeform points) or 'box' (simple rect)
  const [shapeMode, setShapeMode] = useState<'polygon' | 'rect'>('polygon');

  // Interactive Arbitrary Polygon Points (default to a 5-point shape resembling the cyan zone)
  const [points, setPoints] = useState<Point[]>([
    { x: 0, y: 0 },
    { x: 34, y: 0 },
    { x: 45, y: 38 },
    { x: 35, y: 76 },
    { x: 0, y: 76 },
  ]);

  const [activePointIdx, setActivePointIdx] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // Simple rect fallback coordinates
  const [rectLayout, setRectLayout] = useState({
    x: 0,
    y: 0,
    width: 45,
    height: 76,
  });

  const [hasArtworkCalendar, setHasArtworkCalendar] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Sample customer image to simulate real live clipping
  const sampleCustomerPhoto =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  if (!isOpen) return null;

  // Convert points array to CSS clip-path polygon string
  const polygonCss = points
    .map((p) => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`)
    .join(', ');

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

  // Canvas mouse interactions for dragging polygon vertices
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingIdx === null || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const rawX = ((clientX - rect.left) / rect.width) * 100;
    const rawY = ((clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, parseFloat(rawX.toFixed(1))));
    const clampedY = Math.max(0, Math.min(100, parseFloat(rawY.toFixed(1))));

    setPoints((prev) => {
      const updated = [...prev];
      updated[draggingIdx] = { x: clampedX, y: clampedY };
      return updated;
    });
  };

  const handleCanvasMouseUp = () => {
    setDraggingIdx(null);
  };

  // Add a new point near the clicked location or mid-point
  const handleAddPoint = () => {
    if (points.length >= 20) return;
    // Insert new point after active point, or at end
    const lastPoint = points[points.length - 1];
    const newPoint: Point = {
      x: Math.min(100, lastPoint.x + 5),
      y: Math.min(100, lastPoint.y + 5),
    };
    setPoints([...points, newPoint]);
    setActivePointIdx(points.length);
  };

  // Delete selected point (minimum 3 required)
  const handleDeleteSelectedPoint = () => {
    if (points.length <= 3) {
      alert('A polygon requires at least 3 points.');
      return;
    }
    if (activePointIdx !== null) {
      setPoints(points.filter((_, idx) => idx !== activePointIdx));
      setActivePointIdx(null);
    }
  };

  // Preset polygon shapes
  const applyPreset = (preset: 'cyan-corner' | 'slant' | 'hexagon' | 'rectangle') => {
    if (preset === 'cyan-corner') {
      // Matches the exact slanted cutout shape from your screenshot!
      setPoints([
        { x: 0, y: 0 },
        { x: 34, y: 0 },
        { x: 45, y: 38 },
        { x: 35, y: 76 },
        { x: 0, y: 76 },
      ]);
    } else if (preset === 'slant') {
      setPoints([
        { x: 0, y: 0 },
        { x: 48, y: 0 },
        { x: 38, y: 100 },
        { x: 0, y: 100 },
      ]);
    } else if (preset === 'hexagon') {
      setPoints([
        { x: 25, y: 5 },
        { x: 75, y: 5 },
        { x: 95, y: 50 },
        { x: 75, y: 95 },
        { x: 25, y: 95 },
        { x: 5, y: 50 },
      ]);
    } else if (preset === 'rectangle') {
      setPoints([
        { x: 5, y: 5 },
        { x: 50, y: 5 },
        { x: 50, y: 95 },
        { x: 5, y: 95 },
      ]);
    }
  };

  // Save template to database
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template title (e.g. July Summer Breeze).');
      return;
    }

    setIsSaving(true);
    try {
      // Calculate bounding box encompassing all polygon points
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));

      const width = maxX - minX || 50;
      const height = maxY - minY || 50;

      // Normalize polygon points relative to bounding box (0 - 100%)
      const relativePolygonPoints = points
        .map((p) => {
          const relX = ((p.x - minX) / width) * 100;
          const relY = ((p.y - minY) / height) * 100;
          return `${relX.toFixed(1)}% ${relY.toFixed(1)}%`;
        })
        .join(', ');

      const newTemplate: DesignTemplate = {
        id: `tpl-${Date.now()}`,
        name: templateName.trim(),
        style: 'modern',
        imageLayout: {
          x: minX,
          y: minY,
          width: width,
          height: height,
          borderRadius: 0,
          objectFit: 'cover',
          shapeType: 'polygon',
          polygonPoints: relativePolygonPoints,
        },
        calendarLayout: {
          x: 50,
          y: 8,
          width: hasArtworkCalendar ? 0 : 45,
          height: hasArtworkCalendar ? 0 : 80,
          theme: 'dark',
        },
        background: {
          type: artworkImage ? 'image' : 'color',
          value: artworkImage || '#FFFFFF',
        },
      };

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

      alert('Complex polygon template successfully saved to database!');
      onSaved();
      onClose();
    } catch {
      alert('Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-7xl w-full max-h-[96vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
              <Move className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Interactive Multi-Point Polygon & Artwork Mapper
              </h3>
              <p className="text-xs text-slate-400">
                Click & drag anchor pins directly on the visualizer to trace any arbitrary non-square shape.
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

        {/* Studio Workspace */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left: The Interactive Polygon Canvas (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center justify-start bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
            {/* Toolbar above canvas */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => applyPreset('cyan-corner')}
                  className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-bold text-[11px]"
                >
                  ⚡ Slanted Cutout (Like July)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('slant')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 font-semibold text-[11px]"
                >
                  Angle Slant
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('hexagon')}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 font-semibold text-[11px]"
                >
                  Hexagon
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddPoint}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Anchor Pin
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelectedPoint}
                  disabled={activePointIdx === null || points.length <= 3}
                  className="px-3 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center gap-1 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Pin
                </button>
              </div>
            </div>

            {/* The Visualizer Canvas */}
            <div
              ref={canvasRef}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              className="relative w-full rounded-2xl overflow-hidden border border-slate-700 select-none shadow-2xl bg-slate-800"
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
                  <span>Upload template artwork on the right to start tracing</span>
                </div>
              )}

              {/* Real-time Clipped Customer Photo */}
              <div
                className="absolute inset-0 pointer-events-none transition-all"
                style={{
                  clipPath: `polygon(${polygonCss})`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleCustomerPhoto}
                  alt="Customer Simulation"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Polygon Outline SVG Overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                <polygon
                  points={points.map((p) => `${p.x}%,${p.y}%`).join(' ')}
                  fill="rgba(244, 63, 94, 0.15)"
                  stroke="#F43F5E"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
              </svg>

              {/* Draggable Point Handles */}
              {points.map((p, idx) => {
                const isSelected = activePointIdx === idx;
                return (
                  <div
                    key={idx}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setActivePointIdx(idx);
                      setDraggingIdx(idx);
                    }}
                    className={`absolute z-20 w-5 h-5 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing font-mono text-[9px] font-bold shadow-xl transition-transform ${
                      isSelected
                        ? 'bg-rose-500 text-white ring-4 ring-rose-500/50 scale-125'
                        : 'bg-white text-slate-900 border-2 border-rose-600 hover:scale-110'
                    }`}
                    style={{
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                    }}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            <div className="w-full p-3 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>
                <strong>How to use:</strong> Click on any numbered circle (1, 2, 3...) and drag it to align with the border of your artwork. Click <strong>Add Anchor Pin</strong> to add extra corners/curved points!
              </span>
            </div>
          </div>

          {/* Right: Controls & Mapping Configuration (4 cols) */}
          <div className="lg:col-span-4 space-y-4 text-xs">
            {/* Step 1: Upload Template Image */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-rose-400">
                  1. Template Artwork
                </span>
                {artworkImage && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                )}
              </div>

              <label className="w-full py-3 px-3 rounded-xl border border-dashed border-slate-700 hover:border-rose-500 bg-slate-900 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-rose-400" />
                <span>{artworkImage ? 'Replace Image' : 'Upload Graphic Artwork'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleArtworkUpload}
                  className="hidden"
                />
              </label>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasArtworkCalendar}
                  onChange={(e) => setHasArtworkCalendar(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 bg-slate-900 border-slate-700"
                />
                <span className="text-[11px] text-slate-300 font-medium">
                  Artwork contains printed calendar dates (hide grid)
                </span>
              </label>
            </div>

            {/* Step 2: Name & Month Sheet */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-400 block">
                2. Template Details
              </span>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Template Name:
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. July Summer Breeze Cutout"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Assign to Month / Sheet:
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

            {/* Step 3: Available In Products */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-xs uppercase tracking-wider text-emerald-400 block">
                3. Available In Products:
              </span>
              <div className="space-y-1.5">
                {allProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      onClick={() => {
                        if (isChecked) {
                          if (selectedProductIds.length > 1) {
                            setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                          }
                        } else {
                          setSelectedProductIds([...selectedProductIds, p.id]);
                        }
                      }}
                      className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                        isChecked
                          ? 'bg-rose-950/40 border-rose-800 text-white font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-xs truncate">{p.title}</span>
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

            {/* Save Button */}
            <button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving Template...' : 'Save & Publish Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
