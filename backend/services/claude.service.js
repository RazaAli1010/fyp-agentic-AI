const {
  anthropic,
  CLAUDE_MODELS,
  DEFAULT_PARAMS,
  selectModel,
  buildSystemPrompt,
  tokenUsageTracker,
  rateLimiter,
} = require("../config/claude.config.js");

const waitForRateLimit = async () => {
  const waitTime = rateLimiter.getWaitTime();
  if (waitTime > 0) {
    console.log(`Rate limit reached. Waiting ${waitTime}ms...`);
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
};

const generateResponse = async (
  userMessage,
  conversationHistory = [],
  projectContext = null,
  conversationType = "general"
) => {
  console.log("\n🤖 === CLAUDE SERVICE: generateResponse START ===");
  console.log("📝 User message length:", userMessage?.length || 0);
  console.log("📚 Conversation history length:", conversationHistory?.length || 0);
  console.log("📊 Has project context:", !!projectContext);
  console.log("🎯 Conversation type:", conversationType);

  try {
    // Check rate limit
    console.log("⏳ Checking rate limit...");
    if (!rateLimiter.canMakeRequest()) {
      console.log("⚠️ Rate limit reached, waiting...");
      await waitForRateLimit();
    }
    console.log("✅ Rate limit check passed");

    // Select appropriate model
    const model = selectModel(userMessage);
    console.log("🎨 Selected model:", model);

    // Build system prompt with context
    console.log("📄 Building system prompt...");
    const systemPrompt = buildSystemPrompt(
      conversationType.toUpperCase(),
      projectContext
    );
    console.log("✅ System prompt built, length:", systemPrompt?.length || 0);

    // Build messages array
    const messages = [
      ...conversationHistory.slice(-10), // Last 10 messages for context
      {
        role: "user",
        content: userMessage,
      },
    ];
    console.log("💬 Messages array built, total messages:", messages.length);

    // Make API call
    console.log("🚀 Making API call to Claude...");
    console.log("API Params:", {
      model,
      max_tokens: DEFAULT_PARAMS.maxTokens,
      temperature: DEFAULT_PARAMS.temperature,
      systemPromptLength: systemPrompt?.length,
      messagesCount: messages.length
    });

    const response = await anthropic.messages.create({
      model,
      max_tokens: DEFAULT_PARAMS.maxTokens,
      temperature: DEFAULT_PARAMS.temperature,
      system: systemPrompt,
      messages,
    });

    console.log("✅ Claude API response received");
    console.log("📊 Response usage:", response.usage);

    // Record request
    rateLimiter.recordRequest();

    // Track token usage
    tokenUsageTracker.track(response.usage);

    // Extract response content
    const content = response.content[0].text;
    console.log("✅ Content extracted, length:", content?.length || 0);

    const result = {
      content,
      model,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
      complexity: getQueryComplexity(userMessage),
    };

    console.log("✅ Result prepared:", {
      hasContent: !!result.content,
      contentLength: result.content?.length,
      model: result.model,
      totalTokens: result.usage.total,
      complexity: result.complexity
    });
    console.log("=== CLAUDE SERVICE: generateResponse END ===\n");

    return result;
  } catch (error) {
    console.error("\n❌ === CLAUDE SERVICE ERROR ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error status:", error.status);
    console.error("Error type:", error.type);
    console.error("Error stack:", error.stack);
    console.error("Full error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));

    if (error.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }

    if (error.status === 529) {
      console.error("=== CLAUDE SERVICE ERROR END (Overloaded) ===\n");
      throw new Error(
        "Claude API is temporarily overloaded. Please try again shortly."
      );
    }

    console.error("=== CLAUDE SERVICE ERROR END ===\n");
    throw new Error("Failed to generate AI response: " + error.message);
  }
};

/**
 * Handle investor objection with specialized format
 */
const handleInvestorObjection = async (objection, projectContext = null) => {
  try {
    if (!rateLimiter.canMakeRequest()) {
      await waitForRateLimit();
    }

    const model = CLAUDE_MODELS.SONNET;

    const systemPrompt = buildSystemPrompt(
      "INVESTOR_OBJECTIONS",
      projectContext
    );

    const userMessage = `Investor Objection: "${objection}"\n\nProvide a comprehensive response following the format specified in the system prompt.`;

    const response = await anthropic.messages.create({
      model,
      max_tokens: DEFAULT_PARAMS.maxTokens,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    rateLimiter.recordRequest();
    tokenUsageTracker.track(response.usage);

    const content = response.content[0].text;

    // Parse the structured response
    const parsedResponse = parseInvestorObjectionResponse(content);

    return {
      content,
      parsedResponse,
      model,
      usage: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("Investor objection handling error:", error);
    throw new Error("Failed to handle investor objection: " + error.message);
  }
};

/**
 * Parse investor objection response into structured format
 */
const parseInvestorObjectionResponse = (content) => {
  const sections = {
    quickRebuttal: "",
    detailedResponse: "",
    proactiveActions: "",
  };

  try {
    // Extract Quick Rebuttal
    const rebuttalMatch = content.match(
      /\*\*Quick Rebuttal:\*\*\s*([\s\S]*?)(?=\*\*Detailed Response:\*\*|$)/i
    );
    if (rebuttalMatch) {
      sections.quickRebuttal = rebuttalMatch[1].trim();
    }

    // Extract Detailed Response
    const detailedMatch = content.match(
      /\*\*Detailed Response:\*\*\s*([\s\S]*?)(?=\*\*Proactive Actions:\*\*|$)/i
    );
    if (detailedMatch) {
      sections.detailedResponse = detailedMatch[1].trim();
    }

    // Extract Proactive Actions
    const actionsMatch = content.match(
      /\*\*Proactive Actions:\*\*\s*([\s\S]*?)$/i
    );
    if (actionsMatch) {
      sections.proactiveActions = actionsMatch[1].trim();
    }
  } catch (error) {
    console.error("Error parsing investor objection response:", error);
  }

  return sections;
};

/**
 * Generate conversation summary
 */
const generateConversationSummary = async (conversationText) => {
  try {
    if (!rateLimiter.canMakeRequest()) {
      await waitForRateLimit();
    }

    const model = CLAUDE_MODELS.HAIKU; // Use Haiku for summaries (cost-effective)

    const systemPrompt = `You are an expert at summarizing business conversations. Create a concise summary that captures:
1. Main topics discussed
2. Key insights and recommendations
3. Action items mentioned
4. Overall theme

Keep the summary under 200 words.`;

    const response = await anthropic.messages.create({
      model,
      max_tokens: 500,
      temperature: 0.5,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Summarize this conversation:\n\n${conversationText}`,
        },
      ],
    });

    rateLimiter.recordRequest();
    tokenUsageTracker.track(response.usage);

    return response.content[0].text;
  } catch (error) {
    console.error("Summary generation error:", error);
    throw new Error("Failed to generate summary: " + error.message);
  }
};

/**
 * Generate smart suggestions based on project
 */
const generateSmartSuggestions = async (project) => {
  try {
    if (!rateLimiter.canMakeRequest()) {
      await waitForRateLimit();
    }

    const model = CLAUDE_MODELS.HAIKU;

    const systemPrompt = `You are a startup advisor. Based on the project information provided, suggest 5 relevant questions or topics the founder should explore. Return only a JSON array of strings.`;

    const projectInfo = `
Project: ${project.name}
Description: ${project.description || "Not provided"}
Stage: ${project.stage || "Early stage"}
Industry: ${project.industry || "Not specified"}
    `.trim();

    const response = await anthropic.messages.create({
      model,
      max_tokens: 1000,
      temperature: 0.8,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate 5 smart suggestions for this project:\n\n${projectInfo}`,
        },
      ],
    });

    rateLimiter.recordRequest();
    tokenUsageTracker.track(response.usage);

    const content = response.content[0].text;

    // Try to parse as JSON array
    try {
      const suggestions = JSON.parse(content);
      if (Array.isArray(suggestions)) {
        return suggestions.slice(0, 5);
      }
    } catch (e) {
      // If not JSON, split by newlines and clean up
      const suggestions = content
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => line.replace(/^[\d\-\*\•]\s*/, "").trim())
        .filter((line) => line.length > 10)
        .slice(0, 5);

      return suggestions;
    }

    return [];
  } catch (error) {
    console.error("Smart suggestions error:", error);
    return [
      "What's your go-to-market strategy?",
      "How do you plan to acquire your first 100 customers?",
      "What are your key success metrics?",
      "Who are your main competitors?",
      "What's your pricing strategy?",
    ];
  }
};

/**
 * Get query complexity
 */
const getQueryComplexity = (query) => {
  const { getQueryComplexity } = require("../config/claude.config");
  return getQueryComplexity(query);
};

/**
 * Get token usage statistics
 */
const getTokenStats = () => {
  return tokenUsageTracker.getStats();
};

/**
 * Reset token statistics
 */
const resetTokenStats = () => {
  tokenUsageTracker.reset();
};

module.exports = {
  generateResponse,
  handleInvestorObjection,
  generateConversationSummary,
  generateSmartSuggestions,
  getTokenStats,
  resetTokenStats,
};
