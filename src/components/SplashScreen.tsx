import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center text-white overflow-hidden"
    >
      {/* Background Animated Orbs representing Safari Dusk Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C1272D] rounded-full blur-[140px] opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-[#D4A017] rounded-full blur-[140px] opacity-10 animate-pulse [animation-delay:2s]" />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 1.2, 
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex flex-col items-center gap-6 relative z-10"
      >
        {/* Shield outline simulating Maasai bravery and community trust */}
        <div className="relative flex items-center justify-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            className="absolute w-32 h-32 rounded-full border border-dashed border-brand-gold/30 p-2"
          />
          <div className="w-24 h-24 bg-gradient-to-tr from-[#C1272D] to-[#D4A017] rounded-[2.2rem] flex items-center justify-center relative shadow-2xl">
            {/* Elegant shield silhouette */}
            <span className="text-white text-3xl font-black italic tracking-tighter">S★S</span>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter text-white">SaccoSwift</h1>
          {/* Swahili signature message */}
          <p className="text-brand-gold font-black tracking-widest uppercase text-[10px] space-x-1">
            USTAWI WA PAMOJA • SAFARI TO FINANCIAL FREEDOM
          </p>
        </div>
      </motion.div>
      
      {/* Repeating miniature Maasai bead border divider at splash bottom */}
      <div className="absolute bottom-16 left-12 right-12 flex flex-col items-center gap-4">
        <div className="w-16 maasai-bead-divider" />
        <p className="text-[10px] font-black tracking-widest uppercase text-zinc-500 animate-pulse">
          MEMBER BIOMETRIC ID SAFEGUARDED
        </p>
      </div>
    </motion.div>
  );
}
