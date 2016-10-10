'use strict'

/* npm libraries */
var _ = require('lodash')

/* public functions */
module.exports = requireValidLogClient

/* global variables */
const requireMethods = [
    'error',
    'log',
]

/**
 * @function requireValidLogClient
 *
 * throw error if logClient object does not expose methods:
 *     - log(data, session)
 *     - error(data, session)
 *
 * @param {object} logClient
 *
 * @returns {undefined}
 *
 * @throws {Error} on invalid name
 */
function requireValidLogClient (logClient) {
    // require object for log client
    if (!logClient || typeof logClient !== 'object') {
        throw new Error('logClient error: logClient must be object')
    }
    // check for all required methods
    _.each(requireMethods, method => {
        if (typeof logClient[method] !== 'function') {
            throw new Error ('logClient error: logClient must provied '+method+' method')
        }
    })
}