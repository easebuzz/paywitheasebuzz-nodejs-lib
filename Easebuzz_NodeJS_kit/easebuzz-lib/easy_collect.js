/**
 * Easy Collect API
 * Docs: https://docs.easebuzz.in/docs/payment-gateway/xnp0bvcy0ywmn-easy-collect
 *
 * Hash: key|merchant_txn|name|email|phone|amount|udf1|udf2|udf3|udf4|udf5|message|SALT
 * Method: JSON POST to dashboard URL
 * Endpoint: /easycollect/v1/create
 * Boolean fields must be actual booleans, not strings
 * Operation (notification channels) is an array of objects
 */

const utils = require('./utils');

module.exports = async function (postData, merchantKey, salt, env) {
  const params = utils._sanitizeParams(postData);

  // Validate
  const errors = utils._validateMandatoryFields(params, ['name', 'phone', 'amount']);
  if (errors.length > 0) {
    return { action: 'error', errors: errors };
  }

  // Add merchant key for hash
  params.key = merchantKey;

  // Generate hash using shared utility
  const hash = utils.generateHashValue(params, salt, 'easy_collect');

  // Build JSON request body
  const requestBody = {
    key: merchantKey,
    hash: hash,
    name: params.name,
    phone: params.phone,
    amount: params.amount
  };

  // Optional string fields
  ['email', 'merchant_txn', 'message', 'udf1', 'udf2', 'udf3', 'udf4', 'udf5',
   'expiry_date', 'split_percentage', 'split_payments', 'sub_merchant_id'].forEach(field => {
    if (params[field] && params[field].trim() !== '') {
      requestBody[field] = params[field];
    }
  });

  // Boolean fields — pass as string
  ['update', 'accept_partial_payment'].forEach(field => {
    if (params[field] && params[field].trim() !== '') {
      requestBody[field] = params[field].trim();
    }
  });

  // Operation array — notification channels
  const operation = [];
  if (params.op_sms === 'on') {
    operation.push({ type: 'sms', template: 'Default sms template' });
  }
  if (params.op_email === 'on') {
    operation.push({ type: 'email', template: 'Default email template' });
  }
  if (params.op_whatsapp === 'on') {
    operation.push({ type: 'whatsapp', template: 'Default whatsapp template' });
  }
  if (operation.length > 0) {
    requestBody.operation = operation;
  }

  // Call API
  const baseUrl = utils.fetchBaseUrl(env, 'dashboard');
  const callUrl = baseUrl + 'easycollect/v1/create';
  const response = await utils._curlCallJson(callUrl, requestBody);

  return { action: 'response', data: response };
};
