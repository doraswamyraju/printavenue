import { readTable, writeTable } from './db';
import { initialProducts } from './data/products';

export async function initDatabase() {
  const now = new Date().toISOString();
  // 1. Seed / update users
  let users = readTable('users');
  
  const superAdmin = {
    id: 'usr_superadmin',
    email: 'rajugariventures@gmail.com',
    password: 'BOHPM6139n@',
    name: 'Super Admin',
    role: 'superadmin',
    createdAt: now,
  };

  const admin = {
    id: 'usr_admin',
    email: 'admin@printavenue.com',
    password: 'Admin@2027',
    name: 'Admin',
    role: 'admin',
    createdAt: now,
  };

  const staff = {
    id: 'usr_staff',
    email: 'staff@printavenue.com',
    password: 'Staff@2027',
    name: 'Production Lead',
    role: 'staff',
    createdAt: now,
  };

  const customer = {
    id: 'usr_customer',
    email: 'user@printavenue.com',
    password: 'User@2027',
    name: 'Valued Customer',
    role: 'customer',
    createdAt: now,
  };

  if (users.length === 0) {
    users = [superAdmin, admin, staff, customer];
    writeTable('users', users);
  } else {
    // Ensure super admin exists
    const superIdx = users.findIndex((u: any) => u.email.toLowerCase() === superAdmin.email.toLowerCase());
    if (superIdx >= 0) {
      users[superIdx] = { ...users[superIdx], ...superAdmin };
    } else {
      users.unshift(superAdmin);
    }

    // Downgrade admin@printavenue.com name and role to 'admin'
    const adminIdx = users.findIndex((u: any) => u.email.toLowerCase() === admin.email.toLowerCase());
    if (adminIdx >= 0) {
      users[adminIdx].role = 'admin';
      users[adminIdx].name = 'Admin';
    }

    writeTable('users', users);
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
