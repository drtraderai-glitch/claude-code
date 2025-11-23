/**
 * AI Agent Module
 * Uses Claude AI to analyze trading signals and provide recommendations
 */

import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

export class AIAgent {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.model = config.get('AI_MODEL') || 'claude-sonnet-4-5-20250929';
    this.conversationHistory = [];
  }

  async initialize() {
    const apiKey = this.config.get('ANTHROPIC_API_KEY');

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });

    logger.info('AI Agent initialized with model:', this.model);
  }

  async analyzeSignal(signal, marketData) {
    try {
      const prompt = this.buildAnalysisPrompt(signal, marketData);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const analysis = this.parseResponse(response);

      logger.info('AI Agent analysis completed');

      return analysis;
    } catch (error) {
      logger.error('AI Agent analysis failed:', error);
      return {
        approved: true, // Default to approve on error
        confidence: 0.5,
        reasoning: 'AI analysis unavailable, defaulting to strategy signal',
      };
    }
  }

  buildAnalysisPrompt(signal, marketData) {
    const { pair, ticker, ohlcv } = marketData;
    const recentCandles = ohlcv.slice(-10);

    return `You are an expert cryptocurrency trading analyst. Analyze the following trading signal and market data, then provide your recommendation.

**Trading Signal:**
- Type: ${signal.type}
- Confidence: ${signal.confidence}
- Strategy: ${signal.strategy}
- Indicators: ${JSON.stringify(signal.indicators, null, 2)}

**Market Data:**
- Pair: ${pair}
- Current Price: ${ticker.last}
- 24h Change: ${ticker.percentage}%
- 24h Volume: ${ticker.quoteVolume}
- Bid: ${ticker.bid}
- Ask: ${ticker.ask}

**Recent Price Action (last 10 candles):**
${recentCandles.map((c, i) => `${i + 1}. Open: ${c[1]}, High: ${c[2]}, Low: ${c[3]}, Close: ${c[4]}, Volume: ${c[5]}`).join('\n')}

**Your Task:**
1. Evaluate the quality and reliability of this signal
2. Consider market conditions, volatility, and risk factors
3. Provide a clear APPROVE or REJECT recommendation
4. Explain your reasoning in 2-3 sentences

**Response Format:**
{
  "approved": true/false,
  "confidence": 0.0-1.0,
  "reasoning": "your explanation here"
}

Provide only the JSON response, no additional text.`;
  }

  parseResponse(response) {
    try {
      const content = response.content[0].text;

      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON found, parse text response
      const approved = content.toLowerCase().includes('approve') && !content.toLowerCase().includes('not approve');

      return {
        approved,
        confidence: 0.7,
        reasoning: content.substring(0, 200),
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      return {
        approved: true,
        confidence: 0.5,
        reasoning: 'Failed to parse AI response',
      };
    }
  }

  async getMarketInsight(pair, timeframe = '1h') {
    try {
      const prompt = `Provide a brief market analysis for ${pair} on the ${timeframe} timeframe.
      Focus on:
      1. Current trend direction
      2. Key support/resistance levels
      3. Potential risks or opportunities

      Keep response under 150 words.`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      return response.content[0].text;
    } catch (error) {
      logger.error('Error getting market insight:', error);
      return 'Market insight unavailable';
    }
  }

  async suggestStrategy(marketConditions) {
    try {
      const prompt = `Based on the following market conditions, suggest the most appropriate trading strategy:

**Market Conditions:**
${JSON.stringify(marketConditions, null, 2)}

**Available Strategies:**
- rsi_macd: Good for oscillating markets with clear trends
- bollinger_bands: Good for mean reversion in ranging markets
- ema_crossover: Good for trending markets
- hybrid: Combines multiple indicators for robust signals

Recommend one strategy and explain why in 2-3 sentences.

Format: { "strategy": "name", "reasoning": "explanation" }`;

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return {
        strategy: 'hybrid',
        reasoning: 'Default to hybrid strategy',
      };
    } catch (error) {
      logger.error('Error suggesting strategy:', error);
      return {
        strategy: 'hybrid',
        reasoning: 'Error occurred, using default strategy',
      };
    }
  }
}
