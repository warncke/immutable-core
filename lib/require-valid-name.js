'use strict'

/* npm libraries */
var _ = require('lodash')

/* public functions */
module.exports = requireValidName

/* global variables */
const reservedNames = [
    'bind',
    'cache',
    'meta',
    'method',
    'module',
]

/**
 * @function requireValidName
 *
 * throw error if name (function or module) is invalid
 *
 * @param {string} name
 *
 * @returns {undefined}
 *
 * @throws {Error} on invalid name
 */
function requireValidName (name) {
    // require a non-zero length string for name
    if (!(name && typeof name === 'string' && name.length > 0)) {
        throw new Error('name error: name must be string with non-zero length')
    }
    // do not allow dot in name
    if (name.indexOf('.') !== -1) {
        throw new Error('name error: name may not contain dot (.)')
    }
    // check if name is reserved
    var index = _.indexOf(reservedNames, name)
    // do not allow reserved names
    if (index !== -1) {
        throw new Error('name error: '+reservedNames[index]+' is a reserved name')
    }
}