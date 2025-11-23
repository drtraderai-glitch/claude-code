#!/usr/bin/env node

/**
 * Backtesting Utility
 * Test trading strategies against historical data
 */

import ccxt from 'ccxt';
import dotenv from 'dotenv';
import { StrategyFactory } from '../strategies/StrategyFactory.js';
import { ConfigManager } from './config.js';
import { logger } from './logger.js';

dotenv.config();

class Backtester {
  constructor(config) {
    this.config = config;
    this.exchange = null;
    this.strategy = null;
    this.results = {
      trades: [],
      totalProfit: 0,
      totalLoss: 0,
      winRate: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
    };
  }

  async initialize() {
    const exchangeName = this.config.get('EXCHANGE_NAME') || 'binance';
    const ExchangeClass = ccxt[exchangeName];

    this.exchange = new ExchangeClass({
      enableRateLimit: true,
    });

    await this.exchange.loadMarkets();

    const strategyName = this.config.get('ACTIVE_STRATEGY') || 'rsi_macd';
    this.strategy = StrategyFactory.create(strategyName, this.config);

    logger.info(`Backtester initialized with ${strategyName} strategy`);
  }

  async run(pair, startDate, endDate, timeframe = '1h') {
    logger.info(`Running backtest for ${pair} from ${startDate} to ${endDate}`);

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    // Fetch historical data
    const ohlcv = await this.exchange.fetchOHLCV(pair, timeframe, start, 1000);

    let balance = parseFloat(this.config.get('BACKTEST_INITIAL_CAPITAL')) || 10000;
    let position = null;
    const trades = [];

    // Simulate trading
    for (let i = 100; i < ohlcv.length; i++) {
      const currentCandle = ohlcv[i];
      const historicalData = ohlcv.slice(0, i + 1);

      const marketData = {
        pair,
        timeframe,
        ohlcv: historicalData,
        ticker: {
          last: currentCandle[4],
          bid: currentCandle[4],
          ask: currentCandle[4],
        },
        timestamp: currentCandle[0],
      };

      const signal = await this.strategy.analyze(marketData);

      // Execute trades based on signals
      if (signal.type === 'BUY' && !position && signal.confidence > 0.7) {
        position = {
          entryPrice: currentCandle[4],
          amount: balance * 0.1 / currentCandle[4],
          timestamp: currentCandle[0],
        };
        logger.debug(`BUY at ${currentCandle[4]}`);
      } else if (signal.type === 'SELL' && position) {
        const exitPrice = currentCandle[4];
        const profit = (exitPrice - position.entryPrice) * position.amount;
        balance += profit;

        trades.push({
          entry: position.entryPrice,
          exit: exitPrice,
          profit,
          duration: currentCandle[0] - position.timestamp,
        });

        logger.debug(`SELL at ${exitPrice}, Profit: ${profit}`);
        position = null;
      }
    }

    // Calculate results
    this.calculateResults(trades, balance);

    return this.results;
  }

  calculateResults(trades, finalBalance) {
    const initialCapital = parseFloat(this.config.get('BACKTEST_INITIAL_CAPITAL')) || 10000;

    let totalProfit = 0;
    let totalLoss = 0;
    let wins = 0;

    for (const trade of trades) {
      if (trade.profit > 0) {
        totalProfit += trade.profit;
        wins++;
      } else {
        totalLoss += Math.abs(trade.profit);
      }
    }

    this.results = {
      trades: trades.length,
      wins,
      losses: trades.length - wins,
      totalProfit,
      totalLoss,
      netProfit: totalProfit - totalLoss,
      winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
      initialCapital,
      finalBalance,
      returnPercentage: ((finalBalance - initialCapital) / initialCapital) * 100,
    };

    logger.info('Backtest Results:');
    logger.info(`  Total Trades: ${this.results.trades}`);
    logger.info(`  Win Rate: ${this.results.winRate.toFixed(2)}%`);
    logger.info(`  Net Profit: $${this.results.netProfit.toFixed(2)}`);
    logger.info(`  Return: ${this.results.returnPercentage.toFixed(2)}%`);
  }
}

// CLI execution
async function main() {
  const config = new ConfigManager();
  await config.load();

  const backtester = new Backtester(config);
  await backtester.initialize();

  const pair = process.argv[2] || config.get('DEFAULT_TRADING_PAIR') || 'BTC/USDT';
  const startDate = process.argv[3] || config.get('BACKTEST_START_DATE') || '2024-01-01';
  const endDate = process.argv[4] || config.get('BACKTEST_END_DATE') || '2024-12-31';

  await backtester.run(pair, startDate, endDate);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    logger.error('Backtest failed:', error);
    process.exit(1);
  });
}

export { Backtester };
