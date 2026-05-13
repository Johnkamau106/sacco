import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wallet, Landmark, History, ShieldCheck, LogOut, Menu, X, BotMessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Landmark, label: 'Loans', path: '/loans' },
  { icon: Wallet, label: 'Savings', path: '/savings' },
  { icon: History, label: 'History', path: '/transactions' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row pb-24 md:pb-0">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex flex-col w-72 glass border-r h-screen sticky top-0 px-6 py-10">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-brand tracking-tighter">SaccoSwift</h1>
          <p className="text-[10px] uppercase font-black text-zinc-400 tracking-widest mt-1">Modern Banking</p>
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
                  ? "bg-amber-100 text-amber-700 shadow-xl shadow-amber-900/10 font-bold"
                  : "text-amber-600/70 hover:bg-amber-50 hover:text-amber-700"
              )}
            >
              <ShieldCheck size={22} />
              <span>Admin Control</span>
            </Link>
          )}
        </nav>

        <div className="mt-auto space-y-4 pt-6 border-t border-zinc-100">
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
             className="w-full flex items-center gap-3 px-5 py-3 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
           >
             <LogOut size={18} />
             <span className="text-sm font-bold">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* App Header (Mobile) */}
        <header className="md:hidden glass sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
           <h1 className="text-xl font-black text-brand tracking-tighter">SaccoSwift</h1>
           <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 nav-blur border-t border-zinc-100 px-6 pt-3 pb-8 flex justify-between items-center safe-p-b">
         {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300",
                location.pathname === item.path ? "text-brand scale-110" : "text-zinc-400"
              )}
            >
              <div className={cn(
                "p-2 rounded-2xl transition-all",
                location.pathname === item.path && "bg-brand/10"
              )}>
                <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                location.pathname === item.path ? "opacity-100" : "opacity-0 invisible"
              )}>
                {item.label}
              </span>
            </Link>
         ))}
      </nav>
    </div>
  );
}
