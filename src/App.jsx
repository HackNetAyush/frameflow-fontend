
import React, { useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import Sidebar from './components/Layout/Sidebar';
import ChatMessage from './components/Chat/ChatMessage';

import ProgressOverlay from './components/Video/ProgressOverlay';
import LoadingScreen from './components/Layout/LoadingScreen';
import { useChat } from './hooks/useChat';
import { useVideoGenerator } from './hooks/useVideoGenerator';



function App() {
  const { messages, addMessage } = useChat();
  const { processRequest, status, progress, error, videoUrl, canvasRef, isEngineLoaded } = useVideoGenerator();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const [activeRequestPrompt, setActiveRequestPrompt] = React.useState(null);

  const handleSend = async () => {
    const text = inputRef.current.value.trim();
    if (!text) return;
    
    inputRef.current.value = '';
    addMessage('user', text);
    setActiveRequestPrompt(text);
    
    // Process request
    processRequest(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptSelect = (prompt) => {
    inputRef.current.value = prompt;
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Handle side-effects of generation status
  useEffect(() => {
    if (status === 'done' && videoUrl) {
         addMessage('bot', '', 'video', { videoUrl, prompt: activeRequestPrompt });
    }
    if (status === 'error' && error) {
        addMessage('bot', `Sorry, I encountered an error: ${error}`, 'error');
    }
  }, [status, videoUrl, error]);

  const isGenerating = status !== 'idle' && status !== 'done' && status !== 'error';

  if (!isEngineLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-purple-500/30">
      <Sidebar onPromptSelect={handlePromptSelect} />

      <main className="flex-1 flex flex-col relative">
        {/* Header */}
        <header className="absolute top-0 w-full z-10 p-4 bg-gradient-to-b from-slate-950 to-transparent">
            <div className="lg:hidden flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">Xplainer AI</span>
            </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-20 pb-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
             <div className="max-w-3xl mx-auto">
                {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                
                {isGenerating && (
                    <div className="mb-6 fade-in">
                        <ChatMessage 
                            message={{
                                role: 'bot',
                                content: `Creating video for you...`
                            }} 
                        />
                        <div className="pl-14">
                            <ProgressOverlay status={status} progress={progress} />
                        </div>
                    </div>
                )}

                {status === 'done' && videoUrl && (
                    <div className="hidden" /> /* Placeholder to keep logic cleaner, handled by useEffect now */
                )}
                
                <div ref={chatEndRef} />
             </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/50 backdrop-blur-md border-t border-white/5">
            <div className="max-w-3xl mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl rounded-xl -z-10"></div>
                <div className="bg-slate-800/80 border border-white/10 rounded-xl flex items-center p-2 shadow-2xl focus-within:ring-2 focus-within:ring-purple-500/50 transition-all">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="What would you like to learn today?"
                        className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-slate-400"
                        onKeyDown={handleKeyDown}
                        disabled={isGenerating}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isGenerating}
                        className="p-3 bg-purple-600 hover:bg-purple-500 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-center text-xs text-slate-500 mt-2">
                    AI generated content can be inaccurate.
                </p>
            </div>
        </div>

        {/* Hidden Canvas - THE ENGINE */}
        <canvas 
            ref={canvasRef} 
            width={1280} 
            height={720} 
            className="hidden absolute pointer-events-none opacity-0" 
        />
      </main>
    </div>
  );
}

export default App;
