# n8n Workflow Guide

Complete guide to using n8n workflows with CCTTB Trading Bot.

## Table of Contents
1. [Introduction](#introduction)
2. [Workflow Templates](#workflow-templates)
3. [Creating Custom Workflows](#creating-custom-workflows)
4. [Advanced Examples](#advanced-examples)
5. [Troubleshooting](#troubleshooting)

## Introduction

n8n is a powerful workflow automation tool that can:
- Monitor bot performance
- Execute trades based on custom logic
- Send notifications
- Integrate with external services
- Create complex trading strategies

## Workflow Templates

### 1. Basic Trading Workflow

**File:** `workflows/basic-trading-workflow.json`

**Features:**
- Scheduled status checks every hour
- Portfolio monitoring
- Performance alerts when win rate drops below 40%
- Discord notifications

**Setup:**
1. Import workflow into n8n
2. Configure Discord webhook (optional)
3. Set API credentials
4. Activate workflow

**Customization:**
- Change schedule in "Schedule Trigger" node
- Adjust alert threshold in "Check Performance" node
- Add email/Telegram notifications

### 2. AI Signal Workflow

**File:** `workflows/ai-signal-workflow.json`

**Features:**
- Webhook receiver for external signals
- AI-powered signal analysis
- Sentiment-based trade execution
- Automatic signal validation

**Setup:**
1. Import workflow into n8n
2. Get webhook URL from "Webhook" node
3. Configure credentials
4. Activate workflow

**Usage:**
Send POST request to webhook:
```bash
curl -X POST https://your-n8n.com/webhook/trading-signal \
  -H "Content-Type: application/json" \
  -d '{
    "type": "BUY",
    "pair": "BTC/USDT",
    "price": 45000,
    "confidence": 0.85
  }'
```

## Creating Custom Workflows

### Workflow 1: Multi-Timeframe Analysis

**Goal:** Get signals from multiple timeframes and trade when they align.

**Nodes:**
1. **Schedule Trigger** (every 4 hours)
2. **HTTP Request** - Get 1h signal
3. **HTTP Request** - Get 4h signal
4. **HTTP Request** - Get 1d signal
5. **Code Node** - Merge signals
6. **IF Node** - Check if signals align
7. **HTTP Request** - Execute trade
8. **Slack** - Send notification

**Code Node Logic:**
```javascript
// Get all signals
const signals = $input.all().map(item => item.json);

// Check alignment
const buyCount = signals.filter(s => s.signal?.type === 'BUY').length;
const sellCount = signals.filter(s => s.signal?.type === 'SELL').length;

let decision = 'HOLD';
let confidence = 0;

if (buyCount >= 2) {
  decision = 'BUY';
  confidence = buyCount / signals.length;
} else if (sellCount >= 2) {
  decision = 'SELL';
  confidence = sellCount / signals.length;
}

return {
  json: {
    decision,
    confidence,
    signals
  }
};
```

### Workflow 2: Portfolio Rebalancing

**Goal:** Automatically rebalance portfolio when allocations drift.

**Nodes:**
1. **Schedule Trigger** (daily at midnight)
2. **HTTP Request** - Get portfolio
3. **Code Node** - Calculate rebalancing needs
4. **IF Node** - Check if rebalancing needed
5. **HTTP Request** - Execute rebalancing trades
6. **Set** - Log results
7. **Spreadsheet** - Record in Google Sheets

**Rebalancing Logic:**
```javascript
const portfolio = $json.balance.total;
const target = {
  'BTC': 0.40,
  'ETH': 0.30,
  'USDT': 0.30
};

const total = Object.values(portfolio).reduce((a, b) => a + b, 0);
const current = {};

for (const [asset, amount] of Object.entries(portfolio)) {
  current[asset] = amount / total;
}

const trades = [];

for (const [asset, targetAlloc] of Object.entries(target)) {
  const currentAlloc = current[asset] || 0;
  const diff = targetAlloc - currentAlloc;

  if (Math.abs(diff) > 0.05) { // 5% threshold
    trades.push({
      asset,
      action: diff > 0 ? 'BUY' : 'SELL',
      amount: Math.abs(diff) * total
    });
  }
}

return {
  json: {
    needsRebalancing: trades.length > 0,
    trades
  }
};
```

### Workflow 3: News-Based Trading

**Goal:** Trade based on crypto news sentiment.

**Nodes:**
1. **RSS Feed Trigger** - CoinDesk, CryptoNews
2. **HTTP Request** - Send to sentiment analysis API
3. **Code Node** - Process sentiment
4. **IF Node** - Check if sentiment is strong
5. **HTTP Request** - Get AI analysis
6. **IF Node** - Validate with AI
7. **HTTP Request** - Execute trade
8. **Database** - Log trade with news reference

### Workflow 4: Stop Loss Monitoring

**Goal:** Monitor positions and tighten stop losses as profit increases.

**Nodes:**
1. **Schedule Trigger** (every 15 minutes)
2. **HTTP Request** - Get positions
3. **Item Lists** - Split positions
4. **Code Node** - Calculate trailing stop
5. **HTTP Request** - Update stop loss
6. **Merge** - Combine results
7. **Slack** - Notify if stops updated

**Trailing Stop Logic:**
```javascript
const position = $json;
const currentPrice = position.currentPrice; // You'd fetch this
const entryPrice = position.entryPrice;
const profitPercent = ((currentPrice - entryPrice) / entryPrice) * 100;

let newStopLoss = position.stopLoss;

if (profitPercent > 10) {
  // Move stop to break-even + 5%
  newStopLoss = entryPrice * 1.05;
} else if (profitPercent > 5) {
  // Move stop to break-even
  newStopLoss = entryPrice;
}

return {
  json: {
    pair: position.pair,
    needsUpdate: newStopLoss > position.stopLoss,
    newStopLoss,
    profitPercent
  }
};
```

### Workflow 5: Performance Dashboard

**Goal:** Send daily performance report.

**Nodes:**
1. **Schedule Trigger** (daily at 8 AM)
2. **HTTP Request** - Get portfolio
3. **HTTP Request** - Get positions
4. **HTTP Request** - Get risk stats
5. **Code Node** - Generate report
6. **Email** - Send report
7. **Google Sheets** - Log metrics

**Report Generation:**
```javascript
const portfolio = $input.first().json;
const positions = $input.all()[1].json;
const risk = $input.all()[2].json;

const report = `
📊 Daily Trading Report

💰 Portfolio
- Total Equity: $${portfolio.balance.total.USDT}
- Available: $${portfolio.balance.free.USDT}
- In Use: $${portfolio.balance.used.USDT}

📈 Performance
- Net Profit: $${portfolio.performance.netProfit}
- Win Rate: ${portfolio.performance.winRate}%
- Total Trades: ${portfolio.performance.totalTrades}

🎯 Open Positions: ${positions.positions.length}
${positions.positions.map(p =>
  `- ${p.pair}: ${p.side} @ $${p.entryPrice}`
).join('\n')}

🛡️ Risk Management
- Daily Loss: $${risk.dailyLoss}
- Daily Trades: ${risk.dailyTrades}

Status: ${portfolio.performance.winRate > 50 ? '✅ Good' : '⚠️ Needs Review'}
`;

return {
  json: {
    subject: `Trading Bot Report - ${new Date().toLocaleDateString()}`,
    body: report
  }
};
```

## Advanced Examples

### Webhook Integration with TradingView

**TradingView Alert Message:**
```json
{
  "type": "{{strategy.order.action}}",
  "pair": "{{ticker}}",
  "price": "{{close}}",
  "confidence": 0.9,
  "indicators": {
    "rsi": {{rsi}},
    "volume": {{volume}}
  }
}
```

**Workflow:**
1. TradingView sends alert to n8n webhook
2. n8n validates signal
3. Gets AI analysis
4. Executes trade via bot API
5. Logs to database

### Multi-Bot Coordination

Manage multiple trading bots:

**Nodes:**
1. **Schedule Trigger**
2. **HTTP Request** (multiple) - Get status from each bot
3. **Code Node** - Aggregate performance
4. **IF Node** - Detect issues
5. **Function** - Decide actions
6. **HTTP Request** (multiple) - Control bots
7. **Dashboard Update**

### Risk-Adjusted Position Sizing

Calculate position size based on Kelly Criterion:

```javascript
const winRate = $json.performance.winRate / 100;
const avgWin = $json.performance.totalProfit / $json.performance.wins;
const avgLoss = $json.performance.totalLoss / $json.performance.losses;
const winLossRatio = avgWin / avgLoss;

// Kelly Criterion
const kelly = winRate - ((1 - winRate) / winLossRatio);

// Use 25% of Kelly for safety
const positionSize = kelly * 0.25;

return {
  json: {
    recommendedPositionSize: Math.max(0.01, Math.min(positionSize, 0.1))
  }
};
```

## Best Practices

### 1. Error Handling

Always add error handling nodes:
```javascript
try {
  // Your logic
  return { json: result };
} catch (error) {
  return {
    json: {
      error: true,
      message: error.message
    }
  };
}
```

### 2. Rate Limiting

Add delays between requests:
- Use "Wait" node
- Batch requests when possible
- Respect exchange rate limits

### 3. Logging

Log all important actions:
- Trade executions
- Errors
- Performance metrics
- Configuration changes

### 4. Notifications

Set up alerts for:
- Trade executions
- Errors
- Performance thresholds
- Risk limit breaches

### 5. Testing

Test workflows in testnet:
1. Use testnet bot instance
2. Test all branches
3. Verify error handling
4. Check notifications

## Troubleshooting

### Workflow Not Triggering

**Check:**
- Workflow is activated
- Trigger configuration is correct
- No errors in execution log
- Webhook URL is accessible

### API Requests Failing

**Check:**
- API key is correct
- Bot server is running
- Correct port and URL
- Request format matches API docs

### Credentials Issues

**Fix:**
1. Re-create credential
2. Test with simple request
3. Check credential selection in nodes
4. Verify header name/value

### Code Node Errors

**Debug:**
```javascript
console.log('Input:', JSON.stringify($input.all()));
console.log('JSON:', JSON.stringify($json));
// Add try-catch
// Return clear error messages
```

## Resources

### n8n Documentation
- https://docs.n8n.io/
- Community workflows
- Node reference

### Example Workflows Repository
- Check `workflows/` directory
- Import and customize
- Share your own

### Community
- n8n Forum
- Discord community
- GitHub discussions

---

**Happy Automating! 🤖**

Create powerful trading workflows and automate your strategy!
