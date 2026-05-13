import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { ShieldCheck, User, Landmark, Check, X, Search, FileBarChart } from 'lucide-react';
import { cn } from '../lib/utils';

export default function AdminPanel() {
  const { user } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen for ALL loans
    const loanQuery = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
    const unsubLoans = onSnapshot(loanQuery, (snapshot) => {
      setLoans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Fetch stats (simplified for demo)
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
  }, []);

  const handleLoanAction = async (loanId: string, userId: string, amount: number, action: 'approved' | 'rejected') => {
    setLoading(loanId);
    try {
      // 1. Update loan doc
      const loanRef = doc(db, 'loans', loanId);
      await updateDoc(loanRef, { status: action });

      if (action === 'approved') {
        // 2. Update user loan balance
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          await updateDoc(userRef, {
             loanBalance: increment(amount)
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
              <Card className="flex flex-col md:flex-row items-center gap-6 animate-in fade-in duration-500">
                 <div className="flex-1 flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                      <User className="text-zinc-400" />
                    </div>
                    <div>
                      <p className="font-bold text-lg">{formatCurrency(loan.amount)}</p>
                      <p className="text-xs text-zinc-400">Term: {loan.durationMonths} Months • Interest: 12%</p>
                      <p className="text-[10px] text-zinc-300 mt-1 uppercase font-black">Member ID: {loan.userId.substring(0, 8)}...</p>
                    </div>
                 </div>

                 <div className="flex gap-3">
                    <Button 
                      variant="danger" 
                      className="px-6 py-2"
                      onClick={() => handleLoanAction(loan.id, loan.userId, loan.amount, 'rejected')}
                      disabled={loading === loan.id}
                    >
                      <X size={18} />
                    </Button>
                    <Button 
                      variant="primary" 
                      className="px-6 py-2"
                      onClick={() => handleLoanAction(loan.id, loan.userId, loan.amount, 'approved')}
                      disabled={loading === loan.id}
                    >
                      <div className="flex items-center gap-2">
                          <Check size={18} />
                          <span>Approve</span>
                      </div>
                    </Button>
                 </div>
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
