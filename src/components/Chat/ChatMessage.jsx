
import React from 'react';
import { Bot, User, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import VideoPlayer from '../Video/VideoPlayer';

const ChatMessage = ({ message }) => {
  const isBot = message.role === 'bot';
  
  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx("flex w-full mb-6", isBot ? "justify-start" : "justify-end")}
    >
      <div className={clsx("flex w-full", isBot ? "flex-row" : "flex-row-reverse", 
        message.type === 'video' ? "max-w-full" : "max-w-[85%] md:max-w-[75%]"
      )}>
        {/* Avatar */}
        <div className={clsx(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
            isBot ? "mr-3 bg-gradient-to-br from-purple-500 to-indigo-600" : "ml-3 bg-slate-700"
        )}>
            {isBot ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-slate-300" />}
        </div>

        {/* Content */}
        {message.type === 'video' ? (
             <div className="w-full max-w-4xl">
                <VideoPlayer videoUrl={message.videoUrl} prompt={message.prompt} />
             </div>
        ) : (
            <div className={clsx(
                "p-4 rounded-2xl shadow-md text-sm md:text-base leading-relaxed",
                isBot ? "bg-slate-800/80 text-custom-gray-100 rounded-tl-none border border-white/5" : "bg-purple-600 text-white rounded-tr-none"
            )}>
                {message.type === 'error' ? (
                    <div className="flex items-center text-red-300">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {message.content}
                    </div>
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: message.content }} />
                )}
            </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;
