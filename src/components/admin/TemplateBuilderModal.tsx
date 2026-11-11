'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Move,
  Info,
  Maximize2,
  Sliders,
  RotateCcw,
  Sparkles,
  MousePointerClick
} from 'lucide-react';
import { Product, DesignTemplate } from '@/types';

interface Point {
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
}

interface Props {
  product: Product;
  allProducts: Product[];
  initialTemplate?: DesignTemplate;
  initialSheetIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TemplateBuilderModal: React.FC<Props> = ({
  product,
  allProducts,
  initialTemplate,
  initialSheetIndex,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([product.id]);
  const [selectedSheetNumber, setSelectedSheetNumber] = useState<number>(
    initialSheetIndex !== undefined ? initialSheetIndex : 6
  );
  const [templateName, setTemplateName] = useState(initialTemplate?.name || '');
  const [artworkImage, setArtworkImage] = useState<string>(
    initialTemplate?.background.type === 'image' ? initialTemplate.background.value : ''
  );

  // Parse points if editing an existing template
  const [points, setPoints] = useState<Point[]>(() => {
    if (initialTemplate?.imageLayout.shapeType === 'polygon' && initialTemplate.imageLayout.polygonPoints) {
      try {
        const parts = initialTemplate.imageLayout.polygonPoints.split(',');
        const parsed = parts.map((pt) => {
          const [xStr, yStr] = pt.trim().split(/\s+/);
          const relX = parseFloat(xStr);
          const relY = parseFloat(yStr);
          // Convert back to canvas percentages
          const absX = initialTemplate.imageLayout.x + (relX / 100) * initialTemplate.imageLayout.width;
          const absY = initialTemplate.imageLayout.y + (relY / 100) * initialTemplate.imageLayout.height;
          return {
            x: parseFloat(absX.toFixed(1)),
            y: parseFloat(absY.toFixed(1)),
          };
        });
        if (parsed.length >= 3) return parsed;
      } catch {
        // fallback
      }
    }
    return [
      { x: 0, y: 0 },
      { x: 34, y: 0 },
      { x: 45, y: 38 },
      { x: 35, y: 76 },
      { x: 0, y: 76 },
    ];
  });

  const [activePointIdx, setActivePointIdx] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // Dragging the whole polygon shape
  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; initialPoints: Point[] } | null>(null);

  // Overall Shape Position & Scale offsets
  const [shapeOffsetX, setShapeOffsetX] = useState<number>(0);
  const [shapeOffsetY, setShapeOffsetY] = useState<number>(0);
  const [shapeScale, setShapeScale] = useState<number>(100);

  // Artwork Opacity (Great for peering behind while tracing)
  const [artworkOpacity, setArtworkOpacity] = useState<number>(100);

  // Click-to-add anchor point toggle
  const [clickToAddMode, setClickToAddMode] = useState<boolean>(false);

  const [hasArtworkCalendar, setHasArtworkCalendar] = useState<boolean>(true);
  const [layerPosition, setLayerPosition] = useState<'under-artwork' | 'over-artwork'>('under-artwork');
  const [isSaving, setIsSaving] = useState(false);

  // Logo Slot Configuration
  const [logoEnabled, setLogoEnabled] = useState<boolean>(initialTemplate?.logoSlot?.enabled || false);
  const [logoX, setLogoX] = useState<number>(initialTemplate?.logoSlot?.x || 5);
  const [logoY, setLogoY] = useState<number>(initialTemplate?.logoSlot?.y || 5);
  const [logoW, setLogoW] = useState<number>(initialTemplate?.logoSlot?.width || 12);
  const [logoH, setLogoH] = useState<number>(initialTemplate?.logoSlot?.height || 12);
  const [logoShape, setLogoShape] = useState<'rect' | 'circle'>(initialTemplate?.logoSlot?.shape || 'rect');

  // Text Slot Configuration
  const [textEnabled, setTextEnabled] = useState<boolean>(initialTemplate?.textSlot?.enabled || false);
  const [textX, setTextX] = useState<number>(initialTemplate?.textSlot?.x || 5);
  const [textY, setTextY] = useState<number>(initialTemplate?.textSlot?.y || 92);
  const [textLabel, setTextLabel] = useState<string>(initialTemplate?.textSlot?.label || 'Company Name');
  const [textPlaceholder, setTextPlaceholder] = useState<string>(initialTemplate?.textSlot?.placeholder || 'e.g. Acme Corp');
  const [textFontSize, setTextFontSize] = useState<number>(initialTemplate?.textSlot?.fontSize || 16);
  const [textFontFamily, setTextFontFamily] = useState<'sans' | 'serif' | 'mono' | 'handwriting'>(
    initialTemplate?.textSlot?.fontFamily || 'sans'
  );
  const [textFontColor, setTextFontColor] = useState<string>(initialTemplate?.textSlot?.fontColor || '#1e293b');
  const [textFontWeight, setTextFontWeight] = useState<'normal' | 'bold' | 'extrabold'>(
    initialTemplate?.textSlot?.fontWeight || 'bold'
  );
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>(
    initialTemplate?.textSlot?.textAlign || 'left'
  );

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const sampleCustomerPhoto =
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

  // Global window mouseup and mousemove so dragging never drops when moving cursor fast or outside
  useEffect(() => {
    if (!isOpen) return;

    const onWindowMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();

      // 1. Moving a single Anchor Pin
      if (draggingIdx !== null) {
        const rawX = ((e.clientX - rect.left) / rect.width) * 100;
        const rawY = ((e.clientY - rect.top) / rect.height) * 100;

        // Allow points to hit exact 0% and 100% boundary
        const clampedX = Math.max(0, Math.min(100, parseFloat(rawX.toFixed(1))));
        const clampedY = Math.max(0, Math.min(100, parseFloat(rawY.toFixed(1))));

        setPoints((prev) => {
          const updated = [...prev];
          updated[draggingIdx] = { x: clampedX, y: clampedY };
          return updated;
        });
      }

      // 2. Dragging the Whole Shape
      if (isDraggingShape && dragStartRef.current) {
        const deltaX = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;

        setPoints(
          dragStartRef.current.initialPoints.map((p) => ({
            x: Math.max(0, Math.min(100, parseFloat((p.x + deltaX).toFixed(1)))),
            y: Math.max(0, Math.min(100, parseFloat((p.y + deltaY).toFixed(1)))),
          }))
        );
      }
    };

    const onWindowMouseUp = () => {
      setDraggingIdx(null);
      setIsDraggingShape(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [draggingIdx, isDraggingShape, isOpen]);

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

  // Canvas click handler: Click anywhere on artwork to add an anchor pin exactly there!
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!clickToAddMode || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint: Point = {
      x: Math.max(0, Math.min(100, parseFloat(rawX.toFixed(1)))),
      y: Math.max(0, Math.min(100, parseFloat(rawY.toFixed(1)))),
    };

    setPoints((prev) => [...prev, newPoint]);
    setActivePointIdx(points.length);
  };

  // Start dragging the entire shape
  const startDragWholeShape = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingShape(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialPoints: [...points],
    };
  };

  // Nudge entire shape horizontally / vertically
  const nudgeShape = (deltaX: number, deltaY: number) => {
    setPoints((prev) =>
      prev.map((p) => ({
        x: Math.max(0, Math.min(100, parseFloat((p.x + deltaX).toFixed(1)))),
        y: Math.max(0, Math.min(100, parseFloat((p.y + deltaY).toFixed(1)))),
      }))
    );
  };

  // Scale shape up or down from center
  const scaleShape = (factor: number) => {
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setPoints((prev) =>
      prev.map((p) => ({
        x: Math.max(0, Math.min(100, parseFloat((centerX + (p.x - centerX) * factor).toFixed(1)))),
        y: Math.max(0, Math.min(100, parseFloat((centerY + (p.y - centerY) * factor).toFixed(1)))),
      }))
    );
  };

  // Delete selected point
  const handleDeleteSelectedPoint = () => {
    if (points.length <= 3) {
      alert('A polygon shape requires at least 3 points.');
      return;
    }
    if (activePointIdx !== null) {
      setPoints(points.filter((_, idx) => idx !== activePointIdx));
      setActivePointIdx(null);
    }
  };

  // Save template to database
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template title.');
      return;
    }

    setIsSaving(true);
    try {
      const minX = Math.min(...points.map((p) => p.x));
      const maxX = Math.max(...points.map((p) => p.x));
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));

      const width = maxX - minX || 50;
      const height = maxY - minY || 50;

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
          layerPosition: layerPosition,
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
        logoSlot: logoEnabled
          ? {
              enabled: true,
              label: 'Brand Logo',
              x: logoX,
              y: logoY,
              width: logoW,
              height: logoH,
              shape: logoShape,
            }
          : undefined,
        textSlot: textEnabled
          ? {
              enabled: true,
              label: textLabel,
              placeholder: textPlaceholder,
              x: textX,
              y: textY,
              fontSize: textFontSize,
              fontFamily: textFontFamily,
              fontColor: textFontColor,
              fontWeight: textFontWeight,
              textAlign: textAlignment,
            }
          : undefined,
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

      alert('Template successfully saved to database!');
      onSaved();
      onClose();
    } catch {
      alert('Failed to save template.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-7xl w-full max-h-[96vh] flex flex-col overflow-hidden text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
              <Move className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">
                Interactive Multi-Point Vector & Artwork Studio
              </h3>
              <p className="text-xs text-slate-400">
                Move pins to exact edges, drag the entire shape, or click anywhere on the artwork to drop new pins.
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

        {/* Studio Content */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left: The Visualizer Canvas (8 cols) */}
          <div className="lg:col-span-8 flex flex-col items-center justify-start bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3">
            {/* Canvas Toolbar Controls */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Presets & Click-To-Add Mode */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setClickToAddMode(!clickToAddMode)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                    clickToAddMode
                      ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/40'
                  }`}
                  title="When active, clicking anywhere on the image adds an anchor point there"
                >
                  <MousePointerClick className="w-4 h-4" />
                  <span>{clickToAddMode ? 'Click on Artwork to Drop Pin!' : 'Click-to-Add Pin Mode'}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPoints([
                      { x: 0, y: 0 },
                      { x: 34, y: 0 },
                      { x: 45, y: 38 },
                      { x: 35, y: 76 },
                      { x: 0, y: 76 },
                    ])
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 font-bold text-[11px]"
                >
                  ⚡ July Slant Preset
                </button>
              </div>

              {/* Point Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const last = points[points.length - 1];
                    setPoints([...points, { x: Math.min(100, last.x + 5), y: Math.min(100, last.y + 5) }]);
                    setActivePointIdx(points.length);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> + Pin
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelectedPoint}
                  disabled={activePointIdx === null || points.length <= 3}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-xs flex items-center gap-1 disabled:opacity-30"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Pin
                </button>
              </div>
            </div>

            {/* The Canvas */}
            <div
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`relative w-full rounded-2xl overflow-hidden border border-slate-700 select-none shadow-2xl bg-slate-800 transition-all ${
                clickToAddMode ? 'cursor-crosshair' : ''
              }`}
              style={{
                aspectRatio: '1.414',
                backgroundImage: artworkImage ? `url(${artworkImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: artworkOpacity / 100,
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

              {/* Real-time Visualizer of Logo Slot (if enabled) */}
              {logoEnabled && (
                <div
                  className="absolute z-20 border-2 border-dashed border-cyan-400 bg-cyan-500/20 flex flex-col items-center justify-center p-1 text-cyan-200 shadow-md pointer-events-none transition-all"
                  style={{
                    left: `${logoX}%`,
                    top: `${logoY}%`,
                    width: `${logoW}%`,
                    height: `${logoH}%`,
                    borderRadius: logoShape === 'circle' ? '50%' : '6px',
                  }}
                >
                  <span className="text-[9px] font-black tracking-wider uppercase">LOGO</span>
                </div>
              )}

              {/* Real-time Visualizer of Text Slot (if enabled) */}
              {textEnabled && (
                <div
                  className="absolute z-20 pointer-events-none transition-all"
                  style={{
                    left: `${textX}%`,
                    top: `${textY}%`,
                    textAlign: textAlignment,
                  }}
                >
                  <span
                    style={{
                      color: textFontColor,
                      fontSize: `${textFontSize}px`,
                      fontFamily:
                        textFontFamily === 'serif'
                          ? 'Georgia, serif'
                          : textFontFamily === 'mono'
                          ? 'Courier New, monospace'
                          : textFontFamily === 'handwriting'
                          ? 'cursive'
                          : 'Inter, sans-serif',
                      fontWeight: textFontWeight,
                    }}
                    className="drop-shadow-md select-none whitespace-nowrap block"
                  >
                    {textLabel || 'Company Name'}
                  </span>
                </div>
              )}

              {/* Polygon Outline SVG & Draggable Surface */}
              <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                <polygon
                  points={points.map((p) => `${p.x}%,${p.y}%`).join(' ')}
                  fill="rgba(244, 63, 94, 0.18)"
                  stroke="#F43F5E"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
              </svg>

              {/* Interactive Move Zone (Click inside shape to drag the entire shape!) */}
              <div
                onMouseDown={startDragWholeShape}
                className="absolute inset-0 z-10 cursor-move"
                style={{
                  clipPath: `polygon(${polygonCss})`,
                }}
                title="Click and drag anywhere inside this shape to move the entire artwork slot!"
              />

              {/* Numbered Draggable Anchor Pins (Can move 100% to the edge) */}
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
                    className={`absolute z-30 w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing font-mono text-[10px] font-extrabold shadow-2xl transition-transform ${
                      isSelected
                        ? 'bg-rose-500 text-white ring-4 ring-rose-500/60 scale-125'
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

            {/* Shape Movement, Scaling & Coordinate Controls */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs">
              {/* Nudge Controls */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 block text-[11px]">
                  Nudge Entire Shape (X / Y):
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => nudgeShape(-2, 0)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    ◀ Left
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeShape(2, 0)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    Right ▶
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeShape(0, -2)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    ▲ Up
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgeShape(0, 2)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    ▼ Down
                  </button>
                </div>
              </div>

              {/* Resize / Scale Controls */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-400 block text-[11px]">
                  Resize / Scale Shape:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scaleShape(0.95)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    - Reduce (5%)
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleShape(1.05)}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold"
                  >
                    + Enlarge (5%)
                  </button>
                </div>
              </div>

              {/* Artwork Trace Opacity */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>Artwork Opacity:</span>
                  <span className="text-white">{artworkOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={artworkOpacity}
                  onChange={(e) => setArtworkOpacity(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>
            </div>

            {/* Selected Point Numeric Coordinates */}
            {activePointIdx !== null && points[activePointIdx] && (
              <div className="w-full p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-rose-400">
                  Selected Pin #{activePointIdx + 1} Coordinates:
                </span>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-sans">X:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={points[activePointIdx].x}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value)));
                        setPoints((prev) => {
                          const u = [...prev];
                          u[activePointIdx] = { ...u[activePointIdx], x: val };
                          return u;
                        });
                      }}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-white text-center"
                    />
                    <span>%</span>
                  </label>

                  <label className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-sans">Y:</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={points[activePointIdx].y}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, Number(e.target.value)));
                        setPoints((prev) => {
                          const u = [...prev];
                          u[activePointIdx] = { ...u[activePointIdx], y: val };
                          return u;
                        });
                      }}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-white text-center"
                    />
                    <span>%</span>
                  </label>
                </div>
              </div>
            )}
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

              {/* Layer Positioning Control */}
              <div className="pt-2 border-t border-slate-800">
                <span className="block font-bold text-slate-300 mb-1.5 text-[11px]">
                  Photo Layer Depth:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLayerPosition('under-artwork')}
                    className={`p-2 rounded-xl border text-center transition ${
                      layerPosition === 'under-artwork'
                        ? 'bg-rose-950/80 border-rose-600 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-bold">Behind Base Artwork</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">(Leaves & flowers stay in front)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLayerPosition('over-artwork')}
                    className={`p-2 rounded-xl border text-center transition ${
                      layerPosition === 'over-artwork'
                        ? 'bg-rose-950/80 border-rose-600 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-bold">Above Base Artwork</div>
                    <div className="text-[8px] text-slate-400 mt-0.5">(Photo placed on top)</div>
                  </button>
                </div>
              </div>
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

            {/* Step 2B: Logo Slot Setup */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-cyan-400 block">
                  Fixed Logo Slot (Brand)
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={logoEnabled}
                    onChange={(e) => setLogoEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500"
                  />
                  <span>Enable</span>
                </label>
              </div>

              {logoEnabled && (
                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">X Position (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={logoX}
                        onChange={(e) => setLogoX(Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Y Position (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={logoY}
                        onChange={(e) => setLogoY(Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Width (%):</span>
                      <input
                        type="number"
                        min="4"
                        max="50"
                        value={logoW}
                        onChange={(e) => setLogoW(Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Shape:</span>
                      <select
                        value={logoShape}
                        onChange={(e) => setLogoShape(e.target.value as 'rect' | 'circle')}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      >
                        <option value="rect">Rectangle / Square</option>
                        <option value="circle">Circle</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2C: Styled Text Slot (Company Name / Personal Name) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-pink-400 block">
                  Fixed Text Slot (Company / Name)
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={textEnabled}
                    onChange={(e) => setTextEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-500"
                  />
                  <span>Enable</span>
                </label>
              </div>

              {textEnabled && (
                <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px]">Label for Customer:</span>
                    <input
                      type="text"
                      value={textLabel}
                      onChange={(e) => setTextLabel(e.target.value)}
                      placeholder="e.g. Company Name"
                      className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">X Position (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={textX}
                        onChange={(e) => setTextX(Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Y Position (%):</span>
                      <input
                        type="number"
                        min="0"
                        max="95"
                        value={textY}
                        onChange={(e) => setTextY(Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Font Family:</span>
                      <select
                        value={textFontFamily}
                        onChange={(e) => setTextFontFamily(e.target.value as any)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      >
                        <option value="sans">Modern Sans (Inter)</option>
                        <option value="serif">Classic Serif (Georgia)</option>
                        <option value="mono">Monospace (Code)</option>
                        <option value="handwriting">Cursive / Signature</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Font Size (px):</span>
                      <input
                        type="number"
                        min="10"
                        max="48"
                        value={textFontSize}
                        onChange={(e) => setTextFontSize(Number(e.target.value))}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Font Color:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={textFontColor}
                          onChange={(e) => setTextFontColor(e.target.value)}
                          className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                        />
                        <span className="font-mono text-[10px] text-slate-300">{textFontColor}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Alignment:</span>
                      <select
                        value={textAlignment}
                        onChange={(e) => setTextAlignment(e.target.value as any)}
                        className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
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
