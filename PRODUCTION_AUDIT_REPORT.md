# 🛡️ Soliva — Enterprise Production Readiness Audit

**Repository:** `the-final-Soliva` (Backend = Node/Express + MongoDB + Redis + BullMQ + Razorpay · Frontend = React 19 + Vite 7 + TanStack Start)
**Audit type:** Read-only pre-GitHub-push production audit — DevOps · Production · Security · Architecture
**Audit date:** 2026-07-01
**Live domain:** `solivaguard.com`
**Method:** Direct git/filesystem inspection + 4 specialized deep-dive audits (backend, frontend, Docker/infra, repo-hygiene). No files were modified, created (except this report), or deleted.

---

## 0. Deliverable Scores

| # | Scorecard | Score | Grade |
|---|-----------|:-----:|:-----:|
| 1 | **Overall Production Readiness** | **34 / 100** | 🔴 F |
| 2 | **Security** | **38 / 100** | 🔴 F |
| 3 | **Repository Health** | **45 / 100** | 🟠 D |
| 4 | **Performance** | **40 / 100** | 🟠 D |
| 5 | **GitHub Readiness** | **62 / 100** | 🟡 C− |

> **Verdict:** The app is *functionally live* but **not production-grade or enterprise-ready**. It is **safe to push to a *private* GitHub repo after ~1 hour of cleanup** (no secrets are tracked or in history), but there are **three CRITICAL e-commerce security defects** (buy-anything-for-₹1, payment-signature replay, mock-secret bypass) and **one CRITICAL deployment defect** (prod running in `NODE_ENV=development`) that must be fixed before this can be called production-ready. These are *code/runtime* issues, not GitHub-blockers, but they are the most important findings in this report.

### How each score was derived

- **Production Readiness 34** — Live but: prod in dev mode, no DB backups, no monitoring/alerting, no log rotation, no graceful shutdown, no CI/tests, `vite preview` as prod server, in-memory-DB fallback landmine.
- **Security 38** — Strong fundamentals (bcrypt, rate limiting, JWT sessions w/ revocation, sanitization, helmet, zod, clean git history) **undermined** by CRITICAL payment/pricing flaws + dev-mode-in-prod (wildcard CORS + credentials, insecure cookies, stack-trace + OTP leakage) + IDOR.
- **Repository Health 45** — Good `.gitignore` and clean history, but 416 MB of media committed → 347 MB `.git`, a tracked tool-log, ~40 scratch scripts, dual/stub lockfiles, a broken gitlink, ~274 MB removable assets, no README.
- **Performance 40** — Routes auto-split and webp twins exist, but ~400 MB unoptimized media is served **raw** (a single product page pulls ~30 MB), 574 KB eager main JS chunk, no `srcset`/`<picture>`, no manual lazy-loading, `vite preview` + no edge caching.
- **GitHub Readiness 62** — **No secret leakage anywhere** (the thing that matters most), but pushing now permanently bakes 347 MB of binaries + a tracked tool log + scratch scripts into history. Clean first, then push.

---

## 1. Repository Audit

### 1.1 Structure & size
```
the-final-Soliva/           2.3 GB working tree · 347 MB .git · 668 tracked files
├── Backend/        400 MB  (369 MB node_modules · 27 MB logs · 2.5 MB uploads)
├── Frontend/       1.9 GB  (986 MB node_modules · 419 MB dist · 416 MB public)
├── deployment/      28 KB  (systemd units, nginx maintenance, deploy.sh)
├── logs/            23 MB  (backend.log, backend.error.log — untracked, gitignored)
├── .gstack/                (tool cache — mostly ignored, but see 1.5)
├── .gitignore              (solid — see §8)
└── PROJECT_DOCUMENTATION.{md,pdf}, test-*.js, server.pid, package-lock.json (stub)
```

### 1.2 🔴 The dominant problem — 416 MB of media committed to git
`Frontend/public` (416 MB) is committed, which is **the entire reason `.git` is 347 MB** (`size-pack: 346.82 MiB`). Composition:

| Type | Size | Notes |
|------|-----:|-------|
| PNG | ≈161 MB (93 files) | multi-MB source art (`new_BG.png` 14 MB, 4× `Gemini_Generated_*` 7–9 MB) |
| JPG | ≈101 MB (43 files) | product photos 5–7.8 MB each |
| MOV | ≈89.5 MB (4 files) | incl. **two byte-identical 42.7 MB `IMG_6543.mov`** (md5 `572c9495…`) |
| MP4 | ≈46 MB (14 files) | multiple redundant encodings |
| WEBM | 6.9 MB | |
| **WEBP** | **9.1 MB (133 files)** | ← the optimized twins that *should* be the only thing shipped |

**~274 MB (~66%) of `public/` is unreferenced or duplicate** (see §3.4). The `.webp` optimized versions already exist but the multi-MB originals sit next to them.

### 1.3 ⚠️ Build artifacts, caches, temp files (all correctly *untracked*/ignored)
`Frontend/dist` (419 MB), `Frontend/trace.json` (31 MB), `Frontend/stats*.json` (6.4 MB), root `logs/` (23 MB), `Backend/logs/` (27 MB), `server.pid`, `.gstack/` — **~480 MB of regenerable clutter** you can delete from disk *without touching git*. Verified: `git ls-files dist` = 0, none of these are tracked (except the one file in 1.5).

### 1.4 ⚠️ Stray / scratch files **tracked in git** (should never be committed)
- **Root:** `test-login.js`, `test-users.js` (DB/login probes), `package-lock.json` (95-byte empty stub `{"packages":{}}` — not a real lockfile).
- **Backend (~19):** `_rt.js`, `_rt4.js`, `_rt5.js`, `final_worker_audit.js`, `investigate_connectivity*.js`, `length_check.js`, `smtp_audit.js`, `smtp_final_*.js`, `verify_db*.js`, `verify_godaddy_*.js`, `test-bcrypt-regex.js`, `test-email.js`, `test-login.js`, `test-register-login.js`, `test-set-password.js`.
- **Frontend (~19):** `analyze-*.js`, `audit-images*.js`, `sharp-*.js`, `perf.js`, `parse.cjs`, `category-audit.cjs`, `dependency-audit.cjs`, `check-768.js`, `final-image-audit.js`, `qa-screenshots.js`, `run-lh.js`, `test-console.js`, `test-overflow.js`, `test-scroll.js`, `layout.md` (77 KB scratch notes).
- **Frontend tracked images:** `ChatGPT Image May 17…png` ×2 (3.6 MB), `screenshot-320/375/390/414/768.png` (3.7 MB), `soliva details (18 x 24 in).png`, `soliva logo_high resolution.png` (superseded by `.webp`).
- **Backend:** `templates/Tax Invoice.numbers` (0 refs — invoices generated via pdfkit).

> `seed.js` is a **legitimate manual seeder — keep** (but rotate the password it sets, see §2).

### 1.5 🔴 Tracked tool-cache file
`.gstack/browse-audit.jsonl` (**697 KB** browse-activity log) is **tracked** (committed in the initial commit, *before* the `.gstack/` ignore rule existed). `.gitignore` cannot remove already-tracked files → needs `git rm --cached`.

### 1.6 ⚠️ Duplicate files & dead folders (md5-verified)
- `Frontend/3D-Soliva-log copy/` — a **broken git submodule pointer** (gitlink mode `160000`, commit `65b0ab10…`, **no `.gitmodules`**, empty working dir). Referenced nowhere. Remove via `git rm --cached "Frontend/3D-Soliva-log copy"`.
- `Frontend/public/product_images/story_viodeo/` — **entire directory dead** (string `story_viodeo` appears nowhere in code; ~48 MB).
- Both `IMG_6543.mov` copies identical & unreferenced (code uses `IMG_6543-compressed.mp4`).
- 7 md5-identical `IMG_049x/055x/0560` pairs across `public/` and `public/product_images/` (~12 MB), neither referenced.

### 1.7 ⚠️ Missing repo essentials
No root `README.md`, no `LICENSE`, no `CONTRIBUTING`, no `.nvmrc`/`engines`. `PROJECT_DOCUMENTATION.md` exists but is **untracked**.

---

## 2. Security Audit

### 2.1 ✅ Secrets scan — CLEAN in git (the good news)
| Check | Result |
|-------|--------|
| Hardcoded API keys / JWT / Mongo URI / SMTP / AWS / Razorpay / Google in **source** | ✅ None. All externalized to `.env` via `process.env` / `import.meta.env` |
| `.env`, `.env.backup`, `.env.live-backup` tracked? | ✅ No — gitignored (`git check-ignore` ✔) |
| Firebase admin-SDK private keys (`Backend/services/…json`, `Backend/workers/…json`) tracked? | ✅ No — gitignored via `*firebase-adminsdk*.json` (both confirmed to contain `private_key`) |
| Secrets ever committed then removed (full history scan)? | ✅ No — only `.env.example` + `.env.production` ever appeared |
| `node_modules` / `dist` tracked? | ✅ No (0 files) |
| SSH keys / PEM / PPK / P12 / service-account JSON tracked? | ✅ None |

**Only "secret-ish" items found, all low-risk:**
- `Frontend/.env.production` **is tracked** — contains only `VITE_API_URL` + `VITE_USE_MOCK_API=false` (public build values baked into the bundle anyway). ⚠️ Acceptable but review before pushing.
- `.claude/settings.local.json` (untracked) contains a Razorpay **test** key-**id** (`rzp_test_…`, a public identifier, not a secret).
- `seed.js` / test scripts contain **test** passwords (`password123`, `Password123!`).

### 2.2 🔴 CRITICAL application-security defects (code-level — fix before "production")
These are real code flaws regardless of GitHub. For an e-commerce app they are the top priority.

1. **🔴 Order totals are taken from the client and never recomputed.** `orderValidator.js:35-38` only type-checks the prices; `orderService.createOrder` uses `req.body.totalPrice` (`orderService.js:51,86`) for the Razorpay order and the DB record. The server already computes the authoritative total in `cartService.recalculateCart` (`cartService.js:118-127`) but ignores it. **A buyer can order any product for ₹1.** → *Recompute all prices server-side from the DB.*
2. **🔴 Payment verification is not bound to the order.** `orderService.verifyPayment` (`orderService.js:148-186`) validates the HMAC over `razorpay_order_id|razorpay_payment_id` but never checks it matches the target order's stored `paymentInfo.razorpay_order_id`. **A valid cheap-payment signature can be replayed to mark an expensive order paid.** → *Load the order first; require `order.paymentInfo.razorpay_order_id === razorpay_order_id` and verify the captured amount.*
3. **🔴 Mock/dummy payment secrets act as universal bypasses.** `paymentService.js:48-53` returns `true` when `razorpay_signature === 'mock_signature'` if `RAZORPAY_KEY_ID` is unset; `paymentController.js:11` defaults the webhook secret to `'dummy_webhook_secret'` — a known value an attacker can sign forged `order.paid` events with. → *Fail hard when Razorpay env vars are missing; never ship mock/default secrets.*

### 2.3 🔴 CRITICAL deployment-security defect
**Prod runs `NODE_ENV=development`** (`.env` line 1 + `soliva-backend.service:11`, verified against the live process). Because security is gated on `NODE_ENV === 'production'`, this **currently, live**:
- Opens **CORS to any origin *with credentials*** (`app.js:95` `if (development) return cb(null,true)` + `credentials:true`) → any website can make authenticated requests.
- Ships session cookies **without `Secure`** and `sameSite=Lax` (`authUtils.js:16-20`).
- **Leaks full stack traces** to clients on any error (`errorMiddleware.js:50`).
- **Writes OTP codes to logs in plaintext** (`authService.js:86,115,207`).

→ *Set `NODE_ENV=production` and restart. Single highest-leverage fix.*

### 2.4 🟠 HIGH
- **IDOR on `GET /api/v1/orders/:id`** — any authenticated user can read any order (name/email/address/phone); no ownership check (`orderController.js:32`, `orderService.js:248-254`).
- **Silent in-memory MongoDB fallback active in prod** — `config/db.js:8-19` spins up an ephemeral `MongoMemoryServer` if the `127.0.0.1` Mongo is briefly unreachable at boot, then reports "Connected." A transient blip = a throwaway, data-less DB that silently accepts orders.
- **Default admin creds** — `seed.js:90-95` creates `admin@soliva.com` / `password123`; `test-set-password.js` resets a real user's password. Rotate if ever run against prod.
- **OTP plaintext in logs** (live via 2.3) + **no log rotation** (27 MB and growing).

### 2.5 🟡 MEDIUM
- OTP **verify** & **register** endpoints under-rate-limited (only the 200/10 min general limiter; no per-account attempt cap — `retryCount` never incremented). Allows ~200 guesses per 6-digit OTP window + email-bombing.
- Webhook HMAC computed over `JSON.stringify(req.body)` (re-serialized, not raw bytes → legit webhooks can fail) and compared with `===` (not `crypto.timingSafeEqual`).
- Public `POST /api/v1/payment/test-order` — unauthenticated, creates real Razorpay orders from client `amount`, returns `RAZORPAY_KEY_ID`.
- Broken refresh-token endpoint — `authService.js:359` calls `jwt.verify` but `jsonwebtoken` is never imported → always 401 (token rotation never works).
- Single `JWT_SECRET` for both access & refresh tokens; Redis has **no password**; Mongo has **no auth** (loopback-mitigated); public `/system/health` leaks memory/load/queue internals; upload MIME check trusts client-set values (no magic-byte check).
- Password policy min length **6** (weak).

### 2.6 ✅ Security done well
bcryptjs (cost 10, `password select:false`) · per-session revocation + 5-attempt lockout + account-block · helmet · zod validation on all mutating routes · custom `$`-key sanitizer for Express 5 · **client IPs SHA-256 hashed** before logging · rate-limiting layered global+route · server-side Firebase `verifyIdToken` only · idempotency key on order create · loopback-only DB/Redis binding (post-ransomware hardening noted in compose).

---

## 3. Source Code Audit (dead code / unused deps / assets)

### 3.1 Dead components (0 importers — High confidence)
`Frontend/src/components/`: `AtmosphericEngine.tsx` (only consumer of `three` + `@react-three/*`), `MaintenancePage.tsx` (only consumer of `ui/Ballpit.tsx` → transitively kills `three` again), `FinalCTA.tsx`, `TechSection.tsx`, `BrandLogo.tsx`, `StorytellingSection.tsx`, `EverydayInsightHorizontal.tsx`, `LuxuryLogo.tsx`, `LoadingPage.tsx`.
`features/catalog/components/`: `FilterSidebar.tsx`, `ProductGrid.tsx`, `SortMenu.tsx` (collection renders inline).
`features/user/components/`: `OrdersTab`, `OverviewTab`, `PreferencesTab`, `ProtectionDashboardTab`, `SettingsTab`, `WishlistTab` (profile reimplements tabs inline; only `AddressesTab` used).
`design-system/loading/RouteLoader.tsx` (not in barrel).
**33–35 of 47 shadcn `ui/*` primitives never imported** (accordion, alert, calendar, card, carousel, chart, command, drawer, form, table, tabs, tooltip, …). `ui/sonner.tsx` dead (`toast` imported from the pkg directly).

### 3.2 Dead backend modules
`Backend/services/protectionDashboardService.js` (0 refs — matches the dead frontend tab) · `Backend/utils/jwtToken.js` (`sendToken` never required; live path uses `authService`/`authUtils`). Rest of backend graph is fully wired.

### 3.3 Unused / misplaced dependencies
**Frontend:** `matter-js` (High — 0 refs), `three`+`@react-three/fiber`+`@react-three/drei`+`@types/three` (reachable only via dead files), `pdf-lib`+`marked` (only used by untracked root `md_to_pdf.cjs`), `rollup-plugin-visualizer` (not wired). `recharts`, `react-day-picker`, `input-otp`, `vaul`, `cmdk`, `react-resizable-panels`, `embla-carousel-react` used only by unused shadcn wrappers. `@types/three`/`@types/gsap` misplaced in `dependencies`.
**Backend:** `mongo-sanitize` (dead — the wired one is `express-mongo-sanitize`), `validator` (validation uses zod), `xss-clean`+`express-mongo-sanitize` **imported but unused** (`app.js:7-8`) and both deprecated/incompatible with Express 5, `mongodb-memory-server` in **prod** deps (should be dev; also powers the risky fallback in §2.4).
**Lint blind spots:** `eslint.config.js:36` disables `no-unused-vars`; `tsconfig.json:19-20` sets `noUnusedLocals/Parameters:false` → dead code never surfaced.

### 3.4 Unused large assets (~274 MB reclaimable, High confidence)
`new_BG.png` (14 MB), 4× `Gemini_Generated_Image_*.png` (~30 MB), `DSC05471/76/85/518/520` (~30 MB), `1.JPG`/`2.JPG` (11 MB), `lemon/blue/lime/pink.png` (~19 MB — real products use `product_images/{color}-1.webp`), `variant_*.jpg` (~21 MB), `test_orient.jpg` (4.6 MB), dead hero-video variants (`soliva-hero*.{mp4,webm}` ~12 MB), `intermission.mp4` (5.1 MB), `Video-461.mp4` (4.3 MB), `IMG_6543.mov` ×2 (85 MB), `story_viodeo/` (48 MB).
> **⚠️ Verify caveat:** this is a live store. Product-gallery images were confirmed unreferenced in code + `seed.js`, but **the MongoDB product records / admin uploads were NOT inspected** — cross-check the DB before deleting product-looking assets.

### 3.5 ✅ Clean signals
TODO/FIXME/HACK/XXX count = **0** across both apps. `console.log` in frontend `src` = **1** (dev-gated in `firebase.ts`). Source is clean; the clutter is entirely scratch files + assets.

---

## 4. Frontend Audit (React / Vite / Performance)

| Area | Finding | Sev |
|------|---------|:---:|
| **Media pipeline** | ~400 MB served **raw from `/public`** — **0 images go through Vite** (no hashing/cache-busting). A product page (`$slug.tsx:54,100,123,146`) loads 5–7.8 MB JPGs (~30 MB/page) when 7–70 KB webp twins exist. | 🔴 |
| Responsive images | **No `srcset` / `<picture>` anywhere.** Only `loading="lazy"` (a lazy 7 MB image is still 7 MB). No AVIF. | 🟠 |
| Main JS chunk | `index-*.js` = **574 KB** (total client JS ≈1.5 MB). `framer-motion` bundled into it, imported by **63 files**. | 🟠 |
| Chunking | No `manualChunks`, no `chunkSizeWarningLimit`. Config is a thin wrapper over `@lovable.dev/vite-tanstack-config`. `firebase`/`gsap` do split out (good). | 🟡 |
| Lazy loading | Routes **auto-code-split** by TanStack (✅), but **no manual `React.lazy`/dynamic imports** (`grep` = 0) — heavy particle/3D/admin widgets load eagerly. | 🟡 |
| Animation stacks | Overlapping: `framer-motion` (63 files) + `gsap`+`ScrollTrigger`+`CSSPlugin` (~102 KB) + `lenis` + dead `three`. Consolidate. | 🟠 |
| Sourcemaps | **Not exposed** (`find dist -name '*.map'` = 0). | ✅ |
| `dist/` committed? | No — gitignored, 0 tracked. | ✅ |
| Error boundary | Root `errorComponent` + `notFoundComponent` present (`__root.tsx:146`). No per-route pending fallbacks. | ✅/🟡 |
| console noise | 8 total statements, 1 dev-gated log. | ✅ |
| Lockfiles | **Both `package-lock.json` (npm, source of truth) and `bun.lock` (stale) tracked.** | 🟡 |

---

## 5. Backend Audit (Express / Mongo / Redis / Auth / Razorpay)

| Area | Finding | Sev |
|------|---------|:---:|
| Razorpay | Client pricing + unbound signature verify + mock-secret bypass | 🔴 (see §2.2) |
| Runtime | `NODE_ENV=development` live | 🔴 (see §2.3) |
| Authorization | IDOR on `GET /orders/:id` | 🟠 |
| MongoDB | Silent in-memory fallback in prod (`db.js:8-19`); duplicate index declarations (harmless warnings) | 🟠 |
| Auth | bcrypt+sessions+lockout ✅; single JWT secret for access+refresh; broken refresh endpoint (jwt not imported) | 🟡 |
| Rate limiting | Present & layered ✅; OTP-verify & register under-limited | 🟡 |
| Validation | zod on all mutating routes ✅; password min 6 weak | 🟡 |
| Error handling | Central handler + `catchAsyncErrors` ✅; stack leak in dev mode | 🟡 |
| Logging | Winston+morgan, **IPs SHA-256 hashed** ✅; plaintext OTP in dev; **no rotation** | 🟠 |
| Redis | ioredis, lazyConnect, graceful degradation ✅; **no password** | 🟡 |
| Email queue | BullMQ, 3 attempts + backoff + dead-letter retention, fresh transport per attempt ✅ | ✅ |
| Health check | `/api/v1/system/health` exists ✅ but public & leaks internals; wired into nothing | 🟡 |
| Uploads | multer, 10 MB cap, admin-only, randomized names ✅; MIME trusts client | 🟡 |
| Bull-Board | Mounted at `app.js:53` before `cookie-parser` (`:105`) → dashboard 401s for everyone (fails closed) | 🟢 |

---

## 6. Docker Audit

**Key reality:** despite Docker files existing, **prod does NOT run in containers** — only Mongo + Redis do (via `soliva-docker.service`). Backend = bare `node` (systemd), Frontend = `vite preview` (systemd). The Dockerfiles/compose `app` service are **stale, misleading infra**.

| Item | Finding | Sev |
|------|---------|:---:|
| `Backend/.dockerignore` | **MISSING** + `COPY . .` → bakes `.env` (all secrets), `logs/`, `uploads/`, `.git` into the image | 🔴 |
| Backend Dockerfile | Runs as **root**, **no multi-stage**, **no HEALTHCHECK**, `node:18-alpine` (EOL), `npm install` not `npm ci` | 🟠 |
| Frontend Dockerfile | Multi-stage ✅, Node 22 ✅, `.dockerignore` present ✅ — **but prod stage runs `wrangler dev`** (a dev server) and isn't used in prod anyway | 🟠 |
| docker-compose | Loopback binding ✅, named volumes ✅, `restart: unless-stopped` ✅ — but **no resource limits**, **no healthchecks**, `depends_on` without `condition: service_healthy`, no Mongo auth, no Redis password, obsolete `version:` key | 🟠 |
| Stale `app` service | Sets `NODE_ENV=production`, contradicting the systemd unit that actually runs (`development`) | 🟠 |

---

## 7. Git Audit — is it safe for (private) GitHub?

| Check | Result |
|-------|--------|
| Secrets tracked (current) | ✅ None |
| Secrets in history (all blobs, all refs) | ✅ None — only `.env.example` + public `.env.production` |
| `.env` / backups / Firebase keys ignored | ✅ Yes (`git check-ignore` ✔ on all) |
| `node_modules` / `dist` / `logs` ignored | ✅ Yes |
| `.gitignore` quality | ✅ Solid — covers `node_modules`, `.env*` (with `!.env.example`), `dist/build/coverage`, caches, `*.pid`, `.gstack/`, `*firebase-adminsdk*.json`, stats/trace |
| ⚠️ `.gstack/browse-audit.jsonl` tracked | 🔴 committed before ignore rule — needs `git rm --cached` |
| ⚠️ `3D-Soliva-log copy` gitlink | 🔴 broken submodule pointer, no `.gitmodules` — `git rm --cached` |
| ⚠️ 347 MB of binaries in history | 🟠 permanent once pushed; largest single file 43 MB (under GitHub's 100 MB hard limit, but repo is heavy) |
| ⚠️ ~40 scratch scripts + stub lockfile tracked | 🟠 clutter (see §1.4) |
| ⚠️ `Frontend/.env.production` tracked | 🟡 public values only |
| Missing `.dockerignore` (Backend) | 🟠 (image hygiene, not a git leak) |

**Bottom line:** No secret will leak — **safe for a private repo after the §11 cleanup.** The real cost of pushing dirty is *permanent history bloat*, which is painful to reverse later. Clean first.

---

## 8. Production Audit — what's missing

| Missing production capability | Severity |
|---|:---:|
| MongoDB backups (mongodump/cron/offsite) | 🔴 CRITICAL |
| `NODE_ENV=production` in prod | 🔴 CRITICAL |
| Remove in-memory Mongo fallback from prod path | 🔴 CRITICAL |
| `Backend/.dockerignore` (secrets baked into image) | 🔴 CRITICAL |
| Monitoring / error tracking / alerting (Sentry, uptime) | 🟠 HIGH |
| Log rotation (logrotate + winston maxFiles/maxsize) | 🟠 HIGH |
| Graceful shutdown (SIGTERM → drain server + BullMQ + Mongo/Redis) | 🟠 HIGH |
| CI/CD pipeline + automated tests (no `.github/`, no `test` script) | 🟠 HIGH |
| Real prod frontend server (replace `vite preview`; also build-on-restart = outage risk) | 🟠 HIGH |
| Edge security headers (HSTS/CSP/X-Frame-Options/nosniff) | 🟠 HIGH |
| Container/OS resource limits (OOM protection) | 🟡 MED |
| Compose healthchecks + `depends_on: service_healthy` | 🟡 MED |
| Health endpoint wired to nginx/uptime; make it non-leaky | 🟡 MED |
| Mongo auth + Redis password | 🟡 MED |
| Env validation on boot (zod already available) | 🟡 MED |
| Static-asset caching + effective gzip/brotli at nginx (`gzip_types` commented out) | 🟡 MED |
| Node clustering / separate worker process (workers share web event loop) | 🟡 MED |
| Stale enabled nginx vhost `/etc/nginx/sites-enabled/soliva` → dead path; ad-hoc `nohup` node dup + stale `server.pid` | 🟡 MED |

---

## 9. Environment Audit — complete `.env.example`

The existing `.env.example` files are **incomplete**. Variables used in code but **missing** from them:
- **Backend:** `REDIS_PASSWORD`, `OPENWEATHER_API_KEY`, `WAQI_API_TOKEN`, `CONTACT_EMAIL`, `FROM_NAME`, `PUBLIC_SITE_URL`, `PUBLIC_URL`, `SMTP_MAX_RETRIES`, plus SMTP aliases (`SMTP_EMAIL`/`SMTP_PASSWORD` are read as fallbacks for `SMTP_USER`/`SMTP_PASS`).
- **Frontend:** `VITE_OPENWEATHER_API_KEY`.

> These templates below are **not written to disk** to respect the "do not modify" constraint. Copy them over your `.env.example` files when ready (I can do it on request).

### `Backend/.env.example` (complete)
```dotenv
# ============================================================================
# Soliva Backend — Environment (copy to `.env`; NEVER commit the real .env)
# ============================================================================
# --- Core ---
NODE_ENV=production            # production | development  (MUST be "production" in prod)
PORT=5000

# --- Database ---
MONGO_URI=mongodb://USER:PASSWORD@127.0.0.1:27017/soliva?authSource=admin

# --- Auth / JWT ---
JWT_SECRET=replace_with_long_random_string   # used for access AND refresh (consider splitting)
JWT_EXPIRE=15m
COOKIE_EXPIRE=30              # days
OTP_EXPIRE=10                 # minutes

# --- URLs / CORS allow-list ---
FRONTEND_URL=https://solivaguard.com
PUBLIC_SITE_URL=https://solivaguard.com
PUBLIC_URL=https://solivaguard.com

# --- Redis ---
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=replace_me     # also set `requirepass` on the Redis server (currently unset!)

# --- SMTP / Email ---
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username  # alias: SMTP_EMAIL (code reads either)
SMTP_PASS=your_smtp_password  # alias: SMTP_PASSWORD (code reads either)
SMTP_FROM=no-reply@solivaguard.com
FROM_NAME=Soliva
CONTACT_EMAIL=contact@solivaguard.com
SMTP_MAX_RETRIES=3

# --- Razorpay (REQUIRED — never rely on mock/dummy defaults) ---
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# --- Firebase Admin (server-side ID-token verification) ---
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# --- Third-party APIs ---
OPENWEATHER_API_KEY=your_openweather_key
WAQI_API_TOKEN=your_waqi_token
```

### `Frontend/.env.example` (complete)
```dotenv
# ============================================================================
# Soliva Frontend — Vite env. EVERY VITE_* value is PUBLIC (baked into bundle).
# Never put server secrets here.
# ============================================================================
VITE_API_URL=https://solivaguard.com/api/v1
VITE_USE_MOCK_API=false

# Razorpay (public key id only)
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx

# Firebase (public web client config)
VITE_FIREBASE_API_KEY=your_firebase_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# OpenWeather (public — domain-restrict the key)
VITE_OPENWEATHER_API_KEY=your_openweather_key
```

---

## 10. Classification: ✅ Safe · ⚠ Needs Review · ❌ Must Fix

### ✅ Safe to Commit / already correct
- `.gitignore` (root/Backend/Frontend) — comprehensive; secrets & artifacts excluded.
- No secrets in tree or history; `.env`, backups, Firebase keys all gitignored.
- `node_modules`, `dist`, `logs`, `trace.json`, `stats*.json` untracked.
- Backend security fundamentals (bcrypt, sessions, lockout, rate limiting, zod, helmet, hashed IPs).
- Frontend: no exposed sourcemaps, root error boundary, clean console, auto-split routes.
- Source code has zero TODO/FIXME debt markers.

### ⚠ Needs Review (before or shortly after push)
- `Frontend/.env.production` tracked (public values — confirm intent).
- Dual lockfiles (`package-lock.json` + `bun.lock`) — pick npm, delete bun.
- ~40 tracked scratch/test scripts + `layout.md` + `Tax Invoice.numbers`.
- ~274 MB unreferenced `public/` assets — **cross-check MongoDB product records first**.
- Dead components/deps (`matter-js`, `three` stack, `pdf-lib`, `marked`, unused shadcn ui/*).
- Stale infra: `vercel.json` + `wrangler.jsonc` vs actual systemd+nginx; stale compose `app` service; stale nginx vhost.
- Weak password policy, single JWT secret, public leaky `/system/health`.

### ❌ Must Fix Before GitHub push
1. `git rm --cached .gstack/browse-audit.jsonl` (tracked 697 KB tool log).
2. `git rm --cached "Frontend/3D-Soliva-log copy"` (broken gitlink).
3. `git rm --cached` the stub root `package-lock.json` + tracked `test-*.js`/scratch scripts (§1.4).
4. **Purge the 416 MB media from git** (or migrate to Git LFS / external storage) **before** the first push — otherwise it's permanent history bloat. Keep only referenced `.webp`.
5. Add `Backend/.dockerignore` (`node_modules .env* logs uploads .git`) — prevents baking secrets into images.
6. Complete both `.env.example` files (§9).

### ❌ Must Fix Before "Production-Ready" (code/runtime — not GitHub-blocking but critical)
7. Recompute order prices server-side (buy-for-₹1). 8. Bind payment verification to the stored order + amount. 9. Remove mock/dummy payment secret fallbacks. 10. Set `NODE_ENV=production`. 11. Add ownership check on `GET /orders/:id` (IDOR). 12. Remove in-memory Mongo fallback from prod. 13. Rotate the seeded admin password. 14. Add MongoDB backups. 15. Add log rotation. 16. Add graceful shutdown.

---

## 11. Pre-Push Checklist

**GitHub-blockers (do before `git push`):**
- [ ] `git rm --cached .gstack/browse-audit.jsonl`
- [ ] `git rm --cached "Frontend/3D-Soliva-log copy"`
- [ ] `git rm --cached package-lock.json` (root 95-byte stub)
- [ ] `git rm --cached` all tracked `test-*.js` + `_rt*.js` + `smtp_*.js` + `verify_*.js` + `investigate_*.js` + `analyze-*.js` + `audit-images*.js` + `sharp-*.js` + `qa-screenshots.js` + `run-lh.js` + `perf.js` + `parse.cjs` + `*-audit.cjs` + `check-768.js` + `test-console/overflow/scroll.js`
- [ ] `git rm --cached` tracked scratch images (`ChatGPT Image*.png`, `screenshot-*.png`, superseded `soliva *.png`, `layout.md`, `Tax Invoice.numbers`)
- [ ] Decide on the 416 MB media: **purge from history (`git filter-repo`) or move to Git LFS** before first push; keep referenced `.webp` only
- [ ] Delete `Frontend/bun.lock` (keep `package-lock.json`)
- [ ] Add `Backend/.dockerignore`
- [ ] Complete `Backend/.env.example` & `Frontend/.env.example` (§9)
- [ ] Add a root `README.md` + `LICENSE` + `.nvmrc`/`engines`
- [ ] Confirm `Frontend/.env.production` should be tracked (public values)
- [ ] Add `.gstack/` cleanly to ignore *and* untrack; re-verify `git status --ignored`

**Security — before real production traffic:**
- [ ] Server-side price recomputation on order create
- [ ] Bind Razorpay signature verification to the stored order + verify amount
- [ ] Remove `mock_signature` / `dummy_webhook_secret` fallbacks; fail hard on missing Razorpay env
- [ ] `NODE_ENV=production` in `.env` + systemd unit; restart
- [ ] Ownership check on `GET /orders/:id`
- [ ] Rotate seeded admin (`admin@soliva.com`) password + any exposed test creds
- [ ] Set `REDIS_PASSWORD` + `requirepass`; enable Mongo auth
- [ ] Per-account OTP attempt cap + strict rate limits on verify/register
- [ ] Raw-body + `timingSafeEqual` webhook verification; remove `/payment/test-order`
- [ ] Restrict/trim `/system/health`; raise password min length; split JWT secrets

**Infrastructure — before scale:**
- [ ] MongoDB backups (`mongodump` cron + offsite/retention)
- [ ] Remove in-memory Mongo fallback from prod path (fail fast)
- [ ] Log rotation (logrotate + winston `maxFiles`/`maxsize`)
- [ ] Graceful SIGTERM shutdown (drain HTTP + BullMQ + close Mongo/Redis)
- [ ] Replace `vite preview` with nginx-served static (or real Workers runtime); stop building on the live host at restart
- [ ] Edge security headers (HSTS/CSP/X-Frame-Options/nosniff) + `gzip_types` + static caching in nginx
- [ ] Monitoring/alerting (Sentry + uptime) wired to `/system/health`
- [ ] Compose resource limits + healthchecks + `depends_on: service_healthy`
- [ ] CI (lint + typecheck + build) and a `test` script; guard `deploy.sh` with `set -euo pipefail` + rollback
- [ ] Remove stale nginx vhost + duplicate `nohup` node process + stale `server.pid`

**Performance:**
- [ ] Reference `.webp` (not multi-MB originals); add `<picture>`/`srcset` (webp/avif)
- [ ] Transcode/dedupe videos to one optimized encoding each
- [ ] `manualChunks` vendor split; lazy-load below-the-fold framer-motion + heavy widgets
- [ ] Remove dead heavy deps (`matter-js`, `three`+`@react-three/*`) and dead components

---
*Generated by a read-only enterprise production audit. No source code was modified and nothing was deleted. Runtime findings (e.g. live `NODE_ENV`) were observed read-only and reflect the state at audit time.*
