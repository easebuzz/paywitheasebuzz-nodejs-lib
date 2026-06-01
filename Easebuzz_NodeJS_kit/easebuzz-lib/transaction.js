/**
 * Transaction V2 API
 * Retrieve transaction details by txnid.
 *
 * Hash: key|txnid|SALT
 * Method: JSON POST to dashboard URL
 */

const utils = require('./utils');

module.exports = async function (postData, merchantKey, salt, env) {
  const params = utils._sanitizeParams(postData);

  // Validate
  const errors = utils._validateMandatoryFields(params, ['txnid']);
  if (errors.length > 0) {
    return { action: 'error', errors: errors };
  }

  // Build request
  const requestParams = {
    key: merchantKey,
    txnid: params.txnid,
  };

  // Generate hash
  requestParams.hash = utils.generateHashValue(requestParams, salt, 'transaction');

  // Call API (form-encoded POST)
  const baseUrl = utils.fetchBaseUrl(env, 'dashboard');
  const callUrl = baseUrl + 'transaction/v2/retrieve';
  const response = await utils._curlCall(callUrl, requestParams);

  return { action: 'response', data: response };
};
