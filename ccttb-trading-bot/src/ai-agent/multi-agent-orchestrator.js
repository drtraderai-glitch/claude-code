/**
 * Multi-Agent AI Orchestrator
 * Each trading component becomes an intelligent AI agent that reasons and makes decisions
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';
import { EventEmitter } from 'events';

export class MultiAgentOrchestrator extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.anthropic = new Anthropic({
      apiKey: config.get('ANTHROPIC_API_KEY'),
    });
    this.model = config.get('AI_MODEL') || 'claude-sonnet-4-5-20250929';

    // AI Agents for each component
    this.agents = {
      strategist: new AIAgent('Market Strategist', this.anthropic, this.model),
      riskManager: new AIAgent('Risk Manager', this.anthropic, this.model),
      portfolioManager: new AIAgent('Portfolio Manager', this.anthropic, this.model),
      technicalAnalyst: new AIAgent('Technical Analyst', this.anthropic, this.model),
      sentimentAnalyst: new AIAgent('Sentiment Analyst', this.anthropic, this.model),
      executionManager: new AIAgent('Execution Manager', this.anthropic, this.model),
      supervisor: new AIAgent('Trading Supervisor', this.anthropic, this.model),
    };

    this.conversationHistory = [];
    this.decisions = [];
  }

  async initialize() {
    logger.info('🤖 Initializing Multi-Agent AI Orchestrator...');

    // Initialize each agent with their role and expertise
    await this.initializeAgents();

    logger.info('✅ All AI agents initialized and ready');
  }

  async initializeAgents() {
    const roles = {
      strategist: {
        role: 'Market Strategist',
        expertise: 'You are an expert market strategist with 20 years of trading experience. You analyze market conditions, identify trends, and recommend optimal trading strategies. You consider technical patterns, market structure, volatility, and current economic conditions.',
        responsibilities: [
          'Analyze overall market conditions',
          'Identify trading opportunities',
          'Recommend strategy adjustments',
          'Assess market regime (trending, ranging, volatile)',
        ],
      },
      riskManager: {
        role: 'Risk Manager',
        expertise: 'You are a professional risk manager focused on capital preservation. You evaluate every trade for risk/reward ratio, position sizing, correlation risk, and portfolio exposure. You have veto power over trades that exceed risk parameters.',
        responsibilities: [
          'Evaluate trade risk/reward ratios',
          'Calculate optimal position sizes',
          'Monitor portfolio exposure and correlation',
          'Reject trades that violate risk rules',
        ],
      },
      portfolioManager: {
        role: 'Portfolio Manager',
        expertise: 'You manage the overall portfolio performance, allocation, and rebalancing. You track P&L, analyze performance metrics, and optimize capital allocation across different strategies and instruments.',
        responsibilities: [
          'Monitor portfolio performance',
          'Optimize capital allocation',
          'Track and analyze P&L',
          'Recommend rebalancing when needed',
        ],
      },
      technicalAnalyst: {
        role: 'Technical Analyst',
        expertise: 'You are an expert in technical analysis with deep knowledge of chart patterns, indicators, support/resistance levels, and price action. You can read charts like a book and identify high-probability setups.',
        responsibilities: [
          'Analyze technical indicators',
          'Identify chart patterns',
          'Determine support/resistance levels',
          'Assess momentum and trend strength',
        ],
      },
      sentimentAnalyst: {
        role: 'Sentiment Analyst',
        expertise: 'You analyze market sentiment, news impact, social media trends, and institutional positioning. You gauge market psychology and identify potential turning points based on extreme sentiment.',
        responsibilities: [
          'Analyze market sentiment',
          'Assess news impact',
          'Monitor social sentiment',
          'Identify contrarian opportunities',
        ],
      },
      executionManager: {
        role: 'Execution Manager',
        expertise: 'You manage trade execution, order placement, slippage minimization, and timing. You ensure orders are executed at optimal prices with minimal market impact.',
        responsibilities: [
          'Optimize order execution',
          'Manage order placement timing',
          'Monitor execution quality',
          'Adjust orders based on market conditions',
        ],
      },
      supervisor: {
        role: 'Trading Supervisor',
        expertise: 'You are the senior trading supervisor who makes final decisions. You coordinate all agents, resolve conflicts, and ensure decisions align with overall trading objectives. You have the final say on all trades.',
        responsibilities: [
          'Coordinate all AI agents',
          'Make final trading decisions',
          'Resolve conflicts between agents',
          'Ensure alignment with objectives',
        ],
      },
    };

    for (const [key, agent] of Object.entries(this.agents)) {
      const roleConfig = roles[key];
      agent.setRole(roleConfig);
      logger.info(`✅ Initialized ${roleConfig.role}`);
    }
  }

  async analyzeMarketConditions(marketData) {
    logger.info('🔍 Multi-agent analysis started...');

    const analyses = {};

    // Run all agents in parallel
    const [
      strategistAnalysis,
      technicalAnalysis,
      sentimentAnalysis,
      riskAnalysis,
      portfolioAnalysis,
    ] = await Promise.all([
      this.agents.strategist.analyze(marketData, 'market_conditions'),
      this.agents.technicalAnalyst.analyze(marketData, 'technical_analysis'),
      this.agents.sentimentAnalyst.analyze(marketData, 'sentiment_analysis'),
      this.agents.riskManager.analyze(marketData, 'risk_assessment'),
      this.agents.portfolioManager.analyze(marketData, 'portfolio_health'),
    ]);

    analyses.strategist = strategistAnalysis;
    analyses.technical = technicalAnalysis;
    analyses.sentiment = sentimentAnalysis;
    analyses.risk = riskAnalysis;
    analyses.portfolio = portfolioAnalysis;

    // Supervisor makes final decision based on all analyses
    const finalDecision = await this.agents.supervisor.makeDecision({
      marketData,
      analyses,
      context: 'trading_decision',
    });

    logger.info('✅ Multi-agent analysis complete');

    return {
      analyses,
      finalDecision,
      timestamp: Date.now(),
    };
  }

  async evaluateTradeSignal(signal, marketData, currentPositions) {
    logger.info(`🤖 Evaluating ${signal.type} signal with AI agents...`);

    const context = {
      signal,
      marketData,
      currentPositions,
      timestamp: Date.now(),
    };

    // Each agent evaluates the signal from their perspective
    const evaluations = await Promise.all([
      this.agents.technicalAnalyst.evaluateSignal(context),
      this.agents.strategist.evaluateSignal(context),
      this.agents.riskManager.evaluateSignal(context),
      this.agents.sentimentAnalyst.evaluateSignal(context),
      this.agents.portfolioManager.evaluateSignal(context),
    ]);

    // Execution manager plans the execution
    const executionPlan = await this.agents.executionManager.planExecution({
      signal,
      marketData,
      evaluations,
    });

    // Supervisor makes final decision with all input
    const finalDecision = await this.agents.supervisor.makeDecision({
      signal,
      marketData,
      evaluations,
      executionPlan,
      context: 'trade_execution',
    });

    // Store decision for learning
    this.decisions.push({
      signal,
      evaluations,
      executionPlan,
      finalDecision,
      timestamp: Date.now(),
    });

    this.emit('decisionMade', finalDecision);

    return finalDecision;
  }

  async coordinateAgents(task, data) {
    logger.info(`🎯 Coordinating agents for: ${task}`);

    // Supervisor coordinates the task
    const coordination = await this.agents.supervisor.coordinate({
      task,
      data,
      availableAgents: Object.keys(this.agents),
    });

    // Execute coordinated plan
    const results = {};
    for (const step of coordination.steps) {
      const agent = this.agents[step.agent];
      results[step.agent] = await agent.execute(step.action, step.data);
    }

    return {
      task,
      coordination,
      results,
      timestamp: Date.now(),
    };
  }

  getDecisionHistory() {
    return this.decisions;
  }

  async shutdown() {
    logger.info('Shutting down AI agents...');
    for (const agent of Object.values(this.agents)) {
      await agent.cleanup();
    }
  }
}

/**
 * Individual AI Agent
 * Each agent is an autonomous AI with specific expertise and decision-making capability
 */
class AIAgent {
  constructor(name, anthropic, model) {
    this.name = name;
    this.anthropic = anthropic;
    this.model = model;
    this.role = null;
    this.conversationHistory = [];
    this.decisions = [];
  }

  setRole(roleConfig) {
    this.role = roleConfig;
  }

  async analyze(data, analysisType) {
    const prompt = this.buildAnalysisPrompt(data, analysisType);

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2048,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysis = this.parseResponse(response);

      this.conversationHistory.push({
        type: analysisType,
        data,
        analysis,
        timestamp: Date.now(),
      });

      return analysis;
    } catch (error) {
      logger.error(`${this.name} analysis failed:`, error);
      return {
        success: false,
        error: error.message,
        recommendation: 'HOLD',
      };
    }
  }

  async evaluateSignal(context) {
    const prompt = `You are ${this.role.role}.

${this.role.expertise}

Your responsibilities:
${this.role.responsibilities.map(r => `- ${r}`).join('\n')}

TRADE SIGNAL TO EVALUATE:
${JSON.stringify(context.signal, null, 2)}

MARKET DATA:
- Pair: ${context.marketData.pair}
- Current Price: ${context.marketData.ticker.last}
- 24h Change: ${context.marketData.ticker.percentage}%
- Volume: ${context.marketData.ticker.volume}

CURRENT POSITIONS:
${context.currentPositions.size > 0 ?
  Array.from(context.currentPositions.entries()).map(([pair, pos]) =>
    `- ${pair}: ${pos.side} ${pos.size} @ ${pos.entryPrice}`
  ).join('\n') :
  'No open positions'}

From your perspective as ${this.role.role}, evaluate this signal.

Provide your evaluation in JSON format:
{
  "recommendation": "APPROVE" | "REJECT" | "CONDITIONAL",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation",
  "concerns": ["list", "of", "concerns"],
  "suggestions": ["list", "of", "suggestions"],
  "key_factors": {
    "positive": ["factors"],
    "negative": ["factors"]
  }
}

Be thorough, honest, and prioritize risk management. Only approve signals you truly believe in.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1500,
        temperature: 0.8,
        messages: [{ role: 'user', content: prompt }],
      });

      return this.parseResponse(response);
    } catch (error) {
      logger.error(`${this.name} evaluation failed:`, error);
      return {
        recommendation: 'REJECT',
        confidence: 0,
        reasoning: 'Evaluation failed due to error',
        concerns: [error.message],
      };
    }
  }

  async makeDecision(context) {
    const prompt = `You are ${this.role.role}.

${this.role.expertise}

CONTEXT:
${JSON.stringify(context, null, 2)}

Based on all the information provided, make your final decision.

Respond in JSON format:
{
  "decision": "EXECUTE" | "HOLD" | "CLOSE",
  "confidence": 0.0-1.0,
  "reasoning": "comprehensive explanation",
  "action_plan": {
    "immediate": ["actions to take now"],
    "conditional": ["actions if conditions are met"],
    "monitor": ["metrics to watch"]
  },
  "risk_assessment": {
    "level": "LOW" | "MEDIUM" | "HIGH",
    "factors": ["risk factors"],
    "mitigation": ["risk mitigation steps"]
  }
}

Think like an experienced trader. Consider all angles, be conservative when uncertain, and explain your reasoning clearly.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      const decision = this.parseResponse(response);

      this.decisions.push({
        context,
        decision,
        timestamp: Date.now(),
      });

      return decision;
    } catch (error) {
      logger.error(`${this.name} decision failed:`, error);
      return {
        decision: 'HOLD',
        confidence: 0,
        reasoning: 'Decision process failed',
      };
    }
  }

  async planExecution(context) {
    const prompt = `You are ${this.role.role}.

${this.role.expertise}

EXECUTION CONTEXT:
${JSON.stringify(context, null, 2)}

Plan the optimal execution for this trade.

Respond in JSON format:
{
  "execution_strategy": "MARKET" | "LIMIT" | "ICEBERG" | "TWAP",
  "timing": {
    "immediate": true/false,
    "optimal_time": "time description",
    "avoid_periods": ["periods to avoid"]
  },
  "order_structure": {
    "entry_method": "description",
    "position_sizing": "strategy",
    "split_orders": true/false
  },
  "risk_controls": {
    "stop_loss": "strategy",
    "take_profit": "strategy",
    "trailing_stop": true/false
  },
  "monitoring_plan": {
    "check_intervals": "frequency",
    "key_metrics": ["metrics to monitor"],
    "exit_conditions": ["when to exit"]
  }
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      return this.parseResponse(response);
    } catch (error) {
      logger.error(`${this.name} execution planning failed:`, error);
      return {
        execution_strategy: 'MARKET',
        timing: { immediate: true },
      };
    }
  }

  async coordinate(context) {
    // Supervisor coordination logic
    const prompt = `You are ${this.role.role}.

COORDINATION TASK:
${JSON.stringify(context, null, 2)}

Available agents: ${context.availableAgents.join(', ')}

Create a coordination plan that leverages each agent's expertise.

Respond in JSON format:
{
  "steps": [
    {
      "agent": "agent_name",
      "action": "action_description",
      "data": {},
      "priority": 1-10
    }
  ],
  "coordination_strategy": "description",
  "expected_outcome": "what we expect to achieve"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1500,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      return this.parseResponse(response);
    } catch (error) {
      logger.error(`${this.name} coordination failed:`, error);
      return { steps: [] };
    }
  }

  async execute(action, data) {
    logger.info(`${this.name} executing: ${action}`);

    // Execute the action with AI reasoning
    const prompt = `Execute this action: ${action}

Data: ${JSON.stringify(data, null, 2)}

Provide your execution result and any insights.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }],
      });

      return this.parseResponse(response);
    } catch (error) {
      logger.error(`${this.name} execution failed:`, error);
      return { success: false, error: error.message };
    }
  }

  buildAnalysisPrompt(data, analysisType) {
    return `You are ${this.role.role}.

${this.role.expertise}

Analyze the following data from your expert perspective:

${JSON.stringify(data, null, 2)}

Analysis Type: ${analysisType}

Provide a comprehensive analysis in JSON format:
{
  "summary": "brief overview",
  "key_insights": ["insight1", "insight2"],
  "opportunities": ["opportunity1", "opportunity2"],
  "risks": ["risk1", "risk2"],
  "recommendation": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation",
  "action_items": ["action1", "action2"]
}`;
  }

  parseResponse(response) {
    try {
      const content = response.content[0].text;

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON found, return text response
      return {
        success: true,
        content: content,
        recommendation: 'HOLD',
      };
    } catch (error) {
      logger.error(`${this.name} response parsing failed:`, error);
      return {
        success: false,
        error: 'Failed to parse response',
        content: response.content[0].text,
      };
    }
  }

  async cleanup() {
    logger.info(`${this.name} cleanup complete`);
  }

  getDecisionHistory() {
    return this.decisions;
  }

  getConversationHistory() {
    return this.conversationHistory;
  }
}

export { AIAgent };
