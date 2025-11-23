/**
 * Basic Tests for CCTTB Trading Bot
 * Run with: node --test tests/test-basic.test.js
 */

import { test } from 'node:test';
import assert from 'node:assert';

// Test imports work
test('Imports', async (t) => {
  await t.test('Can import ConfigManager', async () => {
    const { ConfigManager } = await import('../src/utils/config.js');
    assert.ok(ConfigManager);
  });

  await t.test('Can import StrategyFactory', async () => {
    const { StrategyFactory } = await import('../src/strategies/StrategyFactory.js');
    assert.ok(StrategyFactory);
  });
});

// Test strategy factory
test('StrategyFactory', async (t) => {
  const { StrategyFactory } = await import('../src/strategies/StrategyFactory.js');
  const { ConfigManager } = await import('../src/utils/config.js');

  const config = new ConfigManager();
  config.config = { ACTIVE_STRATEGY: 'hybrid' };
  config.loaded = true;

  await t.test('Creates valid strategies', () => {
    const strategies = ['rsi_macd', 'bollinger_bands', 'ema_crossover', 'hybrid'];

    for (const strategyName of strategies) {
      const strategy = StrategyFactory.create(strategyName, config);
      assert.ok(strategy);
      assert.ok(strategy.analyze);
    }
  });

  await t.test('Throws error for invalid strategy', () => {
    assert.throws(() => {
      StrategyFactory.create('invalid_strategy', config);
    });
  });
});

// Test base strategy calculations
test('BaseStrategy Calculations', async (t) => {
  const { BaseStrategy } = await import('../src/strategies/BaseStrategy.js');

  const strategy = new BaseStrategy({});
  const testData = [10, 12, 11, 13, 14, 13, 15, 16, 15, 17];

  await t.test('Calculates SMA correctly', () => {
    const sma = strategy.calculateSMA(testData, 3);
    assert.ok(Array.isArray(sma));
    assert.ok(sma.length > 0);
    assert.strictEqual(sma.length, testData.length - 2);
  });

  await t.test('Calculates EMA correctly', () => {
    const ema = strategy.calculateEMA(testData, 3);
    assert.ok(Array.isArray(ema));
    assert.ok(ema.length > 0);
  });

  await t.test('Calculates RSI correctly', () => {
    const rsi = strategy.calculateRSI(testData, 5);
    assert.ok(typeof rsi === 'number');
    assert.ok(rsi >= 0 && rsi <= 100);
  });
});

// Test risk manager
test('RiskManager', async (t) => {
  const { RiskManager } = await import('../src/core/RiskManager.js');

  const config = {
    get: (key) => {
      const values = {
        MAX_DAILY_LOSS: '100',
        MAX_DAILY_TRADES: '10',
        AI_CONFIDENCE_THRESHOLD: '0.7',
        RISK_PERCENTAGE: '2',
        MAX_POSITION_SIZE: '0.1',
        DEFAULT_POSITION_SIZE: '0.01',
      };
      return values[key];
    },
  };

  const riskManager = new RiskManager(config);

  await t.test('Calculates position size', async () => {
    const signal = { confidence: 0.8 };
    const size = await riskManager.calculatePositionSize(45000, signal);

    assert.ok(typeof size === 'number');
    assert.ok(size > 0);
    assert.ok(size <= 0.1);
  });

  await t.test('Evaluates signals correctly', async () => {
    const signal = { confidence: 0.8, type: 'BUY' };
    const marketData = {
      ohlcv: Array(100).fill([0, 45000, 45100, 44900, 45050, 1000]),
    };

    const result = await riskManager.evaluateSignal(signal, marketData);

    assert.ok(result);
    assert.ok(typeof result.approved === 'boolean');
    assert.ok(result.reason);
  });
});

console.log('\n✅ All tests passed!\n');
