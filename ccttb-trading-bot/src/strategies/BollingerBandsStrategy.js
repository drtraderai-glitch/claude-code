/**
 * Bollinger Bands Strategy
 * Uses Bollinger Bands for mean reversion trading
 */

import { BaseStrategy } from './BaseStrategy.js';

export class BollingerBandsStrategy extends BaseStrategy {
  constructor(config) {
    super(config);
    this.name = 'Bollinger_Bands';
    this.period = 20;
    this.stdDev = 2;
  }

  async analyze(marketData) {
    const closes = marketData.ohlcv.map(candle => candle[4]);
    const currentPrice = closes[closes.length - 1];

    // Calculate Bollinger Bands
    const bands = this.calculateBollingerBands(closes, this.period, this.stdDev);
    const upperBand = bands.upper[bands.upper.length - 1];
    const lowerBand = bands.lower[bands.lower.length - 1];
    const middleBand = bands.middle[bands.middle.length - 1];

    // Calculate band width
    const bandWidth = (upperBand - lowerBand) / middleBand;

    // Calculate position relative to bands
    const pricePosition = (currentPrice - lowerBand) / (upperBand - lowerBand);

    let signal = 'HOLD';
    let confidence = 0.5;

    // BUY signal - price near or below lower band
    if (currentPrice <= lowerBand) {
      signal = 'BUY';
      confidence = 0.9;
    } else if (pricePosition < 0.2) {
      signal = 'BUY';
      confidence = 0.75;
    }

    // SELL signal - price near or above upper band
    else if (currentPrice >= upperBand) {
      signal = 'SELL';
      confidence = 0.9;
    } else if (pricePosition > 0.8) {
      signal = 'SELL';
      confidence = 0.75;
    }

    // HOLD in the middle
    else if (pricePosition > 0.45 && pricePosition < 0.55) {
      signal = 'HOLD';
      confidence = 0.6;
    }

    return this.createSignal(signal, confidence, {
      currentPrice,
      upperBand,
      lowerBand,
      middleBand,
      bandWidth,
      pricePosition,
    });
  }
}
