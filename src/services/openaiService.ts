import OpenAI from 'openai';
import type { Persona, Tool, KnowledgeBase } from '../types/catalog.types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
});

const MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';
const TEMPERATURE = parseFloat(import.meta.env.VITE_OPENAI_TEMPERATURE || '0.7');
const MAX_TOKENS = parseInt(import.meta.env.VITE_OPENAI_MAX_TOKENS || '2000');

export interface ChatContext {
  agentName?: string;
  displayName?: string;
  goal?: string;
  selectedPersona?: Persona | null;
  selectedTools?: Tool[];
  selectedKnowledgeBases?: KnowledgeBase[];
  currentStep?: string;
}

/**
 * System prompt for the AI wizard assistant
 */
const WIZARD_SYSTEM_PROMPT = `You are an AI assistant helping developers build Kubernetes Agent Custom Resource Definitions (CRDs). Your role is to guide them through a conversational wizard that collects information and helps them select components.

Your personality:
- Friendly, helpful, and encouraging
- Clear and concise
- Technical but accessible
- Use emojis sparingly for emphasis

Your responsibilities:
1. Guide users through defining their agent (name, display name, goal)
2. Help them understand and select personas, LLM profiles, tools, and knowledge bases
3. Explain technical concepts when needed
4. Generate high-quality backstories and system prompts based on their selections
5. Provide helpful suggestions and best practices

When guiding users:
- Ask one question at a time
- Provide examples when helpful
- Acknowledge their input positively
- Explain what comes next in the process
- Be encouraging about their progress

Remember: You're building a Kubernetes Agent CRD, so all advice should be relevant to agentic AI systems, tools integration, and enterprise deployment.`;

/**
 * Generate a conversational response from the AI assistant
 */
export async function generateWizardResponse(
  userMessage: string,
  context: ChatContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  try {
    const contextInfo = buildContextInfo(context);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: WIZARD_SYSTEM_PROMPT },
      { role: 'system', content: `Current context:\n${contextInfo}` },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content,
      } as OpenAI.Chat.ChatCompletionMessageParam)),
      { role: 'user', content: userMessage },
    ];
    
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages,
      temperature: TEMPERATURE,
      max_tokens: MAX_TOKENS,
    });
    
    return completion.choices[0]?.message?.content || 'I apologize, but I encountered an error. Please try again.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      throw new Error('OpenAI API key not configured. Please add your API key to .env.local');
    }
    throw new Error('Failed to generate response. Please try again.');
  }
}

/**
 * Generate agent backstory based on selections
 */
export async function generateBackstory(
  goal: string,
  persona: Persona,
  tools: Tool[]
): Promise<string> {
  try {
    const toolNames = tools.map(t => t.displayName).join(', ');
    
    const prompt = `Generate a compelling backstory for an AI agent with the following details:

**Goal**: ${goal}
**Persona**: ${persona.displayName} (${persona.description})
**Domain**: ${persona.domain}
**Tone**: ${persona.tone}
**Available Tools**: ${toolNames || 'None'}

Create a 2-3 sentence backstory that:
1. Establishes the agent's expertise and experience
2. Reflects the persona's tone and domain
3. Mentions how it achieves the stated goal
4. Sounds professional and credible

Write in first person ("I am..."). Be specific and confident.`;
    
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert at writing compelling agent backstories.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });
    
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating backstory:', error);
    // Fallback to simple template
    return `I am an experienced ${persona.displayName.toLowerCase()} specializing in ${persona.domain.toLowerCase()}. My communication style is ${persona.tone.toLowerCase()}, and I excel at ${goal.toLowerCase()} using the tools and knowledge at my disposal.`;
  }
}

/**
 * Generate comprehensive system prompt based on selections
 */
export async function generateSystemPrompt(
  goal: string,
  persona: Persona,
  tools: Tool[],
  knowledgeBases: KnowledgeBase[]
): Promise<string> {
  try {
    const toolDescriptions = tools.map(t => `- ${t.displayName}: ${t.description || 'Tool for agent tasks'}`).join('\n');
    const kbDescriptions = knowledgeBases.map(kb => `- ${kb.displayName}: ${kb.description || 'Knowledge source'}`).join('\n');
    const topics = persona.template?.personaTemplate?.topics?.join(', ') || 'general tasks';
    
    const prompt = `Generate a comprehensive system prompt for an AI agent with these specifications:

**Primary Goal**: ${goal}
**Agent Type**: ${persona.template?.personaTemplate?.agentType}
**Communication Tone**: ${persona.template?.personaTemplate?.tone}
**Focus Areas**: ${topics}

**Available Tools**:
${toolDescriptions || 'No tools configured'}

**Available Knowledge Bases**:
${kbDescriptions || 'No knowledge bases configured'}

Create a structured system prompt with these sections:
1. **ROLE & RESPONSIBILITIES** - What the agent does and why it exists
2. **CORE CAPABILITIES** - Key functions and how to use available tools
3. **COMMUNICATION GUIDELINES** - How to interact (tone, style, clarity)
4. **BEST PRACTICES** - Important rules, safety measures, and quality standards
5. **KNOWLEDGE UTILIZATION** - How to use knowledge bases effectively (if applicable)

Make it:
- Specific and actionable
- Professional but accessible
- Include concrete examples where helpful
- Emphasize the tone: ${persona.template?.personaTemplate?.tone}
- 200-300 words total

Write in second person ("You are..."). Be direct and clear.`;
    
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert at writing effective AI system prompts for enterprise agents.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });
    
    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating system prompt:', error);
    // Fallback to template
    return `You are a ${persona.template?.personaTemplate?.agentType} responsible for ${goal}

Your primary responsibilities include executing tasks aligned with the defined goal and maintaining ${persona.template?.personaTemplate?.tone} communication style.

CORE CAPABILITIES:
- Execute tasks using available tools effectively
- Leverage knowledge bases for accurate information
- Provide clear, actionable guidance

COMMUNICATION GUIDELINES:
- Tone: ${persona.template?.personaTemplate?.tone}
- Be helpful, accurate, and professional
- Provide clear explanations

BEST PRACTICES:
- Use tools appropriately and efficiently
- Query knowledge bases for accurate information
- Document important actions
- Escalate complex issues when necessary

Focus areas: ${persona.template?.personaTemplate?.topics?.join(', ') || 'general tasks'}`;
  }
}

/**
 * Refine existing content based on user feedback
 */
export async function refineContent(
  contentType: 'backstory' | 'systemPrompt',
  currentContent: string,
  userFeedback: string,
  context: ChatContext
): Promise<string> {
  try {
    const prompt = `The user wants to refine the agent's ${contentType}. Here's what we have:

**Current ${contentType}**:
${currentContent}

**User's feedback**:
${userFeedback}

**Context**:
- Goal: ${context.goal}
- Persona: ${context.selectedPersona?.displayName}

Please update the ${contentType} based on the user's feedback while maintaining the overall structure and quality. Keep the same length and format.`;
    
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are an expert at refining and improving agent configurations based on user feedback.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: contentType === 'backstory' ? 300 : 800,
    });
    
    return completion.choices[0]?.message?.content?.trim() || currentContent;
  } catch (error) {
    console.error('Error refining content:', error);
    return currentContent; // Return original if refinement fails
  }
}

/**
 * Build context information for the AI
 */
function buildContextInfo(context: ChatContext): string {
  const parts: string[] = [];
  
  if (context.agentName) parts.push(`Agent Name: ${context.agentName}`);
  if (context.displayName) parts.push(`Display Name: ${context.displayName}`);
  if (context.goal) parts.push(`Goal: ${context.goal}`);
  if (context.selectedPersona) parts.push(`Persona: ${context.selectedPersona.displayName}`);
  if (context.selectedTools && context.selectedTools.length > 0) {
    parts.push(`Selected Tools: ${context.selectedTools.map(t => t.displayName).join(', ')}`);
  }
  if (context.selectedKnowledgeBases && context.selectedKnowledgeBases.length > 0) {
    parts.push(`Knowledge Bases: ${context.selectedKnowledgeBases.map(kb => kb.displayName).join(', ')}`);
  }
  if (context.currentStep) parts.push(`Current Step: ${context.currentStep}`);
  
  return parts.length > 0 ? parts.join('\n') : 'No context available yet';
}

/**
 * Check if OpenAI API is configured
 */
export function isOpenAIConfigured(): boolean {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return !!apiKey && apiKey !== 'your-api-key-here';
}
