var sha512 = require('js-sha512');
var util = require('./util.js');

let payout = function (data, config, res) {

  function checkArgumentValidation(data, config) {
   
    if (!(data.merchant_email.trim()) || !(util.validate_mail(data.merchant_email))) {
      res.json({
        "status": 0,
        "data": "Email validation failed. Please check and enter proper value for mail"
      });
    }
    if (!(data.payout_date.trim())) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter payout_date can not empty"
      });
    }
  }

  function generateHash_payout() {
    var hashstring = config.key + "|" + data.merchant_email + "|" + data.payout_date;
    hashstring += "|" + config.salt;
    hash_key_payout = sha512.sha512(hashstring);
    return (hash_key_payout);
  }

  hash_key_payout = generateHash_payout();

  let form = {
    'merchant_key': config.key,
    'merchant_email': data.merchant_email,
    'payout_date': data.payout_date,
    'hash': hash_key_payout,
  }

  checkArgumentValidation(data, config);
  base_url = util.get_base_url(config.env);
  if (base_url !== '') {
    call_url = base_url + "payout/v1/retrieve";
    util.call(call_url, form).then(function (data) {
      return res.json(data);
    })
  } else {
    res.json({
      "status": 0,
      "message": "Environment not supported"
    })
  }


}

exports.payout = payout;