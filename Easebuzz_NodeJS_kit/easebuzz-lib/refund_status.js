/**
 * Refund Status API
 * Check refund status by easebuzz_id.
 *
 * Hash: key|easebuzz_id|SALT
 * Method: Form-encoded POST to dashboard URL
 * Endpoint: /refund/v1/retrieve
 * Only 3 fields sent: key, easebuzz_id, hash
 */

const utils = require('./utils');

module.exports = async function (postData, merchantKey, salt, env) {
  const params = utils._sanitizeParams(postData);

  // Validate
  const errors = utils._validateMandatoryFields(params, ['easebuzz_id']);
  if (errors.length > 0) {
    return { action: 'error', errors: errors };
  }

  // Build request
  const requestParams = {
    key: merchantKey,
    easebuzz_id: params.easebuzz_id,
  };

  // Generate hash
  requestParams.hash = utils.generateHashValue(requestParams, salt, 'refund_status');

  // Optional: merchant_refund_id (not part of hash)
  if (params.merchant_refund_id && params.merchant_refund_id.trim() !== '') {
    requestParams.merchant_refund_id = params.merchant_refund_id;
  }

  // Call API (JSON POST)
  const baseUrl = utils.fetchBaseUrl(env, 'dashboard');
  const callUrl = baseUrl + 'refund/v1/retrieve';
  const response = await utils._curlCallJson(callUrl, requestParams);

  return { action: 'response', data: response };
};
