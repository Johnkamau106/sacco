import React from 'react';
import { cn } from '../lib/utils';

export const Card = ({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) => (
  <div 
    onClick={onClick}
    className={cn(
      "bg-white p-5 rounded-[2rem] border border-zinc-100/50 app-shadow transition-all duration-300", 
      onClick && "active:scale-95 cursor-pointer",
      className
    )}
  >
    {children}
  </div>
);

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost', size?: 'sm' | 'md' | 'lg' }) => {
  const variants = {
    primary: 'bg-brand text-white shadow-xl shadow-brand/20 active:scale-95',
    secondary: 'bg-zinc-100 text-zinc-900 active:scale-95 hover:bg-zinc-200',
    outline: 'bg-transparent border-2 border-zinc-100 text-zinc-600 active:scale-95 hover:border-zinc-200',
    danger: 'bg-rose-50 text-rose-600 border border-rose-100 active:scale-95',
    ghost: 'bg-transparent text-zinc-500 hover:bg-zinc-50 active:scale-95',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-4 text-xs',
    lg: 'px-8 py-5 text-sm',
  };

  return (
    <button 
      className={cn(
        "rounded-[1.25rem] font-black uppercase tracking-widest transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({ label, error, icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, error?: string, icon?: any }) => (
  <div className="space-y-2">
    {label && <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">{label}</label>}
    <div className="relative">
      {Icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400"><Icon size={20} /></div>}
      <input 
        className={cn(
          "w-full px-6 py-5 rounded-[1.5rem] bg-zinc-100/50 border-0 focus:ring-4 focus:ring-brand/10 focus:bg-white transition-all outline-none font-bold text-sm text-zinc-900 placeholder:text-zinc-300 placeholder:font-medium",
          Icon && "pl-14",
          error && "ring-4 ring-rose-500/10 bg-rose-50/50"
        )}
        {...props}
      />
    </div>
    {error && <p className="text-[10px] font-black text-rose-600 mt-1 ml-1 uppercase tracking-tighter">{error}</p>}
  </div>
);

export const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error', className?: string }) => {
  const variants = {
    default: 'bg-zinc-100 text-zinc-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-rose-50 text-rose-600',
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest", variants[variant], className)}>
      {children}
    </span>
  );
};
