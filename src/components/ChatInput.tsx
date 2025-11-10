import { useState } from 'react';
import { Send, Plus } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, placeholder = "How can I help you today?", disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 bg-slate-800 rounded-2xl px-4 py-3 border border-slate-700 focus-within:border-primary transition-colors">
          <button
            type="button"
            className="text-slate-400 hover:text-slate-300 transition-colors"
            disabled={disabled}
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-slate-100 placeholder-slate-500"
            disabled={disabled}
          />
          
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="bg-primary hover:bg-primary-hover text-white rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
