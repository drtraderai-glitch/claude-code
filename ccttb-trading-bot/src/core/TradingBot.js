/**
 * Trading Bot Core Engine
 * Handles trading logic, order execution, and strategy management
 */

import ccxt from 'ccxt';
import cron from 'node-cron';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { RiskManager } from './RiskManager.js';
import { OrderManager } from './OrderManager.js';
import { PortfolioManager } from './PortfolioManager.js';
import { StrategyFactory } from '../strategies/StrategyFactory.js';

export class TradingBot extends EventEmitter {
  constructor(config, aiAgent = null) {
    super();
    this.config = config;
    this.aiAgent = aiAgent;
    this.exchange = null;
    this.riskManager = null;
    this.orderManager = null;
    this.portfolioManager = null;
    this.strategy = null;
    this.isRunning = false;
    this.cronJobs = [];
    this.positions = new Map();
  }

  async initialize() {
    logger.info('Initializing Trading Bot...');

    // Initialize exchange
    await this.initializeExchange();

    // Initialize managers
    this.riskManager = new RiskManager(this.config);
    this.orderManager = new OrderManager(this.exchange, this.config);
    this.portfolioManager = new PortfolioManager(this.exchange, this.config);

    // Initialize strategy
    const strategyName = this.config.get('ACTIVE_STRATEGY') || 'rsi_macd';
    this.strategy = StrategyFactory.create(strategyName, this.config);

    logger.info(`Strategy loaded: ${strategyName}`);
  }

  async initializeExchange() {
    const exchangeName = this.config.get('EXCHANGE_NAME') || 'binance';
    const ExchangeClass = ccxt[exchangeName];

    if (!ExchangeClass) {
      throw new Error(`Exchange ${exchangeName} not supported`);
    }

    this.exchange = new ExchangeClass({
      apiKey: this.config.get('EXCHANGE_API_KEY'),
      secret: this.config.get('EXCHANGE_API_SECRET'),
      enableRateLimit: true,
      options: {
        defaultType: 'future',
        adjustForTimeDifference: true,
      },
    });

    // Enable testnet if configured
    if (this.config.get('EXCHANGE_TESTNET') === 'true') {
      this.exchange.setSandboxMode(true);
      logger.info('⚠️  Running in TESTNET mode');
    }

    // Test connection
    await this.exchange.loadMarkets();
    logger.info(`✅ Connected to ${exchangeName}`);
  }

  async start() {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🎯 Starting trading bot...');

    // Schedule trading loop
    const timeframe = this.config.get('DEFAULT_TIMEFRAME') || '1h';
    const cronPattern = this.getCronPattern(timeframe);

    const tradingJob = cron.schedule(cronPattern, async () => {
      await this.executeTradingCycle();
    });

    this.cronJobs.push(tradingJob);

    // Schedule portfolio updates every 5 minutes
    const portfolioJob = cron.schedule('*/5 * * * *', async () => {
      await this.updatePortfolio();
    });

    this.cronJobs.push(portfolioJob);

    // Initial execution
    await this.executeTradingCycle();

    this.emit('started');
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping trading bot...');
    this.isRunning = false;

    // Stop all cron jobs
    this.cronJobs.forEach(job => job.stop());
    this.cronJobs = [];

    // Close all positions if configured
    if (this.config.get('CLOSE_POSITIONS_ON_STOP') === 'true') {
      await this.closeAllPositions();
    }

    this.emit('stopped');
    logger.info('✅ Bot stopped');
  }

  async executeTradingCycle() {
    try {
      logger.info('📊 Executing trading cycle...');

      const pair = this.config.get('DEFAULT_TRADING_PAIR') || 'BTC/USDT';
      const timeframe = this.config.get('DEFAULT_TIMEFRAME') || '1h';

      // Fetch market data
      const ohlcv = await this.exchange.fetchOHLCV(pair, timeframe, undefined, 500);
      const ticker = await this.exchange.fetchTicker(pair);

      // Prepare market data
      const marketData = {
        pair,
        timeframe,
        ohlcv,
        ticker,
        timestamp: Date.now(),
      };

      // Run strategy analysis
      const signal = await this.strategy.analyze(marketData);

      logger.info(`Signal generated: ${signal.type} (confidence: ${signal.confidence})`);

      // Get AI Agent recommendation if available
      if (this.aiAgent) {
        const aiRecommendation = await this.aiAgent.analyzeSignal(signal, marketData);
        signal.aiApproved = aiRecommendation.approved;
        signal.aiReasoning = aiRecommendation.reasoning;

        logger.info(`AI Analysis: ${aiRecommendation.approved ? '✅ Approved' : '❌ Rejected'}`);
        logger.info(`AI Reasoning: ${aiRecommendation.reasoning}`);
      }

      // Check risk management
      const riskCheck = await this.riskManager.evaluateSignal(signal, marketData);

      if (!riskCheck.approved) {
        logger.warn(`Risk check failed: ${riskCheck.reason}`);
        this.emit('signalRejected', { signal, reason: riskCheck.reason });
        return;
      }

      // Execute trade based on signal
      if (signal.type === 'BUY' || signal.type === 'LONG') {
        await this.executeBuy(signal, marketData);
      } else if (signal.type === 'SELL' || signal.type === 'SHORT') {
        await this.executeSell(signal, marketData);
      } else if (signal.type === 'CLOSE') {
        await this.closePosition(pair);
      }

      this.emit('cycleCompleted', { signal, marketData });
    } catch (error) {
      logger.error('Error in trading cycle:', error);
      this.emit('error', error);
    }
  }

  async executeBuy(signal, marketData) {
    const pair = marketData.pair;
    const price = marketData.ticker.last;

    // Calculate position size
    const positionSize = await this.riskManager.calculatePositionSize(price, signal);

    // Calculate stop loss and take profit
    const stopLoss = price * (1 - parseFloat(this.config.get('STOP_LOSS_PERCENTAGE')) / 100);
    const takeProfit = price * (1 + parseFloat(this.config.get('TAKE_PROFIT_PERCENTAGE')) / 100);

    logger.info(`🟢 Executing BUY order for ${pair}`);
    logger.info(`   Price: ${price}, Size: ${positionSize}`);
    logger.info(`   Stop Loss: ${stopLoss}, Take Profit: ${takeProfit}`);

    try {
      // Place market order
      const order = await this.orderManager.createMarketOrder(pair, 'buy', positionSize);

      // Place stop loss and take profit orders
      await this.orderManager.createStopLossOrder(pair, 'sell', positionSize, stopLoss);
      await this.orderManager.createTakeProfitOrder(pair, 'sell', positionSize, takeProfit);

      // Store position
      this.positions.set(pair, {
        side: 'long',
        entryPrice: price,
        size: positionSize,
        stopLoss,
        takeProfit,
        timestamp: Date.now(),
        signal,
      });

      this.emit('orderExecuted', { type: 'buy', order, signal });
      logger.info('✅ BUY order executed successfully');
    } catch (error) {
      logger.error('❌ Failed to execute BUY order:', error);
      this.emit('orderFailed', { type: 'buy', error, signal });
    }
  }

  async executeSell(signal, marketData) {
    const pair = marketData.pair;
    const price = marketData.ticker.last;

    // Calculate position size
    const positionSize = await this.riskManager.calculatePositionSize(price, signal);

    // Calculate stop loss and take profit
    const stopLoss = price * (1 + parseFloat(this.config.get('STOP_LOSS_PERCENTAGE')) / 100);
    const takeProfit = price * (1 - parseFloat(this.config.get('TAKE_PROFIT_PERCENTAGE')) / 100);

    logger.info(`🔴 Executing SELL order for ${pair}`);
    logger.info(`   Price: ${price}, Size: ${positionSize}`);
    logger.info(`   Stop Loss: ${stopLoss}, Take Profit: ${takeProfit}`);

    try {
      // Place market order
      const order = await this.orderManager.createMarketOrder(pair, 'sell', positionSize);

      // Place stop loss and take profit orders
      await this.orderManager.createStopLossOrder(pair, 'buy', positionSize, stopLoss);
      await this.orderManager.createTakeProfitOrder(pair, 'buy', positionSize, takeProfit);

      // Store position
      this.positions.set(pair, {
        side: 'short',
        entryPrice: price,
        size: positionSize,
        stopLoss,
        takeProfit,
        timestamp: Date.now(),
        signal,
      });

      this.emit('orderExecuted', { type: 'sell', order, signal });
      logger.info('✅ SELL order executed successfully');
    } catch (error) {
      logger.error('❌ Failed to execute SELL order:', error);
      this.emit('orderFailed', { type: 'sell', error, signal });
    }
  }

  async closePosition(pair) {
    const position = this.positions.get(pair);

    if (!position) {
      logger.warn(`No open position for ${pair}`);
      return;
    }

    logger.info(`Closing position for ${pair}`);

    try {
      const side = position.side === 'long' ? 'sell' : 'buy';
      await this.orderManager.createMarketOrder(pair, side, position.size);

      this.positions.delete(pair);
      this.emit('positionClosed', { pair, position });
      logger.info('✅ Position closed successfully');
    } catch (error) {
      logger.error('❌ Failed to close position:', error);
      this.emit('error', error);
    }
  }

  async closeAllPositions() {
    logger.info('Closing all open positions...');

    for (const pair of this.positions.keys()) {
      await this.closePosition(pair);
    }
  }

  async updatePortfolio() {
    try {
      await this.portfolioManager.update();
      const portfolio = this.portfolioManager.getSnapshot();
      this.emit('portfolioUpdated', portfolio);
    } catch (error) {
      logger.error('Error updating portfolio:', error);
    }
  }

  getCronPattern(timeframe) {
    const patterns = {
      '1m': '* * * * *',
      '5m': '*/5 * * * *',
      '15m': '*/15 * * * *',
      '30m': '*/30 * * * *',
      '1h': '0 * * * *',
      '4h': '0 */4 * * *',
      '1d': '0 0 * * *',
    };

    return patterns[timeframe] || '0 * * * *';
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      positions: Array.from(this.positions.entries()),
      strategy: this.strategy.name,
      aiEnabled: this.aiAgent !== null,
    };
  }
}
