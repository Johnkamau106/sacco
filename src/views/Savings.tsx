import React from 'react';
import { Card, Button, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Wallet, TrendingUp, Trophy, PieChart, Info, Landmark, Plus, ChevronRight } from 'lucide-react';

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
         <h2 className="text-2xl font-black text-white tracking-tight">Investments & Wealth</h2>
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
           <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4A017] flex items-center gap-1.5">
             <span>●</span> Maasai Bead Necklace Goal Rings
           </h4>
           
           <Card className="p-6 space-y-6 bg-zinc-950 text-white border border-zinc-800 rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C1272D]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#0F8B6D]/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row items-center gap-6">
                 {/* Beautiful Concentric Maasai Bead Collar SVG */}
                 <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      {/* Gray track guides */}
                      <circle cx="60" cy="60" r="48" fill="transparent" stroke="#222" strokeWidth="2.5" />
                      <circle cx="60" cy="60" r="38" fill="transparent" stroke="#222" strokeWidth="2.5" strokeDasharray="2 2" />
                      <circle cx="60" cy="60" r="28" fill="transparent" stroke="#222" strokeWidth="2.5" />
                      <circle cx="60" cy="60" r="18" fill="transparent" stroke="#222" strokeWidth="2.5" strokeDasharray="3 3" />

                      {/* Outer Ring: Emergency Goal (Red - 75% complete) */}
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="48" 
                        fill="transparent" 
                        stroke="#C1272D" 
                        strokeWidth="3.5" 
                        strokeDasharray={2 * Math.PI * 48}
                        strokeDashoffset={2 * Math.PI * 48 * (1 - 0.75)} 
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                      
                      {/* Gold Ring: Land Acquisition (Gold - 45% complete) */}
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="38" 
                        fill="transparent" 
                        stroke="#D4A017" 
                        strokeWidth="3.5" 
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={2 * Math.PI * 38 * (1 - 0.45)} 
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />

                      {/* Green Ring: Business Capital (Green - 90% complete) */}
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="28" 
                        fill="transparent" 
                        stroke="#0F8B6D" 
                        strokeWidth="3.5" 
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - 0.90)} 
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />

                      {/* Innermost Ring: School Fees (Ivory - 60% complete) */}
                      <circle 
                        cx="60" 
                        cy="60" 
                        r="18" 
                        fill="transparent" 
                        stroke="#F7F2E9" 
                        strokeWidth="2.5" 
                        strokeDasharray={2 * Math.PI * 18}
                        strokeDashoffset={2 * Math.PI * 18 * (1 - 0.60)} 
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>

                    {/* Inner Badge overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                       <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest leading-none">Net Goal</p>
                       <p className="text-xl font-black text-white tracking-tighter mt-0.5">68%</p>
                       <p className="text-[7px] font-black uppercase text-[#0F8B6D] tracking-tight leading-none">Healthy</p>
                    </div>
                 </div>

                 {/* Goal Interactive Legends */}
                 <div className="flex-1 space-y-3.5 w-full">
                    {/* Ring 1 */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                       <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#C1272D]" />
                          <div>
                            <p className="text-[10px] font-black tracking-tight leading-none">Red • Emergency Fund</p>
                            <span className="text-[8px] uppercase font-bold text-zinc-500">Traditional Safety Vault</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-white">75%</p>
                          <p className="text-[7px] font-bold text-zinc-500">KES 45K / 60K</p>
                       </div>
                    </div>

                    {/* Ring 2 */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                       <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017]" />
                          <div>
                            <p className="text-[10px] font-black tracking-tight leading-none">Gold • Land Plot Saving</p>
                            <span className="text-[8px] uppercase font-bold text-zinc-500">Future Safari Inheritance</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-white">45%</p>
                          <p className="text-[7px] font-bold text-zinc-500">KES 135K / 300K</p>
                       </div>
                    </div>

                    {/* Ring 3 */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                       <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0F8B6D]" />
                          <div>
                            <p className="text-[10px] font-black tracking-tight leading-none">Green • Business Capital</p>
                            <span className="text-[8px] uppercase font-bold text-zinc-500">Highlands Asset Expansion</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-white">90%</p>
                          <p className="text-[7px] font-bold text-zinc-500">KES 90K / 100K</p>
                       </div>
                    </div>

                    {/* Ring 4 */}
                    <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                       <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#F7F2E9]" />
                          <div>
                            <p className="text-[10px] font-black tracking-tight leading-none">Ivory • School Fees Pool</p>
                            <span className="text-[8px] uppercase font-bold text-zinc-500">Integrity & Onboarding Fee</span>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-white">60%</p>
                          <p className="text-[7px] font-bold text-zinc-500">KES 30K / 50K</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-850">
                 <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#D4A017] mb-1">Average Yield</p>
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-black text-white tracking-tight">10.5% p.a.</span>
                       <Badge variant="success" className="text-[8px] py-0 bg-emerald-green border-0 text-white">Compound</Badge>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400 mb-1">Total Yield YTD</p>
                    <span className="text-sm font-black text-[#D4A017] tracking-tight">
                       {formatCurrency((profile?.savingsBalance || 0) * 0.052)}
                    </span>
                 </div>
              </div>

              <Button className="w-full bg-[#C1272D] hover:bg-[#8B1B1F] border-none text-white font-black text-xs uppercase h-12 tracking-wider">
                 Recalibrate Necklace Goals
              </Button>
           </Card>

           {/* Shares Capital */}
           <Card className="p-6 border-zinc-800 bg-[#121212] relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-1">Share Capital</p>
                    <h4 className="text-2xl font-black text-white tracking-tight">
                       {(profile?.sharesBalance || 0) / 100} <span className="text-xs text-zinc-400 uppercase font-bold">Units</span>
                    </h4>
                 </div>
                 <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 group-active:scale-90 transition-transform">
                    <Plus size={24} strokeWidth={3} />
                  </div>
              </div>

              <div className="p-4 bg-zinc-900 border border-zinc-805 rounded-2xl flex items-center gap-4">
                 <div className="p-2 bg-brand/10 rounded-xl text-brand">
                    <TrendingUp size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-tighter text-zinc-400">Projected Dividend</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency((profile?.sharesBalance || 0) * 0.12)}</p>
                 </div>
                 <div className="ml-auto">
                    <ChevronRight size={16} className="text-zinc-500" />
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#1b1511] border border-amber-900/10 rounded-[2rem] p-6 flex items-start gap-4 mt-6">
         <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-[#D4A017] shrink-0">
            <Info size={20} />
         </div>
         <div className="space-y-1">
            <h5 className="text-xs font-black uppercase tracking-widest text-[#D4A017]">Governance & Rights</h5>
            <p className="text-[11px] text-zinc-300 font-medium leading-relaxed leading-relaxed">
               As a <span className="font-bold text-white">Shareholder Member</span>, your voting power is equal to every other member regardless of capital. Your dividends remain tax-advantaged as per current regulations.
            </p>
         </div>
      </div>
    </div>
  );
}
