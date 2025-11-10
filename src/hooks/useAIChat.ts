import { useState } from 'react';
import { generateWizardResponse, isOpenAIConfigured } from '../services/openaiService';
import type { ChatContext } from '../services/openaiService';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useAIChat() {
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const sendMessage = async (
    userMessage: string,
    context: ChatContext
  ): Promise<string> => {
    if (!isOpenAIConfigured()) {
      return "⚠️ OpenAI API key not configured. Please add your API key to .env.local and restart the server.\n\nFor now, I'll use a simplified flow. Type your agent name to continue.";
    }
    
    setIsGenerating(true);
    
    try {
      const response = await generateWizardResponse(
        userMessage,
        context,
        conversationHistory
      );
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: response },
      ]);
      
      return response;
    } catch (error) {
      console.error('AI Chat error:', error);
      return 'I apologize, but I encountered an error. Please try again or check your API key configuration.';
    } finally {
      setIsGenerating(false);
    }
  };
  
  const resetConversation = () => {
    setConversationHistory([]);
  };
  
  return {
    sendMessage,
    resetConversation,
    isGenerating,
    conversationHistory,
  };
}
