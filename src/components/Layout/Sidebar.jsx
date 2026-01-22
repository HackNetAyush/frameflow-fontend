
import React from 'react';
import { Sparkles, Video, Play, Database, History, Zap } from 'lucide-react';

const Sidebar = ({ onPromptSelect }) => {
  const examples = [
    { icon: "⚛️", title: "Explain quantum physics", desc: "Understand the fundamentals of quantum mechanics" },
    { icon: "🌱", title: "How does photosynthesis work?", desc: "Learn how plants convert sunlight into energy" },
    { icon: "🤖", title: "The history of AI", desc: "Explore AI's evolution from inception to today" },
    { icon: "⛓️", title: "Blockchain technology", desc: "Demystify how blockchain and crypto work" },
  ];

  return (
    <div className="hidden lg:flex w-80 flex-col h-full bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-6 overflow-y-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-gradient-to-tr from-purple-600 to-blue-600 p-2 rounded-xl shadow-lg shadow-purple-500/20">
          <Video className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
          Xplainer AI
        </h1>
      </div>

      <div className="mb-8">
        <div className="flex items-center text-sm font-semibold text-purple-300 mb-4 px-2 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 mr-2" />
          Features
        </div>
        <div className="space-y-2">
          {[
            { icon: Zap, label: "Instant Generation" },
            { icon: Play, label: "HD Video Export" },
            { icon: Database, label: "Smart Knowledge Base" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center p-3 rounded-xl bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10 transition-colors cursor-default">
              <item.icon className="w-4 h-4 mr-3 text-purple-400" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center text-sm font-semibold text-purple-300 mb-4 px-2 uppercase tracking-wider">
          <History className="w-4 h-4 mr-2" />
          Quick Examples
        </div>
        <div className="space-y-3">
          {examples.map((ex, idx) => (
            <button
              key={idx}
              onClick={() => onPromptSelect(ex.title)}
              className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/5 hover:border-purple-500/30 transition-all group"
            >
              <div className="flex items-start">
                <span className="text-xl mr-3 group-hover:scale-110 transition-transform">{ex.icon}</span>
                <div>
                  <h3 className="text-sm font-medium text-slate-200 group-hover:text-purple-100">{ex.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{ex.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-6">
        <div className="bg-gradient-to-br from-purple-900/50 to-slate-900/50 p-4 rounded-2xl border border-white/10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-purple-500/20 blur-2xl rounded-full"></div>
            <p className="text-sm text-purple-200 font-medium relative z-10">Running locally using WebAssembly & FFmpeg Core</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
