'use client';

import React from 'react';
import { DesignTemplate } from '@/types';
import { getMonthMatrix, MONTH_NAMES, DAYS_SHORT } from '@/lib/calendar';

interface Props {
  template: DesignTemplate;
  year: number;
  monthIndices?: number[];
  sheetTitle?: string;
  userImage?: string;
  customText?: string;
  interactive?: boolean;
  aspectRatio?: string; // e.g. "1.414" or "0.707"
  className?: string;
}

export const SheetRenderer: React.FC<Props> = ({
  template,
  year,
  monthIndices = [],
  userImage,
  customText,
  aspectRatio = '1.414',
  className = '',
}) => {
  const isCover = !monthIndices || monthIndices.length === 0;
  const isGraphicArtwork = template.background.type === 'image';
  const isUnderArtwork = template.imageLayout.layerPosition === 'under-artwork';

  return (
    <div
      className={`relative w-full overflow-hidden shadow-lg border border-slate-200 select-none bg-white transition-all ${className}`}
      style={{
        aspectRatio: aspectRatio,
        backgroundColor: !isGraphicArtwork ? template.background.value : undefined,
      }}
    >
      {/* 1. User Uploaded Image Slot (Placed at back if layerPosition === 'under-artwork') */}
      <div
        className={`absolute transition-all overflow-hidden flex items-center justify-center ${
          isUnderArtwork ? 'z-0' : 'z-20 border border-dashed border-slate-300'
        }`}
        style={{
          left: `${template.imageLayout.x}%`,
          top: `${template.imageLayout.y}%`,
          width: `${template.imageLayout.width}%`,
          height: `${template.imageLayout.height}%`,
          borderRadius: `${template.imageLayout.borderRadius || 0}px`,
          clipPath:
            template.imageLayout.shapeType === 'polygon' && template.imageLayout.polygonPoints
              ? `polygon(${template.imageLayout.polygonPoints})`
              : template.imageLayout.shapeType === 'circle'
              ? 'circle(50% at 50% 50%)'
              : undefined,
          maskImage:
            template.imageLayout.shapeType === 'svgMask' && template.imageLayout.maskSvgUrl
              ? `url(${template.imageLayout.maskSvgUrl})`
              : undefined,
          WebkitMaskImage:
            template.imageLayout.shapeType === 'svgMask' && template.imageLayout.maskSvgUrl
              ? `url(${template.imageLayout.maskSvgUrl})`
              : undefined,
          maskSize: 'cover',
          WebkitMaskSize: 'cover',
        }}
      >
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userImage}
            alt="Uploaded customization"
            className="w-full h-full object-cover pointer-events-none"
            style={{ objectFit: template.imageLayout.objectFit || 'cover' }}
          />
        ) : (
          /* Noticeable visual preview when no photo is uploaded yet so admin/customer clearly sees the photo boundary */
          <div className="w-full h-full flex flex-col items-center justify-center bg-rose-500/10 border-2 border-dashed border-rose-400 text-rose-500 p-2">
            <svg
              className="w-7 h-7 mx-auto mb-1 stroke-current"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] font-bold tracking-wider uppercase text-center">
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
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
            isUnderArtwork ? 'z-10' : 'z-0'
          }`}
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

      {/* 5. Custom Text Overlay (Optional) */}
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
