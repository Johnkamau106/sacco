import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Landmark, History, ShieldCheck, LogOut, Menu, X, BotMessageSquare, CreditCard, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: CreditCard, label: 'Payments', path: '/transactions' },
  { icon: Landmark, label: 'Loans', path: '/loans' },
  { icon: Wallet, label: 'Savings', path: '/savings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = React.useState(true);

  React.useEffect(() => {
    document.body.classList.add('dark');
    localStorage.setItem('saccoswift_theme', 'dark');
  }, []);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext || (window as any).AudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Audio blocked
    }
  };

  const toggleTheme = () => {
    playChime();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col md:flex-row pb-24 md:pb-0 transition-colors duration-300",
      dark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900"
    )}>
      {/* Sidebar (Desktop Only) */}
      <aside className={cn(
        "hidden md:flex flex-col w-72 h-screen sticky top-0 px-6 py-10 transition-colors duration-300",
        dark ? "bg-[#111215] border-r border-zinc-800 text-zinc-100" : "bg-white border-r border-zinc-100 text-zinc-900"
      )}>
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-brand tracking-tighter">SaccoSwift</h1>
            <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mt-1">Super Fintech</p>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-zinc-100/50 dark:bg-zinc-800 hover:scale-105 active:scale-95 transition-all text-brand"
            title="Toggle theme"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300",
                location.pathname === item.path
                  ? "bg-brand text-white shadow-xl shadow-brand/20 font-bold"
                  : dark 
                    ? "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon size={22} />
              <span>{item.label}</span>
            </Link>
          ))}

          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 mt-8",
                location.pathname === '/admin'
                  ? "bg-amber-500 text-zinc-950 shadow-xl shadow-amber-900/10 font-bold"
                  : "text-amber-500 hover:bg-amber-500/10"
              )}
            >
              <ShieldCheck size={22} />
              <span>Admin Control</span>
            </Link>
          )}
        </nav>

        <div className={cn(
          "mt-auto space-y-4 pt-6 border-t",
          dark ? "border-zinc-800" : "border-zinc-105"
        )}>
           <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black text-sm">
                {profile?.fullName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{profile?.fullName}</p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase truncate tracking-wider">{profile?.memberNumber}</p>
              </div>
           </div>
           <button 
             onClick={handleLogout}
             className={cn(
               "w-full flex items-center gap-3 px-5 py-3 rounded-xl transition-all",
               dark ? "text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10" : "text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
             )}
           >
             <LogOut size={18} />
             <span className="text-sm font-bold">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* App Header (Mobile) */}
        <header className={cn(
          "md:hidden sticky top-0 z-40 px-6 py-4 flex items-center justify-between transition-colors duration-300",
          dark ? "bg-[#111215] border-b border-zinc-800 text-zinc-100" : "bg-white/90 backdrop-blur-xl border-b border-zinc-100 text-zinc-900"
        )}>
           <h1 className="text-xl font-black text-brand tracking-tighter">SaccoSwift</h1>
           <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-sm"
              >
                {dark ? '☀️' : '🌙'}
              </button>
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <BotMessageSquare size={18} />
              </div>
              <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center text-sm font-black ring-4 ring-brand/10">
                {profile?.fullName?.[0]}
              </div>
           </div>
        </header>

        <main className="flex-1 px-5 md:px-12 py-6 md:py-12 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {children}
        </main>
      </div>

      {/* Bottom Tab Bar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t px-4 pt-2.5 pb-6 flex justify-between items-center safe-p-b bg-[#111215] border-zinc-800">
         {/* Tab 1: Home */}
         <Link 
           to="/"
           className={cn(
             "flex flex-col items-center gap-1 transition-all duration-300 flex-1",
             location.pathname === "/" ? "text-[#C1272D] scale-110" : "text-zinc-400"
           )}
         >
           <div className={cn(
             "p-1.5 rounded-xl transition-all",
             location.pathname === "/" && "bg-[#C1272D]/10"
           )}>
             <LayoutDashboard size={20} strokeWidth={location.pathname === "/" ? 2.5 : 2} />
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 scale-90">
             Home
           </span>
         </Link>

         {/* Tab 2: Payments */}
         <Link 
           to="/transactions"
           className={cn(
             "flex flex-col items-center gap-1 transition-all duration-300 flex-1",
             location.pathname === "/transactions" ? "text-[#C1272D] scale-110" : "text-zinc-400"
           )}
         >
           <div className={cn(
             "p-1.5 rounded-xl transition-all",
             location.pathname === "/transactions" && "bg-[#C1272D]/10"
           )}>
             <CreditCard size={20} strokeWidth={location.pathname === "/transactions" ? 2.5 : 2} />
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 scale-90">
             Payments
           </span>
         </Link>

         {/* Tab 3: Center Gold Stamp Button (Sente AI Assistant Global Dialog) */}
         <div className="flex-1 flex justify-center -mt-6">
            <button 
              onClick={() => {
                playChime();
                // Send custom window event to open AI advisor from anywhere in the application
                window.dispatchEvent(new CustomEvent('open-sente-ai'));
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#C1272D] via-[#D4A017] to-[#0F8B6D] p-0.5 shadow-2xl active:scale-90 transition-transform relative group"
            >
               <div className="w-full h-full rounded-full bg-[#121212] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#D4A017_0%,_transparent_70%)] opacity-20" />
                  {/* Miniature beautiful gold shield symbol or stamp */}
                  <span className="text-[#D4A017] font-black text-sm italic tracking-tighter z-10">S★S</span>
               </div>
               <div className="absolute -inset-1 rounded-full bg-[#D4A017]/20 blur-md animate-pulse pointer-events-none" />
            </button>
         </div>

         {/* Tab 4: Loans */}
         <Link 
           to="/loans"
           className={cn(
             "flex flex-col items-center gap-1 transition-all duration-300 flex-1",
             location.pathname === "/loans" ? "text-[#C1272D] scale-110" : "text-zinc-400"
           )}
         >
           <div className={cn(
             "p-1.5 rounded-xl transition-all",
             location.pathname === "/loans" && "bg-[#C1272D]/10"
           )}>
             <Landmark size={20} strokeWidth={location.pathname === "/loans" ? 2.5 : 2} />
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 scale-90">
             Loans
           </span>
         </Link>

         {/* Tab 5: Profile (Savings page acts as user wealth profile) */}
         <Link 
           to="/savings"
           className={cn(
             "flex flex-col items-center gap-1 transition-all duration-300 flex-1",
             location.pathname === "/savings" ? "text-[#C1272D] scale-110" : "text-zinc-400"
           )}
         >
           <div className={cn(
             "p-1.5 rounded-xl transition-all",
             location.pathname === "/savings" && "bg-[#C1272D]/10"
           )}>
             <User size={20} strokeWidth={location.pathname === "/savings" ? 2.5 : 2} />
           </div>
           <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 scale-90">
             Profile
           </span>
         </Link>
      </nav>
    </div>
  );
}
