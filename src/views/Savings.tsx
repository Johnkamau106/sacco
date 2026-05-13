import React from 'react';
import { Card, Button, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Wallet, TrendingUp, Trophy, PieChart, Info, Landmark } from 'lucide-react';

export default function Savings() {
  const { profile } = useAuth();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
    }).format(val);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Investments</h2>
         <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
            <PieChart size={20} />
         </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Total Wealth Card */}
        <Card className="bg-zinc-900 border-none text-white p-8 relative overflow-hidden group">
           <div className="relative z-10">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Total Net Equity</p>
              <h3 className="text-4xl font-black tracking-tighter mb-8">
                 {formatCurrency((profile?.savingsBalance || 0) + (profile?.sharesBalance || 0))}
              </h3>
              
              <div className="grid grid-cols-2 gap-8">
                 <div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-tighter mb-1">Savings</p>
                    <p className="text-xl font-bold">{formatCurrency(profile?.savingsBalance || 0)}</p>
                 </div>
                 <div>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-tighter mb-1">Shares</p>
                    <p className="text-xl font-bold">{formatCurrency(profile?.sharesBalance || 0)}</p>
                 </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 p-8">
              <TrendingUp className="text-brand opacity-50" size={40} />
           </div>
        </Card>

        {/* Regular Savings Section */}
        <div className="space-y-4">
           <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Wealth Goals</h4>
           
           <Card className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-brand-light/20 text-brand flex items-center justify-center">
                    <Trophy size={24} />
                 </div>
                 <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                       <p className="font-bold text-zinc-900">Emergency Fund</p>
                       <span className="text-[10px] font-black uppercase text-brand">75% Achieved</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                       <div className="h-full bg-brand w-[75%]" />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-50">
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Interest Rate</p>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-zinc-900 tracking-tight">8.5% p.a.</span>
                       <Badge variant="success" className="text-[8px] py-0">Active</Badge>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Interest YTD</p>
                    <span className="text-sm font-black text-brand tracking-tight">
                       {formatCurrency((profile?.savingsBalance || 0) * 0.04)}
                    </span>
                 </div>
              </div>

              <Button variant="outline" className="w-full border-2 text-zinc-600 font-black h-12">
                 Adjust Goal Targets
              </Button>
           </Card>

           {/* Shares Capital */}
           <Card className="p-6 border-brand/10 bg-brand/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Share Capital</p>
                    <h4 className="text-2xl font-black text-zinc-900 tracking-tight">
                       {(profile?.sharesBalance || 0) / 100} <span className="text-xs text-zinc-400 uppercase font-bold">Units</span>
                    </h4>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 group-active:scale-90 transition-transform">
                    <Plus size={24} strokeWidth={3} />
                 </div>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-sm border border-brand/5 flex items-center gap-4">
                 <div className="p-2 bg-brand/10 rounded-xl text-brand">
                    <TrendingUp size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Projected Dividend</p>
                    <p className="text-sm font-bold text-zinc-900">{formatCurrency((profile?.sharesBalance || 0) * 0.12)}</p>
                 </div>
                 <div className="ml-auto">
                    <ChevronRight size={16} className="text-zinc-200" />
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-zinc-100 rounded-[2rem] p-6 flex items-start gap-4 mt-6">
         <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-zinc-400 shrink-0">
            <Info size={20} />
         </div>
         <div className="space-y-1">
            <h5 className="text-xs font-black uppercase tracking-widest text-zinc-900">Governance & Rights</h5>
            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
               As a <span className="font-bold text-zinc-900">Shareholder Member</span>, your voting power is equal to every other member regardless of capital. Your dividends remain tax-advantaged as per current regulations.
            </p>
         </div>
      </div>
    </div>
  );
}
