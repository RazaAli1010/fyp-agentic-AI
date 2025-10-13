const Project = require("../models/Project.js");

/**
 * Build project context for RAG (Retrieval-Augmented Generation)
 */
const buildProjectContext = async (project) => {
  try {
    const context = {
      name: project.name,
      description: project.description,
      industry: project.industry,
      stage: project.stage,
      targetMarket: project.targetMarket,
    };

    // Add market research data if available
    if (project.marketResearch) {
      context.marketResearch = {
        tam: project.marketResearch.tam,
        sam: project.marketResearch.sam,
        som: project.marketResearch.som,
        competitors: project.marketResearch.competitors?.slice(0, 5) || [],
      };
    }

    // Add user personas if available
    if (project.userPersonas && project.userPersonas.length > 0) {
      context.userPersonas = project.userPersonas.map((persona) => ({
        name: persona.name,
        demographics: persona.demographics,
        painPoints: persona.painPoints,
      }));
    }

    // Add business model if available
    if (project.businessModel) {
      context.businessModel = {
        revenueStreams: project.businessModel.revenueStreams,
        pricingStrategy: project.businessModel.pricingStrategy,
      };
    }

    // Add team information if available
    if (project.team && project.team.length > 0) {
      context.team = project.team.map((member) => ({
        role: member.role,
        expertise: member.expertise,
      }));
    }

    // Add traction/metrics if available
    if (project.traction) {
      context.traction = {
        users: project.traction.users,
        revenue: project.traction.revenue,
        growth: project.traction.growth,
      };
    }

    return context;
  } catch (error) {
    console.error("Error building project context:", error);
    return null;
  }
};

/**
 * Extract relevant context based on query
 */
const extractRelevantContext = (projectContext, query) => {
  if (!projectContext) return null;

  const lowerQuery = query.toLowerCase();
  const relevantContext = {};

  // Always include basic info
  relevantContext.name = projectContext.name;
  relevantContext.description = projectContext.description;

  // Market-related queries
  if (lowerQuery.match(/market|competition|competitor|tam|sam|som/i)) {
    if (projectContext.marketResearch) {
      relevantContext.marketResearch = projectContext.marketResearch;
    }
    if (projectContext.targetMarket) {
      relevantContext.targetMarket = projectContext.targetMarket;
    }
  }

  // User/customer-related queries
  if (lowerQuery.match(/user|customer|persona|audience|target/i)) {
    if (projectContext.userPersonas) {
      relevantContext.userPersonas = projectContext.userPersonas;
    }
  }

  // Business model queries
  if (lowerQuery.match(/revenue|pricing|monetiz|business model|income/i)) {
    if (projectContext.businessModel) {
      relevantContext.businessModel = projectContext.businessModel;
    }
  }

  // Team queries
  if (lowerQuery.match(/team|hire|hiring|founder|cofounder/i)) {
    if (projectContext.team) {
      relevantContext.team = projectContext.team;
    }
  }

  // Traction queries
  if (lowerQuery.match(/traction|growth|metric|user|revenue|mrr|arr/i)) {
    if (projectContext.traction) {
      relevantContext.traction = projectContext.traction;
    }
  }

  return Object.keys(relevantContext).length > 2
    ? relevantContext
    : projectContext;
};

/**
 * Build conversation context window
 */
const buildConversationContext = (messages, maxMessages = 10) => {
  if (!messages || messages.length === 0) return [];

  // Get last N messages
  const recentMessages = messages.slice(-maxMessages);

  return recentMessages.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }));
};

/**
 * Summarize long context for token efficiency
 */
const summarizeContext = (context) => {
  const summary = {};

  if (context.name) summary.name = context.name;
  if (context.description) {
    summary.description =
      context.description.length > 200
        ? context.description.substring(0, 200) + "..."
        : context.description;
  }

  if (context.marketResearch) {
    summary.marketSize = {
      tam: context.marketResearch.tam,
      sam: context.marketResearch.sam,
      som: context.marketResearch.som,
    };
    if (context.marketResearch.competitors) {
      summary.topCompetitors = context.marketResearch.competitors
        .slice(0, 3)
        .map((c) => c.name || c);
    }
  }

  if (context.userPersonas) {
    summary.targetAudience = context.userPersonas
      .slice(0, 2)
      .map((p) => p.name || "Unnamed persona");
  }

  return summary;
};

/**
 * Calculate context token estimate
 */
const estimateContextTokens = (context) => {
  const contextString = JSON.stringify(context);
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(contextString.length / 4);
};

/**
 * Optimize context based on token budget
 */
const optimizeContext = (context, maxTokens = 2000) => {
  const estimatedTokens = estimateContextTokens(context);

  if (estimatedTokens <= maxTokens) {
    return context;
  }

  // If too large, use summarized version
  return summarizeContext(context);
};

/**
 * Extract entities from text (simple NER)
 */
const extractEntities = (text) => {
  const entities = {
    companies: [],
    products: [],
    technologies: [],
    metrics: [],
  };

  // Simple regex patterns (can be enhanced with NLP libraries)
  const companyPattern =
    /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Inc|LLC|Corp|Ltd|Company)\b/g;
  const metricPattern =
    /\$[\d,]+(?:\.\d{2})?|\d+%|\d+(?:K|M|B)\s+(?:users|customers|revenue)/gi;

  const companyMatches = text.match(companyPattern);
  if (companyMatches) {
    entities.companies = [...new Set(companyMatches)];
  }

  const metricMatches = text.match(metricPattern);
  if (metricMatches) {
    entities.metrics = [...new Set(metricMatches)];
  }

  return entities;
};

/**
 * Build enhanced context with metadata
 */
const buildEnhancedContext = async (project, conversationHistory = []) => {
  const baseContext = await buildProjectContext(project);

  if (!baseContext) return null;

  // Extract entities from conversation
  const conversationText = conversationHistory
    .map((msg) => msg.content)
    .join(" ");

  const entities = extractEntities(conversationText);

  return {
    ...baseContext,
    conversationEntities: entities,
    conversationLength: conversationHistory.length,
  };
};

module.exports = {
  buildProjectContext,
  extractRelevantContext,
  buildConversationContext,
  summarizeContext,
  estimateContextTokens,
  optimizeContext,
  extractEntities,
  buildEnhancedContext,
};
