# OpenAI Integration Guide

## 🤖 Overview

The Agent Builder Wizard now features **AI-powered conversations** using OpenAI's GPT models. Instead of predefined responses, the chatbot dynamically responds to user input, provides personalized guidance, and generates high-quality agent configurations.

---

## 🔑 Setup Instructions

### 1. Get Your OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** section
4. Click **"Create new secret key"**
5. Copy your API key (it starts with `sk-...`)

### 2. Configure the Application

1. Open the `.env.local` file in the project root:
   ```bash
   cd /Users/sandeepetta/CascadeProjects/agentbuilder/agent-builder-ui
   nano .env.local
   ```

2. Replace `your-api-key-here` with your actual API key:
   ```env
   VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
   ```

3. **Optional**: Customize model settings:
   ```env
   VITE_OPENAI_MODEL=gpt-4o-mini          # or gpt-4o, gpt-4-turbo
   VITE_OPENAI_TEMPERATURE=0.7             # 0.0-2.0 (higher = more creative)
   VITE_OPENAI_MAX_TOKENS=2000             # Max response length
   ```

4. Save the file and restart the dev server:
   ```bash
   npm run dev
   ```

---

## ✨ AI-Powered Features

### 1. **Dynamic Conversational Flow**
Instead of predefined questions, the AI:
- Adapts responses based on user input
- Provides personalized examples
- Offers suggestions and best practices
- Guides users naturally through the wizard

**Example**:
```
User: "I want to build an agent for healthcare"
AI: "Great choice! Healthcare agents need to handle sensitive data carefully. 
     What specific healthcare task should your agent focus on? For example:
     - Patient care coordination
     - Medical records management
     - Appointment scheduling
     - Clinical decision support"
```

### 2. **Intelligent Backstory Generation**
The AI generates compelling agent backstories that:
- Reflect the selected persona's tone and expertise
- Incorporate the agent's goal
- Reference available tools
- Sound professional and credible

**Example Output**:
> "I am a seasoned Clinical Specialist with over a decade of experience in healthcare operations. My approach combines professional expertise with genuine empathy, helping care teams coordinate patient care seamlessly. I excel at leveraging EHR data and scheduling systems to ensure no patient falls through the cracks."

### 3. **Comprehensive System Prompt Creation**
The AI crafts structured system prompts with:
- Clear role definition
- Specific capabilities based on selected tools
- Communication guidelines matching persona tone
- Best practices and safety measures
- Knowledge base utilization instructions

**Example Output**:
```
You are a Clinical Specialist responsible for coordinating comprehensive patient care.

CORE CAPABILITIES:
- Access patient records via EHR Integration (Patient Lookup tool)
- Schedule appointments across multiple providers (Appointment Scheduler)
- Query clinical guidelines for evidence-based recommendations

COMMUNICATION GUIDELINES:
- Tone: Professional, Empathetic, Clear
- Always verify patient identity before discussing PHI
- Use clinical terminology appropriately while ensuring patient understanding
...
```

### 4. **Interactive Content Refinement**
Users can request changes in natural language:

```
User: "Add more emphasis on HIPAA compliance"
AI: ✅ I've refined the content to emphasize HIPAA compliance...

User: "Make the tone more formal"
AI: ✅ Updated to use a more formal communication style...

User: "Include data security best practices"
AI: ✅ Added comprehensive data security guidelines...
```

---

## 🔧 Technical Implementation

### Service Layer (`src/services/openaiService.ts`)

**Functions**:
1. `generateWizardResponse()` - Main conversational AI
2. `generateBackstory()` - AI-powered backstory creation
3. `generateSystemPrompt()` - Structured system prompt generation
4. `refineContent()` - Iterative content refinement
5. `isOpenAIConfigured()` - Check API key setup

### AI System Prompt

The wizard uses a specialized system prompt that:
- Defines the AI's role as an agent configuration expert
- Sets personality (friendly, helpful, technical)
- Provides context about the Agent CRD structure
- Guides response formatting and style

### Context Awareness

Every AI request includes:
- Current wizard step
- Agent name, display name, and goal
- Selected persona, tools, and knowledge bases
- Conversation history

This ensures coherent, contextual responses throughout the wizard flow.

---

## 💰 Cost Considerations

### Token Usage Estimates

| Action | Avg Tokens | Cost (GPT-4o-mini) |
|--------|-----------|-------------------|
| Each conversation turn | ~500 | $0.0001 |
| Backstory generation | ~300 | $0.00006 |
| System prompt generation | ~800 | $0.00016 |
| Content refinement | ~600 | $0.00012 |
| **Full wizard session** | **~3000** | **~$0.0006** |

**Note**: Costs are approximate and based on GPT-4o-mini pricing. Actual costs may vary.

### Recommendations
- Use `gpt-4o-mini` for development (cheap, fast)
- Upgrade to `gpt-4o` or `gpt-4-turbo` for production (better quality)
- Monitor usage via OpenAI dashboard

---

## 🛡️ Security Best Practices

### ⚠️ Important Security Notes

1. **Never commit API keys to Git**
   - `.env.local` is already in `.gitignore`
   - Use `.env.example` for templates only

2. **Client-side API calls** (Current Implementation)
   - ⚠️ API key exposed in browser (development only)
   - Setting: `dangerouslyAllowBrowser: true`
   - **Do NOT use in production**

3. **Production Recommendation**:
   Create a backend proxy:
   ```typescript
   // Backend API endpoint
   POST /api/chat
   {
     "message": "user message",
     "context": {...}
   }
   
   // Your backend calls OpenAI
   // API key stays server-side (secure)
   ```

4. **Rate Limiting**:
   - OpenAI has default rate limits
   - Monitor usage in your OpenAI dashboard
   - Implement client-side debouncing if needed

---

## 🔄 Fallback Behavior

### When API Key is NOT Configured

The app gracefully degrades to template-based generation:

1. **Chat Responses**: Shows a warning message
   ```
   ⚠️ OpenAI API key not configured.
   Please add your API key to .env.local
   
   For now, I'll use a simplified flow...
   ```

2. **Backstory**: Uses template with persona info
3. **System Prompt**: Uses structured template with placeholders

### Detecting Configuration
```typescript
import { isOpenAIConfigured } from './services/openaiService';

if (isOpenAIConfigured()) {
  // Use AI-powered features
} else {
  // Fall back to templates
}
```

---

## 🧪 Testing the Integration

### Quick Test

1. **Start the app** with API key configured:
   ```bash
   npm run dev
   ```

2. **Open browser**: http://localhost:5173

3. **Test conversation**:
   - Type a creative agent name
   - Watch the AI provide a personalized response
   - Continue through the wizard
   - Request content refinements

### Verify AI is Working

Look for these indicators:
- ✅ Dynamic, conversational responses (not rigid templates)
- ✅ Personalized examples based on your input
- ✅ Natural language understanding
- ✅ Context-aware suggestions
- ✅ High-quality generated backstories and prompts

### Troubleshooting

**"API key not configured" error**:
- Check `.env.local` exists
- Verify key format: `sk-...`
- Restart dev server after adding key

**"Failed to generate response" error**:
- Check OpenAI API status
- Verify API key is valid (not expired)
- Check rate limits in OpenAI dashboard
- Review browser console for detailed errors

**Slow responses**:
- Normal for GPT-4 models (3-5 seconds)
- Switch to `gpt-4o-mini` for faster responses
- Check network connection

---

## 📊 Comparison: AI vs Template

| Feature | AI-Powered | Template-Based |
|---------|-----------|----------------|
| **Conversation** | Natural, adaptive | Fixed, rigid |
| **Backstory** | Unique, contextual | Generic template |
| **System Prompt** | Comprehensive, tailored | Basic structure |
| **Refinement** | Iterative, intelligent | Not available |
| **User Experience** | Collaborative, guided | Self-service |
| **Setup Required** | API key needed | None |
| **Cost** | ~$0.0006/session | Free |
| **Quality** | High, professional | Adequate |

---

## 🚀 Future Enhancements

### Planned Features
1. **Streaming Responses**: Show AI typing in real-time
2. **Conversation Memory**: Remember context across sessions
3. **Multi-turn Refinement**: Back-and-forth content editing
4. **Component Recommendations**: AI suggests tools/personas
5. **YAML Validation**: AI checks configuration correctness
6. **Template Library**: AI generates from example agents

### Backend Proxy (Production)
```typescript
// Example Express.js backend
app.post('/api/chat', authenticate, async (req, res) => {
  const { message, context } = req.body;
  
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL,
    messages: buildMessages(message, context),
  });
  
  res.json({ response: response.choices[0].message.content });
});
```

---

## 📖 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT-4 Best Practices](https://platform.openai.com/docs/guides/gpt-best-practices)
- [Rate Limits Guide](https://platform.openai.com/docs/guides/rate-limits)
- [Pricing](https://openai.com/api/pricing/)

---

**🎉 Enjoy building agents with AI assistance!**

For questions or issues, check the main README or contact the development team.
