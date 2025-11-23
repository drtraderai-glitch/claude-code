/**
 * Risk Manager
 * Handles position sizing, risk assessment, and trading limits
 */

import { logger } from '../utils/logger.js';

export class RiskManager {
  constructor(config) {
    this.config = config;
    this.dailyLoss = 0;
    this.dailyTrades = 0;
    this.lastResetDate = new Date().toDateString();
  }

  async evaluateSignal(signal, marketData) {
    // Reset daily counters if new day
    this.resetDailyCountersIfNeeded();

    // Check daily loss limit
    const maxDailyLoss = parseFloat(this.config.get('MAX_DAILY_LOSS')) || 100;
    if (this.dailyLoss >= maxDailyLoss) {
      return {
        approved: false,
        reason: `Daily loss limit reached: ${this.dailyLoss}/${maxDailyLoss}`,
      };
    }

    // Check daily trade limit
    const maxDailyTrades = parseInt(this.config.get('MAX_DAILY_TRADES')) || 10;
    if (this.dailyTrades >= maxDailyTrades) {
      return {
        approved: false,
        reason: `Daily trade limit reached: ${this.dailyTrades}/${maxDailyTrades}`,
      };
    }

    // Check signal confidence
    const minConfidence = parseFloat(this.config.get('AI_CONFIDENCE_THRESHOLD')) || 0.7;
    if (signal.confidence < minConfidence) {
      return {
        approved: false,
        reason: `Signal confidence too low: ${signal.confidence} < ${minConfidence}`,
      };
    }

    // Check AI approval if available
    if (signal.aiApproved === false) {
      return {
        approved: false,
        reason: 'AI Agent rejected the signal',
      };
    }

    // Check volatility
    const volatilityCheck = this.checkVolatility(marketData);
    if (!volatilityCheck.safe) {
      return {
        approved: false,
        reason: volatilityCheck.reason,
      };
    }

    return {
      approved: true,
      reason: 'All risk checks passed',
    };
  }

  async calculatePositionSize(price, signal) {
    const riskPercentage = parseFloat(this.config.get('RISK_PERCENTAGE')) || 2;
    const maxPositionSize = parseFloat(this.config.get('MAX_POSITION_SIZE')) || 0.1;
    const defaultSize = parseFloat(this.config.get('DEFAULT_POSITION_SIZE')) || 0.01;

    // Calculate position size based on confidence
    let positionSize = defaultSize * (signal.confidence || 1);

    // Apply risk-based adjustment
    positionSize = positionSize * (riskPercentage / 100);

    // Cap at maximum
    positionSize = Math.min(positionSize, maxPositionSize);

    logger.info(`Calculated position size: ${positionSize} (confidence: ${signal.confidence})`);

    return positionSize;
  }

  checkVolatility(marketData) {
    try {
      const closes = marketData.ohlcv.map(candle => candle[4]);
      const returns = [];

      for (let i = 1; i < closes.length; i++) {
        returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
      }

      const volatility = this.calculateStandardDeviation(returns);

      // Threshold for high volatility (5% standard deviation)
      const maxVolatility = 0.05;

      if (volatility > maxVolatility) {
        return {
          safe: false,
          reason: `Market volatility too high: ${(volatility * 100).toFixed(2)}%`,
        };
      }

      return { safe: true };
    } catch (error) {
      logger.warn('Error checking volatility:', error);
      return { safe: true }; // Default to safe if calculation fails
    }
  }

  calculateStandardDeviation(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  recordTrade(profit) {
    this.dailyTrades++;
    if (profit < 0) {
      this.dailyLoss += Math.abs(profit);
    }
  }

  resetDailyCountersIfNeeded() {
    const today = new Date().toDateString();
    if (this.lastResetDate !== today) {
      this.dailyLoss = 0;
      this.dailyTrades = 0;
      this.lastResetDate = today;
      logger.info('Daily risk counters reset');
    }
  }

  getDailyStats() {
    return {
      dailyLoss: this.dailyLoss,
      dailyTrades: this.dailyTrades,
      lastReset: this.lastResetDate,
    };
  }
}
