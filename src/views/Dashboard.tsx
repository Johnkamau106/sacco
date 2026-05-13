import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Landmark, ArrowUpRight, ArrowDownLeft, Plus, MessageSquare, TrendingUp, Sparkles, Eye, EyeOff, Bell, ChevronRight, Repeat, Grid, Trophy, Wallet } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const mockChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentTransactions(txs);
    });

    return () => unsubscribe();
  }, [user]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(val);
  };

  const totalBalance = (profile?.savingsBalance || 0) + (profile?.sharesBalance || 0);

  return (
    <div className="space-y-6">
      {/* Header with Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-sm font-medium">Good Morning,</p>
          <h2 className="text-2xl font-black">{profile?.fullName?.split(' ')[0] || 'Member'} 👋</h2>
        </div>
        <div className="relative">
           <div className="w-10 h-10 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 group cursor-pointer active:scale-90 transition-transform">
              <Bell size={20} />
              <div className="absolute top-0 right-0 w-3 h-3 bg-brand rounded-full border-2 border-zinc-50" />
           </div>
        </div>
      </div>

      {/* Main Wealth Card */}
      <Card className="bg-zinc-900 border-none p-6 relative overflow-hidden group">
        <div className="relative z-10 space-y-6">
           <div className="flex items-center justify-between">
              <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Total Account Balance</p>
              <button 
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/40 hover:text-white transition-colors"
              >
                {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
           </div>
           
           <div className="space-y-1">
              <h3 className="text-3xl font-black text-white tracking-tighter">
                {showBalance ? formatCurrency(totalBalance) : "••••••••"}
              </h3>
              <p className="text-brand-light/80 text-[10px] font-black uppercase tracking-tighter">
                Available Balance: {showBalance ? formatCurrency(profile?.savingsBalance || 0) : "••••"}
              </p>
           </div>

           <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                    <TrendingUp size={14} className="text-emerald-400" />
                 </div>
                 <p className="text-white/80 text-[10px] font-bold">Earned KES 1,250.00 this month</p>
              </div>
              <div className="w-10 h-6 bg-white/10 rounded-lg flex items-center justify-center">
                 <ChevronRight size={14} className="text-white/40" />
              </div>
           </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-brand-dark/20 rounded-full blur-3xl opacity-50" />
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: ArrowUpRight, label: 'Deposit', color: 'bg-emerald-50 text-emerald-600' },
          { icon: ArrowDownLeft, label: 'Withdraw', color: 'bg-brand/10 text-brand' },
          { icon: Repeat, label: 'Transfer', color: 'bg-indigo-50 text-indigo-600' },
          { icon: Grid, label: 'More', color: 'bg-zinc-100 text-zinc-500' },
        ].map((action, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-active:scale-90",
              action.color
            )}>
              <action.icon size={20} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Account List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h4 className="font-black text-xs uppercase tracking-widest text-zinc-400">My Accounts</h4>
           <button className="text-brand text-xs font-bold uppercase tracking-tighter">View All</button>
        </div>

        <div className="space-y-3">
          <AccountRow 
            icon={Trophy} 
            label="Share Capital" 
            balance={profile?.sharesBalance || 0} 
            color="text-amber-500" 
            showBalance={showBalance} 
          />
          <AccountRow 
            icon={Wallet} 
            label="Savings Account" 
            balance={profile?.savingsBalance || 0} 
            color="text-emerald-500" 
            showBalance={showBalance} 
          />
          <AccountRow 
            icon={Landmark} 
            label="Loan Balance" 
            balance={profile?.loanBalance || 0} 
            color="text-brand" 
            showBalance={showBalance}
            isLoan
          />
        </div>
      </div>

      {/* AI Insight Chip */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-brand/5 border border-brand/10 p-4 rounded-3xl flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
           <Sparkles size={18} />
        </div>
        <div className="flex-1">
           <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-0.5">SaccoSwift AI</p>
           <p className="text-xs text-zinc-600 font-medium leading-relaxed">
             You've saved <span className="font-bold">15% more</span> this month than usual!
           </p>
        </div>
        <ChevronRight size={16} className="text-zinc-300" />
      </motion.div>
    </div>
  );
}

function AccountRow({ icon: Icon, label, balance, color, showBalance, isLoan }: any) {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
    }).format(val);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-zinc-100/50 rounded-3xl app-shadow active:scale-[0.98] transition-transform">
      <div className="flex items-center gap-4">
        <div className={cn("w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center", color)}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <p className="font-bold text-sm text-zinc-900">{label}</p>
      </div>
      <div className="text-right">
        <p className="font-black text-sm tracking-tight">
          {showBalance ? formatCurrency(balance) : "••••"}
        </p>
        <p className="text-[9px] uppercase font-black text-zinc-300 tracking-tighter">
          {isLoan ? "Total Payable" : "Available Balance"}
        </p>
      </div>
    </div>
  );
}
