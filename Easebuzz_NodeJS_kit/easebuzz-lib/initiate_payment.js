/**
 * Initiate Payment API (Hosted Checkout)
 * Docs: https://docs.easebuzz.in/docs/payment-gateway/8ec545c331e6f-initiate-payment-api
 *
 * Calls _callInitiatePaymentAPI → redirects user to Easebuzz payment page.
 */

const utils = require('./utils');

module.exports = async function (postData, merchantKey, salt, env) {
  const params = utils._sanitizeParams(postData);

  // Call shared initiate payment function
  let result;
  try {
    result = await utils._callInitiatePaymentAPI(params, merchantKey, salt, env);
  } catch (err) {
    return { action: 'error', errors: [err.message || 'Initiate payment failed unexpectedly'] };
  }

  if (result.status === 1) {
    // Return access key — router builds the redirect URL from hardcoded base
    return { action: 'redirect', data: result.data };
  } else {
    // Return error — could be validation errors or API failure
    const errors = result.errors || [result.data || 'Initiate payment failed'];
    return { action: 'error', errors: errors };
  }
};
