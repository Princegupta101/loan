'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, UserRole } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, login } = useAuth();
  const [showSandbox, setShowSandbox] = useState(false);

  const quickSwitch = async (role: UserRole) => {
    const emailMap: Record<UserRole, string> = {
      Admin: 'admin@lms.com',
      Sales: 'sales@lms.com',
      Sanction: 'sanction@lms.com',
      Disbursement: 'disbursement@lms.com',
      Collection: 'collection@lms.com',
      Borrower: 'borrower@lms.com'
    };

    try {
      const email = emailMap[role];
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Password123' })
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token, {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role
        });
        window.location.reload();
      } else {
        alert(`Could not log in as ${role}. Please ensure the database seed is running.`);
      }
    } catch (err) {
      console.error(err);
      alert('Error switching roles. Is backend running?');
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/70 dark:border-zinc-800/80 dark:bg-zinc-950/70 backdrop-blur-md transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                  ApexFinance
                </span>
              </Link>

              {user && (
                <div className="hidden md:flex items-center gap-1">
                  <Link
                    href={user.role === 'Borrower' ? '/borrower' : '/dashboard'}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-155 transition-all"
                  >
                    Dashboard
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="text-right hidden sm:block">
                    <span className="block text-sm font-semibold text-zinc-850 dark:text-zinc-200">{user.name}</span>
                    <span className="block text-3xs font-mono uppercase tracking-wider text-indigo-500 dark:text-indigo-400">
                      {user.role} Control
                    </span>
                  </div>

                  <span className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />

                  <button
                    onClick={logout}
                    className="rounded-xl px-4 py-2 text-xs font-semibold border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?signup=true"
                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:shadow-md transition-all"
                  >
                    Apply Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowSandbox(!showSandbox)}
          className="flex h-11 items-center gap-2 rounded-full bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-xs font-bold text-white dark:text-zinc-900 shadow-xl hover:scale-102 transition-all cursor-pointer border border-zinc-850/10 dark:border-zinc-200/10"
        >
          <svg className="w-4 h-4 animate-spin-slow fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span>Dev Sandbox</span>
        </button>

        {showSandbox && (
          <div className="absolute bottom-14 right-0 w-52 rounded-2xl bg-zinc-900 border border-zinc-800 p-3 shadow-2xl text-white py-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="px-3 pb-2 text-4xs uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800/80 mb-2">
              Underwriting Sandbox
            </div>
            <div className="space-y-1">
              {([
                { role: 'Borrower', label: 'Borrower (Applicant)' },
                { role: 'Sales', label: 'Sales Officer' },
                { role: 'Sanction', label: 'Sanction Desk' },
                { role: 'Disbursement', label: 'Disbursement Executive' },
                { role: 'Collection', label: 'Collection Executive' },
                { role: 'Admin', label: 'System Admin' }
              ] as { role: UserRole; label: string }[]).map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    quickSwitch(r.role);
                    setShowSandbox(false);
                  }}
                  className={`w-full text-left rounded-lg px-3 py-1.8 text-xs transition-colors hover:bg-zinc-800 cursor-pointer flex items-center justify-between ${
                    user?.role === r.role ? 'text-indigo-400 font-bold bg-zinc-800/40' : 'text-zinc-300'
                  }`}
                >
                  <span>{r.label}</span>
                  {user?.role === r.role && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-800/80 text-4xs text-zinc-500 text-center font-mono">
              Password: Password123
            </div>
          </div>
        )}
      </div>
    </>
  );
}
