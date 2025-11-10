import { Bot, User } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types/catalog.types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === 'bot';
  
  return (
    <div className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
        isBot 
          ? 'bg-slate-800 text-slate-100' 
          : 'bg-primary text-white'
      }`}>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        {message.data && (
          <div className="mt-2">
            {message.data}
          </div>
        )}
      </div>
      
      {!isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
          <User className="w-5 h-5 text-slate-300" />
        </div>
      )}
    </div>
  );
}
