import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { ShieldCheck, User, Landmark, Check, X, Search, FileBarChart } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminPanel() {
  const { user, profile, setProfile } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    if (user.simulated) {
      const loadSimData = () => {
        try {
          const simLoansStr = localStorage.getItem('saccoswift_sim_loans');
          if (simLoansStr) {
            setLoans(JSON.parse(simLoansStr));
          } else {
            setLoans([]);
          }
          setMembersCount(87);
          setTotalSavings(4152000);
        } catch (e) {
          console.error(e);
        }
      };
      
      loadSimData();
      const interval = setInterval(loadSimData, 800);
      return () => clearInterval(interval);
    }

    // 1. Listen for ALL loans
    const loanQuery = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    const unsubLoans = onSnapshot(loanQuery, (snapshot) => {
      setLoans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Fetch stats (live Sacco member database)
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setMembersCount(snapshot.size);
      let total = 0;
      snapshot.docs.forEach(d => total += (d.data().savingsBalance || 0));
      setTotalSavings(total);
    });

    return () => {
      unsubLoans();
      unsubUsers();
    };
  }, [user]);

  const handleLoanAction = async (loanId: string, userId: string, amount: number, action: 'approved' | 'rejected') => {
    setLoading(loanId);
    try {
      if (user?.simulated) {
        // Update simulated loans in localStorage
        const simLoansStr = localStorage.getItem('saccoswift_sim_loans') || '[]';
        const simLoans = JSON.parse(simLoansStr);
        const updatedLoans = simLoans.map((l: any) => l.id === loanId ? { ...l, status: action } : l);
        localStorage.setItem('saccoswift_sim_loans', JSON.stringify(updatedLoans));

        if (action === 'approved') {
          // Add simulated transaction for the user
          const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
          const simTxs = JSON.parse(simTxsStr);
          simTxs.unshift({
            id: `TX-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
            userId: userId,
            type: 'deposit',
            amount: amount,
            description: `Disbursement: Approved Loan`,
            timestamp: new Date().toISOString(),
            status: 'completed'
          });
          localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));

          // If the simulated user happens to approve their own loan, we update the current simulated profile
          if (userId === user.uid) {
            const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
            currentProfile.savingsBalance = (currentProfile.savingsBalance || 0) + amount;
            currentProfile.loanBalance = (currentProfile.loanBalance || 0) + amount;
            localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
            setProfile(currentProfile);
          }
        }
        alert(`Loan ${action} successfully!`);
        return;
      }

      // 1. Update loan doc
      const loanRef = doc(db, 'loans', loanId);
      await updateDoc(loanRef, { status: action });

      if (action === 'approved') {
        // 2. Update user loan balance AND disburse funds to savings balance!
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          await updateDoc(userRef, {
             loanBalance: increment(amount),
             savingsBalance: increment(amount)
          });

          // 3. Register automated disbursement transaction in transactions collection
          const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
          await addDoc(collection(db, 'transactions'), {
            userId: userId,
            type: 'deposit',
            amount: amount,
            description: `Disbursement: Approved Loan`,
            timestamp: serverTimestamp()
          });
        }
      }
      alert(`Loan ${action} successfully!`);
    } catch (err) {
      console.error(err);
      alert('Action failed. You might not have sufficient permissions.');
    } finally {
      setLoading(null);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(val);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
             <ShieldCheck size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Admin Panel</h2>
            <p className="text-zinc-500">Global SACCO operations and loan management</p>
          </div>
        </div>
        <Button variant="outline">
          <div className="flex items-center gap-2">
            <FileBarChart size={18} />
            <span>Generate Report</span>
          </div>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 text-white">
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Total Members</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-black">{membersCount}</h3>
            <p className="text-emerald-400 text-xs font-bold mb-1">+2 this week</p>
          </div>
        </Card>
        <Card className="bg-emerald-600 text-white">
          <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mb-1">Portfolio Savings</p>
          <h3 className="text-3xl font-black">{formatCurrency(totalSavings)}</h3>
        </Card>
        <Card>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Pending Approvals</p>
          <h3 className="text-3xl font-black">{loans.filter(l => l.status === 'pending').length}</h3>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
            <h4 className="font-bold text-lg">Loan Requests</h4>
            <div className="flex gap-2">
                <Button variant="secondary" className="px-3 py-1.5 text-xs">Pending</Button>
                <Button variant="outline" className="px-3 py-1.5 text-xs text-zinc-400">All History</Button>
            </div>
        </div>

        <div className="space-y-4">
          {loans.filter(l => l.status === 'pending').map((loan) => (
            <div key={loan.id}>
              <Card className="flex flex-col gap-4 animate-in fade-in duration-500 p-5">
                 <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center shrink-0">
                         <User className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="font-black text-lg text-zinc-900">{formatCurrency(loan.amount)}</p>
                        <p className="text-xs text-zinc-500 font-semibold">Term: {loan.durationMonths} Months • Interest: 12% p.a.</p>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase font-black tracking-wider">Member ID: {loan.userId.substring(0, 8)}...</p>
                      </div>
                   </div>

                   <div className="flex gap-2.5 w-full md:w-auto self-end md:self-center">
                      <Button 
                        variant="danger" 
                        className="flex-1 md:flex-initial px-4 py-2 h-10 text-[10px] rounded-xl"
                        onClick={() => handleLoanAction(loan.id, loan.userId, loan.amount, 'rejected')}
                        disabled={loading === loan.id}
                      >
                         <X size={16} />
                      </Button>
                      <Button 
                        variant="primary" 
                        className="flex-1 md:flex-initial px-5 py-3 h-10 text-[10px] rounded-xl"
                        onClick={() => handleLoanAction(loan.id, loan.userId, loan.amount, 'approved')}
                        disabled={loading === loan.id}
                      >
                         <div className="flex items-center gap-1.5">
                             <Check size={16} />
                             <span>Approve</span>
                         </div>
                      </Button>
                   </div>
                 </div>

                 {/* Advanced Metadata Section */}
                 {(loan.loanPurpose || loan.guarantorName) && (
                   <div className="w-full pt-4 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-zinc-500 font-bold bg-zinc-50/50 p-4 rounded-2xl text-left">
                      {loan.loanPurpose && (
                        <div className="space-y-0.5">
                           <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Purpose & Income</span>
                           <p className="text-zinc-900 font-black">{loan.loanPurpose}</p>
                           <p className="text-[10px] text-zinc-500">{loan.employmentType || 'Unspecified'} • Net {formatCurrency(loan.monthlyIncome || 0)}/mo</p>
                        </div>
                      )}
                      {loan.guarantorName && (
                        <div className="space-y-0.5">
                           <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Co-Member Guarantor</span>
                           <p className="text-zinc-900 font-black">{loan.guarantorName}</p>
                           <p className="text-[10px] text-zinc-500">ID: {loan.guarantorMemberId || 'N/A'} • {loan.guarantorPhone || 'N/A'}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                         <span className="text-[10px] uppercase font-black tracking-wider text-zinc-400">Security Coverage</span>
                         <p className="text-emerald-600 font-black">Qualified by Deposits</p>
                         <p className="text-[10px] text-zinc-400 font-bold leading-none">Guaranteed by co-member signatories</p>
                      </div>
                   </div>
                 )}
              </Card>
            </div>
          ))}

          {loans.filter(l => l.status === 'pending').length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
              <Check className="mx-auto text-emerald-200" size={64} />
              <p className="text-zinc-400 font-medium">All applications processed!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
