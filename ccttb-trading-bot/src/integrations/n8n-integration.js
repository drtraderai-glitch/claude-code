/**
 * n8n Integration Module
 * Provides REST API and webhook integration for n8n workflows
 */

import express from 'express';
import { logger } from '../utils/logger.js';

export class N8nIntegration {
  constructor(config, tradingBot) {
    this.config = config;
    this.tradingBot = tradingBot;
    this.app = express();
    this.server = null;
    this.port = parseInt(config.get('N8N_SERVER_PORT')) || 3000;
  }

  async start() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebhooks();

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        logger.info(`🌐 n8n Integration server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('n8n Integration server stopped');
          resolve();
        });
      });
    }
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // API key authentication middleware
    this.app.use((req, res, next) => {
      const apiKey = req.headers['x-api-key'];
      const configApiKey = this.config.get('N8N_API_KEY');

      if (req.path === '/health') {
        return next();
      }

      if (!configApiKey || apiKey === configApiKey) {
        next();
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    });

    // Logging middleware
    this.app.use((req, res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Get bot status
    this.app.get('/api/status', (req, res) => {
      try {
        const status = this.tradingBot.getStatus();
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get portfolio
    this.app.get('/api/portfolio', async (req, res) => {
      try {
        await this.tradingBot.portfolioManager.update();
        const portfolio = this.tradingBot.portfolioManager.getSnapshot();
        res.json(portfolio);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get open positions
    this.app.get('/api/positions', (req, res) => {
      try {
        const positions = Array.from(this.tradingBot.positions.entries()).map(([pair, position]) => ({
          pair,
          ...position,
        }));
        res.json({ positions });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Manual trade execution
    this.app.post('/api/trade', async (req, res) => {
      try {
        const { type, pair, amount } = req.body;

        if (!type || !pair) {
          return res.status(400).json({ error: 'Missing required fields: type, pair' });
        }

        logger.info(`Manual trade requested: ${type} ${pair}`);

        const signal = {
          type: type.toUpperCase(),
          confidence: 1.0,
          indicators: { manual: true },
          timestamp: Date.now(),
          strategy: 'manual',
        };

        const marketData = {
          pair,
          ticker: await this.tradingBot.exchange.fetchTicker(pair),
          ohlcv: await this.tradingBot.exchange.fetchOHLCV(pair, '1h', undefined, 100),
          timestamp: Date.now(),
        };

        if (type.toUpperCase() === 'BUY') {
          await this.tradingBot.executeBuy(signal, marketData);
        } else if (type.toUpperCase() === 'SELL') {
          await this.tradingBot.executeSell(signal, marketData);
        } else if (type.toUpperCase() === 'CLOSE') {
          await this.tradingBot.closePosition(pair);
        }

        res.json({ success: true, message: 'Trade executed' });
      } catch (error) {
        logger.error('Manual trade failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Start/Stop bot
    this.app.post('/api/bot/:action', async (req, res) => {
      try {
        const { action } = req.params;

        if (action === 'start') {
          await this.tradingBot.start();
          res.json({ success: true, message: 'Bot started' });
        } else if (action === 'stop') {
          await this.tradingBot.stop();
          res.json({ success: true, message: 'Bot stopped' });
        } else {
          res.status(400).json({ error: 'Invalid action' });
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get risk stats
    this.app.get('/api/risk', (req, res) => {
      try {
        const stats = this.tradingBot.riskManager.getDailyStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // AI agent analysis
    this.app.post('/api/ai/analyze', async (req, res) => {
      try {
        if (!this.tradingBot.aiAgent) {
          return res.status(400).json({ error: 'AI Agent not enabled' });
        }

        const { pair, timeframe } = req.body;
        const insight = await this.tradingBot.aiAgent.getMarketInsight(pair, timeframe);

        res.json({ insight });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Change strategy
    this.app.post('/api/strategy', async (req, res) => {
      try {
        const { strategy } = req.body;

        if (!strategy) {
          return res.status(400).json({ error: 'Strategy name required' });
        }

        const StrategyFactory = (await import('../strategies/StrategyFactory.js')).StrategyFactory;
        this.tradingBot.strategy = StrategyFactory.create(strategy, this.config);

        logger.info(`Strategy changed to: ${strategy}`);
        res.json({ success: true, strategy });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupWebhooks() {
    // Webhook for receiving signals from n8n
    this.app.post('/webhook/signal', async (req, res) => {
      try {
        logger.info('Received signal webhook from n8n');

        const { type, pair, confidence, indicators } = req.body;

        const signal = {
          type: type.toUpperCase(),
          confidence: confidence || 0.8,
          indicators: indicators || {},
          timestamp: Date.now(),
          strategy: 'n8n_webhook',
        };

        const marketData = {
          pair: pair || this.config.get('DEFAULT_TRADING_PAIR'),
          ticker: await this.tradingBot.exchange.fetchTicker(pair),
          ohlcv: await this.tradingBot.exchange.fetchOHLCV(pair, '1h', undefined, 100),
          timestamp: Date.now(),
        };

        // Execute based on signal type
        if (signal.type === 'BUY') {
          await this.tradingBot.executeBuy(signal, marketData);
        } else if (signal.type === 'SELL') {
          await this.tradingBot.executeSell(signal, marketData);
        }

        res.json({ success: true, message: 'Signal processed' });
      } catch (error) {
        logger.error('Webhook signal processing failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Webhook for portfolio updates
    this.app.get('/webhook/portfolio', async (req, res) => {
      try {
        await this.tradingBot.portfolioManager.update();
        const portfolio = this.tradingBot.portfolioManager.getSnapshot();
        res.json(portfolio);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }
}
