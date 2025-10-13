const Anthropic = require("@anthropic-ai/sdk");
const { config } = require("./env");

/**
 * Initializing Claude AI Client
 */
const anthropic = new Anthropic({
  apiKey: config.claude.apiKey,
});

/**
 * Claude Model Configuration
 */
const CLAUDE_MODELS = {
  SONNET: config.claude.sonnetModel, // For complex queries
  HAIKU: config.claude.haikuModel, // For simple queries
};

/**
 * Default Claude Parameters
 */
const DEFAULT_PARAMS = {
  maxTokens: config.claude.maxTokens,
  temperature: config.claude.temperature,
  topP: 1,
  topK: 0,
};

/**
 * Query complexity thresholds
 */
const COMPLEXITY_KEYWORDS = {
  HIGH: [
    "analyze",
    "strategy",
    "recommend",
    "evaluate",
    "compare",
    "comprehensive",
    "detailed",
    "explain",
    "business model",
    "market analysis",
    "financial",
    "investor",
    "pitch",
  ],
  MEDIUM: [
    "help",
    "suggest",
    "advice",
    "guide",
    "tips",
    "what",
    "how",
    "why",
    "when",
    "should",
  ],
};

/**
 * Determining query complexity
 */
const getQueryComplexity = (query) => {
  const lowerQuery = query.toLowerCase();
  const words = lowerQuery.split(/\s+/);

  // Checking for high complexity keywords
  const highComplexityScore = COMPLEXITY_KEYWORDS.HIGH.reduce(
    (score, keyword) => {
      return score + (lowerQuery.includes(keyword) ? 1 : 0);
    },
    0
  );

  // Long queries are typically more complex
  const lengthScore = words.length > 20 ? 1 : 0;

  // Multiple sentences indicate complexity
  const sentenceScore = (query.match(/[.!?]+/g) || []).length > 2 ? 1 : 0;

  const totalScore = highComplexityScore + lengthScore + sentenceScore;

  if (totalScore >= 3) return "HIGH";
  if (totalScore >= 1) return "MEDIUM";
  return "LOW";
};

/**
 * Selecting appropriate model based on query complexity
 */
const selectModel = (query, forceModel = null) => {
  if (forceModel) {
    return CLAUDE_MODELS[forceModel.toUpperCase()] || CLAUDE_MODELS.SONNET;
  }

  const complexity = getQueryComplexity(query);

  switch (complexity) {
    case "HIGH":
      return CLAUDE_MODELS.SONNET;
    case "MEDIUM":
      return CLAUDE_MODELS.SONNET;
    case "LOW":
      return CLAUDE_MODELS.HAIKU;
    default:
      return CLAUDE_MODELS.SONNET;
  }
};

/**
 * System prompts for different contexts
 */
const SYSTEM_PROMPTS = {
  GENERAL: `You are an expert AI startup advisor and co-founder assistant. You provide strategic, actionable advice for early-stage startups. Your expertise includes:

- Business strategy and planning
- Go-to-market strategies
- Product-market fit analysis
- Fundraising and investor relations
- Market research and competitive analysis
- Pricing strategies
- Team building and hiring
- Growth and scaling strategies

Always provide:
1. Clear, actionable recommendations
2. Specific examples when relevant
3. Data-driven insights when possible
4. Consideration of risks and challenges
5. Step-by-step guidance when appropriate

Be concise but thorough. Use bullet points and structure for clarity. Avoid generic advice - tailor responses to the user's specific context.`,

  INVESTOR_OBJECTIONS: `You are an expert at handling investor objections and preparing founders for investor meetings. 

Your role is to:
1. Analyze the objection thoroughly
2. Provide a short, punchy rebuttal (30-60 seconds speaking time)
3. Offer a detailed response with supporting evidence
4. Include relevant statistics, case studies, or examples
5. Suggest proactive ways to address the concern

Format your response as:
**Quick Rebuttal:** [30-60 second response]

**Detailed Response:** [Comprehensive answer with evidence]

**Proactive Actions:** [Steps to address the concern before it's raised]

Be confident but not dismissive. Acknowledge valid concerns while providing compelling counterarguments.`,

  STRATEGY: `You are a strategic business advisor specializing in startup strategy. Focus on:

- Long-term strategic planning
- Competitive positioning
- Market entry strategies
- Business model innovation
- Partnership strategies
- Resource allocation
- Risk management

Provide strategic frameworks, methodologies, and tools. Think big picture while being practical.`,
};

/**
 * Building system prompt with context
 */
const buildSystemPrompt = (type = "GENERAL", projectContext = null) => {
  let prompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.GENERAL;

  if (projectContext) {
    prompt += `\n\n**Project Context:**\n`;
    if (projectContext.name) prompt += `Project Name: ${projectContext.name}\n`;
    if (projectContext.description)
      prompt += `Description: ${projectContext.description}\n`;
    if (projectContext.industry)
      prompt += `Industry: ${projectContext.industry}\n`;
    if (projectContext.stage) prompt += `Stage: ${projectContext.stage}\n`;
    if (projectContext.targetMarket)
      prompt += `Target Market: ${projectContext.targetMarket}\n`;
  }

  return prompt;
};

/**
 * Token usage tracking
 */
const tokenUsageTracker = {
  totalInputTokens: 0,
  totalOutputTokens: 0,
  requestCount: 0,

  track(usage) {
    this.totalInputTokens += usage.input_tokens || 0;
    this.totalOutputTokens += usage.output_tokens || 0;
    this.requestCount += 1;
  },

  getStats() {
    return {
      totalInputTokens: this.totalInputTokens,
      totalOutputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
      requestCount: this.requestCount,
      avgInputTokens:
        Math.round(this.totalInputTokens / this.requestCount) || 0,
      avgOutputTokens:
        Math.round(this.totalOutputTokens / this.requestCount) || 0,
    };
  },

  reset() {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
    this.requestCount = 0;
  },
};

/**
 * Rate limiting for Claude API
 */
const rateLimiter = {
  requests: [],
  maxRequestsPerMinute: 50,

  canMakeRequest() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old requests
    this.requests = this.requests.filter(
      (timestamp) => timestamp > oneMinuteAgo
    );

    return this.requests.length < this.maxRequestsPerMinute;
  },

  recordRequest() {
    this.requests.push(Date.now());
  },

  getWaitTime() {
    if (this.canMakeRequest()) return 0;

    const oldestRequest = this.requests[0];
    const now = Date.now();
    return Math.max(0, 60000 - (now - oldestRequest));
  },
};

module.exports = {
  anthropic,
  CLAUDE_MODELS,
  DEFAULT_PARAMS,
  SYSTEM_PROMPTS,
  selectModel,
  getQueryComplexity,
  buildSystemPrompt,
  tokenUsageTracker,
  rateLimiter,
};
