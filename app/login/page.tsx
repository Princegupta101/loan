'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, apiUrl } = useAuth();
  const router = useRouter();

  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Borrower',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      if (!formData.name || !formData.email || !formData.password) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    } else {
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isSignUp ? '/auth/register' : '/auth/login';
      const body = isSignUp 
        ? { name: formData.name, email: formData.email, password: formData.password, role: formData.role }
        : { email: formData.email, password: formData.password };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Login context update
      login(data.token, {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
      });

      // Redirect based on role
      if (data.user.role === 'Borrower') {
        router.push('/borrower');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl p-8 transition-colors duration-300">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {isSignUp ? 'Create your Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              {isSignUp ? 'Sign up to apply for quick, low-interest loans' : 'Sign in to access your portal'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl text-sm bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-450 border border-rose-200/50 dark:border-rose-800/30">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-250 dark:border-zinc-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-zinc-150 transition-all"
                  required={isSignUp}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. name@company.com"
                className="w-full px-4 py-3 rounded-xl border border-zinc-250 dark:border-zinc-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-zinc-150 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-zinc-250 dark:border-zinc-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-zinc-150 transition-all"
                required
              />
            </div>

            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-250 dark:border-zinc-700 bg-transparent text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-zinc-150 transition-all"
                    required={isSignUp}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                    I want to sign up as a
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-zinc-150 transition-all"
                  >
                    <option value="Borrower">Borrower (Apply for loans)</option>
                    <option value="Sales">Sales Officer</option>
                    <option value="Sanction">Sanction Manager</option>
                    <option value="Disbursement">Disbursement Executive</option>
                    <option value="Collection">Collection Executive</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-99 transition-all cursor-pointer flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsSignUp(false)}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => setIsSignUp(true)}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
