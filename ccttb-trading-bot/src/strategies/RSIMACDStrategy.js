/**
 * RSI + MACD Strategy
 * Combines RSI and MACD indicators for trading signals
 */

import { BaseStrategy } from './BaseStrategy.js';

export class RSIMACDStrategy extends BaseStrategy {
  constructor(config) {
    super(config);
    this.name = 'RSI_MACD';
    this.rsiPeriod = 14;
    this.rsiOversold = 30;
    this.rsiOverbought = 70;
  }

  async analyze(marketData) {
    const closes = marketData.ohlcv.map(candle => candle[4]);

    // Calculate RSI
    const rsi = this.calculateRSI(closes, this.rsiPeriod);

    // Calculate MACD
    const macd = this.calculateMACD(closes);
    const currentMACD = macd.macd[macd.macd.length - 1];
    const currentSignal = macd.signal[macd.signal.length - 1];
    const currentHistogram = macd.histogram[macd.histogram.length - 1];
    const previousHistogram = macd.histogram[macd.histogram.length - 2];

    // Trading logic
    let signal = 'HOLD';
    let confidence = 0.5;

    // BUY signals
    if (rsi < this.rsiOversold && currentHistogram > 0 && previousHistogram < 0) {
      signal = 'BUY';
      confidence = 0.9;
    } else if (rsi < this.rsiOversold && currentMACD > currentSignal) {
      signal = 'BUY';
      confidence = 0.75;
    } else if (currentHistogram > 0 && previousHistogram < 0 && rsi < 50) {
      signal = 'BUY';
      confidence = 0.7;
    }

    // SELL signals
    else if (rsi > this.rsiOverbought && currentHistogram < 0 && previousHistogram > 0) {
      signal = 'SELL';
      confidence = 0.9;
    } else if (rsi > this.rsiOverbought && currentMACD < currentSignal) {
      signal = 'SELL';
      confidence = 0.75;
    } else if (currentHistogram < 0 && previousHistogram > 0 && rsi > 50) {
      signal = 'SELL';
      confidence = 0.7;
    }

    return this.createSignal(signal, confidence, {
      rsi,
      macd: currentMACD,
      macdSignal: currentSignal,
      histogram: currentHistogram,
    });
  }
}
