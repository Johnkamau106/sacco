import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { Landmark, ArrowUpRight, ArrowDownLeft, Plus, MessageSquare, TrendingUp, Sparkles, Eye, EyeOff, Bell, ChevronRight, Repeat, Grid, Trophy, Wallet, ShieldAlert } from 'lucide-react';
import { collection, query, where, orderBy, limit, onSnapshot, doc, setDoc, addDoc, serverTimestamp, updateDoc, increment, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getFinancialAdvice } from '../services/aiService';

const mockChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
];

export default function Dashboard() {
  const { profile, user, isAdmin, setProfile } = useAuth();
  const navigate = useNavigate();
  const [showBalance, setShowBalance] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState("Analyzing your financial health...");
  const [isInitializingAdmin, setIsInitializingAdmin] = useState(false);

  // Conversational AI Assistant Drawer States
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([
    { sender: 'ai', text: "Habari gani! I am your SaccoSwift Co-operative Advisor. I can analyze your savings behavior, predict loan eligibility, explain payments, or help draft a personal budget. How can I empower you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // States for Quick Actions
  const [showTxModal, setShowTxModal] = useState<'deposit' | 'withdraw' | 'transfer' | null>(null);
  const [txAmount, setTxAmount] = useState('');
  const [txDesc, setTxDesc] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [loading, setLoading] = useState(false);

  // More Actions Sub-modal State
  const [showMoreModal, setShowMoreModal] = useState(false);
  const [moreActionType, setMoreActionType] = useState<'menu' | 'buy_airtime' | 'pay_bill' | 'chama' | 'guarantor_request' | null>(null);
  const [utilityBillType, setUtilityBillType] = useState<'kplc' | 'water' | 'dstv'>('kplc');
  const [billNum, setBillNum] = useState('');
  const [airtimeCarrier, setAirtimeCarrier] = useState<'safaricom' | 'airtel' | 'telkom'>('safaricom');
  const [chamaName, setChamaName] = useState('Sacco Alpha Chama');

  // Kenyan Banking & Mobile Money Interactive Integration
  const [txMethod, setTxMethod] = useState<'mpesa' | 'bank' | 'agent' | 'sacco'>('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBank, setSelectedBank] = useState('Equity Bank');
  const [bankAccount, setBankAccount] = useState('');
  const [resolvingName, setResolvingName] = useState(false);
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  
  // M-Pesa STK Push Simulation States
  const [stkPushState, setStkPushState] = useState<'idle' | 'sending' | 'pin-prompt' | 'processing' | 'success'>('idle');
  const [mpesaPin, setMpesaPin] = useState('');
  const [smsNotification, setSmsNotification] = useState<string | null>(null);

  // Auto-set phone number when profile loads
  useEffect(() => {
    if (profile?.phoneNumber) {
      setPhoneNumber(profile.phoneNumber);
    }
  }, [profile]);

  useEffect(() => {
    const handleOpenAi = () => {
      setShowAiChat(true);
    };
    window.addEventListener('open-sente-ai', handleOpenAi);
    return () => window.removeEventListener('open-sente-ai', handleOpenAi);
  }, []);

  // Audio tone synthesizer for classic M-Pesa and Sim Alert sounds
  const playBeep = (freq = 880, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext || (window as any).AudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio blocked or unsupported
    }
  };

  // Live validation name query resolver
  const resolveTargetName = async () => {
    if (!user) return;
    setResolvingName(true);
    setResolvedName(null);
    playBeep(600, 0.08);

    try {
      if (txMethod === 'sacco' && recipientId.trim()) {
        if (user.simulated) {
          setTimeout(() => {
            const memberId = recipientId.trim().toUpperCase();
            if (memberId.startsWith('SS-')) {
              setResolvedName("Kenya Sacco Colleague (" + memberId + ")");
              setRecipientName("Sacco Colleague");
              playBeep(980, 0.15);
            } else {
              setResolvedName("Account Not Found");
              setRecipientName("");
              playBeep(330, 0.2);
            }
            setResolvingName(false);
          }, 600);
          return;
        }

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('memberNumber', '==', recipientId.trim().toUpperCase()));
        const s = await getDocs(q);
        if (!s.empty) {
          const data = s.docs[0].data();
          setResolvedName(data.fullName);
          setRecipientName(data.fullName);
          playBeep(980, 0.15);
        } else {
          setResolvedName("Account Not Found");
          setRecipientName("");
          playBeep(330, 0.2);
        }
      } else if (txMethod === 'mpesa' && phoneNumber.trim()) {
        setTimeout(() => {
          const sampleNames = ["Mary Wanjiku Kamau", "David Kiprop Cheruiyot", "Lucy Mukami Gichuki", "Evans Ondieki Omwamba", "Grace Anyango Otieno"];
          const num = parseInt(phoneNumber.slice(-2)) || 0;
          const name = sampleNames[num % sampleNames.length];
          setResolvedName(name);
          setRecipientName(name);
          playBeep(980, 0.15);
          setResolvingName(false);
        }, 800);
        return;
      } else if (txMethod === 'bank' && bankAccount.trim()) {
        setTimeout(() => {
          const sampleHolders = ["Equity Merchant Account", "Payless Safaricom Agent", "Naivas Supermarket Ltd", "Mary Wambui (Checking)"];
          const num = parseInt(bankAccount.slice(-2)) || 0;
          const name = sampleHolders[num % sampleHolders.length];
          setResolvedName(name);
          setRecipientName(name);
          playBeep(980, 0.15);
          setResolvingName(false);
        }, 800);
        return;
      } else {
        setResolvedName("Please specify details first.");
      }
    } catch (err) {
      console.error(err);
      setResolvedName("Resolution failed");
    } finally {
      if (txMethod === 'sacco') {
        setResolvingName(false);
      }
    }
  };

  useEffect(() => {
    if (!user || !profile) return;

    const fetchAdvice = async () => {
      const advice = await getFinancialAdvice(profile, "Give me a quick 1-sentence tip on my current financial status.");
      setAiInsight(advice);
    };

    fetchAdvice();
  }, [user, profile]);

  const sendMessageToAI = async (customQuery?: string) => {
    const textToSend = (customQuery || chatInput).trim();
    if (!textToSend) return;
    
    // Create new conversation state
    const currentMsgs = [...chatMessages, { sender: 'user', text: textToSend }];
    setChatMessages(currentMsgs);
    setChatInput("");
    setChatLoading(true);
    playBeep(450, 0.08);

    try {
      const response = await getFinancialAdvice(profile, textToSend);
      setChatMessages(prev => [...prev, { sender: 'ai', text: response }]);
      playBeep(980, 0.15);
    } catch (e) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: "I ran into an issue communicating with SaccoSwift secure server." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleInitializeAdmin = async () => {
    if (!user) return;
    setIsInitializingAdmin(true);
    try {
      await setDoc(doc(db, 'admins', user.uid), { uid: user.uid, role: 'owner' });
      window.location.reload(); // Refresh to update status
    } catch (err) {
      console.error(err);
      alert("Failed to initialize admin. Rules might already be deployed.");
    } finally {
      setIsInitializingAdmin(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (user.simulated) {
      const loadSimTxs = () => {
        try {
          const simTxsStr = localStorage.getItem('saccoswift_sim_transactions');
          if (simTxsStr) {
            setRecentTransactions(JSON.parse(simTxsStr).slice(0, 3));
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
      orderBy('timestamp', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentTransactions(txs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleQuickAction = (label: string) => {
    // Reset specific states
    setResolvedName(null);
    setStkPushState('idle');
    setMpesaPin('');
    if (label === 'Deposit') {
      setTxMethod('mpesa');
      setShowTxModal('deposit');
    } else if (label === 'Withdraw') {
      setTxMethod('mpesa');
      setShowTxModal('withdraw');
    } else if (label === 'Transfer') {
      setTxMethod('sacco');
      setShowTxModal('transfer');
    } else if (label === 'More') {
      setMoreActionType('menu');
      setShowMoreModal(true);
    } else {
      alert(`${label} action completed!`);
    }
  };

  const handleBuyAirtimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const currentSavings = profile?.savingsBalance || 0;
    if (currentSavings < amountVal) {
      alert('Insufficient savings balance!');
      return;
    }

    if (user?.simulated) {
      const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
      const simTxs = JSON.parse(simTxsStr);
      simTxs.unshift({
        id: `TX-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
        userId: user.uid,
        type: 'withdraw',
        amount: amountVal,
        description: `Airtime purchase: ${airtimeCarrier.toUpperCase()} to ${phoneNumber}`,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
      localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));

      const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
      currentProfile.savingsBalance = (currentProfile.savingsBalance || 0) - amountVal;
      localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
      setProfile(currentProfile);
    }
    playBeep(880, 0.1);
    setTimeout(() => playBeep(1200, 0.15), 100);
    alert(`KES ${amountVal.toLocaleString()} Airtime successfully sent to ${phoneNumber}!`);
    setShowMoreModal(false);
    setTxAmount('');
  };

  const handlePayBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (!billNum.trim()) {
      alert('Please enter a valid account or meter number');
      return;
    }
    const currentSavings = profile?.savingsBalance || 0;
    if (currentSavings < amountVal) {
      alert('Insufficient savings balance!');
      return;
    }

    let extraDetails = '';
    if (utilityBillType === 'kplc') {
      const prepaidToken = Array.from({length: 5}, () => Math.floor(1000 + Math.random() * 9000)).join('-');
      extraDetails = `Token: ${prepaidToken}`;
    }

    if (user?.simulated) {
      const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
      const simTxs = JSON.parse(simTxsStr);
      simTxs.unshift({
        id: `TX-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
        userId: user.uid,
        type: 'withdraw',
        amount: amountVal,
        description: `Utility: ${utilityBillType.toUpperCase()} - Acc ${billNum}`,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
      localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));

      const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
      currentProfile.savingsBalance = (currentProfile.savingsBalance || 0) - amountVal;
      localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
      setProfile(currentProfile);
    }
    playBeep(880, 0.1);
    setTimeout(() => playBeep(1200, 0.15), 100);
    alert(`KES ${amountVal.toLocaleString()} payment to ${utilityBillType.toUpperCase()} successful! ${extraDetails}`);
    setShowMoreModal(false);
    setTxAmount('');
    setBillNum('');
  };

  const handleChamaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    const currentSavings = profile?.savingsBalance || 0;
    if (currentSavings < amountVal) {
      alert('Insufficient savings balance!');
      return;
    }

    if (user?.simulated) {
      const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
      const simTxs = JSON.parse(simTxsStr);
      simTxs.unshift({
        id: `TX-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
        userId: user.uid,
        type: 'withdraw',
        amount: amountVal,
        description: `Chama Contribution: ${chamaName}`,
        timestamp: new Date().toISOString(),
        status: 'completed'
      });
      localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));

      const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
      currentProfile.savingsBalance = (currentProfile.savingsBalance || 0) - amountVal;
      localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
      setProfile(currentProfile);
    }
    playBeep(880, 0.12);
    alert(`Successfully contributed KES ${amountVal.toLocaleString()} to ${chamaName}! Thank you for growing the co-operative spirit.`);
    setShowMoreModal(false);
    setTxAmount('');
  };

  const handleGuarantorRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId.trim()) {
      alert('Please enter a colleague Member Number');
      return;
    }
    playBeep(880, 0.1);
    alert(`Request sent! An invitation has been dispatched to member ${recipientId.toUpperCase()} to act as your loan guarantor.`);
    setShowMoreModal(false);
    setRecipientId('');
  };

  // Trigger simulated M-Pesa express STK push prompt popup
  const handleInitiateSTKPush = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }
    if (!phoneNumber) {
      alert("Please enter your M-Pesa registered Kenyan mobile number.");
      return;
    }

    setStkPushState('sending');
    playBeep(440, 0.08);

    setTimeout(() => {
      setStkPushState('pin-prompt');
      playBeep(523.25, 0.25); // high crisp sim trigger tone
    }, 1200);
  };

  // Submit simulated PIN to write real transaction and trigger SMS receipt
  const handleSTKPinSubmit = async () => {
    if (mpesaPin.length < 4) {
      alert("Please key in your 4-digit secret PIN.");
      return;
    }

    setStkPushState('processing');
    playBeep(440, 0.06);

    setTimeout(async () => {
      try {
        const amountVal = parseFloat(txAmount);
        const refSeed = Math.random().toString(36).substring(3, 11).toUpperCase();
        
        if (user.simulated) {
          // Write simulated transaction log
          const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
          const simTxs = JSON.parse(simTxsStr);
          simTxs.unshift({
            id: `QK${refSeed}`,
            userId: user.uid,
            type: 'deposit',
            amount: amountVal,
            description: `M-Pesa STK Cashin: Ref QK${refSeed}`,
            timestamp: new Date().toISOString(),
            status: 'completed'
          });
          localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));

          // Update local balance state
          const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
          currentProfile.savingsBalance = (currentProfile.savingsBalance || 0) + amountVal;
          localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
          setProfile(currentProfile);
        } else {
          // Write the real deposit transaction to the live database!
          await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            type: 'deposit',
            amount: amountVal,
            description: `M-Pesa STK Cashin: Ref QK${refSeed}`,
            timestamp: serverTimestamp()
          });

          // Update savings balance
          await updateDoc(doc(db, 'users', user.uid), {
            savingsBalance: increment(amountVal)
          });
        }

        const newBal = (profile?.savingsBalance || 0) + amountVal;
        const formattedNewBal = formatCurrency(newBal);
        
        // Launch beautiful Safaricom confirmation toast
        const smsMsg = `QH${refSeed} Confirmed. KES ${amountVal.toFixed(2)} received from ${phoneNumber} for Account ${profile?.memberNumber || 'Savings'} on ${new Date().toLocaleString('en-KE')}. New available Sacco Swift balance: ${formattedNewBal}. Transaction charge KES 0.00.`;
        setSmsNotification(smsMsg);
        
        playBeep(880, 0.1);
        setTimeout(() => playBeep(1320, 0.2), 120);

        setStkPushState('success');

        setTimeout(() => {
          // Reset and close
          setShowTxModal(null);
          setTxAmount('');
          setTxDesc('');
          setMpesaPin('');
          setStkPushState('idle');
        }, 1500);

        // Hide SMS toast after 8 seconds
        setTimeout(() => {
          setSmsNotification(null);
        }, 8000);

      } catch (err: any) {
        console.error(err);
        alert(`Transaction failed: ${err.message}`);
        setStkPushState('idle');
      }
    }, 1500);
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(txAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!user) {
      alert("Please log in to perform transactions.");
      return;
    }

    setLoading(true);
    try {
        const currentSavings = profile?.savingsBalance || 0;

        if (user.simulated) {
          const saveSimulatedTransaction = (type: 'deposit' | 'withdraw', amount: number, val: string) => {
            const simTxsStr = localStorage.getItem('saccoswift_sim_transactions') || '[]';
            const simTxs = JSON.parse(simTxsStr);
            simTxs.unshift({
              id: `TX-${Math.random().toString(36).substring(3, 11).toUpperCase()}`,
              userId: user.uid,
              type,
              amount,
              description: val,
              timestamp: new Date().toISOString(),
              status: 'completed'
            });
            localStorage.setItem('saccoswift_sim_transactions', JSON.stringify(simTxs));

            const currentProfile = JSON.parse(localStorage.getItem('saccoswift_sim_profile') || '{}');
            const multiplier = type === 'deposit' ? 1 : -1;
            currentProfile.savingsBalance = (currentProfile.savingsBalance || 0) + (amount * multiplier);
            localStorage.setItem('saccoswift_sim_profile', JSON.stringify(currentProfile));
            setProfile(currentProfile);
          };

          if (showTxModal === 'deposit') {
            const descVal = txDesc.trim() || `${txMethod === 'bank' ? 'Equity' : 'Manual'} Deposit`;
            saveSimulatedTransaction('deposit', amountVal, descVal);
            playBeep(880, 0.15);
            alert(`Success! KES ${amountVal.toLocaleString()} deposited to Sacco Swift via ${txMethod === 'bank' ? 'EFT' : 'manual channel'}.`);
          } else if (showTxModal === 'withdraw') {
            if (currentSavings < amountVal) {
              alert(`Insufficient savings balance! You have ${formatCurrency(currentSavings)} but requested a withdrawal of ${formatCurrency(amountVal)}.`);
              setLoading(false);
              return;
            }
            if (txMethod === 'mpesa') {
              saveSimulatedTransaction('withdraw', amountVal, `M-Pesa Cashout: To ${phoneNumber}`);
              const refSeed = Math.random().toString(36).substring(3, 11).toUpperCase();
              const balanceMsg = formatCurrency(currentSavings - amountVal);
              const smsMsg = `QN${refSeed} Confirmed. KES ${amountVal.toFixed(2)} withdrawn to M-Pesa line ${phoneNumber} on ${new Date().toLocaleString('en-KE')}. Sacco Swift balance: ${balanceMsg}. B2C processing free.`;
              setSmsNotification(smsMsg);
              playBeep(880, 0.1);
              setTimeout(() => playBeep(1200, 0.15), 100);
              alert(`Withdrawn KES ${amountVal.toLocaleString()} instantly to M-Pesa line ${phoneNumber}!`);
              setTimeout(() => setSmsNotification(null), 8000);
            } else {
              const descVal = txDesc.trim() || `${txMethod === 'bank' ? selectedBank : 'ATM'} Cash Withdrawal`;
              saveSimulatedTransaction('withdraw', amountVal, descVal);
              playBeep(700, 0.1);
              alert(`Successfully withdrew ${formatCurrency(amountVal)}.`);
            }
          } else if (showTxModal === 'transfer') {
            if (currentSavings < amountVal) {
              alert(`Insufficient savings balance! You have ${formatCurrency(currentSavings)} but requested a transfer of ${formatCurrency(amountVal)}.`);
              setLoading(false);
              return;
            }
            if (txMethod === 'sacco') {
              const descVal = `Peer-to-Peer: To ${recipientName || 'Member ' + recipientId}`;
              saveSimulatedTransaction('withdraw', amountVal, descVal);
              playBeep(880, 0.1);
              setTimeout(() => playBeep(1200, 0.2), 100);
              alert(`KES ${amountVal.toLocaleString()} has been transferred in real-time to simulated Sacco Member (${recipientId})!`);
            } else if (txMethod === 'mpesa') {
              const descVal = `M-Pesa cashout: To ${recipientName || phoneNumber}`;
              saveSimulatedTransaction('withdraw', amountVal, descVal);
              const refId = `QW${Math.random().toString(36).substring(3, 11).toUpperCase()}`;
              const newBal = formatCurrency(currentSavings - amountVal);
              const sms = `${refId} Confirmed. KES ${amountVal.toFixed(2)} processed to M-Pesa customer ${recipientName || phoneNumber} on ${new Date().toLocaleString('en-KE')}. Sacco savings: ${newBal}.`;
              setSmsNotification(sms);
              playBeep(880, 0.1);
              alert(`KES ${amountVal.toLocaleString()} successfully sent directly to M-Pesa customer.`);
              setTimeout(() => setSmsNotification(null), 8000);
            } else if (txMethod === 'bank') {
              const descVal = `${selectedBank} Bankout: To ${recipientName || bankAccount}`;
              saveSimulatedTransaction('withdraw', amountVal, descVal);
              playBeep(880, 0.12);
              alert(`RTGS/EFT Outward Transfer of KES ${amountVal.toLocaleString()} initiated successfully to ${selectedBank} Acc ${bankAccount} (${recipientName}).`);
            }
          }
          setShowTxModal(null);
          setTxAmount('');
          setTxDesc('');
          setRecipientId('');
          setRecipientName('');
          setBankAccount('');
          setResolvedName(null);
          setLoading(false);
          return;
        }

        if (showTxModal === 'deposit') {
          // Fallback to bank/other or manual deposit
          const descVal = txDesc.trim() || `${txMethod === 'bank' ? 'Equity' : 'Manual'} Deposit`;
          
          await addDoc(collection(db, 'transactions'), {
            userId: user.uid,
            type: 'deposit',
            amount: amountVal,
            description: descVal,
            timestamp: serverTimestamp()
          });

          await updateDoc(doc(db, 'users', user.uid), {
            savingsBalance: increment(amountVal)
          });

          playBeep(880, 0.15);
          alert(`Success! KES ${amountVal.toLocaleString()} deposited to Sacco Swift via ${txMethod === 'bank' ? 'EFT' : 'manual channel'}.`);
          setShowTxModal(null);
          setTxAmount('');
          setTxDesc('');

        } else if (showTxModal === 'withdraw') {
          if (currentSavings < amountVal) {
            alert(`Insufficient savings balance! You have ${formatCurrency(currentSavings)} but requested a withdrawal of ${formatCurrency(amountVal)}.`);
            setLoading(false);
            return;
          }

          if (txMethod === 'mpesa') {
            await updateDoc(doc(db, 'users', user.uid), {
              savingsBalance: increment(-amountVal)
            });
            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              type: 'withdraw',
              amount: amountVal,
              description: `M-Pesa Cashout: To ${phoneNumber}`,
              timestamp: serverTimestamp()
            });

            // Trigger SMS toast for B2C Cashout
            const refSeed = Math.random().toString(36).substring(3, 11).toUpperCase();
            const balanceMsg = formatCurrency(currentSavings - amountVal);
            const smsMsg = `QN${refSeed} Confirmed. KES ${amountVal.toFixed(2)} withdrawn to M-Pesa line ${phoneNumber} on ${new Date().toLocaleString('en-KE')}. Sacco Swift balance: ${balanceMsg}. B2C processing free.`;
            setSmsNotification(smsMsg);
            
            playBeep(880, 0.1);
            setTimeout(() => playBeep(1200, 0.15), 100);
            alert(`Withdrawn KES ${amountVal.toLocaleString()} instantly to M-Pesa line ${phoneNumber}!`);

            setTimeout(() => {
              setSmsNotification(null);
            }, 8000);

          } else {
            const descVal = txDesc.trim() || `${txMethod === 'bank' ? selectedBank : 'ATM'} Cash Withdrawal`;

            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              type: 'withdraw',
              amount: amountVal,
              description: descVal,
              timestamp: serverTimestamp()
            });

            await updateDoc(doc(db, 'users', user.uid), {
              savingsBalance: increment(-amountVal)
            });

            playBeep(700, 0.1);
            alert(`Successfully withdrew ${formatCurrency(amountVal)}.`);
          }
          setShowTxModal(null);
          setTxAmount('');
          setTxDesc('');

        } else if (showTxModal === 'transfer') {
          if (currentSavings < amountVal) {
            alert(`Insufficient savings balance! You have ${formatCurrency(currentSavings)} but requested a transfer of ${formatCurrency(amountVal)}.`);
            setLoading(false);
            return;
          }

          if (txMethod === 'sacco') {
            const targetMemberId = recipientId.trim().toUpperCase();
            if (!targetMemberId) {
              alert("Please verify the recipient Sacco Member ID.");
              setLoading(false);
              return;
            }

            const usersRef = collection(db, 'users');
            const recipientQuery = query(usersRef, where('memberNumber', '==', targetMemberId));
            const recipientSnap = await getDocs(recipientQuery);

            if (!recipientSnap.empty) {
              const recipientDoc = recipientSnap.docs[0];
              const recipientData = recipientDoc.data();
              const recipientUid = recipientDoc.id;

              // Deduct sender savings
              await updateDoc(doc(db, 'users', user.uid), {
                savingsBalance: increment(-amountVal)
              });
              await addDoc(collection(db, 'transactions'), {
                userId: user.uid,
                type: 'withdraw',
                amount: amountVal,
                description: `Peer-to-Peer: To ${recipientData.fullName}`,
                timestamp: serverTimestamp()
              });

              // Credit recipient savings
              await updateDoc(doc(db, 'users', recipientUid), {
                savingsBalance: increment(amountVal)
              });
              await addDoc(collection(db, 'transactions'), {
                userId: recipientUid,
                type: 'deposit',
                amount: amountVal,
                description: `Received Peer Transfer from ${profile?.fullName}`,
                timestamp: serverTimestamp()
              });

              playBeep(880, 0.1);
              setTimeout(() => playBeep(1200, 0.2), 100);
              alert(`KES ${amountVal.toLocaleString()} has been transferred in real-time to ${recipientData.fullName} (${targetMemberId})!`);
            } else {
              alert("Target Sacco Member ID does not exist in the live database.");
              setLoading(false);
              return;
            }
          } else if (txMethod === 'mpesa') {
            // Cash Send to M-Pesa Number
            await updateDoc(doc(db, 'users', user.uid), {
              savingsBalance: increment(-amountVal)
            });
            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              type: 'withdraw',
              amount: amountVal,
              description: `M-Pesa cashout: To ${recipientName || phoneNumber}`,
              timestamp: serverTimestamp()
            });

            const refId = `QW${Math.random().toString(36).substring(3, 11).toUpperCase()}`;
            const newBal = formatCurrency(currentSavings - amountVal);
            const sms = `${refId} Confirmed. KES ${amountVal.toFixed(2)} processed to M-Pesa customer ${recipientName || phoneNumber} on ${new Date().toLocaleString('en-KE')}. Sacco savings: ${newBal}.`;
            setSmsNotification(sms);
            playBeep(880, 0.1);
            alert(`KES ${amountVal.toLocaleString()} successfully sent directly to M-Pesa customer.`);

            setTimeout(() => {
              setSmsNotification(null);
            }, 8000);

          } else if (txMethod === 'bank') {
            // EFT Outward Bank Transfer
            await updateDoc(doc(db, 'users', user.uid), {
              savingsBalance: increment(-amountVal)
            });
            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              type: 'withdraw',
              amount: amountVal,
              description: `${selectedBank} Bankout: To ${recipientName || bankAccount}`,
              timestamp: serverTimestamp()
            });

            playBeep(880, 0.12);
            alert(`RTGS/EFT Outward Transfer of KES ${amountVal.toLocaleString()} initiated successfully to ${selectedBank} Acc ${bankAccount} (${recipientName}).`);
          }

          setShowTxModal(null);
          setTxAmount('');
          setTxDesc('');
          setRecipientId('');
          setRecipientName('');
          setBankAccount('');
          setResolvedName(null);
        }
      } catch (err: any) {
        console.error("Transaction Error:", err);
        alert(`Transaction failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
  };

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
      {/* Header with Greeting, Weather, and Daily Motivational Sente Tip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-zinc-950 text-white rounded-[2.5rem] border border-zinc-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative shrink-0">
            <div className="w-14 h-14 bg-gradient-to-tr from-[#C1272D] to-[#D4A017] p-[1.5px] rounded-2xl">
              <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center text-lg font-black uppercase text-white">
                {profile?.fullName?.[0] || 'M'}
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 bg-emerald-green border-2 border-zinc-950 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] uppercase tracking-widest font-black text-[#D4A017]">SaccoSwift Elite Client</span>
              <span className="text-[7px] font-black tracking-widest text-[#121212] bg-[#D4A017] px-2 py-0.5 rounded-full uppercase">VIP GOLD</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-1">
              Karibu, {profile?.fullName?.split(' ')[0] || 'Member'} 👋
            </h2>
            <p className="text-[9px] text-zinc-400 font-bold tracking-tight">
              Sacco ID • <span className="font-mono text-[#D4A017]">{profile?.memberNumber || 'SS-2026-9912'}</span>
            </p>
          </div>
        </div>

        {/* Weather & Motivational Sente Tips */}
        <div className="flex items-center gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-zinc-800 justify-between relative z-10">
          <div className="text-left md:text-right border-r border-zinc-800 pr-5">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">Nairobi Region</span>
            <span className="text-xs font-black text-zinc-300 flex items-center gap-1">
              ☀️ 22°C Clear
            </span>
          </div>

          <div className="max-w-[160px] leading-normal shrink-0">
            <span className="text-[8px] font-black text-emerald-green uppercase tracking-widest block">Sente Wisdom</span>
            <p className="text-[9px] text-zinc-400 font-bold italic line-clamp-1">
              "Save 1/3 of your income to unlock 3x asset multiplier!"
            </p>
          </div>

          <div className="relative">
             <div onClick={() => alert('Opening notifications feed')} className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white group cursor-pointer active:scale-90 transition-all">
                <Bell size={18} />
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#C1272D] rounded-full border border-zinc-950" />
             </div>
          </div>
        </div>
      </div>

      {/* Main Wealth Card with Maasai Shield curveture */}
      <Card className="bg-gradient-to-br from-[#121212] via-[#1a1415] to-[#251012] border border-zinc-800/80 p-6 rounded-[2.5rem] relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 space-y-6">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                 <p className="text-zinc-400 text-[10px] font-black uppercase tracking-wider">Total Net Asset Value</p>
              </div>
              <button 
                onClick={() => {
                  playBeep(600, 0.08);
                  setShowBalance(!showBalance);
                }}
                className="w-8 h-8 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                {showBalance ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
           </div>
           
           <div className="space-y-1">
              <h3 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                 {showBalance ? formatCurrency(totalBalance) : "••••••••"}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                 <span className="text-[8px] uppercase tracking-widest font-black text-[#D4A017] bg-[#D4A017]/10 px-2 py-0.5 rounded-full">Liquid</span>
                 <p className="text-[#0F8B6D] text-[10px] font-black uppercase tracking-tighter">
                   Savings: {showBalance ? formatCurrency(profile?.savingsBalance || 0) : "••••"}
                 </p>
              </div>
           </div>

           <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2.5">
                 <div className="w-9 h-9 rounded-xl bg-[#0F8B6D]/10 flex items-center justify-center">
                    <TrendingUp size={15} className="text-[#0F8B6D]" />
                 </div>
                 <div>
                    <span className="text-[8px] uppercase font-black text-zinc-500 block leading-none">Compound Interest YTD</span>
                    <p className="text-zinc-200 text-[10px] font-bold mt-0.5">Earned KES 1,250.00 this month</p>
                 </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
                 <ChevronRight size={15} className="text-zinc-400" />
              </div>
           </div>
        </div>
        
        {/* Abstract Background Shapes & Crafted Vector Maasai Shield overlay */}
        <div className="absolute right-4 top-[50%] -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none select-none max-w-[120px] w-full">
           <svg viewBox="0 0 100 160" fill="none" className="w-full text-white">
              {/* Maasai Shield silhouette */}
              <path d="M50 5 C50 5 95 40 95 80 C95 120 50 155 50 155 C50 155 5 120 5 80 C5 40 50 5 50 5 Z" stroke="currentColor" strokeWidth="2.5" />
              {/* Vertical line through center (tradition) */}
              <line x1="50" y1="5" x2="50" y2="155" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
              {/* Traditional geometric side curves */}
              <path d="M5 80 C25 80 40 60 50 60" stroke="currentColor" strokeWidth="1.5" />
              <path d="M95 80 C75 80 60 60 50 60" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 80 C25 80 40 100 50 100" stroke="currentColor" strokeWidth="1.5" />
              <path d="M95 80 C75 80 60 100 50 100" stroke="currentColor" strokeWidth="1.5" />
              {/* Dots representation of beads */}
              <circle cx="50" cy="30" r="3" fill="#D4A017" />
              <circle cx="50" cy="130" r="3" fill="#D4A017" />
              <circle cx="20" cy="80" r="3.5" fill="#C1272D" />
              <circle cx="80" cy="80" r="3.5" fill="#C1272D" />
           </svg>
        </div>

        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#C1272D]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#D4A017]/10 rounded-full blur-3xl pointer-events-none opacity-50" />
      </Card>

      {/* Quick Actions (Maasai Premium Bead Buttons) */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: ArrowUpRight, label: 'Deposit', color: 'text-white bg-gradient-to-b from-[#0F8B6D] to-[#0A5A47]' },
          { icon: ArrowDownLeft, label: 'Withdraw', color: 'text-white bg-gradient-to-b from-[#C1272D] to-[#8B1B1F]' },
          { icon: Repeat, label: 'Transfer', color: 'text-white bg-gradient-to-b from-[#D4A017] to-[#916E10]' },
          { icon: Grid, label: 'More', color: 'text-white bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/50' },
        ].map((action, idx) => (
          <div 
            key={idx} 
            onClick={() => handleQuickAction(action.label)}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-active:scale-90 shadow-md",
              action.color
            )}>
              <action.icon size={21} strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-black text-zinc-400 group-hover:text-white uppercase tracking-tighter transition-colors">{action.label}</span>
          </div>
        ))}
      </div>

      {/* Account List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h4 className="font-black text-xs uppercase tracking-widest text-[#D4A017]">My Accounts</h4>
           <button className="text-brand text-xs font-bold uppercase tracking-tighter">View All</button>
        </div>

         <div className="space-y-3">
          <AccountRow 
            icon={Wallet} 
            label="Savings Account" 
            balance={profile?.savingsBalance || 0} 
            color="text-emerald-500" 
            rate="10.5%"
            showBalance={showBalance} 
          />
          <AccountRow 
            icon={Landmark} 
            label="Current Checking" 
            balance={12450} 
            color="text-sky-500" 
            rate="4.5%"
            showBalance={showBalance} 
          />
          <AccountRow 
            icon={ShieldAlert} 
            label="Loan Portfolio" 
            balance={profile?.loanBalance || 0} 
            color="text-rose-500" 
            rate="8.5%"
            showBalance={showBalance}
            isLoan={true}
          />
          <AccountRow 
            icon={Grid} 
            label="Investment Wallet" 
            balance={45000} 
            color="text-violet-500" 
            rate="14.0%"
            suffix="Grow Fund"
            showBalance={showBalance} 
          />
          <AccountRow 
            icon={Trophy} 
            label="Fixed Deposit Pool" 
            balance={150000} 
            color="text-amber-500" 
            rate="12.0%"
            suffix="12 Months"
            showBalance={showBalance} 
          />
          <AccountRow 
            icon={Sparkles} 
            label="Junior Saver Gold" 
            balance={5400} 
            color="text-lime-500" 
            rate="9.5%"
            suffix="Kid Lock"
            showBalance={showBalance} 
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h4 className="font-black text-xs uppercase tracking-widest text-[#D4A017]">Recent Activity</h4>
           <button onClick={() => navigate('/transactions')} className="text-zinc-400 text-xs font-bold uppercase tracking-tighter hover:text-[#C1272D] transition-colors">History &rarr;</button>
        </div>

        <div className="space-y-3">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3.5 bg-[#16171b]/90 border border-zinc-800/80 rounded-[1.25rem] app-shadow shrink-0 transition-all hover:border-[#D4A017]/35">
               <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center",
                    tx.type === 'deposit' ? "bg-emerald-950/30 text-emerald-400" : "bg-rose-950/30 text-rose-400"
                  )}>
                    {tx.type === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-zinc-100">{tx.description || tx.type}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
                      {tx.timestamp ? (typeof tx.timestamp.toDate === 'function' ? tx.timestamp.toDate().toLocaleDateString() : new Date(tx.timestamp).toLocaleDateString()) : 'Recently'}
                    </p>
                  </div>
               </div>
               <p className={cn(
                  "font-black text-xs tracking-tighter",
                  tx.type === 'deposit' ? "text-emerald-400" : "text-rose-400"
                )}>
                  {tx.type === 'deposit' ? '+' : '-'}{new Intl.NumberFormat('en-KE').format(tx.amount)}
               </p>
            </div>
          ))}
          {recentTransactions.length === 0 && (
            <p className="text-center py-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 border border-dashed border-zinc-800 rounded-3xl">No recent activity</p>
          )}
        </div>
      </div>

      {/* Welcome & Admin Check */}
      {!isAdmin && (
        <div className="bg-[#1b1511] border border-amber-900/30 p-4 rounded-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <ShieldAlert className="text-[#D4A017]" size={20} />
             <div>
                <p className="text-xs font-bold text-amber-200">Developer Suite</p>
                <p className="text-[10px] text-zinc-400">Claim administrative privileges to open the SACCO Ledger admin panel.</p>
             </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 text-[10px] px-3 bg-zinc-900 border-amber-900/40 text-amber-500 hover:bg-[#D4A017]/10"
            onClick={handleInitializeAdmin}
            disabled={isInitializingAdmin}
          >
             {isInitializingAdmin ? "..." : "Become Admin"}
          </Button>
        </div>
      )}

      {/* AI Insight Chip */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        onClick={() => setShowAiChat(true)}
        className="bg-brand/5 border border-brand/10 p-4 rounded-3xl flex items-center gap-4 cursor-pointer hover:bg-brand/10 transition-all duration-300"
      >
        <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
           <Sparkles size={18} />
        </div>
        <div className="flex-1">
           <p className="text-[10px] font-black text-brand uppercase tracking-widest mb-0.5">SaccoSwift AI Chat</p>
           <p className="text-xs text-zinc-650 font-bold leading-relaxed line-clamp-2">
             {aiInsight}
           </p>
           <p className="text-[8px] font-black text-brand uppercase tracking-widest mt-1">
             ⚡ Click to chat with Advisor
           </p>
        </div>
        <ChevronRight size={16} className="text-zinc-300" />
      </motion.div>

      {/* SMS Toast notification at top of screen */}
      <AnimatePresence>
        {smsNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 24, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-4 right-4 z-[9999] bg-[#1a1a1a] text-zinc-100 p-4 border border-zinc-700/50 rounded-2xl shadow-2xl font-mono text-[11px] leading-relaxed max-w-sm mx-auto"
          >
            <div className="flex items-center justify-between mb-1 text-xs border-b border-zinc-800 pb-1.5 font-sans">
              <span className="font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                M-PESA Message
              </span>
              <span className="text-[9px] text-zinc-500 font-bold">Just Now</span>
            </div>
            <p className="text-zinc-300 font-medium">{smsNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating SIM ToolKit Prompt Overlay */}
      <AnimatePresence>
        {showTxModal === 'deposit' && stkPushState === 'pin-prompt' && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-xs font-mono p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-[280px] bg-[#d3d3d3] border-4 border-[#888] rounded-xl shadow-2xl p-4 text-zinc-900 flex flex-col gap-3"
            >
              <div className="bg-[#2a2a2a] text-white py-1.5 text-[9px] uppercase font-black text-center tracking-widest rounded">
                SIM TOOLKIT - M-PESA
              </div>
              <p className="text-[11px] leading-tight text-zinc-800 font-black pt-1">
                Do you want to transfer KES {parseFloat(txAmount).toLocaleString()} to SaccoSwift Equity Savings (Acc: {profile?.memberNumber})?
              </p>
              
              <div className="space-y-1 pt-1">
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">Enter 4-Digit M-PESA PIN:</p>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={4}
                    value={mpesaPin}
                    onChange={(e) => setMpesaPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[1.5em] text-lg font-black h-11 bg-white border-2 border-zinc-400 focus:border-zinc-800 rounded focus:outline-none placeholder:text-zinc-300 text-zinc-900"
                    placeholder="••••"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2 font-sans text-[10px] uppercase font-black select-none">
                <button
                  type="button"
                  onClick={() => {
                    setStkPushState('idle');
                    setMpesaPin('');
                    setLoading(false);
                  }}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-3 rounded-lg border border-zinc-300 active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSTKPinSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg active:scale-95 transition-transform shadow-md shadow-emerald-700/10"
                >
                  Send PIN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Primary Advanced Quick Banking Modal */}
      <AnimatePresence>
        {showTxModal && stkPushState !== 'pin-prompt' && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm space-y-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] relative border border-zinc-100 overflow-y-auto max-h-[92vh] no-scrollbar"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-brand flex items-center gap-1.5">
                    <span>⚡</span> 
                    {showTxModal === 'deposit' ? 'Saccoswift Deposit' : 
                     showTxModal === 'withdraw' ? 'Saccoswift Cashout' : 'Transmission Ledger'}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Equity Bank Integration</p>
                </div>
                <button 
                  onClick={() => {
                    setShowTxModal(null);
                    setTxAmount('');
                    setTxDesc('');
                    setRecipientId('');
                    setRecipientName('');
                    setBankAccount('');
                    setResolvedName(null);
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 font-bold hover:bg-zinc-100 active:scale-95 transition-transform"
                >
                  ✕
                </button>
              </div>

              {/* METHOD SELECTORS */}
              {showTxModal === 'deposit' && (
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Choose Deposit Resource</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-50 border border-zinc-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setTxMethod('mpesa')}
                      className={cn(
                        "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                        txMethod === 'mpesa' ? "bg-white text-brand shadow-md" : "text-zinc-500"
                      )}
                    >
                      M-Pesa STK Push
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxMethod('bank')}
                      className={cn(
                        "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                        txMethod === 'bank' ? "bg-white text-brand shadow-md" : "text-zinc-500"
                      )}
                    >
                      Equity Paybill
                    </button>
                  </div>
                </div>
              )}

              {showTxModal === 'withdraw' && (
                <div className="space-y-4">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Withdrawal Vector</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-50 border border-zinc-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setTxMethod('mpesa')}
                      className={cn(
                        "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                        txMethod === 'mpesa' ? "bg-white text-brand shadow-md" : "text-zinc-500"
                      )}
                    >
                      M-Pesa Cashout
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxMethod('bank')}
                      className={cn(
                        "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                        txMethod === 'bank' ? "bg-white text-brand shadow-md" : "text-zinc-500"
                      )}
                    >
                      Equity Agent
                    </button>
                  </div>
                </div>
              )}

              {showTxModal === 'transfer' && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Destination Vector</label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-50 border border-zinc-100 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => { setTxMethod('sacco'); setResolvedName(null); }}
                      className={cn(
                        "py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all",
                        txMethod === 'sacco' ? "bg-white text-brand shadow-sm" : "text-zinc-500"
                      )}
                    >
                      Sacco Member
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTxMethod('mpesa'); setResolvedName(null); }}
                      className={cn(
                        "py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all",
                        txMethod === 'mpesa' ? "bg-white text-brand shadow-sm" : "text-zinc-500"
                      )}
                    >
                      To M-Pesa
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTxMethod('bank'); setResolvedName(null); }}
                      className={cn(
                        "py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all",
                        txMethod === 'bank' ? "bg-white text-brand shadow-sm" : "text-zinc-500"
                      )}
                    >
                      EFT Bank
                    </button>
                  </div>
                </div>
              )}

              {/* DYNAMIC FORMS & SIM STATES */}
              {showTxModal === 'deposit' && txMethod === 'mpesa' && (
                <div className="space-y-4">
                  {stkPushState === 'idle' && (
                    <form onSubmit={handleInitiateSTKPush} className="space-y-4 pt-1">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">M-Pesa Phone Line</label>
                        <input 
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 0712345678"
                          className="w-full h-12 bg-zinc-50 rounded-2xl px-4 border border-zinc-100 text-xs font-bold focus:outline-none focus:border-brand"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Amount to Deposit (KES)</label>
                        <input 
                          type="number"
                          required
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                          placeholder="e.g. 3500"
                          className="w-full h-12 bg-zinc-50 rounded-2xl px-4 border border-zinc-100 text-xs font-bold focus:outline-none focus:border-brand"
                        />
                      </div>
                      <Button type="submit" className="w-full h-14 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/10 active:scale-95">
                        Initiate M-Pesa STK Push
                      </Button>
                    </form>
                  )}

                  {stkPushState === 'sending' && (
                    <div className="text-center py-8 space-y-4 animate-pulse">
                      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-bold text-zinc-600">Broadcasting Safaricom OTP STK Push Signal...</p>
                      <p className="text-[10px] text-zinc-400">A security overlay will appear on your phone shortly.</p>
                    </div>
                  )}

                  {stkPushState === 'processing' && (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-bold text-zinc-600">Verifying PIN acceptance & syncing ledger...</p>
                      <p className="text-[10px] text-zinc-400">Do not disconnect. Confirming with Safaricom B2C line.</p>
                    </div>
                  )}

                  {stkPushState === 'success' && (
                    <div className="text-center py-8 space-y-3">
                      <div className="w-14 h-14 bg-emerald-150 text-emerald-600 rounded-full flex items-center justify-center font-black mx-auto text-3xl">
                        ✓
                      </div>
                      <h5 className="font-black text-emerald-700 text-sm uppercase">Transacted Approved</h5>
                      <p className="text-xs font-medium text-zinc-500">KES {parseFloat(txAmount).toLocaleString()} added to your live Sacco Swift savings account.</p>
                    </div>
                  )}
                </div>
              )}

              {/* EQUITY PAYBILL MANUAL DEPOSIT DETAILS */}
              {showTxModal === 'deposit' && txMethod === 'bank' && (
                <div className="space-y-4 p-4 bg-zinc-50 border border-zinc-100/50 rounded-3xl">
                  <div className="space-y-1 text-center">
                    <p className="text-[10px] uppercase font-black text-brand tracking-widest">Equity Paybill</p>
                    <p className="text-3xl font-black text-zinc-900 tracking-tighter">247 247</p>
                  </div>
                  <div className="border-t border-dashed border-zinc-200 pt-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Paybill No:</span>
                      <strong className="font-extrabold text-zinc-800">247247</strong>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-500">Account No:</span>
                      <strong className="font-extrabold text-brand bg-brand/5 px-2 py-0.5 rounded text-[10px]">{profile?.memberNumber || 'Your Sacco Member ID'}</strong>
                    </div>
                  </div>
                  <p className="text-[9px] leading-relaxed text-zinc-400 font-medium text-center italic">Funds moved from any Equity Account using *247# directly update this dashboard instantly.</p>
                  
                  {/* Immediate Manual Simulation override */}
                  <form onSubmit={handleTxSubmit} className="space-y-3 pt-3 border-t border-zinc-200">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Fast Simulation Amount (KES)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number"
                        required
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        placeholder="e.g. 1000"
                        className="flex-1 h-11 bg-white rounded-xl px-3 border border-zinc-200 text-xs font-bold"
                      />
                      <Button type="submit" disabled={loading} size="sm" className="h-11 px-4 bg-brand text-white border-0 text-[10px]">
                        {loading? '...':'Simulate'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* WITHDRAW FORMS */}
              {showTxModal === 'withdraw' && (
                <form onSubmit={handleTxSubmit} className="space-y-4 pt-1">
                  {txMethod === 'mpesa' ? (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Target M-Pesa Number</label>
                      <input 
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="w-full h-12 bg-zinc-50 rounded-2xl px-4 border border-zinc-100 text-xs font-bold focus:outline-none focus:border-brand"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3.5 bg-zinc-50 p-4 border border-zinc-100 rounded-3xl">
                      <p className="text-[9px] text-zinc-500 uppercase font-bold text-center">Visit any Equity Sacco / Bank Agent and provide:</p>
                      <div className="text-center space-y-1">
                        <p className="text-[10px] font-black text-brand uppercase tracking-widest">Withdrawal agent Code</p>
                        <p className="text-2xl font-mono text-zinc-800 font-extrabold">{profile?.memberNumber?.replace('SS-','') || '778900'}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Amount (KES)</label>
                    <input 
                      type="number"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="Amount to withdraw"
                      className="w-full h-12 bg-zinc-50 rounded-2xl px-4 border border-zinc-100 text-xs font-bold focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 h-12 text-[10px]"
                      onClick={() => setShowTxModal(null)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-[10px] bg-brand text-white border-none shadow-md"
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Withdraw"}
                    </Button>
                  </div>
                </form>
              )}

              {/* HIGH FIDELITY TRANSFERS (SACCO, MPESA, BANK) */}
              {showTxModal === 'transfer' && (
                <form onSubmit={handleTxSubmit} className="space-y-4">
                  {/* Sacco Peer-to-Peer Transfer */}
                  {txMethod === 'sacco' && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Recipient Member ID</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            required
                            value={recipientId}
                            onChange={(e) => {
                              setRecipientId(e.target.value);
                              setResolvedName(null);
                            }}
                            placeholder="e.g. SS-2026-X1Y2"
                            className="flex-1 h-12 bg-zinc-50 rounded-2xl px-4 border border-zinc-100 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-brand"
                            disabled={loading || resolvingName}
                          />
                          <button
                            type="button"
                            onClick={resolveTargetName}
                            disabled={resolvingName || !recipientId}
                            className="px-4 bg-brand text-white text-[9px] uppercase font-black rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
                          >
                            {resolvingName? '...' : 'Verify'}
                          </button>
                        </div>
                      </div>

                      {resolvedName && (
                        <div className={cn(
                          "p-3 rounded-2xl border text-xs font-bold flex items-center justify-between",
                          resolvedName === 'Account Not Found' ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-800"
                        )}>
                          <span>Query Result:</span>
                          <span>{resolvedName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Send directly to M-Pesa Line */}
                  {txMethod === 'mpesa' && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400"> Kenyan Mobile Line</label>
                        <div className="flex gap-2">
                          <input 
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => {
                              setPhoneNumber(e.target.value);
                              setResolvedName(null);
                            }}
                            placeholder="e.g. 0712345678"
                            className="flex-1 h-12 bg-zinc-50 rounded-2xl px-4 border border-zinc-100 text-xs font-bold focus:outline-none focus:border-brand"
                            disabled={loading || resolvingName}
                          />
                          <button
                            type="button"
                            onClick={resolveTargetName}
                            disabled={resolvingName || !phoneNumber}
                            className="px-4 bg-brand text-white text-[9px] uppercase font-black rounded-2xl active:scale-95 transition-transform disabled:opacity-50"
                          >
                            {resolvingName? '...' : 'Verify'}
                          </button>
                        </div>
                      </div>

                      {resolvedName && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-tight text-emerald-800 flex items-center justify-between">
                          <span>M-Pesa Owner:</span>
                          <span>{resolvedName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Send to external bank account */}
                  {txMethod === 'bank' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Target Bank</label>
                          <select 
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className="w-full h-12 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold focus:outline-none"
                          >
                            <option value="Equity Bank">Equity Bank</option>
                            <option value="KCB Bank">KCB Bank</option>
                            <option value="Cooperative Bank">Cooperative Bank</option>
                            <option value="Absa Bank">Absa Bank</option>
                            <option value="NCBA Bank">NCBA Bank</option>
                            <option value="Stanbic Bank">Stanbic Bank</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Account No</label>
                          <div className="flex gap-1.5">
                            <input 
                              type="text"
                              required
                              value={bankAccount}
                              onChange={(e) => {
                                setBankAccount(e.target.value);
                                setResolvedName(null);
                              }}
                              placeholder="Account number"
                              className="w-full h-12 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold"
                            />
                            <button
                              type="button"
                              onClick={resolveTargetName}
                              disabled={resolvingName || !bankAccount}
                              className="px-3 bg-brand text-white text-[9px] uppercase font-black rounded-xl"
                            >
                              Check
                            </button>
                          </div>
                        </div>
                      </div>

                      {resolvedName && (
                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-tight text-emerald-800 flex items-center justify-between">
                          <span>Account Holder:</span>
                          <span>{resolvedName}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Amount to Transfer (KES)</label>
                    <input 
                      type="number"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full h-12 bg-zinc-50 rounded-2xl px-4 border border-zinc-100 text-xs font-bold focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="flex-1 h-12 text-[10px]"
                      onClick={() => setShowTxModal(null)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-12 text-[10px] bg-brand text-white border-none shadow-md"
                      disabled={loading || (txMethod === 'sacco' && !resolvedName)}
                    >
                      {loading ? "Transmitting..." : "Send Funds"}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* More Actions Modal */}
      <AnimatePresence>
        {showMoreModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-6 w-full max-w-sm space-y-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] relative border border-zinc-100 overflow-y-auto max-h-[92vh] no-scrollbar"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest text-brand flex items-center gap-1.5">
                    <span>📱</span> 
                    {moreActionType === 'menu' && 'More Utilities'}
                    {moreActionType === 'buy_airtime' && 'Buy Airtime'}
                    {moreActionType === 'pay_bill' && 'Pay Utility Bill'}
                    {moreActionType === 'chama' && 'Chama Member Pool'}
                    {moreActionType === 'guarantor_request' && 'Request Guarantor'}
                  </h4>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Sacco Swift Platform</p>
                </div>
                <button 
                  onClick={() => {
                    setShowMoreModal(false);
                    setMoreActionType(null);
                    setTxAmount('');
                    setBillNum('');
                  }}
                  className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 font-bold hover:bg-zinc-100 active:scale-95 transition-transform"
                >
                  ✕
                </button>
              </div>

              {/* MENU SCREEN */}
              {moreActionType === 'menu' && (
                <div className="grid grid-cols-2 gap-3 py-1">
                  <button
                    onClick={() => {
                      setMoreActionType('buy_airtime');
                      setTxAmount('');
                    }}
                    className="p-4 bg-zinc-50 border border-zinc-100 rounded-3xl text-left hover:border-brand-light hover:bg-brand/5 active:scale-95 transition-all text-zinc-900"
                  >
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3 border border-emerald-100/50">
                      <Plus size={18} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-tight">Buy Airtime</p>
                    <p className="text-[9px] text-zinc-400 font-bold mt-1">Saf/Airtel/Telkom</p>
                  </button>

                  <button
                    onClick={() => {
                      setMoreActionType('pay_bill');
                      setTxAmount('');
                    }}
                    className="p-4 bg-zinc-50 border border-zinc-100 rounded-3xl text-left hover:border-brand-light hover:bg-brand/5 active:scale-95 transition-all text-zinc-900"
                  >
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3 border border-amber-100/50">
                      <Landmark size={18} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-tight">Pay Bills</p>
                    <p className="text-[9px] text-zinc-400 font-bold mt-1 font-sans">KPLC, Water, PayTV</p>
                  </button>

                  <button
                    onClick={() => {
                      setMoreActionType('chama');
                      setTxAmount('');
                    }}
                    className="p-4 bg-zinc-50 border border-zinc-100 rounded-3xl text-left hover:border-brand-light hover:bg-brand/5 active:scale-95 transition-all text-zinc-900"
                  >
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 border border-indigo-100/50">
                      <Trophy size={18} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-tight">Chama Pool</p>
                    <p className="text-[9px] text-zinc-400 font-bold mt-1">Cooperative groups</p>
                  </button>

                  <button
                    onClick={() => {
                      setMoreActionType('guarantor_request');
                      setRecipientId('');
                    }}
                    className="p-4 bg-zinc-50 border border-zinc-100 rounded-3xl text-left hover:border-brand-light hover:bg-brand/5 active:scale-95 transition-all text-zinc-900"
                  >
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-3 border border-brand/20">
                      <Repeat size={18} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-tight font-sans">Guarantors</p>
                    <p className="text-[9px] text-zinc-400 font-bold mt-1">Loan Peer Voucher</p>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreModal(false);
                      navigate('/savings');
                    }}
                    className="p-4 bg-zinc-50 border border-zinc-100 rounded-3xl text-left hover:border-brand-light hover:bg-brand/5 active:scale-95 transition-all text-zinc-900"
                  >
                    <div className="w-10 h-10 bg-lime-50 text-lime-600 rounded-2xl flex items-center justify-center mb-3 border border-lime-100/50">
                      <Wallet size={18} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-tight text-zinc-900 font-sans">My Savings</p>
                    <p className="text-[9px] text-zinc-400 font-bold mt-1">Shares & Dividends</p>
                  </button>

                  <button
                    onClick={() => {
                      setShowMoreModal(false);
                      navigate('/loans');
                    }}
                    className="p-4 bg-zinc-50 border border-zinc-100 rounded-3xl text-left hover:border-brand-light hover:bg-brand/5 active:scale-95 transition-all text-zinc-900"
                  >
                    <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mb-3 border border-pink-100/50">
                      <Sparkles size={18} strokeWidth={2.5} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-tight">Sacco Loan</p>
                    <p className="text-[9px] text-zinc-400 font-bold mt-1">Eazzy & Custom</p>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowMoreModal(false);
                        navigate('/admin');
                      }}
                      className="col-span-2 p-4 bg-amber-500/5 border border-amber-500/20 rounded-3xl text-left hover:bg-amber-500/10 active:scale-[0.98] transition-all text-zinc-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center border border-amber-200">
                          <ShieldAlert size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-amber-800">Admin Control Panel</p>
                          <p className="text-[9px] text-amber-600 font-bold">Approve member loans on snapshot</p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* BUY AIRTIME SCREEN */}
              {moreActionType === 'buy_airtime' && (
                <form onSubmit={handleBuyAirtimeSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Carrier Provider</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'safaricom', label: 'Safaricom' },
                        { id: 'airtel', label: 'Airtel' },
                        { id: 'telkom', label: 'Telkom' }
                      ].map(car => (
                        <button
                          key={car.id}
                          type="button"
                          onClick={() => setAirtimeCarrier(car.id as any)}
                          className={cn(
                            "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all",
                            airtimeCarrier === car.id 
                              ? "bg-brand text-white border-brand font-sans" 
                              : "bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100 font-sans"
                          )}
                        >
                          {car.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Recipient Phone Number</label>
                    <input 
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="e.g. 0712345678"
                      className="w-full h-11 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Airtime Amount (KES)</label>
                    <input 
                      type="number"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full h-11 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold font-sans"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setMoreActionType('menu')}
                      className="flex-1 h-11 text-[10px] uppercase font-sans font-bold"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 text-[10px] bg-brand text-white border-none shadow-md uppercase font-sans font-bold"
                    >
                      Purchase Airtime
                    </Button>
                  </div>
                </form>
              )}

              {/* PAY UTILITY BILL SCREEN */}
              {moreActionType === 'pay_bill' && (
                <form onSubmit={handlePayBillSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Select Utility Service</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'kplc', label: 'KPLC Tokens' },
                        { id: 'water', label: 'Water Bill' },
                        { id: 'dstv', label: 'DSTV' }
                      ].map(u => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setUtilityBillType(u.id as any)}
                          className={cn(
                            "py-2 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight border transition-all",
                            utilityBillType === u.id 
                              ? "bg-brand text-white border-brand font-sans" 
                              : "bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100 font-sans"
                          )}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Account / Meter Number</label>
                    <input 
                      type="text"
                      required
                      value={billNum}
                      onChange={(e) => setBillNum(e.target.value)}
                      placeholder="e.g. 37190021203"
                      className="w-full h-11 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Bill Payment Amount (KES)</label>
                    <input 
                      type="number"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="e.g. 500"
                      className="w-full h-11 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold font-sans"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setMoreActionType('menu')}
                      className="flex-1 h-11 text-[10px] uppercase font-sans font-bold"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 text-[10px] bg-brand text-white border-none shadow-md uppercase font-sans font-bold"
                    >
                      Pay Bill
                    </Button>
                  </div>
                </form>
              )}

              {/* CHAMA POOL SCREEN */}
              {moreActionType === 'chama' && (
                <form onSubmit={handleChamaSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Select Chama Group</label>
                    <select 
                      value={chamaName}
                      onChange={(e) => setChamaName(e.target.value)}
                      className="w-full h-11 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold focus:outline-none font-sans"
                    >
                      <option value="Sacco Alpha Chama">Sacco Alpha Chama (12% APY)</option>
                      <option value="Sunrise Real Estate Chama">Sunrise Real Estate Chama (14.5% APY)</option>
                      <option value="Biashara Women Chamas">Biashara Women Chamas (10% APY)</option>
                      <option value="Equity Investment Group">Equity Investment Group (13.8% APY)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Contribution Amount (KES)</label>
                    <input 
                      type="number"
                      required
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full h-11 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold font-sans"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setMoreActionType('menu')}
                      className="flex-1 h-11 text-[10px] uppercase font-sans font-bold"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 text-[10px] bg-brand text-white border-none shadow-md uppercase font-sans font-bold"
                    >
                      Contribute
                    </Button>
                  </div>
                </form>
              )}

              {/* PEER GUARANTOR REQUEST SCREEN */}
              {moreActionType === 'guarantor_request' && (
                <form onSubmit={handleGuarantorRequestSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Sacco Peer Member Number</label>
                    <input 
                      type="text"
                      required
                      value={recipientId}
                      onChange={(e) => setRecipientId(e.target.value)}
                      placeholder="e.g. SS-2026-9912"
                      className="w-full h-11 bg-zinc-50 rounded-2xl px-3 border border-zinc-100 text-xs font-bold uppercase tracking-wider font-sans"
                    />
                  </div>

                  <p className="text-[9px] text-zinc-400 leading-relaxed font-sans font-semibold">
                    💡 This will dispatch an encrypted peer invitation to request the specified Sacco member to back up your prospective Loans. Guarantors assume co-liability for the loan portfolio as per bylaws.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setMoreActionType('menu')}
                      className="flex-1 h-11 text-[10px] uppercase font-sans font-bold"
                    >
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 h-11 text-[10px] bg-brand text-white border-none shadow-md uppercase font-sans font-bold"
                    >
                      Send Request
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Conversational AI Advisor Drawer */}
      <AnimatePresence>
        {showAiChat && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-[999] flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "155%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-[#111215] border border-zinc-800 text-zinc-100 rounded-t-[2.5rem] md:rounded-[2.5rem] p-6 w-full max-w-lg md:max-w-md h-[80vh] md:h-[70vh] flex flex-col justify-between shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] relative"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/20 flex items-center justify-center text-brand-light">
                    <Sparkles size={18} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-light">
                      SaccoSwift AI Advisor
                    </h4>
                    <span className="text-[8px] font-bold uppercase text-amber-gold flex items-center gap-1">
                      ● Active • Smart Teller & Planner
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAiChat(false)}
                  className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 font-black text-xs active:scale-90 transition-transform"
                >
                  ✕
                </button>
              </div>

              {/* Message History List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 no-scrollbar my-1 text-zinc-200">
                {chatMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={cn(
                      "max-w-[85%] rounded-[1.25rem] p-3 text-xs font-medium leading-relaxed font-sans",
                      msg.sender === 'user' 
                        ? "bg-brand text-white rounded-tr-none" 
                        : "bg-zinc-900 border border-zinc-800/80 text-zinc-200 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-light animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-light animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-light animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions Quick Chips */}
              <div className="py-2 border-t border-zinc-800 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth shrink-0">
                {[
                  "Am I eligible for a School Fees Loan?",
                  "Chonga Senti: how to save?",
                  "Explain KPLC paybill details",
                  "Explain SACCO Dividends"
                ].map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => sendMessageToAI(prompt)}
                    disabled={chatLoading}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[8px] font-black uppercase rounded-lg text-zinc-450 whitespace-nowrap active:scale-95 transition-transform"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>

              {/* Input & Dispatch Button Row */}
              <div className="pt-2.5 border-t border-zinc-800 flex gap-2 items-center shrink-0">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendMessageToAI();
                    }
                  }}
                  disabled={chatLoading}
                  placeholder="Ask SaccoSwift Advisor..."
                  className="flex-1 h-11 bg-zinc-900 border border-zinc-800 focus:border-brand-light outline-none rounded-xl px-3 text-xs font-bold text-zinc-100 placeholder:text-zinc-650"
                />
                <button
                  type="button"
                  onClick={() => sendMessageToAI()}
                  disabled={chatLoading}
                  className="w-11 h-11 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center text-white text-sm active:scale-95 transition-transform disabled:opacity-50"
                >
                  ➤
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountRow({ icon: Icon, label, balance, color, showBalance, isLoan, chartData, rate, suffix }: any) {
  const [expanded, setExpanded] = useState(false);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  const sampleChartData = chartData || [
    { name: 'W1', value: balance * 0.92 },
    { name: 'W2', value: balance * 0.95 },
    { name: 'W3', value: balance * 1.01 },
    { name: 'W4', value: balance }
  ];

  return (
    <motion.div 
      layout
      onClick={() => setExpanded(!expanded)}
      className="flex flex-col p-4 bg-white border border-zinc-100/50 rounded-3xl app-shadow cursor-pointer hover:shadow-md transition-all duration-300 overflow-hidden relative"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center relative", color)}>
            <Icon size={18} strokeWidth={2.5} />
            <div className="absolute inset-0 bg-current opacity-5 rounded-xl" />
          </div>
          <div>
            <p className="font-extrabold text-xs text-zinc-900">{label}</p>
            {rate && (
              <span className="text-[8px] font-black tracking-tight text-brand bg-brand/5 px-2 py-0.5 rounded-full uppercase mt-0.5 inline-block">
                ★ {rate} APY
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex items-center gap-2">
          <div>
            <p className="font-black text-xs text-zinc-800 tracking-tight">
              {showBalance ? formatCurrency(balance) : "••••"}
            </p>
            <p className="text-[8px] uppercase font-bold text-zinc-400 tracking-tighter">
              {isLoan ? "Total Payable" : "Available Balance"}
            </p>
          </div>
          <motion.div 
            animate={{ rotate: expanded ? 90 : 0 }} 
            className="text-zinc-400 p-0.5"
          >
            <ChevronRight size={14} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mt-4 pt-4 border-t border-zinc-100/80 space-y-4"
            onClick={(e) => e.stopPropagation()} // Prevent micro-expansion closing
          >
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-50/50 p-2 rounded-2xl text-center border border-zinc-100/20">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">YTD Growth</span>
                <span className="text-[9px] font-black text-emerald-600">
                  {showBalance ? "+18.2%" : "•••"}
                </span>
              </div>
              <div className="bg-zinc-50/50 p-2 rounded-2xl text-center border border-zinc-100/20">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Transfer Limit</span>
                <span className="text-[9px] font-black text-zinc-700">
                  {showBalance ? "No Limit" : "•••"}
                </span>
              </div>
              <div className="bg-zinc-50/50 p-2 rounded-2xl text-center border border-zinc-100/20">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Maturity</span>
                <span className="text-[9px] font-black text-brand-light">
                  {suffix || "Flexible"}
                </span>
              </div>
            </div>

            {/* Micro AreaChart trend */}
            <div className="h-28 w-full bg-zinc-50/30 rounded-2xl p-2 border border-zinc-100/40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampleChartData}>
                  <defs>
                    <linearGradient id={`grad-${label.replace(/[^a-zA-Z]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#015135" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#015135" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#015135" 
                    strokeWidth={2} 
                    fill={`url(#grad-${label.replace(/[^a-zA-Z]/g, '')})`} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: 'none', color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                    itemStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                    formatter={(val: number) => [formatCurrency(val), 'Balance']}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => alert(`Activated automated auto-saving loop for standard ${label}`)}
                className="flex-grow py-2 bg-brand text-white text-[9px] font-black rounded-xl uppercase tracking-wider hover:bg-brand-dark transition-colors"
              >
                Auto-Save
              </button>
              <button 
                onClick={() => alert(`Exporting historical micro-statement layout for ${label}`)}
                className="py-2 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 text-[9px] font-black rounded-xl uppercase tracking-wider transition-colors"
              >
                Statement
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
