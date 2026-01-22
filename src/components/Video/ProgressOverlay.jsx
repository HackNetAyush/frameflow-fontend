
import React, { useEffect, useState } from 'react';
import { Loader2, Film, Music, MonitorPlay, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProgressOverlay = ({ status, progress }) => {
  const [funFact, setFunFact] = useState("");
  
  const facts = [
    "Our AI analyzes thousands of educational videos to create the best content.",
    "Videos are typically rendered at 30 frames per second for smoothness.",
    "We use neural networks to synthesize human-like speech.",
    "Canvas rendering allows for infinite scalability without server GPUs.",
  ];

  useEffect(() => {
    setFunFact(facts[Math.floor(Math.random() * facts.length)]);
    const interval = setInterval(() => {
        setFunFact(facts[Math.floor(Math.random() * facts.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { id: 'generating_script', icon: Film, label: "Writing Script" },
    { id: 'generating_audio', icon: Music, label: "Synthesizing Audio" },
    { id: 'rendering', icon: MonitorPlay, label: "Rendering Visuals" },
    { id: 'merging', icon: CheckCircle2, label: "Finalizing" },
  ];

  const currentStepIdx = steps.findIndex(s => s.id === status) || 0;

  return (
    <div className="w-full max-w-lg mx-auto my-6">
        <div className="bg-[#0f111a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl shadow-purple-900/10 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="text-white font-medium flex items-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin text-purple-400" />
                        Generating Video...
                     </h3>
                     <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                        {Math.round(progress)}%
                     </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden mb-8">
                    <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-75 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Steps */}
                <div className="grid grid-cols-4 gap-2 mb-6 relative">
                    {/* Connecting line */}
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-slate-700 -z-10"></div>
                    
                    {steps.map((step, idx) => {
                        const isActive = steps.findIndex(s => s.id === status) >= idx;
                        const isCurrent = status === step.id;
                        
                        return (
                            <div key={step.id} className="flex flex-col items-center text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors duration-300 ${isActive ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-700 text-slate-400'}`}>
                                    <step.icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${isActive ? 'text-purple-300' : 'text-slate-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* <div className="text-center">
                    <p className="text-slate-400 text-sm italic">
                        "{funFact}"
                    </p>
                </div> */}
            </div>
        </div>
    </div>
  );
};

export default ProgressOverlay;
