# cTrader Quick Start - 5 Minutes Setup

Get your forex trading bot running with cTrader in 5 minutes!

## ⚠️ SECURITY FIRST!

**You shared your credentials publicly! Do this NOW:**
1. Go to IC Markets portal
2. Change your account password
3. Request new FIX API credentials
4. Never share credentials again

---

## 🚀 Quick Setup

### Step 1: Install Node.js (2 min)

**Download**: https://nodejs.org/
**Version**: 18.x or higher
**Install**: Run installer with default settings

**Verify**:
```bash
node --version
npm --version
```

### Step 2: Get Bot Files (1 min)

```bash
# Navigate to where you saved the bot
cd path/to/ccttb-trading-bot

# Or download from GitHub:
git clone https://github.com/drtraderai-glitch/claude-code.git
cd claude-code/ccttb-trading-bot
```

### Step 3: Install Dependencies (1 min)

```bash
npm install
```

### Step 4: Configure for cTrader (1 min)

```bash
# Copy cTrader config
copy .env.ctrader.example .env

# Edit with Notepad
notepad .env
```

**Update these lines with YOUR credentials:**

```env
EXCHANGE_NAME=ctrader

# ⚠️ UPDATE WITH YOUR NEW CREDENTIALS (not the old ones!)
CTRADER_SENDER_COMP_ID=demo.icmarkets.9578804
CTRADER_PASSWORD=YOUR_NEW_PASSWORD

# Trading settings
DEFAULT_TRADING_PAIR=EURUSD
DEFAULT_POSITION_SIZE=0.01
STOP_LOSS_PIPS=20
TAKE_PROFIT_PIPS=40

# Optional: Add AI
ANTHROPIC_API_KEY=your_key_here
AI_ENABLED=true
```

### Step 5: Start Trading! (< 1 min)

```bash
npm start
```

---

## ✅ Expected Output

```
🚀 Starting CCTTB Trading Bot...
✅ Configuration loaded
Connecting to cTrader via FIX protocol...
TCP connection established
Logon message sent
Logon acknowledgment received
✅ cTrader adapter initialized
✅ Trading Bot initialized
🎯 Trading Bot is now running!
```

---

## 🎯 What Happens Now?

1. **Bot connects** to IC Markets via FIX API
2. **Monitors** EURUSD (or your chosen pair)
3. **Analyzes** market using hybrid strategy
4. **AI validates** signals (if enabled)
5. **Executes trades** automatically
6. **Manages risk** with stop loss/take profit

---

## 🛑 Stop the Bot

Press `Ctrl+C` in terminal

---

## 📊 Available Forex Pairs

```
Major Pairs:
- EURUSD (Euro/US Dollar)
- GBPUSD (British Pound/US Dollar)
- USDJPY (US Dollar/Japanese Yen)
- USDCHF (US Dollar/Swiss Franc)

Cross Pairs:
- EURGBP (Euro/British Pound)
- EURJPY (Euro/Japanese Yen)
- GBPJPY (British Pound/Japanese Yen)

Commodities:
- XAUUSD (Gold)
- XAGUSD (Silver)

Indices:
- US30 (Dow Jones)
- US100 (Nasdaq)
- US500 (S&P 500)
```

Change pair in `.env`:
```env
DEFAULT_TRADING_PAIR=GBPUSD
```

---

## ⚙️ Quick Settings

### Conservative (Safe)
```env
DEFAULT_POSITION_SIZE=0.01
STOP_LOSS_PIPS=30
TAKE_PROFIT_PIPS=60
MAX_DAILY_TRADES=5
MAX_DAILY_LOSS=50
```

### Moderate (Balanced)
```env
DEFAULT_POSITION_SIZE=0.05
STOP_LOSS_PIPS=20
TAKE_PROFIT_PIPS=40
MAX_DAILY_TRADES=10
MAX_DAILY_LOSS=100
```

### Aggressive (Risky)
```env
DEFAULT_POSITION_SIZE=0.1
STOP_LOSS_PIPS=15
TAKE_PROFIT_PIPS=30
MAX_DAILY_TRADES=20
MAX_DAILY_LOSS=200
```

**Recommendation**: Start with Conservative!

---

## 🔧 Common Issues

### "Connection refused"
- Check credentials are correct
- Verify FIX API is enabled
- Try port 5202 (plain) instead of 5212 (SSL)

### "Logon rejected"
- Wrong password
- Incorrect SenderCompID format
- Account not authorized for FIX API

### "Orders rejected"
- Insufficient balance
- Symbol format wrong (use EURUSD not EUR/USD)
- Position size too small (minimum 0.01)

### "No signals generated"
- Normal! Market may not have opportunities
- Wait 1-2 hours
- Try different timeframe or pair

---

## 📈 Monitoring

### Check Status
```bash
# In another terminal
curl http://localhost:3000/api/status
```

### View Logs
```bash
# Watch live
tail -f logs/trading-bot.log

# View recent
type logs\trading-bot.log
```

---

## 🎓 Next Steps

1. ✅ **Monitor for 24 hours** - Watch how it trades
2. ✅ **Review performance** - Check win rate
3. ✅ **Adjust settings** - Fine-tune parameters
4. ✅ **Read full docs** - `docs/CTRADER_SETUP.md`
5. ✅ **Set up n8n** - Automate workflows
6. ✅ **Add notifications** - Get trade alerts

---

## 📱 Get Trade Alerts

Add to `.env`:
```env
# Discord
DISCORD_WEBHOOK_URL=your_webhook_url

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

You'll get notified of:
- New trades
- Closed positions
- Daily performance
- Risk alerts

---

## 🆘 Need Help?

1. **Check logs**: `logs/trading-bot.log`
2. **Read setup guide**: `docs/CTRADER_SETUP.md`
3. **Test connection**: Contact IC Markets support
4. **Verify credentials**: Make sure they're correct

---

## ⚠️ IMPORTANT REMINDERS

1. ✅ **Demo account** - Start here, test for 1-2 weeks
2. ✅ **Small positions** - Use 0.01 lots initially
3. ✅ **Monitor regularly** - Check daily
4. ✅ **Understand risks** - Forex is high risk
5. ✅ **Never over-leverage** - Risk max 2% per trade
6. ✅ **News events** - Bot may struggle with high volatility
7. ✅ **Keep learning** - Improve strategies over time

---

## 💡 Pro Tips

- **Best trading hours**: London/NY overlap (8am-12pm EST)
- **Avoid news**: Disable bot 30min before major news
- **Start small**: Increase size gradually as confidence grows
- **Track performance**: Keep a trading journal
- **Backtest first**: Test strategies before live trading

---

**You're ready to trade! 🚀**

Your AI-powered forex trading bot is now running. May the pips be with you! 📈

---

**Questions?** Read the full documentation:
- `docs/CTRADER_SETUP.md` - Complete setup guide
- `README.md` - Bot features and usage
- `docs/API_REFERENCE.md` - API documentation
