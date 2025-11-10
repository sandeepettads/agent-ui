Comprehensive Prompt for Your Coding LLM
Here's a detailed prompt to build your Agent Builder Wizard web application:

Project Brief: Agent Builder Wizard - AI-Assisted CRD Configuration Interface
Tech Stack
Framework: React 18+ with TypeScript
Build Tool: Vite
Styling: TailwindCSS
UI Components: shadcn/ui
Icons: Lucide React
State Management: React Context API or Zustand
Code Display: react-syntax-highlighter or Prism
HTTP Client: Axios or Fetch API
Project Goal
Build a beautiful, chat-based wizard interface that guides developers through creating Kubernetes Agent Custom Resource Definitions (CRDs) without requiring deep YAML or Kubernetes expertise. The interface should feel conversational, intelligent, and modern—similar to Claude.ai or ChatGPT.

UI/UX Requirements (Based on Screenshot)
Visual Design
Theme: Dark mode with charcoal/slate background (bg-slate-900)
Chat Layout: Center-aligned, max-width container (similar to screenshot)
Greeting: Personalized welcome message with decorative icon
Input Area:
Large, rounded input box with subtle border
Left side: Action buttons (+, attachment, settings icons)
Right side: Model/context selector dropdown + Send button
Placeholder: "How can I help you today?"
Dropdown Menu (like "Search and tools" in screenshot):
Component selection menus (Tools, Knowledge Bases, MCP Servers, etc.)
Toggle switches for boolean options
"PRO" badges for advanced features
Chat Experience
Message Types:
Bot Messages: Left-aligned, light background with avatar
User Messages: Right-aligned, darker background
Component Selection Cards: Interactive, multi-select checkboxes or single-select radio buttons
Generated Content Preview: Syntax-highlighted YAML/code blocks
Action Buttons: "Continue", "Edit", "Regenerate", "Deploy"
Feature Requirements
Phase 1: Wizard Flow (Core Features)
Step 1: Welcome & Identity

typescript
// Bot asks basic questions
1. "What's your agent's name?" (text input)
2. "What's the display name?" (text input)
3. "One-sentence goal?" (textarea)
Step 2: Component Selection Bot presents interactive selection UI:

A. Persona Selection (Single-Select)

typescript
// Show cards with radio buttons
- Clinical Specialist (Professional, Empathetic, Clear)
- Data Analyst (Analytical, Objective, Concise)
- Custom (user defines their own)
B. LLM Profile Selection (Single-Select)

typescript
// Dropdown or cards
- Clinical (Precise & Factual) - temp: 0.3
- Balanced (General Purpose) - temp: 0.5
- Creative (Conversational) - temp: 0.7
C. Tools Selection (Multi-Select with Dependencies)

typescript
// Checkboxes with smart grouping
MCP Server: EHR Integration
  ☐ Patient Lookup
  ☐ Care Plan Manager
  
MCP Server: Scheduling System
  ☐ Appointment Scheduler
  
Bot auto-includes required MCP servers
D. Knowledge Bases Selection (Multi-Select)

typescript
☐ Clinical Guidelines (Azure AI Search)
☐ Drug Interactions (Postgres)
☐ Provider Directory (Azure AI Search)
Step 3: AI-Assisted Content Generation

typescript
// Bot offers to generate
Bot: "Based on your selections, I can generate:
     - Backstory (persona-based)
     - System Prompt (5 sections with best practices)
     Would you like me to generate these?"

[Yes, Generate] [I'll Write My Own]

// If Yes, show generated content in editable text areas
// Allow iteration: "Please add HIPAA compliance rules"
Step 4: Preview & Deploy

typescript
// Show final YAML in syntax-highlighted code block
// Options:
[📋 Copy YAML]  [📥 Download]  [🚀 Deploy to K8s]  [⬅️ Back to Edit]
Technical Architecture
1. Component Catalog Integration
typescript
// Frontend should fetch from a backend API or static JSON
// Simulating the Git repo structure

interface MCPServer {
  urn: string;
  displayName: string;
  yamlTemplate: object;
}

interface Tool {
  urn: string;
  displayName: string;
  description: string;
  dependsOnServer: string; // URN of required MCP server
  yamlTemplate: object;
}

interface KnowledgeBase {
  urn: string;
  displayName: string;
  type: "AzureAISearch" | "PostgresPgvector";
  yamlTemplate: object;
}

interface LLMProfile {
  id: string;
  displayName: string;
  description: string;
  template: {
    provider: string;
    model: string;
    parameters: {
      temperature: number;
      topP: number;
      maxTokens: number;
    };
  };
}

interface Persona {
  id: string;
  displayName: string;
  description: string;
  template: {
    agentType: string;
    tone: string;
    topics: string[];
  };
}
2. State Management
typescript
interface WizardState {
  // Phase 1: Identity
  agentName: string;
  displayName: string;
  goal: string;
  
  // Phase 2: Selections
  selectedPersona: Persona | null;
  selectedLLMProfile: LLMProfile | null;
  selectedTools: Tool[];
  selectedKnowledgeBases: KnowledgeBase[];
  
  // Phase 3: Generated Content
  generatedBackstory: string;
  generatedSystemPrompt: string;
  
  // Phase 4: Final YAML
  finalYAML: string;
  
  // UI State
  currentStep: number;
  chatHistory: Message[];
}
3. Dependency Resolution Logic
typescript
// When tools are selected, auto-add required MCP servers
function resolveToolDependencies(
  selectedTools: Tool[],
  mcpServerCatalog: MCPServer[]
): MCPServer[] {
  const requiredServerUrns = new Set(
    selectedTools.map(tool => tool.dependsOnServer)
  );
  
  return mcpServerCatalog.filter(server => 
    requiredServerUrns.has(server.urn)
  );
}
4. AI Content Generation (Mock/Backend)
typescript
// This would call your LLM backend
async function generateBackstory(
  goal: string,
  persona: Persona
): Promise<string> {
  // Call API: POST /api/generate-backstory
  // Returns AI-generated backstory based on goal + persona
}

async function generateSystemPrompt(
  goal: string,
  persona: Persona,
  tools: Tool[],
  knowledgeBases: KnowledgeBase[]
): Promise<string> {
  // Call API: POST /api/generate-system-prompt
  // Returns structured system prompt with 5 sections
}
5. YAML Assembly
typescript
function assembleAgentYAML(state: WizardState): string {
  const agentCRD = {
    apiVersion: "agents.enterprise.com/v1alpha9",
    kind: "Agent",
    metadata: {
      name: state.agentName,
      namespace: "healthcare-dev"
    },
    spec: {
      schemaVersion: "v1alpha9",
      identity: {
        displayName: state.displayName,
        // ... other fields
      },
      goal: state.goal,
      backstory: state.generatedBackstory,
      systemPrompt: state.generatedSystemPrompt,
      persona: state.selectedPersona?.template,
      llm: state.selectedLLMProfile?.template,
      tools: state.selectedTools.map(t => t.yamlTemplate),
      mcpServers: resolveToolDependencies(
        state.selectedTools, 
        mcpServerCatalog
      ).map(s => s.yamlTemplate),
      knowledgeBases: state.selectedKnowledgeBases.map(kb => kb.yamlTemplate),
      // ... sensible defaults for other fields
    }
  };
  
  return yaml.stringify(agentCRD);
}
UI Components to Build
ChatContainer: Main scrollable chat area
ChatMessage: Individual message bubble (bot/user)
ComponentSelectionCard: Checkbox/Radio cards for selecting tools, KBs, etc.
ChatInput: Bottom input area with actions (like screenshot)
ModelSelector: Dropdown for selecting context/options
YAMLPreview: Syntax-highlighted code display
WizardProgress: Progress indicator (Step 1/4)
EditablePromptSection: Textarea for editing AI-generated content
DeploymentActions: Buttons for Copy/Download/Deploy
Mock Data for Development
Create JSON files simulating the Git catalog:

mock-data/mcpServers.json
mock-data/tools.json
mock-data/knowledgeBases.json
mock-data/llmProfiles.json
mock-data/personas.json
Key User Interactions
User types agent name → Bot acknowledges and asks next question
User clicks "Select Persona" → Shows card grid with radio buttons
User checks multiple tools → Bot shows "I've added the required MCP servers automatically"
User clicks "Generate Content" → Loading animation → Shows generated backstory/prompt
User types "Add HIPAA rules" → Bot regenerates with refinement
User clicks "Preview YAML" → Shows full 345-line CRD in code block
User clicks "Deploy" → Sends to K8s API (mock for now)
Folder Structure
/agent-builder-wizard
  /src
    /components
      /chat
        ChatContainer.tsx
        ChatMessage.tsx
        ChatInput.tsx
      /wizard
        PersonaSelector.tsx
        ToolSelector.tsx
        LLMProfileSelector.tsx
        KnowledgeBaseSelector.tsx
      /preview
        YAMLPreview.tsx
      /ui (shadcn components)
    /hooks
      useWizardState.ts
      useChatHistory.ts
    /lib
      yamlAssembler.ts
      dependencyResolver.ts
    /mock-data
      mcpServers.json
      tools.json
      ...
    /types
      wizard.types.ts
    App.tsx
    main.tsx
Deliverables
Fully functional wizard with 4-step flow
Responsive design (desktop primary, mobile-friendly)
Dark theme matching the screenshot aesthetic
Interactive component selection with visual feedback
Syntax-highlighted YAML preview
Mock data for all catalogs (5 tools, 3 KBs, 2 MCP servers, 2 personas, 3 LLM profiles)
Copy/Download YAML functionality
README with setup instructions
Non-Functional Requirements
Performance: Smooth animations, no lag on component selection
Accessibility: Keyboard navigation, ARIA labels
Code Quality: TypeScript strict mode, ESLint, Prettier
Documentation: Inline comments for complex logic
Start by creating the project scaffold with Vite, then build the chat interface layout, followed by the wizard state management, and finally the component selection UI. The UI should feel magical and collaborative, not like filling out a form.