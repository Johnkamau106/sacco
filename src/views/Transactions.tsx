import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Download } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Transactions() {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'deposit' | 'withdraw'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const filteredTransactions = transactions.filter(tx => 
    activeTab === 'all' ? true : tx.type === activeTab
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Activity History</h2>
         <div className="p-2 rounded-xl bg-zinc-100/50 text-zinc-400">
            <Filter size={18} />
         </div>
      </div>

      {/* Segmented Filter */}
      <div className="flex p-1 bg-zinc-100 rounded-[1.25rem] w-full">
         {['all', 'deposit', 'withdraw'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "flex-1 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 font-bold"
              )}
            >
              {tab}
            </button>
         ))}
      </div>

      {/* Grouped Transactions List */}
      <div className="space-y-6">
         {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Today</p>
                 <div className="h-[1px] flex-1 bg-zinc-100 ml-4" />
              </div>
              
              <div className="space-y-3">
                 {filteredTransactions.map((tx) => (
                    <div key={tx.id} className="bg-white p-4 rounded-3xl border border-zinc-100/50 app-shadow flex items-center justify-between group active:scale-[0.98] transition-transform">
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center",
                            tx.type === 'deposit' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                          )}>
                            {tx.type === 'deposit' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-zinc-900">{tx.description}</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                              {(tx.timestamp?.toDate() || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className={cn(
                            "font-black text-sm tracking-tight",
                            tx.type === 'deposit' ? "text-emerald-600" : "text-zinc-900"
                          )}>
                            {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount).replace('KES', '').trim()}
                          </p>
                          <p className={cn(
                            "text-[8px] font-black uppercase tracking-widest",
                            tx.status === 'completed' ? "text-emerald-500" : "text-amber-500"
                          )}>
                             {tx.status}
                          </p>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 grayscale opacity-20">
               <History size={64} />
               <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Silence in the Vault</p>
            </div>
         )}
      </div>

      {/* Summary Widget */}
      {filteredTransactions.length > 0 && (
         <Card className="bg-brand p-6 border-none text-white mt-10">
            <div className="flex items-center justify-between mb-4">
               <div>
                  <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Monthly Insight</p>
                  <h4 className="text-lg font-black tracking-tight text-white leading-tight mt-1">Consistency is Key</h4>
               </div>
               <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                  <Download size={20} />
               </div>
            </div>
            <p className="text-xs text-brand-light font-medium leading-relaxed opacity-90">
               You have made <span className="font-bold text-white">{transactions.length} transactions</span> this month. Download your full statement for tax or record purposes.
            </p>
            <Button variant="secondary" className="w-full mt-6 bg-white/10 hover:bg-white/20 text-white border-none py-3 h-auto text-xs active:scale-95">
               Download Transaction Log
            </Button>
         </Card>
      )}
    </div>
  );
}
