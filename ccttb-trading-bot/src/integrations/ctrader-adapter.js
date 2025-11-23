/**
 * cTrader Adapter
 * Adapts cTrader FIX client to work with the trading bot architecture
 */

import { CTraderFIXClient } from './ctrader-fix-client.js';
import { logger } from '../utils/logger.js';

export class CTraderAdapter {
  constructor(config) {
    this.config = config;
    this.client = new CTraderFIXClient(config);
    this.markets = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    await this.client.connect();
    await this.loadMarkets();
    this.setupEventHandlers();
    this.isInitialized = true;
    logger.info('cTrader adapter initialized');
  }

  setupEventHandlers() {
    this.client.on('executionReport', (report) => {
      logger.info('Order execution:', report);
    });

    this.client.on('marketData', (data) => {
      logger.debug('Market data:', data);
    });

    this.client.on('error', (error) => {
      logger.error('cTrader error:', error);
    });
  }

  async loadMarkets() {
    // Define common forex pairs for cTrader
    const forexPairs = [
      { id: '1', symbol: 'EURUSD', base: 'EUR', quote: 'USD', precision: 5 },
      { id: '2', symbol: 'GBPUSD', base: 'GBP', quote: 'USD', precision: 5 },
      { id: '3', symbol: 'USDJPY', base: 'USD', quote: 'JPY', precision: 3 },
      { id: '4', symbol: 'USDCHF', base: 'USD', quote: 'CHF', precision: 5 },
      { id: '5', symbol: 'AUDUSD', base: 'AUD', quote: 'USD', precision: 5 },
      { id: '6', symbol: 'USDCAD', base: 'USD', quote: 'CAD', precision: 5 },
      { id: '7', symbol: 'NZDUSD', base: 'NZD', quote: 'USD', precision: 5 },
      { id: '8', symbol: 'EURGBP', base: 'EUR', quote: 'GBP', precision: 5 },
      { id: '9', symbol: 'EURJPY', base: 'EUR', quote: 'JPY', precision: 3 },
      { id: '10', symbol: 'GBPJPY', base: 'GBP', quote: 'JPY', precision: 3 },
      { id: '11', symbol: 'XAUUSD', base: 'XAU', quote: 'USD', precision: 2 },
      { id: '12', symbol: 'XAGUSD', base: 'XAG', quote: 'USD', precision: 3 },
      { id: '13', symbol: 'US30', base: 'US30', quote: 'USD', precision: 2 },
      { id: '14', symbol: 'US100', base: 'US100', quote: 'USD', precision: 2 },
      { id: '15', symbol: 'US500', base: 'US500', quote: 'USD', precision: 2 },
    ];

    for (const pair of forexPairs) {
      this.markets.set(pair.symbol, pair);
    }

    logger.info(`Loaded ${this.markets.size} forex pairs`);
  }

  // CCXT-compatible methods for the trading bot

  async fetchTicker(symbol) {
    const ticker = await this.client.fetchTicker(symbol);

    if (!ticker) {
      throw new Error(`Failed to fetch ticker for ${symbol}`);
    }

    return {
      symbol: ticker.symbol,
      bid: ticker.bid,
      ask: ticker.ask,
      last: ticker.last,
      high: ticker.last * 1.01,
      low: ticker.last * 0.99,
      volume: 0,
      quoteVolume: 0,
      timestamp: Date.now(),
      datetime: new Date().toISOString(),
      percentage: 0,
    };
  }

  async fetchOHLCV(symbol, timeframe = '1h', since, limit = 100) {
    // Note: cTrader FIX doesn't provide historical data by default
    // You would need to use cTrader REST API or store data locally
    logger.warn('fetchOHLCV not fully implemented for cTrader FIX');

    // Return mock data for now - replace with actual implementation
    const now = Date.now();
    const interval = this.timeframeToMs(timeframe);
    const ohlcv = [];

    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - (i * interval);
      const price = 1.1000 + (Math.random() * 0.01);

      ohlcv.push([
        timestamp,
        price,
        price + 0.0010,
        price - 0.0010,
        price + (Math.random() * 0.0005),
        Math.random() * 1000,
      ]);
    }

    return ohlcv;
  }

  timeframeToMs(timeframe) {
    const units = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000,
    };

    const value = parseInt(timeframe.slice(0, -1));
    const unit = timeframe.slice(-1);

    return value * (units[unit] || 60000);
  }

  async createOrder(symbol, type, side, amount, price = null, params = {}) {
    logger.info(`Creating ${type} ${side} order for ${symbol}: ${amount}`);

    let order;

    if (type === 'market') {
      order = await this.client.createMarketOrder(symbol, side, amount);
    } else if (type === 'limit') {
      if (!price) {
        throw new Error('Price required for limit orders');
      }
      order = await this.client.createLimitOrder(symbol, side, amount, price);
    } else if (type === 'stop' || type === 'stop_market') {
      if (!params.stopPrice) {
        throw new Error('Stop price required for stop orders');
      }
      order = await this.client.createStopOrder(symbol, side, amount, params.stopPrice);
    } else {
      throw new Error(`Unsupported order type: ${type}`);
    }

    return {
      id: order.clOrdID,
      clientOrderId: order.clOrdID,
      symbol: symbol,
      type: type,
      side: side,
      price: price,
      amount: amount,
      status: 'open',
      timestamp: Date.now(),
    };
  }

  async cancelOrder(orderId, symbol) {
    await this.client.cancelOrder(orderId);

    return {
      id: orderId,
      status: 'canceled',
    };
  }

  async fetchBalance() {
    return await this.client.fetchBalance();
  }

  async fetchOpenOrders(symbol) {
    // Return orders from client's order map
    const orders = [];

    for (const [id, order] of this.client.orders.entries()) {
      if (symbol && order.symbol !== symbol) continue;
      if (order.ordStatus !== '2') { // Not filled
        orders.push({
          id: id,
          symbol: order.symbol,
          type: 'limit',
          side: order.side === '1' ? 'buy' : 'sell',
          price: order.price,
          amount: order.quantity,
          remaining: order.quantity - order.cumQty,
          status: this.fixStatusToString(order.ordStatus),
        });
      }
    }

    return orders;
  }

  fixStatusToString(fixStatus) {
    const statuses = {
      '0': 'open', // New
      '1': 'open', // Partially filled
      '2': 'closed', // Filled
      '4': 'canceled', // Canceled
      '8': 'rejected', // Rejected
    };

    return statuses[fixStatus] || 'unknown';
  }

  setSandboxMode(enabled) {
    logger.info(`Sandbox mode ${enabled ? 'enabled' : 'disabled'}`);
    // cTrader uses different hosts for demo/live
  }

  async loadMarkets() {
    return this.markets;
  }

  async disconnect() {
    await this.client.disconnect();
  }
}
