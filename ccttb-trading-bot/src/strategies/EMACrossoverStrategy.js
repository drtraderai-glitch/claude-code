/**
 * EMA Crossover Strategy
 * Uses exponential moving average crossovers for trend following
 */

import { BaseStrategy } from './BaseStrategy.js';

export class EMACrossoverStrategy extends BaseStrategy {
  constructor(config) {
    super(config);
    this.name = 'EMA_Crossover';
    this.fastPeriod = 12;
    this.slowPeriod = 26;
  }

  async analyze(marketData) {
    const closes = marketData.ohlcv.map(candle => candle[4]);

    // Calculate EMAs
    const fastEMA = this.calculateEMA(closes, this.fastPeriod);
    const slowEMA = this.calculateEMA(closes, this.slowPeriod);

    const currentFast = fastEMA[fastEMA.length - 1];
    const previousFast = fastEMA[fastEMA.length - 2];
    const currentSlow = slowEMA[slowEMA.length - 1];
    const previousSlow = slowEMA[slowEMA.length - 2];

    // Calculate distance between EMAs
    const distance = Math.abs(currentFast - currentSlow) / currentSlow;

    let signal = 'HOLD';
    let confidence = 0.5;

    // Bullish crossover - fast EMA crosses above slow EMA
    if (previousFast < previousSlow && currentFast > currentSlow) {
      signal = 'BUY';
      confidence = 0.9;
    }
    // Strong uptrend - fast well above slow
    else if (currentFast > currentSlow && distance > 0.02) {
      signal = 'BUY';
      confidence = 0.7;
    }

    // Bearish crossover - fast EMA crosses below slow EMA
    else if (previousFast > previousSlow && currentFast < currentSlow) {
      signal = 'SELL';
      confidence = 0.9;
    }
    // Strong downtrend - fast well below slow
    else if (currentFast < currentSlow && distance > 0.02) {
      signal = 'SELL';
      confidence = 0.7;
    }

    return this.createSignal(signal, confidence, {
      fastEMA: currentFast,
      slowEMA: currentSlow,
      distance,
      trend: currentFast > currentSlow ? 'bullish' : 'bearish',
    });
  }
}
