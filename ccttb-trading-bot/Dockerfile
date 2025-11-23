FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY src/ ./src/
COPY config/ ./config/
COPY workflows/ ./workflows/

# Create directories for logs and data
RUN mkdir -p logs data

# Expose n8n integration port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Start the bot
CMD ["node", "src/index.js"]
