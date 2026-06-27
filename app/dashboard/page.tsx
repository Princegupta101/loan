'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { useAuth, UserRole } from '../context/AuthContext';

interface Lead {
  borrower: {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
  };
  loanStatus: string;
  rejectionReason?: string;
  lastUpdated: string;
}

interface LoanApplication {
  _id: string;
  borrowerId: {
    _id: string;
    name: string;
    email: string;
  };
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
  status: string;
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

interface Stats {
  counts: {
    totalLoans: number;
    activeLoans: number;
    pendingLoans: number;
    sanctionedLoans: number;
    closedLoans: number;
    breRejectedLoans: number;
    totalBorrowers: number;
  };
  financials: {
    totalDisbursedAmount: number;
    totalExpectedRepayment: number;
    totalCollectedAmount: number;
    outstandingAmount: number;
  };
}

type TabType = 'Overview' | 'Sales' | 'Sanction' | 'Disbursement' | 'Collection';

export default function DashboardPage() {
  const { user, token, loading: authLoading, apiUrl } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && user.role === 'Borrower') {
      router.push('/borrower');
    }
  }, [user, authLoading, router]);

  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [salesLeads, setSalesLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchLead, setSearchLead] = useState('');

  const [appliedLoans, setAppliedLoans] = useState<LoanApplication[]>([]);
  const [loadingApplied, setLoadingApplied] = useState(false);

  const [sanctionedLoans, setSanctionedLoans] = useState<LoanApplication[]>([]);
  const [loadingSanctioned, setLoadingSanctioned] = useState(false);

  const [activeLoans, setActiveLoans] = useState<LoanApplication[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);
  const [searchActive, setSearchActive] = useState('');

  const [selectedReviewLoan, setSelectedReviewLoan] = useState<LoanApplication | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [checklists, setChecklists] = useState({
    slipVerified: false,
    panMatch: false,
    kycOk: false
  });

  const [selectedRepayLoan, setSelectedRepayLoan] = useState<LoanApplication | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayRef, setRepayRef] = useState('');
  const [repaySubmitting, setRepaySubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'Sales') setActiveTab('Sales');
      else if (user.role === 'Sanction') setActiveTab('Sanction');
      else if (user.role === 'Disbursement') setActiveTab('Disbursement');
      else if (user.role === 'Collection') setActiveTab('Collection');
      else setActiveTab('Overview');
    }
  }, [user]);

  const fetchStats = async () => {
    if (!token) return;
    try {
      setLoadingStats(true);
      const res = await fetch(`${apiUrl}/loans/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchSalesLeads = async () => {
    if (!token) return;
    try {
      setLoadingLeads(true);
      const res = await fetch(`${apiUrl}/loans/sales`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSalesLeads(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const fetchAppliedLoans = async () => {
    if (!token) return;
    try {
      setLoadingApplied(true);
      const res = await fetch(`${apiUrl}/loans/sanction`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAppliedLoans(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingApplied(false);
    }
  };

  const fetchSanctionedLoans = async () => {
    if (!token) return;
    try {
      setLoadingSanctioned(true);
      const res = await fetch(`${apiUrl}/loans/disbursement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSanctionedLoans(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSanctioned(false);
    }
  };

  const fetchActiveLoans = async () => {
    if (!token) return;
    try {
      setLoadingActive(true);
      const res = await fetch(`${apiUrl}/loans/collection`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveLoans(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActive(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      if (activeTab === 'Overview') fetchStats();
      if (activeTab === 'Sales') fetchSalesLeads();
      if (activeTab === 'Sanction') fetchAppliedLoans();
      if (activeTab === 'Disbursement') fetchSanctionedLoans();
      if (activeTab === 'Collection') fetchActiveLoans();
    }
  }, [activeTab, token]);

  const handleReviewSubmit = async (status: 'Sanctioned' | 'Rejected') => {
    if (!selectedReviewLoan || !token) return;
    
    if (status === 'Sanctioned' && (!checklists.slipVerified || !checklists.panMatch || !checklists.kycOk)) {
      alert('All items in the underwriting checklist must be verified before approval.');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/loans/sanction/${selectedReviewLoan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, note: reviewNote.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Audit save failed');

      alert(`Application marked ${status.toLowerCase()}`);
      setSelectedReviewLoan(null);
      setReviewNote('');
      setChecklists({ slipVerified: false, panMatch: false, kycOk: false });
      fetchAppliedLoans();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Error saving review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDisburseSubmit = async (loanId: string) => {
    if (!token) return;
    if (!confirm('Proceed with fund release?')) return;

    try {
      const res = await fetch(`${apiUrl}/loans/disbursement/${loanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ note: 'Transferred successfully.' })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Release failed');
      }

      alert('Funds successfully disbursed!');
      fetchSanctionedLoans();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Disbursement error');
    }
  };

  const handleCollectorRepayment = async () => {
    if (!selectedRepayLoan || !token || !repayAmount || !repayRef.trim()) return;
    setRepaySubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/loans/collection/${selectedRepayLoan._id}/repay`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amountPaid: parseFloat(repayAmount),
          referenceId: repayRef.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Logging payment failed');

      alert(data.message || 'Payment logged successfully!');
      setSelectedRepayLoan(null);
      setRepayAmount('');
      setRepayRef('');
      fetchActiveLoans();
      fetchStats();
    } catch (err: any) {
      alert(err.message || 'Error recording recovery');
    } finally {
      setRepaySubmitting(false);
    }
  };

  if (authLoading || (user && user.role === 'Borrower')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const filteredLeads = salesLeads.filter(lead => 
    lead.borrower.name.toLowerCase().includes(searchLead.toLowerCase()) || 
    lead.borrower.email.toLowerCase().includes(searchLead.toLowerCase())
  );

  const filteredActiveLoans = activeLoans.filter(l => 
    l.borrowerId.name.toLowerCase().includes(searchActive.toLowerCase()) || 
    l.borrowerId.email.toLowerCase().includes(searchActive.toLowerCase()) || 
    l._id.includes(searchActive)
  );

  const allowedTabs: TabType[] = [];
  if (user?.role === 'Admin') {
    allowedTabs.push('Overview', 'Sales', 'Sanction', 'Disbursement', 'Collection');
  } else if (user?.role === 'Sales') {
    allowedTabs.push('Sales');
  } else if (user?.role === 'Sanction') {
    allowedTabs.push('Sanction');
  } else if (user?.role === 'Disbursement') {
    allowedTabs.push('Disbursement');
  } else if (user?.role === 'Collection') {
    allowedTabs.push('Collection');
  }

  const getDebtToIncomeRatio = (salary: number, amount: number, days: number) => {
    const monthlyInstallment = (amount / days) * 30;
    const ratio = (monthlyInstallment / salary) * 100;
    return ratio;
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-955 text-zinc-900 dark:text-zinc-50 transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-3xs uppercase tracking-widest text-indigo-500 font-bold">Backoffice Controls</span>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mt-0.5">{user?.role} Workspace</h1>
            <p className="text-xs text-zinc-550 dark:text-zinc-400 font-medium">Verify documents, approve tickets, and manage collections.</p>
          </div>

          {user?.role === 'Admin' && (
            <div className="flex flex-wrap gap-1 p-1.5 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/50 dark:border-zinc-850/50">
              {allowedTabs.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all ${
                    activeTab === t
                      ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-zinc-200/10'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeTab === 'Overview' && stats && (
          <div className="space-y-8 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Capital Ledger Analytics</h3>
                  <span className="text-4xs text-zinc-455">Real-time recovery ratios compared to disbursed reserves</span>
                </div>
                <div className="text-right">
                  <span className="text-2xs font-bold text-emerald-600 dark:text-emerald-400 block">
                    {stats.financials.totalDisbursedAmount > 0 
                      ? ((stats.financials.totalCollectedAmount / stats.financials.totalExpectedRepayment) * 100).toFixed(1) 
                      : '0.0'}% Recovery Ratio
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between text-xs font-bold text-zinc-650 dark:text-zinc-350">
                  <div className="space-y-1 w-full">
                    <span className="text-4xs uppercase text-zinc-400 font-bold block">Disbursed (Goal)</span>
                    <div className="h-6 w-full bg-indigo-55 dark:bg-indigo-950/20 border border-indigo-200/20 rounded-xl relative overflow-hidden flex items-center px-3">
                      <span className="text-indigo-700 dark:text-indigo-400 z-10">₹{stats.financials.totalExpectedRepayment.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="space-y-1 w-full">
                    <span className="text-4xs uppercase text-zinc-400 font-bold block">Recovered (Settle)</span>
                    <div className="h-6 w-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/20 rounded-xl relative overflow-hidden flex items-center px-3">
                      <div 
                        className="absolute inset-0 bg-emerald-500/10 transition-all duration-300"
                        style={{ width: `${stats.financials.totalExpectedRepayment > 0 ? (stats.financials.totalCollectedAmount / stats.financials.totalExpectedRepayment) * 100 : 0}%` }}
                      />
                      <span className="text-emerald-700 dark:text-emerald-450 z-10">₹{stats.financials.totalCollectedAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-1">
                <span className="text-4xs uppercase tracking-wider text-zinc-400 font-bold block">Total Capital Disbursed</span>
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">₹{stats.financials.totalDisbursedAmount.toLocaleString()}</span>
                <span className="block text-4xs text-zinc-450 mt-1">Excludes applied & sanctioned queues</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-1">
                <span className="text-4xs uppercase tracking-wider text-zinc-400 font-bold block">Expected Repayments</span>
                <span className="text-2xl font-black text-zinc-800 dark:text-white">₹{stats.financials.totalExpectedRepayment.toLocaleString()}</span>
                <span className="block text-4xs text-zinc-450 mt-1">Principal + 12% p.a. simple interest</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-1">
                <span className="text-4xs uppercase tracking-wider text-emerald-500 font-bold block">Recovered Installments</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-450">₹{stats.financials.totalCollectedAmount.toLocaleString()}</span>
                <span className="block text-4xs text-zinc-450 mt-1">Outstanding: ₹{stats.financials.outstandingAmount.toLocaleString()}</span>
              </div>

              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs space-y-1">
                <span className="text-4xs uppercase tracking-wider text-amber-500 font-bold block">Outstanding Balance</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-450">₹{stats.financials.outstandingAmount.toLocaleString()}</span>
                <span className="block text-4xs text-zinc-450 mt-1">Active risk outstanding</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Total Loans', count: stats.counts.totalLoans, color: 'text-zinc-900 dark:text-white' },
                { label: 'Pending Review', count: stats.counts.pendingLoans, color: 'text-amber-600' },
                { label: 'Sanctioned', count: stats.counts.sanctionedLoans, color: 'text-indigo-650 dark:text-indigo-400' },
                { label: 'Active Loans', count: stats.counts.activeLoans, color: 'text-emerald-600' },
                { label: 'Closed & Paid', count: stats.counts.closedLoans, color: 'text-zinc-500' },
                { label: 'BRE Rejections', count: stats.counts.breRejectedLoans, color: 'text-rose-500' },
                { label: 'Borrowers', count: stats.counts.totalBorrowers, color: 'text-blue-500' }
              ].map((item, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 text-center">
                  <span className="block text-4xs font-bold uppercase tracking-wider text-zinc-400 mb-1">{item.label}</span>
                  <span className={`text-xl font-black ${item.color}`}>{item.count}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-4">
                <span className="text-3xs uppercase tracking-widest text-zinc-400 font-bold block">Ops backoffice redirects</span>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-normal">
                  Toggle views to inspect specific pipeline stages. Individual agents will see only their mapped module pages.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setActiveTab('Sales')} className="px-3.5 py-1.8 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 rounded-xl text-2xs font-bold border border-zinc-200 dark:border-zinc-850 cursor-pointer transition-all">Sales leads</button>
                  <button onClick={() => setActiveTab('Sanction')} className="px-3.5 py-1.8 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 rounded-xl text-2xs font-bold border border-zinc-200 dark:border-zinc-855 cursor-pointer transition-all">Sanctions review</button>
                  <button onClick={() => setActiveTab('Disbursement')} className="px-3.5 py-1.8 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 rounded-xl text-2xs font-bold border border-zinc-200 dark:border-zinc-850 cursor-pointer transition-all">Funding release</button>
                  <button onClick={() => setActiveTab('Collection')} className="px-3.5 py-1.8 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 rounded-xl text-2xs font-bold border border-zinc-200 dark:border-zinc-850 cursor-pointer transition-all">Collections recoveries</button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-4 flex flex-col justify-center text-xs">
                <span className="text-3xs uppercase tracking-widest text-zinc-400 font-bold block mb-1">RBI Risk Compliance settings</span>
                <div className="grid grid-cols-2 gap-4 text-2xs text-zinc-550 dark:text-zinc-400">
                  <div>
                    <span className="text-zinc-400 block font-medium">Interest calculation formula</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-250">Simple interest @ 12.0% p.a.</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">Ticket size range</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-250">₹50,000 to ₹5,00,000</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">Audited income files</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-250">PDF, JPG, PNG (Max 5MB)</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block font-medium">Underwriting age range</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-250">23 to 50 years</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Sales' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 dark:border-zinc-855 pb-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Registered Customer leads</h2>
                <p className="text-xs text-zinc-550 mt-0.5">Borrowers who signed up but have not completed an active application ticket.</p>
              </div>
              
              <input
                type="text"
                placeholder="Search leads by email or name..."
                value={searchLead}
                onChange={e => setSearchLead(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:max-w-xs"
              />
            </div>

            {loadingLeads ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3 text-center">Eligibility State</th>
                      <th className="pb-3">Audit Logs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.borrower._id} className="text-zinc-650 dark:text-zinc-300">
                        <td className="py-4 font-bold text-zinc-900 dark:text-white">{lead.borrower.name}</td>
                        <td className="py-4 font-mono text-2xs">{lead.borrower.email}</td>
                        <td className="py-4">{new Date(lead.borrower.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-4xs font-bold uppercase tracking-wider ${
                            lead.loanStatus === 'Never Applied' ? 'bg-zinc-100 text-zinc-655 dark:bg-zinc-850' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-450'
                          }`}>
                            {lead.loanStatus}
                          </span>
                        </td>
                        <td className="py-4 text-2xs text-zinc-450 max-w-[200px] truncate">
                          {lead.rejectionReason ? lead.rejectionReason : 'No active application submitted'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-955/25 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
                No matching leads found.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Sanction' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Underwriter Review Desk</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Active applications pending pay slip verification and credit reviews.</p>
            </div>

            {loadingApplied ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : appliedLoans.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appliedLoans.map((loan) => {
                  const dtiRatio = getDebtToIncomeRatio(
                    loan.personalDetails.monthlySalary,
                    loan.loanConfiguration.amount,
                    loan.loanConfiguration.tenureDays
                  );
                  return (
                    <div key={loan._id} className="p-5 rounded-2xl border border-zinc-250 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-4xs text-zinc-455 font-mono">Reference ID: {loan._id}</span>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">{loan.borrowerId?.name}</h3>
                            <span className="text-4xs font-mono text-zinc-450 block">{loan.borrowerId?.email}</span>
                          </div>
                          <span className="rounded-full px-2.5 py-0.5 text-4xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-400 uppercase tracking-wider">
                            Reviewing
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 border-y border-dashed border-zinc-200 dark:border-zinc-805 py-3 text-2xs text-zinc-555 dark:text-zinc-400">
                          <div>
                            <span className="text-zinc-400 block text-4xs uppercase tracking-wide">Applicant Age</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">{loan.personalDetails.age} years (Verified)</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-4xs uppercase tracking-wide">Monthly Salary</span>
                            <span className="font-bold text-emerald-600">₹{loan.personalDetails.monthlySalary.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-4xs uppercase tracking-wide">PAN Reference</span>
                            <span className="font-bold font-mono text-zinc-800 dark:text-zinc-250">{loan.personalDetails.panNumber}</span>
                          </div>
                          <div>
                            <span className="text-zinc-400 block text-4xs uppercase tracking-wide">Employment class</span>
                            <span className="font-bold text-zinc-855 dark:text-zinc-250">{loan.personalDetails.employmentStatus}</span>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200/50 dark:border-zinc-850/50 flex justify-between items-center text-xs">
                          <div>
                            <span className="block text-4xs uppercase text-zinc-400 font-bold">Debt-to-Income (DTI)</span>
                            <span className="text-zinc-650 dark:text-zinc-350">Estimated monthly installment relative to salary</span>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            dtiRatio > 50 
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-955/20 dark:text-rose-400 font-extrabold' 
                              : 'bg-emerald-100 text-emerald-805 dark:bg-emerald-955/20 dark:text-emerald-450'
                          }`}>
                            {dtiRatio.toFixed(0)}% {dtiRatio > 50 ? 'High Risk' : 'Low Risk'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-2xs text-zinc-650 dark:text-zinc-355">
                          <div className="flex justify-between">
                            <span>Principal Request</span>
                            <span className="font-bold text-zinc-800 dark:text-zinc-200">₹{loan.loanConfiguration.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tenure Days</span>
                            <span>{loan.loanConfiguration.tenureDays} Days</span>
                          </div>
                          <div className="flex justify-between border-t border-zinc-250 dark:border-zinc-850 pt-1.5 font-bold text-xs text-zinc-900 dark:text-white">
                            <span>Repayment Target</span>
                            <span>₹{loan.loanConfiguration.totalRepayment.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        {loan.documentUrl ? (
                          <button
                            onClick={() => {
                              const url = loan.documentUrl?.startsWith('http')
                                ? loan.documentUrl
                                : `http://localhost:5000${loan.documentUrl}`;
                              window.open(url, '_blank');
                            }}
                            className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-xl text-3xs font-bold border border-indigo-200/10 cursor-pointer flex items-center justify-center gap-1"
                          >
                            <svg className="w-3 h-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <span>Open Payslip Document</span>
                          </button>
                        ) : (
                          <div className="w-full py-2 bg-rose-50/50 dark:bg-rose-950/15 text-rose-500 rounded-xl text-3xs text-center border border-rose-100/10">
                            Payslip document is missing
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setSelectedReviewLoan(loan)}
                            className="py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer text-center"
                          >
                            Audit Decision
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReviewLoan(loan);
                              setReviewNote('Document checklist not satisfied.');
                            }}
                            className="py-2.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-center text-zinc-700 dark:text-zinc-300 transition-all"
                          >
                            Decline ticket
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
                No applications pending underwriting sanction.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Disbursement' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Funding Disbursement queue</h2>
              <p className="text-xs text-zinc-550 mt-0.5">Approved applications awaiting transfer of capital.</p>
            </div>

            {loadingSanctioned ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : sanctionedLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Reference ID</th>
                      <th className="pb-3">Borrower Name</th>
                      <th className="pb-3 text-right">Disbursement sum</th>
                      <th className="pb-3 text-right">Daily interest math</th>
                      <th className="pb-3 text-right">Repayment goal</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Transfer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {sanctionedLoans.map((loan) => (
                      <tr key={loan._id} className="text-zinc-650 dark:text-zinc-300">
                        <td className="py-4 font-mono text-2xs">{loan._id}</td>
                        <td className="py-4 font-bold text-zinc-900 dark:text-white">
                          {loan.borrowerId?.name || 'Borrower'}
                        </td>
                        <td className="py-4 text-right font-semibold">₹{loan.loanConfiguration.amount.toLocaleString()}</td>
                        <td className="py-4 text-right text-zinc-450">₹{loan.loanConfiguration.interestAmount.toLocaleString()}</td>
                        <td className="py-4 text-right text-indigo-600 dark:text-indigo-400 font-bold">₹{loan.loanConfiguration.totalRepayment.toLocaleString()}</td>
                        <td className="py-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-4xs font-bold bg-indigo-50 text-indigo-805 dark:bg-indigo-950/20 dark:text-indigo-400 uppercase tracking-wider">
                            Approved
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDisburseSubmit(loan._id)}
                            className="px-3.5 py-1.8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                          >
                            Release Funds
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
                No active transfers pending.
              </div>
            )}
          </div>
        )}

        {activeTab === 'Collection' && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-2xs space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-100 dark:border-zinc-850 pb-5">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Recoveries Ledger</h2>
                <p className="text-xs text-zinc-550 mt-0.5">Track collections status, log incoming payments, and review closed tickets.</p>
              </div>
              
              <input
                type="text"
                placeholder="Search active books..."
                value={searchActive}
                onChange={e => setSearchActive(e.target.value)}
                className="px-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-full sm:max-w-xs"
              />
            </div>

            {loadingActive ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
              </div>
            ) : filteredActiveLoans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3">Reference ID</th>
                      <th className="pb-3">Borrower Details</th>
                      <th className="pb-3 text-right">Repayment Due</th>
                      <th className="pb-3 text-right">Total Recovered</th>
                      <th className="pb-3 text-right">Balance Due</th>
                      <th className="pb-3 text-center">Settled ratio</th>
                      <th className="pb-3 text-center">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {filteredActiveLoans.map((loan) => (
                      <tr key={loan._id} className="text-zinc-650 dark:text-zinc-300">
                        <td className="py-4 font-mono text-2xs">{loan._id}</td>
                        <td className="py-4">
                          <span className="font-bold text-zinc-900 dark:text-white block">{loan.borrowerId?.name}</span>
                          <span className="text-4xs text-zinc-450 block">{loan.borrowerId?.email}</span>
                        </td>
                        <td className="py-4 text-right font-semibold">₹{loan.loanConfiguration.totalRepayment.toLocaleString()}</td>
                        <td className="py-4 text-right text-emerald-600 font-bold">₹{loan.repaymentProgress.amountPaid.toLocaleString()}</td>
                        <td className="py-4 text-right text-rose-500 font-bold">₹{loan.repaymentProgress.remainingAmount.toLocaleString()}</td>
                        <td className="py-4 text-center px-4">
                          <div className="flex items-center gap-1.5 max-w-[120px] mx-auto text-4xs">
                            <div className="w-full bg-zinc-150 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (loan.repaymentProgress.amountPaid / loan.loanConfiguration.totalRepayment) * 100)}%` }}
                              />
                            </div>
                            <span className="font-bold">
                              {((loan.repaymentProgress.amountPaid / loan.loanConfiguration.totalRepayment) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-4xs font-bold uppercase tracking-wider ${
                            loan.status === 'Disbursed' ? 'bg-emerald-50 text-emerald-805 dark:bg-emerald-955/20 dark:text-emerald-450' :
                            'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'
                          }`}>
                            {loan.status === 'Disbursed' ? 'Active' : loan.status}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          {loan.status === 'Disbursed' ? (
                            <button
                              onClick={() => setSelectedRepayLoan(loan)}
                              className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition-all"
                            >
                              Log recovery
                            </button>
                          ) : (
                            <span className="text-4xs font-bold text-zinc-400 uppercase tracking-widest">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-zinc-500 bg-zinc-50 dark:bg-zinc-950/20 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
                No active loans registered.
              </div>
            )}
          </div>
        )}

        {selectedReviewLoan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Audit loan ticket</h3>
                  <span className="text-4xs text-zinc-450">ID: {selectedReviewLoan._id}</span>
                </div>
                <button
                  onClick={() => { 
                    setSelectedReviewLoan(null); 
                    setReviewNote(''); 
                    setChecklists({ slipVerified: false, panMatch: false, kycOk: false });
                  }}
                  className="text-zinc-455 hover:text-zinc-850 text-sm cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-955 p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-850/60 space-y-3">
                <span className="block text-4xs uppercase tracking-wider font-bold text-indigo-500">Credit Audit Checklist</span>
                
                <label className="flex items-center gap-2.5 text-xs text-zinc-650 dark:text-zinc-350 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklists.slipVerified}
                    onChange={(e) => setChecklists({ ...checklists, slipVerified: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Income Statement Verified</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-650 dark:text-zinc-350 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklists.panMatch}
                    onChange={(e) => setChecklists({ ...checklists, panMatch: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>PAN Card Match Checked</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-650 dark:text-zinc-350 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklists.kycOk}
                    onChange={(e) => setChecklists({ ...checklists, kycOk: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Applicant KYC Completed</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="block text-4xs uppercase tracking-wider font-bold text-zinc-455">Audit log comments / Rejection reasons</label>
                <textarea
                  placeholder="Input feedback, audit notes, or rejection details..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-250 dark:border-zinc-700 bg-transparent text-xs rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 h-20 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1.5">
                <button
                  onClick={() => handleReviewSubmit('Sanctioned')}
                  className="w-full py-2.8 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!checklists.slipVerified || !checklists.panMatch || !checklists.kycOk}
                >
                  {reviewSubmitting ? 'Processing...' : 'Sanction (Approve)'}
                </button>
                <button
                  onClick={() => handleReviewSubmit('Rejected')}
                  disabled={reviewSubmitting}
                  className="w-full py-2.8 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-955/20 dark:text-rose-400 dark:border-rose-900/40 border border-rose-250 cursor-pointer flex items-center justify-center"
                >
                  {reviewSubmitting ? 'Declining...' : 'Decline (Reject)'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedRepayLoan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Record Recovery log</h3>
                  <span className="text-4xs text-zinc-450 font-mono">ID: {selectedRepayLoan._id}</span>
                </div>
                <button
                  onClick={() => { setSelectedRepayLoan(null); setRepayAmount(''); setRepayRef(''); }}
                  className="text-zinc-455 hover:text-zinc-850 text-sm cursor-pointer"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-2 text-2xs text-zinc-650 dark:text-zinc-350">
                <div className="flex justify-between">
                  <span>Borrower:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{selectedRepayLoan.borrowerId?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Repayment Due:</span>
                  <span className="font-bold">₹{selectedRepayLoan.loanConfiguration.totalRepayment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Ledger:</span>
                  <span className="font-semibold text-emerald-600">₹{selectedRepayLoan.repaymentProgress.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-250 dark:border-zinc-850 pt-2 font-bold text-zinc-900 dark:text-white">
                  <span className="text-rose-500">Outstanding:</span>
                  <span className="text-rose-600">₹{selectedRepayLoan.repaymentProgress.remainingAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-4xs uppercase tracking-wider font-bold text-zinc-455 mb-1">Repayment collected (₹)</label>
                  <input
                    type="number"
                    placeholder="Enter collected amount..."
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-4xs uppercase tracking-wider font-bold text-zinc-455 mb-1">Receipt Reference ID</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN284719"
                    value={repayRef}
                    onChange={(e) => setRepayRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-zinc-200 dark:border-zinc-700 bg-transparent text-xs rounded-xl outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCollectorRepayment}
                disabled={repaySubmitting || !repayAmount || !repayRef.trim()}
                className="w-full py-3 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-zinc-250 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center transition-all"
              >
                {repaySubmitting ? 'Recording...' : 'Log recovered transaction'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
