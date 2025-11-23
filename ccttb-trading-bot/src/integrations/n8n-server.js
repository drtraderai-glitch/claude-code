#!/usr/bin/env node

/**
 * Standalone n8n Integration Server
 * Can be run independently from the main bot
 */

import dotenv from 'dotenv';
import { N8nIntegration } from './n8n-integration.js';
import { TradingBot } from '../core/TradingBot.js';
import { AIAgent } from '../ai-agent/agent.js';
import { ConfigManager } from '../utils/config.js';
import { logger } from '../utils/logger.js';

dotenv.config();

async function main() {
  try {
    logger.info('Starting n8n Integration Server...');

    const config = new ConfigManager();
    await config.load();

    // Initialize AI Agent if enabled
    let aiAgent = null;
    if (config.get('AI_ENABLED') === 'true') {
      aiAgent = new AIAgent(config);
      await aiAgent.initialize();
    }

    // Initialize Trading Bot
    const bot = new TradingBot(config, aiAgent);
    await bot.initialize();

    // Start n8n server
    const n8nServer = new N8nIntegration(config, bot);
    await n8nServer.start();

    logger.info('✅ n8n Integration Server ready');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await n8nServer.stop();
      await bot.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start n8n server:', error);
    process.exit(1);
  }
}

main();
