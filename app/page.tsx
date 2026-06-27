'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from './components/Navbar';
import { useAuth, UserRole } from './context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, login } = useAuth();
  const router = useRouter();

  const handleRoleQuickLogin = async (role: UserRole) => {
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
        
        if (role === 'Borrower') {
          router.push('/borrower');
        } else {
          router.push('/dashboard');
        }
      } else {
        alert('Could not authenticate. Make sure the database seed is running.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection failed. Verify if Express is active on port 5000.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors">
      <Navbar />

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-12 flex flex-col justify-center gap-12">
        
        {/* Main Side-by-Side Interactive Frame */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 lg:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Hero Info & Primary Action */}
          <div className="lg:col-span-7 space-y-6 lg:border-r lg:border-zinc-200/60 lg:dark:border-zinc-800/60 lg:pr-10">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                Simple, automated credit infrastructure.
              </h1>
              <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-400 leading-relaxed">
                ApexFinance handles the entire loan lifecycle. Apply with custom underwriting checks (BRE), configure payments at 12% simple interest, and watch states sync from Sanction to Collection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {user ? (
                <Link
                  href={user.role === 'Borrower' ? '/borrower' : '/dashboard'}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-700 transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  Enter Portal ({user.role})
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-650 dark:hover:bg-indigo-700 transition-all cursor-pointer hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                  <a
                    href="#features"
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-6 py-3 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all"
                  >
                    Developer Features
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Right Column: Evaluator Control Room */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-zinc-850 dark:text-zinc-150 tracking-tight">Evaluator Control Room</h2>
              <p className="text-2xs text-zinc-500 dark:text-zinc-450 mt-1 leading-relaxed">
                Select a seeded profile to instantly log in and verify route rules and approval workflow steps.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
              {([
                { role: 'Borrower', label: 'Borrower' },
                { role: 'Sales', label: 'Sales' },
                { role: 'Sanction', label: 'Sanction' },
                { role: 'Disbursement', label: 'Disbursement' },
                { role: 'Collection', label: 'Collection' },
                { role: 'Admin', label: 'Admin' }
              ] as { role: UserRole; label: string }[]).map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleRoleQuickLogin(item.role)}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-zinc-50 hover:bg-indigo-50/50 dark:bg-zinc-950 dark:hover:bg-indigo-950/20 border border-zinc-200 dark:border-zinc-850 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all text-center cursor-pointer group shadow-2xs hover:shadow-xs"
                >
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.label}
                  </span>
                  <span className="text-4xs text-zinc-450 mt-1 font-mono uppercase tracking-wider block">
                    Click to log in
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-start gap-2 text-2xs text-zinc-550 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-950 px-4 py-3 rounded-xl border border-zinc-200/50 dark:border-zinc-850/50">
              <span className="font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest text-[9px] shrink-0 mt-0.5">Developer Note:</span>
              <span className="leading-relaxed">You can also switch profiles at any point using the <strong>Dev Sandbox</strong> floating controls in the bottom-right corner!</span>
            </div>
          </div>

        </div>

        {/* Feature Cards Section */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-455 flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="font-bold text-zinc-850 dark:text-zinc-150 text-sm">Automated BRE Rules</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
              Instantly rejects applicants under 23, earning less than ₹25k/mo, holding invalid PAN formats, or self-employed roles.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-455 flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="font-bold text-zinc-850 dark:text-zinc-150 text-sm">Standard Simple Interest</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
              Transparent rate calculations based on 12% p.a. simple interest formula. Repayments tracked in real-time.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900/60 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-455 flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="font-bold text-zinc-850 dark:text-zinc-150 text-sm">Auto-Closure Logging</h3>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
              When recoveries meet or exceed the total repayment goal, the loan automatically marks itself settled and closes.
            </p>
          </div>
        </div>

      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900 py-6 text-center text-xs text-zinc-500 mt-20">
        <p>&copy; 2026 ApexFinance Technologies. All rights reserved.</p>
      </footer>
    </div>
  );
}
