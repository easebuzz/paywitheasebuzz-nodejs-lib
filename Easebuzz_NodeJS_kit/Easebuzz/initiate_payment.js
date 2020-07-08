var util = require('./util.js');

var sha512 = require('js-sha512');

let initiate_payment = function (data, config, res) {

  function isFloat(amt) {
    var regexp = /^\d+\.\d{1,2}$/;
    return regexp.test(amt)
  }


  function checkArgumentValidation(data, config) {

    if (!data.name.trim()) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter name can not empty"
      });
    }
    if (!(data.amount.trim()) || !(isFloat(data.amount))) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter amount can not empty and must be in decimal "
      });
    }
    if (!(data.txnid.trim())) {
      res.json({
        "status": 0,
        "data": "Merchant Transaction validation failed. Please enter proper value for merchant txn"
      });
    }
    if (!(data.email.trim()) || !(util.validate_mail(data.email))) {
      res.json({
        "status": 0,
        "data": "Email validation failed. Please enter proper value for email"
      });
    }
    if (!(data.phone.trim()) || util.validate_phone(data.phone)) {
      res.json({
        "status": 0,
        "data": "Phone validation failed. Please enter proper value for phone"
      });
    }
    if (!(data.productinfo.trim())) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter Product info cannot be empty"
      });
    }
    if (!(data.surl.trim()) || !(data.furl.trim())) {
      res.json({
        "status": 0,
        "data": "Mandatory Parameter Surl/Furl cannot be empty"
      });
    }
  }

  function geturl(env) {
    if (env == 'test') {
      url_link = "https://testpay.easebuzz.in/";

    } else if (env == 'prod') {
      url_link = 'https://pay.easebuzz.in/';
    } else {
      url_link = "https://testpay.easebuzz.in/";
    }
    return url_link;
  }

  function form() {
    form = {
      'key': config.key,
      'txnid': data.txnid,
      'amount': data.amount,
      'email': data.email,
      'phone': data.phone,
      'firstname': data.name,
      'udf1': data.udf1,
      'udf2': data.udf2,
      'udf3': data.udf3,
      'udf4': data.udf4,
      'udf5': data.udf5,
      'hash': hash_key,
      'productinfo': data.productinfo,
      'udf6': data.udf6,
      'udf7': data.udf7,
      'udf8': data.udf8,
      'udf9': data.udf9,
      'udf10': data.udf10,
      'furl': data.furl, //'http://localhost:3000/response',
      'surl': data.surl, //'http://localhost:3000/response'
    }
    if (data.unique_id != '') {
      form.unique_id = data.unique_id
    }


    if (data.split_payments != '') {
      form.split_payments = data.split_payments
    }

    if (data.sub_merchant_id != '') {
      form.sub_merchant_id = data.sub_merchant_id
    }

    if (data.customer_authentication_id != '') {
      form.customer_authentication_id = data.customer_authentication_id
    }

    return form;
  }

  // main calling part is below

  checkArgumentValidation(data, config);
  var hash_key = generateHash();
  payment_url = geturl(config.env);
  call_url = payment_url + 'payment/initiateLink';
  util.call(call_url, form()).then(function (response) {
    pay(response.data, payment_url)
  });


  function pay(access_key, url_main) {
    
    if (config.enable_iframe==0) {
      var url = url_main + 'pay/' + access_key;
      return res.redirect(url);
    } else {

      res.render("enable_iframe.html", {
        'key': config.key,
        'access_key': access_key
      });

    }
  }


  function generateHash() {

    var hashstring = config.key + "|" + data.txnid + "|" + data.amount + "|" + data.productinfo + "|" + data.name + "|" + data.email +
      "|" + data.udf1 + "|" + data.udf2 + "|" + data.udf3 + "|" + data.udf4 + "|" + data.udf5 + "|" + data.udf6 + "|" + data.udf7 + "|" + data.udf8 + "|" + data.udf9 + "|" + data.udf10;
    hashstring += "|" + config.salt;
    data.hash = sha512.sha512(hashstring);
    return (data.hash);
  }

}

exports.initiate_payment = initiate_payment;