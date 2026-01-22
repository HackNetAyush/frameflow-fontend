
import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-purple-500 blur-3xl opacity-20 rounded-full"></div>
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl relative z-10"
            >
                <Sparkles className="w-12 h-12 text-white" />
            </motion.div>
        </div>

        <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-white mb-2"
        >
            Xplainer AI
        </motion.h1>
        
        <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 mb-8"
        >
            Preparing things for you...
        </motion.p>

        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
        </div>
        
        <p className="mt-4 text-xs text-slate-500 flex items-center">
            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
            Loading Video Engine (FFmpeg)
        </p>
    </div>
  );
};

export default LoadingScreen;
