# n8n.io Cloud Setup Guide

Complete guide to deploying your trading bot with n8n.io cloud platform.

## 🌐 What is n8n.io Cloud?

n8n.io Cloud is a hosted version of n8n that runs in the cloud. No server management needed - just create workflows and they run automatically.

**Benefits:**
- ✅ No server setup required
- ✅ 24/7 uptime
- ✅ Automatic scaling
- ✅ Built-in monitoring
- ✅ Secure webhooks with HTTPS
- ✅ Easy collaboration

## 🚀 Quick Setup

### Step 1: Create n8n.io Cloud Account

1. Go to: **https://n8n.io/cloud**
2. Click **"Start Free"**
3. Sign up with email
4. Verify your email
5. Create your workspace

### Step 2: Deploy Your Bot

Your bot needs to be accessible from the internet for n8n cloud to connect.

**Option A: Deploy on a VPS**
```bash
# On your VPS (DigitalOcean, AWS, etc.)
git clone https://github.com/your-repo/claude-code.git
cd claude-code/ccttb-trading-bot
npm install
npm start
```

**Option B: Use Cloud Run / Heroku**
```bash
# Deploy to cloud platform
# See deployment guides below
```

**Option C: Use ngrok for Testing**
```bash
# Install ngrok
npm install -g ngrok

# Start your bot locally
npm start

# In another terminal, create tunnel
ngrok http 3000

# Use the https URL in n8n workflows
```

### Step 3: Configure Environment Variables in n8n Cloud

In n8n.io cloud:
1. Go to **Settings** → **Variables**
2. Add these variables:

```
BOT_URL=https://your-bot-url.com
BOT_API_KEY=your_api_key_here
SHEET_ID=your_google_sheet_id (optional)
```

### Step 4: Import Workflows

1. In n8n cloud, click **"Workflows"**
2. Click **"Import from File"**
3. Upload: `workflows/n8n-cloud-multi-agent-workflow.json`
4. Click **"Import"**

### Step 5: Configure Credentials

**HTTP Header Auth (for Bot API):**
1. Go to **Credentials**
2. Click **"Add Credential"**
3. Select **"HTTP Header Auth"**
4. Name: "Trading Bot API"
5. Header Name: `X-Api-Key`
6. Header Value: (your N8N_API_KEY from .env)
7. Save

**Google Sheets (Optional):**
1. Add **"Google Sheets"** credential
2. Follow OAuth flow
3. Select spreadsheet for logging

**Discord (Optional):**
1. Create Discord webhook in your server
2. Add **"Discord"** credential
3. Paste webhook URL

### Step 6: Activate Workflows

1. Open the imported workflow
2. Click **"Active"** toggle (top right)
3. Workflow is now running!

---

## 📊 Accessing Your Dashboard

### Deploy Dashboard to Cloud

**Option 1: Vercel (Free)**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy dashboard
cd ccttb-trading-bot
vercel --prod

# Follow prompts, deploy public/ folder
```

**Option 2: Netlify**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd ccttb-trading-bot
netlify deploy --prod --dir=public
```

**Option 3: GitHub Pages**
1. Push `public/` folder to GitHub
2. Enable GitHub Pages in settings
3. Select main branch, /public folder

### Access Dashboard

```
https://your-dashboard-url.com
```

Dashboard will connect to your bot via WebSocket automatically.

---

## 🔄 n8n.io Cloud Workflows

### Workflow 1: Multi-Agent Performance Monitoring

**What it does:**
- Checks bot status every 15 minutes
- Analyzes AI agent decisions
- Logs performance to Google Sheets
- Sends alerts if performance drops

**Setup:**
1. Import workflow
2. Configure credentials
3. Set BOT_URL environment variable
4. Activate

### Workflow 2: External Signal Processing

**What it does:**
- Receives signals from external sources (TradingView, etc.)
- Processes and validates signals
- Forwards to bot for AI analysis
- Responds with execution status

**Webhook URL:**
```
https://your-workspace.app.n8n.cloud/webhook/ai-signal
```

**Send signals:**
```bash
curl -X POST https://your-workspace.app.n8n.cloud/webhook/ai-signal \
  -H "Content-Type: application/json" \
  -d '{
    "type": "BUY",
    "pair": "EURUSD",
    "price": 1.0850,
    "confidence": 0.85,
    "indicators": {
      "rsi": 35,
      "macd": 0.002
    }
  }'
```

### Workflow 3: TradingView Integration

**TradingView Alert Message:**
```json
{
  "type": "{{strategy.order.action}}",
  "pair": "{{ticker}}",
  "price": {{close}},
  "confidence": 0.9,
  "source": "TradingView",
  "indicators": {
    "rsi": {{rsi}},
    "volume": {{volume}}
  }
}
```

**Alert URL:**
```
https://your-workspace.app.n8n.cloud/webhook/ai-signal
```

---

## 🌍 Deploying Bot to Cloud

### Option 1: DigitalOcean App Platform

1. **Create account** at digitalocean.com
2. **Click** "Create" → "Apps"
3. **Connect** GitHub repository
4. **Select** branch: `claude/ai-bot-n8n-workflow-01F4LieA8uCDZyZBVLFhVs4U`
5. **Set** build command: `npm install`
6. **Set** run command: `npm start`
7. **Add** environment variables from .env
8. **Deploy**

**Cost:** ~$5-10/month

### Option 2: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
cd ccttb-trading-bot
heroku create your-trading-bot

# Set environment variables
heroku config:set EXCHANGE_NAME=ctrader
heroku config:set CTRADER_SENDER_COMP_ID=your_id
# ... set all .env variables

# Deploy
git push heroku claude/ai-bot-n8n-workflow-01F4LieA8uCDZyZBVLFhVs4U:main

# View logs
heroku logs --tail
```

**Cost:** ~$7/month

### Option 3: Railway

1. Go to: **railway.app**
2. Click **"New Project"**
3. Select **"Deploy from GitHub"**
4. Choose your repository
5. Add environment variables
6. Deploy

**Cost:** Free tier available

### Option 4: Render

1. Go to: **render.com**
2. Click **"New Web Service"**
3. Connect GitHub
4. Select repository and branch
5. Build Command: `npm install`
6. Start Command: `npm start`
7. Add environment variables
8. Deploy

**Cost:** Free tier available

---

## 🔐 Security Best Practices

### 1. Secure Your Bot API

```env
# Use strong API key
N8N_API_KEY=$(openssl rand -hex 32)
```

### 2. Use HTTPS Only

- Always deploy with HTTPS
- n8n cloud provides HTTPS webhooks automatically
- Use SSL for bot connection

### 3. IP Whitelisting (Optional)

```javascript
// In n8n-integration.js
const allowedIPs = ['n8n-cloud-ip-range'];

app.use((req, res, next) => {
  const clientIP = req.ip;
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});
```

### 4. Environment Variables

- Never commit .env files
- Use platform environment variables
- Rotate keys regularly

---

## 📱 Mobile Access

### n8n Mobile App

1. Download n8n app (iOS/Android)
2. Login with your cloud account
3. Monitor workflows on the go
4. Trigger manual executions
5. View execution history

### Dashboard Mobile View

The dashboard is responsive and works on mobile:
```
https://your-dashboard-url.com
```

---

## 📊 Monitoring & Alerts

### Google Sheets Logging

**Setup:**
1. Create Google Sheet
2. Add columns: Timestamp, Status, Win Rate, Net Profit, Total Trades, Open Positions
3. Get Sheet ID from URL
4. Add to n8n environment variables
5. Activate logging workflow

**Result:** Automatic performance logging every 15 minutes

### Discord Alerts

**Setup:**
1. Create Discord server
2. Create webhook in channel settings
3. Add webhook URL to n8n credentials
4. Activate alert workflow

**Alerts sent for:**
- Critical performance issues
- Large losses
- System errors
- Trading milestones

### Email Notifications

**Add to workflow:**
1. Add "Send Email" node
2. Configure SMTP or use Gmail
3. Set alert conditions
4. Activate

---

## 🎯 Advanced Workflows

### Workflow: AI Agent Coordination

```javascript
// Custom n8n function node
const agents = [
  'Market Strategist',
  'Risk Manager',
  'Technical Analyst',
  'Sentiment Analyst'
];

// Coordinate multiple AI agents
const decisions = [];

for (const agent of agents) {
  const response = await fetch(`${process.env.BOT_URL}/api/ai/${agent}/analyze`, {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.BOT_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      marketData: $json.marketData
    })
  });

  const decision = await response.json();
  decisions.push(decision);
}

// Supervisor makes final decision
const finalDecision = await fetch(`${process.env.BOT_URL}/api/ai/supervisor/decide`, {
  method: 'POST',
  headers: {
    'X-Api-Key': process.env.BOT_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    agentDecisions: decisions
  })
});

return { json: await finalDecision.json() };
```

### Workflow: Portfolio Rebalancing

```javascript
// Check portfolio allocation every day
// Rebalance if drift > 5%

const portfolio = await fetch(`${process.env.BOT_URL}/api/portfolio`);
const data = await portfolio.json();

const allocation = data.allocation;
const target = {
  'EURUSD': 0.40,
  'GBPUSD': 0.30,
  'XAUUSD': 0.30
};

const rebalanceNeeded = Object.keys(target).some(pair => {
  const current = allocation[pair] || 0;
  const diff = Math.abs(current - target[pair]);
  return diff > 0.05; // 5% threshold
});

if (rebalanceNeeded) {
  // Execute rebalancing trades
  await fetch(`${process.env.BOT_URL}/api/rebalance`, {
    method: 'POST',
    headers: {
      'X-Api-Key': process.env.BOT_API_KEY
    },
    body: JSON.stringify({ target })
  });
}
```

---

## 🆘 Troubleshooting

### Workflow Not Triggering

**Check:**
1. Workflow is activated (toggle on)
2. Credentials are configured
3. BOT_URL is accessible from internet
4. API key is correct

**Test:**
```bash
curl -X GET https://your-bot-url.com/health
```

### Webhook Not Receiving Data

**Check:**
1. Webhook URL is correct
2. Workflow is activated
3. Sending correct JSON format
4. Content-Type header is set

**Test:**
```bash
curl -X POST https://your-workspace.app.n8n.cloud/webhook-test/ai-signal \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Bot Not Responding

**Check:**
1. Bot is running
2. Internet connection
3. Firewall not blocking
4. API key authentication

**View Logs:**
```bash
# On your server
tail -f logs/trading-bot.log
```

---

## 💡 Tips & Best Practices

1. **Start Simple** - Begin with basic monitoring workflow
2. **Test Webhooks** - Use n8n's webhook tester
3. **Monitor Executions** - Check execution history regularly
4. **Set Alerts** - Configure alerts for critical events
5. **Backup Workflows** - Export workflows regularly
6. **Use Environment Variables** - Never hardcode credentials
7. **Version Control** - Keep workflow versions
8. **Document Changes** - Add notes to workflows

---

## 📚 Resources

- **n8n Documentation**: https://docs.n8n.io/
- **n8n Community**: https://community.n8n.io/
- **n8n Examples**: https://n8n.io/workflows/
- **Bot API Reference**: `docs/API_REFERENCE.md`

---

**Your bot is now running 24/7 in the cloud with full n8n.io integration! 🚀**
