import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Landmark, CheckCircle2, Clock, AlertCircle, FileText, ChevronRight, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Loans() {
  const { user, profile } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('12');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'loans'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setLoans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'loans'), {
        userId: user.uid,
        amount: parseFloat(amount),
        durationMonths: parseInt(duration),
        status: 'pending',
        interestRate: 0.12,
        createdAt: serverTimestamp(),
        guarantors: [],
        documents: [],
      });
      setAmount('');
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
    }).format(val);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-zinc-900 tracking-tight">My Loans</h2>
         <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
            <Landmark size={20} />
         </div>
      </div>

      <AnimatePresence>
        {showForm ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-brand/20 bg-brand/5">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black text-brand tracking-tight">Loan Application</h3>
                 <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600">
                    <AlertCircle size={20} />
                 </button>
              </div>

              <form onSubmit={handleApply} className="space-y-6">
                 <div className="space-y-4">
                    <Input 
                      label="Desired Amount (KES)" 
                      placeholder="e.g. 50,000"
                      icon={Wallet}
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-zinc-500 ml-1">Repayment Period</label>
                      <select 
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-5 py-4 rounded-2xl bg-white border-0 outline-none focus:ring-2 focus:ring-brand/20 font-medium"
                      >
                        <option value="6">6 Months Term</option>
                        <option value="12">12 Months Term</option>
                        <option value="24">24 Months Term</option>
                        <option value="36">36 Months Term</option>
                      </select>
                    </div>
                 </div>

                 <div className="bg-white p-5 rounded-[1.5rem] border border-brand/5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-zinc-400 font-bold uppercase tracking-widest">Interest Rate</span>
                       <span className="text-brand font-black">12% p.a.</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Calculated Repayment</span>
                       <span className="text-lg font-black text-brand">
                          {formatCurrency(amount ? (parseFloat(amount) * 1.12) / parseInt(duration) : 0)}/mo
                       </span>
                    </div>
                 </div>

                 <Button className="w-full h-16 shadow-xl shadow-brand/20" type="submit" disabled={loading}>
                    {loading ? "Processing..." : "Confirm & Apply Now"}
                 </Button>
              </form>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-4">
             {/* Dynamic Highlight Card (Only if user has an active loan) */}
             {loans.some(l => l.status === 'approved') ? (
               <Card className="bg-brand text-white p-6 border-none relative overflow-hidden group">
                  <div className="relative z-10 space-y-6">
                     <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Outstanding Loan</p>
                     <h3 className="text-3xl font-black tracking-tighter">
                        {formatCurrency(loans.filter(l => l.status === 'approved').reduce((acc, curr) => acc + (curr.amount * 1.12), 0))}
                     </h3>
                     <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                           <span className="text-white/60">Repayment Progress</span>
                           <span className="text-white">72% Completed</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                           <div className="h-full bg-white w-[72%]" />
                        </div>
                     </div>
                  </div>
                  <div className="absolute -right-8 -bottom-8 opacity-10 transform -rotate-12">
                     <Landmark size={180} />
                  </div>
               </Card>
             ) : null}

             <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Loan Status</h4>
                </div>

                {loans.map((loan) => (
                   <Card key={loan.id} className="p-4 flex items-center justify-between group active:scale-[0.98]">
                      <div className="flex items-center gap-4">
                         <div className={cn(
                           "w-11 h-11 rounded-2xl flex items-center justify-center",
                           loan.status === 'approved' ? "bg-emerald-50 text-emerald-500" :
                           loan.status === 'rejected' ? "bg-brand/10 text-brand" : "bg-amber-50 text-amber-500"
                         )}>
                            {loan.status === 'approved' ? <CheckCircle2 size={20} /> : 
                             loan.status === 'rejected' ? <AlertCircle size={20} /> : <Clock size={20} />}
                         </div>
                         <div>
                            <p className="font-bold text-sm text-zinc-900">{formatCurrency(loan.amount)}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                               Repayment: {loan.durationMonths} Months
                            </p>
                         </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                         <div>
                            <Badge variant={loan.status === 'approved' ? 'success' : loan.status === 'rejected' ? 'error' : 'warning'}>
                               {loan.status}
                            </Badge>
                         </div>
                         <ChevronRight size={18} className="text-zinc-200 group-hover:text-brand transition-colors" />
                      </div>
                   </Card>
                ))}

                {loans.length === 0 && (
                   <div className="py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-zinc-50 rounded-full mx-auto flex items-center justify-center text-zinc-200">
                         <FileText size={40} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest text-zinc-300">Clean Slate</p>
                   </div>
                )}
             </div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Action Button (Native App Style) */}
      {!showForm && (
        <div className="fixed bottom-24 left-0 right-0 px-6 z-40 md:static md:px-0 md:mt-10">
           <Button 
             onClick={() => setShowForm(true)} 
             className="w-full h-16 text-lg shadow-2xl shadow-brand/30 ring-4 ring-white"
           >
              Apply for a Loan
           </Button>
        </div>
      )}
    </div>
  );
}
