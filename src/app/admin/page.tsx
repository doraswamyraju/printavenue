import { getOrders, getProducts } from '@/lib/storage';
import { AdminDashboard } from '@/components/AdminDashboard';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const orders = getOrders();
  const products = getProducts();

  return (
    <AdminDashboard initialOrders={orders} initialProducts={products} />
  );
}

