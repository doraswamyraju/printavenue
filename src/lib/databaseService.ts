import { query, get, run } from './db';
import { initDatabase } from './initDb';
import { Product, SheetDefinition, DesignTemplate, Order } from '@/types';

let isInitialized = false;
async function ensureDb() {
  if (!isInitialized) {
    await initDatabase();
    isInitialized = true;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  await ensureDb();
  const rawProducts = await query<any>(`SELECT * FROM products ORDER BY createdAt ASC`);
  
  const products: Product[] = [];
  for (const p of rawProducts) {
    const rawSheets = await query<any>(
      `SELECT * FROM sheets WHERE productId = ? ORDER BY sheetNumber ASC`,
      [p.id]
    );

    const sheets: SheetDefinition[] = [];
    for (const s of rawSheets) {
      const rawTemplates = await query<any>(
        `SELECT * FROM templates WHERE sheetId = ?`,
        [s.id]
      );

      const templates: DesignTemplate[] = rawTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        style: t.style,
        imageLayout: JSON.parse(t.imageLayoutJson),
        calendarLayout: JSON.parse(t.calendarLayoutJson),
        background: JSON.parse(t.backgroundJson),
        textOverlay: t.textOverlayJson ? JSON.parse(t.textOverlayJson) : undefined,
      }));

      sheets.push({
        id: s.id,
        sheetNumber: s.sheetNumber,
        title: s.title,
        monthIndices: s.monthIndicesJson ? JSON.parse(s.monthIndicesJson) : [],
        aspectRatio: s.aspectRatio,
        templates,
      });
    }

    products.push({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      category: p.category,
      orientation: p.orientation,
      dimensions: p.dimensions,
      paperQuality: p.paperQuality,
      binding: p.binding,
      basePrice: p.basePrice,
      tiers: JSON.parse(p.tiersJson),
      defaultYear: p.defaultYear,
      supportedYears: JSON.parse(p.supportedYearsJson),
      thumbnail: p.thumbnail,
      sheets,
    });
  }

  return products;
}

export async function getProductBySlugOrId(slugOrId: string): Promise<Product | null> {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slugOrId || p.id === slugOrId) || null;
}

export async function deleteProductById(id: string): Promise<void> {
  await ensureDb();
  await run(`DELETE FROM products WHERE id = ?`, [id]);
}

export async function getAllOrders(): Promise<Order[]> {
  await ensureDb();
  const rawOrders = await query<any>(`SELECT * FROM orders ORDER BY createdAt DESC`);
  return rawOrders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    shippingAddress: {
      street: o.shippingStreet,
      city: o.shippingCity,
      state: o.shippingState,
      pincode: o.shippingPincode,
    },
    productId: o.productId,
    productTitle: o.productTitle,
    year: o.year,
    quantity: o.quantity,
    unitPrice: o.unitPrice,
    totalAmount: o.totalAmount,
    status: o.status,
    statusHistory: JSON.parse(o.statusHistoryJson),
    courierName: o.courierName,
    trackingNumber: o.trackingNumber,
    trackingUrl: o.trackingUrl,
    sheets: JSON.parse(o.sheetsJson),
  }));
}

export async function insertOrder(order: Order): Promise<void> {
  await ensureDb();
  await run(
    `INSERT INTO orders (
      id, createdAt, userId, customerName, customerEmail, customerPhone,
      shippingStreet, shippingCity, shippingState, shippingPincode,
      productId, productTitle, year, quantity, unitPrice, totalAmount,
      status, statusHistoryJson, courierName, trackingNumber, trackingUrl, sheetsJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.createdAt,
      order.customerEmail,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.shippingAddress.street,
      order.shippingAddress.city,
      order.shippingAddress.state,
      order.shippingAddress.pincode,
      order.productId,
      order.productTitle,
      order.year,
      order.quantity,
      order.unitPrice,
      order.totalAmount,
      order.status,
      JSON.stringify(order.statusHistory),
      order.courierName || null,
      order.trackingNumber || null,
      order.trackingUrl || null,
      JSON.stringify(order.sheets),
    ]
  );
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
  courierName?: string,
  trackingNumber?: string,
  trackingUrl?: string
): Promise<void> {
  await ensureDb();
  const existing = await get<any>(`SELECT statusHistoryJson FROM orders WHERE id = ?`, [orderId]);
  if (!existing) return;

  const history = JSON.parse(existing.statusHistoryJson || '[]');
  history.push({
    status,
    timestamp: new Date().toISOString(),
    note: `Status changed to ${status}`,
  });

  await run(
    `UPDATE orders SET
      status = ?,
      statusHistoryJson = ?,
      courierName = COALESCE(?, courierName),
      trackingNumber = COALESCE(?, trackingNumber),
      trackingUrl = COALESCE(?, trackingUrl)
     WHERE id = ?`,
    [status, JSON.stringify(history), courierName || null, trackingNumber || null, trackingUrl || null, orderId]
  );
}

