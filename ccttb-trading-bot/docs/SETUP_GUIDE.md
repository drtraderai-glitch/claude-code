# CCTTB Trading Bot - Setup Guide

Complete step-by-step guide to set up and configure your trading bot.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Exchange Setup](#exchange-setup)
3. [API Keys Configuration](#api-keys-configuration)
4. [Bot Installation](#bot-installation)
5. [n8n Integration Setup](#n8n-integration-setup)
6. [AI Agent Setup](#ai-agent-setup)
7. [Testing & Verification](#testing--verification)
8. [Production Deployment](#production-deployment)

## System Requirements

### Minimum Requirements
- **OS**: Linux, macOS, or Windows
- **Node.js**: Version 18.0.0 or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 500MB for bot + logs
- **Network**: Stable internet connection

### Recommended Setup
- **VPS/Cloud Server**: For 24/7 operation
- **RAM**: 4GB or more
- **CPU**: 2+ cores
- **Monitoring**: Uptime monitoring service

## Exchange Setup

### Supported Exchanges
- Binance
- Binance Futures
- Bybit
- Bybit Futures
- OKX
- Kraken
- And 100+ more via CCXT

### Creating Exchange Account

1. **Sign up** for an exchange account
2. **Complete KYC** verification (if required)
3. **Enable 2FA** for security
4. **Deposit funds** (start with small amounts)

### Testnet Setup (Recommended First)

#### Binance Testnet
1. Visit: https://testnet.binance.vision/
2. Sign up for testnet account
3. Get testnet API keys
4. Fund account with test USDT

#### Bybit Testnet
1. Visit: https://testnet.bybit.com/
2. Create testnet account
3. Generate API keys
4. Use test funds

## API Keys Configuration

### Creating API Keys

#### Binance
1. Log into Binance
2. Go to **Profile → API Management**
3. Click **Create API**
4. Name: "Trading Bot"
5. **Enable** "Enable Futures"
6. **Restrict** access to trusted IPs (recommended)
7. **Copy** API Key and Secret

#### API Key Permissions
Required permissions:
- ✅ Reading
- ✅ Spot & Margin Trading
- ✅ Futures Trading (if trading futures)
- ❌ Withdrawals (NEVER enable)

### Security Best Practices
1. **Never share** API keys
2. **Use IP whitelist** when possible
3. **Separate keys** for bot and manual trading
4. **Rotate keys** regularly
5. **Monitor activity** in exchange dashboard

## Bot Installation

### Step 1: Install Node.js

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### macOS
```bash
brew install node@18
```

#### Windows
Download from: https://nodejs.org/

### Step 2: Clone/Download Bot

```bash
cd /path/to/your/projects
# If you have the bot files, navigate to the directory
cd ccttb-trading-bot
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment

```bash
# Copy example configuration
cp .env.example .env

# Edit configuration
nano .env  # or use your favorite editor
```

### Step 5: Basic Configuration

Edit `.env`:

```bash
# Exchange - Start with testnet
EXCHANGE_NAME=binance
EXCHANGE_API_KEY=paste_your_api_key_here
EXCHANGE_API_SECRET=paste_your_secret_here
EXCHANGE_TESTNET=true

# Trading
DEFAULT_TRADING_PAIR=BTC/USDT
DEFAULT_TIMEFRAME=1h
DEFAULT_POSITION_SIZE=0.01
RISK_PERCENTAGE=2
STOP_LOSS_PERCENTAGE=2
TAKE_PROFIT_PERCENTAGE=5

# Risk Management
MAX_DAILY_LOSS=100
MAX_DAILY_TRADES=10

# Strategy
ACTIVE_STRATEGY=hybrid
```

## n8n Integration Setup

### Installing n8n

#### Option 1: Docker (Recommended)
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

#### Option 2: npm
```bash
npm install -g n8n
n8n
```

### Configuring n8n

1. **Access n8n**: http://localhost:5678
2. **Create account** (first time)
3. **Import workflows**:
   - Go to **Workflows**
   - Click **Import from File**
   - Select `workflows/basic-trading-workflow.json`
   - Repeat for `ai-signal-workflow.json`

### Setting up Bot API Connection

1. In n8n, go to **Credentials**
2. Add **HTTP Header Auth** credential:
   - **Name**: "Trading Bot API"
   - **Header Name**: "X-Api-Key"
   - **Header Value**: (generate a random key)

3. Update bot `.env`:
```bash
N8N_ENABLED=true
N8N_SERVER_PORT=3000
N8N_API_KEY=same_key_as_above
```

### Testing n8n Connection

```bash
# Start bot n8n server
npm run n8n-server

# In another terminal, test the API
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":...}
```

## AI Agent Setup

### Getting Anthropic API Key

1. Visit: https://console.anthropic.com/
2. **Sign up** or log in
3. Go to **API Keys**
4. Click **Create Key**
5. **Copy** the key immediately (shown once!)

### Configuring AI Agent

Update `.env`:
```bash
AI_ENABLED=true
ANTHROPIC_API_KEY=sk-ant-your-key-here
AI_MODEL=claude-sonnet-4-5-20250929
AI_CONFIDENCE_THRESHOLD=0.7
```

### Testing AI Agent

Create test file `test-ai.js`:
```javascript
import { AIAgent } from './src/ai-agent/agent.js';
import { ConfigManager } from './src/utils/config.js';

const config = new ConfigManager();
await config.load();

const agent = new AIAgent(config);
await agent.initialize();

const insight = await agent.getMarketInsight('BTC/USDT', '1h');
console.log('AI Insight:', insight);
```

Run:
```bash
node test-ai.js
```

## Testing & Verification

### Step 1: Test Exchange Connection

Create `test-exchange.js`:
```javascript
import ccxt from 'ccxt';
import dotenv from 'dotenv';

dotenv.config();

const exchange = new ccxt.binance({
  apiKey: process.env.EXCHANGE_API_KEY,
  secret: process.env.EXCHANGE_API_SECRET,
});

if (process.env.EXCHANGE_TESTNET === 'true') {
  exchange.setSandboxMode(true);
}

try {
  await exchange.loadMarkets();
  console.log('✅ Exchange connection successful');

  const balance = await exchange.fetchBalance();
  console.log('Balance:', balance.total);
} catch (error) {
  console.error('❌ Exchange connection failed:', error.message);
}
```

Run:
```bash
node test-exchange.js
```

### Step 2: Run Backtest

```bash
npm run backtest BTC/USDT 2024-01-01 2024-06-30
```

Verify:
- ✅ Strategy runs without errors
- ✅ Generates signals
- ✅ Calculates performance metrics

### Step 3: Start Bot in Testnet

```bash
npm start
```

Check for:
- ✅ "Trading Bot initialized" message
- ✅ "n8n Integration started" (if enabled)
- ✅ "AI Agent initialized" (if enabled)
- ✅ "Trading Bot is now running!"

### Step 4: Monitor First Hour

Watch for:
- 📊 Signal generation
- 🛡️ Risk checks
- 🤖 AI analysis (if enabled)
- 📝 Log messages

## Production Deployment

### Pre-Production Checklist

- [ ] Tested in testnet for at least 1 week
- [ ] Verified all strategies work correctly
- [ ] Backtesting results are acceptable
- [ ] Risk limits are properly configured
- [ ] API keys are secure
- [ ] Monitoring is set up
- [ ] Emergency stop procedure is ready

### Switching to Production

1. **Update `.env`**:
```bash
EXCHANGE_TESTNET=false
```

2. **Use production API keys**

3. **Reduce position sizes initially**:
```bash
DEFAULT_POSITION_SIZE=0.001  # Start very small
```

4. **Enable all safety features**:
```bash
AI_ENABLED=true
MAX_DAILY_LOSS=50
MAX_DAILY_TRADES=5
```

### Running as Service

#### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start bot
pm2 start src/index.js --name trading-bot

# Start n8n server
pm2 start src/integrations/n8n-server.js --name n8n-server

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
```

#### Using systemd (Linux)

Create `/etc/systemd/system/trading-bot.service`:
```ini
[Unit]
Description=CCTTB Trading Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/ccttb-trading-bot
ExecStart=/usr/bin/node src/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable trading-bot
sudo systemctl start trading-bot
```

### Monitoring

#### View Logs
```bash
# PM2
pm2 logs trading-bot

# systemd
journalctl -u trading-bot -f

# Direct file
tail -f logs/trading-bot.log
```

#### Key Metrics to Monitor
- Win rate
- Profit/loss
- Number of trades
- Daily loss (vs. limit)
- API errors
- Exchange connection status

## Troubleshooting

### Common Issues

#### "Exchange connection failed"
- Check API keys
- Verify exchange name is correct
- Check if testnet mode matches API keys
- Verify IP whitelist settings

#### "AI Agent initialization failed"
- Check Anthropic API key
- Verify API key is active
- Check internet connection
- Review API usage limits

#### "No trading signals generated"
- Normal in certain market conditions
- Try different strategy
- Check if pair has enough liquidity
- Verify timeframe data is available

#### "Orders failing"
- Check account balance
- Verify trading permissions
- Check minimum order sizes
- Review exchange trading rules

### Getting Help

1. Check logs: `logs/trading-bot.log`
2. Review error messages
3. Verify configuration
4. Test in isolated mode
5. Check exchange status

## Next Steps

1. ✅ Complete setup
2. ✅ Run in testnet
3. ✅ Monitor performance
4. ✅ Fine-tune settings
5. ✅ Deploy to production
6. 📊 Set up dashboard
7. 📱 Configure notifications
8. 🔄 Regular maintenance

## Safety Reminders

1. **Start small** - Use minimal position sizes
2. **Monitor regularly** - Check bot daily
3. **Set limits** - Use all risk management features
4. **Stay informed** - Understand what the bot is doing
5. **Be prepared** - Have emergency stop procedure
6. **Test thoroughly** - Never skip testnet phase
7. **Keep learning** - Continuously improve strategy

---

**Congratulations! Your bot is ready to trade! 🎉**

Remember: Trading carries risk. Never trade with money you can't afford to lose.
