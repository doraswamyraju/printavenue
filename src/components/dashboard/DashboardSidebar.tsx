'use client';

import React from 'react';
import {
  LayoutDashboard,
  Printer,
  Calendar,
  Layers,
  ShoppingBag,
  Truck,
  Users,
  LogOut,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { AuthUser } from '@/lib/auth';

export type DashboardView =
  | 'catalog'
  | 'studio'
  | 'orders'
  | 'products_mgmt'
  | 'templates_mgmt'
  | 'track';

interface Props {
  user: AuthUser;
  currentView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  onLogout: () => void;
}

export const DashboardSidebar: React.FC<Props> = ({
  user,
  currentView,
  onSelectView,
  onLogout,
}) => {
  const isAdmin = user.role === 'admin';
  const isStaff = user.role === 'staff' || isAdmin;
  const isCustomer = user.role === 'customer';

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col justify-between border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight leading-none">
              PrintAvenue
            </h1>
            <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">
              Live Hub &middot; 5091
            </span>
          </div>
        </div>

        {/* User Profile Badge */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner ${
              user.role === 'admin'
                ? 'bg-rose-600'
                : user.role === 'staff'
                ? 'bg-amber-600'
                : 'bg-emerald-600'
            }`}
          >
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-400">
              {user.role}
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="px-3 space-y-1 text-xs">
          {/* Customer Links */}
          <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Print Studio
          </div>

          <button
            onClick={() => onSelectView('catalog')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition ${
              currentView === 'catalog'
                ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Product Catalog</span>
          </button>

          <button
            onClick={() => onSelectView('orders')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition ${
              currentView === 'orders'
                ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isStaff ? 'Production Queue' : 'My Orders & Tracking'}
            </span>
          </button>

          {/* Admin & Staff Section */}
          {isStaff && (
            <>
              <div className="pt-4 pb-1 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Production Control
              </div>

              {isAdmin && (
                <button
                  onClick={() => onSelectView('products_mgmt')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold transition ${
                    currentView === 'products_mgmt'
                      ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Products & Sheets</span>
                </button>
              )}
            </>
          )}
        </nav>
      </div>

      {/* Footer Info & Logout */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <div className="px-2 py-1 text-[10px] text-slate-500 leading-tight">
          Protected Client Preview Mode active (anti-save enabled).
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 text-xs font-semibold transition border border-slate-800"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Switch / Log Out</span>
        </button>
      </div>
    </aside>
  );
};

