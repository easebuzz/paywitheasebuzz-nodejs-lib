# location-href [![Build Status](https://travis-ci.org/bendrucker/location-href.svg?branch=master)](https://travis-ci.org/bendrucker/location-href)

> Simple Node-friendly interface to the browser's `location`


## Install

```
$ npm install --save location-href
```


## Usage

```js
var location = require('location-href')
location()
//=> http://the/current/location
location.set('http://new/location')
//=> browser transitions to new location
```

## API

#### `location()` -> `string`

Call to get the current location.

#### `location.set(href)` -> `undefined`

##### href

*Required*  
Type: `string`

The new location.


## License

MIT © [Ben Drucker](http://bendrucker.me)
