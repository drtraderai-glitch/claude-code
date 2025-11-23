/**
 * Real-time Trading Dashboard Server
 * Provides web-based visualization of all bot activities with charts
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DashboardServer {
  constructor(config, tradingBot) {
    this.config = config;
    this.tradingBot = tradingBot;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Set();
    this.port = parseInt(config.get('DASHBOARD_PORT')) || 8080;

    // Real-time data storage
    this.realtimeData = {
      trades: [],
      signals: [],
      indicators: {},
      performance: {},
      aiDecisions: [],
      positions: [],
      chartData: [],
    };
  }

  async start() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.subscribeToBot();

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        logger.info(`📊 Dashboard server running at http://localhost:${this.port}`);
        resolve();
      });

      // WebSocket server
      this.wss = new WebSocketServer({ server: this.server });
      this.wss.on('connection', (ws) => this.handleConnection(ws));
    });
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../../public')));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    });
  }

  setupRoutes() {
    // Main dashboard page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../../public/dashboard.html'));
    });

    // API endpoints for dashboard data
    this.app.get('/api/dashboard/data', (req, res) => {
      res.json(this.realtimeData);
    });

    this.app.get('/api/dashboard/performance', (req, res) => {
      const performance = this.tradingBot.portfolioManager.getPerformance();
      res.json(performance);
    });

    this.app.get('/api/dashboard/positions', (req, res) => {
      const positions = Array.from(this.tradingBot.positions.entries()).map(([pair, pos]) => ({
        pair,
        ...pos,
      }));
      res.json(positions);
    });

    this.app.get('/api/dashboard/chart/:pair/:timeframe', async (req, res) => {
      try {
        const { pair, timeframe } = req.params;
        const ohlcv = await this.tradingBot.exchange.fetchOHLCV(pair, timeframe, undefined, 500);

        res.json({
          pair,
          timeframe,
          data: ohlcv,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/dashboard/indicators/:pair', async (req, res) => {
      try {
        const { pair } = req.params;
        const indicators = this.realtimeData.indicators[pair] || {};
        res.json(indicators);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/dashboard/ai-decisions', (req, res) => {
      res.json({
        decisions: this.realtimeData.aiDecisions.slice(-50), // Last 50 decisions
      });
    });

    // Control endpoints
    this.app.post('/api/dashboard/control/pause', (req, res) => {
      this.tradingBot.stop();
      res.json({ success: true, message: 'Bot paused' });
    });

    this.app.post('/api/dashboard/control/resume', (req, res) => {
      this.tradingBot.start();
      res.json({ success: true, message: 'Bot resumed' });
    });
  }

  setupWebSocket() {
    // WebSocket will broadcast real-time updates to all connected clients
  }

  handleConnection(ws) {
    logger.info('📱 Dashboard client connected');
    this.clients.add(ws);

    // Send initial data
    ws.send(JSON.stringify({
      type: 'initial_data',
      data: this.realtimeData,
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this.handleClientMessage(ws, data);
      } catch (error) {
        logger.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      logger.info('Dashboard client disconnected');
      this.clients.delete(ws);
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.clients.delete(ws);
    });
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel,
        }));
        break;

      case 'request_chart':
        this.sendChartData(ws, data.pair, data.timeframe);
        break;

      case 'request_indicators':
        this.sendIndicators(ws, data.pair);
        break;

      default:
        logger.warn('Unknown message type:', data.type);
    }
  }

  subscribeToBot() {
    // Subscribe to bot events and broadcast to dashboard clients

    this.tradingBot.on('signalGenerated', (signal) => {
      this.realtimeData.signals.unshift(signal);
      this.realtimeData.signals = this.realtimeData.signals.slice(0, 100);

      this.broadcast({
        type: 'signal',
        data: signal,
      });
    });

    this.tradingBot.on('orderExecuted', (order) => {
      this.realtimeData.trades.unshift(order);
      this.realtimeData.trades = this.realtimeData.trades.slice(0, 100);

      this.broadcast({
        type: 'trade',
        data: order,
      });

      logger.info('📊 Broadcasting trade to dashboard');
    });

    this.tradingBot.on('positionUpdated', (position) => {
      this.realtimeData.positions = Array.from(this.tradingBot.positions.entries());

      this.broadcast({
        type: 'position',
        data: position,
      });
    });

    this.tradingBot.on('portfolioUpdated', (portfolio) => {
      this.realtimeData.performance = portfolio.performance;

      this.broadcast({
        type: 'portfolio',
        data: portfolio,
      });
    });

    this.tradingBot.on('indicatorsCalculated', (indicators) => {
      this.realtimeData.indicators[indicators.pair] = indicators;

      this.broadcast({
        type: 'indicators',
        data: indicators,
      });
    });

    // Subscribe to AI agent decisions if multi-agent orchestrator is available
    if (this.tradingBot.multiAgentOrchestrator) {
      this.tradingBot.multiAgentOrchestrator.on('decisionMade', (decision) => {
        this.realtimeData.aiDecisions.unshift(decision);
        this.realtimeData.aiDecisions = this.realtimeData.aiDecisions.slice(0, 100);

        this.broadcast({
          type: 'ai_decision',
          data: decision,
        });

        logger.info('🤖 Broadcasting AI decision to dashboard');
      });
    }

    // Periodic updates
    setInterval(() => {
      this.broadcast({
        type: 'heartbeat',
        timestamp: Date.now(),
        status: {
          isRunning: this.tradingBot.isRunning,
          positions: this.tradingBot.positions.size,
          strategy: this.tradingBot.strategy.name,
        },
      });
    }, 5000);
  }

  async sendChartData(ws, pair, timeframe) {
    try {
      const ohlcv = await this.tradingBot.exchange.fetchOHLCV(pair, timeframe, undefined, 500);

      ws.send(JSON.stringify({
        type: 'chart_data',
        data: {
          pair,
          timeframe,
          ohlcv,
        },
      }));
    } catch (error) {
      logger.error('Error sending chart data:', error);
    }
  }

  sendIndicators(ws, pair) {
    const indicators = this.realtimeData.indicators[pair] || {};

    ws.send(JSON.stringify({
      type: 'indicators',
      data: {
        pair,
        indicators,
      },
    }));
  }

  broadcast(message) {
    const data = JSON.stringify(message);

    this.clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(data);
        } catch (error) {
          logger.error('Error broadcasting to client:', error);
        }
      }
    });
  }

  async stop() {
    logger.info('Stopping dashboard server...');

    // Close all WebSocket connections
    this.clients.forEach((client) => {
      client.close();
    });

    if (this.wss) {
      this.wss.close();
    }

    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          logger.info('Dashboard server stopped');
          resolve();
        });
      });
    }
  }
}
