/**
 * Strategy Factory
 * Creates and manages trading strategies
 */

import { RSIMACDStrategy } from './RSIMACDStrategy.js';
import { BollingerBandsStrategy } from './BollingerBandsStrategy.js';
import { EMACrossoverStrategy } from './EMACrossoverStrategy.js';
import { HybridStrategy } from './HybridStrategy.js';

export class StrategyFactory {
  static create(strategyName, config) {
    const strategies = {
      'rsi_macd': RSIMACDStrategy,
      'bollinger_bands': BollingerBandsStrategy,
      'ema_crossover': EMACrossoverStrategy,
      'hybrid': HybridStrategy,
    };

    const StrategyClass = strategies[strategyName];

    if (!StrategyClass) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }

    return new StrategyClass(config);
  }

  static getAvailableStrategies() {
    return [
      'rsi_macd',
      'bollinger_bands',
      'ema_crossover',
      'hybrid',
    ];
  }
}
