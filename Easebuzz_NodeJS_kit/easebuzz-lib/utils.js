/**
 * Easebuzz Payment Gateway - Shared Utility Functions
 *
 * Contains all shared logic used by API handlers:
 * - Configuration & environment
 * - URL resolution (test/prod)
 * - Hash generation (SHA-512) per API
 * - Reverse hash verification
 * - Card encryption (AES-256-CBC)
 * - Input sanitization & validation
 * - Shared Initiate Payment API call
 * - HTTP helpers (form-encoded and JSON)
 */

const { sha512 } = require('js-sha512');
const axios = require('axios');

// ─── Configuration ───

/**
 * Get merchant configuration from environment variables.
 */
function _getConfig() {
  return {
    merchantKey: process.env.EASEBUZZ_MERCHANT_KEY || '',
    salt: process.env.EASEBUZZ_SALT || '',
    env: process.env.EASEBUZZ_ENV || process.env.ENV || 'test'
  };
}

// ─── URL Resolution ───

/**
 * Get base URL based on environment.
 * @param {string} env - 'test' or 'prod'
 * @param {string} apiName - 'initiate_api' for pay domain, 'dashboard' for dashboard domain
 */
function fetchBaseUrl(env, apiName = 'dashboard') {
  if (apiName === 'initiate_api') {
    return env === 'prod'
      ? 'https://pay.easebuzz.in/'
      : 'https://testpay.easebuzz.in/';
  }
  return env === 'prod'
    ? 'https://dashboard.easebuzz.in/'
    : 'https://testdashboard.easebuzz.in/';
}

// ─── Hash Generation ───

/**
 * Generate SHA-512 hash for API authentication.
 * Each API has a different hash sequence.
 */
function generateHashValue(posted, saltKey, apiName) {
  let hashSequence = '';

  switch (apiName) {
    // key|txnid|amount|productinfo|firstname|email|udf1|...|udf7|||SALT
    case 'initiate_payment':
      hashSequence = [
        posted.key || '',
        posted.txnid || '',
        posted.amount || '',
        posted.productinfo || '',
        posted.firstname || '',
        posted.email || '',
        posted.udf1 || '',
        posted.udf2 || '',
        posted.udf3 || '',
        posted.udf4 || '',
        posted.udf5 || '',
        posted.udf6 || '',
        posted.udf7 || '',
        posted.udf8 || '',
        posted.udf9 || '',
        posted.udf10 || ''
      ].join('|') + '|' + saltKey;
      break;

    // key|txnid|SALT
    case 'transaction':
      hashSequence = [
        posted.key || '',
        posted.txnid || ''
      ].join('|') + '|' + saltKey;
      break;

    // key|merchant_email|start_date|end_date|SALT
    case 'transaction_date':
      hashSequence = [
        posted.key || '',
        posted.merchant_email || '',
        posted.start_date || '',
        posted.end_date || ''
      ].join('|') + '|' + saltKey;
      break;

    // key|merchant_refund_id|easebuzz_id|refund_amount|SALT
    case 'refund':
      hashSequence = [
        posted.key || '',
        posted.merchant_refund_id || '',
        posted.easebuzz_id || '',
        posted.refund_amount || ''
      ].join('|') + '|' + saltKey;
      break;

    // key|easebuzz_id|SALT
    case 'refund_status':
      hashSequence = [
        posted.key || '',
        posted.easebuzz_id || ''
      ].join('|') + '|' + saltKey;
      break;

    // merchant_key|start_date|end_date|SALT
    case 'payout':
      hashSequence = [
        posted.merchant_key || '',
        posted.start_date || '',
        posted.end_date || ''
      ].join('|') + '|' + saltKey;
      break;

    // key|merchant_txn|name|email|phone|amount|udf1|udf2|udf3|udf4|udf5|message|SALT
    case 'easy_collect':
      hashSequence = [
        posted.key || '',
        posted.merchant_txn || '',
        posted.name || '',
        posted.email || '',
        posted.phone || '',
        posted.amount || '',
        posted.udf1 || '',
        posted.udf2 || '',
        posted.udf3 || '',
        posted.udf4 || '',
        posted.udf5 || '',
        posted.message || ''
      ].join('|') + '|' + saltKey;
      break;

    default:
      return '';
  }

  return sha512(hashSequence).toLowerCase();
}

/**
 * Verify reverse hash from Easebuzz payment response (surl/furl callback).
 */
function _getReverseHashKey(responseArray, salt) {
  const hashSequence = [
    salt,
    responseArray.status || '',
    responseArray.udf10 || '',
    responseArray.udf9 || '',
    responseArray.udf8 || '',
    responseArray.udf7 || '',
    responseArray.udf6 || '',
    responseArray.udf5 || '',
    responseArray.udf4 || '',
    responseArray.udf3 || '',
    responseArray.udf2 || '',
    responseArray.udf1 || '',
    responseArray.email || '',
    responseArray.firstname || '',
    responseArray.productinfo || '',
    responseArray.amount || '',
    responseArray.txnid || '',
    responseArray.key || ''
  ].join('|');

  return sha512(hashSequence).toLowerCase();
}

// ─── Sanitization & Validation ───

/**
 * Trim all string values in a params object and enforce max length.
 */
function _sanitizeParams(params) {
  const sanitized = {};
  const MAX_FIELD_LENGTH = 500;
  for (const key in params) {
    if (typeof params[key] === 'string') {
      sanitized[key] = params[key].trim().substring(0, MAX_FIELD_LENGTH);
    } else {
      sanitized[key] = params[key];
    }
  }
  return sanitized;
}

/**
 * Validate email format.
 * Uses a simple, non-backtracking regex to avoid ReDoS.
 */
function _validateEmail(email) {
  if (!email || email.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return re.test(email);
}

/**
 * Validate mandatory fields for Initiate Payment / Seamless Payment.
 */
function _validateInitiatePaymentParams(params) {
  const errors = [];
  const mandatory = ['txnid', 'amount', 'firstname', 'email', 'phone', 'productinfo', 'surl', 'furl'];

  mandatory.forEach(field => {
    if (!params[field] || !params[field].toString().trim()) {
      errors.push(`${field} is required`);
    }
  });

  if (params.email && !_validateEmail(params.email)) {
    errors.push('Invalid email format');
  }

  if (params.amount) {
    const amt = parseFloat(params.amount);
    if (isNaN(amt) || amt < 1) {
      errors.push('Amount must be Greater or Equal to 1');
    }
  }

  if (params.phone) {
    const phoneRegex = /^(\+\d{1,4}[-]?)?\d{5,20}$/;
    if (!phoneRegex.test(params.phone)) {
      errors.push('Invalid phone number format');
    }
  }

  return errors;
}

/**
 * Validate that specified fields are non-empty.
 */
function _validateMandatoryFields(params, fields) {
  const errors = [];
  fields.forEach(field => {
    if (!params[field] || !params[field].toString().trim()) {
      errors.push(`${field} is required`);
    }
  });
  return errors;
}

// ─── Shared Initiate Payment API Call ───

/**
 * Shared function that validates, builds params, generates hash,
 * calls /payment/initiateLink, and returns {status, data: access_key}.
 * Used by: initiate_payment.js, initiate_payment_iframe.js, initiate_seamless_payment.js
 */
async function _callInitiatePaymentAPI(postData, merchantKey, salt, env) {
  // Validate
  const errors = _validateInitiatePaymentParams(postData);

  // TPV validation: if payment_category is TPV, account_no and ifsc are mandatory
  if (postData.payment_category && postData.payment_category.toUpperCase() === 'TPV') {
    if (!postData.account_no || !postData.account_no.trim()) {
      errors.push('account_no is required when payment_category is TPV');
    }
    if (!postData.ifsc || !postData.ifsc.trim()) {
      errors.push('ifsc is required when payment_category is TPV');
    }
  }

  if (errors.length > 0) {
    return { status: 0, errors: errors };
  }

  // Build payment params
  const paymentParams = {
    key: merchantKey,
    txnid: postData.txnid,
    amount: postData.amount,
    productinfo: postData.productinfo,
    firstname: postData.firstname,
    email: postData.email,
    phone: postData.phone,
    surl: postData.surl,
    furl: postData.furl,
    udf1: postData.udf1 || '',
    udf2: postData.udf2 || '',
    udf3: postData.udf3 || '',
    udf4: postData.udf4 || '',
    udf5: postData.udf5 || '',
    udf6: postData.udf6 || '',
    udf7: postData.udf7 || ''
  };

  // Optional fields
  const optionalFields = [
    'address1', 'address2', 'city', 'state', 'country', 'zipcode',
    'sub_merchant_id', 'unique_id', 'split_payments', 'show_payment_mode',
    'payment_category', 'account_no', 'ifsc', 'request_flow'
  ];
  optionalFields.forEach(field => {
    if (postData[field] && postData[field].trim() !== '') {
      paymentParams[field] = postData[field];
    }
  });

  // Generate hash
  const hashData = { ...paymentParams, udf8: '', udf9: '', udf10: '' };
  paymentParams.hash = generateHashValue(hashData, salt, 'initiate_payment');

  if (!paymentParams.hash) {
    return { status: 0, data: 'Hash generation failed' };
  }

  // Remove empty optional values but preserve mandatory fields
  const preserveFields = ['key', 'txnid', 'amount', 'productinfo', 'firstname', 'email', 'phone', 'surl', 'furl', 'hash'];
  Object.keys(paymentParams).forEach(key => {
    if (preserveFields.includes(key)) return; // never remove mandatory fields
    if (!paymentParams[key] || paymentParams[key].toString().trim() === '') {
      delete paymentParams[key];
    }
  });

  // Call Easebuzz Initiate Payment API
  const baseUrl = fetchBaseUrl(env, 'initiate_api');
  const callUrl = baseUrl + 'payment/initiateLink';

  let response;
  try {
    response = await _curlCall(callUrl, paymentParams);
  } catch (err) {
    return { status: 0, data: 'API call failed: ' + (err.message || 'Unknown error') };
  }

  if (response && response.status === 1 && response.data) {
    return { status: 1, data: response.data, baseUrl: baseUrl };
  } else {
    const errorMsg = (response && response.error_desc) || (response && response.data) || 'Initiate payment failed';
    return { status: 0, data: errorMsg, response: response };
  }
}

// ─── HTTP Helpers ───

/**
 * HTTP POST with form-encoded body.
 */
async function _curlCall(url, params) {
  try {
    const formData = new URLSearchParams();
    for (const key in params) {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        formData.append(key, params[key]);
      }
    }
    const response = await axios.post(url, formData.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 30000
    });
    if (typeof response.data === 'string') {
      try { return JSON.parse(response.data); } catch (e) {
        // If the response is not JSON, return it wrapped in an object
        return { status: 0, data: response.data };
      }
    }
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error('Cannot connect to Easebuzz API. Check your network connection.');
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('Request to Easebuzz API timed out. Please try again.');
    }
    throw new Error(error.message || 'HTTP request failed');
  }
}

/**
 * HTTP POST with JSON body.
 */
async function _curlCallJson(url, params) {
  try {
    // Remove empty params before sending
    const cleanedParams = {};
    for (const key in params) {
      if (params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        cleanedParams[key] = params[key];
      }
    }
    const response = await axios.post(url, cleanedParams, {
      headers: { 'Content-Type': 'application/json' },
      maxRedirects: 0,
      validateStatus: () => true,
      timeout: 30000
    });
    if (typeof response.data === 'string') {
      try { return JSON.parse(response.data); } catch (e) {
        return { status: 0, data: response.data };
      }
    }
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error('Cannot connect to Easebuzz API. Check your network connection.');
    }
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      throw new Error('Request to Easebuzz API timed out. Please try again.');
    }
    throw new Error(error.message || 'HTTP request failed');
  }
}

module.exports = {
  _getConfig,
  fetchBaseUrl,
  generateHashValue,
  _getReverseHashKey,
  _sanitizeParams,
  _validateEmail,
  _validateInitiatePaymentParams,
  _validateMandatoryFields,
  _callInitiatePaymentAPI,
  _curlCall,
  _curlCallJson
};
