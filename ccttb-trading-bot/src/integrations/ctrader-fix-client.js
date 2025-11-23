/**
 * cTrader FIX Protocol Client
 * Connects to cTrader via FIX API for forex trading
 */

import net from 'net';
import tls from 'tls';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';

export class CTraderFIXClient extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.socket = null;
    this.isConnected = false;
    this.heartbeatInterval = null;
    this.seqNum = 1;
    this.logonSeqNum = 1;

    // FIX Configuration
    this.fixConfig = {
      host: config.get('CTRADER_HOST') || 'demo-uk-eqx-01.p.c-trader.com',
      portSSL: parseInt(config.get('CTRADER_PORT_SSL')) || 5212,
      portPlain: parseInt(config.get('CTRADER_PORT_PLAIN')) || 5202,
      senderCompID: config.get('CTRADER_SENDER_COMP_ID'),
      targetCompID: config.get('CTRADER_TARGET_COMP_ID') || 'cServer',
      senderSubID: config.get('CTRADER_SENDER_SUB_ID') || 'TRADE',
      password: config.get('CTRADER_PASSWORD'),
      useSSL: config.get('CTRADER_USE_SSL') !== 'false',
    };

    this.SOH = '\x01'; // FIX field delimiter
    this.positions = new Map();
    this.orders = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      logger.info('Connecting to cTrader via FIX protocol...');

      const port = this.fixConfig.useSSL ? this.fixConfig.portSSL : this.fixConfig.portPlain;

      if (this.fixConfig.useSSL) {
        this.socket = tls.connect({
          host: this.fixConfig.host,
          port: port,
          rejectUnauthorized: false,
        });
      } else {
        this.socket = net.connect({
          host: this.fixConfig.host,
          port: port,
        });
      }

      this.socket.on('connect', () => {
        logger.info('TCP connection established');
        this.sendLogon();
      });

      this.socket.on('data', (data) => {
        this.handleMessage(data.toString());
      });

      this.socket.on('error', (error) => {
        logger.error('Socket error:', error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('close', () => {
        logger.info('Connection closed');
        this.isConnected = false;
        this.cleanup();
      });

      // Resolve after successful logon
      this.once('logonSuccess', () => {
        this.isConnected = true;
        this.startHeartbeat();
        resolve();
      });

      // Reject on logon failure
      this.once('logonFailed', (error) => {
        reject(error);
      });
    });
  }

  sendLogon() {
    const logon = this.createMessage('A', {
      '98': '0', // EncryptMethod: None
      '108': '30', // HeartBtInt: 30 seconds
      '141': 'Y', // ResetSeqNumFlag
      '554': this.fixConfig.password, // Password
    });

    this.sendMessage(logon);
    logger.info('Logon message sent');
  }

  createMessage(msgType, fields = {}) {
    const timestamp = this.getUTCTimestamp();

    // Standard header fields
    const headerFields = {
      '8': 'FIX.4.4', // BeginString
      '35': msgType, // MsgType
      '49': this.fixConfig.senderCompID, // SenderCompID
      '56': this.fixConfig.targetCompID, // TargetCompID
      '50': this.fixConfig.senderSubID, // SenderSubID
      '34': this.seqNum.toString(), // MsgSeqNum
      '52': timestamp, // SendingTime
    };

    // Combine header and body fields
    const allFields = { ...headerFields, ...fields };

    // Build message body (without checksum)
    let body = '';
    for (const [tag, value] of Object.entries(allFields)) {
      body += `${tag}=${value}${this.SOH}`;
    }

    // Calculate body length (excluding BeginString and BodyLength fields)
    const bodyLengthStart = body.indexOf('35=');
    const bodyForLength = body.substring(bodyLengthStart);
    const bodyLength = bodyForLength.length;

    // Insert BodyLength after BeginString
    const message = `8=FIX.4.4${this.SOH}9=${bodyLength}${this.SOH}${bodyForLength}`;

    // Calculate and append checksum
    const checksum = this.calculateChecksum(message);
    const finalMessage = `${message}10=${checksum}${this.SOH}`;

    this.seqNum++;

    return finalMessage;
  }

  calculateChecksum(message) {
    let sum = 0;
    for (let i = 0; i < message.length; i++) {
      sum += message.charCodeAt(i);
    }
    const checksum = (sum % 256).toString().padStart(3, '0');
    return checksum;
  }

  sendMessage(message) {
    if (!this.socket || !this.socket.writable) {
      logger.error('Socket not writable');
      return false;
    }

    this.socket.write(message);
    logger.debug('Sent FIX message:', this.parseFIXMessage(message));
    return true;
  }

  handleMessage(data) {
    const messages = data.split('8=FIX');

    for (let msg of messages) {
      if (msg.length === 0) continue;

      const fullMsg = '8=FIX' + msg;
      const parsed = this.parseFIXMessage(fullMsg);

      if (!parsed) continue;

      const msgType = parsed['35'];

      switch (msgType) {
        case 'A': // Logon
          this.handleLogon(parsed);
          break;
        case '0': // Heartbeat
          this.handleHeartbeat(parsed);
          break;
        case '1': // TestRequest
          this.handleTestRequest(parsed);
          break;
        case '3': // Reject
          this.handleReject(parsed);
          break;
        case '5': // Logout
          this.handleLogout(parsed);
          break;
        case '8': // Execution Report
          this.handleExecutionReport(parsed);
          break;
        case 'W': // Market Data Snapshot
          this.handleMarketData(parsed);
          break;
        case 'X': // Market Data Incremental Refresh
          this.handleMarketDataIncremental(parsed);
          break;
        case 'j': // Business Message Reject
          this.handleBusinessReject(parsed);
          break;
        default:
          logger.debug('Unhandled message type:', msgType);
      }
    }
  }

  parseFIXMessage(message) {
    const fields = {};
    const parts = message.split(this.SOH);

    for (const part of parts) {
      if (part.length === 0) continue;
      const [tag, value] = part.split('=');
      if (tag && value) {
        fields[tag] = value;
      }
    }

    return Object.keys(fields).length > 0 ? fields : null;
  }

  handleLogon(message) {
    logger.info('Logon acknowledgment received');
    this.emit('logonSuccess');
  }

  handleHeartbeat(message) {
    logger.debug('Heartbeat received');
  }

  handleTestRequest(message) {
    const testReqID = message['112'];
    const heartbeat = this.createMessage('0', {
      '112': testReqID, // TestReqID
    });
    this.sendMessage(heartbeat);
  }

  handleReject(message) {
    logger.error('Message rejected:', message);
    this.emit('logonFailed', new Error('Logon rejected'));
  }

  handleLogout(message) {
    logger.info('Logout received:', message['58'] || 'No reason');
    this.disconnect();
  }

  handleExecutionReport(message) {
    const execReport = {
      clOrdID: message['11'],
      orderID: message['37'],
      execType: message['150'],
      ordStatus: message['39'],
      symbol: message['55'],
      side: message['54'],
      price: parseFloat(message['44'] || 0),
      quantity: parseFloat(message['38'] || 0),
      cumQty: parseFloat(message['14'] || 0),
      avgPx: parseFloat(message['6'] || 0),
      text: message['58'],
    };

    logger.info('Execution report:', execReport);
    this.emit('executionReport', execReport);

    // Update orders
    if (execReport.orderID) {
      this.orders.set(execReport.orderID, execReport);
    }
  }

  handleMarketData(message) {
    const marketData = {
      symbol: message['55'],
      bid: parseFloat(message['132'] || 0),
      ask: parseFloat(message['133'] || 0),
      bidSize: parseFloat(message['134'] || 0),
      askSize: parseFloat(message['135'] || 0),
    };

    this.emit('marketData', marketData);
  }

  handleMarketDataIncremental(message) {
    // Handle incremental market data updates
    this.emit('marketDataUpdate', message);
  }

  handleBusinessReject(message) {
    logger.error('Business message reject:', {
      refSeqNum: message['45'],
      refMsgType: message['372'],
      rejectReason: message['380'],
      text: message['58'],
    });
  }

  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const heartbeat = this.createMessage('0');
      this.sendMessage(heartbeat);
    }, 30000); // 30 seconds
  }

  // Trading Methods

  async createMarketOrder(symbol, side, quantity) {
    const clOrdID = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order = this.createMessage('D', {
      '11': clOrdID, // ClOrdID
      '55': symbol, // Symbol
      '54': side === 'buy' ? '1' : '2', // Side (1=Buy, 2=Sell)
      '38': quantity.toString(), // OrderQty
      '40': '1', // OrdType (1=Market)
      '59': '3', // TimeInForce (3=IOC)
      '60': this.getUTCTimestamp(), // TransactTime
    });

    this.sendMessage(order);

    return {
      clOrdID,
      symbol,
      side,
      quantity,
      type: 'market',
    };
  }

  async createLimitOrder(symbol, side, quantity, price) {
    const clOrdID = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order = this.createMessage('D', {
      '11': clOrdID,
      '55': symbol,
      '54': side === 'buy' ? '1' : '2',
      '38': quantity.toString(),
      '40': '2', // OrdType (2=Limit)
      '44': price.toString(), // Price
      '59': '1', // TimeInForce (1=GTC)
      '60': this.getUTCTimestamp(),
    });

    this.sendMessage(order);

    return {
      clOrdID,
      symbol,
      side,
      quantity,
      price,
      type: 'limit',
    };
  }

  async createStopOrder(symbol, side, quantity, stopPrice) {
    const clOrdID = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const order = this.createMessage('D', {
      '11': clOrdID,
      '55': symbol,
      '54': side === 'buy' ? '1' : '2',
      '38': quantity.toString(),
      '40': '3', // OrdType (3=Stop)
      '99': stopPrice.toString(), // StopPx
      '59': '1', // TimeInForce (1=GTC)
      '60': this.getUTCTimestamp(),
    });

    this.sendMessage(order);

    return {
      clOrdID,
      symbol,
      side,
      quantity,
      stopPrice,
      type: 'stop',
    };
  }

  async cancelOrder(orderID) {
    const clOrdID = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const cancel = this.createMessage('F', {
      '11': clOrdID, // New ClOrdID for cancel request
      '37': orderID, // OrigOrderID
      '60': this.getUTCTimestamp(),
    });

    this.sendMessage(cancel);
  }

  async requestMarketData(symbol) {
    const mdReqID = `MD-${Date.now()}`;

    const request = this.createMessage('V', {
      '262': mdReqID, // MDReqID
      '263': '1', // SubscriptionRequestType (1=Snapshot+Updates)
      '264': '0', // MarketDepth (0=Full book)
      '265': '0', // MDUpdateType (0=Full refresh)
      '146': '1', // NoRelatedSym
      '55': symbol, // Symbol
      '267': '2', // NoMDEntryTypes
      '269': '0', // MDEntryType (0=Bid)
      '269': '1', // MDEntryType (1=Offer)
    });

    this.sendMessage(request);
  }

  getUTCTimestamp() {
    const now = new Date();
    return now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async disconnect() {
    logger.info('Disconnecting from cTrader...');

    // Send logout message
    const logout = this.createMessage('5');
    this.sendMessage(logout);

    this.cleanup();

    if (this.socket) {
      this.socket.end();
      this.socket = null;
    }

    this.isConnected = false;
  }

  // Helper methods for compatibility with main bot

  async fetchTicker(symbol) {
    // Request market data and wait for response
    return new Promise((resolve) => {
      const handler = (data) => {
        if (data.symbol === symbol) {
          this.off('marketData', handler);
          resolve({
            symbol: data.symbol,
            bid: data.bid,
            ask: data.ask,
            last: (data.bid + data.ask) / 2,
          });
        }
      };

      this.on('marketData', handler);
      this.requestMarketData(symbol);

      // Timeout after 5 seconds
      setTimeout(() => {
        this.off('marketData', handler);
        resolve(null);
      }, 5000);
    });
  }

  async fetchBalance() {
    // Request account info
    // Note: Implementation depends on broker-specific extensions
    return {
      free: {},
      used: {},
      total: {},
    };
  }
}
