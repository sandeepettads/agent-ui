import { create } from 'zustand';
import type { ChatMessage, Tool, MCPServer, KnowledgeBase, LLMProfile, Persona, WizardStep, CatalogIndex } from '../types/catalog.types';

interface WizardState {
  // Catalog data
  catalog: CatalogIndex | null;
  setCatalog: (catalog: CatalogIndex) => void;
  
  // Wizard steps
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;
  
  // Chat history
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  
  // Phase 1: Identity
  agentName: string;
  displayName: string;
  goal: string;
  setAgentName: (name: string) => void;
  setDisplayName: (name: string) => void;
  setGoal: (goal: string) => void;
  
  // Phase 2: Selections
  selectedPersona: Persona | null;
  selectedLLMProfile: LLMProfile | null;
  selectedTools: Tool[];
  selectedKnowledgeBases: KnowledgeBase[];
  setSelectedPersona: (persona: Persona | null) => void;
  setSelectedLLMProfile: (profile: LLMProfile | null) => void;
  setSelectedTools: (tools: Tool[]) => void;
  setSelectedKnowledgeBases: (kbs: KnowledgeBase[]) => void;
  
  // Auto-resolved dependencies
  autoIncludedServers: MCPServer[];
  setAutoIncludedServers: (servers: MCPServer[]) => void;
  
  // Phase 3: Generated Content
  generatedBackstory: string;
  generatedSystemPrompt: string;
  setGeneratedBackstory: (backstory: string) => void;
  setGeneratedSystemPrompt: (prompt: string) => void;
  
  // Phase 4: Final YAML
  finalYAML: string;
  setFinalYAML: (yaml: string) => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  
  // Actions
  reset: () => void;
}

const initialState = {
  catalog: null,
  currentStep: 'welcome' as WizardStep,
  messages: [],
  agentName: '',
  displayName: '',
  goal: '',
  selectedPersona: null,
  selectedLLMProfile: null,
  selectedTools: [],
  selectedKnowledgeBases: [],
  autoIncludedServers: [],
  generatedBackstory: '',
  generatedSystemPrompt: '',
  finalYAML: '',
  isLoading: false,
  error: null,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initialState,
  
  setCatalog: (catalog) => set({ catalog }),
  
  setCurrentStep: (currentStep) => set({ currentStep }),
  
  addMessage: (message) => set((state) => ({
    messages: [
      ...state.messages,
      {
        ...message,
        id: `msg-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      },
    ],
  })),
  
  setAgentName: (agentName) => set({ agentName }),
  setDisplayName: (displayName) => set({ displayName }),
  setGoal: (goal) => set({ goal }),
  
  setSelectedPersona: (selectedPersona) => set({ selectedPersona }),
  setSelectedLLMProfile: (selectedLLMProfile) => set({ selectedLLMProfile }),
  setSelectedTools: (selectedTools) => set({ selectedTools }),
  setSelectedKnowledgeBases: (selectedKnowledgeBases) => set({ selectedKnowledgeBases }),
  
  setAutoIncludedServers: (autoIncludedServers) => set({ autoIncludedServers }),
  
  setGeneratedBackstory: (generatedBackstory) => set({ generatedBackstory }),
  setGeneratedSystemPrompt: (generatedSystemPrompt) => set({ generatedSystemPrompt }),
  
  setFinalYAML: (finalYAML) => set({ finalYAML }),
  
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}));
