'use client';

import React from 'react';
import { Product } from '@/types';
import { Calendar, ArrowRight, Layers, Trash2 } from 'lucide-react';
import { AuthUser } from '@/lib/auth';

interface Props {
  products: Product[];
  user: AuthUser;
  onSelectProduct: (product: Product) => void;
  onRefresh?: () => void;
}

export const CatalogView: React.FC<Props> = ({
  products,
  user,
  onSelectProduct,
  onRefresh,
}) => {
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';

  const handleDelete = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this product from the database?')) return;
    try {
      const res = await fetch(`/api/products?id=${productId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh?.();
      }
    } catch {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          Calendar Formats & Options
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select any format to begin customized sheet-by-sheet designing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectProduct(p)}
            className="group cursor-pointer rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/80 transition-all duration-300 flex flex-col overflow-hidden shadow-lg hover:shadow-rose-600/10"
          >
            <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.thumbnail}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur text-xs font-bold text-white border border-slate-800">
                {p.sheets.length} Sheets
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-black shadow">
                From ₹{p.basePrice}
              </div>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white group-hover:text-rose-400 transition leading-snug">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dimensions:</span>
                    <span className="text-slate-200 font-medium">{p.dimensions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stock:</span>
                    <span className="text-slate-200 font-medium">{p.paperQuality}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button
                  type="button"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 group-hover:bg-rose-600 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  Start Customizing <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, p.id)}
                    title="Delete product from database"
                    className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

