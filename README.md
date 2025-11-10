# Agent Builder Wizard UI

AI-assisted chat interface for building Kubernetes Agent CRDs without requiring deep YAML or Kubernetes expertise.

## 🎯 Overview

This React application provides an intuitive, conversational UI that guides developers through creating complex Agent Custom Resource Definitions (CRDs) by:

- Fetching component catalog directly from GitHub
- Presenting pre-configured building blocks (tools, personas, LLM profiles, etc.)
- Automatically resolving dependencies (e.g., tools → MCP servers)
- Generating backstory and system prompts based on selections
- Assembling complete, valid YAML configurations

## 🏗️ Architecture

### Data Source
- **GitHub Repository**: `https://github.com/sandeepettads/agent-component-library`
- **No Local Files**: All components are fetched from the GitHub repository at runtime
- **Caching**: Components are cached in memory after first fetch

### Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **YAML Parsing**: js-yaml
- **Syntax Highlighting**: react-syntax-highlighter
- **Icons**: Lucide React

## 📦 Installation

```bash
# Install dependencies
npm install

# Configure OpenAI API (for AI-powered chat)
# 1. Copy .env.example to .env.local
# 2. Add your OpenAI API key to .env.local
# See OPENAI-INTEGRATION.md for detailed setup

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚀 Usage

1. **Start the application**: `npm run dev`
2. **Open browser**: Navigate to `http://localhost:5173`
3. **Follow the wizard**:
   - Enter agent name, display name, and goal
   - Select a persona (Clinical Specialist, Data Analyst, etc.)
   - Choose LLM profile (Precise, Balanced, Creative)
   - Select tools (multi-select with automatic MCP server inclusion)
   - Add optional knowledge bases
   - Review generated backstory and system prompt
   - Preview and download final YAML

## 🔑 Key Features

### 1. GitHub Integration
All components are loaded from your GitHub repository

### 2. Automatic Dependency Resolution
When users select tools, required MCP servers are automatically included

### 3. Conversational Wizard Flow
Welcome → Identity → Persona → LLM → Tools → Knowledge Bases → Content Generation → YAML Preview

### 4. Real-time YAML Assembly
The final Agent CRD is assembled client-side

## 📄 License

Internal use only.

---

**Last Updated**: November 8, 2025
**Version**: 1.0.0
**Catalog Source**: https://github.com/sandeepettads/agent-component-library
