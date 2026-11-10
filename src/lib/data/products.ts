import { Product, DesignTemplate } from '@/types';

const defaultDeskTemplates: DesignTemplate[] = [
  {
    id: 'tpl-split-left-photo',
    name: 'Classic Split (Photo Left)',
    style: 'classic',
    imageLayout: { x: 4, y: 12, width: 48, height: 78, borderRadius: 8, objectFit: 'cover' },
    calendarLayout: { x: 54, y: 14, width: 42, height: 74, theme: 'dark' },
    background: { type: 'color', value: '#FFFFFF' },
    textOverlay: { enabled: true, defaultText: '', position: { x: 4, y: 92 } },
  },
  {
    id: 'tpl-split-right-photo',
    name: 'Modern Split (Photo Right)',
    style: 'modern',
    imageLayout: { x: 50, y: 12, width: 46, height: 78, borderRadius: 12, objectFit: 'cover' },
    calendarLayout: { x: 5, y: 14, width: 42, height: 74, theme: 'accent' },
    background: { type: 'color', value: '#F8FAFC' },
    textOverlay: { enabled: true, defaultText: '', position: { x: 5, y: 90 } },
  },
  {
    id: 'tpl-polaroid-desk',
    name: 'Memory Polaroid Style',
    style: 'polaroid',
    imageLayout: { x: 6, y: 8, width: 44, height: 68, borderRadius: 4, objectFit: 'cover' },
    calendarLayout: { x: 53, y: 18, width: 43, height: 70, theme: 'minimal' },
    background: { type: 'color', value: '#FFFDF9' },
    textOverlay: { enabled: true, defaultText: 'Moments to Cherish', position: { x: 6, y: 80 } },
  },
  {
    id: 'tpl-full-banner-bottom-cal',
    name: 'Panoramic Landscape',
    style: 'bold',
    imageLayout: { x: 4, y: 8, width: 92, height: 50, borderRadius: 10, objectFit: 'cover' },
    calendarLayout: { x: 6, y: 62, width: 88, height: 32, theme: 'light' },
    background: { type: 'color', value: '#FFFFFF' },
    textOverlay: { enabled: false, position: { x: 0, y: 0 } },
  },
];

const defaultCoverTemplates: DesignTemplate[] = [
  {
    id: 'tpl-cover-hero-full',
    name: 'Full Hero Portrait',
    style: 'bold',
    imageLayout: { x: 4, y: 6, width: 92, height: 74, borderRadius: 12, objectFit: 'cover' },
    calendarLayout: { x: 0, y: 0, width: 0, height: 0, theme: 'dark' }, // no calendar on cover
    background: { type: 'color', value: '#0F172A' },
    textOverlay: { enabled: true, defaultText: 'OUR YEAR OF MEMORIES', position: { x: 50, y: 88 } },
  },
  {
    id: 'tpl-cover-framed-minimal',
    name: 'Elegant Gold Frame',
    style: 'minimal',
    imageLayout: { x: 12, y: 10, width: 76, height: 68, borderRadius: 6, objectFit: 'cover' },
    calendarLayout: { x: 0, y: 0, width: 0, height: 0, theme: 'light' },
    background: { type: 'color', value: '#FAFAF9' },
    textOverlay: { enabled: true, defaultText: 'CALENDAR COLLECTION', position: { x: 50, y: 86 } },
  },
];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const initialProducts: Product[] = [
  {
    id: 'prod-desk-calendar-landscape',
    slug: 'customized-photo-desk-calendar-landscape',
    title: 'Customized Photo Desk Calendar (Rectangle Landscape)',
    description: 'A premium 13-sheet desk table calendar with spiral wire-o binding and sturdy easel triangle stand. Personalize every month with high-resolution photos and memorable text.',
    category: 'desk',
    orientation: 'landscape',
    dimensions: 'A5 Landscape (8.3" x 5.8")',
    paperQuality: 'Premium 300 GSM Laminated Art Card',
    binding: 'Black Twin-Ring Spiral Binding with Rigid Easel Stand',
    basePrice: 199,
    tiers: [
      { minQty: 1, maxQty: 5, pricePerUnit: 199 },
      { minQty: 6, maxQty: 10, pricePerUnit: 195 },
      { minQty: 11, maxQty: 20, pricePerUnit: 193 },
      { minQty: 21, pricePerUnit: 189 },
    ],
    defaultYear: 2027,
    supportedYears: [2026, 2027, 2028],
    thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=600&q=80',
    sheets: [
      {
        id: 'sheet-cover',
        sheetNumber: 0,
        title: 'Cover Page',
        aspectRatio: '1.414',
        templates: defaultCoverTemplates,
      },
      ...monthNames.map((month, idx) => ({
        id: `sheet-${month.toLowerCase()}`,
        sheetNumber: idx + 1,
        title: `${month}`,
        monthIndices: [idx],
        aspectRatio: '1.414',
        templates: defaultDeskTemplates,
      })),
    ],
  },
  {
    id: 'prod-wall-calendar-6-sheets',
    slug: 'personalized-wall-calendar-6-sheets',
    title: 'Personalized Wall Calendar (6 Sheets / Bi-Monthly)',
    description: 'High-impact portrait wall calendar featuring two months per sheet plus cover. Perfect for homes and corporate gifting with vibrant color reproduction.',
    category: 'wall',
    orientation: 'portrait',
    dimensions: 'A4 Portrait (8.3" x 11.7")',
    paperQuality: '300 GSM Silk Matte Card Stock',
    binding: 'Top Wire-O Spiral with Wall Hanging Hook',
    basePrice: 249,
    tiers: [
      { minQty: 1, maxQty: 5, pricePerUnit: 249 },
      { minQty: 6, maxQty: 10, pricePerUnit: 239 },
      { minQty: 11, maxQty: 25, pricePerUnit: 229 },
      { minQty: 26, pricePerUnit: 215 },
    ],
    defaultYear: 2027,
    supportedYears: [2026, 2027, 2028],
    thumbnail: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    sheets: [
      {
        id: 'wall6-cover',
        sheetNumber: 0,
        title: 'Cover Page',
        aspectRatio: '0.707',
        templates: defaultCoverTemplates,
      },
      ...[
        'Jan - Feb', 'Mar - Apr', 'May - Jun',
        'Jul - Aug', 'Sep - Oct', 'Nov - Dec'
      ].map((pair, idx) => ({
        id: `wall6-sheet-${idx + 1}`,
        sheetNumber: idx + 1,
        title: pair,
        monthIndices: [idx * 2, idx * 2 + 1],
        aspectRatio: '0.707',
        templates: [
          {
            id: `tpl-wall-top-photo-${idx}`,
            name: 'Top Photo & Dual Months',
            style: 'modern' as const,
            imageLayout: { x: 5, y: 5, width: 90, height: 50, borderRadius: 8, objectFit: 'cover' as const },
            calendarLayout: { x: 5, y: 58, width: 90, height: 38, theme: 'dark' as const },
            background: { type: 'color' as const, value: '#FFFFFF' },
          },
          {
            id: `tpl-wall-side-photo-${idx}`,
            name: 'Side Photo & Vertical Dual Grid',
            style: 'minimal' as const,
            imageLayout: { x: 5, y: 6, width: 45, height: 88, borderRadius: 6, objectFit: 'cover' as const },
            calendarLayout: { x: 52, y: 8, width: 44, height: 84, theme: 'accent' as const },
            background: { type: 'color' as const, value: '#F8FAFC' },
          }
        ],
      })),
    ],
  },
  {
    id: 'prod-wall-calendar-12-sheets',
    slug: 'customized-wall-calendar-12-sheets',
    title: 'Customized Wall Calendar (12 Sheets / Monthly)',
    description: '12 large individual monthly sheets with cover. Generous photo showcase area with prominent calendar grid for scheduling and memories.',
    category: 'wall',
    orientation: 'portrait',
    dimensions: 'A3 Portrait (11.7" x 16.5")',
    paperQuality: '350 GSM Heavyweight Matte Finish',
    binding: 'Heavy Duty Spiral Wire-O with Wall Hanger',
    basePrice: 349,
    tiers: [
      { minQty: 1, maxQty: 5, pricePerUnit: 349 },
      { minQty: 6, maxQty: 10, pricePerUnit: 329 },
      { minQty: 11, maxQty: 25, pricePerUnit: 310 },
      { minQty: 26, pricePerUnit: 289 },
    ],
    defaultYear: 2027,
    supportedYears: [2026, 2027, 2028],
    thumbnail: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80',
    sheets: [
      {
        id: 'wall12-cover',
        sheetNumber: 0,
        title: 'Cover Page',
        aspectRatio: '0.707',
        templates: defaultCoverTemplates,
      },
      ...monthNames.map((month, idx) => ({
        id: `wall12-sheet-${idx + 1}`,
        sheetNumber: idx + 1,
        title: `${month}`,
        monthIndices: [idx],
        aspectRatio: '0.707',
        templates: [
          {
            id: `tpl-wall12-hero-${idx}`,
            name: 'Hero Top Showcase',
            style: 'bold' as const,
            imageLayout: { x: 5, y: 5, width: 90, height: 56, borderRadius: 10, objectFit: 'cover' as const },
            calendarLayout: { x: 6, y: 64, width: 88, height: 32, theme: 'dark' as const },
            background: { type: 'color' as const, value: '#FFFFFF' },
          },
          {
            id: `tpl-wall12-bottom-${idx}`,
            name: 'Clean Grid Top & Photo Bottom',
            style: 'classic' as const,
            imageLayout: { x: 5, y: 44, width: 90, height: 52, borderRadius: 8, objectFit: 'cover' as const },
            calendarLayout: { x: 6, y: 6, width: 88, height: 35, theme: 'accent' as const },
            background: { type: 'color' as const, value: '#FFFDF9' },
          }
        ],
      })),
    ],
  },
];

