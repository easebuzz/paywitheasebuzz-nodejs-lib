var sha512 = require('js-sha512');
var util = require('./util.js');


let tranaction_date = function (data, config, res) {
  function checkArgumentValidation(data, config) {
    if (!(data.merchant_email.trim()) || !(util.validate_mail(data.merchant_email))) {
      res.json({
        "status": 0,
        "data": "Email validation failed. Please check and enter proper value for email",
      });
    }
    if (!(data.transaction_date.trim())) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter date can not empty",
      });
    }
  }

  function generateHash_transaction_date() {

    var hashstring = config.key + "|" + data.merchant_email + "|" + data.transaction_date;
    hashstring += "|" + config.salt;
    data.hash = sha512.sha512(hashstring);
    return (data.hash);
  }

  checkArgumentValidation(data, config);
  hash_key_transaction_date = generateHash_transaction_date();
  let form = {
    'merchant_key': config.key,
    'merchant_email': data.merchant_email,
    'transaction_date': data.transaction_date,
    'hash': hash_key_transaction_date,
  }
  base_url = util.get_base_url(config.env);
  if (base_url !== '') {
    call_url = base_url + 'transaction/v1/retrieve/date';
    util.call(call_url, form).then(function (data) {
      return res.json(data);
    })
  } else {
    res.json({
      "status": 0,
      "message": "Enviroment not supported",
    })
  }

}

exports.tranaction_date = tranaction_date;