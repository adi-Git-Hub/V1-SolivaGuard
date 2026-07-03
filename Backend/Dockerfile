FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies (production only) using ci for lockfile consistency
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

# Create writable directories for runtime
RUN mkdir -p logs uploads && chown -R node:node logs uploads

# Use non-root user
USER node

EXPOSE 5000

# Health = public root route ("Soliva API is running..."). The /api/v1/system/health
# endpoint is now admin-protected (returns 401), so it CANNOT be used as a healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/ || exit 1

CMD ["node", "server.js"]
