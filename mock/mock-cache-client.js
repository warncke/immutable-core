'use strict'

var Mockumentary = require('mockumentary')

// create cache client mock factory with default methods
var MockCacheClient = new Mockumentary({
    get: ()=> null,
    set: ()=> undefined,
    setex: ()=> undefined,
})

/* exports */
module.exports = MockCacheClient