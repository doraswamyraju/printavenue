import { readTable, writeTable } from './db';
import { initDatabase } from './initDb';
import { Product, Order, DesignTemplate } from '@/types';

let isInitialized = false;
async function ensureDb() {
  if (!isInitialized) {
    await initDatabase();
    isInitialized = true;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  await ensureDb();
  return readTable<Product>('products');
}

export async function getProductBySlugOrId(slugOrId: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
}

export async function deleteProductById(id: string): Promise<void> {
  await ensureDb();
  const products = await getAllProducts();
  const filtered = products.filter((p) => p.id !== id);
  writeTable('products', filtered);
}

export async function addTemplateToSheet(
  productId: string,
  sheetId: string,
  template: DesignTemplate
): Promise<void> {
  await ensureDb();
  const products = await getAllProducts();
  const prodIndex = products.findIndex((p) => p.id === productId);
  if (prodIndex < 0) return;

  const sheet = products[prodIndex].sheets.find((s) => s.id === sheetId);
  if (sheet) {
    const existingIdx = sheet.templates.findIndex((t) => t.id === template.id);
    if (existingIdx >= 0) {
      sheet.templates[existingIdx] = template; // update in place
    } else {
      sheet.templates.push(template);
    }
    writeTable('products', products);
  }
}

export async function deleteTemplateFromSheet(
  productId: string,
  sheetId: string,
  templateId: string
): Promise<void> {
  await ensureDb();
  const products = await getAllProducts();
  const prodIndex = products.findIndex((p) => p.id === productId);
  if (prodIndex < 0) return;

  const sheet = products[prodIndex].sheets.find((s) => s.id === sheetId);
  if (sheet) {
    sheet.templates = sheet.templates.filter((t) => t.id !== templateId);
    writeTable('products', products);
  }
}

export async function getAllOrders(): Promise<Order[]> {
  await ensureDb();
  return readTable<Order>('orders');
}

export async function insertOrder(order: Order): Promise<void> {
  await ensureDb();
  const orders = await getAllOrders();
  orders.unshift(order);
  writeTable('orders', orders);
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  courierName?: string,
  trackingNumber?: string,
  trackingUrl?: string
): Promise<void> {
  await ensureDb();
  const orders = await getAllOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return;

  order.status = status as any;
  order.statusHistory.push({
    status: status as any,
    timestamp: new Date().toISOString(),
    note: `Status changed to ${status}`,
  });

  if (courierName) order.courierName = courierName;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingUrl) order.trackingUrl = trackingUrl;

  writeTable('orders', orders);
}
