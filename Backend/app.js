const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const compression = require('compression');
const logger = require('./utils/logger');
const tracing = require('./middleware/tracing');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { isAuthenticatedUser, authorizeRoles } = require('./middleware/authMiddleware');
const bullBoardAdapter = require('./utils/bullBoard');

const app = express();

// Trust the first upstream proxy (nginx). Without this, Express ignores
// X-Forwarded-Proto, so req.protocol is always "http" even on HTTPS requests.
// This means URLs built with req.protocol (e.g. avatar uploads) get stored
// as http:// and the browser blocks them as mixed content from the HTTPS page.
app.set('trust proxy', 1);

// Request Tracing (Request IDs & Performance Logging)
app.use(tracing);

// Compress responses
app.use(compression());

// Morgan Stream for Winston
const stream = {
  write: (message) => logger.http(message.trim()),
};

// Morgan Middleware
app.use(morgan(
  ':method :url :status - :response-time ms - IP: :remote-addr - User: :userId - RID: :requestId',
  { stream }
));

// Custom Morgan Tokens
morgan.token('userId', (req) => req.user ? req.user.id : 'Guest');
morgan.token('requestId', (req) => req.id);

// Set security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Bull Board Dashboard (Protected)
app.use('/api/v1/admin/queues', isAuthenticatedUser, authorizeRoles('admin'), bullBoardAdapter.getRouter());

// Rate limiting (Login route only for strict brute force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
});
app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1/auth/admin-login', loginLimiter);

// Strict rate limiting for OTP routes to prevent SMS/Email bombing
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit to 5 OTP requests per IP per window
  message: 'Too many OTP requests from this IP, please try again after 15 minutes',
});
app.use('/api/v1/auth/forgot-password', otpLimiter);
app.use('/api/v1/auth/resend-otp', otpLimiter);

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 200, 
  message: 'Too many requests from this IP, please try again later',
});
app.use('/api', generalLimiter);

// CORS — FRONTEND_URL is a comma-separated allowlist so dev (5173 / 3000 / 8083)
// and prod (Cloudflare Workers domain) can share one env var.
// credentials:true is required for the httpOnly JWT cookie set by utils/jwtToken.js.
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, cb) {
    // Allow same-origin / curl / server-to-server (no Origin header).
    if (!origin) return cb(null, true);
    // In development, accept any origin so the app works whether it's opened
    // via localhost, a LAN IP, or the machine's public IP (e.g. a cloud VM).
    if (process.env.NODE_ENV === 'development') return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({
  limit: '10kb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Static folder for uploads. Invoice/receipt PDFs are forced to download with
// a clean filename (Content-Disposition: attachment) so the email + mobile
// "Download Invoice/Receipt" links actually save the file instead of opening an
// inline preview that some mobile/in-app browsers fail to render.
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}invoices${path.sep}`) && filePath.endsWith('.pdf')) {
        const base = path.basename(filePath);
        const niceName = base.startsWith('receipt') ? 'Soliva-Receipt.pdf' : 'Soliva-Invoice.pdf';
        res.setHeader('Content-Disposition', `attachment; filename="${niceName}"`);
      }
    },
  })
);

// Custom data sanitization against NoSQL query injection & XSS for Express 5 compatibility
const sanitizeObject = (obj) => {
  if (obj instanceof Object) {
    for (let key in obj) {
      if (/^\$/.test(key)) {
        delete obj[key];
        continue;
      }
      if (typeof obj[key] === 'string') {
        // basic XSS replacement
        obj[key] = obj[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  // Skipped req.query because it is read-only in Express 5.
  next();
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const profileRoutes = require('./routes/profileRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const systemRoutes = require('./routes/systemRoutes');
const contactRoutes = require('./routes/contactRoutes');

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/contact', contactRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Soliva API is running...');
});

// Error Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;