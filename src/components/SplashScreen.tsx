import React from 'react';
import { motion } from 'motion/react';
import { Landmark } from 'lucide-react';

export default function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] bg-brand flex flex-col items-center justify-center text-white"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0, 0.71, 0.2, 1.01],
          scale: {
            type: "spring",
            damping: 12,
            stiffness: 100,
          }
        }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-24 h-24 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-md">
          <Landmark size={48} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tighter">SaccoSwift</h1>
          <p className="text-white/60 font-medium tracking-widest uppercase text-[10px] mt-1 space-x-1">
            Growing Together
          </p>
        </div>
      </motion.div>
      
      <div className="absolute bottom-12 flex flex-col items-center gap-2">
        <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
            Securely Connecting...
        </p>
      </div>
    </motion.div>
  );
}
