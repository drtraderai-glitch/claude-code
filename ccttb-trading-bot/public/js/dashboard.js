// Dashboard Client-Side JavaScript
// Handles real-time updates, charting, and visualization

class TradingDashboard {
    constructor() {
        this.ws = null;
        this.chart = null;
        this.candlestickSeries = null;
        this.isConnected = false;
        this.currentPair = 'EURUSD';
        this.currentTimeframe = '1h';

        this.init();
    }

    init() {
        this.setupWebSocket();
        this.setupChart();
        this.setupEventListeners();
        this.loadInitialData();
    }

    setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        this.ws = new WebSocket(`${protocol}//${host}`);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.isConnected = true;
            this.updateConnectionStatus(true);
            this.addLog('Connected to trading bot', 'success');
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.addLog('Disconnected from trading bot', 'error');

            // Attempt to reconnect after 5 seconds
            setTimeout(() => this.setupWebSocket(), 5000);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.addLog('WebSocket error occurred', 'error');
        };
    }

    handleMessage(message) {
        switch (message.type) {
            case 'initial_data':
                this.loadData(message.data);
                break;

            case 'signal':
                this.addSignal(message.data);
                this.addLog(`New signal: ${message.data.type} ${message.data.pair}`, 'info');
                break;

            case 'trade':
                this.addTrade(message.data);
                this.addLog(`Trade executed: ${message.data.type} ${message.data.pair}`, 'success');
                this.updateChart();
                break;

            case 'position':
                this.updatePositions(message.data);
                break;

            case 'portfolio':
                this.updatePerformance(message.data);
                break;

            case 'indicators':
                this.updateIndicators(message.data);
                break;

            case 'ai_decision':
                this.addAIDecision(message.data);
                this.addLog(`AI Decision: ${message.data.decision}`, 'info');
                break;

            case 'heartbeat':
                this.updateStatus(message.status);
                break;

            case 'chart_data':
                this.updateChartData(message.data);
                break;

            default:
                console.log('Unknown message type:', message.type);
        }
    }

    setupChart() {
        const chartContainer = document.getElementById('tradingChart');
        this.chart = LightweightCharts.createChart(chartContainer, {
            width: chartContainer.clientWidth,
            height: 500,
            layout: {
                background: { color: '#0f1318' },
                textColor: '#d1d4dc',
            },
            grid: {
                vertLines: { color: '#1a1f2e' },
                horzLines: { color: '#1a1f2e' },
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
            },
            rightPriceScale: {
                borderColor: '#2d3748',
            },
            timeScale: {
                borderColor: '#2d3748',
                timeVisible: true,
                secondsVisible: false,
            },
        });

        this.candlestickSeries = this.chart.addCandlestickSeries({
            upColor: '#48bb78',
            downColor: '#f56565',
            borderVisible: false,
            wickUpColor: '#48bb78',
            wickDownColor: '#f56565',
        });

        // Handle resize
        window.addEventListener('resize', () => {
            this.chart.applyOptions({
                width: chartContainer.clientWidth,
            });
        });
    }

    setupEventListeners() {
        // Pair selection
        document.getElementById('pairSelect').addEventListener('change', (e) => {
            this.currentPair = e.target.value;
            this.requestChartData();
        });

        // Timeframe selection
        document.getElementById('timeframeSelect').addEventListener('change', (e) => {
            this.currentTimeframe = e.target.value;
            this.requestChartData();
        });

        // Control buttons
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseBot();
        });

        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeBot();
        });
    }

    async loadInitialData() {
        try {
            const response = await fetch('/api/dashboard/data');
            const data = await response.json();
            this.loadData(data);

            // Load chart data
            this.requestChartData();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.addLog('Failed to load initial data', 'error');
        }
    }

    loadData(data) {
        if (data.performance) {
            this.updatePerformance(data.performance);
        }

        if (data.positions) {
            data.positions.forEach(([pair, pos]) => {
                this.updatePositions({ pair, ...pos });
            });
        }

        if (data.signals && data.signals.length > 0) {
            data.signals.forEach(signal => this.addSignal(signal));
        }

        if (data.aiDecisions && data.aiDecisions.length > 0) {
            data.aiDecisions.forEach(decision => this.addAIDecision(decision));
        }
    }

    requestChartData() {
        if (this.isConnected) {
            this.ws.send(JSON.stringify({
                type: 'request_chart',
                pair: this.currentPair,
                timeframe: this.currentTimeframe,
            }));
        } else {
            // Fallback to HTTP
            fetch(`/api/dashboard/chart/${this.currentPair}/${this.currentTimeframe}`)
                .then(res => res.json())
                .then(data => this.updateChartData(data))
                .catch(err => console.error('Error fetching chart data:', err));
        }
    }

    updateChartData(data) {
        if (!data || !data.data) return;

        const candlestickData = data.data.map(candle => ({
            time: Math.floor(candle[0] / 1000), // Convert to seconds
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
        }));

        this.candlestickSeries.setData(candlestickData);

        // Update current price
        if (candlestickData.length > 0) {
            const lastCandle = candlestickData[candlestickData.length - 1];
            document.getElementById('chartInfo').querySelector('.current-price').textContent =
                `$${lastCandle.close.toFixed(lastCandle.close > 100 ? 2 : 5)}`;
        }
    }

    updateChart() {
        this.requestChartData();
    }

    updatePerformance(performance) {
        document.getElementById('totalPnl').textContent =
            `$${performance.netProfit?.toFixed(2) || '0.00'}`;
        document.getElementById('totalPnl').style.color =
            (performance.netProfit || 0) >= 0 ? '#48bb78' : '#f56565';

        document.getElementById('winRate').textContent =
            `${performance.winRate?.toFixed(1) || '0'}%`;

        document.getElementById('totalTrades').textContent =
            performance.totalTrades || '0';
    }

    updatePositions(position) {
        const list = document.getElementById('positionsList');
        const existingPos = document.querySelector(`[data-pair="${position.pair}"]`);

        if (existingPos) {
            existingPos.remove();
        }

        if (list.querySelector('.no-data')) {
            list.innerHTML = '';
        }

        const posDiv = document.createElement('div');
        posDiv.className = `position-item ${position.side}`;
        posDiv.setAttribute('data-pair', position.pair);

        posDiv.innerHTML = `
            <div class="position-header">
                <span class="position-pair">${position.pair}</span>
                <span class="position-side ${position.side}">${position.side.toUpperCase()}</span>
            </div>
            <div class="position-details">
                <div>Entry: ${position.entryPrice}</div>
                <div>Size: ${position.size}</div>
                <div>SL: ${position.stopLoss}</div>
                <div>TP: ${position.takeProfit}</div>
            </div>
        `;

        list.insertBefore(posDiv, list.firstChild);

        // Update open positions count
        document.getElementById('openPositions').textContent =
            list.querySelectorAll('.position-item').length;
    }

    addSignal(signal) {
        const list = document.getElementById('signalsList');

        if (list.querySelector('.no-data')) {
            list.innerHTML = '';
        }

        const signalDiv = document.createElement('div');
        signalDiv.className = 'signal-item';

        signalDiv.innerHTML = `
            <div class="signal-header">
                <span class="signal-type ${signal.type}">${signal.type}</span>
                <span class="signal-confidence">Confidence: ${(signal.confidence * 100).toFixed(0)}%</span>
            </div>
            <div class="signal-details">
                <div style="font-size: 0.875rem; color: #a0aec0;">
                    ${signal.pair || ''} - ${signal.strategy || ''}
                </div>
                ${signal.indicators ? `
                    <div style="font-size: 0.75rem; color: #718096; margin-top: 0.5rem;">
                        ${Object.keys(signal.indicators).slice(0, 3).join(', ')}
                    </div>
                ` : ''}
            </div>
        `;

        list.insertBefore(signalDiv, list.firstChild);

        // Keep only last 20 signals
        const signals = list.querySelectorAll('.signal-item');
        if (signals.length > 20) {
            signals[signals.length - 1].remove();
        }
    }

    addTrade(trade) {
        this.addSignal({
            type: trade.type,
            confidence: 1.0,
            pair: trade.pair,
            strategy: 'Executed',
        });
    }

    updateIndicators(data) {
        const display = document.getElementById('indicatorsDisplay');
        display.innerHTML = '';

        const indicators = data.indicators || data;

        for (const [key, value] of Object.entries(indicators)) {
            if (typeof value === 'object') continue;

            const indDiv = document.createElement('div');
            indDiv.className = 'indicator-item';

            indDiv.innerHTML = `
                <span class="indicator-label">${key.toUpperCase()}</span>
                <span class="indicator-value">${typeof value === 'number' ? value.toFixed(2) : value}</span>
            `;

            display.appendChild(indDiv);
        }
    }

    addAIDecision(decision) {
        const list = document.getElementById('aiDecisionsList');

        if (list.querySelector('.no-data')) {
            list.innerHTML = '';
        }

        const decisionDiv = document.createElement('div');
        decisionDiv.className = 'ai-decision-item';

        decisionDiv.innerHTML = `
            <div class="decision-agent">🤖 ${decision.agent || 'Trading Supervisor'}</div>
            <div class="decision-text">${decision.reasoning || decision.content || 'Decision made'}</div>
            <div class="decision-confidence">Confidence: ${((decision.confidence || 0.5) * 100).toFixed(0)}%</div>
        `;

        list.insertBefore(decisionDiv, list.firstChild);

        // Keep only last 10 decisions
        const decisions = list.querySelectorAll('.ai-decision-item');
        if (decisions.length > 10) {
            decisions[decisions.length - 1].remove();
        }
    }

    addLog(message, type = 'info') {
        const log = document.getElementById('activityLog');
        const entry = document.createElement('p');
        entry.className = `log-entry ${type}`;

        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;

        log.insertBefore(entry, log.firstChild);

        // Keep only last 50 entries
        const entries = log.querySelectorAll('.log-entry');
        if (entries.length > 50) {
            entries[entries.length - 1].remove();
        }
    }

    updateStatus(status) {
        const statusEl = document.getElementById('botStatus');
        const statusText = statusEl.querySelector('.status-text');
        const statusDot = statusEl.querySelector('.status-dot');

        if (status.isRunning) {
            statusText.textContent = 'Running';
            statusDot.style.background = '#48bb78';
        } else {
            statusText.textContent = 'Paused';
            statusDot.style.background = '#ed8936';
        }
    }

    updateConnectionStatus(connected) {
        const wsStatus = document.getElementById('wsStatus');
        const wsDot = wsStatus.querySelector('.ws-dot');

        if (connected) {
            wsDot.classList.remove('disconnected');
        } else {
            wsDot.classList.add('disconnected');
        }
    }

    async pauseBot() {
        try {
            await fetch('/api/dashboard/control/pause', { method: 'POST' });
            document.getElementById('pauseBtn').style.display = 'none';
            document.getElementById('resumeBtn').style.display = 'block';
            this.addLog('Bot paused', 'warning');
        } catch (error) {
            this.addLog('Failed to pause bot', 'error');
        }
    }

    async resumeBot() {
        try {
            await fetch('/api/dashboard/control/resume', { method: 'POST' });
            document.getElementById('resumeBtn').style.display = 'none';
            document.getElementById('pauseBtn').style.display = 'block';
            this.addLog('Bot resumed', 'success');
        } catch (error) {
            this.addLog('Failed to resume bot', 'error');
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new TradingDashboard();
});
