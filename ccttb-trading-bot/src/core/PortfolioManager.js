/**
 * Portfolio Manager
 * Tracks portfolio balance, positions, and performance
 */

import { logger } from '../utils/logger.js';

export class PortfolioManager {
  constructor(exchange, config) {
    this.exchange = exchange;
    this.config = config;
    this.balance = null;
    this.positions = [];
    this.trades = [];
    this.performance = {
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      totalTrades: 0,
    };
  }

  async update() {
    try {
      // Fetch balance
      this.balance = await this.exchange.fetchBalance();

      // Fetch positions
      if (this.exchange.has['fetchPositions']) {
        this.positions = await this.exchange.fetchPositions();
      }

      // Calculate performance
      await this.calculatePerformance();

      logger.debug('Portfolio updated');
    } catch (error) {
      logger.error('Error updating portfolio:', error);
      throw error;
    }
  }

  async calculatePerformance() {
    try {
      // Fetch recent trades
      const symbol = this.config.get('DEFAULT_TRADING_PAIR') || 'BTC/USDT';
      const trades = await this.exchange.fetchMyTrades(symbol, undefined, 100);

      let totalProfit = 0;
      let totalLoss = 0;
      let wins = 0;

      for (const trade of trades) {
        const profit = trade.profit || 0;

        if (profit > 0) {
          totalProfit += profit;
          wins++;
        } else if (profit < 0) {
          totalLoss += Math.abs(profit);
        }
      }

      this.performance = {
        totalProfit,
        totalLoss,
        netProfit: totalProfit - totalLoss,
        winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
        totalTrades: trades.length,
        wins,
        losses: trades.length - wins,
      };
    } catch (error) {
      logger.error('Error calculating performance:', error);
    }
  }

  getSnapshot() {
    return {
      balance: this.balance,
      positions: this.positions,
      performance: this.performance,
      timestamp: Date.now(),
    };
  }

  getTotalEquity() {
    if (!this.balance) return 0;

    return this.balance.total?.USDT || 0;
  }

  getAvailableBalance(currency = 'USDT') {
    if (!this.balance) return 0;

    return this.balance.free?.[currency] || 0;
  }

  getPerformance() {
    return this.performance;
  }
}
