# ── Stage 1: Base image ──────────────────────────────────────────
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy app source
COPY app.js ./

# Expose port
EXPOSE 3000

# Health check using the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# Start the app
CMD ["node", "app.js"]
