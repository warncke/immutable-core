'use strict'

/* application modules */
const requireValidName = require('./require-valid-name')

/* public functions */
module.exports = getValidSignature

/**
 * @function getValidSignature
 *
 * validate method signature (e.g. 'ModuleName.methodName') and return
 * object with parsed out methodName, moduleName, and signature
 *
 * @param {string} signature
 *
 * @returns {object}
 *
 * @throws on invalid signature
 */
 function getValidSignature (signature) {
    // require string
    if (typeof signature !== 'string') {
        throw new Error('signature must be string')
    }
    // split signature into moduleName and methodName
    var parts = signature.split('.')
    // require two parts
    if (parts.length !== 2) {
        throw new Error('invalid signature '+signature)
    }
    // module name is first part
    var moduleName = parts[0]
    // method name is second part
    var methodName = parts[1]
    // require names to be valid
    requireValidName(moduleName)
    requireValidName(methodName)
    // return module and function name
    return {
        signature: signature,
        methodName: methodName,
        moduleName: moduleName,
    }
}