import { run, query } from './db';
import { initialProducts } from './data/products';

export async function initDatabase() {
  // 1. Users table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'admin' | 'staff' | 'customer'
      createdAt TEXT NOT NULL
    )
  `);

  // 2. Products table
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      orientation TEXT NOT NULL,
      dimensions TEXT NOT NULL,
      paperQuality TEXT NOT NULL,
      binding TEXT NOT NULL,
      basePrice REAL NOT NULL,
      tiersJson TEXT NOT NULL,
      defaultYear INTEGER NOT NULL,
      supportedYearsJson TEXT NOT NULL,
      thumbnail TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // 3. Sheets table
  await run(`
    CREATE TABLE IF NOT EXISTS sheets (
      id TEXT PRIMARY KEY,
      productId TEXT NOT NULL,
      sheetNumber INTEGER NOT NULL,
      title TEXT NOT NULL,
      monthIndicesJson TEXT,
      aspectRatio TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // 4. Design Templates table
  await run(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      sheetId TEXT NOT NULL,
      name TEXT NOT NULL,
      style TEXT NOT NULL,
      imageLayoutJson TEXT NOT NULL,
      calendarLayoutJson TEXT NOT NULL,
      backgroundJson TEXT NOT NULL,
      textOverlayJson TEXT,
      FOREIGN KEY (sheetId) REFERENCES sheets(id) ON DELETE CASCADE
    )
  `);

  // 5. Orders table
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      createdAt TEXT NOT NULL,
      userId TEXT,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      customerPhone TEXT NOT NULL,
      shippingStreet TEXT NOT NULL,
      shippingCity TEXT NOT NULL,
      shippingState TEXT NOT NULL,
      shippingPincode TEXT NOT NULL,
      productId TEXT NOT NULL,
      productTitle TEXT NOT NULL,
      year INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      totalAmount REAL NOT NULL,
      status TEXT NOT NULL,
      statusHistoryJson TEXT NOT NULL,
      courierName TEXT,
      trackingNumber TEXT,
      trackingUrl TEXT,
      sheetsJson TEXT NOT NULL
    )
  `);

  // Seed default 3 accounts if not exist
  const existingUsers = await query(`SELECT id FROM users LIMIT 1`);
  if (existingUsers.length === 0) {
    const now = new Date().toISOString();
    await run(
      `INSERT INTO users (id, email, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      ['usr_admin', 'admin@printavenue.com', 'Admin@2027', 'Super Admin', 'admin', now]
    );
    await run(
      `INSERT INTO users (id, email, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      ['usr_staff', 'staff@printavenue.com', 'Staff@2027', 'Production Lead', 'staff', now]
    );
    await run(
      `INSERT INTO users (id, email, password, name, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      ['usr_customer', 'user@printavenue.com', 'User@2027', 'Valued Customer', 'customer', now]
    );
  }

  // Seed initial products into DB if empty
  const existingProducts = await query(`SELECT id FROM products LIMIT 1`);
  if (existingProducts.length === 0) {
    const now = new Date().toISOString();
    for (const p of initialProducts) {
      await run(
        `INSERT INTO products (
          id, slug, title, description, category, orientation, dimensions,
          paperQuality, binding, basePrice, tiersJson, defaultYear,
          supportedYearsJson, thumbnail, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.slug,
          p.title,
          p.description,
          p.category,
          p.orientation,
          p.dimensions,
          p.paperQuality,
          p.binding,
          p.basePrice,
          JSON.stringify(p.tiers),
          p.defaultYear,
          JSON.stringify(p.supportedYears),
          p.thumbnail,
          now,
        ]
      );

      for (const s of p.sheets) {
        await run(
          `INSERT INTO sheets (id, productId, sheetNumber, title, monthIndicesJson, aspectRatio)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            s.id,
            p.id,
            s.sheetNumber,
            s.title,
            JSON.stringify(s.monthIndices || []),
            s.aspectRatio,
          ]
        );

        for (const t of s.templates) {
          await run(
            `INSERT INTO templates (
              id, sheetId, name, style, imageLayoutJson,
              calendarLayoutJson, backgroundJson, textOverlayJson
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              t.id,
              s.id,
              t.name,
              t.style,
              JSON.stringify(t.imageLayout),
              JSON.stringify(t.calendarLayout),
              JSON.stringify(t.background),
              JSON.stringify(t.textOverlay || null),
            ]
          );
        }
      }
    }
  }
}

