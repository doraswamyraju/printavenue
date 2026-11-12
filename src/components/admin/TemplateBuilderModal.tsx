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
  MousePointerClick,
  Type
} from 'lucide-react';
import { Product, DesignTemplate, TextSlotDefinition } from '@/types';
import { AVAILABLE_FONTS, getFontFamilyCss } from '@/lib/fonts';

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

  // Dynamic Aspect Ratio: detected from artwork image OR from sheet definition
  const targetSheet = product.sheets[selectedSheetNumber] || product.sheets[0];
  const defaultRatio = parseFloat(targetSheet?.aspectRatio || '1.414') || 1.414;
  const [canvasAspectRatio, setCanvasAspectRatio] = useState<number>(defaultRatio);

  // When sheet changes, update aspect ratio if no custom artwork image loaded
  useEffect(() => {
    if (!artworkImage && targetSheet?.aspectRatio) {
      const r = parseFloat(targetSheet.aspectRatio);
      if (r > 0) setCanvasAspectRatio(r);
    }
  }, [selectedSheetNumber, targetSheet?.aspectRatio, artworkImage]);

  // When artworkImage changes (e.g. loaded from initialTemplate or uploaded), calculate natural image aspect ratio
  useEffect(() => {
    if (artworkImage) {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const ratio = parseFloat((img.naturalWidth / img.naturalHeight).toFixed(4));
          setCanvasAspectRatio(ratio);
        }
      };
      img.src = artworkImage;
    }
  }, [artworkImage]);

  // Parse points if editing an existing template
  const [points, setPoints] = useState<Point[]>(() => {
    if (initialTemplate?.imageLayout.shapeType === 'polygon' && initialTemplate.imageLayout.polygonPoints) {
      try {
        const parts = initialTemplate.imageLayout.polygonPoints.split(',');
        const parsed = parts.map((pt) => {
          const [xStr, yStr] = pt.trim().split(/\s+/);
          return {
            x: parseFloat(parseFloat(xStr).toFixed(1)),
            y: parseFloat(parseFloat(yStr).toFixed(1)),
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
  const [isDraggingLogo, setIsDraggingLogo] = useState<boolean>(false);
  const [isResizingLogo, setIsResizingLogo] = useState<boolean>(false);
  const logoDragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const logoResizeStartRef = useRef<{ mouseX: number; mouseY: number; startW: number; startH: number } | null>(null);

  // Multiple Text Slots Configuration
  const [textSlots, setTextSlots] = useState<TextSlotDefinition[]>(() => {
    if (initialTemplate?.textSlots && initialTemplate.textSlots.length > 0) {
      return initialTemplate.textSlots;
    }
    if (initialTemplate?.textSlot) {
      return [{ ...initialTemplate.textSlot, id: 'text-1' }];
    }
    return [
      {
        id: 'text-1',
        enabled: false,
        label: 'Company Name',
        placeholder: 'e.g. Acme Innovations',
        defaultText: '',
        x: 5,
        y: 92,
        fontSize: 16,
        fontFamily: 'Montserrat',
        fontColor: '#1e293b',
        fontWeight: 'bold',
        textAlign: 'left',
      },
    ];
  });
  const [activeTextSlotId, setActiveTextSlotId] = useState<string>('text-1');
  const [draggingTextSlotId, setDraggingTextSlotId] = useState<string | null>(null);
  const textDragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

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

      // 3. Dragging the Logo on the canvas
      if (isDraggingLogo && logoDragStartRef.current) {
        const deltaX = ((e.clientX - logoDragStartRef.current.mouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - logoDragStartRef.current.mouseY) / rect.height) * 100;
        const newX = Math.max(0, Math.min(100 - logoW, parseFloat((logoDragStartRef.current.startX + deltaX).toFixed(1))));
        const newY = Math.max(0, Math.min(100 - logoH, parseFloat((logoDragStartRef.current.startY + deltaY).toFixed(1))));
        setLogoX(newX);
        setLogoY(newY);
      }

      // 3B. Resizing the Logo on the canvas
      if (isResizingLogo && logoResizeStartRef.current) {
        const deltaX = ((e.clientX - logoResizeStartRef.current.mouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - logoResizeStartRef.current.mouseY) / rect.height) * 100;
        const newW = Math.max(4, Math.min(60, parseFloat((logoResizeStartRef.current.startW + deltaX).toFixed(1))));
        const newH = Math.max(4, Math.min(60, parseFloat((logoResizeStartRef.current.startH + deltaY).toFixed(1))));
        setLogoW(newW);
        setLogoH(newH);
      }

      // 4. Dragging a Text Slot on the canvas
      if (draggingTextSlotId && textDragStartRef.current) {
        const deltaX = ((e.clientX - textDragStartRef.current.mouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - textDragStartRef.current.mouseY) / rect.height) * 100;
        const newX = Math.max(0, Math.min(95, parseFloat((textDragStartRef.current.startX + deltaX).toFixed(1))));
        const newY = Math.max(0, Math.min(95, parseFloat((textDragStartRef.current.startY + deltaY).toFixed(1))));

        setTextSlots((prev) =>
          prev.map((s) => (s.id === draggingTextSlotId ? { ...s, x: newX, y: newY } : s))
        );
      }
    };

    const onWindowMouseUp = () => {
      setDraggingIdx(null);
      setIsDraggingShape(false);
      dragStartRef.current = null;
      setIsDraggingLogo(false);
      logoDragStartRef.current = null;
      setIsResizingLogo(false);
      logoResizeStartRef.current = null;
      setDraggingTextSlotId(null);
      textDragStartRef.current = null;
    };

    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
    };
  }, [draggingIdx, isDraggingShape, isDraggingLogo, isResizingLogo, draggingTextSlotId, logoW, logoH, isOpen]);

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
      const dataUrl = loadEvt.target?.result as string;
      setArtworkImage(dataUrl);

      // Detect natural width and height of the uploaded image
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const ratio = parseFloat((img.naturalWidth / img.naturalHeight).toFixed(4));
          setCanvasAspectRatio(ratio);
        }
      };
      img.src = dataUrl;
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

      // Absolute canvas percentages for 1:1 fidelity with full-canvas clipPath
      const absolutePolygonPoints = points
        .map((p) => `${p.x.toFixed(1)}% ${p.y.toFixed(1)}%`)
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
          polygonPoints: absolutePolygonPoints,
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
        textSlots: textSlots.filter((s) => s.enabled),
        textSlot: textSlots.find((s) => s.enabled), // backward compatibility
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
                      { x: 15, y: 15 },
                      { x: 85, y: 15 },
                      { x: 85, y: 85 },
                      { x: 15, y: 85 },
                    ])
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 font-bold text-[11px]"
                >
                  ▢ Rectangle Frame
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
                  ⚡ Slant Preset
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
              className="w-full flex items-center justify-center p-2"
              style={{ minHeight: '380px' }}
            >
              <div
                ref={canvasRef}
                onClick={handleCanvasClick}
                className={`relative rounded-2xl overflow-hidden border border-slate-700 select-none shadow-2xl bg-slate-800 transition-all ${
                  clickToAddMode ? 'cursor-crosshair' : ''
                }`}
                style={{
                  aspectRatio: `${canvasAspectRatio}`,
                  // Fit nicely within container without stretching
                  width: canvasAspectRatio > 1 ? '100%' : 'auto',
                  height: canvasAspectRatio <= 1 ? '68vh' : 'auto',
                  maxHeight: '72vh',
                  maxWidth: '100%',
                  backgroundImage: artworkImage ? `url(${artworkImage})` : undefined,
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
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
                  className="w-full h-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: `${((points.reduce((acc, p) => acc + p.x, 0) / points.length) || 50).toFixed(1)}% ${((points.reduce((acc, p) => acc + p.y, 0) / points.length) || 50).toFixed(1)}%`,
                  }}
                />
              </div>

              {/* Real-time Interactive Visualizer of Logo Slot (Draggable & Resizable!) */}
              {logoEnabled && (
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setIsDraggingLogo(true);
                    logoDragStartRef.current = {
                      mouseX: e.clientX,
                      mouseY: e.clientY,
                      startX: logoX,
                      startY: logoY,
                    };
                  }}
                  className={`absolute z-30 border-2 border-dashed border-cyan-400 bg-cyan-500/25 flex flex-col items-center justify-center p-1 text-cyan-200 shadow-xl cursor-move transition-shadow ${
                    isDraggingLogo ? 'ring-4 ring-cyan-400 scale-105' : 'hover:border-cyan-300'
                  }`}
                  style={{
                    left: `${logoX}%`,
                    top: `${logoY}%`,
                    width: `${logoW}%`,
                    aspectRatio: logoShape === 'circle' ? '1 / 1' : undefined,
                    height: logoShape === 'circle' ? undefined : `${logoH}%`,
                    borderRadius: logoShape === 'circle' ? '50%' : '6px',
                  }}
                  title="Click & drag to move logo, or pull the corner handle to resize!"
                >
                  <span className="text-[9px] font-black tracking-wider uppercase pointer-events-none">LOGO</span>
                  <span className="text-[7px] text-cyan-300 font-bold opacity-80 pointer-events-none">Drag to move</span>

                  {/* Corner Resize Handle */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsResizingLogo(true);
                      logoResizeStartRef.current = {
                        mouseX: e.clientX,
                        mouseY: e.clientY,
                        startW: logoW,
                        startH: logoH,
                      };
                    }}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-400 hover:bg-cyan-300 border-2 border-slate-900 rounded-sm cursor-nwse-resize shadow-md"
                    title="Drag to resize logo width & height"
                  />
                </div>
              )}

              {/* Real-time Interactive Visualizer of Text Slots (Draggable on Canvas!) */}
              {textSlots.map((slot) => {
                if (!slot.enabled) return null;
                const isSelected = activeTextSlotId === slot.id;

                const fontCss = getFontFamilyCss(slot.fontFamily);

                return (
                  <div
                    key={slot.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setActiveTextSlotId(slot.id);
                      setDraggingTextSlotId(slot.id);
                      textDragStartRef.current = {
                        mouseX: e.clientX,
                        mouseY: e.clientY,
                        startX: slot.x,
                        startY: slot.y,
                      };
                    }}
                    className={`absolute z-30 cursor-move p-1 rounded transition-all border ${
                      isSelected
                        ? 'border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/40'
                        : 'border-transparent hover:border-pink-400/60'
                    }`}
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      textAlign: slot.textAlign || 'left',
                    }}
                    title="Click to select / Drag to position text anywhere!"
                  >
                    <span
                      style={{
                        color: slot.fontColor || '#1e293b',
                        fontSize: `${slot.fontSize || 16}px`,
                        fontFamily: fontCss,
                        fontWeight: slot.fontWeight || 'bold',
                      }}
                      className="drop-shadow-md select-none whitespace-nowrap block leading-tight pointer-events-none"
                    >
                      {slot.defaultText || slot.label || 'Text Input'}
                    </span>
                  </div>
                );
              })}

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

            {/* Step 2B: Logo Slot Setup (Interactive Drag & Resize) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-cyan-400 block">
                    Fixed Logo Slot
                  </span>
                  <span className="text-[10px] text-slate-400">Drag directly on canvas to reposition</span>
                </div>
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
                <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  {/* Quick Nudge / Move Buttons for Logo */}
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] mb-1">
                      Nudge Logo (or drag directly on visualizer):
                    </span>
                    <div className="grid grid-cols-4 gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setLogoX((prev) => Math.max(0, prev - 2))}
                        className="py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                      >
                        ◀ Left
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoX((prev) => Math.min(90, prev + 2))}
                        className="py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                      >
                        Right ▶
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoY((prev) => Math.max(0, prev - 2))}
                        className="py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                      >
                        ▲ Up
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoY((prev) => Math.min(90, prev + 2))}
                        className="py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                      >
                        ▼ Down
                      </button>
                    </div>
                  </div>

                  {/* Logo Size & Shape */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>Logo Size:</span>
                        <span className="text-cyan-400 font-bold">{logoW}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setLogoW((w) => Math.max(4, w - 2));
                            setLogoH((h) => Math.max(4, h - 2));
                          }}
                          className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[10px]"
                        >
                          - Smaller
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLogoW((w) => Math.min(50, w + 2));
                            setLogoH((h) => Math.min(50, h + 2));
                          }}
                          className="flex-1 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded text-[10px]"
                        >
                          + Larger
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px]">Shape Mask:</span>
                      <select
                        value={logoShape}
                        onChange={(e) => setLogoShape(e.target.value as 'rect' | 'circle')}
                        className="w-full mt-1 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                      >
                        <option value="rect">Square / Rectangle</option>
                        <option value="circle">Circular Badge</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2C: Multiple Styled Text Slots (Dynamic Add / Remove / Font Picker) */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider text-pink-400 block">
                    Styled Text Inputs ({textSlots.filter((s) => s.enabled).length} Active)
                  </span>
                  <span className="text-[10px] text-slate-400">Company Name, Slogans, Phone/Web, Greetings</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `text-${Date.now()}`;
                    const newSlot: TextSlotDefinition = {
                      id: newId,
                      enabled: true,
                      label: `Text Field #${textSlots.length + 1}`,
                      placeholder: 'Enter details...',
                      defaultText: '',
                      x: 10,
                      y: Math.min(90, 80 + textSlots.length * 5),
                      fontSize: 16,
                      fontFamily: 'Montserrat',
                      fontColor: '#1e293b',
                      fontWeight: 'bold',
                      textAlign: 'left',
                    };
                    setTextSlots([...textSlots, newSlot]);
                    setActiveTextSlotId(newId);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-pink-950 hover:bg-pink-900 border border-pink-800 text-pink-300 font-bold text-xs flex items-center gap-1 shadow transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Text Slot</span>
                </button>
              </div>

              {/* Slot Switcher Tabs */}
              {textSlots.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {textSlots.map((slot, sIdx) => {
                    const isSelected = activeTextSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setActiveTextSlotId(slot.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                          isSelected
                            ? 'bg-pink-600 text-white shadow'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {slot.label || `Field #${sIdx + 1}`} {!slot.enabled && '(Off)'}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Active Text Slot Editor */}
              {(() => {
                const currentSlot = textSlots.find((s) => s.id === activeTextSlotId) || textSlots[0];
                if (!currentSlot) return null;

                const updateCurrentSlot = (patch: Partial<TextSlotDefinition>) => {
                  setTextSlots((prev) =>
                    prev.map((s) => (s.id === currentSlot.id ? { ...s, ...patch } : s))
                  );
                };

                return (
                  <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-300">
                        <input
                          type="checkbox"
                          checked={currentSlot.enabled}
                          onChange={(e) => updateCurrentSlot({ enabled: e.target.checked })}
                          className="w-4 h-4 rounded text-pink-500"
                        />
                        <span>Enable this text field</span>
                      </label>

                      {textSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setTextSlots(textSlots.filter((s) => s.id !== currentSlot.id));
                            if (textSlots.length > 1) {
                              setActiveTextSlotId(textSlots.find((s) => s.id !== currentSlot.id)!.id);
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 text-[11px] font-bold"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {currentSlot.enabled && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Customer Field Label:</span>
                            <input
                              type="text"
                              value={currentSlot.label}
                              onChange={(e) => updateCurrentSlot({ label: e.target.value })}
                              placeholder="e.g. Brand Name / Website"
                              className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                            />
                          </div>
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Placeholder / Default:</span>
                            <input
                              type="text"
                              value={currentSlot.defaultText || ''}
                              onChange={(e) => updateCurrentSlot({ defaultText: e.target.value })}
                              placeholder="e.g. www.printavenue.com"
                              className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                            />
                          </div>
                        </div>

                        {/* Font Selection Dropdown with Curated Google Webfonts */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Font Typography:</span>
                            <select
                              value={currentSlot.fontFamily || 'Montserrat'}
                              onChange={(e) => updateCurrentSlot({ fontFamily: e.target.value })}
                              className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                            >
                              <optgroup label="Modern Sans-Serif">
                                {AVAILABLE_FONTS.filter((f) => f.category === 'sans' || f.category === 'display').map((f) => (
                                  <option key={f.id} value={f.name.split(' (')[0]}>
                                    {f.name}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Luxury & Editorial Serif">
                                {AVAILABLE_FONTS.filter((f) => f.category === 'serif').map((f) => (
                                  <option key={f.id} value={f.name.split(' (')[0]}>
                                    {f.name}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Decorative & Signature Script">
                                {AVAILABLE_FONTS.filter((f) => f.category === 'handwriting').map((f) => (
                                  <option key={f.id} value={f.name.split(' (')[0]}>
                                    {f.name}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="Technical / Monospace">
                                {AVAILABLE_FONTS.filter((f) => f.category === 'mono').map((f) => (
                                  <option key={f.id} value={f.name.split(' (')[0]}>
                                    {f.name}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>

                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Font Size (px):</span>
                            <input
                              type="number"
                              min="10"
                              max="60"
                              value={currentSlot.fontSize || 16}
                              onChange={(e) => updateCurrentSlot({ fontSize: Number(e.target.value) })}
                              className="w-full p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                            />
                          </div>
                        </div>

                        {/* Font Color & Alignment */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Text Color:</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <input
                                type="color"
                                value={currentSlot.fontColor || '#1e293b'}
                                onChange={(e) => updateCurrentSlot({ fontColor: e.target.value })}
                                className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
                              />
                              <span className="font-mono text-[10px] text-slate-300 font-bold">
                                {currentSlot.fontColor || '#1e293b'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-slate-400 font-semibold block text-[10px]">Text Alignment:</span>
                            <select
                              value={currentSlot.textAlign || 'left'}
                              onChange={(e) => updateCurrentSlot({ textAlign: e.target.value as any })}
                              className="w-full mt-0.5 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                            >
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>

                        {/* Position Nudge Controls */}
                        <div className="pt-1">
                          <span className="text-slate-400 font-semibold block text-[10px] mb-1">
                            Nudge Position (or drag text directly on visualizer):
                          </span>
                          <div className="grid grid-cols-4 gap-1 text-[11px]">
                            <button
                              type="button"
                              onClick={() => updateCurrentSlot({ x: Math.max(0, currentSlot.x - 2) })}
                              className="py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                            >
                              ◀ Left
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCurrentSlot({ x: Math.min(90, currentSlot.x + 2) })}
                              className="py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                            >
                              Right ▶
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCurrentSlot({ y: Math.max(0, currentSlot.y - 2) })}
                              className="py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                            >
                              ▲ Up
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCurrentSlot({ y: Math.min(95, currentSlot.y + 2) })}
                              className="py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded"
                            >
                              ▼ Down
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
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
