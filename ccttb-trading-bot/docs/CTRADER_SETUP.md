# cTrader Setup Guide for Forex Trading

Complete guide to set up the trading bot with cTrader for forex trading.

## 📋 Prerequisites

1. **cTrader account** (IC Markets, Pepperstone, etc.)
2. **FIX API access** (request from your broker)
3. **Node.js 18+** installed
4. **Basic forex trading knowledge**

---

## 🔑 Getting cTrader FIX API Credentials

### Step 1: Open cTrader Account

**IC Markets (Recommended):**
1. Go to: https://www.icmarkets.com/
2. Click **"Open Live Account"** or **"Open Demo Account"**
3. Complete registration
4. Verify your account

### Step 2: Request FIX API Access

1. **Contact support**: Email or live chat
2. **Request**: "I need FIX API access for algorithmic trading"
3. **Provide**: Account number and reason
4. **Receive**: FIX API credentials (usually within 24-48 hours)

### Step 3: Locate Your Credentials

Your broker will provide:
- **Host**: Server address (e.g., demo-uk-eqx-01.p.c-trader.com)
- **Ports**: SSL and Plain text ports (5212/5202 for trading)
- **SenderCompID**: Your account identifier (e.g., demo.icmarkets.9578804)
- **TargetCompID**: Usually "cServer"
- **SenderSubID**: "TRADE" for trading, "QUOTE" for quotes
- **Password**: Your account password

---

## ⚙️ Bot Configuration

### Step 1: Update Configuration

```bash
cd ccttb-trading-bot

# Copy cTrader configuration
cp .env.ctrader.example .env

# Edit configuration
notepad .env  # Windows
nano .env     # Linux/Mac
```

### Step 2: Add Your Credentials

Update these fields in `.env`:

```env
# ==========================================
# cTRADER CONFIGURATION
# ==========================================
EXCHANGE_NAME=ctrader

CTRADER_HOST=demo-uk-eqx-01.p.c-trader.com
CTRADER_PORT_SSL=5212
CTRADER_PORT_PLAIN=5202
CTRADER_USE_SSL=true

# ⚠️ CHANGE THESE TO YOUR CREDENTIALS
CTRADER_SENDER_COMP_ID=demo.icmarkets.9578804
CTRADER_TARGET_COMP_ID=cServer
CTRADER_SENDER_SUB_ID=TRADE
CTRADER_PASSWORD=YOUR_ACCOUNT_PASSWORD

# ==========================================
# TRADING CONFIGURATION
# ==========================================
DEFAULT_TRADING_PAIR=EURUSD
DEFAULT_TIMEFRAME=1h
DEFAULT_POSITION_SIZE=0.01

# Risk in pips
STOP_LOSS_PIPS=20
TAKE_PROFIT_PIPS=40

MAX_DAILY_LOSS=100
MAX_DAILY_TRADES=10

ACTIVE_STRATEGY=hybrid
```

---

## 🚀 Running the Bot

### Install Dependencies

```bash
npm install
```

### Start the Bot

```bash
npm start
```

**Expected output:**
```
🚀 Starting CCTTB Trading Bot...
✅ Configuration loaded
Connecting to cTrader via FIX protocol...
TCP connection established
Logon message sent
Logon acknowledgment received
✅ Trading Bot initialized
🎯 Trading Bot is now running!
```

---

## 📊 Understanding cTrader FIX Protocol

### Message Types

| Type | Description |
|------|-------------|
| A | Logon |
| 0 | Heartbeat |
| D | New Order |
| F | Cancel Order |
| 8 | Execution Report |
| V | Market Data Request |
| W | Market Data Snapshot |

### Order Types

- **Market Order**: Execute immediately at current price
- **Limit Order**: Execute at specific price or better
- **Stop Order**: Trigger when price reaches stop level

### FIX Tags (Common)

| Tag | Field | Description |
|-----|-------|-------------|
| 11 | ClOrdID | Client Order ID |
| 35 | MsgType | Message Type |
| 37 | OrderID | Order ID |
| 38 | OrderQty | Quantity |
| 39 | OrdStatus | Order Status |
| 44 | Price | Limit Price |
| 54 | Side | Buy(1) or Sell(2) |
| 55 | Symbol | Currency pair |
| 99 | StopPx | Stop Price |

---

## 🔄 Forex-Specific Configuration

### Position Sizing

Forex uses **lots**:
- 1.0 = 1 standard lot = 100,000 units
- 0.1 = 1 mini lot = 10,000 units
- 0.01 = 1 micro lot = 1,000 units

```env
# Start with micro lots
DEFAULT_POSITION_SIZE=0.01
MAX_POSITION_SIZE=0.1
```

### Pip Calculation

```env
# Set stop loss and take profit in pips
STOP_LOSS_PIPS=20      # 20 pips stop loss
TAKE_PROFIT_PIPS=40    # 40 pips take profit

# For JPY pairs, 1 pip = 0.01
# For others, 1 pip = 0.0001
```

### Popular Forex Pairs

```env
# Major pairs
EURUSD, GBPUSD, USDJPY, USDCHF

# Minor pairs
EURGBP, EURJPY, GBPJPY

# Commodities
XAUUSD (Gold), XAGUSD (Silver)

# Indices
US30 (Dow Jones), US100 (Nasdaq), US500 (S&P 500)
```

---

## 🛡️ Risk Management for Forex

### Calculate Position Size

```javascript
// Risk per trade
const riskAmount = accountBalance * (riskPercentage / 100);

// Position size in lots
const positionSize = riskAmount / (stopLossPips * pipValue);
```

### Example

```
Account: $10,000
Risk: 2% = $200
Stop Loss: 20 pips
Pip Value: $1 (for micro lot)

Position Size = $200 / (20 * $1) = 10 micro lots = 0.1 lots
```

### Best Practices

1. **Never risk more than 2% per trade**
2. **Use stop loss on every trade**
3. **Maximum 3-5 positions open simultaneously**
4. **Daily loss limit: 5-6% of account**
5. **Trading hours: London/NY sessions for major pairs**

---

## 🔧 Troubleshooting

### Connection Issues

**Problem**: "Failed to connect to cTrader"

**Solutions**:
1. Check host and port are correct
2. Verify firewall allows outbound connections
3. Test with SSL disabled temporarily
4. Check if FIX API is enabled for your account

**Test connection**:
```bash
# Test SSL connection
openssl s_client -connect demo-uk-eqx-01.p.c-trader.com:5212

# Test plain connection
telnet demo-uk-eqx-01.p.c-trader.com 5202
```

### Authentication Issues

**Problem**: "Logon rejected"

**Solutions**:
1. Verify SenderCompID format (demo.broker.account)
2. Check password is correct
3. Ensure account has FIX API access
4. Check account is active and funded

### Order Rejection

**Problem**: Orders are rejected

**Reasons**:
- Insufficient margin
- Invalid symbol format (use "EURUSD" not "EUR/USD")
- Position size too small/large
- Market closed
- Account restrictions

**Check order status**:
```javascript
// In execution report handler
console.log('Order status:', report.ordStatus);
// 0 = New
// 1 = Partially filled
// 2 = Filled
// 4 = Canceled
// 8 = Rejected
```

---

## 📈 Testing Strategy

### Phase 1: Demo Account (1-2 weeks)

```env
CTRADER_HOST=demo-uk-eqx-01.p.c-trader.com
CTRADER_SENDER_COMP_ID=demo.icmarkets.XXXXX
DEFAULT_POSITION_SIZE=0.01
MAX_DAILY_TRADES=5
```

**Goals**:
- Verify connection stability
- Test order execution
- Monitor win rate
- Check risk management

### Phase 2: Small Live (2-4 weeks)

```env
CTRADER_HOST=live-uk-eqx-01.p.c-trader.com
CTRADER_SENDER_COMP_ID=live.icmarkets.XXXXX
DEFAULT_POSITION_SIZE=0.01
MAX_DAILY_TRADES=10
```

**Goals**:
- Validate with real money
- Monitor slippage
- Test in live conditions
- Build confidence

### Phase 3: Full Deployment

```env
DEFAULT_POSITION_SIZE=0.05
MAX_DAILY_TRADES=20
```

---

## 🔐 Security

### API Credentials

1. **Never share** FIX credentials
2. **Use different passwords** for trading and platform login
3. **Enable 2FA** on broker account
4. **Monitor** account regularly
5. **Set alerts** for unusual activity

### Server Security

1. **Use VPS** for 24/7 operation
2. **Enable firewall**
3. **Whitelist IPs** if broker supports
4. **Encrypt** .env file
5. **Regular backups**

---

## 📚 Additional Resources

### cTrader Documentation
- FIX API: https://help.ctrader.com/fix-api/
- Open API: https://help.ctrader.com/open-api/

### Broker Support
- IC Markets: https://www.icmarkets.com/support/
- Pepperstone: https://pepperstone.com/support/

### Forex Trading
- BabyPips School: https://www.babypips.com/learn/forex
- ForexFactory Calendar: https://www.forexfactory.com/calendar

---

## ⚠️ Important Disclaimers

1. **Demo ≠ Live**: Slippage and execution differ
2. **Past performance**: No guarantee of future results
3. **Market risk**: Forex trading is high risk
4. **Leverage**: Can amplify losses
5. **24/5 market**: Bot runs continuously
6. **News events**: Can cause high volatility
7. **Broker terms**: Follow broker's API usage terms

---

## 🆘 Getting Help

1. Check logs: `logs/trading-bot.log`
2. Test FIX connection manually
3. Contact broker support for API issues
4. Review FIX message logs
5. Start with smallest position size

---

**Ready to trade forex with your AI-powered bot! 📊🤖**

Remember: Always start with demo, test thoroughly, and never risk more than you can afford to lose.
