import yaml from 'js-yaml';
import type { CatalogIndex, MCPServer, Tool, KnowledgeBase, LLMProfile, Persona } from '../types/catalog.types';

// GitHub repository configuration
const GITHUB_OWNER = 'sandeepettads';
const GITHUB_REPO = 'agent-component-library';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}`;

// Cache for loaded components
const componentCache = new Map<string, any>();

/**
 * Fetch catalog index from GitHub
 */
export async function fetchCatalogIndex(): Promise<CatalogIndex> {
  const cacheKey = 'catalog-index';
  
  if (componentCache.has(cacheKey)) {
    return componentCache.get(cacheKey);
  }
  
  const url = `${GITHUB_RAW_BASE}/catalog-index.json`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch catalog index: ${response.statusText}`);
  }
  
  const catalog: CatalogIndex = await response.json();
  componentCache.set(cacheKey, catalog);
  
  return catalog;
}

/**
 * Fetch and parse a YAML file from GitHub
 */
async function fetchYAMLFile(filePath: string): Promise<any> {
  if (componentCache.has(filePath)) {
    return componentCache.get(filePath);
  }
  
  const url = `${GITHUB_RAW_BASE}/${filePath}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
  }
  
  const yamlText = await response.text();
  const parsed = yaml.load(yamlText) as any;
  
  componentCache.set(filePath, parsed);
  return parsed;
}

/**
 * Load full template for MCP servers
 */
export async function loadMCPServerTemplates(servers: MCPServer[]): Promise<MCPServer[]> {
  const loadedServers = await Promise.all(
    servers.map(async (server) => {
      const template = await fetchYAMLFile(server.file);
      return {
        ...server,
        template,
      };
    })
  );
  
  return loadedServers;
}

/**
 * Load full template for tools
 */
export async function loadToolTemplates(tools: Tool[]): Promise<Tool[]> {
  const loadedTools = await Promise.all(
    tools.map(async (tool) => {
      const template = await fetchYAMLFile(tool.file);
      return {
        ...tool,
        template,
      };
    })
  );
  
  return loadedTools;
}

/**
 * Load full template for knowledge bases
 */
export async function loadKnowledgeBaseTemplates(kbs: KnowledgeBase[]): Promise<KnowledgeBase[]> {
  const loadedKBs = await Promise.all(
    kbs.map(async (kb) => {
      const template = await fetchYAMLFile(kb.file);
      return {
        ...kb,
        template,
      };
    })
  );
  
  return loadedKBs;
}

/**
 * Load full template for LLM profiles
 */
export async function loadLLMProfileTemplates(profiles: LLMProfile[]): Promise<LLMProfile[]> {
  const loadedProfiles = await Promise.all(
    profiles.map(async (profile) => {
      const template = await fetchYAMLFile(profile.file);
      return {
        ...profile,
        template,
      };
    })
  );
  
  return loadedProfiles;
}

/**
 * Load full template for personas
 */
export async function loadPersonaTemplates(personas: Persona[]): Promise<Persona[]> {
  const loadedPersonas = await Promise.all(
    personas.map(async (persona) => {
      const template = await fetchYAMLFile(persona.file);
      return {
        ...persona,
        template,
      };
    })
  );
  
  return loadedPersonas;
}

/**
 * Load all components with their templates
 */
export async function loadFullCatalog() {
  const catalog = await fetchCatalogIndex();
  
  const [mcpServers, tools, knowledgeBases, llmProfiles, personas] = await Promise.all([
    loadMCPServerTemplates(catalog.components.mcpServers),
    loadToolTemplates(catalog.components.tools),
    loadKnowledgeBaseTemplates(catalog.components.knowledgeBases),
    loadLLMProfileTemplates(catalog.components.llmProfiles),
    loadPersonaTemplates(catalog.components.personas),
  ]);
  
  return {
    ...catalog,
    components: {
      mcpServers,
      tools,
      knowledgeBases,
      llmProfiles,
      personas,
    },
  };
}

/**
 * Clear component cache (useful for refreshing)
 */
export function clearCatalogCache(): void {
  componentCache.clear();
}
