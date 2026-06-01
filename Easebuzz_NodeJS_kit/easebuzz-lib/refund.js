/**
 * Refund V2 API
 * Docs: https://docs.easebuzz.in/docs/payment-gateway/c2ac48618b3bd-refund-api-v2
 *
 * Hash: key|merchant_refund_id|easebuzz_id|refund_amount|SALT
 * Method: JSON POST to dashboard URL
 */

const utils = require('./utils');

module.exports = async function (postData, merchantKey, salt, env) {
  const params = utils._sanitizeParams(postData);

  // Validate
  const errors = utils._validateMandatoryFields(params, ['easebuzz_id', 'refund_amount', 'merchant_refund_id']);
  if (errors.length > 0) {
    return { action: 'error', errors: errors };
  }

  // Build request
  const requestParams = {
    key: merchantKey,
    merchant_refund_id: params.merchant_refund_id,
    easebuzz_id: params.easebuzz_id,
    refund_amount: params.refund_amount,
  };

  // Generate hash
  requestParams.hash = utils.generateHashValue(requestParams, salt, 'refund');

  // Optional fields
  ['udf1', 'udf2', 'udf3', 'udf4', 'udf5', 'udf6', 'udf7', 'split_payments'].forEach(field => {
    if (params[field] && params[field].trim() !== '') {
      requestParams[field] = params[field];
    }
  });

  // Call API (form-encoded POST)
  const baseUrl = utils.fetchBaseUrl(env, 'dashboard');
  const callUrl = baseUrl + 'transaction/v2/refund';
  const response = await utils._curlCall(callUrl, requestParams);

  return { action: 'response', data: response };
};
