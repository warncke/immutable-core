'use strict'

/* npm libraries */
const _ = require('lodash')

/* public functions */
module.exports = requireValidName

/* global variables */
const reservedNames = {
    assert: true,
    bind: true,
    cache: true,
    data: true,
    error: true,
    meta: true,
    method: true,
    module: true,
}

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
    if (name.includes('.')) {
        throw new Error('name error: name may not contain dot (.)')
    }
    // do not allow reserved names
    if (reservedNames[name]) {
        throw new Error(`name error: ${name} is a reserved name`)
    }
}