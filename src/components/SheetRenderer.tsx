'use client';

import React from 'react';
import { DesignTemplate } from '@/types';
import { getMonthMatrix, MONTH_NAMES, DAYS_SHORT } from '@/lib/calendar';
import { getFontFamilyCss } from '@/lib/fonts';

interface Props {
  template: DesignTemplate;
  year: number;
  monthIndices?: number[];
  sheetTitle?: string;
  userImage?: string;
  customText?: string;
  globalLogo?: string;
  globalBrandName?: string;
  globalTextInputs?: Record<string, string>;
  interactive?: boolean;
  aspectRatio?: string; // e.g. "1.414" or "0.707"
  productCategory?: string; // 'desk' | 'wall' | 'memento' | 'banner' | 'card' etc.
  className?: string;
  id?: string;
}

export const SheetRenderer: React.FC<Props> = ({
  template,
  year,
  monthIndices = [],
  userImage,
  customText,
  globalLogo,
  globalBrandName,
  globalTextInputs = {},
  aspectRatio = '1.414',
  productCategory,
  className = '',
  id,
}) => {
  const isCalendar = productCategory === 'desk' || productCategory === 'wall' || (!productCategory && monthIndices.length > 0);
  const isCover = isCalendar && (!monthIndices || monthIndices.length === 0);
  const isGraphicArtwork = template.background.type === 'image';
  const isUnderArtwork = template.imageLayout.layerPosition === 'under-artwork';

  // Effective aspect ratio: prioritized from template background, then sheet aspectRatio prop
  const effectiveAspectRatio = template.background?.aspectRatio || aspectRatio;

  return (
    <div
      className={`relative w-full overflow-hidden shadow-lg border border-slate-200 select-none bg-white transition-all ${className}`}
      style={{
        aspectRatio: `${effectiveAspectRatio}`,
        backgroundColor: !isGraphicArtwork ? template.background.value : undefined,
      }}
    >
      {/* 1. User Uploaded Image Slot (Placed at back if layerPosition === 'under-artwork') */}
      <div
        className={`absolute inset-0 transition-all overflow-hidden ${
          isUnderArtwork ? 'z-0' : 'z-20'
        }`}
        style={{
          clipPath:
            template.imageLayout.shapeType === 'polygon' && template.imageLayout.polygonPoints
              ? `polygon(${template.imageLayout.polygonPoints})`
              : undefined,
        }}
      >
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userImage}
            alt="Uploaded customization"
            className="w-full h-full pointer-events-none"
            style={{
              objectFit: 'cover',
              objectPosition: `${((template.imageLayout.x + template.imageLayout.width / 2) || 50).toFixed(1)}% ${((template.imageLayout.y + template.imageLayout.height / 2) || 50).toFixed(1)}%`,
            }}
          />
        ) : (
          /* Noticeable visual preview when no photo is uploaded yet: positioned directly over the polygon bounding box */
          <div
            className="absolute flex flex-col items-center justify-center bg-rose-500/20 border-2 border-dashed border-rose-400 text-rose-500 p-2 shadow-inner transition-all"
            style={{
              left: `${template.imageLayout.x}%`,
              top: `${template.imageLayout.y}%`,
              width: `${template.imageLayout.width}%`,
              height: `${template.imageLayout.height}%`,
            }}
          >
            <svg
              className="w-6 h-6 mx-auto mb-1 stroke-current opacity-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-black tracking-wider uppercase text-center block leading-tight">
              PHOTO PLACEHOLDER
            </span>
          </div>
        )}
      </div>

      {/* 2. Base Artwork Layer (Foreground Frame with transparent cutouts) */}
      {isGraphicArtwork && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={template.background.value}
          alt="Base Artwork"
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            isUnderArtwork ? 'z-10' : 'z-0'
          }`}
          style={{ objectFit: 'fill' }}
        />
      )}

      {/* 3. Calendar Grid (if not cover and not already inside artwork) */}
      {!isCover && template.calendarLayout.width > 0 && (
        <div
          className="absolute z-20 flex flex-col justify-start p-1 sm:p-2 pointer-events-none"
          style={{
            left: `${template.calendarLayout.x}%`,
            top: `${template.calendarLayout.y}%`,
            width: `${template.calendarLayout.width}%`,
            height: `${template.calendarLayout.height}%`,
          }}
        >
          {monthIndices.map((mIdx) => {
            const matrix = getMonthMatrix(year, mIdx);
            return (
              <div key={mIdx} className="w-full mb-1">
                <div className="flex items-baseline justify-between border-b pb-1 mb-1 border-slate-300">
                  <span className="font-bold text-xs sm:text-sm text-slate-800 tracking-wider uppercase">
                    {MONTH_NAMES[mIdx]}
                  </span>
                  <span className="font-extrabold text-[11px] sm:text-xs text-rose-600">
                    {year}
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center mb-0.5">
                  {DAYS_SHORT.map((d, i) => (
                    <span
                      key={d}
                      className={`text-[8px] sm:text-[10px] font-semibold ${
                        i === 0 ? 'text-red-500 font-bold' : 'text-slate-600'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {matrix.flat().map((day, idx) => {
                    const isSunday = idx % 7 === 0;
                    return (
                      <span
                        key={idx}
                        className={`text-[8px] sm:text-[10px] py-0.5 rounded leading-none ${
                          !day
                            ? 'invisible'
                            : isSunday
                            ? 'text-red-600 font-bold'
                            : 'text-slate-800 font-medium'
                        }`}
                      >
                        {day || ''}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Cover Page Branding */}
      {isCover && (
        <div className="absolute inset-x-0 bottom-6 text-center px-4 z-20">
          <p className="text-sm font-semibold tracking-widest text-slate-700 uppercase">
            {customText || 'CALENDAR COLLECTION'}
          </p>
          <p className="text-2xl font-black text-rose-600 tracking-tight mt-0.5">
            {year}
          </p>
        </div>
      )}

      {/* 5. Fixed Global Logo (Brand / Company Logo) */}
      {template.logoSlot?.enabled && (
        <div
          className="absolute z-20 overflow-hidden flex items-center justify-center pointer-events-none transition-all"
          style={{
            left: `${template.logoSlot.x}%`,
            top: `${template.logoSlot.y}%`,
            width: `${template.logoSlot.width}%`,
            // If circular, use aspectRatio 1:1 so non-square boxes stay a perfect geometric circle!
            aspectRatio: template.logoSlot.shape === 'circle' ? '1 / 1' : undefined,
            height: template.logoSlot.shape === 'circle' ? undefined : `${template.logoSlot.height}%`,
            borderRadius: template.logoSlot.shape === 'circle' ? '50%' : `${template.logoSlot.borderRadius || 4}px`,
          }}
        >
          {globalLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={globalLogo}
              alt="Brand Logo"
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="w-full h-full border border-dashed border-blue-400 bg-blue-500/10 rounded-full flex items-center justify-center p-1 text-blue-500 text-[9px] font-bold">
              <span>LOGO</span>
            </div>
          )}
        </div>
      )}

      {/* 6. Multiple Fixed or Styled Brand / Customer Text Slots */}
      {(() => {
        const slots = template.textSlots || (template.textSlot ? [template.textSlot] : []);
        return slots.filter((s) => s.enabled).map((slot) => {
          const textValue =
            globalTextInputs[slot.id] ||
            (slot.id === 'default-name' || !template.textSlots ? globalBrandName : '') ||
            slot.defaultText ||
            slot.placeholder ||
            slot.label;

          const fontFamilyCss = getFontFamilyCss(slot.fontFamily);

          return (
            <div
              key={slot.id}
              className="absolute z-20 pointer-events-none transition-all"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                width: slot.width ? `${slot.width}%` : 'auto',
                textAlign: slot.textAlign || 'left',
              }}
            >
              <span
                style={{
                  color: slot.fontColor || '#1e293b',
                  fontSize: `${slot.fontSize || 13}px`,
                  fontFamily: fontFamilyCss,
                  fontWeight: slot.fontWeight || 'bold',
                }}
                className="tracking-tight leading-tight block drop-shadow-sm select-none"
              >
                {textValue}
              </span>
            </div>
          );
        });
      })()}

      {/* 7. Sheet-Specific Caption / Subtitle */}
      {!isCover && customText && (
        <div
          className="absolute z-20 text-center px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium backdrop-blur-sm shadow pointer-events-none"
          style={{
            left: `${template.textOverlay?.position.x || 10}%`,
            top: `${template.textOverlay?.position.y || 88}%`,
          }}
        >
          {customText}
        </div>
      )}
    </div>
  );
};
