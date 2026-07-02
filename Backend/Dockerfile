FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies (production only) using ci for lockfile consistency
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

# Use non-root user
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/v1/system/health || exit 1

CMD ["node", "server.js"]
