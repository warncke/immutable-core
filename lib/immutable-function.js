'use strict'

/* npm modules */
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const stableId = require('stable-id')
const uglifyJs = require('uglify-js')

/* exports */
module.exports = ImmutableFunction

/**
 * @function ImmutableFunction
 *
 * create and return new immutable function
 *
 * @param {string} functionName
 * @param {function} functionObj
 * @param {object} options
 *
 * @returns {function}
 *
 * @throws {Error}
 */
function ImmutableFunction (functionName, functionObj, options) {
    // require options to be an object
    options = requireValidOptionalObject(options)
    // get function definition - append assignment for uglify
    var functionBody = 'var x='+functionObj.toString()
    // throw error if function is native
    if (functionBody.substr(functionBody.length - 17) === '{ [native code] }') {
        throw new Error('function error: cannot wrap native function')
    }
    // use uglify to strip out whitespace and comments but do not modify code
    functionBody = uglifyJs.minify(functionBody, {
        compress: false,
        fromString: true,
        mangle: false,
    }).code
    // chop off var x= at beginning and ; at end
    functionBody = functionBody.substr(6, functionBody.length-7)
    // create function meta data
    var functionMeta = {
        functionBody: functionBody,
        functionName: functionName,
        functionId: stableId(functionBody),
        logClient: options.logClient,
    }
    // create wrapper function that will do logging and call original
    var functionWrapperFunction = function functionWrapperFunction () {
        // call original function - catching errors for logging
        try {
            var res = functionObj.apply(this, arguments)
        }
        catch (error) {
            var err = error
        }
        // if log client then do logging
        if (options.logClient) {
            // get number of arguments
            var argsLength = arguments.length
            // copy of arguments
            var args = []
            // create copy of arguments
            for (var i=0; i < argsLength; i++) {
                args[i] = arguments[i]
            }
            // log call
            options.logClient.log('functionCall', {
                functionName: functionName,
                args: args,
                res: err || res,
                isError: (err ? true : false),
                moduleCallId: (this ? this.moduleCallId : undefined),
                requestId: (this ? this.requestId : undefined),
            })
        }
        // if result was an error then throw original error
        if (err) {
            throw err
        }
        // otherwise return original result
        else {
            return res
        }
    }
    // attach meta data to function
    functionWrapperFunction.meta = functionMeta
    // return wrapper function
    return functionWrapperFunction
}