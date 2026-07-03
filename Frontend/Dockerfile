# syntax=docker/dockerfile:1
# =============================================================================
# Soliva Frontend — PRODUCTION image (TanStack Start · SSR)
# -----------------------------------------------------------------------------
# This is a server-side-rendered TanStack Start app. `vite.config.ts` sets
# `cloudflare: false`, so `vite build` emits a NODE SSR bundle:
#     dist/client            -> static assets
#     dist/server/server.js  -> SSR fetch handler
# The proven production server for this bundle is `vite preview` (exactly what
# the live site runs today on :8080). We containerize that same command — the
# app architecture is unchanged.
#
# BUILD happens in CI (GitHub Actions). Production only PULLS + RUNS this image;
# `vite preview` serves the pre-built dist and does NOT rebuild.
#
# The Firebase / Razorpay / OpenWeather VITE_* values are PUBLIC (baked into the
# client bundle) but are NOT committed to git, so CI passes them as build ARGs
# (see .github/workflows/deploy.yml). VITE_API_URL / VITE_USE_MOCK_API also come
# through as build args (defaults live in the committed Frontend/.env.production).
# =============================================================================

# ---------- Build stage ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install deps first for layer caching. NOTE: vite + its plugins are
# devDependencies and are required both to BUILD and to run `vite preview`,
# so we install the full tree (no --omit=dev here).
COPY package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci

# VITE_* build-time args -> baked into the client bundle by `npm run build`.
# Real environment variables have the highest priority in Vite and override .env files.
ARG VITE_API_URL
ARG VITE_USE_MOCK_API=false
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_OPENWEATHER_API_KEY
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCK_API=$VITE_USE_MOCK_API \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID \
    VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY \
    VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN \
    VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID \
    VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET \
    VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID \
    VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID \
    VITE_FIREBASE_MEASUREMENT_ID=$VITE_FIREBASE_MEASUREMENT_ID \
    VITE_OPENWEATHER_API_KEY=$VITE_OPENWEATHER_API_KEY

COPY . .
RUN npm run build

# ---------- Production stage ----------
# `vite preview` needs vite + the config + node_modules at runtime, so we carry
# the whole built app from the build stage. (Image is large; it can be slimmed
# later with a standalone Node SSR adapter — deferred to avoid changing the
# app's SSR/error-handling behavior.)
FROM node:22-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app ./

# Run as the built-in non-root `node` user.
USER node

EXPOSE 8080

# Health = SSR home page returns 200 (Node 22 has global fetch; no wget needed).
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# `vite preview` serves the PRE-BUILT dist over SSR — it never rebuilds.
CMD ["sh", "-c", "npx vite preview --host 0.0.0.0 --port ${PORT}"]
