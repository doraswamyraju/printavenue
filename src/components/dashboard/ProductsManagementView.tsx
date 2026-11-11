'use client';

import React, { useState } from 'react';
import { Product, SheetDefinition, DesignTemplate } from '@/types';
import { AuthUser } from '@/lib/auth';
import {
  Layers,
  Sliders,
  ExternalLink,
  Trash2,
  Edit3,
  Copy,
  Plus,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { TemplateBuilderModal } from '@/components/admin/TemplateBuilderModal';
import { CreateProductModal } from '@/components/admin/CreateProductModal';
import { SheetRenderer } from '@/components/SheetRenderer';

interface Props {
  products: Product[];
  allProducts?: Product[];
  user: AuthUser;
  onRefresh: () => void;
  onSelectProduct: (p: Product) => void;
}

export const ProductsManagementView: React.FC<Props> = ({
  products,
  user,
  onRefresh,
  onSelectProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'templates'>('templates');
  const [selectedProductForTemplates, setSelectedProductForTemplates] = useState<Product | null>(null);
  const [templateToEdit, setTemplateToEdit] = useState<{
    product: Product;
    sheetIndex: number;
    template: DesignTemplate;
  } | null>(null);

  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [isCreateProductOpen, setIsCreateProductOpen] = useState(false);

  const isSuperAdmin = user.role === 'superadmin';

  const handleTogglePublish = async (productId: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleStatus',
          id: productId,
          status: newStatus,
        }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      alert('Failed to update product status');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
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

  const handleDeleteTemplate = async (productId: string, sheetId: string, templateId: string) => {
    if (!confirm('Are you sure you want to delete this template layout?')) return;
    try {
      const res = await fetch(
        `/api/templates?productId=${productId}&sheetId=${sheetId}&templateId=${templateId}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        onRefresh();
      }
    } catch {
      alert('Failed to delete template');
    }
  };

  // Collect all saved templates across all sheets and products
  const allSavedTemplates: {
    product: Product;
    sheet: SheetDefinition;
    sheetIndex: number;
    template: DesignTemplate;
  }[] = [];

  products.forEach((prod) => {
    prod.sheets.forEach((sheet, sIdx) => {
      sheet.templates.forEach((tpl) => {
        allSavedTemplates.push({
          product: prod,
          sheet,
          sheetIndex: sIdx,
          template: tpl,
        });
      });
    });
  });

  const filteredTemplates = allSavedTemplates.filter((item) => {
    if (filterMonth === 'ALL') return true;
    return item.sheet.title.toLowerCase().includes(filterMonth.toLowerCase());
  });

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">
            Template & Product Architecture Studio
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            View, edit, duplicate, or trace all saved design templates with live markings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'templates'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Saved Templates ({allSavedTemplates.length})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'products'
                  ? 'bg-rose-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calendar & Custom Products ({products.length})
            </button>
          </div>

          {isSuperAdmin && (
            <button
              onClick={() => setIsCreateProductOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20"
            >
              <Plus className="w-4 h-4" /> Create Product / Module
            </button>
          )}

          <button
            onClick={() => setSelectedProductForTemplates(products[0])}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20"
          >
            <Plus className="w-4 h-4" /> New Artwork Template
          </button>
        </div>
      </div>

      {/* TAB 1: ALL SAVED TEMPLATES GALLERY (Edit, Duplicate, Delete) */}
      {activeTab === 'templates' ? (
        <div className="space-y-6">
          {/* Month / Sheet Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {['ALL', 'Cover', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(
              (m) => (
                <button
                  key={m}
                  onClick={() => setFilterMonth(m)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                    filterMonth === m
                      ? 'bg-white text-slate-900 shadow'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              )
            )}
          </div>

          {/* Grid of Templates with their Markings & Previews */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((item, idx) => {
              const { product: prod, sheet, sheetIndex, template: tpl } = item;
              const isCustomGraphic = tpl.background.type === 'image';

              return (
                <div
                  key={`${prod.id}-${sheet.id}-${tpl.id}-${idx}`}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-xl space-y-4 hover:border-slate-700 transition"
                >
                  {/* Template Card Header */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-extrabold text-white text-sm truncate">
                        {tpl.name}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-rose-400 border border-slate-700">
                        {sheet.title}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate">
                      Product: <strong className="text-slate-300">{prod.title}</strong>
                    </p>
                  </div>

                  {/* Visualizer Miniature with Markings */}
                  <div className="rounded-xl overflow-hidden border border-slate-800 shadow-md pointer-events-none">
                    <SheetRenderer
                      template={tpl}
                      year={2027}
                      monthIndices={sheet.monthIndices}
                      sheetTitle={sheet.title}
                      aspectRatio={sheet.aspectRatio}
                      className="w-full scale-100"
                    />
                  </div>

                  {/* Metadata Specs */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] space-y-1 text-slate-400">
                    <div className="flex justify-between">
                      <span>Cutout Shape:</span>
                      <span className="text-white font-mono font-bold uppercase">
                        {tpl.imageLayout.shapeType || 'rectangle'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Layer Depth:</span>
                      <span className="text-amber-400 font-bold">
                        {tpl.imageLayout.layerPosition === 'under-artwork' ? 'Behind Base Artwork' : 'Above Base Artwork'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Artwork Graphic:</span>
                      <span className={isCustomGraphic ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {isCustomGraphic ? 'Custom Graphic Uploaded' : 'Color Scheme'}
                      </span>
                    </div>
                  </div>

                  {/* Actions: Edit Markings, Duplicate, Delete */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTemplateToEdit({
                          product: prod,
                          sheetIndex,
                          template: tpl,
                        });
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Markings
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteTemplate(prod.id, sheet.id, tpl.id)
                      }
                      title="Delete Template"
                      className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-500 hover:text-rose-400 border border-slate-800 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* TAB 2: PRODUCTS LIST */
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
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {p.category.toUpperCase()}
                      </span>
                      {p.status === 'draft' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          STAGING DRAFT
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          LIVE STORE
                        </span>
                      )}
                    </div>
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
                    New Template for {p.title}
                  </button>

                  <div className="flex items-center gap-2">
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(p.id, p.status)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition border ${
                          p.status === 'draft'
                            ? 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
                            : 'bg-amber-950/80 hover:bg-amber-900 border-amber-700 text-amber-300'
                        }`}
                        title={p.status === 'draft' ? 'Publish to store' : 'Unpublish to draft'}
                      >
                        {p.status === 'draft' ? 'Publish to Store' : 'Revert to Draft'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectProduct(p)}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      Test Studio <ExternalLink className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
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
      )}

      {/* Create Product Modal (Super Admin Only) */}
      {isCreateProductOpen && (
        <CreateProductModal
          isOpen={isCreateProductOpen}
          onClose={() => setIsCreateProductOpen(false)}
          onProductCreated={onRefresh}
        />
      )}

      {/* Visual Template Builder Modal (For New Template) */}
      {selectedProductForTemplates && (
        <TemplateBuilderModal
          product={selectedProductForTemplates}
          allProducts={products}
          isOpen={!!selectedProductForTemplates}
          onClose={() => setSelectedProductForTemplates(null)}
          onSaved={onRefresh}
        />
      )}

      {/* Visual Template Builder Modal (For Editing an Existing Template) */}
      {templateToEdit && (
        <TemplateBuilderModal
          product={templateToEdit.product}
          allProducts={products}
          initialTemplate={templateToEdit.template}
          initialSheetIndex={templateToEdit.sheetIndex}
          isOpen={!!templateToEdit}
          onClose={() => setTemplateToEdit(null)}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
};
