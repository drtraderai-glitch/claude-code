# API Reference

Complete API documentation for the CCTTB Trading Bot n8n integration.

## Base URL

```
http://localhost:3000
```

## Authentication

All API endpoints (except `/health`) require authentication via API key.

### Headers

```
X-Api-Key: your_api_key_here
```

## Endpoints

### Health Check

Check if the server is running.

**GET** `/health`

**Authentication:** Not required

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

---

### Get Bot Status

Retrieve current bot status and configuration.

**GET** `/api/status`

**Authentication:** Required

**Response:**
```json
{
  "isRunning": true,
  "positions": [
    ["BTC/USDT", {
      "side": "long",
      "entryPrice": 45000,
      "size": 0.01,
      "stopLoss": 44100,
      "takeProfit": 47250,
      "timestamp": 1234567890
    }]
  ],
  "strategy": "hybrid",
  "aiEnabled": true
}
```

---

### Get Portfolio

Retrieve current portfolio snapshot.

**GET** `/api/portfolio`

**Authentication:** Required

**Response:**
```json
{
  "balance": {
    "total": {
      "USDT": 10500.50,
      "BTC": 0.5
    },
    "free": {
      "USDT": 9000.00,
      "BTC": 0.45
    },
    "used": {
      "USDT": 1500.50,
      "BTC": 0.05
    }
  },
  "positions": [...],
  "performance": {
    "totalProfit": 500.50,
    "totalLoss": 200.00,
    "netProfit": 300.50,
    "winRate": 65.5,
    "totalTrades": 25,
    "wins": 16,
    "losses": 9
  },
  "timestamp": 1234567890
}
```

---

### Get Open Positions

Retrieve all currently open positions.

**GET** `/api/positions`

**Authentication:** Required

**Response:**
```json
{
  "positions": [
    {
      "pair": "BTC/USDT",
      "side": "long",
      "entryPrice": 45000,
      "size": 0.01,
      "stopLoss": 44100,
      "takeProfit": 47250,
      "timestamp": 1234567890,
      "signal": {...}
    }
  ]
}
```

---

### Manual Trade Execution

Execute a manual trade.

**POST** `/api/trade`

**Authentication:** Required

**Request Body:**
```json
{
  "type": "BUY",
  "pair": "BTC/USDT",
  "amount": 0.01
}
```

**Parameters:**
- `type` (string, required): Trade type - "BUY", "SELL", or "CLOSE"
- `pair` (string, required): Trading pair (e.g., "BTC/USDT")
- `amount` (number, optional): Position size (uses default if not specified)

**Response:**
```json
{
  "success": true,
  "message": "Trade executed"
}
```

**Error Response:**
```json
{
  "error": "Missing required fields: type, pair"
}
```

---

### Start Bot

Start the trading bot.

**POST** `/api/bot/start`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Bot started"
}
```

---

### Stop Bot

Stop the trading bot.

**POST** `/api/bot/stop`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Bot stopped"
}
```

---

### Get Risk Statistics

Retrieve current risk management statistics.

**GET** `/api/risk`

**Authentication:** Required

**Response:**
```json
{
  "dailyLoss": 45.50,
  "dailyTrades": 7,
  "lastReset": "2024-01-15"
}
```

---

### AI Market Analysis

Get AI-powered market analysis.

**POST** `/api/ai/analyze`

**Authentication:** Required

**Request Body:**
```json
{
  "pair": "BTC/USDT",
  "timeframe": "1h"
}
```

**Response:**
```json
{
  "insight": "Bitcoin is showing bullish momentum with strong support at $44,000. RSI indicates room for growth. Consider long positions with stop-loss below support."
}
```

**Error Response:**
```json
{
  "error": "AI Agent not enabled"
}
```

---

### Change Strategy

Change the active trading strategy.

**POST** `/api/strategy`

**Authentication:** Required

**Request Body:**
```json
{
  "strategy": "rsi_macd"
}
```

**Available Strategies:**
- `rsi_macd`
- `bollinger_bands`
- `ema_crossover`
- `hybrid`

**Response:**
```json
{
  "success": true,
  "strategy": "rsi_macd"
}
```

---

## Webhooks

### Trading Signal Webhook

Receive and process trading signals from external sources.

**POST** `/webhook/signal`

**Authentication:** Required

**Request Body:**
```json
{
  "type": "BUY",
  "pair": "BTC/USDT",
  "confidence": 0.85,
  "indicators": {
    "rsi": 35,
    "macd": 150
  }
}
```

**Parameters:**
- `type` (string, required): Signal type - "BUY" or "SELL"
- `pair` (string, optional): Trading pair (uses default if not specified)
- `confidence` (number, optional): Signal confidence 0-1 (default: 0.8)
- `indicators` (object, optional): Technical indicators used

**Response:**
```json
{
  "success": true,
  "message": "Signal processed"
}
```

---

### Portfolio Webhook

Webhook for getting portfolio updates.

**GET** `/webhook/portfolio`

**Authentication:** Required

**Response:** Same as `/api/portfolio`

---

## Error Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 500 | Internal Server Error |

## Error Response Format

```json
{
  "error": "Error message description"
}
```

## Rate Limiting

- No rate limiting currently implemented
- Recommended: Max 100 requests per minute
- Webhook endpoints: Max 10 requests per second

## Examples

### cURL

#### Get Status
```bash
curl -H "X-Api-Key: your_api_key" \
  http://localhost:3000/api/status
```

#### Execute Trade
```bash
curl -X POST \
  -H "X-Api-Key: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"type":"BUY","pair":"BTC/USDT"}' \
  http://localhost:3000/api/trade
```

### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/api/status', {
  headers: {
    'X-Api-Key': 'your_api_key'
  }
});

const data = await response.json();
console.log(data);
```

### Python (requests)

```python
import requests

headers = {
    'X-Api-Key': 'your_api_key'
}

response = requests.get('http://localhost:3000/api/status', headers=headers)
data = response.json()
print(data)
```

### n8n HTTP Request Node

**Configuration:**
- **Method:** GET/POST
- **URL:** http://localhost:3000/api/status
- **Authentication:** Generic Credential Type
  - **Generic Auth Type:** HTTP Header Auth
  - **Credential for HTTP Header Auth:** (select your credential)

---

## WebSocket Support

Currently not implemented. All communication is via REST API.

Planned for future versions:
- Real-time trade updates
- Live portfolio changes
- Signal broadcasts

## Versioning

Current API version: **v1.0.0**

No version prefix in URL currently. Future versions may include `/v1/` prefix.

## Support

For API issues:
1. Check server logs: `logs/trading-bot.log`
2. Verify API key configuration
3. Test with cURL first
4. Check request/response format

---

**Last Updated:** 2024-01-15
