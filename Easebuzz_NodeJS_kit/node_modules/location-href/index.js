'use strict'

var location = require('global/window').location || {href: ''}

module.exports = getLocation

getLocation.set = setLocation

function getLocation () {
  return location.href
}

function setLocation (href) {
  location.href = href
}
