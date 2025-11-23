# Quick Start Guide - CCTTB Trading Bot

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Exchange account (Binance/Bybit recommended)
- 10 minutes of your time

## Step 1: Install Dependencies (1 min)

```bash
cd ccttb-trading-bot
npm install
```

## Step 2: Configure (2 min)

```bash
# Copy example configuration
cp .env.example .env

# Edit with your favorite editor
nano .env  # or code .env or vim .env
```

**Minimal required configuration:**

```bash
# Exchange (use testnet first!)
EXCHANGE_NAME=binance
EXCHANGE_API_KEY=your_key_here
EXCHANGE_API_SECRET=your_secret_here
EXCHANGE_TESTNET=true

# Trading
DEFAULT_TRADING_PAIR=BTC/USDT
ACTIVE_STRATEGY=hybrid

# AI (optional but recommended)
ANTHROPIC_API_KEY=your_anthropic_key_here
AI_ENABLED=true
```

## Step 3: Start the Bot (1 min)

```bash
npm start
```

You should see:
```
✅ Configuration loaded
✅ Trading Bot initialized
✅ AI Agent initialized
✅ n8n Integration started
🎯 Trading Bot is now running!
```

## Step 4: Monitor (ongoing)

Watch the console for:
- 📊 Signal generation
- 🟢 BUY orders
- 🔴 SELL orders
- ✅ Completed trades

## Quick Commands

```bash
# Start the bot
npm start

# Start n8n server only
npm run n8n-server

# Run backtest
npm run backtest

# Run tests
npm test
```

## Getting API Keys

### Binance Testnet (Recommended for testing)
1. Go to: https://testnet.binance.vision/
2. Register
3. Get API keys
4. Done! (No real money needed)

### Anthropic (for AI features)
1. Go to: https://console.anthropic.com/
2. Sign up
3. Create API key
4. Paste in `.env`

## Default Settings

The bot comes with safe defaults:
- ✅ Testnet mode: ON
- ✅ Position size: 0.01 (1%)
- ✅ Risk per trade: 2%
- ✅ Stop loss: 2%
- ✅ Take profit: 5%
- ✅ Max daily loss: $100
- ✅ Max daily trades: 10

## Check Status

Via API:
```bash
curl http://localhost:3000/health
```

## Stop the Bot

Press `Ctrl+C` in the terminal

## Next Steps

1. ✅ Monitor for a few hours in testnet
2. ✅ Review trades and performance
3. ✅ Adjust settings if needed
4. ✅ Read full documentation
5. ✅ Set up n8n workflows (optional)
6. ✅ Enable notifications (optional)

## Common Issues

### "Exchange connection failed"
- Check API keys are correct
- Verify testnet mode matches API type
- Check internet connection

### "AI Agent initialization failed"
- Check Anthropic API key
- Verify key is active
- AI is optional, set `AI_ENABLED=false` to skip

### "No signals generated"
- Normal! Market might not have trading opportunities
- Try different strategy or timeframe
- Check logs for errors

## Need Help?

1. Check `docs/SETUP_GUIDE.md` for detailed setup
2. Read `docs/API_REFERENCE.md` for API details
3. Review `README.md` for complete documentation
4. Check logs in `logs/trading-bot.log`

## Safety First! ⚠️

- ✅ Always start with testnet
- ✅ Test for at least a week
- ✅ Start with small amounts
- ✅ Never invest more than you can lose
- ✅ Monitor regularly
- ✅ Understand the risks

---

**Happy Trading! 🚀**

*You're now running a professional-grade trading bot with AI capabilities!*
