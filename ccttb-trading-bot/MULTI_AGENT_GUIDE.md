# 🤖 Multi-Agent AI Trading System - Complete Guide

Your bot now has **7 AI agents** that work together like a professional trading team!

## 🎯 What's New

### 1. **Multi-Agent AI System**
Each component is now an independent AI agent that reasons and makes decisions:

- 🧠 **Market Strategist** - Analyzes trends and recommends strategies
- 🛡️ **Risk Manager** - Evaluates risks and protects capital
- 📊 **Technical Analyst** - Reads charts and indicators
- 💭 **Sentiment Analyst** - Gauges market psychology
- 💼 **Portfolio Manager** - Optimizes allocation and performance
- ⚡ **Execution Manager** - Plans optimal trade execution
- 👔 **Trading Supervisor** - Coordinates all agents and makes final decisions

### 2. **Real-Time Dashboard**
Professional charting interface showing everything:

- 📈 Live price charts with TradingView-style interface
- 🎯 Real-time trade execution visualization
- 🤖 AI agent decision stream
- 📊 Performance metrics and P&L
- 📍 Open positions with entry/exit points
- 📋 Activity log and signals

### 3. **n8n.io Cloud Integration**
Run workflows in the cloud 24/7:

- ☁️ No server management needed
- 🔄 Automatic performance monitoring
- 📱 Mobile app access
- 🔔 Smart alerts and notifications
- 📊 Google Sheets logging

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd ccttb-trading-bot
npm install
```

### 2. Configure Multi-Agent System
Add to `.env`:
```env
# AI Multi-Agent System
ANTHROPIC_API_KEY=sk-ant-your-key-here
AI_ENABLED=true
AI_MODEL=claude-sonnet-4-5-20250929
MULTI_AGENT_ENABLED=true

# Dashboard
DASHBOARD_PORT=8080
DASHBOARD_ENABLED=true

# n8n Integration
N8N_ENABLED=true
N8N_SERVER_PORT=3000
```

### 3. Start Everything
```bash
# Start bot with multi-agent system
npm start

# In another terminal, start dashboard
npm run dashboard

# In another terminal, start n8n server
npm run n8n-server
```

### 4. Access Dashboard
```
http://localhost:8080
```

---

## 🤖 How AI Agents Work

### The Team Structure

```
📊 Market Data
    ↓
🎯 Signal Generated
    ↓
┌─────────────────────────────────────┐
│     MULTI-AGENT EVALUATION          │
│                                     │
│  🧠 Market Strategist               │
│  → "Trend is bullish, good setup"  │
│                                     │
│  📊 Technical Analyst               │
│  → "RSI oversold, MACD positive"   │
│                                     │
│  💭 Sentiment Analyst               │
│  → "Market sentiment improving"    │
│                                     │
│  🛡️ Risk Manager                    │
│  → "Risk/reward ratio acceptable"  │
│                                     │
│  💼 Portfolio Manager               │
│  → "Allocation allows new position"│
│                                     │
│  ⚡ Execution Manager                │
│  → "Use limit order, low slippage" │
│                                     │
└─────────────────────────────────────┘
    ↓
👔 Trading Supervisor
   → Makes final decision
   → Coordinates execution
    ↓
✅ Trade Executed (or rejected)
```

### Agent Interactions

**Example Decision Flow:**

1. **Signal Generated**: BUY EURUSD @ 1.0850

2. **Technical Analyst**:
   ```
   "RSI is 35 (oversold), MACD histogram positive.
   Support at 1.0800, resistance at 1.0900.
   Recommendation: APPROVE
   Confidence: 0.85"
   ```

3. **Risk Manager**:
   ```
   "Position size: 0.05 lots
   Risk: 2% of account
   Stop loss: 1.0820
   Risk/reward: 1:2.5
   Recommendation: APPROVE
   Confidence: 0.90"
   ```

4. **Market Strategist**:
   ```
   "EUR showing strength vs USD.
   Trend aligned with higher timeframes.
   Market structure supports long.
   Recommendation: APPROVE
   Confidence: 0.80"
   ```

5. **Sentiment Analyst**:
   ```
   "Recent news positive for EUR.
   Social sentiment improving.
   No major events in next 24h.
   Recommendation: APPROVE
   Confidence: 0.75"
   ```

6. **Trading Supervisor**:
   ```
   "All agents approve with high confidence.
   No conflicts detected.
   Final Decision: EXECUTE
   Action: Place BUY order with stop loss and take profit"
   ```

---

## 📊 Dashboard Features

### Live Chart

- **TradingView-style** candlestick charts
- Multiple timeframes (1m, 5m, 15m, 1h, 4h, 1d)
- All forex pairs and crypto
- Trade markers showing entry/exit
- Indicator overlays

### AI Decision Stream

See every AI agent's thoughts in real-time:

```
🤖 Market Strategist
"Bullish trend confirmed on 4h chart.
Strong momentum building..."
Confidence: 85%

🛡️ Risk Manager
"Position size calculated at 0.05 lots.
Stop loss placement optimal..."
Confidence: 92%

👔 Trading Supervisor
"Final decision: EXECUTE BUY order"
Confidence: 88%
```

### Performance Metrics

- Total P&L (real-time)
- Win rate percentage
- Total trades executed
- Open positions count
- Agent activity status

### Real-Time Updates

- WebSocket connection for instant updates
- No page refresh needed
- Sub-second latency
- Mobile responsive

---

## ☁️ n8n.io Cloud Setup

### 1. Deploy Bot to Cloud

**Easiest: Railway.app**
```bash
# 1. Go to railway.app
# 2. Connect GitHub
# 3. Deploy branch: claude/ai-bot-n8n-workflow-01F4LieA8uCDZyZBVLFhVs4U
# 4. Add environment variables
# 5. Get public URL
```

### 2. Create n8n.io Account

1. Go to: **https://n8n.io/cloud**
2. Start free trial
3. Create workspace

### 3. Import Workflows

1. Download workflow: `workflows/n8n-cloud-multi-agent-workflow.json`
2. In n8n cloud: **Workflows** → **Import**
3. Upload file
4. Configure credentials

### 4. Set Environment Variables

In n8n cloud settings:
```
BOT_URL=https://your-bot-url.railway.app
BOT_API_KEY=your_api_key_from_env
```

### 5. Activate Workflow

Toggle workflow to **Active** - it now runs 24/7!

---

## 🎨 Customizing AI Agents

### Modify Agent Behavior

Edit `src/ai-agent/multi-agent-orchestrator.js`:

```javascript
const roles = {
  strategist: {
    role: 'Market Strategist',
    expertise: 'Your custom expertise description...',
    responsibilities: [
      'Your custom responsibility 1',
      'Your custom responsibility 2',
    ],
  },
  // ... other agents
};
```

### Add New Agent

```javascript
// In multi-agent-orchestrator.js
this.agents = {
  // ... existing agents
  newsAnalyst: new AIAgent('News Analyst', this.anthropic, this.model),
};

// Define role
const roles = {
  // ... existing roles
  newsAnalyst: {
    role: 'News Analyst',
    expertise: 'You analyze news and economic events...',
    responsibilities: [
      'Monitor news feeds',
      'Assess market impact',
      'Identify trading opportunities',
    ],
  },
};
```

### Configure Agent Thresholds

```javascript
// Require unanimous approval
const allApprove = evaluations.every(e => e.recommendation === 'APPROVE');

// Or require majority
const approvals = evaluations.filter(e => e.recommendation === 'APPROVE');
const shouldExecute = approvals.length > evaluations.length / 2;

// Or weighted voting
const strategistWeight = 2.0;
const riskManagerWeight = 3.0; // Risk manager has more influence
```

---

## 🎯 Advanced Features

### Multi-Agent Coordination

Agents can work together on complex tasks:

```javascript
// Request multi-agent analysis
const analysis = await multiAgentOrchestrator.coordinateAgents(
  'analyze_market_opportunity',
  {
    pair: 'EURUSD',
    context: 'ECB meeting tomorrow',
  }
);

// Supervisor coordinates:
// 1. Technical Analyst checks charts
// 2. Sentiment Analyst reviews news
// 3. Risk Manager calculates exposure
// 4. Strategist recommends action
// 5. Supervisor makes final decision
```

### Agent Learning

Agents store decision history and learn from outcomes:

```javascript
// After trade closes
const outcome = {
  profitable: true,
  pnl: 150,
  durationHours: 12,
};

// Update agent performance
await multiAgentOrchestrator.recordOutcome(tradeId, outcome);

// Agents adjust confidence based on results
```

### Custom Workflows

Create complex multi-step workflows:

```javascript
// Example: Full market analysis workflow
const workflow = {
  steps: [
    { agent: 'technicalAnalyst', action: 'analyzeMultipleTimeframes' },
    { agent: 'sentimentAnalyst', action: 'checkNews' },
    { agent: 'strategist', action: 'identifySetups' },
    { agent: 'riskManager', action: 'calculatePositionSize' },
    { agent: 'executionManager', action: 'planEntry' },
    { agent: 'supervisor', action: 'approveOrReject' },
  ],
};

await multiAgentOrchestrator.executeWorkflow(workflow);
```

---

## 📱 Mobile Access

### Dashboard on Mobile

The dashboard is fully responsive:
- Charts adapt to screen size
- Touch-friendly controls
- Mobile-optimized layout

### n8n Mobile App

1. Download n8n app (iOS/Android)
2. Login with cloud account
3. Monitor workflows
4. Trigger manual executions
5. View real-time logs

---

## 🔍 Monitoring AI Decisions

### Dashboard View

Each AI decision is displayed with:
- Agent name
- Recommendation (APPROVE/REJECT/CONDITIONAL)
- Confidence score
- Detailed reasoning
- Key factors considered

### Log Analysis

```bash
# View AI decisions in logs
tail -f logs/trading-bot.log | grep "AI Agent"

# Example output:
[10:30:15] AI Agent (Technical Analyst): APPROVE - Confidence: 0.85
[10:30:16] AI Agent (Risk Manager): APPROVE - Confidence: 0.92
[10:30:17] AI Agent (Supervisor): EXECUTE - Final confidence: 0.88
```

### Decision History

```javascript
// Get all AI decisions
const decisions = multiAgentOrchestrator.getDecisionHistory();

// Analyze performance
const successRate = decisions.filter(d =>
  d.outcome && d.outcome.profitable
).length / decisions.length;

console.log(`AI Decision Success Rate: ${successRate * 100}%`);
```

---

## 🎓 Best Practices

### 1. Start Conservative

```env
# High confidence threshold
AI_CONFIDENCE_THRESHOLD=0.80

# Require multiple agents to agree
REQUIRE_UNANIMOUS_APPROVAL=true
```

### 2. Monitor Agent Performance

- Track which agents are most accurate
- Adjust their voting weight
- Disable underperforming agents

### 3. Use All Timeframes

Agents should check multiple timeframes:
- Market Strategist: 4h, 1d
- Technical Analyst: 1h, 4h
- Execution Manager: 5m, 15m

### 4. Test in Demo First

Run multi-agent system in demo for 1-2 weeks:
- Observe decision quality
- Tune confidence thresholds
- Adjust agent prompts

### 5. Review Dashboard Daily

- Check AI decision stream
- Analyze agent consensus
- Look for patterns in rejections

---

## 🆘 Troubleshooting

### AI Agents Not Working

**Check:**
1. ANTHROPIC_API_KEY is set
2. AI_ENABLED=true in .env
3. Account has API credits
4. Internet connection stable

### Dashboard Not Loading

**Check:**
1. Port 8080 is not in use
2. Run `npm run dashboard` separately
3. Check browser console for errors
4. WebSocket connection established

### n8n Workflows Not Executing

**Check:**
1. Workflow is activated
2. BOT_URL is accessible from internet
3. API key is correct
4. Check n8n execution log

---

## 🚀 What's Possible

With this multi-agent system, you can:

✅ **Trade like a team** - 7 AI agents working together
✅ **See everything** - Real-time visualization of all decisions
✅ **Run 24/7** - Cloud deployment with n8n.io
✅ **Learn continuously** - Agents improve from experience
✅ **Customize fully** - Modify agent behavior and add new ones
✅ **Scale easily** - Add more agents and strategies
✅ **Monitor anywhere** - Dashboard + mobile app
✅ **Integrate anything** - n8n connects to 400+ services

---

## 📚 Learn More

- **Multi-Agent Architecture**: `src/ai-agent/multi-agent-orchestrator.js`
- **Dashboard Code**: `src/visualization/dashboard-server.js`
- **n8n Cloud Setup**: `docs/N8N_CLOUD_SETUP.md`
- **API Reference**: `docs/API_REFERENCE.md`

---

**You now have a professional AI trading team working for you 24/7! 🎉**

Every trade is analyzed by 7 expert AI agents, visualized in real-time, and monitored in the cloud.
