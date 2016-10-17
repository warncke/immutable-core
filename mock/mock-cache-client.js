'use strict'

var Mockumentary = require('mockumentary')
var Promise = require('bluebird')

// create cache client mock factory with default methods
var MockCacheClient = new Mockumentary({
    get: ()=> Promise.resolve(null),
    set: ()=> undefined,
    setex: ()=> undefined,
})

/* exports */
module.exports = MockCacheClient