#!/usr/bin/env node

/**
 * CCTTB Trading Bot - Main Entry Point
 * Comprehensive Crypto Trading Bot with AI Agent and n8n Integration
 */

import dotenv from 'dotenv';
import { TradingBot } from './core/TradingBot.js';
import { AIAgent } from './ai-agent/agent.js';
import { N8nIntegration } from './integrations/n8n-integration.js';
import { logger } from './utils/logger.js';
import { ConfigManager } from './utils/config.js';

dotenv.config();

class Application {
  constructor() {
    this.config = new ConfigManager();
    this.bot = null;
    this.aiAgent = null;
    this.n8nIntegration = null;
  }

  async initialize() {
    try {
      logger.info('🚀 Starting CCTTB Trading Bot...');

      // Initialize configuration
      await this.config.load();
      logger.info('✅ Configuration loaded');

      // Initialize AI Agent if enabled
      if (this.config.get('AI_ENABLED') === 'true') {
        this.aiAgent = new AIAgent(this.config);
        await this.aiAgent.initialize();
        logger.info('✅ AI Agent initialized');
      }

      // Initialize Trading Bot
      this.bot = new TradingBot(this.config, this.aiAgent);
      await this.bot.initialize();
      logger.info('✅ Trading Bot initialized');

      // Initialize n8n Integration if enabled
      if (this.config.get('N8N_ENABLED') === 'true') {
        this.n8nIntegration = new N8nIntegration(this.config, this.bot);
        await this.n8nIntegration.start();
        logger.info('✅ n8n Integration started');
      }

      // Start the bot
      await this.bot.start();
      logger.info('🎯 Trading Bot is now running!');

      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to initialize application:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`\n📡 Received ${signal}, shutting down gracefully...`);

      try {
        if (this.bot) {
          await this.bot.stop();
        }
        if (this.n8nIntegration) {
          await this.n8nIntegration.stop();
        }
        logger.info('✅ Shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }
}

// Start the application
const app = new Application();
app.initialize().catch((error) => {
  logger.error('❌ Fatal error:', error);
  process.exit(1);
});
