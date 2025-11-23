/**
 * Order Manager
 * Handles order creation, modification, and cancellation
 */

import { logger } from '../utils/logger.js';

export class OrderManager {
  constructor(exchange, config) {
    this.exchange = exchange;
    this.config = config;
    this.orders = new Map();
  }

  async createMarketOrder(symbol, side, amount) {
    try {
      logger.info(`Creating ${side} market order: ${amount} ${symbol}`);

      const order = await this.exchange.createOrder(
        symbol,
        'market',
        side,
        amount
      );

      this.orders.set(order.id, order);
      logger.info(`✅ Market order created: ${order.id}`);

      return order;
    } catch (error) {
      logger.error('Failed to create market order:', error);
      throw error;
    }
  }

  async createLimitOrder(symbol, side, amount, price) {
    try {
      logger.info(`Creating ${side} limit order: ${amount} ${symbol} @ ${price}`);

      const order = await this.exchange.createOrder(
        symbol,
        'limit',
        side,
        amount,
        price
      );

      this.orders.set(order.id, order);
      logger.info(`✅ Limit order created: ${order.id}`);

      return order;
    } catch (error) {
      logger.error('Failed to create limit order:', error);
      throw error;
    }
  }

  async createStopLossOrder(symbol, side, amount, stopPrice) {
    try {
      logger.info(`Creating stop loss order: ${amount} ${symbol} @ ${stopPrice}`);

      const order = await this.exchange.createOrder(
        symbol,
        'stop_market',
        side,
        amount,
        null,
        {
          stopPrice: stopPrice,
        }
      );

      this.orders.set(order.id, order);
      logger.info(`✅ Stop loss order created: ${order.id}`);

      return order;
    } catch (error) {
      logger.error('Failed to create stop loss order:', error);
      throw error;
    }
  }

  async createTakeProfitOrder(symbol, side, amount, takeProfitPrice) {
    try {
      logger.info(`Creating take profit order: ${amount} ${symbol} @ ${takeProfitPrice}`);

      const order = await this.exchange.createOrder(
        symbol,
        'take_profit_market',
        side,
        amount,
        null,
        {
          stopPrice: takeProfitPrice,
        }
      );

      this.orders.set(order.id, order);
      logger.info(`✅ Take profit order created: ${order.id}`);

      return order;
    } catch (error) {
      logger.error('Failed to create take profit order:', error);
      throw error;
    }
  }

  async cancelOrder(orderId, symbol) {
    try {
      logger.info(`Cancelling order: ${orderId}`);

      await this.exchange.cancelOrder(orderId, symbol);
      this.orders.delete(orderId);

      logger.info(`✅ Order cancelled: ${orderId}`);
    } catch (error) {
      logger.error('Failed to cancel order:', error);
      throw error;
    }
  }

  async getOrder(orderId, symbol) {
    try {
      const order = await this.exchange.fetchOrder(orderId, symbol);
      return order;
    } catch (error) {
      logger.error('Failed to fetch order:', error);
      throw error;
    }
  }

  async getOpenOrders(symbol) {
    try {
      const orders = await this.exchange.fetchOpenOrders(symbol);
      return orders;
    } catch (error) {
      logger.error('Failed to fetch open orders:', error);
      throw error;
    }
  }

  async cancelAllOrders(symbol) {
    try {
      const openOrders = await this.getOpenOrders(symbol);

      for (const order of openOrders) {
        await this.cancelOrder(order.id, symbol);
      }

      logger.info(`✅ Cancelled ${openOrders.length} orders for ${symbol}`);
    } catch (error) {
      logger.error('Failed to cancel all orders:', error);
      throw error;
    }
  }
}
