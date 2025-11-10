// Types for the agent component catalog from GitHub

export interface MCPServer {
  id: string;
  file: string;
  urn: string;
  displayName: string;
  category: string;
  tags: string[];
  // Full template loaded from YAML
  template?: {
    identity: {
      urn: string;
      displayName: string;
    };
    url: string;
    protocol: string;
    authentication: Record<string, any>;
  };
}

export interface Tool {
  id: string;
  file: string;
  urn: string;
  displayName: string;
  dependsOnServer: string; // URN of required MCP server
  category: string;
  tags: string[];
  description?: string;
  // Full template loaded from YAML
  template?: {
    toolTemplate: {
      identity: { urn: string };
      name: string;
      description: string;
      mcp: {
        serverRef: { urn: string };
        toolName: string;
      };
      [key: string]: any;
    };
  };
}

export interface KnowledgeBase {
  id: string;
  file: string;
  urn: string;
  displayName: string;
  type: "AzureAISearch" | "PostgresPgvector";
  category: string;
  tags: string[];
  description?: string;
  // Full template loaded from YAML
  template?: {
    kbTemplate: {
      identity: { urn: string; name: string };
      type: string;
      connection: Record<string, any>;
      [key: string]: any;
    };
  };
}

export interface LLMProfile {
  id: string;
  file: string;
  displayName: string;
  temperature: number;
  useCase: string;
  tags: string[];
  description?: string;
  // Full template loaded from YAML
  template?: {
    llmTemplate: {
      provider: string;
      model: string;
      parameters: {
        temperature: number;
        topP: number;
        maxTokens: number;
        [key: string]: any;
      };
      [key: string]: any;
    };
  };
}

export interface Persona {
  id: string;
  file: string;
  displayName: string;
  domain: string;
  tone: string;
  tags: string[];
  description?: string;
  // Full template loaded from YAML
  template?: {
    personaTemplate: {
      agentType: string;
      tone: string;
      topics: string[];
    };
  };
}

export interface CatalogIndex {
  version: string;
  lastUpdated: string;
  description: string;
  components: {
    mcpServers: MCPServer[];
    tools: Tool[];
    knowledgeBases: KnowledgeBase[];
    llmProfiles: LLMProfile[];
    personas: Persona[];
  };
  statistics: {
    totalComponents: number;
    mcpServers: number;
    tools: number;
    knowledgeBases: number;
    llmProfiles: number;
    personas: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: Date;
  type?: 'text' | 'component-selection' | 'yaml-preview' | 'action';
  data?: any; // For structured content like component selections
}

export type WizardStep = 'welcome' | 'identity' | 'persona' | 'llm' | 'tools' | 'knowledge-bases' | 'content-generation' | 'preview' | 'complete';
