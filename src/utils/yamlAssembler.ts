import yaml from 'js-yaml';
import type { Tool, MCPServer, KnowledgeBase, LLMProfile, Persona } from '../types/catalog.types';

export interface AgentConfig {
  agentName: string;
  displayName: string;
  goal: string;
  backstory: string;
  systemPrompt: string;
  persona: Persona | null;
  llmProfile: LLMProfile | null;
  tools: Tool[];
  mcpServers: MCPServer[];
  knowledgeBases: KnowledgeBase[];
}

/**
 * Resolve tool dependencies to get required MCP servers
 */
export function resolveToolDependencies(
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

/**
 * Generate URN for agent
 */
function generateAgentUrn(agentName: string): string {
  return `urn:enterprise:agent:${agentName}:v1`;
}

/**
 * Get default behavior configuration
 */
function getDefaultBehavior() {
  return {
    responseFormat: {
      type: 'json',
    },
    toolChoice: 'auto',
    reasoning: {
      enabled: true,
      maxReasoningTokens: 4000,
    },
    determinism: {
      seed: 42,
    },
    contextWindow: {
      maxPromptTokens: 100000,
      truncationStrategy: 'middle',
    },
  };
}

/**
 * Get default RAG configuration
 */
function getDefaultRAG() {
  return {
    ingestion: {
      chunker: 'semantic',
      chunkSize: 512,
      chunkOverlap: 50,
      dedupe: true,
      schedule: '0 */6 * * *',
    },
    embedding: {
      model: 'text-embedding-3-large',
      dimension: 3072,
    },
    index: {
      metric: 'cosine',
      hybrid: true,
      hnsw: {
        m: 16,
        efConstruction: 200,
      },
    },
    retrieval: {
      topK: 10,
      mmr: true,
      recencyBoost: true,
      requireCitations: true,
    },
    retention: {
      ttlDays: 365,
      lineage: true,
    },
  };
}

/**
 * Get default security configuration
 */
function getDefaultSecurity() {
  return {
    rbac: {
      roles: ['AgentUser'],
    },
    dataPolicy: {
      classification: 'Internal',
      redactPII: true,
      retentionDays: 365,
    },
    egress: {
      allowlist: ['*.enterprise.com'],
      mtls: true,
    },
  };
}

/**
 * Get default ops configuration
 */
function getDefaultOps() {
  return {
    timeouts: {
      defaultMs: 30000,
    },
    retries: {
      max: 3,
      backoffMs: 1000,
    },
    rateLimit: {
      rpm: 600,
      rps: 20,
    },
    resources: {
      cpu: '2',
      memory: '4Gi',
    },
  };
}

/**
 * Get default telemetry configuration
 */
function getDefaultTelemetry() {
  return {
    opentelemetry: {
      enabled: true,
      serviceName: 'agent-service',
    },
    logs: {
      redaction: true,
    },
    metrics: [
      'agent_requests_total',
      'agent_latency',
      'agent_errors',
    ],
  };
}

/**
 * Assemble complete Agent CRD YAML
 */
export function assembleAgentCRD(config: AgentConfig): string {
  const {
    agentName,
    displayName,
    goal,
    backstory,
    systemPrompt,
    persona,
    llmProfile,
    tools,
    mcpServers,
    knowledgeBases,
  } = config;
  
  const agentCRD = {
    apiVersion: 'agents.enterprise.com/v1alpha9',
    kind: 'Agent',
    metadata: {
      name: agentName,
      namespace: 'agent-workspace',
    },
    spec: {
      schemaVersion: 'v1alpha9',
      
      identity: {
        urn: generateAgentUrn(agentName),
        displayName: displayName,
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      
      context: {
        environment: 'dev',
        lifecycle: 'dev',
      },
      
      ownership: {
        organization: 'Enterprise',
        team: 'Agent Development',
        user: 'agent-builder',
      },
      
      role: persona?.template?.personaTemplate?.agentType || 'Agent',
      goal: goal,
      backstory: backstory,
      systemPrompt: systemPrompt,
      
      ...(persona?.template?.personaTemplate && {
        persona: persona.template.personaTemplate,
      }),
      
      ...(llmProfile?.template?.llmTemplate && {
        llm: llmProfile.template.llmTemplate,
      }),
      
      ...(mcpServers.length > 0 && {
        mcpServers: mcpServers.map(server => server.template),
      }),
      
      ...(tools.length > 0 && {
        tools: tools.map(tool => tool.template?.toolTemplate),
      }),
      
      ...(knowledgeBases.length > 0 && {
        knowledgeBases: knowledgeBases.map(kb => kb.template?.kbTemplate),
      }),
      
      behavior: getDefaultBehavior(),
      ...(knowledgeBases.length > 0 && { rag: getDefaultRAG() }),
      security: getDefaultSecurity(),
      ops: getDefaultOps(),
      telemetry: getDefaultTelemetry(),
    },
    
    status: {
      phase: 'Pending',
      conditions: [
        {
          type: 'Ready',
          status: 'Unknown',
          lastTransitionTime: new Date().toISOString(),
          reason: 'AgentCreated',
          message: 'Agent has been created and is pending deployment',
        },
      ],
    },
  };
  
  return yaml.dump(agentCRD, {
    indent: 2,
    lineWidth: -1, // Don't wrap lines
    noRefs: true, // Don't use anchors/references
  });
}
