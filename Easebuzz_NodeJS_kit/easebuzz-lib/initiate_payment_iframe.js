/**
 * Initiate Payment iFrame API
 * Returns JSON with access_key for Easebuzz Checkout SDK.
 *
 * Calls _callInitiatePaymentAPI → returns JSON {key, access_key, baseUrl, env}.
 */

const utils = require('./utils');

module.exports = async function (postData, merchantKey, salt, env) {
  const params = utils._sanitizeParams(postData);

  // Call shared initiate payment function
  const result = await utils._callInitiatePaymentAPI(params, merchantKey, salt, env);

  if (result.status === 1) {
    return {
      action: 'json',
      data: {
        status: 1,
        data: {
          key: merchantKey,
          access_key: result.data,
          baseUrl: result.baseUrl,
          env: env
        }
      }
    };
  } else {
    return {
      action: 'json',
      data: {
        status: 0,
        data: result.errors ? result.errors.join(', ') : (result.data || 'Failed')
      }
    };
  }
};
