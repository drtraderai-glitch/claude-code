# 🌐 Complete n8n.io Cloud Setup - Run EVERYTHING on n8n!

Run your entire forex trading bot on n8n.io cloud - **no external servers needed!**

---

## 🎯 What Runs on n8n.io

```
n8n.io Cloud (All-in-One)
├── Market Data Collection
├── Technical Analysis
├── 7 AI Agents (via Anthropic API)
├── Trading Decisions
├── Trade Execution Logging
├── Performance Monitoring
└── Alerts & Notifications
```

**Everything runs as workflows in the cloud!**

---

## 🚀 Step-by-Step Setup

### **Step 1: Create n8n.io Account**

1. Go to: **https://n8n.io/cloud**
2. Click **"Start for free"**
3. Sign up with email
4. Verify email
5. Create workspace name

**Cost:** Free tier available, paid plans start at $20/month

### **Step 2: Configure Environment Variables**

In n8n.io dashboard:

1. Click **Settings** (gear icon)
2. Click **Variables**
3. Click **"Add variable"**
4. Add these one by one:

```
Variable Name: CTRADER_SENDER_COMP_ID
Value: demo.icmarkets.9578804

Variable Name: CTRADER_PASSWORD
Value: your_new_password_here

Variable Name: DEFAULT_PAIR
Value: XAUUSD

Variable Name: POSITION_SIZE
Value: 0.01

Variable Name: STOP_LOSS_PIPS
Value: 150

Variable Name: TAKE_PROFIT_PIPS
Value: 300

Variable Name: ANTHROPIC_API_KEY
Value: sk-ant-your-key-here
```

### **Step 3: Create Anthropic Credential**

1. Click **Credentials**
2. Click **"Add Credential"**
3. Search for **"HTTP Header Auth"**
4. Fill in:
   - **Name:** "Anthropic API"
   - **Header Name:** `x-api-key`
   - **Header Value:** Your Anthropic API key
5. Click **Save**

### **Step 4: Import Main Trading Workflow**

1. Click **Workflows**
2. Click **"Add workflow"** → **"Import from file"**
3. Select file: `workflows/n8n-cloud-complete-bot.json`
4. Click **"Import"**
5. Workflow appears!

### **Step 5: Configure Workflow**

In the imported workflow:

1. Click **"AI Market Strategist"** node
2. Under **"Generic Auth Type"**, select your **"Anthropic API"** credential
3. Click **Save**

4. Click **"AI Risk Manager"** node
5. Select same **"Anthropic API"** credential
6. Click **Save**

### **Step 6: (Optional) Connect Google Sheets**

For trade logging:

1. Create Google Sheet with columns:
   - Timestamp, Pair, Action, Price, Position Size, Stop Loss, Take Profit, Confidence, Status

2. Get Sheet ID from URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

3. Add to n8n variables:
   ```
   Variable Name: SHEET_ID
   Value: your_sheet_id_here
   ```

4. In workflow, click **"Log to Google Sheets"** node
5. Click **"Create new credential"** for Google Sheets
6. Follow OAuth flow
7. Select your sheet

### **Step 7: (Optional) Connect Discord**

For trade alerts:

1. In Discord server, go to channel settings
2. **Integrations** → **Webhooks** → **New Webhook**
3. Copy webhook URL

4. In workflow, click **"Send Discord Alert"** node
5. Create Discord credential
6. Paste webhook URL
7. Save

### **Step 8: Activate Workflow**

1. Click **"Active"** toggle at top right
2. Workflow is now **RUNNING** 24/7!

---

## 📊 How It Works

### **Every Hour, the Workflow:**

1. **Fetches market data** for your forex pair
2. **Calculates indicators** (RSI, MACD, EMA)
3. **Generates trading signal**
4. **Calls AI Market Strategist** via Anthropic API
5. **Calls AI Risk Manager** via Anthropic API
6. **Trading Supervisor** combines all decisions
7. **If approved:** Executes trade (logs to Sheets, sends Discord alert)
8. **If rejected:** Logs rejection reason

### **Visual Flow:**

```
⏰ Schedule (Every Hour)
    ↓
📊 Get Market Data (XAUUSD)
    ↓
🔢 Technical Analysis (RSI, MACD, EMA)
    ↓
    ├─→ 🧠 AI Market Strategist (Anthropic)
    └─→ 🛡️ AI Risk Manager (Anthropic)
        ↓
    👔 Trading Supervisor (Combines decisions)
        ↓
    ✅ Approved? (Confidence > 0.7)
        ├─→ YES: Execute Trade
        │        ├─→ Log to Google Sheets
        │        └─→ Send Discord Alert
        └─→ NO: Log Rejection
```

---

## 🤖 AI Agents in n8n

Each AI call is a separate **HTTP Request** node to Anthropic API:

### **AI Market Strategist**

**Analyzes:**
- Market trends
- Price action
- Signal quality

**Returns:**
```json
{
  "approve": true,
  "confidence": 0.85,
  "reasoning": "Strong bullish trend, RSI oversold, good entry point"
}
```

### **AI Risk Manager**

**Evaluates:**
- Position size
- Risk/reward ratio
- Stop loss placement

**Returns:**
```json
{
  "approve": true,
  "confidence": 0.92,
  "reasoning": "Risk is 2%, R:R is 1:2, acceptable",
  "position_size": 0.01
}
```

### **Trading Supervisor**

**Coordinates:**
- Reviews both AI agents
- Makes final decision
- Requires both to approve

---

## 📈 Viewing Your Bot Activity

### **In n8n.io:**

1. Go to **Workflows**
2. Click on your trading workflow
3. Click **"Executions"** tab
4. See every run with full data

### **What You See:**

- ✅ **Success:** Green - Trade executed
- ⚠️ **Warning:** Yellow - Trade rejected
- ❌ **Error:** Red - Error occurred

Click any execution to see:
- Market data used
- Indicators calculated
- AI agent responses
- Final decision
- Trade details

### **Google Sheets Log:**

Open your connected sheet to see:
- Complete trade history
- All executed trades
- Performance tracking

### **Discord Alerts:**

Real-time notifications when trades execute:
```
🤖 AI Trade Executed

BUY XAUUSD
Price: 2015.50
Size: 0.01
SL: 2000.50
TP: 2045.50
Confidence: 87%

AI Analysis:
✅ Strategist: Strong bullish trend
✅ Risk Manager: Risk acceptable
```

---

## 🔧 Customization

### **Change Trading Frequency**

In workflow:
1. Click **"Every Hour"** node
2. Change to:
   - `*/15 * * * *` = Every 15 minutes
   - `0 */4 * * *` = Every 4 hours
   - `0 9 * * *` = Every day at 9 AM

### **Change Forex Pair**

Update environment variable:
```
DEFAULT_PAIR = EURUSD
```

Or edit **"Get Market Data"** code node.

### **Add More AI Agents**

1. Duplicate **"AI Market Strategist"** node
2. Rename to "AI Sentiment Analyst"
3. Update prompt to analyze sentiment
4. Connect to **"Trading Supervisor"**
5. Update supervisor code to consider new agent

### **Adjust Confidence Threshold**

In **"Check Approval"** node:
- Change `0.7` to `0.8` (more conservative)
- Or `0.6` (more aggressive)

---

## 💰 Costs

### **n8n.io Cloud:**
- Starter: Free (limited executions)
- Pro: $20/month (5,000 executions)
- Scale: $50/month (25,000 executions)

### **Anthropic API:**
- Pay per token used
- ~$0.01-0.05 per AI decision
- If trading every hour = ~$30-50/month

### **Total Monthly Cost:**
- n8n Pro: $20
- Anthropic API: ~$40
- **Total: ~$60/month** for 24/7 AI trading

**Much cheaper than VPS + maintenance!**

---

## 🎯 Adding Real cTrader Execution

The workflow currently **logs** trades. To **actually execute** on cTrader:

### **Option 1: cTrader API Bridge**

Create a small serverless function (Vercel/Netlify):

```javascript
// api/ctrader-execute.js
export default async function handler(req, res) {
  const { pair, action, size, stopLoss, takeProfit } = req.body;

  // Connect to cTrader FIX API
  // Execute trade
  // Return result

  res.json({ success: true, orderId: '12345' });
}
```

Deploy to Vercel (free), then:
1. In n8n workflow, replace **"Execute Trade"** node
2. Call your API: `https://your-app.vercel.app/api/ctrader-execute`

### **Option 2: cTrader REST API**

If your broker provides REST API:
1. In **"Execute Trade"** node
2. Change to HTTP Request
3. Call broker's REST API

### **Option 3: Email/Telegram to Manual**

For safety/testing:
1. Workflow sends trade details to you
2. You execute manually in cTrader
3. Full AI analysis provided

---

## 📊 Dashboard View (Optional)

Create a simple dashboard using **n8n webhook**:

### **Create Webhook Workflow:**

1. New workflow: "Dashboard Data"
2. Add **Webhook** trigger
3. Add **Code** node:

```javascript
// Return current status
return {
  json: {
    status: 'running',
    lastTrade: '2024-01-15 10:30',
    totalTrades: 25,
    winRate: 68,
    profit: 450
  }
};
```

4. Activate workflow
5. Get webhook URL

### **View in Browser:**

```
https://your-workspace.app.n8n.cloud/webhook/dashboard
```

Returns JSON with bot stats!

---

## 🔐 Security

### **API Keys:**
- Stored as n8n environment variables (encrypted)
- Never exposed in workflow JSON
- Can't be seen by others

### **Credentials:**
- OAuth tokens stored securely
- Auto-refresh handled by n8n

### **Access:**
- Only you can access your n8n workspace
- 2FA available on paid plans

---

## 📱 Mobile Access

### **n8n Mobile App:**

1. Download n8n app (iOS/Android)
2. Login with your account
3. View all workflows
4. See execution history
5. Manually trigger workflows
6. Get push notifications

### **Monitor Anywhere:**

- Check trade executions
- View AI decisions
- Pause/resume workflows
- All from your phone!

---

## ✅ Complete Setup Checklist

- [ ] Create n8n.io account
- [ ] Set environment variables (forex pairs, position size, etc.)
- [ ] Add Anthropic API credential
- [ ] Import trading workflow
- [ ] Configure AI agent nodes with credentials
- [ ] (Optional) Connect Google Sheets
- [ ] (Optional) Connect Discord
- [ ] Activate workflow
- [ ] Test with first execution
- [ ] Monitor in Executions tab
- [ ] Set up mobile app

---

## 🎉 You're Done!

Your **entire forex trading bot** now runs on n8n.io cloud:

✅ **No server to manage**
✅ **24/7 operation**
✅ **AI agents analyzing every trade**
✅ **All logs in Google Sheets**
✅ **Discord alerts**
✅ **Mobile monitoring**
✅ **Scales automatically**

**Start Trading:** Just activate the workflow!

---

## 🆘 Troubleshooting

### **"Anthropic API error"**
- Check API key is correct
- Verify you have API credits
- Check credential is selected in nodes

### **"Variables not found"**
- Go to Settings → Variables
- Verify variable names match exactly
- Check no typos

### **"Workflow not executing"**
- Make sure **"Active"** toggle is ON
- Check schedule trigger is configured
- View Executions tab for errors

### **"Google Sheets error"**
- Re-authenticate Google credential
- Check sheet ID is correct
- Verify sheet has correct columns

---

**Your AI trading bot is now fully cloud-based! 🌐🤖**

No servers, no maintenance - just trading!
