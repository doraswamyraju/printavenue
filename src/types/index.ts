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
    type: 'color' | 'gradient' | 'pattern';
    value: string;
  };
  textOverlay?: {
    enabled: boolean;
    defaultText?: string;
    position: { x: number; y: number };
  };
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
  category: 'desk' | 'wall';
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
  userImageBase64?: string; // or url
  originalImageFileName?: string;
  customText?: string;
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
  sheets: CustomizedSheetItem[];
}

