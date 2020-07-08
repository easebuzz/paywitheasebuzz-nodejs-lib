var sha512 = require('js-sha512');
var util = require('./util.js');

let transaction = function (data, config, res) {

  function isFloat(amt) {
    var regexp = /^\d+\.\d{1,2}$/;
    return regexp.test(amt)
  }

  function checkArgumentValidation(req, config) {
    if (data.phone.toString().length != 10) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter Phone can not empty and must contain 10 digits"
      });
    }

    if (!data.txnid.trim()) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter txnid can not empty"
      });
    }
    if (!(data.amount.trim()) || !(isFloat(data.amount))) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter amount can not empty and must be in decimal "
      });
    }
    if (!(data.phone.trim())) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter Phone can not empty"
      });
    }
    if (!(data.email.trim()) || !(util.validate_mail(data.email))) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter email can not empty"
      });
    }
  }

  function generateHash_transaction() {
    var hashstring = config.key + "|" + data.txnid + "|" + data.amount + "|" + data.email + "|" + data.phone + "|" + config.salt;
    hash_key = sha512.sha512(hashstring);
    return (hash_key);
  }

  //main run from here

  checkArgumentValidation(data, config);
  let form = {
    'key': config.key,
    'txnid': data.txnid,
    'amount': data.amount,
    'email': data.email,
    'phone': data.phone,
    'hash': generateHash_transaction(),
  }
  let base_url = util.get_base_url(config.env);
  if (base_url !== "") {
    let call_url = base_url + "transaction/v1/retrieve";
    util.call(call_url, form).then(function (data) {
      return res.json(data);
    });
  } else {
    res.json({
      "message": "Environment not supported",
      "status": 0
    })
  }
}

exports.transaction = transaction;