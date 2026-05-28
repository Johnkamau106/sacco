import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  ArrowUpRight, ArrowDownLeft, Search, Filter, Download, History, Send, 
  Receipt, Phone, QrCode, User, Landmark, Star, CheckCircle, ChevronRight, Check, X, ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Transactions() {
  const { user, profile } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // High-fidelity Multi-Step Screen Phases
  // 'hub' | 'send_details' | 'pay_bill_menu' | 'pay_bill_details' | 'confirm_transfer' | 'success_receipt' | 'qr_scanner'
  const [screenPhase, setScreenPhase] = useState<'hub' | 'send_details' | 'pay_bill_menu' | 'pay_bill_details' | 'confirm_transfer' | 'success_receipt' | 'qr_scanner'>('hub');
  
  // Form variables
  const [selectedRecipient, setSelectedRecipient] = useState<any>({ name: 'Mary Wanjiku', phone: '0712 345 678', type: 'Sacco Member' });
  const [amount, setAmount] = useState('10000');
  const [note, setNote] = useState('Rent payment');
  const [selectedSourceAccount, setSelectedSourceAccount] = useState('FOSA Account - KES 48,560.00');
  const [biometricMethod, setBiometricMethod] = useState<'pin' | 'fingerprint' | 'faceid'>('fingerprint');
  const [billType, setBillType] = useState({ name: 'KPLC Token', code: '123456789', amount: '1,200', logo: '⚡' });
  const [billAccNo, setBillAccNo] = useState('');
  const [billPayAmount, setBillPayAmount] = useState('');

  // Confetti particles generator
  const [confetti, setConfetti] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    if (user.simulated) {
      const loadSimTxs = () => {
        try {
          const simTxsStr = localStorage.getItem('saccoswift_sim_transactions');
          if (simTxsStr) {
            setHistory(JSON.parse(simTxsStr));
          }
        } catch (e) {
          console.error(e);
        }
      };
      loadSimTxs();
      const interval = setInterval(loadSimTxs, 800);
      return () => clearInterval(interval);
    }

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setHistory(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // Handle Confetti generation for success screen
  useEffect(() => {
    if (screenPhase === 'success_receipt') {
      const particles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * -20,
        size: Math.random() * 8 + 4,
        color: ['#C1272D', '#D4A017', '#0F8B6D', '#FFF'][Math.floor(Math.random() * 4)],
        delay: Math.random() * 2,
        duration: Math.random() * 3 + 2
      }));
      setConfetti(particles);
      playTone(980, 0.4);
    } else {
      setConfetti([]);
    }
  }, [screenPhase]);

  const playTone = (freq = 880, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext || (window as any).AudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio unsupported or blocked
    }
  };

  const executeTransfer = async () => {
    playTone(520, 0.1);
    setTimeout(() => playTone(1040, 0.15), 100);

    const newTx = {
      amount: parseFloat(amount) || 0,
      description: `Sent to ${selectedRecipient.name} (${selectedRecipient.type})`,
      type: 'withdraw',
      status: 'completed',
      timestamp: Date.now()
    };

    if (user && !user.simulated) {
      try {
        await addDoc(collection(db, 'transactions'), {
          ...newTx,
          userId: user.uid,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      // Simulate by adding to local storage
      const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
      const simTxs = JSON.parse(simTxsStr);
      simTxs.unshift({ id: 'sim-' + Date.now(), ...newTx });
      localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));
    }

    setScreenPhase('success_receipt');
  };

  const handleRecentClick = (rec: any) => {
    playTone(740, 0.08);
    setSelectedRecipient(rec);
    setScreenPhase('send_details');
  };

  return (
    <div className="relative min-h-[85vh] bg-[#121212] rounded-[2.5rem] p-6 text-zinc-100 overflow-hidden select-none">
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-[#C1272D]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#D4A017]/80 rounded-full blur-[150px] opacity-10 pointer-events-none" />

      <AnimatePresence mode="wait">
        
        {/* Phase 1: Main Payments View (Matches Screenshot 2) */}
        {screenPhase === 'hub' && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Payments</h2>
                <p className="text-[10px] text-amber-gold uppercase font-black tracking-widest mt-1">SaccoSwift Secure Vault</p>
              </div>
              <Badge variant="success" className="bg-[#0F8B6D]/20 text-[#0F8B6D] py-1">Online</Badge>
            </div>

            {/* Quick Categories Grid (Row 1 Screen 2 Matches Exact Circle Tiles) */}
            <div className="grid grid-cols-4 gap-4 pt-2">
              <div 
                onClick={() => { playTone(650, 0.08); setScreenPhase('send_details'); }}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-[#C1272D]/20 border border-[#C1272D]/40 flex items-center justify-center text-[#C1272D] group-hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(193,39,45,0.15)]">
                  <Send size={22} className="rotate-[-30deg]" />
                </div>
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Send Money</span>
              </div>

              <div 
                onClick={() => { playTone(650, 0.08); setScreenPhase('pay_bill_menu'); }}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-[#D4A017]/20 border border-[#D4A017]/40 flex items-center justify-center text-[#D4A017] group-hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(212,160,23,0.15)]">
                  <Receipt size={22} />
                </div>
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Pay Bill</span>
              </div>

              <div 
                onClick={() => {
                  playTone(650, 0.08);
                  setSelectedRecipient({ name: 'Safaricom Airtime', phone: 'Direct Top-up', type: 'Mobile Carrier' });
                  setScreenPhase('send_details');
                }}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-[#0F8B6D]/20 border border-[#0F8B6D]/40 flex items-center justify-center text-[#0F8B6D] group-hover:scale-105 active:scale-95 transition-all shadow-[0_4px_20px_rgba(15,139,109,0.15)]">
                  <Phone size={22} />
                </div>
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Buy Airtime</span>
              </div>

              <div 
                onClick={() => { playTone(650, 0.08); setScreenPhase('qr_scanner'); }}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-14 h-14 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#D4A017] group-hover:scale-105 active:scale-95 transition-all">
                  <QrCode size={22} />
                </div>
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">QR Pay</span>
              </div>
            </div>

            {/* Send Money To Section (Horizontal Selector) */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-gold">Send Money To</h3>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                <div 
                  onClick={() => {
                    playTone(600, 0.08);
                    setSelectedRecipient({ name: 'Mary Wanjiku', phone: '0712 345 678', type: 'Sacco Member' });
                    setScreenPhase('send_details');
                  }}
                  className="bg-[#16171b]/90 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center text-center justify-center min-w-[90px] h-[105px] hover:border-[#C1272D]/50 transition-all cursor-pointer select-none active:scale-95 shrink-0"
                >
                  <User className="text-[#C1272D] mb-1.5" size={20} />
                  <p className="text-[9px] font-black uppercase tracking-tighter">Sacco Member</p>
                  <p className="text-[7px] font-black bg-[#C1272D]/10 text-[#C1272D] px-1.5 py-0.5 rounded-full mt-1">Instant</p>
                </div>

                <div 
                  onClick={() => {
                    playTone(600, 0.08);
                    setSelectedRecipient({ name: 'Douglas Onyango', phone: 'Equity Bank •••• 4567', type: 'Bank Target' });
                    setScreenPhase('send_details');
                  }}
                  className="bg-[#16171b]/90 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center text-center justify-center min-w-[90px] h-[105px] hover:border-[#D4A017]/50 transition-all cursor-pointer select-none active:scale-95 shrink-0"
                >
                  <Landmark className="text-[#D4A017] mb-1.5" size={20} />
                  <p className="text-[9px] font-black uppercase tracking-tighter">Bank Account</p>
                  <p className="text-[7px] text-zinc-500 font-bold mt-1">1-2 Hours</p>
                </div>

                <div 
                  onClick={() => {
                    playTone(600, 0.08);
                    setSelectedRecipient({ name: 'Alice Mwangi', phone: '0712 345 678', type: 'Mobile Money' });
                    setScreenPhase('send_details');
                  }}
                  className="bg-[#16171b]/90 border border-zinc-800 p-4 rounded-2xl flex flex-col items-center text-center justify-center min-w-[90px] h-[105px] hover:border-[#0F8B6D]/50 transition-all cursor-pointer select-none active:scale-95 shrink-0"
                >
                  <Phone className="text-[#0F8B6D] mb-1.5" size={20} />
                  <p className="text-[9px] font-black uppercase tracking-tighter">Mobile Money</p>
                  <p className="text-[7px] font-black bg-[#0F8B6D]/10 text-[#0F8B6D] px-1.5 py-0.5 rounded-full mt-1">Instant</p>
                </div>

                <div className="bg-[#16171b]/50 border border-zinc-900 p-4 rounded-2xl flex flex-col items-center text-center justify-center min-w-[90px] h-[105px] shrink-0 opacity-40">
                  <Star className="text-zinc-500 mb-1.5" size={20} />
                  <p className="text-[9px] font-bold text-zinc-600">Favorite</p>
                </div>
              </div>
            </div>

            {/* Recent Recipients List (Matches Screen 2 List) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-gold">Recent Recipients</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C1272D] cursor-pointer">See all &rsaquo;</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Mary Wanjiku', phone: '0712 345 678', desc: 'Sacco Member • Instant', fav: true, initial: 'M', avatarBg: 'bg-[#C1272D]/20 text-[#C1272D]' },
                  { name: 'John Kamau', phone: 'Equity Bank •••• 4567', desc: 'Traditional Settlement Block', fav: false, initial: 'J', avatarBg: 'bg-[#D4A017]/20 text-[#D4A017]' },
                  { name: 'Alice Mwangi', phone: '0712 345 678', desc: 'M-Pesa Express Pipeline', fav: true, initial: 'A', avatarBg: 'bg-[#0F8B6D]/20 text-[#0F8B6D]' },
                  { name: 'KPLC Tokens', phone: 'Utility Bill Code 12345', desc: 'Utility Bill • Merchant No', fav: false, initial: '⚡', avatarBg: 'bg-zinc-800 text-zinc-100' },
                ].map((rec, id) => (
                  <div 
                    key={id}
                    onClick={() => handleRecentClick(rec)}
                    className="p-3 bg-[#16171b]/95 border border-zinc-805 rounded-2xl flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm", rec.avatarBg)}>
                        {rec.initial}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white leading-snug">{rec.name}</p>
                        <p className="text-[9px] text-zinc-500 leading-none mt-0.5">{rec.phone}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-[8px] tracking-tight bg-zinc-900 px-2 py-1 rounded text-zinc-400 font-bold uppercase">{rec.desc.split('•')[0]}</span>
                      <ChevronRight size={14} className="text-zinc-650" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Static Bead Divider decoration */}
            <div className="maasai-bead-divider mt-4" />
          </motion.div>
        )}

        {/* Phase 2: Send Money Step 2 (Matches Screenshot 3) */}
        {screenPhase === 'send_details' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setScreenPhase('hub')}
                className="w-8 h-8 rounded-full bg-zinc-900 border-none p-0 text-zinc-400 flex items-center justify-center hover:bg-zinc-800"
              >
                &larr;
              </Button>
              <h2 className="text-lg font-black text-white tracking-tight">Send Money</h2>
            </div>

            {/* Selected Recipient Card Display (Exactly matching Screenshot 3) */}
            <div className="p-4 bg-[#1b1511] border border-amber-900/20 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D4A017] to-[#C1272D] p-0.5 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center text-amber-gold font-black">
                  {selectedRecipient.name[0]}
                </div>
              </div>
              <div>
                <p className="font-black text-white text-sm leading-snug">{selectedRecipient.name}</p>
                <p className="text-[10px] text-zinc-450 leading-none mt-0.5">{selectedRecipient.phone}</p>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#C1272D]/10 text-[#C1272D] font-black uppercase mt-1 inline-block">
                  {selectedRecipient.type || 'Sacco Partner'}
                </span>
              </div>
            </div>

            {/* Amount parameters (Exact layout as Screen 3) */}
            <div className="bg-[#16171b] border border-zinc-900 p-5 rounded-[2rem] space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-amber-gold block mb-1">Enter KES Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-[#C1272D]">KES</span>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-14 bg-zinc-950 border border-zinc-800 focus:border-[#C1272D] rounded-2xl pl-14 pr-4 text-xl font-black text-white outline-none"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-[8px] text-zinc-500 font-bold mt-1 uppercase tracking-tight">Available Balance: KES 48,560.00</p>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-amber-gold block mb-1">Add Note (Optional)</label>
                <input 
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 focus:border-[#C1272D] rounded-2xl px-4 text-xs font-bold text-zinc-100 outline-none"
                  placeholder="e.g. rent, school fees"
                />
              </div>

              {/* Source Account Details Screen 3 */}
              <div>
                <label className="text-[10px] font-black uppercase text-amber-gold block mb-1">Select Source Account</label>
                <select 
                  value={selectedSourceAccount}
                  onChange={(e) => setSelectedSourceAccount(e.target.value)}
                  className="w-full h-12 bg-zinc-950 border border-zinc-800 focus:border-[#C1272D] rounded-2xl px-3 text-xs font-bold text-zinc-100 outline-none"
                >
                  <option>FOSA Account - KES 48,560.00</option>
                  <option>Savings Account - KES 120,000.00</option>
                  <option>E-Wallet Ledger - KES 5,400.00</option>
                </select>
              </div>
            </div>

            <Button 
              onClick={() => { playTone(820, 0.1); setScreenPhase('confirm_transfer'); }}
              className="w-full h-12 text-xs uppercase tracking-widest font-black active:scale-95 transition-transform"
            >
              Continue &rarr;
            </Button>
          </motion.div>
        )}

        {/* Phase 3: Confirm Transfer (Matches Screenshot 4) */}
        {screenPhase === 'confirm_transfer' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-center py-4"
          >
            {/* Top Close */}
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-black uppercase tracking-widest text-amber-gold">Confirm Transfer</span>
              <button onClick={() => setScreenPhase('send_details')} className="text-zinc-500 font-bold">X</button>
            </div>

            {/* Transfer Card Details matches Screen 4 layout */}
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">You are sending</p>
              <h3 className="text-4xl font-black text-white tracking-tighter">KES {parseFloat(amount).toLocaleString()}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">to</p>
              
              <div className="py-2 flex flex-col items-center gap-1">
                <span className="w-12 h-12 rounded-full bg-[#D4A017]/10 text-amber-gold flex items-center justify-center font-black text-lg">
                  {selectedRecipient.name[0]}
                </span>
                <p className="font-bold text-white text-sm">{selectedRecipient.name}</p>
                <p className="text-[10px] text-zinc-500 leading-none">{selectedRecipient.phone}</p>
                <span className="text-[8px] uppercase tracking-wider bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-zinc-400 mt-1 inline-block">Sacco Member</span>
              </div>
            </div>

            {/* Recipient Account Details Summary Table */}
            <div className="bg-[#16171b] border border-zinc-805 p-4 rounded-2xl text-left space-y-2.5">
              <div className="flex justify-between text-[11px] leading-tight">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">From Account</span>
                <span className="text-zinc-100 font-bold truncate max-w-[200px]">{selectedSourceAccount.split(' - ')[0]}</span>
              </div>
              <div className="flex justify-between text-[11px] leading-tight">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Transfer Amount</span>
                <span className="text-zinc-100 font-bold">KES {parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[11px] leading-tight">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Vault Fees</span>
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-[9px]">KES 0.00 • Fee Free</span>
              </div>
              <div className="h-[1px] bg-zinc-800 my-1" />
              <div className="flex justify-between text-[11px] leading-tight">
                <span className="text-zinc-500 font-bold uppercase tracking-widest text-[9px]">Note / Memo</span>
                <span className="text-[#D4A017] font-medium truncate max-w-[150px]">{note || 'Secure Sacco Send'}</span>
              </div>
            </div>

            {/* Biometric Trigger section "Secure with" matches Screen 4 matches icons! */}
            <div className="space-y-4">
              <p className="text-[8px] font-black uppercase text-amber-gold tracking-[0.2em]">Secure Transfer With</p>
              
              <div className="flex justify-center gap-6">
                <button 
                  onClick={() => { playTone(600, 0.08); setBiometricMethod('pin'); }}
                  className={cn(
                    "w-14 h-14 rounded-full flex flex-col items-center justify-center border transition-all active:scale-95",
                    biometricMethod === 'pin' ? "bg-[#C1272D]/20 border-[#C1272D] text-[#C1272D]" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  )}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest">Pin</span>
                </button>

                <button 
                  onClick={() => { playTone(600, 0.08); setBiometricMethod('fingerprint'); }}
                  className={cn(
                    "w-14 h-14 rounded-full flex flex-col items-center justify-center border transition-all active:scale-95",
                    biometricMethod === 'fingerprint' ? "bg-[#C1272D]/20 border-[#C1272D] text-white" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  )}
                >
                  {/* Fingerprint icon representing security */}
                  <span className="text-[10px] font-black uppercase tracking-wider block">Scan</span>
                </button>

                <button 
                  onClick={() => { playTone(600, 0.08); setBiometricMethod('faceid'); }}
                  className={cn(
                    "w-14 h-14 rounded-full flex flex-col items-center justify-center border transition-all active:scale-95",
                    biometricMethod === 'faceid' ? "bg-[#C1272D]/20 border-[#C1272D] text-[#C1272D]" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  )}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest">Face</span>
                </button>
              </div>
            </div>

            {/* Confirm & Send prominent red button matches Screen 4 */}
            <Button 
              onClick={executeTransfer}
              className="w-full h-12 bg-[#C1272D] text-white shadow-xl shadow-[#C1272D]/20 font-black tracking-widest uppercase text-xs hover:bg-[#8B1B1F] active:scale-95 transition-all mt-4"
            >
              Confirm & Send
            </Button>
          </motion.div>
        )}

        {/* Phase 4: Money Sent Successfully (Matches Screenshot 5) */}
        {screenPhase === 'success_receipt' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-6 space-y-6 relative"
          >
            {/* Confetti Animation Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2.5rem]">
              {confetti.map((particle) => (
                <div 
                  key={particle.id}
                  className="absolute rounded-full opacity-75"
                  style={{
                    backgroundColor: particle.color,
                    width: particle.size,
                    height: particle.size,
                    left: `${particle.x}%`,
                    top: `${particle.y}%`,
                    animation: `fall ${particle.duration}s linear infinite`,
                    animationDelay: `${particle.delay}s`
                  }}
                />
              ))}
              <style>{`
                @keyframes fall {
                  0% { transform: translateY(-50px) rotate(0deg); opacity: 0.9; }
                  100% { transform: translateY(400px) rotate(360deg); opacity: 0; }
                }
              `}</style>
            </div>

            {/* Glowing Big Success Circle (Matches Screen 5) */}
            <div className="flex justify-center pt-6">
              <div className="w-20 h-20 rounded-full bg-emerald-950/40 border border-emerald-500/50 flex items-center justify-center text-emerald-400 relative">
                <CheckCircle size={44} />
                <div className="absolute inset-0 bg-emerald-500/15 rounded-full animate-ping pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 z-10 relative">
              <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-extrabold">Money Sent Successfully!</p>
              <h2 className="text-4xl font-black text-white tracking-widest">KES {parseFloat(amount).toLocaleString()}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">to</p>
              <p className="text-sm font-black text-[#D4A017] uppercase tracking-tight leading-snug">{selectedRecipient.name}</p>
              <p className="text-[10px] text-zinc-500">{selectedRecipient.phone}</p>
            </div>

            {/* Receipt Parameters Matches Screen 5 */}
            <div className="bg-[#16171b] border border-zinc-805 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[9px]">Timestamp</span>
                <span className="text-zinc-300 font-medium">Today • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[9px]">Transaction Ref</span>
                <span className="text-[#D4A017] font-black select-all">SS-Ref-7GBH9JKil</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[9px]">Source channel</span>
                <span className="text-zinc-300 font-medium">{selectedSourceAccount.split(' - ')[0]}</span>
              </div>
            </div>

            {/* Actions for receipts */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button onClick={() => playTone(500, 0.1)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center gap-1 hover:border-[#C1272D] transition-colors">
                <Star size={16} className="text-amber-500" />
                <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-400">Save Favorite</span>
              </button>
              <button onClick={() => { playTone(500, 0.1); alert("Receipt simulated PDF generated. Sharing block initiated."); }} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center gap-1 hover:border-[#C1272D] transition-colors">
                <Star size={16} className="text-emerald-500" />
                <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-400">Download</span>
              </button>
              <button onClick={() => playTone(500, 0.1)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col items-center gap-1 hover:border-[#C1272D] transition-colors">
                <Star size={16} className="text-[#D4A017]" />
                <span className="text-[8px] uppercase tracking-wider font-bold text-zinc-400">Share Receipt</span>
              </button>
            </div>

            <Button 
               onClick={() => setScreenPhase('hub')}
               className="w-full h-12 text-xs font-black uppercase tracking-widest mt-6"
            >
               Back to Home
            </Button>
          </motion.div>
        )}

        {/* Phase 5: Pay Bill Grid Categories (Matches Screenshot 6) */}
        {screenPhase === 'pay_bill_menu' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setScreenPhase('hub')}
                className="w-8 h-8 rounded-full bg-zinc-900 border-none p-0 text-zinc-400 flex items-center justify-center"
              >
                &larr;
              </Button>
              <h2 className="text-lg font-black text-white tracking-tight">Pay Bill</h2>
            </div>

            {/* Utility Grid Categories Matches Screen 6 Exactly! */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              {[
                { name: 'Electricity', icon: '⚡', logo: 'bg-amber-950/20 text-yellow-500 border border-yellow-800/30' },
                { name: 'Water', icon: '💧', logo: 'bg-blue-950/20 text-blue-500 border border-blue-800/30' },
                { name: 'Internet', icon: '🌐', logo: 'bg-emerald-950/20 text-emerald-500 border border-emerald-800/30' },
                { name: 'TV', icon: '📺', logo: 'bg-rose-950/20 text-rose-500 border border-rose-800/30' },
                { name: 'School Fees', icon: '🎓', logo: 'bg-indigo-950/20 text-indigo-500 border border-indigo-800/30' },
                { name: 'Government', icon: '🏛️', logo: 'bg-zinc-800 text-amber-500 border border-zinc-700' },
                { name: 'Insurance', icon: '🛡️', logo: 'bg-cyan-950/20 text-cyan-400 border border-cyan-800/30' },
                { name: 'More Categories', icon: '⚙️', logo: 'bg-zinc-900 border border-zinc-850 text-zinc-500' }
              ].map((bill, index) => (
                <div 
                  key={index}
                  onClick={() => {
                    playTone(600, 0.08);
                    setBillType({ name: bill.name, code: '213894', amount: '1,500', logo: bill.icon });
                    setScreenPhase('pay_bill_details');
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer text-center group"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-lg active:scale-95 group-hover:scale-105 transition-all", bill.logo)}>
                     {bill.icon}
                  </div>
                  <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider xs:scale-90">{bill.name}</span>
                </div>
              ))}
            </div>

            {/* Recent Bills Sections matching Screen 6 */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-gold">Recent Bills</h3>
              
              <div className="space-y-2.5">
                {[
                  { name: 'KPLC Token', billRef: '0123456789', amount: 'KES 1,200', icon: '⚡', color: 'bg-amber-950/20 border-yellow-800/30 text-yellow-500' },
                  { name: 'Nairobi Water', billRef: '123456', amount: 'KES 650', icon: '💧', color: 'bg-blue-950/20 border-blue-800/30 text-blue-500' },
                  { name: 'Safaricom Home Fiber', billRef: '1234556789', amount: 'KES 2,999', icon: '🌐', color: 'bg-emerald-950/20 border-emerald-800/30 text-emerald-500' }
                ].map((recent, rId) => (
                  <div 
                    key={rId}
                    onClick={() => {
                      playTone(600, 0.08);
                      setBillType({ name: recent.name, code: recent.billRef, amount: recent.amount.replace('KES', '').trim(), logo: recent.icon });
                      setScreenPhase('pay_bill_details');
                    }}
                    className="p-3.5 bg-[#16171b] border border-zinc-900 rounded-2xl flex items-center justify-between cursor-pointer hover:border-zinc-800 transition-all select-none"
                  >
                     <div className="flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold", recent.color)}>
                          {recent.icon}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white leading-tight">{recent.name}</p>
                          <p className="text-[9px] text-zinc-500 leading-none mt-0.5">{recent.billRef}</p>
                        </div>
                     </div>
                     <span className="text-xs font-black text-[#D4A017]">{recent.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Phase 6: Pay Bill Details wizard */}
        {screenPhase === 'pay_bill_details' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="sm" onClick={() => setScreenPhase('pay_bill_menu')} className="w-8 h-8 rounded-full bg-zinc-900 font-bold">&larr;</Button>
               <h2 className="text-lg font-black text-white tracking-tight">Pay {billType.name}</h2>
            </div>

            <div className="p-4 bg-[#1b1511] border border-amber-950/20 rounded-2xl flex items-center gap-3">
               <span className="w-10 h-10 rounded-full bg-[#D4A017]/10 flex items-center justify-center text-amber-gold">{billType.logo}</span>
               <div>
                  <p className="font-bold text-xs text-white uppercase">{billType.name} Bill Pay</p>
                  <p className="text-[10px] text-zinc-500">Fast digital clearance ledger</p>
               </div>
            </div>

            <div className="bg-[#16171b] p-5 border border-zinc-900 rounded-[2rem] space-y-4">
               <div>
                  <label className="text-[10px] font-black uppercase text-[#D4A017] block mb-1">Account No / Reference</label>
                  <input 
                    type="text" 
                    value={billAccNo} 
                    onChange={(e) => setBillAccNo(e.target.value)}
                    className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 text-xs font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
                    placeholder="e.g. 0123456789"
                  />
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase text-[#D4A017] block mb-1">Payment Amount (KES)</label>
                  <input 
                    type="text" 
                    value={billPayAmount} 
                    onChange={(e) => setBillPayAmount(e.target.value)}
                    className="w-full h-12 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 text-xs font-bold text-zinc-100 placeholder:text-zinc-700 outline-none"
                    placeholder="e.g. 1500"
                  />
               </div>
            </div>

            <Button 
               onClick={() => {
                 setSelectedRecipient({ name: billType.name, phone: billAccNo || 'Utility Merchant', type: 'Merchant Pay' });
                 setAmount(billPayAmount || '1500');
                 setNote(`${billType.name} Settlement payment`);
                 setScreenPhase('confirm_transfer');
               }}
               className="w-full h-12 text-xs uppercase font-black"
            >
               Continue &rsaquo;
            </Button>
          </motion.div>
        )}

        {/* Phase 7: QR Pay simulation scanner */}
        {screenPhase === 'qr_scanner' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 text-center py-4"
          >
            <div className="flex justify-between items-center px-1">
               <span className="text-xs font-black uppercase text-amber-gold tracking-widest">Maasai QR Terminal</span>
               <button onClick={() => setScreenPhase('hub')} className="text-zinc-500 font-bold">X</button>
            </div>

            <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden flex items-center justify-center p-4">
               {/* Simulating Camera Feed */}
               <div className="absolute inset-4 border-2 border-dashed border-[#C1272D]/50 rounded-2xl animate-pulse" />
               <div className="w-1/2 aspect-square border-2 border-[#D4A017] flex items-center justify-center text-[#D4A017] rounded-xl relative">
                  <QrCode size={64} className="opacity-90" />
                  {/* Laser Scanning Line */}
                  <div className="absolute left-0 right-0 h-1 bg-[#C1272D] shadow-[0_0_10px_#C1272D] animate-[scan_2s_infinite]" />
               </div>
               
               <style>{`
                 @keyframes scan {
                   0%, 100% { top: 10%; }
                   50% { top: 90%; }
                 }
               `}</style>
               
               <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-2 rounded-xl text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                  Align QR within secure guides
               </div>
            </div>

            <p className="text-xs text-zinc-550 leading-relaxed max-w-sm mx-auto">
               Instantly scan and settle payments to over 5,000 Till and Paybill merchants inside Nairobi and across Kenya.
            </p>

            <Button 
               onClick={() => {
                 playTone(850, 0.15);
                 setSelectedRecipient({ name: 'Naivas Supermarket', phone: 'Till No: 889125', type: 'Merchant' });
                 setAmount('3450');
                 setNote('Grocery Settlement');
                 setScreenPhase('confirm_transfer');
               }}
               className="w-full h-11 text-[10px] bg-zinc-900 hover:bg-zinc-800 border-none uppercase tracking-widest"
            >
               Simulate QR Scan Success
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
