'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/auth';
import { Product, Order } from '@/types';
import { DashboardSidebar, DashboardView } from '@/components/dashboard/DashboardSidebar';
import { CatalogView } from '@/components/dashboard/CatalogView';
import { StudioView } from '@/components/dashboard/StudioView';
import { OrdersView } from '@/components/dashboard/OrdersView';
import { ProductsManagementView } from '@/components/dashboard/ProductsManagementView';
import { DemoLoginModal } from '@/components/auth/DemoLoginModal';

export const MainAppLayout: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentView, setCurrentView] = useState<DashboardView>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Load database data
  const fetchData = async () => {
    try {
      const [prodRes, ordRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
      ]);
      const prodData = await prodRes.json();
      const ordData = await ordRes.json();

      if (prodData.products) setProducts(prodData.products);
      if (ordData.orders) setOrders(ordData.orders);
    } catch (e) {
      console.error('Failed to load database records', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check session or default to Admin demo account
    const stored = localStorage.getItem('printavenue_session');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    } else {
      // Auto-set Admin as default demo session
      const defaultAdmin: AuthUser = {
        id: 'usr_admin',
        email: 'admin@printavenue.com',
        name: 'Admin',
        role: 'admin',
      };
      setCurrentUser(defaultAdmin);
      localStorage.setItem('printavenue_session', JSON.stringify(defaultAdmin));
    }
    fetchData();
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('printavenue_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    localStorage.removeItem('printavenue_session');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <DemoLoginModal onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Sidebar Navigation */}
      <DashboardSidebar
        user={currentUser}
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          if (v !== 'studio') setSelectedProduct(null);
        }}
        onLogout={handleLogout}
      />

      {/* 2. Main SPA Viewport */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        {loading ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
            Connecting to PrintAvenue database...
          </div>
        ) : currentView === 'studio' && selectedProduct ? (
          <StudioView
            product={selectedProduct}
            user={currentUser}
            onBack={() => {
              setSelectedProduct(null);
              setCurrentView('catalog');
            }}
            onOrderPlaced={() => {
              fetchData();
              setCurrentView('orders');
            }}
          />
        ) : currentView === 'orders' ? (
          <OrdersView
            orders={orders}
            user={currentUser}
            onRefresh={fetchData}
          />
        ) : currentView === 'products_mgmt' && (currentUser.role === 'admin' || currentUser.role === 'superadmin') ? (
          <ProductsManagementView
            products={products}
            user={currentUser}
            onRefresh={fetchData}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setCurrentView('studio');
            }}
          />
        ) : (
          <CatalogView
            products={products}
            user={currentUser}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setCurrentView('studio');
            }}
            onRefresh={fetchData}
          />
        )}
      </main>
    </div>
  );
};

