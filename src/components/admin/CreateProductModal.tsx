'use client';

import React, { useState } from 'react';
import { Product, SheetDefinition } from '@/types';
import { X, Sparkles, Plus, Trash2, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
}

export const CreateProductModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onProductCreated,
}) => {
  const [category, setCategory] = useState<'memento' | 'banner' | 'card' | 'desk' | 'wall' | 'other'>('memento');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dimensions, setDimensions] = useState('6" x 8"');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('portrait');
  const [paperQuality, setPaperQuality] = useState('Premium Acrylic / Wooden Stand');
  const [binding, setBinding] = useState('Custom Stand Mount');
  const [basePrice, setBasePrice] = useState(499);
  const [thumbnail, setThumbnail] = useState(
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80'
  );
  const [sheetCount, setSheetCount] = useState(1);
  const [sheetAspect, setSheetAspect] = useState('0.75'); // 3:4 portrait
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCategoryPreset = (cat: typeof category) => {
    setCategory(cat);
    if (cat === 'memento') {
      setTitle('Custom Wooden & Acrylic Memento');
      setDescription('Custom laser-cut wooden & crystal acrylic award memento with photo engraving and personalized plaque message.');
      setDimensions('7" x 9" (Stand: 1.5" Base)');
      setOrientation('portrait');
      setPaperQuality('Laser Cut Acrylic + Walnut Wood Finish');
      setBinding('Hardwood Table Stand Included');
      setBasePrice(799);
      setThumbnail('https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=600&q=80');
      setSheetCount(1);
      setSheetAspect('0.77');
    } else if (cat === 'banner') {
      setTitle('Flex / Roll-Up Promotional Banner');
      setDescription('Heavy-duty vibrant roll-up pull banner stand for conferences, product launches, events, and trade shows.');
      setDimensions('3ft x 6ft (36" x 72")');
      setOrientation('portrait');
      setPaperQuality('450 GSM Tear-Proof Star Flex Media');
      setBinding('Aluminium Standee with Carry Bag');
      setBasePrice(1299);
      setThumbnail('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80');
      setSheetCount(1);
      setSheetAspect('0.5'); // 1:2 tall
    } else if (cat === 'card') {
      setTitle('Luxury Visiting Cards (Standard & Velvet Finish)');
      setDescription('Executive business cards printed on ultra-thick cardstock with optional gold/silver foil stamping and velvet touch.');
      setDimensions('3.5" x 2.0" (Standard Business Card)');
      setOrientation('landscape');
      setPaperQuality('400 GSM Velvet Matte Card Stock');
      setBinding('Standard Cut / Rounded Corner Pack of 100');
      setBasePrice(299);
      setThumbnail('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80');
      setSheetCount(2); // Front and Back!
      setSheetAspect('1.75'); // 3.5 / 2
    } else if (cat === 'desk') {
      setTitle('Custom Table Calendar');
      setDescription('Spiral-bound personalized desktop photo calendar.');
      setDimensions('A5 Landscape (8.3" x 5.8")');
      setOrientation('landscape');
      setPaperQuality('300 GSM Premium Card Stock');
      setBinding('Wire-O Spiral with Hardboard Stand');
      setBasePrice(349);
      setThumbnail('https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=600&q=80');
      setSheetCount(13);
      setSheetAspect('1.414');
    } else if (cat === 'wall') {
      setTitle('Custom Wall Calendar');
      setDescription('Large vibrant wall hanging photo calendar.');
      setDimensions('A4 Portrait (8.3" x 11.7")');
      setOrientation('portrait');
      setPaperQuality('300 GSM Silk Matte Card Stock');
      setBinding('Top Wire-O Spiral with Wall Hook');
      setBasePrice(249);
      setThumbnail('https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80');
      setSheetCount(7);
      setSheetAspect('0.707');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `product-${Date.now()}`;

      const generatedSheets: SheetDefinition[] = [];
      for (let i = 0; i < sheetCount; i++) {
        let sheetTitle = `Print Surface ${i + 1}`;
        if (category === 'card') {
          sheetTitle = i === 0 ? 'Front Side' : 'Back Side';
        } else if (category === 'memento') {
          sheetTitle = 'Engraving Plaque / Display Front';
        } else if (category === 'banner') {
          sheetTitle = 'Banner Display Face';
        } else if (sheetCount === 13) {
          const months = ['Cover', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          sheetTitle = months[i] || `Sheet ${i + 1}`;
        }

        generatedSheets.push({
          id: `sheet-${Date.now()}-${i}`,
          sheetNumber: i,
          title: sheetTitle,
          monthIndices: category === 'desk' || category === 'wall' ? (i > 0 ? [i - 1] : []) : undefined,
          aspectRatio: sheetAspect,
          templates: [
            {
              id: `tpl-${Date.now()}-${i}-default`,
              name: `${sheetTitle} Default Layout`,
              style: 'modern',
              imageLayout: {
                x: 10,
                y: 10,
                width: 80,
                height: 55,
                borderRadius: 8,
                objectFit: 'cover',
                shapeType: 'rect',
              },
              calendarLayout: {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                theme: 'light',
              },
              background: {
                type: 'color',
                value: '#ffffff',
              },
              textSlots: [
                {
                  id: `text-${Date.now()}-1`,
                  enabled: true,
                  label: 'Headline / Title',
                  defaultText: 'Your Custom Text Here',
                  x: 10,
                  y: 72,
                  width: 80,
                  fontSize: 24,
                  fontFamily: 'Montserrat',
                  fontColor: '#0f172a',
                  fontWeight: 'bold',
                  textAlign: 'center',
                },
                {
                  id: `text-${Date.now()}-2`,
                  enabled: true,
                  label: 'Subtitle / Details',
                  defaultText: 'Personalized message or slogan goes here',
                  x: 10,
                  y: 84,
                  width: 80,
                  fontSize: 16,
                  fontFamily: 'Inter',
                  fontColor: '#475569',
                  fontWeight: 'normal',
                  textAlign: 'center',
                },
              ],
            },
          ],
        });
      }

      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        slug,
        title,
        description,
        category,
        status: 'draft', // Created directly into Super Admin Draft!
        orientation,
        dimensions,
        paperQuality,
        binding,
        basePrice: Number(basePrice),
        tiers: [
          { minQty: 1, maxQty: 5, pricePerUnit: Number(basePrice) },
          { minQty: 6, maxQty: 25, pricePerUnit: Math.round(Number(basePrice) * 0.95) },
          { minQty: 26, pricePerUnit: Math.round(Number(basePrice) * 0.88) },
        ],
        defaultYear: 2027,
        supportedYears: [2026, 2027, 2028],
        thumbnail,
        sheets: generatedSheets,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: newProduct }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save product');
      }

      onProductCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Create New Product / Module</h2>
              <p className="text-xs text-amber-400 font-medium">
                ★ Saves directly to Private Staging (Draft) — invisible to store admins & users
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Quick Category Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Module Type Preset:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'memento', label: '🏆 Memento' },
                { id: 'banner', label: '🚩 Banner' },
                { id: 'card', label: '💳 Visiting Card' },
                { id: 'desk', label: '🗓️ Desk Cal' },
                { id: 'wall', label: '🖼️ Wall Cal' },
              ].map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => handleCategoryPreset(c.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition text-center ${
                    category === c.id
                      ? 'bg-rose-600 border-rose-500 text-white shadow'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Product Title & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Product Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Laser Engraved Wooden Memento"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Base Price (₹)
              </label>
              <input
                type="number"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* 3. Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* 4. Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Dimensions / Size
              </label>
              <input
                type="text"
                required
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 7 x 9 inches or 3.5 x 2.0 inches"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Material / Paper / Substrate
              </label>
              <input
                type="text"
                required
                value={paperQuality}
                onChange={(e) => setPaperQuality(e.target.value)}
                placeholder="e.g. 400 GSM Velvet Card Stock or Laser Acrylic"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Orientation
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Print Surfaces / Sheets Count
              </label>
              <input
                type="number"
                min={1}
                max={24}
                required
                value={sheetCount}
                onChange={(e) => setSheetCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                {sheetCount === 1 ? '1 Face (Front)' : sheetCount === 2 ? '2 Faces (Front & Back)' : `${sheetCount} Sheets/Faces`}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Aspect Ratio (W/H)
              </label>
              <input
                type="text"
                required
                value={sheetAspect}
                onChange={(e) => setSheetAspect(e.target.value)}
                placeholder="e.g. 1.414 or 0.707 or 1.75"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Width divided by height
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Thumbnail / Showcase Image URL
            </label>
            <input
              type="url"
              required
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
            >
              <Sparkles className="w-4 h-4" />
              {saving ? 'Creating Module...' : 'Create in Staging Draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
