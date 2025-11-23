# CCTTB Trading Bot

**Comprehensive Crypto Trading Bot with AI Agent & n8n Workflow Integration**

A professional-grade cryptocurrency trading bot with advanced features including AI-powered signal analysis, multiple trading strategies, risk management, and seamless n8n workflow integration.

## 🌟 Features

### Core Features
- ✅ **Multiple Trading Strategies**
  - RSI + MACD Strategy
  - Bollinger Bands Strategy
  - EMA Crossover Strategy
  - Hybrid Multi-Indicator Strategy

- 🤖 **AI Agent Integration**
  - Claude AI-powered signal analysis
  - Real-time market insights
  - Strategy recommendations
  - Confidence-based decision making

- 🔄 **n8n Workflow Integration**
  - REST API endpoints
  - Webhook support
  - Real-time status monitoring
  - Automated portfolio tracking

- 🛡️ **Advanced Risk Management**
  - Position sizing
  - Stop-loss & take-profit orders
  - Daily loss limits
  - Trade frequency control
  - Volatility monitoring

- 📊 **Portfolio Management**
  - Real-time balance tracking
  - Performance analytics
  - Win rate calculation
  - Profit/loss reporting

- 🔐 **Security**
  - API key authentication
  - Testnet mode support
  - Secure environment configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Exchange API keys (Binance, Bybit, etc.)
- Anthropic API key (for AI features)
- n8n instance (optional)

### Installation

1. **Clone or navigate to the bot directory**
```bash
cd ccttb-trading-bot
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your API keys and settings
```

4. **Start the bot**
```bash
npm start
```

## 📋 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Exchange Configuration
EXCHANGE_NAME=binance
EXCHANGE_API_KEY=your_api_key
EXCHANGE_API_SECRET=your_secret_key
EXCHANGE_TESTNET=true  # Start with testnet!

# Trading Configuration
DEFAULT_TRADING_PAIR=BTC/USDT
DEFAULT_TIMEFRAME=1h
DEFAULT_POSITION_SIZE=0.01
RISK_PERCENTAGE=2
STOP_LOSS_PERCENTAGE=2
TAKE_PROFIT_PERCENTAGE=5

# AI Agent
ANTHROPIC_API_KEY=your_anthropic_key
AI_ENABLED=true
AI_MODEL=claude-sonnet-4-5-20250929

# n8n Integration
N8N_ENABLED=true
N8N_SERVER_PORT=3000
N8N_API_KEY=your_n8n_api_key

# Strategy
ACTIVE_STRATEGY=hybrid
```

## 🎯 Trading Strategies

### 1. RSI + MACD Strategy
Combines Relative Strength Index and MACD indicators for oscillating markets.

**Best for:** Trending markets with clear momentum shifts

### 2. Bollinger Bands Strategy
Mean reversion strategy using Bollinger Bands.

**Best for:** Ranging markets with predictable volatility

### 3. EMA Crossover Strategy
Trend-following strategy using exponential moving average crossovers.

**Best for:** Strong trending markets

### 4. Hybrid Strategy (Recommended)
Combines multiple indicators for robust signals.

**Best for:** All market conditions

## 🤖 AI Agent

The AI Agent uses Claude to:
- Analyze trading signals before execution
- Provide market insights
- Recommend optimal strategies
- Validate risk parameters

### Usage Example

```javascript
const aiRecommendation = await aiAgent.analyzeSignal(signal, marketData);
// Returns: { approved: true/false, confidence: 0-1, reasoning: "..." }
```

## 🔄 n8n Integration

### Starting the n8n Server

```bash
npm run n8n-server
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/status` | GET | Bot status |
| `/api/portfolio` | GET | Portfolio snapshot |
| `/api/positions` | GET | Open positions |
| `/api/trade` | POST | Manual trade execution |
| `/api/bot/start` | POST | Start bot |
| `/api/bot/stop` | POST | Stop bot |
| `/api/risk` | GET | Risk statistics |
| `/api/ai/analyze` | POST | AI market analysis |
| `/api/strategy` | POST | Change strategy |
| `/webhook/signal` | POST | Receive trading signals |
| `/webhook/portfolio` | GET | Portfolio webhook |

### Authentication

Include API key in headers:
```
X-Api-Key: your_n8n_api_key
```

### Example n8n HTTP Request

```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/trade",
  "headers": {
    "X-Api-Key": "your_api_key"
  },
  "body": {
    "type": "BUY",
    "pair": "BTC/USDT"
  }
}
```

## 📊 Workflow Examples

### Basic Trading Workflow
Import `workflows/basic-trading-workflow.json` into n8n for:
- Scheduled status checks
- Portfolio monitoring
- Performance alerts
- Automated notifications

### AI Signal Workflow
Import `workflows/ai-signal-workflow.json` for:
- AI-powered signal analysis
- Sentiment-based trading
- Automated trade execution
- Signal validation

## 🧪 Backtesting

Test strategies against historical data:

```bash
npm run backtest BTC/USDT 2024-01-01 2024-12-31
```

Results include:
- Win rate
- Total profit/loss
- Number of trades
- Return percentage

## 📁 Project Structure

```
ccttb-trading-bot/
├── src/
│   ├── core/              # Core trading engine
│   │   ├── TradingBot.js
│   │   ├── RiskManager.js
│   │   ├── OrderManager.js
│   │   └── PortfolioManager.js
│   ├── strategies/        # Trading strategies
│   │   ├── StrategyFactory.js
│   │   ├── BaseStrategy.js
│   │   ├── RSIMACDStrategy.js
│   │   ├── BollingerBandsStrategy.js
│   │   ├── EMACrossoverStrategy.js
│   │   └── HybridStrategy.js
│   ├── integrations/      # n8n integration
│   │   ├── n8n-integration.js
│   │   └── n8n-server.js
│   ├── ai-agent/          # AI capabilities
│   │   └── agent.js
│   ├── utils/             # Utilities
│   │   ├── logger.js
│   │   ├── config.js
│   │   └── backtesting.js
│   └── index.js           # Main entry point
├── workflows/             # n8n workflow templates
│   ├── basic-trading-workflow.json
│   └── ai-signal-workflow.json
├── config/                # Configuration files
├── docs/                  # Documentation
├── tests/                 # Unit tests
├── package.json
├── .env.example
└── README.md
```

## 🛡️ Risk Management

The bot includes comprehensive risk management:

- **Position Sizing**: Calculated based on risk percentage and signal confidence
- **Stop Loss**: Automatic stop-loss orders on every trade
- **Take Profit**: Automatic take-profit orders
- **Daily Limits**: Maximum daily loss and trade count
- **Volatility Checks**: Trades blocked during extreme volatility
- **AI Validation**: Optional AI approval for all signals

## 🔧 Development

### Run in Development Mode
```bash
npm run dev
```

### Run Tests
```bash
npm test
```

### Available Scripts
- `npm start` - Start the bot
- `npm run dev` - Development mode with auto-reload
- `npm run n8n-server` - Start n8n integration server
- `npm run ai-agent` - Test AI agent
- `npm run backtest` - Run backtesting

## 📝 Logging

Logs are written to:
- Console (colorized output)
- File: `logs/trading-bot.log`

Log levels: `error`, `warn`, `info`, `debug`

Configure in `.env`:
```bash
LOG_LEVEL=info
LOG_FILE=./logs/trading-bot.log
```

## ⚠️ Important Notes

### Security
- Never commit `.env` file
- Use testnet mode first
- Keep API keys secure
- Use IP whitelist on exchange

### Trading Risks
- Cryptocurrency trading is risky
- Start with small amounts
- Test thoroughly in testnet
- Monitor the bot regularly
- Understand the strategies

### Compliance
- Check local regulations
- Understand tax implications
- Keep trading records

## 🤝 Support

For issues and questions:
1. Check the documentation in `/docs`
2. Review example workflows
3. Test in sandbox/testnet mode
4. Check logs for errors

## 📜 License

MIT License - See LICENSE file

## 🎓 Learning Resources

- [CCXT Documentation](https://docs.ccxt.com/)
- [n8n Documentation](https://docs.n8n.io/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Technical Analysis Guide](https://www.investopedia.com/technical-analysis-4689657)

## 🔄 Updates & Roadmap

### Completed
- ✅ Core trading engine
- ✅ Multiple strategies
- ✅ AI agent integration
- ✅ n8n workflows
- ✅ Risk management
- ✅ Backtesting

### Planned
- 🔜 Machine learning strategy
- 🔜 Multi-exchange support
- 🔜 Advanced portfolio optimization
- 🔜 Telegram bot integration
- 🔜 Web dashboard
- 🔜 Database persistence

## 🌟 Getting Started Tips

1. **Start Small**: Begin with testnet and small amounts
2. **Test Strategies**: Backtest before live trading
3. **Monitor Regularly**: Check bot performance daily
4. **Adjust Settings**: Fine-tune based on market conditions
5. **Use AI**: Enable AI agent for better decision making
6. **Set Limits**: Configure conservative risk limits
7. **Learn Continuously**: Study the strategies and adjust

---

**Happy Trading! 🚀📈**

*Remember: This bot is provided as-is. Always do your own research and never trade with money you can't afford to lose.*
