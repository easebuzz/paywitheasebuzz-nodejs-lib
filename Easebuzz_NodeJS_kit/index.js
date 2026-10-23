/**
 * Easebuzz Payment Gateway - Node.js Integration Kit
 *
 * Install: npm install
 * Run:     node index.js
 * URL:     http://localhost:3000
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const utils = require('./easebuzz-lib/utils');
const { handleResponse, getResponseData, storeAndRedirect } = require('./response');

const app = express();
const PORT = 3000;

// ─── Security Middleware ───

// Helmet sets secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://ebz-static.s3.ap-south-1.amazonaws.com', 'https://ajax.googleapis.com'],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://pay.easebuzz.in', 'https://testpay.easebuzz.in', 'https://*.easebuzz.in'],
      frameSrc: ["'self'", 'https://pay.easebuzz.in', 'https://testpay.easebuzz.in', 'https://*.easebuzz.in'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'", 'https://pay.easebuzz.in', 'https://testpay.easebuzz.in']
    }
  },
  crossOriginEmbedderPolicy: false
}));


// Rate limiting — prevent brute force and DoS attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// ─── Middleware ───
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.json({ limit: '1mb' }));

// ─── Static Files ───
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/views', express.static(path.join(__dirname, 'views')));

// ─── Routes ───

// Home page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Hardcoded redirect URLs — prevents open redirect
const REDIRECT_URLS = {
  test: 'https://testpay.easebuzz.in/pay/',
  prod: 'https://pay.easebuzz.in/pay/'
};

// API Router — all API calls go through POST /easebuzz?api_name=xxx
app.post('/easebuzz', apiLimiter, async (req, res) => {
  const apiName = req.query.api_name || req.body.api_name;
  const { merchantKey, salt, env } = utils._getConfig();

  if (!merchantKey || !salt) {
    return storeAndRedirect(res, { status: 0, message: 'Merchant key or salt not configured. Please check your .env file.' });
  }

  const apiHandlers = {
    'initiate_payment': './easebuzz-lib/initiate_payment',
    'initiate_payment_iframe': './easebuzz-lib/initiate_payment_iframe',
    'transaction': './easebuzz-lib/transaction',
    'transaction_date': './easebuzz-lib/transaction_date',
    'refund': './easebuzz-lib/refund',
    'refund_status': './easebuzz-lib/refund_status',
    'payout': './easebuzz-lib/payout',
    'easy_collect': './easebuzz-lib/easy_collect'
  };

  if (!apiHandlers[apiName]) {
    return storeAndRedirect(res, { status: 0, message: 'Unknown API' });
  }

  try {
    const handler = require(apiHandlers[apiName]);
    const result = await handler(req.body, merchantKey, salt, env);

    // Handle result based on action type
    if (result.action === 'redirect') {
      // Redirect to Easebuzz payment page using hardcoded base URL + access key
      const accessKey = String(result.data || '');
      if (!accessKey) {
        return storeAndRedirect(res, { status: 0, message: 'Failed to get access key from Easebuzz API' });
      }
      const baseRedirect = REDIRECT_URLS[env] || REDIRECT_URLS.test;
      return res.redirect(baseRedirect + encodeURIComponent(accessKey));
    }

    if (result.action === 'json') {
      return res.json(result.data);
    }

    if (result.action === 'response') {
      return storeAndRedirect(res, result.data);
    }

    if (result.action === 'error') {
      const errors = [];
      if (Array.isArray(result.errors) && result.errors.length > 0) {
        result.errors.forEach(e => {
          errors.push(String(e).substring(0, 200));
        });
      } else if (result.data) {
        errors.push(String(result.data).substring(0, 500));
      } else {
        errors.push('An error occurred');
      }
      return storeAndRedirect(res, { status: 0, message: errors.join(', '), errors: errors });
    }

    return storeAndRedirect(res, { status: 0, message: 'Unknown response type' });
  } catch (error) {
    console.error('API Error:', error);
    return storeAndRedirect(res, { status: 0, message: 'An error occurred while processing the request' });
  }
});

// Payment response callback (surl/furl) — stores result and redirects to static page
app.post('/response', apiLimiter, (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  handleResponse(req, res);
});

// Response data endpoint — client-side JS fetches this
app.get('/response-data', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  getResponseData(req, res);
});

// ─── Start Server ───
const HOST = process.env.HOST || '127.0.0.1';
app.listen(PORT, HOST, () => {
  console.log(`Easebuzz Node.js Kit running at http://${HOST}:${PORT}`);
});
