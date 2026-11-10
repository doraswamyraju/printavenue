import { readTable, writeTable } from './db';
import { initialProducts } from './data/products';

export async function initDatabase() {
  // 1. Seed demo users if empty
  const users = readTable('users');
  if (users.length === 0) {
    const now = new Date().toISOString();
    writeTable('users', [
      {
        id: 'usr_admin',
        email: 'admin@printavenue.com',
        password: 'Admin@2027',
        name: 'Super Admin',
        role: 'admin',
        createdAt: now,
      },
      {
        id: 'usr_staff',
        email: 'staff@printavenue.com',
        password: 'Staff@2027',
        name: 'Production Lead',
        role: 'staff',
        createdAt: now,
      },
      {
        id: 'usr_customer',
        email: 'user@printavenue.com',
        password: 'User@2027',
        name: 'Valued Customer',
        role: 'customer',
        createdAt: now,
      },
    ]);
  }

  // 2. Seed initial products if empty
  const products = readTable('products');
  if (products.length === 0) {
    writeTable('products', initialProducts);
  }

  // 3. Ensure orders table exists
  const orders = readTable('orders');
  if (!orders) {
    writeTable('orders', []);
  }
}
