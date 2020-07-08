var sha512 = require('js-sha512');
var util = require('./util.js');
let refund = function (data, config, res) {

    function isFloat(amt) {
      var regexp = /^\d+\.\d{1,2}$/;
      return regexp.test(amt)
    }

    function checkArgumentValidation(data, config) {
      if (!(data.merchant_email.trim()) || !(util.validate_mail(data.merchant_email))) {
          res.json({
            "status": 0,
            "data": "Mandatory Parameter email can not empty"
          });
        }
        if (!(data.phone.trim())) {
          res.json({
            "status": 0,
            "data": "Mandatory Parameter Phone can not empty"
          });
        }
        if (!(data.amount.trim()) || !(isFloat(data.amount))) {
          res.json({
            "status": 0,
            "data": "Mandatory Parameter amount can not empty and must be in decimal "
          });
        }
        if (!(data.refund_amount.trim()) || !(isFloat(data.refund_amount))) {
          res.json({
            "status": 0,
            "data": "Mandatory Parameter  refund amount can not empty and must be in decimal"
          });
        }

      }

      function generateHash_refund() {
        //"key|txnid|amount|refund_amount|email|phone";
        var hashstring = config.key + "|" + data.txnid + "|" + data.amount + "|" + data.refund_amount + "|" + data.merchant_email + "|" + data.phone + "|" + config.salt;
        hash_key = sha512.sha512(hashstring);
        return (hash_key);
      }

      checkArgumentValidation(data, config);
      hash_key_refund = generateHash_refund();
      let form = {
        'key': config.key,
        'txnid': data.txnid,
        'amount': data.amount,
        'refund_amount': data.refund_amount,
        'email': data.merchant_email,
        'phone': data.phone,
        'hash': hash_key_refund,
      }
      base_url = util.get_base_url(config.env);
      if (base_url !== '') {
        let refund_url = base_url + "transaction/v1/refund";
        util.call(refund_url, form).then(function (data) {
          return res.json(data);
        })
      } else {
        res.json({
          "message": "Environment not supported",
          "status": 0,
        })
      }

    }

    exports.refund = refund;