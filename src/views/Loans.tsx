import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, updateDoc, doc, increment } from 'firebase/firestore';
import { 
  Landmark, CheckCircle2, Clock, AlertCircle, FileText, ChevronRight, Wallet, 
  User, Briefcase, FileSignature, Coins, ArrowRight, ArrowLeft, Shield, Sparkles, 
  Calendar, TrendingUp, Search, Camera, Check, Lock, X, Info, Phone, ShieldCheck, Fingerprint
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

// Loan options model
interface LoanType {
  id: string;
  name: string;
  rate: number; // interest rate per annum (percentage dec, e.g. 0.10)
  maxAmount: number;
  durationMonths: number;
  speed: string;
  category: string;
  hint: string;
  icon: string;
  bgColor: string;
  accentColor: string;
}

const PREMIUM_LOAN_TYPES: LoanType[] = [
  {
    id: 'emergency',
    name: 'Emergency Instant Loan',
    rate: 0.10,
    maxAmount: 85000,
    durationMonths: 6,
    speed: 'Instant (3 Mins)',
    category: 'Urgent Capital',
    hint: 'No collateral. 100% backed by member deposits balance.',
    icon: '⚡',
    bgColor: 'from-amber-950/40 via-zinc-900 to-zinc-950',
    accentColor: '#C1272D',
  },
  {
    id: 'development',
    name: 'Chama Development Loan',
    rate: 0.12,
    maxAmount: 2000000,
    durationMonths: 36,
    speed: '2 Hours Direct',
    category: 'Wealth Building',
    hint: 'Requires 4 co-signed guarantors. Multipled up to 3x deposits.',
    icon: '🏛️',
    bgColor: 'from-zinc-950 via-zinc-900 to-amber-950/20',
    accentColor: '#D4A017',
  },
  {
    id: 'school_fees',
    name: 'Elimu School Fees Pool',
    rate: 0.11,
    maxAmount: 250000,
    durationMonths: 12,
    speed: '15 Mins Pay',
    category: 'Heir Success',
    hint: 'Approved instantly on school invoice verification ledger.',
    icon: '🎓',
    bgColor: 'from-zinc-950 via-zinc-900 to-emerald-950/20',
    accentColor: '#0F8B6D',
  },
  {
    id: 'salary_advance',
    name: 'Sentry Salary Advance',
    rate: 0.125,
    maxAmount: 100000,
    durationMonths: 3,
    speed: 'Instant Disburse',
    category: 'Payday Buffer',
    hint: 'Requires latest 3-months digital payslip auto-analysis.',
    icon: '💼',
    bgColor: 'from-zinc-950 via-zinc-900 to-blue-950/20',
    accentColor: '#D4A017',
  },
  {
    id: 'business_boost',
    name: 'Sacco Biashara Boost',
    rate: 0.135,
    maxAmount: 1200000,
    durationMonths: 24,
    speed: '1.5 Hours Direct',
    category: 'Operating Stock',
    hint: 'For business scale-ups. Yield optimization analytics.',
    icon: '📈',
    bgColor: 'from-zinc-950 via-zinc-900 to-purple-950/20',
    accentColor: '#C1272D',
  },
  {
    id: 'green_energy',
    name: 'Green Solar Energy Grid',
    rate: 0.085,
    maxAmount: 500000,
    durationMonths: 18,
    speed: '30 Mins Audit',
    category: 'E-Grid Future',
    hint: 'Eco-rate reward. Direct payments to green solar installers.',
    icon: '🌱',
    bgColor: 'from-emerald-950/40 via-zinc-900 to-zinc-950',
    accentColor: '#0F8B6D',
  },
  {
    id: 'agriculture',
    name: 'Shamba Harvest Leverage',
    rate: 0.09,
    maxAmount: 600000,
    durationMonths: 24,
    speed: '45 Mins Audit',
    category: 'Agribusiness',
    hint: 'Finance high-grade seeds, stock, or solar pumping system.',
    icon: '🌾',
    bgColor: 'from-zinc-950 via-zinc-900 to-orange-950/20',
    accentColor: '#D4A017',
  }
];

// Predetermined Guarantor options for high simulation realism
const SIMULATED_SACCO_MEMBERS = [
  { id: '1', name: 'Mary Atieno Juma', memberId: 'SS-2026-9042', limit: 'KES 450,000', power: '98%', avatar: '👩‍💼' },
  { id: '2', name: 'Kevin Mwangi Kamau', memberId: 'SS-2026-1185', limit: 'KES 800,000', power: '95%', avatar: '👨‍💻' },
  { id: '3', name: 'Wanjiku Njoroge Elizabeth', memberId: 'SS-2026-3481', limit: 'KES 350,000', power: '91%', avatar: '👩‍🌾' },
  { id: '4', name: 'Douglas Onyango Odhiambo', memberId: 'SS-2026-7265', limit: 'KES 1,200,000', power: '99%', avatar: '🧔' }
];

export default function Loans() {
  const { user, profile, setProfile } = useAuth();
  const [loans, setLoans] = useState<any[]>([]);
  
  // Custom interactive wizard and navigation states
  const [showForm, setShowForm] = useState(false);
  const [formPhase, setFormPhase] = useState<'discovery' | 'eligibility' | 'calculator' | 'guarantors' | 'documents' | 'rating' | 'review' | 'biometrics' | 'disbursement'>('discovery');
  
  const [activeType, setActiveType] = useState<LoanType>(PREMIUM_LOAN_TYPES[0]);
  const [loading, setLoading] = useState(false);

  // Core Form State Backers
  const [desiredAmount, setDesiredAmount] = useState<number>(30000);
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [incomeInput, setIncomeInput] = useState<string>('85000');
  const [employmentType, setEmploymentType] = useState<string>('Salary (Permanent)');
  const [loanPurpose, setLoanPurpose] = useState<string>('Elimu School Fees');
  
  // Guarantor logic
  const [searchGuarantor, setSearchGuarantor] = useState('');
  const [selectedGuarantors, setSelectedGuarantors] = useState<any[]>([]);
  const [customGuarantorForm, setCustomGuarantorForm] = useState({ name: '', phone: '', memberId: '' });
  const [guaranteeConsentRequesting, setGuaranteeConsentRequesting] = useState<string | null>(null);

  // Document scan studio status
  const [scannedFiles, setScannedFiles] = useState<{ id: string, name: string, status: 'OCR_SCANNED' | 'UPLOADED' }[]>([]);
  const [isOCRProcessing, setIsOCRProcessing] = useState(false);
  const [ocrTextExtracted, setOcrTextExtracted] = useState<string | null>(null);

  // Simulated alerts & custom beep synth engine
  const [smsNotification, setSmsNotification] = useState<string | null>(null);
  const [creditCheckingStats, setCreditCheckingStats] = useState<number>(0);
  const [activeRepayModal, setActiveRepayModal] = useState<any | null>(null);
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayLoading, setRepayLoading] = useState(false);

  // AI interactive speech assistant helper
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [aiChatLogs, setAiChatLogs] = useState<any[]>([
    { role: 'assistant', text: "Habari! I am Sente wisdom, your SACCO Intelligent Underwriter. I can evaluate your credit multiplier parameters, suggest terms, or explain borrowing risk guidelines before submission. What would you like to review today?" }
  ]);
  const [aiCustomInput, setAiCustomInput] = useState('');

  // Audio acoustics synthesis
  const triggerBeepSweep = (startFreq = 440, endFreq = 880, duration = 0.2) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio system barred/safeguarded cleanly
    }
  };

  const triggerSuccesBeepChord = () => {
    triggerBeepSweep(523.25, 1046.50, 0.3); // C5 to C6 sweep
  };

  const triggerThudHaptic = () => {
    triggerBeepSweep(150, 80, 0.1); // Sub-bass haptic sweep
  };

  const triggerDigitalAuthBeep = () => {
    triggerBeepSweep(880, 1760, 0.15); // futuristic digital lock
  };

  // Safe credit capabilities math
  const savingsBalance = profile?.savingsBalance || 0;
  // Multiplier is 3x savings balance (default 15,000 baseline if user balance is zero)
  const maxMultiplierLimit = savingsBalance > 0 ? savingsBalance * 3 : 25000;
  
  // Real-time rates & premium installation splits
  const dynamicInterestRate = activeType?.rate || 0.12;
  const originalPrincipal = desiredAmount;
  const amortizedObligationCost = originalPrincipal * dynamicInterestRate;
  const totalDueAmount = originalPrincipal + amortizedObligationCost;
  const monthlyAmortizedInstallment = durationMonths > 0 ? totalDueAmount / durationMonths : 0;
  const administrativeFee = originalPrincipal * 0.015; // 1.5% processing
  const exciseInsurance = originalPrincipal * 0.005; // 0.5% premium insurance

  useEffect(() => {
    if (!user) return;

    if (user.simulated) {
      const loadSimLoans = () => {
        try {
          const simLoansStr = localStorage.getItem('saccoswift_sim_loans');
          if (simLoansStr) {
            setLoans(JSON.parse(simLoansStr));
          } else {
            // Seed a historical sample so the UI has pre-existing interactive elements
            const seeds = [
              {
                id: 'LN-SIMULATED-SEED',
                amount: 75000,
                durationMonths: 12,
                loanPurpose: 'Agribusiness development tools',
                interestRate: 0.09,
                status: 'approved',
                guarantors: ['Mary Atieno Juma'],
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            ];
            localStorage.setItem('saccoswift_sim_loans', JSON.stringify(seeds));
            setLoans(seeds);
            
            // Adjust balance initially if necessary
            const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
            if (currentProfile && !currentProfile.loanBalance) {
              currentProfile.loanBalance = 81750; // Principal + 9% interest of seed
              localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
              setProfile(currentProfile);
            }
          }
        } catch (e) {
          console.error("Local storage seed reading failed:", e);
        }
      };
      loadSimLoans();
      const interval = setInterval(loadSimLoans, 1500);
      return () => clearInterval(interval);
    }

    const q = query(
      collection(db, 'loans'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setLoans(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  // Handle direct interactive repayment simulation
  const handleSimulateRepay = async (loanItem: any) => {
    const deductAmt = parseFloat(repayAmount);
    if (isNaN(deductAmt) || deductAmt <= 0) {
      alert("Please enter a valid amount to pay back.");
      return;
    }

    if (deductAmt > savingsBalance) {
      alert("Insufficient funds inside Sacco Liquid Savings! Please deposit or top-up first.");
      return;
    }

    setRepayLoading(true);
    triggerThudHaptic();

    setTimeout(async () => {
      try {
        if (user?.simulated) {
          // Adjust local storage profile
          const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
          currentProfile.savingsBalance = Math.max(0, (currentProfile.savingsBalance || 0) - deductAmt);
          currentProfile.loanBalance = Math.max(0, (currentProfile.loanBalance || 0) - deductAmt);
          localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
          setProfile(currentProfile);

          // Append simulated payment transaction log
          const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
          const simTxs = JSON.parse(simTxsStr);
          simTxs.unshift({
            id: `REPAY-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
            userId: user.uid,
            type: 'withdrawal',
            amount: deductAmt,
            description: `Sacco Loan Installment Cleared`,
            timestamp: new Date().toISOString(),
            status: 'completed'
          });
          localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));

          // Modify simulated loan status / metadata
          const simLoansStr = localStorage.getItem('saccoswift_sim_loans') || '[]';
          const simLoans = JSON.parse(simLoansStr);
          const updatedLoans = simLoans.map((l: any) => {
            if (l.id === loanItem.id) {
              const prevPaid = l.amountPaid || 0;
              const newPaid = prevPaid + deductAmt;
              const totalLimitExpected = l.amount * (1 + l.interestRate);
              return {
                ...l,
                amountPaid: newPaid,
                status: newPaid >= totalLimitExpected ? 'repaid_fully' : 'approved'
              };
            }
            return l;
          });
          localStorage.setItem('saccoswift_sim_loans', JSON.stringify(updatedLoans));
          setLoans(updatedLoans);
        } else {
          // Live cloud transaction operations
          await updateDoc(doc(db, 'users', user.uid), {
            savingsBalance: increment(-deductAmt),
            loanBalance: increment(-deductAmt)
          });

          await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            type: 'withdrawal',
            amount: deductAmt,
            description: `Sacco Loan Installment Repayment Cleared`,
            timestamp: serverTimestamp()
          });
        }

        triggerSuccesBeepChord();
        const notificationRef = `RPY${Math.random().toString(36).substring(3, 11).toUpperCase()}`;
        setSmsNotification(
          `SaccoSwift Alert! KES ${deductAmt.toLocaleString()} successfully credited toward your outstanding debt loop. Your new remaining liability is ${formatCurrency(Math.max(0, (profile?.loanBalance || 0) - deductAmt))}. Ref:${notificationRef}.`
        );
        setActiveRepayModal(null);
        setRepayAmount('');
      } catch (e) {
        console.error(e);
      } finally {
        setRepayLoading(false);
      }
    }, 1500);
  };

  // Document scanning simulating camera/OCR extraction
  const handleInitiateScan = (fileName: string) => {
    setIsOCRProcessing(true);
    triggerBeepSweep(200, 1000, 1.2);

    setTimeout(() => {
      setIsOCRProcessing(false);
      triggerDigitalAuthBeep();
      setScannedFiles(prev => [...prev, { id: Date.now().toString(), name: fileName, status: 'OCR_SCANNED' }]);

      // Dynamically extract based on text
      if (fileName.includes("Payslip")) {
        setOcrTextExtracted(`✓ AI OCR Extraction successfully complete.\n• Employer: Safaricom Ltd\n• Basic Salary: KES ${parseFloat(incomeInput).toLocaleString()}\n• Allowances: KES 12,500\n• KRA PIN Status: Valid`);
      } else {
        setOcrTextExtracted(`✓ OCR scanned collateral successfully.\n• National Registry database match verified.\n• Photo match consistency: 99.4%.`);
      }
    }, 3000);
  };

  // Submit and disburse loan final function
  const handleFinalDisburseSubmission = async () => {
    setLoading(true);
    triggerThudHaptic();

    setTimeout(async () => {
      try {
        const uniqueLoanId = `LN${Math.random().toString(36).substring(3, 11).toUpperCase()}`;
        const finalLoanDoc = {
          userId: user?.uid || 'guest',
          amount: originalPrincipal,
          durationMonths: durationMonths,
          interestRate: dynamicInterestRate,
          loanPurpose: activeType.name,
          category: activeType.category,
          guarantors: selectedGuarantors.map(g => g.name),
          createdAt: new Date().toISOString(),
          status: 'approved',
          amountPaid: 0,
        };

        if (user?.simulated) {
          // Adjust state in local storage
          const simLoansStr = localStorage.getItem('saccoswift_sim_loans') || '[]';
          const simLoans = JSON.parse(simLoansStr);
          simLoans.unshift({ id: uniqueLoanId, ...finalLoanDoc });
          localStorage.setItem('saccoswift_sim_loans', JSON.stringify(simLoans));
          setLoans(simLoans);

          // Append simulated transactions
          const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
          const simTxs = JSON.parse(simTxsStr);
          simTxs.unshift({
            id: `TX-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
            userId: user.uid,
            type: 'deposit',
            amount: originalPrincipal,
            description: `Swift Instant Disburse • ${activeType.name}`,
            timestamp: new Date().toISOString(),
            status: 'completed'
          });
          localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));

          // Set client profile numbers
          const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
          currentProfile.savingsBalance = (currentProfile.savingsBalance || 0) + originalPrincipal;
          currentProfile.loanBalance = (currentProfile.loanBalance || 0) + totalDueAmount;
          localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
          setProfile(currentProfile);
        } else if (user) {
          // Live authenticated firestore
          await addDoc(collection(db, 'loans'), finalLoanDoc);
          await updateDoc(doc(db, 'users', user.uid), {
            savingsBalance: increment(originalPrincipal),
            loanBalance: increment(totalDueAmount)
          });
          await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            type: 'deposit',
            amount: originalPrincipal,
            description: `Swift Instant Disburse • ${activeType.name}`,
            timestamp: serverTimestamp()
          });
        }

        // Trigger cinematic sms message overlay
        triggerSuccesBeepChord();
        const refId = `LN${Math.random().toString(36).substring(3, 12).toUpperCase()}`;
        setSmsNotification(
          `M-PESA Confirmed! KES ${originalPrincipal.toLocaleString()} received from SaccoSwift Ledger. Available Savings: ${formatCurrency(savingsBalance + originalPrincipal)}. Rate: ${(dynamicInterestRate*100).toFixed(1)}% p.a. Ref:${refId}`
        );

        // Reset wizard
        setShowForm(false);
        setFormPhase('discovery');
        setSelectedGuarantors([]);
        setScannedFiles([]);
        setOcrTextExtracted(null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 4000);
  };

  // Helper formatting for currency representation
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Instant Sente Wisdom Chat Response Simulate
  const handleSendAiMessage = () => {
    if (!aiCustomInput.trim()) return;
    const clientTxt = aiCustomInput;
    setAiChatLogs(prev => [...prev, { role: 'user', text: clientTxt }]);
    setAiCustomInput('');
    triggerThudHaptic();

    setTimeout(() => {
      let aiResponse = "As Sente Wisdom, let me explain: our criteria prioritize continuous weekly deposits. Based on your current structure, maintaining this habit guarantees an automated loan limit bump in 14 days.";
      
      const promptLower = clientTxt.toLowerCase();
      if (promptLower.includes("limit") || promptLower.includes("how much") || promptLower.includes("multiplier")) {
        aiResponse = "According to Stima Sacco & Equity credit structures, SaccoSwift implements the 3x Multiplier Rule: your total loan limit is exactly 3 times your active savings pool. Currently, with " + formatCurrency(savingsBalance) + " in savings, you highly qualify for up to " + formatCurrency(maxMultiplierLimit) + ".";
      } else if (promptLower.includes("guarantor") || promptLower.includes("co-sign")) {
        aiResponse = "Guarantors serve as secondary safety channels. Under cooperative bylaws, standard development loans require at least 1 Sacco guarantor. If default occurs, co-signers security shares are collateralized. Emergency loans do not require guarantors.";
      } else if (promptLower.includes("interest") || promptLower.includes("rate") || promptLower.includes("fee")) {
        aiResponse = "Sacco loans are extremely sustainable: rates range from 8.5% p.a. (Green solar loans) to 13.5% (Biashara expansion). Monthly repayments include a basic statutory insurance of 0.5% and 1.5% administration processing cost.";
      } else if (promptLower.includes("overborrow") || promptLower.includes("risk")) {
        aiResponse = "Financial intelligence check: We advise that installment payments should never exceed 1/3 of your certified income. This preserves healthy cash flows for standard monthly domestic tasks and continuous investments.";
      }

      setAiChatLogs(prev => [...prev, { role: 'assistant', text: aiResponse }]);
      triggerSuccesBeepChord();
    }, 1000);
  };

  return (
    <div className="space-y-6 pb-24 text-zinc-300">
      
      {/* SMS notification HUD popup */}
      <AnimatePresence>
        {smsNotification && (
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 24, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            className="fixed top-0 left-4 right-4 z-[99999] bg-zinc-950 text-white p-5 border border-zinc-800 rounded-3xl shadow-2xl font-mono text-[11px] leading-relaxed max-w-md mx-auto relative overflow-hidden"
            onClick={() => setSmsNotification(null)}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4A017]/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-2 text-xs border-b border-zinc-800 pb-2 font-sans">
              <span className="font-black text-[#D4A017] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#C1272D] animate-ping" />
                M-PESA INTEL ALERT
              </span>
              <span className="text-[9px] text-zinc-500 font-bold font-mono">2026-05-28</span>
            </div>
            <p className="text-zinc-200 font-medium">{smsNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner - Luxury Maasai / Fintech design styling */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-950 text-white border border-zinc-800 rounded-[2rem] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#C1272D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-[#0F8B6D]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-zinc-900 border-2 border-[#D4A017] rounded-2xl flex items-center justify-center text-[#D4A017] shadow-xl">
            <Landmark size={26} strokeWidth={1.8} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-widest font-black text-[#D4A017]">Credit Facility Level</span>
              <span className="text-[8px] font-black tracking-widest bg-emerald-green px-2 py-0.5 rounded-full uppercase text-white">Verified</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">Sacco Loan Portal</h2>
            <p className="text-[10px] text-zinc-500 font-medium">Bylaw Compliant • Member Multiplier Index: <strong className="text-white">3.0x</strong></p>
          </div>
        </div>

        {/* Dynamic Financial Underwriting Score badge right */}
        <div className="flex items-center gap-4 relative z-10 bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl shrink-0 self-start md:self-auto">
          <div>
            <p className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Credit TrustScore</p>
            <p className="text-base font-black text-white font-mono mt-0.5">780 <span className="text-[#0F8B6D] text-[9px] font-bold">Excellent</span></p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-[#0F8B6D]/10 flex items-center justify-center text-[#0F8B6D]">
            <ShieldCheck size={18} />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* ==============================================
             WIZARD FORM FLOW CONTAINER 
           ============================================== */}
        {showForm ? (
          <motion.div
            key="loan-wizard-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <Card className="bg-zinc-950 text-white border border-zinc-800 p-6 shadow-2xl rounded-[2.5rem] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A017]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C1272D]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Top control and progress track */}
              <div className="flex items-center justify-between border-b border-zinc-850 pb-5 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-ping" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#D4A017]">{activeType.category}</h3>
                  </div>
                  <h4 className="text-sm font-bold text-white mt-1">Application for {activeType.name}</h4>
                </div>
                
                {/* Cancel Trigger */}
                <button
                  onClick={() => {
                    triggerThudHaptic();
                    setShowForm(false);
                    setFormPhase('discovery');
                    setSelectedGuarantors([]);
                  }}
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Progress Bullet Points Tracker */}
              <div className="hidden sm:flex items-center justify-between mb-8 px-2 font-sans overflow-x-auto gap-4">
                {[
                  { key: 'discovery', label: '1. Discovery' },
                  { key: 'eligibility', label: '2. Eligibility' },
                  { key: 'calculator', label: '3. Calculator' },
                  { key: 'guarantors', label: '4. Guarantor' },
                  { key: 'documents', label: '5. Scans' },
                  { key: 'rating', label: '6. Live Risk' },
                  { key: 'review', label: '7. Review' },
                  { key: 'biometrics', label: '8. Biometrics' },
                  { key: 'disbursement', label: '9. Cash In' }
                ].map((ph, index) => {
                  const phases = ['discovery', 'eligibility', 'calculator', 'guarantors', 'documents', 'rating', 'review', 'biometrics', 'disbursement'];
                  const currentIdx = phases.indexOf(formPhase);
                  const thisIdx = index;
                  const isCompleted = thisIdx < currentIdx;
                  const isCurrent = thisIdx === currentIdx;

                  return (
                    <div key={ph.key} className="flex flex-col items-center gap-1.5 flex-1 relative min-w-[70px]">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-300 relative z-10 font-mono",
                        isCurrent ? "bg-[#D4A017] text-black font-black scale-105 shadow-md shadow-[#D4A017]/30" :
                        isCompleted ? "bg-[#0F8B6D] text-white" : "bg-zinc-900 border border-zinc-800 text-zinc-500"
                      )}>
                        {isCompleted ? "✓" : index + 1}
                      </div>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-tight text-center leading-none",
                        isCurrent ? "text-white" : isCompleted ? "text-[#0F8B6D]" : "text-zinc-600"
                      )}>
                        {ph.label.split(' ')[1]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* PHASE 1: DISCOVERY MARKETPLACE */}
              {formPhase === 'discovery' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Premium African Luxury Fintech Marketplace</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PREMIUM_LOAN_TYPES.map((lt) => (
                      <Card
                        key={lt.id}
                        onClick={() => {
                          triggerThudHaptic();
                          setActiveType(lt);
                        }}
                        className={cn(
                          "p-5 text-left border relative overflow-hidden transition-all duration-300 rounded-3xl",
                          activeType.id === lt.id ? "bg-zinc-900 border-[#D4A017] shadow-xl" : "bg-zinc-950 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/30"
                        )}
                      >
                        {/* Background flare based on color accent */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-tr rounded-full opacity-10 blur-xl pointer-events-none" style={{ backgroundColor: lt.accentColor }} />

                        <div className="flex items-start justify-between relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xl">
                              {lt.icon}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-extrabold">{lt.category}</span>
                                <Badge variant="success" className="py-0 text-[8px] leading-none bg-[#0F8B6D]/10 border-0 text-[#0F8B6D]">{lt.speed}</Badge>
                              </div>
                              <h5 className="text-sm font-black text-white tracking-tight mt-0.5">{lt.name}</h5>
                            </div>
                          </div>
                          {activeType.id === lt.id && (
                            <div className="w-5 h-5 rounded-full bg-[#D4A017] flex items-center justify-center text-black">
                              <Check size={11} strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] text-zinc-400 font-semibold mt-3.5 leading-relaxed relative z-10">{lt.hint}</p>

                        <div className="grid grid-cols-3 gap-3 pt-3.5 mt-3.5 border-t border-zinc-900 text-center relative z-10">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block">Annual Rate</span>
                            <span className="text-xs font-black text-[#D4A017] font-mono mt-0.5">{(lt.rate * 100).toFixed(1)}% p.a.</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block">Limit Range</span>
                            <span className="text-[10px] font-black text-white font-mono mt-0.5">{formatCurrency(lt.maxAmount)}</span>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block">Max Term</span>
                            <span className="text-xs font-black text-zinc-300 font-mono mt-0.5">{lt.durationMonths} Mo</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={() => {
                        triggerBeepSweep(500, 700, 0.15);
                        setFormPhase('eligibility');
                        setDesiredAmount(Math.min(activeType.maxAmount, maxMultiplierLimit));
                        setDurationMonths(activeType.durationMonths);
                      }}
                      className="bg-[#C1272D] text-white hover:bg-[#8B1B1F] border-0 h-13 text-[10px] uppercase tracking-wider px-8 font-black"
                    >
                      <span className="flex items-center gap-1.5">
                        Proceed to Intelligent Check
                        <ArrowRight size={14} />
                      </span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* PHASE 2: AI ELIGIBILITY SCANNER */}
              {formPhase === 'eligibility' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6 text-center py-6"
                >
                  <div className="max-w-sm mx-auto space-y-5">
                    
                    {/* Cinematic Progress Scanner */}
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="transparent" stroke="#1c1917" strokeWidth="6" />
                        <motion.circle 
                          cx="60" 
                          cy="60" 
                          r="50" 
                          fill="transparent" 
                          stroke="#D4A017" 
                          strokeWidth="7" 
                          strokeDasharray={2 * Math.PI * 50}
                          initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - 0.92) }}
                          transition={{ duration: 2.5, ease: 'easeOut' }}
                          strokeLinecap="round"
                        />
                      </svg>
                      
                      {/* Geometric Silhouettes inside */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Trust Ratio</span>
                        <motion.span 
                          className="text-4xl font-black text-white tracking-widest font-mono mt-1"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          92%
                        </motion.span>
                        <span className="text-[8px] font-bold text-[#0F8B6D] uppercase tracking-tight mt-0.5">Excellent Standard</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-base font-black text-white uppercase tracking-tight">AI Multiplier Verification</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">Sente intelligence algorithm scanning core ledger database, historic deposits consistency, and debt-burden capacity.</p>
                    </div>

                    {/* Sacco Parameters Report Checklist */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-left space-y-3 font-mono text-[10px]">
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                        <span className="text-zinc-500 font-bold uppercase">Liquid Savings Balance</span>
                        <span className="text-white font-black">{formatCurrency(savingsBalance)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-zinc-850 pb-2">
                        <span className="text-zinc-500 font-bold uppercase">Underwriting Multiplier Limit</span>
                        <span className="text-[#D4A017] font-black">3x Sacco Standard</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-bold uppercase">Qualified Maximum Capacity</span>
                        <span className="text-[#0F8B6D] font-black">{formatCurrency(maxMultiplierLimit)}</span>
                      </div>
                    </div>

                    {savingsBalance === 0 ? (
                      <div className="p-4 border border-zinc-800 bg-amber-950/20 rounded-2xl flex items-start gap-2.5 text-left">
                        <Info className="text-[#D4A017] shrink-0 mt-0.5" size={16} />
                        <div>
                          <p className="text-[9px] font-black uppercase text-amber-500 leading-none mb-1">New Account Guidance</p>
                          <p className="text-[10px] text-zinc-400 font-semibold leading-normal">
                            Your current savings core is KES 0. Sacco Swift awards an initial basic credit cushion of KES 25,000 to enable swift onboarding experience. Increase savings to unlock 3x multiplier power.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-zinc-850 bg-[#0F8B6D]/5 rounded-2xl flex items-start gap-2.5 text-left">
                        <Sparkles className="text-[#0F8B6D] shrink-0 mt-0.5 animate-bounce" size={16} />
                        <div>
                          <p className="text-[9px] font-black uppercase text-[#0F8B6D] leading-none mb-1">Elite Qualification Match</p>
                          <p className="text-[10px] text-zinc-400 font-semibold leading-normal">
                            Excellent! Based on your saving constancy, you are fully authorized to obtain up to <strong className="text-[#D4A017]">{formatCurrency(maxMultiplierLimit)}</strong> without extensive paperwork.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          triggerThudHaptic();
                          setFormPhase('discovery');
                        }}
                        className="flex-1 h-12 text-[10px] uppercase border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black"
                      >
                        Change Loan
                      </Button>
                      <Button
                        onClick={() => {
                          triggerSuccesBeepChord();
                          setFormPhase('calculator');
                        }}
                        className="flex-1 bg-[#C1272D] hover:bg-[#8B1B1F] border-0 h-12 text-[10px] uppercase tracking-wider font-black"
                      >
                        Adjust Calculator
                      </Button>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* PHASE 3: METRIC CALCULATOR */}
              {formPhase === 'calculator' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B6D]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0F8B6D]">Interactive Maasai-Inspired Amortization Chart</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Slide controls panel */}
                    <div className="space-y-5 bg-zinc-900/60 p-5 rounded-[2rem] border border-zinc-850">
                      
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400 font-black uppercase tracking-wider text-[10px]">Principal Limit Amount</span>
                          <span className="text-white font-black text-sm font-mono">{formatCurrency(desiredAmount)}</span>
                        </div>
                        
                        <input 
                          type="range"
                          min="5000"
                          max={Math.min(activeType.maxAmount, maxMultiplierLimit)}
                          step="1000"
                          value={desiredAmount}
                          onChange={(e) => {
                            triggerThudHaptic();
                            setDesiredAmount(Number(e.target.value));
                          }}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4A017]"
                        />
                        
                        <div className="flex justify-between text-[8px] font-extrabold uppercase text-zinc-500 font-mono tracking-widest">
                          <span>Min KES 5,000</span>
                          <span>Max KES {Math.min(activeType.maxAmount, maxMultiplierLimit).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Repayment Period Term</label>
                        <select
                          value={durationMonths}
                          onChange={(e) => {
                            triggerThudHaptic();
                            setDurationMonths(Number(e.target.value));
                          }}
                          className="w-full px-5 py-4 rounded-3xl bg-zinc-950/80 outline-none border border-zinc-800 focus:border-[#D4A017] font-black text-sm text-white tracking-widest transition-all"
                        >
                          <option value="3">3 Months Cycle term</option>
                          <option value="6">6 Months Cycle term</option>
                          <option value="12">12 Months Cycle term</option>
                          <option value="18">18 Months Cycle term</option>
                          <option value="24">24 Months Cycle term</option>
                          {activeType.durationMonths >= 36 && <option value="36">36 Months Extreme Cycle</option>}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Intended Purpose Mode</label>
                        <select
                          value={loanPurpose}
                          onChange={(e) => setLoanPurpose(e.target.value)}
                          className="w-full px-5 py-4 rounded-3xl bg-zinc-950/80 outline-none border border-zinc-800 focus:border-[#D4A017] font-bold text-xs text-white transition-all"
                        >
                          <option value="Elimu Education">School Tuition & Academics Fees</option>
                          <option value="Biashara operating capital">Biashara operating asset capital</option>
                          <option value="Solar home installations">Solar clean panel acquisition</option>
                          <option value="Agriculture fertilizer feeds">Agriculture seeds harvest materials</option>
                          <option value="Safari property deposit">Safari plot land purchase downpayment</option>
                        </select>
                      </div>

                    </div>

                    {/* Breakdown dynamic graph */}
                    <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-[2rem] flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#0F8B6D]/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Live Amortization Valuation</p>
                        
                        <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                          <div className="h-full bg-[#C1272D]" style={{ width: `${(desiredAmount / totalDueAmount) * 100}%` }} />
                          <div className="h-full bg-[#D4A017]" style={{ width: `${(amortizedObligationCost / totalDueAmount) * 100}%` }} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          <div className="border-l-2 border-[#C1272D] pl-2">
                            <span className="text-[8px] font-black text-zinc-500 uppercase block tracking-wider">Base Principal</span>
                            <span className="text-white font-black">{formatCurrency(desiredAmount)}</span>
                          </div>
                          <div className="border-l-2 border-[#D4A017] pl-2">
                            <span className="text-[8px] font-black text-zinc-500 uppercase block tracking-wider">Estimated Interest</span>
                            <span className="text-white font-black">{formatCurrency(amortizedObligationCost)}</span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-3 border-t border-zinc-900 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Excise Underwriting Service Fee</span>
                            <span className="text-zinc-300 font-mono font-bold">{formatCurrency(administrativeFee)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500">Statutory Credit Sinking Insurance</span>
                            <span className="text-zinc-300 font-mono font-bold">{formatCurrency(exciseInsurance)}</span>
                          </div>
                          <div className="h-[1px] bg-zinc-900 my-2" />
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-zinc-400 font-black uppercase text-[10px]">Net Value Cost / Month</span>
                            <span className="text-[#D4A017] font-black text-base font-mono">{formatCurrency(monthlyAmortizedInstallment)}/mo</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            triggerThudHaptic();
                            setFormPhase('eligibility');
                          }}
                          className="flex-1 h-12 text-[10px] uppercase border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black animate-none"
                        >
                          Step Back
                        </Button>
                        <Button
                          onClick={() => {
                            triggerSuccesBeepChord();
                            // Emergency loans do not need guarantor, bypass to scan phase 
                            if (activeType.id === 'emergency') {
                              setFormPhase('documents');
                            } else {
                              setFormPhase('guarantors');
                            }
                          }}
                          className="flex-1 bg-[#C1272D] hover:bg-[#8B1B1F] border-0 h-12 text-[10px] uppercase tracking-wider font-black animate-none"
                        >
                          <span className="flex items-center gap-1.5">
                            {activeType.id === 'emergency' ? "Scan Documents" : "Assign Guarantors"}
                            <ArrowRight size={14} />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE 4: GUARANTOR SELECTION MATRIX */}
              {formPhase === 'guarantors' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">Cooperative Peer Trust Bond Network</p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-850 p-4 rounded-2xl flex items-start gap-3">
                    <Shield className="text-[#D4A017] shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="text-[10px] font-black text-[#D4A017] uppercase tracking-wider">Traditional Cooperative Mandate</p>
                      <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed mt-0.5">
                        Your Development loan requires security co-signers who pledge their excess savings shares count toward your default liability bounds. Please assign co-members.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Selector pool */}
                    <div className="space-y-3.5">
                      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider ml-1">Elite Approved Sacco Circle</p>
                      
                      <div className="space-y-2">
                        {SIMULATED_SACCO_MEMBERS.map((member) => {
                          const isChosen = selectedGuarantors.some(g => g.id === member.id);
                          const isRequesting = guaranteeConsentRequesting === member.id;

                          return (
                            <div 
                              key={member.id}
                              onClick={async () => {
                                if (isChosen) {
                                  triggerThudHaptic();
                                  setSelectedGuarantors(prev => prev.filter(g => g.id !== member.id));
                                } else {
                                  setGuaranteeConsentRequesting(member.id);
                                  triggerBeepSweep(300, 600, 0.4);
                                  // simulate digital co-consent pulse
                                  setTimeout(() => {
                                    triggerSuccesBeepChord();
                                    setSelectedGuarantors(prev => [...prev, member]);
                                    setGuaranteeConsentRequesting(null);
                                  }, 1500);
                                }
                              }}
                              className={cn(
                                "p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between",
                                isChosen ? "bg-zinc-900 border-[#0F8B6D] shadow-sm" : "bg-zinc-950 border-zinc-850/80 hover:bg-zinc-900/40"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-2xl bg-zinc-900 rounded-xl w-10 h-10 flex items-center justify-center border border-zinc-850">
                                  {isRequesting ? (
                                    <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-ping" />
                                  ) : member.avatar}
                                </div>
                                <div className="text-left">
                                  <p className="text-xs font-black text-white">{member.name}</p>
                                  <span className="text-[8px] font-mono font-bold text-zinc-500 mt-0.5 block">{member.memberId} • Power: {member.power}</span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[8px] font-bold text-zinc-500 block uppercase">Guarantee Range</span>
                                <span className="text-[10px] font-black text-[#D4A017] font-mono mt-0.5">{member.limit}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Results Assigned Board */}
                    <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-[2rem] flex flex-col justify-between">
                      <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Designated Co-sign Bond</p>

                        {selectedGuarantors.length === 0 ? (
                          <div className="py-12 text-center text-zinc-500 space-y-2">
                            <span className="text-3xl block filter grayscale opacity-40">🤝</span>
                            <p className="text-[10px] font-black uppercase tracking-wider">No Guarantors Assigned yet</p>
                            <p className="text-[9px] text-zinc-650 px-6 font-semibold">Tapping names on the left triggers digital real-time verification inquiries.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedGuarantors.map(g => (
                              <div key={g.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between text-xs font-mono">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#0F8B6D] text-xs">✓</span>
                                  <span className="text-zinc-200 font-bold">{g.name}</span>
                                </div>
                                <span className="text-[8px] uppercase tracking-widest text-[#0F8B6D] font-black">E-Consent Certified</span>
                              </div>
                            ))}

                            <div className="pt-4 border-t border-zinc-900 mt-2 text-[10px] text-zinc-400 font-semibold space-y-1">
                              <p className="flex justify-between">
                                <span>Co-Sign Safety Secured:</span>
                                <strong className="text-white">100% compliant</strong>
                              </p>
                              <p className="text-[9px] text-[#0F8B6D] italic">"Cooperative trust parameters highly fulfilled."</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            triggerThudHaptic();
                            setFormPhase('calculator');
                          }}
                          className="flex-1 h-12 text-[10px] uppercase border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black animate-none"
                        >
                          Step Back
                        </Button>
                        <Button
                          disabled={selectedGuarantors.length === 0}
                          onClick={() => {
                            triggerSuccesBeepChord();
                            setFormPhase('documents');
                          }}
                          className="flex-1 bg-[#C1272D] hover:bg-[#8B1B1F] border-0 h-12 text-[10px] uppercase tracking-wider font-black animate-none"
                        >
                          <span className="flex items-center gap-1.5">
                            OCR Upload
                            <ArrowRight size={14} />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE 5: DOCUMENT OCR STUDIO */}
              {formPhase === 'documents' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C1272D]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#C1272D]">Automatic AI OCR Document Scanning Node</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Selection drop boxes */}
                    <div className="space-y-4">
                      <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Required Safety Files</p>

                      <div className="space-y-3">
                        {/* Box 1 */}
                        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-left flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-[#D4A017] border border-zinc-800">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">Latest Payslip Extract</p>
                              <span className="text-[9px] text-zinc-500 font-semibold block mt-0.5">Salary confirmation & tax bracket</span>
                            </div>
                          </div>

                          {scannedFiles.some(f => f.name.includes("Payslip")) ? (
                            <span className="text-[#0F8B6D] font-black text-[10px]">✓ EXTRACED</span>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => handleInitiateScan("Safaricom3MoPayslip.pdf")}
                              className="bg-[#D4A017] hover:bg-[#916E10] text-[#121212] py-2 h-8"
                              disabled={isOCRProcessing}
                            >
                              Scan File
                            </Button>
                          )}
                        </div>

                        {/* Box 2 */}
                        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-left flex items-center justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-zinc-950 flex items-center justify-center text-[#D4A017] border border-zinc-800">
                              <Camera size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">National ID Card Front</p>
                              <span className="text-[9px] text-zinc-500 font-semibold block mt-0.5">Biogeoid identification ledger Match</span>
                            </div>
                          </div>

                          {scannedFiles.some(f => f.name.includes("ID")) ? (
                            <span className="text-[#0F8B6D] font-black text-[10px]">✓ SCANNED</span>
                          ) : (
                            <Button 
                              size="sm"
                              onClick={() => handleInitiateScan("NationalID_Front.jpeg")}
                              className="bg-[#D4A017] hover:bg-[#916E10] text-[#121212] py-2 h-8"
                              disabled={isOCRProcessing}
                            >
                              Scan ID
                            </Button>
                          )}
                        </div>

                        {/* Drag and drop sandbox simulator */}
                        <div className="border-2 border-dashed border-zinc-800 bg-zinc-950 p-6 rounded-2xl text-center cursor-pointer hover:bg-zinc-900/20 hover:border-zinc-700 transition-all">
                          <span className="block text-2xl mb-1.5 font-bold text-zinc-650">🖨️</span>
                          <p className="text-zinc-400 font-bold text-[10px] uppercase">Drop custom legal collateral files here</p>
                          <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mt-0.5">PDF, PNG, JPG (Max 10MB)</span>
                        </div>
                      </div>
                    </div>

                    {/* Laser scanning monitor container */}
                    <div className="bg-zinc-950 border border-zinc-850 p-5 rounded-[2rem] flex flex-col justify-between min-h-[300px]">
                      
                      <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">AI Reading Ledger Feed</p>
                        
                        {isOCRProcessing ? (
                          <div className="py-12 text-center space-y-4">
                            {/* Scanning bar effect simulation */}
                            <div className="relative w-full h-24 bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center border border-zinc-800">
                              <motion.div 
                                className="absolute left-0 right-0 h-[3px] bg-[#C1272D] shadow-[0_0_15px_#C1272D] z-10"
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                              />
                              <p className="text-[10px] font-mono tracking-widest text-[#D4A017] font-black uppercase animate-pulse">Running Optical OCR Scans...</p>
                            </div>
                            <p className="text-[9px] text-zinc-400 font-semibold">Resolving digital metadata characters & checking national safety archives.</p>
                          </div>
                        ) : ocrTextExtracted ? (
                          <div className="bg-zinc-900 p-4 border border-zinc-850 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-[#0F8B6D] text-[10px] font-black uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B6D] animate-ping" />
                              <span>EXTRACTED METRIQUES</span>
                            </div>
                            <pre className="text-[10.5px] font-mono text-zinc-300 font-medium whitespace-pre-wrap leading-normal">{ocrTextExtracted}</pre>
                          </div>
                        ) : (
                          <div className="py-16 text-center text-zinc-500 space-y-2">
                             <FileText className="mx-auto block text-zinc-700 animate-pulse" size={32} />
                             <p className="text-[10px] font-black uppercase tracking-wider">No OCR Telemetry Active</p>
                             <p className="text-[9px] text-zinc-600 px-4 font-semibold">Scan payslip or ID on the left to activate instant digital processing.</p>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            triggerThudHaptic();
                            if (activeType.id === 'emergency') {
                              setFormPhase('calculator');
                            } else {
                              setFormPhase('guarantors');
                            }
                          }}
                          className="flex-1 h-12 text-[10px] uppercase border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black animate-none"
                        >
                          Step Back
                        </Button>
                        <Button
                          disabled={scannedFiles.length === 0}
                          onClick={() => {
                            triggerSuccesBeepChord();
                            setFormPhase('rating');
                          }}
                          className="flex-1 bg-[#C1272D] hover:bg-[#8B1B1F] border-0 h-12 text-[10px] uppercase tracking-wider font-black animate-none"
                        >
                          <span className="flex items-center gap-1.5">
                            Check Risk Scale
                            <ArrowRight size={14} />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE 6: AI CREDIT RISK SCALE INTERACTIVE GRAPH */}
              {formPhase === 'rating' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B6D]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0F8B6D]">Sente Cognitive Financial Risk Dashboard</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                    {/* Detailed parameter vectors */}
                    <div className="space-y-5 bg-zinc-900/60 p-5 rounded-[2rem] border border-zinc-850">
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Underwriting Analysis Matrix</p>
                      
                      {/* Metric 1 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold">
                          <span className="text-zinc-400">Monthly Net Income Consistency</span>
                          <span className="text-[#0F8B6D]">94% Compliant</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0F8B6D] w-[94%]" />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold">
                          <span className="text-zinc-400">Savings Rate Continuity Ratio</span>
                          <span className="text-[#0F8B6D]">98% Compliant</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-[#0F8B6D] w-[98%]" />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold">
                          <span className="text-zinc-400">Sacco Bond Guarantee Weight</span>
                          <span className="text-[#D4A017]">89% High Safety</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-[#D4A017] w-[89%]" />
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] uppercase font-mono font-bold">
                          <span className="text-zinc-400">Estimated Debt Burden Index</span>
                          <span className="text-[#C1272D]">75% Medium-Low Leverage</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C1272D] w-[75%]" />
                        </div>
                      </div>
                    </div>

                    {/* AI Decision and actions */}
                    <div className="bg-zinc-950 border border-zinc-800 p-5 rounded-[2rem] flex flex-col justify-between">
                      <div className="space-y-4">
                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">AI Credit Decision Recommendation</p>

                        <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl space-y-2.5">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-[#0F8B6D]">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0F8B6D] opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0F8B6D]" />
                            </span>
                            <span>DECISION: RECOMMEND APPROVAL</span>
                          </div>
                          
                          <p className="text-[10.5px] text-zinc-300 font-medium leading-relaxed">
                            "The applicant demonstrates pristine financial habits. The requested loan amount of <strong className="text-white">{formatCurrency(desiredAmount)}</strong> represents a debt-to-income quotient of less than 33%, meeting conservative capital limits. Co-signers are creditworthy."
                          </p>
                        </div>

                        <div className="text-[10px] text-zinc-500 font-bold flex justify-between uppercase">
                          <span>AI Repayment Advice:</span>
                          <strong className="text-[#D4A017]">Maintain auto-pay schedule</strong>
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <Button
                          variant="outline"
                          onClick={() => {
                            triggerThudHaptic();
                            setFormPhase('documents');
                          }}
                          className="flex-1 h-12 text-[10px] uppercase border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black animate-none"
                        >
                          Step Back
                        </Button>
                        <Button
                          onClick={() => {
                            triggerSuccesBeepChord();
                            setFormPhase('review');
                          }}
                          className="flex-1 bg-[#C1272D] hover:bg-[#8B1B1F] border-0 h-12 text-[10px] uppercase tracking-wider font-black animate-none"
                        >
                          <span className="flex items-center gap-1.5">
                            Verify Summary
                            <ArrowRight size={14} />
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE 7: DETAILED CONTRACT REVIEW SLIP */}
              {formPhase === 'review' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">Pre-disbursement Core Ledger Statement Contract</p>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 space-y-4 relative overflow-hidden text-xs">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A017]/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <h5 className="text-[11px] font-black uppercase text-zinc-500 tracking-wider">Loan Specifications Contract</h5>

                    <div className="grid grid-cols-2 gap-4 border-b border-zinc-850 pb-4 text-xs font-mono">
                      <div>
                        <span className="text-zinc-500 font-bold block uppercase text-[9px] mb-1">Loan Pool Variant</span>
                        <p className="text-white font-black">{activeType.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 font-bold block uppercase text-[9px] mb-1">Annual Interest Appended</span>
                        <p className="text-[#D4A017] font-black">{(dynamicInterestRate*100).toFixed(1)}% Fixed Rate</p>
                      </div>
                    </div>

                    <div className="space-y-2 font-mono">
                      <div className="flex justify-between text-zinc-400">
                        <span>Required Principal</span>
                        <span className="text-white font-bold">{formatCurrency(desiredAmount)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Total Compound Interest</span>
                        <span className="text-white font-bold">{formatCurrency(amortizedObligationCost)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>One-off Administrative Fee (1.5%)</span>
                        <span className="text-zinc-300 font-medium">{formatCurrency(administrativeFee)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-400">
                        <span>Excise Sinking Pool Insurance (0.5%)</span>
                        <span className="text-zinc-300 font-medium">{formatCurrency(exciseInsurance)}</span>
                      </div>
                      <div className="h-[1px] bg-zinc-850 my-2" />
                      <div className="flex justify-between text-sm flex-wrap gap-2">
                        <span className="text-[#D4A017] font-black uppercase tracking-wider text-[10px]">Net Repayment Payable Pool</span>
                        <span className="text-[#D4A017] font-black text-sm">{formatCurrency(totalDueAmount)}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-2 text-[10px] text-zinc-400">
                      <p className="font-extrabold uppercase text-white leading-none">Legal Undertaking Statement</p>
                      <p className="font-medium leading-relaxed">
                        I hereby declare that this electronic application constitutes a binding pledge of my cooperative shares toward resolving this KES {desiredAmount.toLocaleString()} loan obligation. I authorize credit telemetry scans on my identity archives.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        triggerThudHaptic();
                        setFormPhase('rating');
                      }}
                      className="flex-1 h-12 text-[10px] uppercase border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black animate-none"
                    >
                      Step Back
                    </Button>
                    <Button
                      onClick={() => {
                        triggerSuccesBeepChord();
                        setFormPhase('biometrics');
                      }}
                      className="flex-1 bg-[#C1272D] hover:bg-[#8B1B1F] border-0 h-12 text-[10px] uppercase tracking-wider font-black animate-none"
                    >
                      <span className="flex items-center gap-1.5">
                        Verify Biometric PIN
                        <Lock size={14} />
                      </span>
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* PHASE 8: BIOMETRICS SCANNER */}
              {formPhase === 'biometrics' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6 text-center py-6"
                >
                  <div className="max-w-sm mx-auto space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white uppercase tracking-wider">Fingerprint Authorization Protocol</h4>
                      <p className="text-[11px] text-zinc-400">Deploy your finger on the gold concentric sensor pad below to sign this contract ledger.</p>
                    </div>

                    {/* Sensor touch simulation button */}
                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                      {/* Interactive Touch Pad container circles */}
                      <div className="absolute inset-0 bg-stone-900 border border-zinc-850 rounded-full flex items-center justify-center shadow-inner" />
                      
                      <div className="absolute w-32 h-32 bg-[#D4A017]/5 rounded-full blur-md" />
                      
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onMouseDown={() => {
                          triggerThudHaptic();
                        }}
                        onClick={() => {
                          triggerDigitalAuthBeep();
                          setFormPhase('disbursement');
                          // start eligibility ticker count
                          setCreditCheckingStats(1);
                        }}
                        className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-[#D4A017] to-amber-500 flex items-center justify-center text-zinc-950 transition-all duration-300 hover:shadow-2xl shadow-[#D4A017]/20 border border-[#D4A017]"
                      >
                        <Fingerprint size={42} strokeWidth={1.5} />
                      </motion.button>

                      {/* Continuous ripple sweeps */}
                      <span className="absolute w-full h-full border border-[#D4A017]/20 rounded-full animate-ping pointer-events-none" />
                    </div>

                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                      <span>OR AUTHENTICATE WITH SMART KRA SECURE OTP</span>
                    </div>

                    <div className="pt-4 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          triggerThudHaptic();
                          setFormPhase('review');
                        }}
                        className="flex-1 h-12 text-[10px] uppercase border-zinc-800 hover:border-zinc-700 text-zinc-400 font-black animate-none"
                      >
                        Step Back
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PHASE 9: INSTANT DISBUREMENT LEDGER RUNNING */}
              {formPhase === 'disbursement' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6 text-center py-6"
                >
                  <div className="max-w-sm mx-auto space-y-6">
                    
                    <div className="relative w-24 h-24 bg-[#0F8B6D]/5 border-2 border-dashed border-[#0F8B6D]/20 rounded-full flex items-center justify-center mx-auto text-3xl animate-spin">
                      🦁
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-black text-white uppercase tracking-tight">Financing Ledger Synchronizer</h4>
                      <p className="text-[11px] text-zinc-400">Broadcasting cryptographic transaction records directly onto the Equity payment hub & M-Pesa channels.</p>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-850 p-5 rounded-2xl text-left space-y-3 font-mono text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0F8B6D] animate-ping" />
                        <span className="text-white font-extrabold uppercase">Ledger Processing pipeline</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-zinc-500">
                          <span>KRA PIN Validation Status</span>
                          <span className="text-[#0F8B6D] font-black">Passed</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                          <span>Sacco Escrow Clearance</span>
                          <span className="text-[#0F8B6D] font-black">Success</span>
                        </div>
                        <div className="flex justify-between text-zinc-500">
                          <span>M-Pesa Swift Tunnel Socket</span>
                          <span className="text-[#D4A017] font-black">Bound & Transacting</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleFinalDisburseSubmission}
                      disabled={loading}
                      className="w-full bg-[#0F8B6D] hover:bg-[#0A5A47] border-0 h-14 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-[#0F8B6D]/20"
                    >
                      {loading ? (
                        <span className="flex items-center gap-1.5">
                          <span className="animate-spin inline-block w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full" />
                          Crediting Sacco Book Ledger...
                        </span>
                      ) : "Confirm Cash Pay Receipt"}
                    </Button>
                  </div>
                </motion.div>
              )}

            </Card>
          </motion.div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* ==============================================
                 DASHBOARD HOME VIEW (NO FORM ACTIVE)
               ============================================== */}
            {/* Elegant glowing savannah gold active loan card */}
            {loans.some(l => l.status === 'approved') ? (
              <Card className="bg-gradient-to-br from-[#121212] via-[#1a1415] to-[#251012] border border-zinc-800 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 space-y-6">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#C1272D] animate-pulse" />
                      <p className="text-[#D4A017] text-[10px] font-black uppercase tracking-wider">Dynamic Sacco Loan Facility</p>
                    </div>
                    <Badge variant="success" className="bg-[#0F8B6D]/10 text-[#0F8B6D] border-0 text-[8px]">AMORTIZING</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div>
                      <span className="text-zinc-500 font-bold uppercase text-[9px] tracking-widest">Total Sacco Liability Remaining</span>
                      <h3 className="text-3xl font-black text-white tracking-widest font-mono mt-1">
                        {formatCurrency(
                          loans
                            .filter(l => l.status === 'approved')
                            .reduce((acc, curr) => {
                              const totalExpected = curr.amount * (1 + curr.interestRate);
                              const paid = curr.amountPaid || 0;
                              return acc + (totalExpected - paid);
                            }, 0)
                        )}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[8px] uppercase tracking-widest font-black text-[#D4A017] bg-[#D4A017]/10 px-2 py-0.5 rounded-full font-mono">12% fixed</span>
                        <p className="text-zinc-400 text-[10px] font-semibold">Includes excise protective insurance</p>
                      </div>
                    </div>

                    {/* Circular visual progress collar representations */}
                    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-850 p-4 rounded-3xl shrink-0">
                      <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" fill="transparent" stroke="#222" strokeWidth="2.5" />
                          <circle 
                            cx="20" 
                            cy="20" 
                            r="16" 
                            fill="transparent" 
                            stroke="#D4A017" 
                            strokeWidth="3" 
                            strokeDasharray={2 * Math.PI * 16}
                            strokeDashoffset={2 * Math.PI * 16 * (1 - 0.55)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute text-[9px] font-black text-white font-mono">55%</div>
                      </div>

                      <div className="text-left font-sans">
                        <p className="text-[9px] font-black uppercase text-zinc-500 leading-none">Cycles Track</p>
                        <p className="text-xs font-black text-white mt-1">6 / 12 Installments</p>
                        <span className="text-[8px] text-[#0F8B6D] font-bold mt-0.5 block uppercase tracking-wider">Payments status on time</span>
                      </div>
                    </div>

                  </div>

                  {/* Scheduled calendar map installment listings */}
                  <div className="border-t border-zinc-900 pt-5 space-y-3.5">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Scheduled Payment Installments Ledger</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {loans.filter(l => l.status === 'approved').map((loan, lIdx) => {
                        const totalExpected = loan.amount * (1 + loan.interestRate);
                        const paid = loan.amountPaid || 0;
                        const remainder = totalExpected - paid;

                        return (
                          <div key={loan.id || lIdx} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-850/80 flex items-center justify-between text-xs">
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-[#D4A017] border border-zinc-850">
                                <Calendar size={16} />
                              </div>
                              <div className="text-left font-sans">
                                <p className="text-[8px] font-black text-zinc-500 uppercase">Upcoming installment due</p>
                                <p className="font-bold text-white mt-0.5">{loan.loanPurpose || "Biashara Capital Boost"}</p>
                                <span className="text-[9px] font-mono text-zinc-400 font-medium block mt-0.5">Remaining Balance: {formatCurrency(remainder)}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                triggerThudHaptic();
                                setActiveRepayModal(loan);
                                setRepayAmount(Math.min(remainder, 15000).toString());
                              }}
                              className="px-4 py-2 bg-[#C1272D] hover:bg-[#8B1B1F] text-white font-black uppercase text-[9px] tracking-widest rounded-xl"
                            >
                              Repay Part
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Crafted Vector Maasai Shield overlay background */}
                <div className="absolute right-4 top-[50%] -translate-y-1/2 opacity-10 group-hover:opacity-15 transition-opacity duration-300 pointer-events-none select-none max-w-[100px] w-full">
                  <svg viewBox="0 0 100 160" fill="none" className="w-full text-white">
                    <path d="M50 5 C50 5 95 40 95 80 C95 120 50 155 50 155 C50 155 5 120 5 80 C5 40 50 5 50 5 Z" stroke="currentColor" strokeWidth="2.5" />
                    <line x1="50" y1="5" x2="50" y2="155" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                    <circle cx="50" cy="30" r="3" fill="#D4A017" />
                    <circle cx="50" cy="130" r="3" fill="#D4A017" />
                    <circle cx="20" cy="80" r="3.5" fill="#C1272D" />
                    <circle cx="80" cy="80" r="3.5" fill="#C1272D" />
                  </svg>
                </div>
              </Card>
            ) : null}

            {/* List historic applications records */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#D4A017]">Historic Loan Applications</h4>
                <span className="text-[9px] font-black uppercase text-zinc-500 font-mono">Bylaws compliant logs</span>
              </div>

              <div className="space-y-3.5">
                {loans.map((loan, idx) => (
                  <Card key={loan.id || idx} className="p-4 flex flex-col gap-3 bg-zinc-950 border border-zinc-850/80 hover:border-zinc-800 transition-all text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center border",
                          loan.status === 'approved' ? "bg-zinc-900 border-[#0F8B6D] text-[#0F8B6D]" :
                          loan.status === 'repaid_fully' ? "bg-zinc-900 border-zinc-700 text-zinc-400" :
                          "bg-zinc-900 border-[#D4A017] text-[#D4A017]"
                        )}>
                          {loan.status === 'approved' ? <CheckCircle2 size={20} /> :
                           loan.status === 'repaid_fully' ? <CheckCircle2 size={20} /> :
                           <Clock size={20} />}
                        </div>
                        <div>
                          <p className="font-black text-sm text-white font-mono">{formatCurrency(loan.amount)}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                            Term cycle: {loan.durationMonths} Months • Rate: {((loan.interestRate || 0.12)*100).toFixed(1)}% p.a.
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest font-mono",
                          loan.status === 'approved' ? "bg-[#0F8B6D]/10 text-[#0F8B6D]" :
                          loan.status === 'repaid_fully' ? "bg-zinc-900 text-zinc-400" :
                          "bg-[#D4A017]/10 text-[#D4A017]"
                        )}>
                          {loan.status === 'repaid_fully' ? 'REPAID' : loan.status}
                        </span>
                      </div>
                    </div>

                    {(loan.loanPurpose || loan.guarantors) && (
                      <div className="mt-1 pt-3 border-t border-zinc-900 text-[10px] grid grid-cols-2 gap-4 text-zinc-400 font-bold font-mono bg-zinc-900/30 p-3 rounded-2xl">
                        <div>
                          <span className="uppercase text-[8px] text-zinc-600 block">Declared use case purposes</span>
                          <p className="text-zinc-300 font-extrabold mt-0.5">{loan.loanPurpose || "Urgent medical relief"}</p>
                        </div>
                        {loan.guarantors && loan.guarantors.length > 0 && (
                          <div>
                            <span className="uppercase text-[8px] text-zinc-600 block">Co-Sign Sacco Guarantor</span>
                            <p className="text-zinc-300 font-extrabold mt-0.5">{loan.guarantors.join(', ')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}

                {loans.length === 0 && (
                  <div className="py-16 text-center space-y-4 bg-zinc-950 border border-zinc-850 rounded-3xl">
                    <div className="w-20 h-20 bg-zinc-90 w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full mx-auto flex items-center justify-center text-zinc-650">
                      <FileText size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No active balance contracts found</p>
                      <p className="text-[10px] text-zinc-600 font-semibold max-w-xs mx-auto">Tap the primary button below to experience luxurious high speed cooperative lending.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Float visual apply trigger button */}
            <div className="pt-6">
              <Button
                onClick={() => {
                  triggerSuccesBeepChord();
                  setShowForm(true);
                  setFormPhase('discovery');
                }}
                className="w-full h-15 bg-gradient-to-r from-[#C1272D] to-[#D4A017] hover:opacity-90 hover:scale-[1.01] border-0 text-white font-black tracking-widest text-xs uppercase rounded-3xl shadow-xl shadow-[#C1272D]/15"
              >
                Apply for luxurious Loan
              </Button>
            </div>

          </div>
        )}
      </AnimatePresence>

      {/* ==============================================
           REPAYMENT MODAL OVERLAY INTERACTION
         ============================================== */}
      <AnimatePresence>
        {activeRepayModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-[9999] flex items-center justify-center p-6 text-zinc-900">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-6 w-full max-w-sm space-y-5 text-center text-white"
            >
              <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-[#D4A017]">Clear Debt Repayment</h4>
                <button
                  onClick={() => setActiveRepayModal(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1 text-center font-sans">
                <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Estimated Installment Pool Due</p>
                <div className="text-2xl font-black text-white font-mono mt-0.5">
                  {formatCurrency(activeRepayModal.amount * (1 + activeRepayModal.interestRate) - (activeRepayModal.amountPaid || 0))}
                </div>
              </div>

              <div className="space-y-4 text-left font-sans">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Repayment Transact Amount (KES)</label>
                  <input 
                    type="number"
                    value={repayAmount}
                    onChange={(e) => setRepayAmount(e.target.value)}
                    className="w-full px-5 py-4 rounded-3xl bg-zinc-900 border border-zinc-800 outline-none focus:border-[#D4A017] font-mono text-sm tracking-wider font-bold text-white"
                    placeholder="KES 15,000"
                  />
                </div>

                <div className="bg-zinc-900 border border-zinc-850 p-4 rounded-2xl text-[10px] text-zinc-400 font-semibold space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span>Core Liquid Savings:</span>
                    <strong className="text-white">{formatCurrency(savingsBalance)}</strong>
                  </div>
                  <div className="flex justify-between text-[#0F8B6D]">
                    <span>Credit Score Increase:</span>
                    <strong>+25 Points Boost</strong>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSimulateRepay(activeRepayModal)}
                disabled={repayLoading}
                className="w-full bg-[#C1272D] hover:bg-[#8B1B1F] border-0 h-13 text-[10px] uppercase tracking-wider font-extrabold text-white text-center"
              >
                {repayLoading ? (
                  <span className="flex items-center gap-1.5 justify-center">
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Clearing ledger loops...
                  </span>
                ) : "Execute Repayment Pay"}
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==============================================
           FLOATING SENTE WISDOM AI SERVICE
         ============================================== */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {aiAssistantOpen ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-zinc-950 border border-zinc-800 rounded-[2.2rem] shadow-2xl p-4 w-80 md:w-96 text-left space-y-4 mb-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A017]/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-md">🦁</span>
                  <div>
                    <h5 className="text-xs font-black uppercase text-white tracking-widest leading-none">Sente Wisdom</h5>
                    <span className="text-[8px] font-bold text-[#D4A017] uppercase tracking-tight block">AI Underwriter Agent</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    triggerThudHaptic();
                    setAiAssistantOpen(false);
                  }}
                  className="text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Chat bubbles core */}
              <div className="h-56 overflow-y-auto space-y-3 p-1 text-[11px] font-sans pr-2">
                {aiChatLogs.map((log, idx) => (
                  <div key={idx} className={cn(
                    "p-3 rounded-2xl max-w-[85%] leading-relaxed font-semibold",
                    log.role === 'assistant' ? "bg-zinc-900 text-zinc-300 self-start mr-auto border border-zinc-850" : "bg-[#D4A017] text-black font-extrabold self-end ml-auto"
                  )}>
                    {log.text}
                  </div>
                ))}
              </div>

              {/* Input area */}
              <div className="flex items-center gap-2 border-t border-zinc-850 pt-3">
                <input 
                  type="text"
                  value={aiCustomInput}
                  onChange={(e) => setAiCustomInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendAiMessage();
                  }}
                  className="flex-1 bg-zinc-900 border border-zinc-800 text-xs text-white rounded-xl px-3 py-2.5 outline-none focus:border-[#D4A017] font-semibold"
                  placeholder="Ask Sente about limits or guarantor safety..."
                />
                <button
                  onClick={handleSendAiMessage}
                  className="bg-[#D4A017] hover:bg-[#916E10] text-[#121212] px-3.5 py-2.5 rounded-xl text-xs font-black uppercase"
                >
                  Send
                </button>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            triggerSuccesBeepChord();
            setAiAssistantOpen(!aiAssistantOpen);
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#C1272D] to-[#D4A017] focus:outline-none flex items-center justify-center text-white shadow-xl shadow-[#C1272D]/20 border border-[#D4A017]/50 active:scale-95"
        >
          <Sparkles size={24} className="animate-pulse text-white" />
        </motion.button>
      </div>

    </div>
  );
}
