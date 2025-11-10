import { useEffect, useRef } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useWizardStore } from './store/wizardStore';
import { loadFullCatalog } from './services/catalogService';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ComponentSelector } from './components/ComponentSelector';
import { YAMLPreview } from './components/YAMLPreview';
import { assembleAgentCRD, resolveToolDependencies } from './utils/yamlAssembler';
import { useAIChat } from './hooks/useAIChat';
import { generateBackstory, generateSystemPrompt, refineContent, isOpenAIConfigured } from './services/openaiService';

function App() {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  
  const {
    catalog,
    setCatalog,
    messages,
    addMessage,
    agentName,
    displayName,
    goal,
    setAgentName,
    setDisplayName,
    setGoal,
    selectedPersona,
    selectedLLMProfile,
    selectedTools,
    selectedKnowledgeBases,
    setSelectedPersona,
    setSelectedLLMProfile,
    setSelectedTools,
    setSelectedKnowledgeBases,
    autoIncludedServers,
    setAutoIncludedServers,
    generatedBackstory,
    generatedSystemPrompt,
    setGeneratedBackstory,
    setGeneratedSystemPrompt,
    finalYAML,
    setFinalYAML,
    isLoading,
    setIsLoading,
    error,
    setError,
    currentStep,
    setCurrentStep,
  } = useWizardStore();
  
  // AI Chat integration
  const { sendMessage: sendAIMessage, isGenerating } = useAIChat();
  
  // Load catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      // Prevent duplicate initialization in StrictMode
      if (hasInitialized.current) {
        return;
      }
      hasInitialized.current = true;
      
      setIsLoading(true);
      setError(null);
      try {
        const fullCatalog = await loadFullCatalog();
        setCatalog(fullCatalog);
        setCurrentStep('identity');
        
        // Generate AI-powered welcome message
        if (isOpenAIConfigured()) {
          const welcomeMessage = await sendAIMessage(
            "Start a friendly, welcoming conversation with the user to help them build an Agent CRD. Introduce yourself as the Agent Builder Wizard assistant, explain that you'll guide them through creating a Kubernetes Agent configuration, and ask for their agent's name with examples.",
            { currentStep: 'identity' }
          );
          addMessage({
            role: 'bot',
            content: welcomeMessage,
          });
        } else {
          // Fallback welcome message
          addMessage({
            role: 'bot',
            content: "⚠️ OpenAI API not configured. Using basic mode.\n\nWelcome to the Agent Builder Wizard! Let's create your agent.\n\nWhat would you like to name your agent? (e.g., 'patient-care-coordinator')",
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load catalog');
        console.error('Error loading catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (!catalog && !isLoading) {
      loadCatalog();
    }
  }, []);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Handle tool selection dependency resolution
  useEffect(() => {
    if (catalog && selectedTools.length > 0) {
      const requiredServers = resolveToolDependencies(
        selectedTools,
        catalog.components.mcpServers
      );
      setAutoIncludedServers(requiredServers);
    } else {
      setAutoIncludedServers([]);
    }
  }, [selectedTools, catalog]);
  
  const handleUserMessage = async (message: string) => {
    addMessage({ role: 'user', content: message });
    
    // Build context for AI
    const context = {
      agentName,
      displayName,
      goal,
      selectedPersona,
      selectedTools,
      selectedKnowledgeBases,
      currentStep,
    };
    
    // AI-powered conversation handling
    if (currentStep === 'identity') {
      if (!agentName) {
        setAgentName(message);
        const response = await sendAIMessage(
          `User wants to name their agent: "${message}". Ask for a human-friendly display name with an example.`,
          context
        );
        addMessage({ role: 'bot', content: response });
      } else if (!displayName) {
        setDisplayName(message);
        const response = await sendAIMessage(
          `User set display name as: "${message}". Now ask them to describe the agent's primary goal in one sentence.`,
          context
        );
        addMessage({ role: 'bot', content: response });
      } else if (!goal) {
        setGoal(message);
        setCurrentStep('persona');
        const response = await sendAIMessage(
          `User set goal as: "${message}". Now guide them to select a persona from the available options. Be encouraging about their progress.`,
          { ...context, goal: message }
        );
        addMessage({
          role: 'bot',
          content: response + '\n\nPlease select a persona below:',
          type: 'component-selection',
        });
      }
    } else if (currentStep === 'content-generation') {
      // AI-powered content refinement
      await handleAIContentRefinement(message);
    } else {
      // General AI conversation
      const response = await sendAIMessage(message, context);
      addMessage({ role: 'bot', content: response });
    }
  };
  
  const handlePersonaSelection = async (personaIds: string[]) => {
    if (!catalog || personaIds.length === 0) return;
    
    const persona = catalog.components.personas.find(p => p.id === personaIds[0]);
    if (persona) {
      setSelectedPersona(persona);
      setCurrentStep('llm');
      
      // AI-powered response
      const context = { agentName, displayName, goal, selectedPersona: persona, currentStep: 'llm' };
      const response = await sendAIMessage(
        `The user selected the "${persona.displayName}" persona (${persona.description}). Acknowledge their choice positively and guide them to select an LLM profile. Explain briefly what LLM profiles control (thinking style, precision vs creativity).`,
        context
      );
      
      addMessage({
        role: 'bot',
        content: response + '\n\nPlease select an LLM profile below:',
        type: 'component-selection',
      });
    }
  };
  
  const handleLLMSelection = async (profileIds: string[]) => {
    if (!catalog || profileIds.length === 0) return;
    
    const profile = catalog.components.llmProfiles.find(p => p.id === profileIds[0]);
    if (profile) {
      setSelectedLLMProfile(profile);
      setCurrentStep('tools');
      
      // AI-powered response
      const context = { agentName, displayName, goal, selectedPersona, currentStep: 'tools' };
      const response = await sendAIMessage(
        `The user selected "${profile.displayName}" (temperature: ${profile.temperature}). Acknowledge their choice and explain they can now select tools (agent capabilities). Mention they can select multiple and that required servers will be auto-included.`,
        context
      );
      
      addMessage({
        role: 'bot',
        content: response + '\n\nSelect tools below (multi-select):',
        type: 'component-selection',
      });
    }
  };
  
  const handleToolsSelection = async (toolIds: string[]) => {
    if (!catalog) return;
    
    const tools = catalog.components.tools.filter(t => toolIds.includes(t.id));
    setSelectedTools(tools);
    
    if (toolIds.length > 0) {
      setCurrentStep('knowledge-bases');
      const serverCount = autoIncludedServers.length;
      
      // AI-powered response
      const toolNames = tools.map(t => t.displayName).join(', ');
      const context = { agentName, displayName, goal, selectedPersona, selectedTools: tools, currentStep: 'knowledge-bases' };
      const response = await sendAIMessage(
        `The user selected ${toolIds.length} tools: ${toolNames}. The system automatically included ${serverCount} required MCP server(s). Acknowledge this positively and explain knowledge bases (RAG sources for context). Ask if they want to add any knowledge bases (optional).`,
        context
      );
      
      addMessage({
        role: 'bot',
        content: response + '\n\nSelect knowledge bases below (optional):',
        type: 'component-selection',
      });
    }
  };
  
  const handleKnowledgeBaseSelection = (kbIds: string[]) => {
    if (!catalog) return;
    
    const kbs = catalog.components.knowledgeBases.filter(kb => kbIds.includes(kb.id));
    setSelectedKnowledgeBases(kbs);
    setCurrentStep('content-generation');
    
    // Generate content
    generateAgentContent();
  };
  
  const generateAgentContent = async () => {
    if (!selectedPersona) return;
    
    setIsLoading(true);
    
    try {
      // AI-powered content generation
      if (isOpenAIConfigured()) {
        const [backstory, systemPrompt] = await Promise.all([
          generateBackstory(goal, selectedPersona, selectedTools),
          generateSystemPrompt(goal, selectedPersona, selectedTools, selectedKnowledgeBases),
        ]);
        
        setGeneratedBackstory(backstory);
        setGeneratedSystemPrompt(systemPrompt);
        
        addMessage({
          role: 'bot',
          content: `✨ I've generated your agent's backstory and system prompt using AI!\n\nReview them below. You can ask me to refine them:\n- "Add more emphasis on data security"\n- "Make the tone more formal"\n- "Include HIPAA compliance guidelines"\n\nOr type "looks good" when you're ready to proceed.`,
        });
      } else {
        // Fallback to template-based generation
        const backstory = `I am an experienced ${selectedPersona.displayName.toLowerCase()} with expertise in ${selectedPersona.domain.toLowerCase()}. My communication style is ${selectedPersona.tone.toLowerCase()}, and I specialize in helping teams achieve their goals through ${goal.toLowerCase()}.`;
        
        const systemPrompt = `You are a ${selectedPersona.template?.personaTemplate.agentType} responsible for ${goal}

Your primary responsibilities include:
- Execute tasks aligned with the defined goal
- Maintain ${selectedPersona.template?.personaTemplate.tone} communication style
- Leverage available tools and knowledge bases effectively

Focus areas: ${selectedPersona.template?.personaTemplate.topics.join(', ')}`;
        
        setGeneratedBackstory(backstory);
        setGeneratedSystemPrompt(systemPrompt);
        
        addMessage({
          role: 'bot',
          content: `⚠️ OpenAI API not configured. Using template-based generation.\n\nReview the content below. Type "looks good" to proceed to the final preview.`,
        });
      }
    } catch (error) {
      console.error('Content generation error:', error);
      addMessage({
        role: 'bot',
        content: `I encountered an error generating content. Please try again or type "skip" to use defaults.`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAIContentRefinement = async (request: string) => {
    const lower = request.toLowerCase();
    if (lower.includes('looks good') || lower.includes('proceed') || lower.includes('continue')) {
      setCurrentStep('preview');
      generateFinalYAML();
      return;
    }
    
    if (!isOpenAIConfigured()) {
      addMessage({
        role: 'bot',
        content: `⚠️ OpenAI API not configured for refinements. Type "looks good" to proceed with current content.`,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const context = {
        agentName,
        displayName,
        goal,
        selectedPersona,
        selectedTools,
        selectedKnowledgeBases,
        currentStep,
      };
      
      // Refine both backstory and system prompt based on user feedback
      const [refinedBackstory, refinedPrompt] = await Promise.all([
        refineContent('backstory', generatedBackstory, request, context),
        refineContent('systemPrompt', generatedSystemPrompt, request, context),
      ]);
      
      setGeneratedBackstory(refinedBackstory);
      setGeneratedSystemPrompt(refinedPrompt);
      
      addMessage({
        role: 'bot',
        content: `✅ I've refined the content based on your feedback. Check the updated backstory and system prompt below.\n\nNeed more changes? Just let me know! Otherwise, type "looks good" to proceed.`,
      });
    } catch (error) {
      console.error('Refinement error:', error);
      addMessage({
        role: 'bot',
        content: `I encountered an error refining the content. Please try again or type "looks good" to proceed with current content.`,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateFinalYAML = async () => {
    if (!selectedPersona || !selectedLLMProfile) return;
    
    const yaml = assembleAgentCRD({
      agentName,
      displayName,
      goal,
      backstory: generatedBackstory,
      systemPrompt: generatedSystemPrompt,
      persona: selectedPersona,
      llmProfile: selectedLLMProfile,
      tools: selectedTools,
      mcpServers: autoIncludedServers,
      knowledgeBases: selectedKnowledgeBases,
    });
    
    setFinalYAML(yaml);
    
    // AI-powered completion message
    const context = {
      agentName,
      displayName,
      goal,
      selectedPersona,
      selectedTools,
      selectedKnowledgeBases,
      currentStep: 'preview',
    };
    
    const response = await sendAIMessage(
      `The agent configuration is complete! Congratulate the user on completing the wizard. Mention that their agent "${displayName}" with goal "${goal}" is ready. Encourage them to download or deploy the YAML.`,
      context
    );
    
    addMessage({
      role: 'bot',
      content: response,
      type: 'yaml-preview',
    });
  };
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-xl p-6 border border-red-500/50">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-semibold text-red-500">Error Loading Catalog</h2>
          </div>
          <p className="text-slate-300 mb-4">{error}</p>
          <p className="text-sm text-slate-400">
            Make sure the agent-component-library repository is accessible at:
            <br />
            <code className="text-xs bg-slate-900 px-2 py-1 rounded mt-2 inline-block">
              https://github.com/sandeepettads/agent-component-library
            </code>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">Agent Builder Wizard</h1>
              <p className="text-sm text-slate-400">AI-Assisted CRD Configuration</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Chat Container */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {isLoading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading component catalog from GitHub...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id}>
                  <ChatMessage message={message} />
                  
                  {/* Render component selectors inline */}
                  {message.type === 'component-selection' && catalog && (
                    <div className="ml-11 mb-6 max-w-[70%]">
                      {currentStep === 'persona' && (
                        <ComponentSelector
                          title="Choose a Persona"
                          options={catalog.components.personas.map(p => ({
                            id: p.id,
                            displayName: p.displayName,
                            description: p.description,
                            category: p.domain,
                          }))}
                          selectedIds={selectedPersona ? [selectedPersona.id] : []}
                          onSelect={handlePersonaSelection}
                          multiSelect={false}
                        />
                      )}
                      
                      {currentStep === 'llm' && (
                        <ComponentSelector
                          title="Choose LLM Profile"
                          options={catalog.components.llmProfiles.map(p => ({
                            id: p.id,
                            displayName: p.displayName,
                            description: p.description,
                            category: `Temp: ${p.temperature}`,
                          }))}
                          selectedIds={selectedLLMProfile ? [selectedLLMProfile.id] : []}
                          onSelect={handleLLMSelection}
                          multiSelect={false}
                        />
                      )}
                      
                      {currentStep === 'tools' && (
                        <ComponentSelector
                          title="Select Tools (multi-select)"
                          options={catalog.components.tools.map(t => ({
                            id: t.id,
                            displayName: t.displayName,
                            description: t.description,
                            category: t.category,
                          }))}
                          selectedIds={selectedTools.map(t => t.id)}
                          onSelect={handleToolsSelection}
                          multiSelect={true}
                        />
                      )}
                      
                      {currentStep === 'knowledge-bases' && (
                        <ComponentSelector
                          title="Select Knowledge Bases (optional)"
                          options={catalog.components.knowledgeBases.map(kb => ({
                            id: kb.id,
                            displayName: kb.displayName,
                            description: kb.description,
                            category: kb.type,
                          }))}
                          selectedIds={selectedKnowledgeBases.map(kb => kb.id)}
                          onSelect={handleKnowledgeBaseSelection}
                          multiSelect={true}
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Render content preview */}
                  {message.type === 'component-selection' && currentStep === 'content-generation' && (
                    <div className="ml-11 mb-6 max-w-[70%] space-y-4">
                      <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Backstory</h4>
                        <p className="text-sm text-slate-100">{generatedBackstory}</p>
                      </div>
                      <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">System Prompt</h4>
                        <pre className="text-xs text-slate-100 whitespace-pre-wrap font-mono">
                          {generatedSystemPrompt}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Render YAML preview */}
                  {message.type === 'yaml-preview' && finalYAML && (
                    <div className="ml-11 mb-6 max-w-[90%]">
                      <YAMLPreview
                        yaml={finalYAML}
                        onDeploy={() => alert('Deploy functionality would connect to Kubernetes API')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Input */}
      <ChatInput
        onSend={handleUserMessage}
        disabled={isLoading || isGenerating || currentStep === 'preview'}
        placeholder={
          isGenerating
            ? 'AI is thinking...'
            : currentStep === 'preview'
            ? 'Wizard complete! Download or deploy your agent.'
            : 'Type your response...'
        }
      />
    </div>
  );
}

export default App;
