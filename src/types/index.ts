export interface DesignTemplate {
  id: string;
  name: string;
  style: 'modern' | 'minimal' | 'bold' | 'classic' | 'polaroid';
  imageLayout: {
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
    width: number; // percentage (0-100)
    height: number; // percentage (0-100)
    borderRadius?: number; // px
    objectFit?: 'cover' | 'contain';
    shapeType?: 'rect' | 'circle' | 'polygon' | 'svgMask';
    polygonPoints?: string; // e.g. "50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%"
    maskSvgUrl?: string; // e.g. SVG path or PNG alpha mask
    layerPosition?: 'under-artwork' | 'over-artwork'; // whether photo is beneath transparent frame or on top
  };
  calendarLayout: {
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
    width: number; // percentage (0-100)
    height: number; // percentage (0-100)
    theme: 'dark' | 'light' | 'accent' | 'minimal';
    headerPosition?: 'top' | 'left';
  };
  background: {
    type: 'color' | 'gradient' | 'pattern' | 'image';
    value: string; // Hex color, gradient string, or Image URL / Base64 of artwork
  };
  overlayImage?: string; // Optional foreground frame image (with transparent hole)
  textOverlay?: {
    enabled: boolean;
    defaultText?: string;
    position: { x: number; y: number };
  };
  // Secondary Image Slot (e.g. Logo / Badge / QR)
  logoSlot?: {
    enabled: boolean;
    label?: string; // e.g. "Company Logo", "Brand Icon"
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
    width: number; // percentage (0-100)
    height: number; // percentage (0-100)
    shape?: 'rect' | 'circle';
    borderRadius?: number;
  };
  // Multiple Styled Text Slots (e.g. Company Name, Tagline, Phone/Website, Greeting)
  textSlots?: TextSlotDefinition[];
  // Legacy single slot support
  textSlot?: TextSlotDefinition;
}

export interface TextSlotDefinition {
  id: string; // e.g. "text-1", "text-tagline"
  enabled: boolean;
  label: string; // e.g. "Company Name", "Tagline / Slogan", "Phone / Website"
  placeholder?: string;
  defaultText?: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  width?: number; // percentage width
  fontSize?: number; // font size in px
  fontFamily?: string; // e.g. "Montserrat", "Playfair Display", "Great Vibes", "Poppins", "Cinzel", "Pacifico", "Oswald", "Lora", "Roboto Mono", "Inter"
  fontColor?: string; // hex color e.g. #1e293b
  fontWeight?: 'normal' | 'bold' | 'extrabold';
  textAlign?: 'left' | 'center' | 'right';
  maxChars?: number;
}

export interface SheetDefinition {
  id: string;
  sheetNumber: number;
  title: string; // e.g. "Cover Page", "January 2027", "Jan - Feb 2027"
  monthIndices?: number[]; // e.g. [0] for Jan, [0, 1] for Jan-Feb, empty for Cover
  aspectRatio: string; // e.g. "1.414" for A5 landscape, "0.707" for A4 portrait
  templates: DesignTemplate[];
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: 'desk' | 'wall' | 'memento' | 'banner' | 'card' | 'other' | string;
  status?: 'draft' | 'published'; // 'draft' is only visible to superadmin
  orientation: 'landscape' | 'portrait';
  dimensions: string; // e.g. "A5 (8.3 x 5.8 inches)"
  paperQuality: string; // e.g. "300 GSM Premium Card Stock"
  binding: string; // e.g. "Black Wire-O Spiral with Hardboard Stand"
  basePrice: number;
  tiers: { minQty: number; maxQty?: number; pricePerUnit: number }[];
  defaultYear: number;
  supportedYears: number[];
  sheets: SheetDefinition[];
  thumbnail: string;
}

export interface CustomizedSheetItem {
  sheetId: string;
  sheetTitle: string;
  selectedTemplateId: string;
  userImageBase64?: string; // primary photo
  originalImageFileName?: string;
  userLogoBase64?: string; // secondary image / logo
  customText?: string;
  composedPrintUrl?: string; // 100% full merged print-ready sheet (base artwork + photo + logo + text)
  previewThumbnailUrl?: string; // high-quality generated preview
}

export type OrderStatus = 
  | 'Pending Payment'
  | 'Order Placed'
  | 'Artwork Approved'
  | 'In Printing'
  | 'Binding & Packaging'
  | 'Dispatched'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string; // e.g. "PA-2027-1042"
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  productId: string;
  productTitle: string;
  year: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  // Fixed Global Branding (applied across all sheets)
  globalVariables?: {
    logoBase64?: string;
    brandName?: string;
    contactInfo?: string;
    textInputs?: Record<string, string>; // keyed by TextSlotDefinition id e.g. { "text-1": "Acme Corp", "text-tagline": "Quality Matters" }
  };
  sheets: CustomizedSheetItem[];
}

