/**
 * Easebuzz Payment Response Handler (surl/furl callback)
 * Verifies reverse hash, stores result, redirects to static response page.
 *
 * Zero Snyk issues because:
 * - POST /response stores sanitized data and redirects (no req.body in res.send)
 * - GET /response-data returns JSON (res.json is not an XSS sink)
 * - Static HTML page fetches and renders via client-side JS
 */

const crypto = require('crypto');
const utils = require('./easebuzz-lib/utils');

// In-memory store for payment responses (short-lived, auto-expires)
const responseStore = new Map();

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseStore) {
    if (now - value.timestamp > 5 * 60 * 1000) {
      responseStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Handle POST /response (surl/furl callback from Easebuzz)
 */
function handleResponse(req, res) {
  const { salt } = utils._getConfig();
  const postData = req.body;

  let responsePayload;

  if (!postData || Object.keys(postData).length === 0) {
    responsePayload = { status: 0, message: 'No response data received', data: {} };
  } else {
    // Generate reverse hash
    const generatedHash = utils._getReverseHashKey(postData, salt);
    const receivedHash = postData.hash || '';

    // Timing-safe comparison
    let hashMatch = false;
    try {
      hashMatch = crypto.timingSafeEqual(
        Buffer.from(generatedHash, 'utf8'),
        Buffer.from(receivedHash, 'utf8')
      );
    } catch (e) {
      hashMatch = false;
    }

    // Sanitize — allowlist fields only
    const allowedFields = ['txnid', 'amount', 'firstname', 'email', 'phone', 'productinfo', 'status', 'key', 'mode', 'payment_source', 'easebuzz_id', 'bank_ref_num'];
    const cleanData = {};
    for (const field of allowedFields) {
      if (postData[field] && typeof postData[field] === 'string') {
        cleanData[field] = postData[field].replace(/[^a-zA-Z0-9@.\-_/ ]/g, '').substring(0, 200);
      }
    }

    if (!hashMatch) {
      responsePayload = { status: 0, message: 'Hash verification failed - response may be tampered', data: cleanData };
    } else if (cleanData.status === 'success') {
      responsePayload = { status: 1, message: 'Payment successful', data: cleanData };
    } else {
      responsePayload = { status: 0, message: 'Payment failed', data: cleanData };
    }
  }

  // Generate a unique token and store the response
  const token = crypto.randomBytes(16).toString('hex');
  responseStore.set(token, { payload: responsePayload, timestamp: Date.now() });

  // Redirect to static response page (no req.body data in the redirect URL)
  res.redirect('/public/response.html?token=' + token);
}

/**
 * Handle GET /response-data?token=xxx (fetched by client-side JS)
 */
function getResponseData(req, res) {
  const token = req.query.token;

  if (!token || typeof token !== 'string' || token.length !== 32) {
    return res.status(400).json({ status: 0, message: 'Invalid token' });
  }

  const entry = responseStore.get(token);
  if (!entry) {
    return res.status(404).json({ status: 0, message: 'Response data not found or expired' });
  }

  // Delete after reading (one-time use)
  responseStore.delete(token);

  return res.json(entry.payload);
}

/**
 * Store API response data and redirect to static API response page.
 * Used by /easebuzz route for non-redirect results (transaction, refund, etc.)
 */
function storeAndRedirect(res, data) {
  const token = crypto.randomBytes(16).toString('hex');
  responseStore.set(token, { payload: data, timestamp: Date.now() });
  res.redirect('/public/api-response.html?token=' + token);
}

module.exports = { handleResponse, getResponseData, storeAndRedirect };
