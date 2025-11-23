/**
 * Hybrid Strategy
 * Combines multiple indicators for more robust signals
 */

import { BaseStrategy } from './BaseStrategy.js';

export class HybridStrategy extends BaseStrategy {
  constructor(config) {
    super(config);
    this.name = 'Hybrid';
  }

  async analyze(marketData) {
    const closes = marketData.ohlcv.map(candle => candle[4]);
    const volumes = marketData.ohlcv.map(candle => candle[5]);
    const currentPrice = closes[closes.length - 1];

    // Calculate multiple indicators
    const rsi = this.calculateRSI(closes, 14);
    const macd = this.calculateMACD(closes);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const bands = this.calculateBollingerBands(closes, 20, 2);

    // Get current values
    const currentRSI = rsi;
    const currentMACD = macd.macd[macd.macd.length - 1];
    const currentSignal = macd.signal[macd.signal.length - 1];
    const currentEMA12 = ema12[ema12.length - 1];
    const currentEMA26 = ema26[ema26.length - 1];
    const upperBand = bands.upper[bands.upper.length - 1];
    const lowerBand = bands.lower[bands.lower.length - 1];

    // Calculate volume trend
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    const volumeRatio = currentVolume / avgVolume;

    // Scoring system
    let bullishScore = 0;
    let bearishScore = 0;

    // RSI scoring
    if (currentRSI < 30) bullishScore += 2;
    else if (currentRSI < 40) bullishScore += 1;
    else if (currentRSI > 70) bearishScore += 2;
    else if (currentRSI > 60) bearishScore += 1;

    // MACD scoring
    if (currentMACD > currentSignal) bullishScore += 1;
    else bearishScore += 1;

    // EMA scoring
    if (currentEMA12 > currentEMA26) bullishScore += 1;
    else bearishScore += 1;

    // Bollinger Bands scoring
    if (currentPrice < lowerBand) bullishScore += 2;
    else if (currentPrice > upperBand) bearishScore += 2;

    // Volume confirmation
    if (volumeRatio > 1.5) {
      if (bullishScore > bearishScore) bullishScore += 1;
      else if (bearishScore > bullishScore) bearishScore += 1;
    }

    // Generate signal
    let signal = 'HOLD';
    let confidence = 0.5;

    const scoreDiff = Math.abs(bullishScore - bearishScore);

    if (bullishScore > bearishScore) {
      signal = 'BUY';
      confidence = Math.min(0.6 + (scoreDiff * 0.1), 0.95);
    } else if (bearishScore > bullishScore) {
      signal = 'SELL';
      confidence = Math.min(0.6 + (scoreDiff * 0.1), 0.95);
    }

    return this.createSignal(signal, confidence, {
      rsi: currentRSI,
      macd: currentMACD,
      macdSignal: currentSignal,
      ema12: currentEMA12,
      ema26: currentEMA26,
      upperBand,
      lowerBand,
      bullishScore,
      bearishScore,
      volumeRatio,
    });
  }
}
