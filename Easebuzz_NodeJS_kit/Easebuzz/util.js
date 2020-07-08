let curl_call = function (url, data, method = 'POST') {

  var request = require('request');
  var options = {
    'method': method,
    'url': url,
    'headers': {
      'Content-Type': 'application/x-www-form-urlencoded'
    },

    form: data,
  };
  return new Promise(function (resolve, reject) {
    request(options, function (error, response) {
      if (response) {
        var data = JSON.parse(response.body)
        return resolve(data);
      } else
        return reject(error);
    })
  })
}


let validate_email = function (mail) {
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail)) {
    return true;
  }
  return true;
}

let validate_phone = function (number) {
  if ((number.length === 10)) {
    return false;
  }

  return true;
}
let generateHash = function (data, config) {

  var hashstring = config.key + "|" + data.txnid + "|" + data.amount + "|" + data.productinfo + "|" + data.name + "|" + data.email +
    "|" + data.udf1 + "|" + data.udf2 + "|" + data.udf3 + "|" + data.udf4 + "|" + data.udf5 + "|" + data.udf6 + "|" + data.udf7 + "|" + data.udf8 + "|" + data.udf9 + "|" + data.udf10;
  hashstring += "|" + config.salt;
  data.hash = sha512.sha512(hashstring);
  return (data.hash);
}

let validate_float = function (number) {
  return parseFloat(number) === number
}

function get_query_url(env) {
  let url_link = '';
  if (env == 'prod') {
    url_link = "https://dashboard.easebuzz.in/";
  }

  return url_link;
}


exports.validate_mail = validate_email;
exports.validate_phone = validate_phone;
exports.generateHash = generateHash;
exports.validate_float = validate_float;
exports.call = curl_call;
exports.get_base_url = get_query_url;