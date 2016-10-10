'use strict'

/* npm libraries */
var _ = require('lodash')

/* public functions */
module.exports = requireValidCacheClient

/* global variables */
const requireMethods = [
    'get',
    'set',
    'setex',
]

/**
 * @function requireValidCacheClient
 *
 * throw error if cacheClient object does not expose methods:
 *     - get(key, session)
 *     - set(key, value, session)
 *     - setex(key, value, exp, session)
 *
 * @param {object} cacheClient
 *
 * @returns {undefined}
 *
 * @throws {Error} on invalid name
 */
function requireValidCacheClient (cacheClient) {
    // require object for cache client
    if (!cacheClient || typeof cacheClient !== 'object') {
        throw new Error('cacheClient error: cacheClient must be object')
    }
    // check for all required methods
    _.each(requireMethods, method => {
        if (typeof cacheClient[method] !== 'function') {
            throw new Error ('cacheClient error: cacheClient must provied '+method+' method')
        }
    })
}