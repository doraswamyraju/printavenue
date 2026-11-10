'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/lib/auth';
import { Lock, UserCheck, Shield, Key } from 'lucide-react';

interface Props {
  onSuccess: (user: AuthUser) => void;
}

export const DemoLoginModal: React.FC<Props> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@printavenue.com');
  const [password, setPassword] = useState('Admin@2027');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      name: 'Super Admin',
      email: 'admin@printavenue.com',
      password: 'Admin@2027',
      role: 'Full Control',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      name: 'Production Staff',
      email: 'staff@printavenue.com',
      password: 'Staff@2027',
      role: 'Print & Ship',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    {
      name: 'Customer Demo',
      email: 'user@printavenue.com',
      password: 'User@2027',
      role: 'Client Studio',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
  ];

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      onSuccess(data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">
            Sign In to PrintAvenue
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose a demo profile or enter database credentials
          </p>
        </div>

        {/* 1-Click Demo Profiles */}
        <div className="space-y-2 mb-6">
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Quick 1-Click Demo Accounts:
          </label>
          <div className="grid grid-cols-1 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => selectDemoAccount(acc)}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition ${
                  email === acc.email
                    ? 'bg-slate-800 border-rose-500 ring-1 ring-rose-500'
                    : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/80'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-white block">
                    {acc.name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {acc.email}
                  </span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${acc.badgeClass}`}>
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Enter Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
};

