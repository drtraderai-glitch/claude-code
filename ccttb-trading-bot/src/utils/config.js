/**
 * Configuration Manager
 * Handles configuration loading and validation
 */

import dotenv from 'dotenv';
import { logger } from './logger.js';

export class ConfigManager {
  constructor() {
    this.config = {};
    this.loaded = false;
  }

  async load() {
    // Load environment variables
    dotenv.config();

    this.config = { ...process.env };
    this.loaded = true;

    // Validate required configuration
    this.validate();

    logger.info('Configuration loaded successfully');
  }

  validate() {
    const required = [
      'EXCHANGE_NAME',
      'EXCHANGE_API_KEY',
      'EXCHANGE_API_SECRET',
    ];

    const missing = required.filter(key => !this.config[key]);

    if (missing.length > 0) {
      logger.warn(`Missing configuration: ${missing.join(', ')}`);
    }

    // Validate AI configuration if enabled
    if (this.config.AI_ENABLED === 'true' && !this.config.ANTHROPIC_API_KEY) {
      logger.warn('AI_ENABLED is true but ANTHROPIC_API_KEY is missing');
    }
  }

  get(key, defaultValue = null) {
    if (!this.loaded) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    return this.config[key] ?? defaultValue;
  }

  set(key, value) {
    this.config[key] = value;
  }

  getAll() {
    return { ...this.config };
  }

  has(key) {
    return key in this.config;
  }
}
