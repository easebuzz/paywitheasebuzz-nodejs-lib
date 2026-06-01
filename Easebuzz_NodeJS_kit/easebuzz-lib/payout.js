/**
 * Payout (Settlement) API
 * Docs: https://docs.easebuzz.in/docs/payment-gateway/k0ynpfmhx3x0y-settlement-api
 *
 * Hash: merchant_key|start_date|end_date|SALT (merchant_email NOT in hash)
 * Method: JSON POST to dashboard URL
 * Endpoint: /settlements/v1/retrieve
 * Dates nested inside "payout_date" object
 */

const utils = require('./utils');

module.exports = async function (postData, merchantKey, salt, env) {
  const params = utils._sanitizeParams(postData);

  // Validate
  const errors = utils._validateMandatoryFields(params, ['start_date', 'end_date']);
  if (errors.length > 0) {
    return { action: 'error', errors: errors };
  }

  // Generate hash: merchant_key|start_date|end_date|SALT
  const hashData = {
    merchant_key: merchantKey,
    start_date: params.start_date,
    end_date: params.end_date
  };
  const hash = utils.generateHashValue(hashData, salt, 'payout');

  // Build JSON request body
  const requestBody = {
    merchant_key: merchantKey,
    hash: hash,
    payout_date: {
      start_date: params.start_date,
      end_date: params.end_date
    }
  };

  // Optional fields (flat, NOT inside payout_date)
  if (params.merchant_email && params.merchant_email.trim()) {
    requestBody.merchant_email = params.merchant_email;
  }
  if (params.sub_merchant_id && params.sub_merchant_id.trim()) {
    requestBody.sub_merchant_id = params.sub_merchant_id;
  }

  // Call API
  const baseUrl = utils.fetchBaseUrl(env, 'dashboard');
  const callUrl = baseUrl + 'settlements/v1/retrieve';
  const response = await utils._curlCallJson(callUrl, requestBody);

  return { action: 'response', data: response };
};
