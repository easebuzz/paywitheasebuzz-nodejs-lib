/**
 * Transaction Date V2 API
 * Retrieve transactions by date range.
 *
 * Hash: key|merchant_email|start_date|end_date|SALT
 * Method: JSON POST to dashboard URL
 * Dates nested inside "date_range" object
 */

const utils = require('./utils');

module.exports = async function (postData, merchantKey, salt, env) {
  const params = utils._sanitizeParams(postData);

  // Validate
  const errors = utils._validateMandatoryFields(params, ['start_date', 'end_date']);
  if (errors.length > 0) {
    return { action: 'error', errors: errors };
  }

  // Prepare hash data (merchant_email included even if empty)
  const hashData = {
    key: merchantKey,
    merchant_email: (params.merchant_email && params.merchant_email.trim()) ? params.merchant_email : '',
    start_date: params.start_date,
    end_date: params.end_date
  };

  // Generate hash: key|merchant_email|start_date|end_date|SALT
  const hash = utils.generateHashValue(hashData, salt, 'transaction_date');

  // Build JSON request body with nested date_range
  const requestBody = {
    key: merchantKey,
    hash: hash,
    date_range: {
      start_date: params.start_date,
      end_date: params.end_date
    }
  };

  // Add merchant_email only if provided
  if (params.merchant_email && params.merchant_email.trim()) {
    requestBody.merchant_email = params.merchant_email;
  }

  // Call API (JSON POST)
  const baseUrl = utils.fetchBaseUrl(env, 'dashboard');
  const callUrl = baseUrl + 'transaction/v2/retrieve/date';

  const response = await utils._curlCallJson(callUrl, requestBody);

  return { action: 'response', data: response };
};
