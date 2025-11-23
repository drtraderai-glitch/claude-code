/**
 * Base Strategy Class
 * Abstract base class for all trading strategies
 */

export class BaseStrategy {
  constructor(config) {
    this.config = config;
    this.name = 'BaseStrategy';
  }

  async analyze(marketData) {
    throw new Error('analyze() must be implemented by subclass');
  }

  calculateSMA(data, period) {
    const result = [];
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
    return result;
  }

  calculateEMA(data, period) {
    const result = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA
    let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
    result.push(ema);

    // Calculate EMA for remaining data
    for (let i = period; i < data.length; i++) {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }

    return result;
  }

  calculateRSI(data, period = 14) {
    const gains = [];
    const losses = [];

    for (let i = 1; i < data.length; i++) {
      const difference = data[i] - data[i - 1];
      gains.push(difference > 0 ? difference : 0);
      losses.push(difference < 0 ? Math.abs(difference) : 0);
    }

    const avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return rsi;
  }

  calculateMACD(data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const fastEMA = this.calculateEMA(data, fastPeriod);
    const slowEMA = this.calculateEMA(data, slowPeriod);

    const macdLine = [];
    const minLength = Math.min(fastEMA.length, slowEMA.length);

    for (let i = 0; i < minLength; i++) {
      macdLine.push(fastEMA[i] - slowEMA[i]);
    }

    const signalLine = this.calculateEMA(macdLine, signalPeriod);

    return {
      macd: macdLine,
      signal: signalLine,
      histogram: macdLine.slice(-signalLine.length).map((v, i) => v - signalLine[i]),
    };
  }

  calculateBollingerBands(data, period = 20, stdDev = 2) {
    const sma = this.calculateSMA(data, period);
    const bands = { upper: [], middle: [], lower: [] };

    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const std = Math.sqrt(variance);

      bands.middle.push(mean);
      bands.upper.push(mean + (stdDev * std));
      bands.lower.push(mean - (stdDev * std));
    }

    return bands;
  }

  createSignal(type, confidence, indicators = {}) {
    return {
      type, // 'BUY', 'SELL', 'HOLD', 'CLOSE'
      confidence, // 0-1
      indicators,
      timestamp: Date.now(),
      strategy: this.name,
    };
  }
}
