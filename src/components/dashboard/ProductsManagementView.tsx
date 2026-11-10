'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
import { AuthUser } from '@/lib/auth';
import { Layers, Plus, Trash2, ArrowRight, Sliders, ExternalLink } from 'lucide-react';
import { TemplateBuilderModal } from '@/components/admin/TemplateBuilderModal';

interface Props {
  products: Product[];
  allProducts?: Product[];
  user: AuthUser;
  onRefresh: () => void;
  onSelectProduct: (p: Product) => void;
}

export const ProductsManagementView: React.FC<Props> = ({
  products,
  onRefresh,
  onSelectProduct,
}) => {
  const [selectedProductForTemplates, setSelectedProductForTemplates] = useState<Product | null>(null);

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product from the database?')) return;
    try {
      const res = await fetch(`/api/products?id=${productId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">
            Product & Multi-Template Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage live calendar formats, sheets, and configure arbitrary image cutout shapes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => {
          const totalTemplates = p.sheets.reduce((acc, s) => acc + s.templates.length, 0);
          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-lg"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {p.category.toUpperCase()}
                  </span>
                  <span className="text-xs font-black text-rose-400">₹{p.basePrice}</span>
                </div>
                <h3 className="font-extrabold text-base text-white">{p.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>

                <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                  <div className="text-slate-400 flex justify-between">
                    <span>Sheets Count:</span>
                    <span className="text-white font-bold">{p.sheets.length} Sheets</span>
                  </div>
                  <div className="text-slate-400 flex justify-between">
                    <span>Active Templates:</span>
                    <span className="text-rose-400 font-bold">{totalTemplates} Designs</span>
                  </div>
                  <div className="text-slate-400 flex justify-between">
                    <span>Paper Quality:</span>
                    <span className="text-slate-300">{p.paperQuality}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForTemplates(p)}
                  className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Design Template Shapes ({totalTemplates})
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectProduct(p)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1"
                  >
                    Test Studio <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(p.id)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-800 transition"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Template Builder Modal */}
      {selectedProductForTemplates && (
        <TemplateBuilderModal
          product={selectedProductForTemplates}
          allProducts={products}
          isOpen={!!selectedProductForTemplates}
          onClose={() => setSelectedProductForTemplates(null)}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
};

