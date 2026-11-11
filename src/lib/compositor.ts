import { DesignTemplate } from '@/types';
import { getMonthMatrix, MONTH_NAMES, DAYS_SHORT } from '@/lib/calendar';

/**
 * Client-side High-Resolution Flat Composite Generator
 * Composes:
 * 1. Base Artwork Image
 * 2. Customer Photo (clipped to exact polygon / coordinates & placed under/above artwork)
 * 3. Calendar Grid (if applicable)
 * 4. Fixed Brand Logo (if enabled)
 * 5. Fixed Brand / Company Name (with exact font, size, and color)
 * 6. Monthly Caption
 * Returns a high-res base64 PNG data URL suitable for immediate direct printing.
 */
export async function composePrintReadySheet({
  template,
  year,
  monthIndices = [],
  userImageBase64,
  globalLogoBase64,
  globalBrandName,
  caption,
  targetWidth = 2480, // A5 300 DPI Landscape width (2480 x 1748)
  aspectRatio = 1.414,
}: {
  template: DesignTemplate;
  year: number;
  monthIndices?: number[];
  userImageBase64?: string;
  globalLogoBase64?: string;
  globalBrandName?: string;
  caption?: string;
  targetWidth?: number;
  aspectRatio?: number;
}): Promise<string> {
  const width = targetWidth;
  const height = Math.round(targetWidth / aspectRatio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize 2D canvas context');

  // Fill canvas white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const isUnderArtwork = template.imageLayout.layerPosition === 'under-artwork';

  // Helper to load image
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
      img.src = src;
    });
  };

  // 1. Draw Photo Subroutine
  const drawPhotoSlot = async () => {
    if (!userImageBase64) return;
    try {
      const photoImg = await loadImage(userImageBase64);
      const slotX = (template.imageLayout.x / 100) * width;
      const slotY = (template.imageLayout.y / 100) * height;
      const slotW = (template.imageLayout.width / 100) * width;
      const slotH = (template.imageLayout.height / 100) * height;

      ctx.save();

      // Apply Polygon Clipping if polygonPoints exist
      if (template.imageLayout.shapeType === 'polygon' && template.imageLayout.polygonPoints) {
        const rawPoints = template.imageLayout.polygonPoints.split(',');
        const parsedPoints = rawPoints.map((pt) => {
          const pieces = pt.trim().split(' ');
          const xPct = parseFloat(pieces[0]) || 0;
          const yPct = parseFloat(pieces[1]) || 0;
          return {
            x: slotX + (xPct / 100) * slotW,
            y: slotY + (yPct / 100) * slotH,
          };
        });

        if (parsedPoints.length >= 3) {
          ctx.beginPath();
          ctx.moveTo(parsedPoints[0].x, parsedPoints[0].y);
          for (let i = 1; i < parsedPoints.length; i++) {
            ctx.lineTo(parsedPoints[i].x, parsedPoints[i].y);
          }
          ctx.closePath();
          ctx.clip();
        }
      } else {
        // Simple Rectangular clip
        ctx.beginPath();
        ctx.rect(slotX, slotY, slotW, slotH);
        ctx.clip();
      }

      // Draw photo with cover scaling inside slot
      const imgAspect = photoImg.width / photoImg.height;
      const slotAspect = slotW / slotH;
      let drawW = slotW;
      let drawH = slotH;
      let drawX = slotX;
      let drawY = slotY;

      if (imgAspect > slotAspect) {
        drawW = slotH * imgAspect;
        drawX = slotX - (drawW - slotW) / 2;
      } else {
        drawH = slotW / imgAspect;
        drawY = slotY - (drawH - slotH) / 2;
      }

      ctx.drawImage(photoImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (err) {
      console.warn('Could not draw photo on canvas:', err);
    }
  };

  // Subroutine to Draw Base Artwork
  const drawBaseArtwork = async () => {
    if (template.background.type === 'image' && template.background.value) {
      try {
        const bgImg = await loadImage(template.background.value);
        ctx.drawImage(bgImg, 0, 0, width, height);
      } catch (err) {
        console.warn('Could not draw background artwork:', err);
      }
    } else if (template.background.value) {
      ctx.fillStyle = template.background.value;
      ctx.fillRect(0, 0, width, height);
    }
  };

  // Execution order based on layerPosition:
  if (isUnderArtwork) {
    await drawPhotoSlot(); // Photo goes behind base artwork
    await drawBaseArtwork(); // Base artwork with transparent window goes over photo
  } else {
    await drawBaseArtwork(); // Base artwork first
    await drawPhotoSlot(); // Photo sits on top
  }

  // 3. Draw Calendar Dates (if template has calendar layout width > 0)
  if (monthIndices && monthIndices.length > 0 && template.calendarLayout.width > 0) {
    const calX = (template.calendarLayout.x / 100) * width;
    const calY = (template.calendarLayout.y / 100) * height;
    const calW = (template.calendarLayout.width / 100) * width;
    const calH = (template.calendarLayout.height / 100) * height;

    const mIdx = monthIndices[0];
    const monthMatrix = getMonthMatrix(year, mIdx);

    ctx.save();
    // Month header
    ctx.font = `bold ${Math.round(calW * 0.07)}px Inter, sans-serif`;
    ctx.fillStyle = '#1e293b';
    ctx.fillText(`${MONTH_NAMES[mIdx]} ${year}`.toUpperCase(), calX, calY + calH * 0.12);

    // Day initials
    const colW = calW / 7;
    const rowH = (calH * 0.75) / 6;
    ctx.font = `600 ${Math.round(colW * 0.35)}px Inter, sans-serif`;

    DAYS_SHORT.forEach((day, col) => {
      ctx.fillStyle = col === 0 ? '#dc2626' : '#64748b';
      ctx.fillText(day, calX + col * colW + colW * 0.2, calY + calH * 0.25);
    });

    // Dates
    ctx.font = `500 ${Math.round(colW * 0.38)}px Inter, sans-serif`;
    monthMatrix.forEach((row, rIdx) => {
      row.forEach((day, cIdx) => {
        if (day) {
          ctx.fillStyle = cIdx === 0 ? '#dc2626' : '#0f172a';
          ctx.fillText(
            String(day),
            calX + cIdx * colW + colW * 0.2,
            calY + calH * 0.38 + rIdx * rowH
          );
        }
      });
    });
    ctx.restore();
  }

  // 4. Draw Fixed Brand Logo
  if (template.logoSlot?.enabled && globalLogoBase64) {
    try {
      const logoImg = await loadImage(globalLogoBase64);
      const lX = (template.logoSlot.x / 100) * width;
      const lY = (template.logoSlot.y / 100) * height;
      const lW = (template.logoSlot.width / 100) * width;
      const lH = (template.logoSlot.height / 100) * height;

      ctx.save();
      if (template.logoSlot.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(lX + lW / 2, lY + lH / 2, Math.min(lW, lH) / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      // Draw aspect-ratio contained logo
      const lAspect = logoImg.width / logoImg.height;
      const slotAspect = lW / lH;
      let drawW = lW;
      let drawH = lH;
      let drawX = lX;
      let drawY = lY;

      if (lAspect > slotAspect) {
        drawH = lW / lAspect;
        drawY = lY + (lH - drawH) / 2;
      } else {
        drawW = lH * lAspect;
        drawX = lX + (lW - drawW) / 2;
      }

      ctx.drawImage(logoImg, drawX, drawY, drawW, drawH);
      ctx.restore();
    } catch (err) {
      console.warn('Could not draw logo on canvas:', err);
    }
  }

  // 5. Draw Fixed Brand / Company Name
  if (template.textSlot?.enabled) {
    const text = globalBrandName || template.textSlot.defaultText || '';
    if (text) {
      const tX = (template.textSlot.x / 100) * width;
      const tY = (template.textSlot.y / 100) * height;
      const baseSize = template.textSlot.fontSize || 16;
      const scaledFontSize = Math.round((baseSize / 500) * width);

      ctx.save();
      const weight = template.textSlot.fontWeight || 'bold';
      const family =
        template.textSlot.fontFamily === 'serif'
          ? 'Georgia, serif'
          : template.textSlot.fontFamily === 'mono'
          ? 'Courier New, monospace'
          : template.textSlot.fontFamily === 'handwriting'
          ? 'cursive'
          : 'Inter, sans-serif';

      ctx.font = `${weight} ${scaledFontSize}px ${family}`;
      ctx.fillStyle = template.textSlot.fontColor || '#1e293b';
      ctx.textAlign = template.textSlot.textAlign || 'left';
      ctx.fillText(text, tX, tY);
      ctx.restore();
    }
  }

  // 6. Draw Monthly Caption (if any)
  if (caption) {
    ctx.save();
    ctx.font = `italic 600 ${Math.round(width * 0.016)}px Inter, sans-serif`;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(caption, width / 2, height * 0.94);
    ctx.restore();
  }

  return canvas.toDataURL('image/png', 0.95);
}

