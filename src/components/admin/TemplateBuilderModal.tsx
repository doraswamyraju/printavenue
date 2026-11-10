'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Move,
  Sliders,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Product, SheetDefinition, DesignTemplate } from '@/types';

interface Props {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TemplateBuilderModal: React.FC<Props> = ({
  product,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [selectedSheetId, setSelectedSheetId] = useState<string>(product.sheets[0]?.id || '');
  const [templateName, setTemplateName] = useState('');
  const [shapeType, setShapeType] = useState<'rect' | 'circle' | 'polygon' | 'svgMask'>('rect');
  const [styleTheme, setStyleTheme] = useState<'modern' | 'minimal' | 'bold' | 'classic' | 'polaroid'>('modern');

  // Interactive Bounding Box Coordinates (Percentages 0-100)
  const [imageLayout, setImageLayout] = useState({
    x: 10,
    y: 10,
    width: 45,
    height: 75,
    borderRadius: 8,
  });

  // Calendar Coordinates
  const [calendarLayout, setCalendarLayout] = useState({
    x: 60,
    y: 15,
    width: 35,
    height: 70,
    theme: 'dark' as 'dark' | 'light' | 'accent' | 'minimal',
  });

  // Polygon Points (Comma-separated percentages for custom polygons)
  const [polygonPoints, setPolygonPoints] = useState('0% 0%, 100% 0%, 100% 100%, 0% 100%');
  const [maskSvgUrl, setMaskSvgUrl] = useState('');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [isSaving, setIsSaving] = useState(false);

  // Sample image for live designer preview
  const samplePhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80';

  if (!isOpen) return null;

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
          borderRadius: imageLayout.borderRadius,
          objectFit: 'cover',
          shapeType,
          polygonPoints: shapeType === 'polygon' ? polygonPoints : undefined,
          maskSvgUrl: shapeType === 'svgMask' ? maskSvgUrl : undefined,
        },
        calendarLayout: {
          x: calendarLayout.x,
          y: calendarLayout.y,
          width: calendarLayout.width,
          height: calendarLayout.height,
          theme: calendarLayout.theme,
        },
        background: {
          type: 'color',
          value: bgColor,
        },
      };

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          sheetId: selectedSheetId,
          template: newTemplate,
        }),
      });

      if (!res.ok) throw new Error('Failed to save template');

      alert('New template layout saved to database!');
      onSaved();
      onClose();
    } catch {
      alert('Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  // Polygon presets helper
  const setPresetShape = (type: string) => {
    if (type === 'arch') {
      setShapeType('polygon');
      setPolygonPoints('0% 25%, 20% 5%, 50% 0%, 80% 5%, 100% 25%, 100% 100%, 0% 100%');
    } else if (type === 'hexagon') {
      setShapeType('polygon');
      setPolygonPoints('25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%');
    } else if (type === 'diamond') {
      setShapeType('polygon');
      setPolygonPoints('50% 0%, 100% 50%, 50% 100%, 0% 50%');
    } else if (type === 'circle') {
      setShapeType('circle');
    } else {
      setShapeType('rect');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Admin Visual Template Studio
              </h3>
              <p className="text-[11px] text-slate-400">
                Mark arbitrary image cutout shapes and calendar coordinates for {product.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Body: Interactive Canvas + Control Sidebar */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Canvas: Real-time interactive layout preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-500 mb-3 tracking-widest">
              Live Interactive Canvas Preview
            </span>

            {/* The Sheet Canvas */}
            <div
              className="relative w-full shadow-2xl rounded-lg overflow-hidden border border-slate-700 select-none transition-all"
              style={{
                aspectRatio: '1.414',
                backgroundColor: bgColor,
              }}
            >
              {/* Photo Area with Custom Clipping */}
              <div
                className="absolute overflow-hidden transition-all flex items-center justify-center shadow-md border border-dashed border-rose-400"
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
                  maskImage: shapeType === 'svgMask' && maskSvgUrl ? `url(${maskSvgUrl})` : undefined,
                  WebkitMaskImage: shapeType === 'svgMask' && maskSvgUrl ? `url(${maskSvgUrl})` : undefined,
                  maskSize: 'cover',
                  WebkitMaskSize: 'cover',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={samplePhoto}
                  alt="Sample Preview"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 bg-black/60 px-1.5 py-0.5 rounded text-[8px] text-white font-mono">
                  {shapeType.toUpperCase()}
                </span>
              </div>

              {/* Dynamic Calendar Placeholder Area */}
              <div
                className="absolute flex flex-col justify-center items-center p-2 rounded border border-dashed border-blue-400 bg-blue-50/10 backdrop-blur-[2px]"
                style={{
                  left: `${calendarLayout.x}%`,
                  top: `${calendarLayout.y}%`,
                  width: `${calendarLayout.width}%`,
                  height: `${calendarLayout.height}%`,
                }}
              >
                <div className="w-full text-center">
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block">
                    January 2027
                  </span>
                  <div className="grid grid-cols-7 gap-1 mt-1 text-[8px] text-slate-700 font-bold">
                    <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mt-1 text-[7px] text-slate-600">
                    {Array.from({ length: 28 }).map((_, i) => (
                      <span key={i} className={i % 7 === 0 ? 'text-red-500 font-bold' : ''}>{i + 1}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-4 text-center">
              Admin defines image & calendar zones. Customer photos will automatically conform to this exact shape.
            </p>
          </div>

          {/* Right Controls: Coordinate Sliders & Shape Definition (5 cols) */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            {/* Sheet Target */}
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                Target Sheet:
              </label>
              <select
                value={selectedSheetId}
                onChange={(e) => setSelectedSheetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-bold"
              >
                {product.sheets.map((s) => (
                  <option key={s.id} value={s.id}>
                    Sheet #{s.sheetNumber}: {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Name */}
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                Template Name:
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Vintage Arch Silhouette"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Shape Chooser & Preset Badges */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <label className="block text-slate-300 font-bold">
                Image Shape Style:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Standard Rectangle', val: 'rect' },
                  { label: 'Arched Window', val: 'arch' },
                  { label: 'Hexagon Cutout', val: 'hexagon' },
                  { label: 'Diamond', val: 'diamond' },
                  { label: 'Circle Mask', val: 'circle' },
                ].map((s) => (
                  <button
                    key={s.val}
                    type="button"
                    onClick={() => setPresetShape(s.val)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {shapeType === 'polygon' && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <label className="block text-[10px] text-slate-400 mb-1">
                    Polygon Coordinates (`clip-path` points):
                  </label>
                  <input
                    type="text"
                    value={polygonPoints}
                    onChange={(e) => setPolygonPoints(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-[11px] font-mono text-amber-300"
                  />
                </div>
              )}
            </div>

            {/* Image Zone Sliders */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 block text-[11px]">
                Photo Zone Dimensions (%):
              </span>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400">Position X: {imageLayout.x}%</span>
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
                  <span className="text-slate-400">Position Y: {imageLayout.y}%</span>
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
              </div>
            </div>

            {/* Calendar Zone Sliders */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 block text-[11px]">
                Calendar Grid Zone (%):
              </span>
              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <span className="text-slate-400">Position X: {calendarLayout.x}%</span>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={calendarLayout.x}
                    onChange={(e) => setCalendarLayout({ ...calendarLayout, x: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <span className="text-slate-400">Width: {calendarLayout.width}%</span>
                  <input
                    type="range"
                    min="15"
                    max="90"
                    value={calendarLayout.width}
                    onChange={(e) => setCalendarLayout({ ...calendarLayout, width: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving Template...' : 'Save Template to Database'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
