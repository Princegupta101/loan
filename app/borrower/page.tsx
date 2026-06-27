'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

interface Loan {
  _id: string;
  personalDetails: {
    age: number;
    monthlySalary: number;
    panNumber: string;
    employmentStatus: string;
  };
  loanConfiguration: {
    amount: number;
    tenureDays: number;
    interestRate: number;
    interestAmount: number;
    totalRepayment: number;
  };
  documentUrl?: string;
  status: 'Draft' | 'BRE_Rejected' | 'Applied' | 'Sanctioned' | 'Rejected' | 'Disbursed' | 'Closed';
  rejectionReason?: string;
  repaymentProgress: {
    amountPaid: number;
    remainingAmount: number;
  };
  paymentHistory: {
    paymentDate: string;
    amountPaid: number;
    referenceId: string;
    _id?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function BorrowerPage() {
  const { user, token, loading: authLoading, apiUrl } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && user.role !== 'Borrower') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const [loans, setLoans] = useState<Loan[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  const [age, setAge] = useState<number>(26);
  const [monthlySalary, setMonthlySalary] = useState<number>(35000);
  const [panNumber, setPanNumber] = useState<string>('');
  const [employmentStatus, setEmploymentStatus] = useState<string>('Salaried');
  
  const [amount, setAmount] = useState<number>(120000);
  const [tenureDays, setTenureDays] = useState<number>(180);

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [payAmount, setPayAmount] = useState<string>('');
  const [payRef, setPayRef] = useState<string>('');
  const [paying, setPaying] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchLoans = async () => {
    if (!token) return;
    try {
      setLoadingLoans(true);
      const res = await fetch(`${apiUrl}/loans/borrower`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLoans(data);
      }
    } catch (err) {
      console.error('Error fetching borrower loans:', err);
    } finally {
      setLoadingLoans(false);
    }
  };

  useEffect(() => {
    if (token && user?.role === 'Borrower') {
      fetchLoans();
    }
  }, [token, user]);

  const interestRate = 12;
  const interestAmount = Number((amount * (interestRate / 100) * (tenureDays / 365)).toFixed(2));
  const totalRepayment = Number((amount + interestAmount).toFixed(2));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('File size exceeds the maximum allowed limit of 5 MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    if (!panNumber.trim()) {
      setErrorMsg('A valid PAN Number is required');
      setSubmitting(false);
      return;
    }

    if (!file && employmentStatus === 'Salaried') {
      setErrorMsg('Salary slip upload is required for verification');
      setSubmitting(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('age', age.toString());
      formDataToSend.append('monthlySalary', monthlySalary.toString());
      formDataToSend.append('panNumber', panNumber.toUpperCase().trim());
      formDataToSend.append('employmentStatus', employmentStatus);
      formDataToSend.append('amount', amount.toString());
      formDataToSend.append('tenureDays', tenureDays.toString());
      if (file) {
        formDataToSend.append('salarySlip', file);
      }

      const res = await fetch(`${apiUrl}/loans/apply`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Application failed to submit');
      }

      setSuccessMsg(data.message || 'Application processed');
      setFile(null);
      setPanNumber('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      await fetchLoans();
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Check input values.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSubmit = async (loanId: string) => {
    if (!payAmount || parseFloat(payAmount) <= 0 || !payRef.trim()) {
      alert('Please enter a valid amount and reference details');
      return;
    }

    setPaying(true);
    try {
      const res = await fetch(`${apiUrl}/loans/collection/${loanId}/repay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountPaid: parseFloat(payAmount),
          referenceId: payRef.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Payment simulation failed');
      }

      alert(data.message || 'Payment logged successfully!');
      setPayAmount('');
      setPayRef('');
      await fetchLoans();
    } catch (err: any) {
      alert(err.message || 'Repayment failed');
    } finally {
      setPaying(false);
    }
  };

  if (authLoading || (user && user.role !== 'Borrower')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-650 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentActiveLoan = loans.find(l => !['Closed', 'Rejected', 'BRE_Rejected'].includes(l.status));
  const closedLoans = loans.filter(l => l.status === 'Closed');

  const getTimelineSteps = (status: string) => {
    const steps = [
      { name: 'BRE Check', desc: 'Eligibility logic checks', done: true },
      { name: 'Underwriting Review', desc: 'Sanction officer audit', done: ['Sanctioned', 'Disbursed', 'Closed'].includes(status) },
      { name: 'Fund Disbursement', desc: 'Release to bank', done: ['Disbursed', 'Closed'].includes(status) },
      { name: 'Settlement', desc: 'Active loan closing', done: status === 'Closed' }
    ];
    return steps;
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-3xs uppercase tracking-widest text-indigo-500 font-bold">Borrower Central</span>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mt-0.5">Welcome back, {user?.name}</h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400">Apply for financing and track active repayments.</p>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200/50 dark:border-zinc-850/50 text-center">
              <span className="block text-4xs uppercase tracking-wider text-zinc-400 font-semibold">Registered Portfolios</span>
              <span className="text-lg font-extrabold">{loans.length}</span>
            </div>
            {currentActiveLoan && (
              <div className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100/50 dark:border-emerald-900/30 text-center">
                <span className="block text-4xs uppercase tracking-wider text-emerald-500 font-semibold">Active Balance</span>
                <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{currentActiveLoan.repaymentProgress.remainingAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            {currentActiveLoan ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-8">
                
                <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
                  <div>
                    <span className="text-4xs font-mono uppercase text-zinc-400">Reference: {currentActiveLoan._id}</span>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white mt-1">Application Lifecycle Tracker</h2>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-2xs font-semibold uppercase tracking-wider ${
                    currentActiveLoan.status === 'Applied' ? 'bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400' :
                    currentActiveLoan.status === 'Sanctioned' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400' :
                    currentActiveLoan.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-955/20 dark:text-emerald-450' :
                    'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'
                  }`}>
                    {currentActiveLoan.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {getTimelineSteps(currentActiveLoan.status).map((step, idx) => (
                    <div key={idx} className="relative flex flex-col gap-1 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-955 border border-zinc-200/50 dark:border-zinc-850/50">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase text-zinc-450 tracking-wider">0{idx + 1}</span>
                        <div className={`h-2 w-2 rounded-full ${step.done ? 'bg-indigo-500 shadow-xs shadow-indigo-500' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                      </div>
                      <span className={`text-xs font-bold mt-1 ${step.done ? 'text-zinc-900 dark:text-white' : 'text-zinc-400'}`}>{step.name}</span>
                      <span className="text-4xs text-zinc-450 leading-tight">{step.desc}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Loan Parameters</h3>
                    <div className="space-y-2.5 text-xs text-zinc-650 dark:text-zinc-300">
                      <div className="flex justify-between">
                        <span>Requested Principal</span>
                        <span className="font-semibold text-zinc-850 dark:text-zinc-200">₹{currentActiveLoan.loanConfiguration.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tenure</span>
                        <span>{currentActiveLoan.loanConfiguration.tenureDays} Days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Interest Rate</span>
                        <span>12% p.a. Fixed SI</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-zinc-100 dark:border-zinc-850 pt-2 font-medium">
                        <span>Calculated Interest</span>
                        <span>₹{currentActiveLoan.loanConfiguration.interestAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-2 text-sm font-bold text-zinc-900 dark:text-white">
                        <span>Repayment Goal</span>
                        <span className="text-indigo-600 dark:text-indigo-400">₹{currentActiveLoan.loanConfiguration.totalRepayment.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Outstanding Progress</h3>
                    {currentActiveLoan.status === 'Disbursed' ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-4xs uppercase tracking-wider text-zinc-450 font-bold">
                            <span>Progress: {((currentActiveLoan.repaymentProgress.amountPaid / currentActiveLoan.loanConfiguration.totalRepayment) * 100).toFixed(0)}%</span>
                            <span>₹{currentActiveLoan.repaymentProgress.amountPaid.toLocaleString()} Paid</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-150 dark:bg-zinc-850 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (currentActiveLoan.repaymentProgress.amountPaid / currentActiveLoan.loanConfiguration.totalRepayment) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-150/20 text-center">
                          <span className="block text-4xs uppercase tracking-wider text-indigo-500 font-bold">Remaining Outstanding</span>
                          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                            ₹{currentActiveLoan.repaymentProgress.remainingAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-850 text-center">
                        <p className="text-2xs text-zinc-500 leading-normal">
                          {currentActiveLoan.status === 'Applied' && 'Your documents are being audited. Status updates will display here.'}
                          {currentActiveLoan.status === 'Sanctioned' && 'Your loan has been sanctioned! Funds will be disbursed shortly.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {currentActiveLoan.status === 'Disbursed' && (
                  <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800/80 pt-6 space-y-4">
                    <div className="bg-zinc-50 dark:bg-zinc-955 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-850/50 text-xs">
                      <span className="font-bold text-indigo-500 uppercase tracking-widest text-3xs">Sandbox Installment Logger</span>
                      <p className="text-zinc-500 mt-1">
                        Use this form to log partial payments. Once the total repayment matches the loan target, the status automatically transitions to Closed.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-4xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">Repayment Value (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 50000"
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-4xs uppercase tracking-wider font-semibold text-zinc-400 mb-1">Reference ID / Txn Hash</label>
                        <input
                          type="text"
                          placeholder="e.g. TXN28471"
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => handlePaymentSubmit(currentActiveLoan._id)}
                          disabled={paying}
                          className="w-full py-2.8 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center"
                        >
                          {paying ? 'Processing...' : 'Log Recovery'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-lg font-black text-zinc-900 dark:text-white">Apply for Credit</h2>
                  <p className="text-2xs text-zinc-550 dark:text-zinc-400 mt-0.5">Fill out your profile. Underwriting checks will evaluate instantly.</p>
                </div>

                {errorMsg && (
                  <div className="p-4 rounded-xl text-xs bg-rose-50 text-rose-700 dark:bg-rose-955/20 dark:text-rose-450 border border-rose-100/50 dark:border-rose-900/30">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-4 rounded-xl text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-955/20 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/30">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleApplySubmit} className="space-y-6">
                  <div className="space-y-3.5">
                    <span className="text-3xs uppercase tracking-widest text-zinc-400 font-bold block mb-2">1. Personal Credentials</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-2xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Age</label>
                        <input
                          type="number"
                          value={age}
                          onChange={(e) => setAge(parseInt(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                          required
                          min={1}
                        />
                        <span className="text-4xs text-zinc-450 mt-1 block">Rule: 23 to 50 years</span>
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Monthly Salary (₹)</label>
                        <input
                          type="number"
                          value={monthlySalary}
                          onChange={(e) => setMonthlySalary(parseInt(e.target.value))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                          required
                          min={1}
                        />
                        <span className="text-4xs text-zinc-455 mt-1 block">Rule: Minimum ₹25,000</span>
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">PAN Card Number</label>
                        <input
                          type="text"
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                          maxLength={10}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                          required
                        />
                        <span className="text-4xs text-zinc-455 mt-1 block">Rule: Standard 10-char PAN</span>
                      </div>

                      <div>
                        <label className="block text-2xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Employment Status</label>
                        <select
                          value={employmentStatus}
                          onChange={(e) => setEmploymentStatus(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        >
                          <option value="Salaried">Salaried</option>
                          <option value="Self-Employed">Self-Employed</option>
                          <option value="Unemployed">Unemployed</option>
                        </select>
                        <span className="text-4xs text-zinc-455 mt-1 block">Rule: Must be Salaried</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-3xs uppercase tracking-widest text-zinc-400 font-bold block mb-1">2. Document verification</span>
                    <label className="block text-2xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Income Proof (Salary Slip)</label>
                    <div className="border border-dashed border-zinc-250 dark:border-zinc-700 rounded-2xl p-4 text-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required={employmentStatus === 'Salaried'}
                      />
                      <div className="space-y-1">
                        <svg className="mx-auto h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {file ? file.name : 'Select payslip file'}
                        </p>
                        <p className="text-4xs text-zinc-450">
                          {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'PDF, JPG, PNG (Max 5MB)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <span className="text-3xs uppercase tracking-widest text-zinc-400 font-bold block mb-1">3. Principal and Tenure</span>
                    
                    <div className="space-y-5">
                      <div className="space-y-1">
                        <div className="flex justify-between text-2xs font-semibold">
                          <span className="text-zinc-500">Loan Principal</span>
                          <span className="text-indigo-600 dark:text-indigo-455 font-bold">₹{amount.toLocaleString()}</span>
                        </div>
                        <input
                          type="range"
                          min={50000}
                          max={500000}
                          step={5000}
                          value={amount}
                          onChange={(e) => setAmount(parseInt(e.target.value))}
                          className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                        />
                        <div className="flex justify-between text-4xs text-zinc-400">
                          <span>₹50,000</span>
                          <span>₹5,00,000</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-2xs font-semibold">
                          <span className="text-zinc-500">Tenure</span>
                          <span className="text-indigo-600 dark:text-indigo-455 font-bold">{tenureDays} Days</span>
                        </div>
                        <input
                          type="range"
                          min={30}
                          max={365}
                          step={5}
                          value={tenureDays}
                          onChange={(e) => setTenureDays(parseInt(e.target.value))}
                          className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-655"
                        />
                        <div className="flex justify-between text-4xs text-zinc-400">
                          <span>30 Days</span>
                          <span>365 Days</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20"
                  >
                    {submitting ? 'Auditing details...' : 'Submit Application'}
                  </button>
                </form>
              </div>
            )}

            {currentActiveLoan && currentActiveLoan.status === 'Disbursed' && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-zinc-850 dark:text-zinc-200 uppercase tracking-wider">Payment ledger log</h3>
                {currentActiveLoan.paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-2xs">
                      <thead>
                        <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Txn Reference</th>
                          <th className="pb-2 text-right">Repayment Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 dark:divide-zinc-850">
                        {currentActiveLoan.paymentHistory.map((history) => (
                          <tr key={history._id || history.referenceId} className="text-zinc-650 dark:text-zinc-300">
                            <td className="py-2.5">{new Date(history.paymentDate).toLocaleDateString()}</td>
                            <td className="py-2.5 font-mono">{history.referenceId}</td>
                            <td className="py-2.5 text-right font-bold text-emerald-600">₹{history.amountPaid.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-2xs text-zinc-500 text-center py-4 bg-zinc-50 dark:bg-zinc-855 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-850">
                    No transactions recorded.
                  </p>
                )}
              </div>
            )}

          </div>

          <div className="space-y-8">
            
            {!currentActiveLoan && (
              <div className="bg-zinc-900 text-white rounded-3xl p-6 shadow-xl border border-zinc-800 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Apex Math Calculator</h3>
                  <span className="text-4xs uppercase tracking-widest text-indigo-400 font-bold block mt-0.5">Fixed 12% p.a. simple rate</span>
                </div>

                <div className="space-y-3.5 border-b border-zinc-800 pb-4 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Selected Principal</span>
                    <span className="font-semibold text-white">₹{amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tenure Period</span>
                    <span className="font-semibold text-white">{tenureDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest (Daily basis)</span>
                    <span className="font-semibold text-white">12.0%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Computed Interest</span>
                    <span className="font-semibold text-white">₹{interestAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold">
                    <span>Repayment Target</span>
                    <span className="text-xl text-indigo-400 font-black">₹{totalRepayment.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/80 text-4xs text-zinc-500 font-mono">
                  Formula: P &times; 0.12 &times; ({tenureDays}/365)
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-zinc-855 dark:text-zinc-200 uppercase tracking-wider">Application Ledger</h3>
              
              {loadingLoans ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                </div>
              ) : loans.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {loans.map((l) => (
                    <div key={l._id} className="p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-850 text-2xs flex flex-col gap-1 bg-zinc-50/50 dark:bg-zinc-955/20">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{l.loanConfiguration.amount.toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded text-4xs font-bold uppercase ${
                          l.status === 'Applied' ? 'bg-amber-100 text-amber-850 dark:bg-amber-955/20 dark:text-amber-400' :
                          l.status === 'Sanctioned' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/20 dark:text-indigo-400' :
                          l.status === 'Disbursed' ? 'bg-emerald-100 text-emerald-805 dark:bg-emerald-955/20 dark:text-emerald-450' :
                          l.status === 'Closed' ? 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-400'
                        }`}>
                          {l.status === 'BRE_Rejected' ? 'BRE Reject' : l.status}
                        </span>
                      </div>
                      <div className="text-4xs text-zinc-450 flex justify-between">
                        <span>{new Date(l.createdAt).toLocaleDateString()}</span>
                        <span>{l.loanConfiguration.tenureDays} days</span>
                      </div>
                      {l.rejectionReason && (
                        <p className="text-4xs text-rose-500 mt-1 border-t border-rose-100/10 pt-1 leading-relaxed">
                          Note: {l.rejectionReason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-2xs text-zinc-550 text-center py-6 bg-zinc-50 dark:bg-zinc-955/25 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-850">
                  No applications recorded.
                </p>
              )}
            </div>

            {closedLoans.length > 0 && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                  <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <span>Settled Accounts</span>
                </h3>
                <div className="space-y-2">
                  {closedLoans.map((cl) => (
                    <div key={cl._id} className="p-3 rounded-xl bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/20 text-2xs">
                      <div className="flex justify-between font-bold">
                        <span>Principal: ₹{cl.loanConfiguration.amount.toLocaleString()}</span>
                        <span className="text-emerald-600">Settled</span>
                      </div>
                      <div className="text-4xs text-zinc-450 mt-1 flex justify-between">
                        <span>ID: {cl._id.slice(-6)}...</span>
                        <span>{new Date(cl.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
