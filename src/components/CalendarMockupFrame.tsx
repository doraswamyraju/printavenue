'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  orientation?: 'landscape' | 'portrait';
  productCategory?: string; // 'desk' | 'wall' | 'memento' | 'banner' | 'card' etc.
}

export const CalendarMockupFrame: React.FC<Props> = ({
  children,
  orientation = 'landscape',
  productCategory,
}) => {
  const isCalendar = productCategory === 'desk' || productCategory === 'wall' || !productCategory;

  // Non-calendar products (Mementos, Banners, Cards): Clean display without wire-o spiral or calendar stand!
  if (!isCalendar) {
    return (
      <div className="relative mx-auto flex flex-col items-center select-none w-full max-w-lg">
        <div className="relative z-10 w-full rounded-2xl shadow-2xl overflow-hidden border border-slate-800 bg-slate-900/40">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex flex-col items-center select-none">
      {/* 1. Spiral Wire-O Rings at Top */}
      <div className="w-[94%] z-20 flex justify-around items-center -mb-2.5">
        {Array.from({ length: orientation === 'landscape' ? 24 : 16 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center">
            {/* Metal spiral loop */}
            <div className="w-1.5 h-6 rounded-full bg-gradient-to-r from-neutral-400 via-neutral-100 to-neutral-500 shadow-md border border-neutral-600/40 transform -rotate-6"></div>
            {/* Punch hole */}
            <div className="w-1.5 h-1.5 bg-neutral-900 rounded-full -mt-1 shadow-inner"></div>
          </div>
        ))}
      </div>

      {/* 2. Calendar Page Frame */}
      <div className="relative z-10 w-full rounded-b shadow-2xl bg-white border border-neutral-200 overflow-hidden">
        {children}
      </div>

      {/* 3. Sturdy Wooden/Cardboard Table Stand Base (for Desk Calendar) */}
      {orientation === 'landscape' && (
        <div className="w-[102%] -mt-1 h-7 bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 rounded-b-md shadow-xl border-t border-amber-400/50 flex items-center justify-center">
          <div className="h-0.5 w-1/3 bg-amber-600/20 rounded"></div>
        </div>
      )}
    </div>
  );
};

