/**
 * Logger Utility
 * Centralized logging with Winston
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logLevel = process.env.LOG_LEVEL || 'info';
const logFile = process.env.LOG_FILE || path.join(__dirname, '../../logs/trading-bot.log');

// Create logger
export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ccttb-trading-bot' },
  transports: [
    // Console transport with colorized output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          if (Object.keys(meta).length > 0 && meta.service !== 'ccttb-trading-bot') {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      ),
    }),
  ],
});

// Add file transport if log file is specified
if (logFile) {
  logger.add(
    new winston.transports.File({
      filename: logFile,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

export default logger;
