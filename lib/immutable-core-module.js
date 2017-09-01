'use strict'

/* npm modules */
const Promise = require('bluebird')
const _ = require('lodash')
const defined = require('if-defined')
const immutableAI = require('immutable-ai')
const microTimestamp = require('micro-timestamp')
const randomUniqueId = require('random-unique-id')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const stableId = require('stable-id')
const validate = require('validate.js')

/* application modules */
const requireValidCacheClient = require('./require-valid-cache-client')
const requireValidName = require('./require-valid-name')

/* public functions */
module.exports = ImmutableCoreModule

/* global variables */

// valid bind types
const bindTypes = {
    'after': true,
    'afterDetach': true,
    'before': true,
    'beforeDetach': true,
}

/**
 * @function ImmutableCoreModule
 *
 * instantiate new ImmutableCoreModule
 *
 * @param {string} moduleName
 * @param {object} options
 *
 * @returns {ImmutableCoreModule}
 *
 * @throws {Error}
 */
function ImmutableCoreModule (moduleName, options) {
    // require name
    this.assert(typeof moduleName === 'string', 'name required')
    // require options to be an object
    var options = requireValidOptionalObject(options)
    // set module meta data
    this.meta = {
        name: moduleName,
        options: options,
    }
}

ImmutableCoreModule.prototype = {
    assert: assert,
    bind: bind,
    cache: cache,
    error: error,
    method: method,
}

/**
 * @function assert
 *
 * throw error if value is not true
 *
 * @param {boolean} assertValue
 * @param {string} message
 * @param {Error|undefined} error
 *
 * @throws {Error}
 */
function assert (assertValue, message, err) {
    if (!assertValue) {
        throw defined(this) ? this.error(message, err) : error(message, err)
    }
}

/**
 * @function bind
 *
 * bind ImmutableCoreModule method to execute along with the method given by
 * methodName with the execution rules defined by bindType
 *
 * bindType must be one of:
 *
 *     after - executes synchronously after method
 *     afterDetach - executes asynchronously after method
 *     before - executes synchronously before method
 *     beforeDetach - executes asynchronously before method
 *
 * @param {string} bindType
 * @param {string} methodName
 * @param {function} bindMethod
 *
 * @returns {undefined}
 *
 * @throws {Error}
 */
function bind (bindType, methodName, bindMethod) {
    // require valid name
    requireValidName(methodName)
    // get method
    var method = this[methodName]
    // require method
    this.assert(defined(method), `method name ${methodName} not defined`)
    // require valid bind type
    this.assert(defined(bindTypes[bindType]), `invalid bind type ${bindType}`)
    // require valid bind method
    this.assert(typeof bindMethod === 'function' && defined(bindMethod.meta), 'invalid bind method')
    // create bind list for method if it does not already exist
    if (!defined(method.meta[bindType])) {
        method.meta[bindType] = []
    }
    // add bind method to bind list
    method.meta[bindType].push(bindMethod)
}

/**
 * @function cache
 *
 * define cache rules for method.
 *
 * the cache object can include the following parameters:
 *
 *     cacheClient - object conforming to require-valid-cache-client spec.
 *                   if cacheClient is not defined then method will fall back
 *                   to cacheClient defined on the module which in turn falls
 *                   back to the global default cache client
 *
 *     expire - expire time. non-positive integer will never expire
 *
 *     keyMethod - function that will be called with args and method meta data
 *                 on every module method call and must return the cache key.
 *                 if not defined default key generation method will be used.
 *
 * @param {string} methodName
 * @param {string} cache
 *
 * @returns {undefined}
 */
function cache (methodName, cache) {
    // require valid name
    requireValidName(methodName)
    // get method
    var method = this[methodName]
    // require method
    this.assert(defined(method), `method name ${methodName} not defined`)
    // require cache specification
    this.assert(typeof cache === 'object', 'cache object required')
    // set default cacheClient if not defined
    if (!defined(cache.cacheClient)) {
        cache.cacheClient = this.meta.options.cacheClient
    }
    // validate cache client
    requireValidCacheClient(cache.cacheClient)
    // set cache for method
    method.meta.cache = cache
}

/**
 * @function error
 *
 * create/update error object with query data
 *
 * @param {string} message
 * @param {Error|undefined} error
 *
 * @returns {Error}
 */
function error (message, error) {
    // make sure message is string
    if (typeof message === 'string') {
        message = ': ' + message
    }
    else {
        message = ''
    }
    // set class and instance info for message
    if (defined(this) && defined(this.name)) {
        message = 'ImmutableCoreModule.'+this.name+' error'+message
    }
    else {
        message = 'ImmutableCoreModule error'+message
    }
    // use error object passed in
    if (defined(error)) {
        // create data object with original message
        error.data = {
            error: {
                code: error.code,
                message: error.message,
            },
        }
    }
    // create new error message
    else {
        error = new Error(message)
        error.data = {}
    }

    return error
}

/**
 * @function method
 *
 * create new module method (optional) and return method function. method of
 * given name can only be defined once and susequent attempts to define method
 * will throw error.
 *
 * when method is created a wrapper function that calls that method and allows
 * for logging, caching, and event binding will be created and added to module
 * object.
 *
 * @param {string} methodName
 * @param {function} method
 * @param {object} options
 *
 * @returns {function} method
 *
 * @throws {Error}
 */
function method (methodName, method, options) {
    // require valid name
    requireValidName(methodName)
    // if method is not defined return existing method if any
    if (!defined(method)) {
        return this[methodName]
    }
    // use allow override value from options if set, otherwise use module
    var allowOverride = defined(options.allowOverride)
        ? options.allowOverride
        : this.meta.options.allowOverride
    // throw exception if method already defined
    this.assert(allowOverride || !defined(this[methodName]), 'method ${methodName} already defined')
    // require function
    this.assert(typeof method === 'function', 'function required for ${methodName}')
    // create meta data entry for function
    var methodMeta = {
        // automock function
        automock: options.automock || this.meta.options.automock,
        // default arg values
        defaultArgs: options.defaultArgs,
        // freeze args and return values
        freeze: defined(options.freeze) ? options.freeze : this.meta.options.freeze,
        // enable Immutable AI
        immutableAI: defined(options.immutableAI) ? options.immutableAI : this.meta.options.immutableAI,
        // set logging client using either method options or module options
        logClient: options.logClient || this.meta.options.logClient,
        // original method function
        method: method,
        // method name
        methodName: methodName,
        // module name
        moduleName: this.meta.name,
        // resolve promises in args and return values
        resolve: defined(options.resolve) ? options.resolve : this.meta.options.resolve,
        // method signature - ModuleName.methodName
        signature: `${this.meta.name}.${methodName}`,
        // strict mode for args only - do not require return to be promise
        strictArgs: options.strictArgs !== undefined ? options.strictArgs : this.meta.options.strictArgs,
        // validation spec - if any
        validateArgs: options.validateArgs,
    }
    // create wrapper function
    this[methodName] = methodMeta.automock
        // wrap method with automock if set
        ? methodMeta.automock( createMethodWrapperFunction(this.meta, methodMeta) )
        // create regular method with no mock
        : createMethodWrapperFunction(this.meta, methodMeta)
    // return method function
    return this[methodName]
}

/**
 * @function createMethodWrapperFunction
 *
 * @param {object} moduleMeta
 * @param {object} methodMeta
 *
 * @returns {function}
 */
function createMethodWrapperFunction (moduleMeta, methodMeta) {
    /**
     * @function methodWrapperFunction
     *
     * all module methods have an identical signature: a single args object as
     * a param and a Promise as a return value. the args object must always
     * contain a session object.
     *
     * if the method is called without the correct args or the original method
     * function does not return a promise the wrapper will fix this to prevent
     * fatal errors.
     *
     * if 'strictArgs' flag is set then exceptions will be throw if arguments
     * are missing but non-promise return values will still be wrapped in a
     * promise.
     *
     * @param {object} args
     *
     * @returns {Promise}
     *
     * @throws {Error}
     */
    var methodWrapperFunction = function methodWrapperFunction (args) {
        // throw exception on to many arguments in strict mode
        if (methodMeta.strictArgs && arguments.length > 1) {
            return Promise.reject(new Error(methodMeta.signature+': too many arguments'))
        }
        // get validated and shallow-cloned args with module call data added
        return getValidArgs(args, methodMeta)
        // run before methods
        .then(args => {
            // log module call
            logCall(args, methodMeta)
            // add current call to stack after logging
            args.session.stack.push(methodMeta.signature)
            // run any beforeDetach extensions
            runBeforeDetach(args, methodMeta)
            // run any before extensions
            return runBefore(args, methodMeta)
        })
        // call target function with potentially modified args
        .then(args => {
            // get return value for method call with optional caching
            var ret = methodMeta.cache
                // method call should be cached
                ? runCached(args, methodMeta)
                // method call should not be cached
                : runNotCached(args, methodMeta)
            // run any afterDetach extensions
            runAfterDetach(args, methodMeta, ret)
            // run any after extensions
            ret = runAfter(args, methodMeta, ret)
            // inject logger into promise chain
            ret = logReturn(args, methodMeta, ret)
            // resolve with promise chain
            return ret
        })
    }
    // store meta data on function
    methodWrapperFunction.meta = methodMeta
    // return newly created function
    return methodWrapperFunction
}

/**
 * @function getCacheKey
 *
 * generate cache key from hash of args and method signature
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {string}
 */
function getCacheKey (args, methodMeta) {
    // get cache data from method meta data
    var cache = methodMeta.cache
    // if cache spec has a list of params specified then use these
    if (cache.keyParams) {
        args = _.pick(args, cache.keyParams)
    }
    // otherwise use everything except session
    else {
        // shallow clone args
        args = _.clone(args)
        // delete session from clone
        delete args.session
    }
    // generate hex id for arg data
    return stableId({
        args: args,
        method: methodMeta.signature,
    })
}

/**
 * @function getValidArgs
 *
 * validate method args, throw error on invalid args in strict mode, or create
 * data needed to continue.
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {object}
 *
 * @throws (Error)
 */
function getValidArgs (args, methodMeta) {
    // require object for args
    if (!args || typeof args !== 'object') {
        // throw exception in strict mode
        if (methodMeta.strictArgs) {
            return Promise.reject(new Error(methodMeta.signature+': invalid args - typeof args: '+typeof args))
        }
        // otherwise create new object for args
        else {
            args = {}
        }
    }
    // require session
    if (!args.session || typeof args.session !== 'object') {
        // throw exception in strict mode
        if (methodMeta.strictArgs) {
            return Promise.reject(new Error(methodMeta.signature+': invalid session - typeof session: '+typeof args.session))
        }
        // otherwise create new object for args
        else {
            args.session = {}
        }
    }
    // shallow clone args
    args = _.clone(args)
    // set default args if any
    if (methodMeta.defaultArgs) {
        // set any default values not defined in args
        _.each(methodMeta.defaultArgs, (val, key) => {
            if (_.get(args, key) === undefined) {
                _.set(args, key, val)
            }
        })
    }
    // validate args if validate.js specification is set
    if (methodMeta.validateArgs) {
        var errors = validate(args, methodMeta.validateArgs)
        // if there are errors then reject with errors
        if (errors) {
            // create new error object
            var error = new Error(methodMeta.signature+': validation error')
            // add validation error data
            error.errors = errors
            // reject with error
            return Promise.reject(error)
        }
    }
    // shallow clone session so that multiple async calls do not overwrite values
    args.session = _.clone(args.session)
    // create stack if it does not exist
    if (!args.session.stack) {
        args.session.stack = []
    }
    // otherwise clone stack
    else {
        args.session.stack = _.clone(args.session.stack)
    }
    // generate random unique id
    var uniqueId = randomUniqueId()
    // store module call id and timestamp on session for db and http logging
    args.session.moduleCallCreateTime = uniqueId.timestamp
    args.session.moduleCallId = uniqueId.id
    args.session.moduleCallSignature = methodMeta.signature
    // return valid args
    return Promise.resolve(args)
}

/**
 * @function logCall
 *
 * log call using optional logClient set in method meta data. logging can be
 * disabled at the session level with the noLogging flag
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {undefined} 
 */
function logCall (args, methodMeta) {
    // require log client
    if (!methodMeta.logClient) {
        return
    }
    // do not log if noLogging flag is set on session
    if (args.session.noLogging) {
        return
    }
    // log call
    methodMeta.logClient.log('moduleCall', {
        args: args,
        functionName: methodMeta.methodName,
        moduleCallCreateTime: args.session.moduleCallCreateTime,
        moduleCallId: args.session.moduleCallId,
        moduleName: methodMeta.moduleName,
        requestId: args.session.requestId,
    })
}

/**
 * @function logReturn
 *
 * inject logger into promise chain to log final result once method call and
 * all after extensions have been run.
 *
 * if logClient is not set for method or noLogging flag is set on session
 * then no action will be taken.
 *
 * @param {object} args
 * @param {object} methodMeta
 * @param {Promise} ret
 *
 * @returns {Promise}
 */
function logReturn (args, methodMeta, ret) {
    // require log client
    if (!methodMeta.logClient) {
        // return original return value
        return ret
    }
    // do not log if noLogging flag is set on session
    if (args.session.noLogging) {
        // return original return value
        return ret
    }
    // inject logger into promise chain
    return ret
    // log resolve
    .then(res => {
        methodMeta.logClient.log('moduleCallResolve', {
            moduleCallId: args.session.moduleCallId,
            moduleCallResolveData: res,
            resolved: 1,
            moduleCallResolveCreateTime: microTimestamp(),
        })
        // resolve with original resolve value
        return res
    })
    // log reject
    .catch(err => {
        methodMeta.logClient.log('moduleCallResolve', {
            moduleCallId: args.session.moduleCallId,
            moduleCallResolveData: err,
            resolved: 0,
            moduleCallResolveCreateTime: microTimestamp(),
        })
        // reject with original reject value
        return Promise.reject(err)
    })
}

/**
 * @function runAfter
 *
 * run all extensions bound after method. if any extensions reject then the
 * parent method will reject.
 *
 * any data returned by extensions will be merged into the parent return data.
 *
 * @param {object} args
 * @param {object} methodMeta
 * @param {object} ret
 *
 * @returns {Promise}
 */
function runAfter (args, methodMeta, ret) {
    // return original promise if there are no after extensions
    if (!methodMeta.after) {
        return ret
    }
    // after original promise resolves then run after methods
    return ret.then(res => {
        // build arguments for after methods
        args = {
            args: args.args ? args.args : args,
            res: res,
            origRes: args.origRes ? args.origRes : args.res,
            session: args.session,
        }
        // wait for all extension methods to complete
        return Promise.all(
            // run all after methods in order making sure they return promise
            _.map(methodMeta.after, method => (method)(args))
        )
        // merge returned data into original
        .then(function (results) {
            // if original result is object then merge results
            if (res && typeof res === 'object') {
                _.each(results, result => _.merge(res, result))
            }
            // return merged result
            return res
        })
    })
}

/**
 * @function runAfterDetach
 *
 * run extension methods bound on beforeDetach. these methods are run
 * asynchronously and results including rejections are ignored.
 *
 * @param {object} args
 * @param {object} methodMeta
 * @param {object} ret
 *
 * @returns {undefined}
 */
function runAfterDetach (args, methodMeta, ret) {
    // skip if no afterDetach methods
    if (!methodMeta.afterDetach) {
        return
    }
    // wait for original promise to resolve then run detached after functions
    ret.then(res => {
        // build arguments for after methods
        args = {
            args: args.args ? args.args : args,
            res: res,
            origRes: args.origRes ? args.origRes : args.res,
            session: args.session,
        }
        // run all functions
        _.each(methodMeta.afterDetach, method => {
            // call method
            (method)(args)
            // log errors
            .catch(err => {
                // require log client
                if (!methodMeta.logClient) {
                    return
                }
                // log error
                methodMeta.logClient.error(err, args.session)
            })
        })
    })
}

/**
 * @function runBeforeDetach
 *
 * run extension methods bound on beforeDetach. these methods are run
 * asynchronously and results including rejections are ignored.
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {undefined}
 */
function runBeforeDetach (args, methodMeta) {
    // skip if no beforeDetach methods
    if (!methodMeta.beforeDetach) {
        return
    }
    // run all functions
    _.each(methodMeta.beforeDetach, method => {
        // call method
        (method)(args)
        // log errors
        .catch(err => {
            // require log client
            if (!methodMeta.logClient) {
                return
            }
            // log error
            methodMeta.logClient.error(err, args.session)
        })
    })
}

/**
 * @function runBefore
 *
 * run extension methods bound on before. if any of these methods reject the
 * parent method call will reject. any return values from before methods are
 * merged into the original args before calling the parent method.
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {Promise}
 */
function runBefore (args, methodMeta) {
    // resolve with original args if no before extensions
    if (!methodMeta.before) {
        return Promise.resolve(args)
    }
    // wait for all extension methods to complete
    return Promise.all(
        // run all before methods in order making sure they return promise
        _.map(methodMeta.before, method => (method)(args))
    )
    // merge return values in args
    .then(results => {
        // merge each result into original args
        _.each(results, result => _.merge(args, result))
        // resolve with merged result
        return args
    })
}

/**
 * @function runCached
 *
 * call the method with caching enabled. uses cacheClient defined in
 * methodMeta.cache. if cached value is found it will be returned.
 *
 * if cached value is not found then method will be called and value will
 * be cached if promise resolves.
 *
 * if there is an error with the cache call then the method will be called.
 * 
 * if an object is returned from the cache and it does not contain a cacheId
 * property then the cacheId property will be added to it with the cache key
 * value used to retrieve the cached data.
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {Promise}
 */
function runCached (args, methodMeta) {
    // get cache data from method meta data
    var cache = methodMeta.cache
    // generate cache key
    var key = cache.keyMethod
        // call custom key generation method if defined
        ? (cache.keyMethod)(args, methodMeta)
        // use default key generation method
        : getCacheKey(args, methodMeta)
    // attempt to get value from cache
    return cache.cacheClient.get(key, args.session)
    // cache get success
    .then(res => {
        // cached value found
        if (res !== null) {
            // if result is object they add cache key to it
            if (typeof res === 'object') {
                res.cacheId = key
            }
            // resolve with response
            return res
        }
        // cached value not found, call method
        return runNotCached(args, methodMeta)
        // if method call resolves then cache results
        .then(res => {
            cache.expire
                // cache response with expiration
                ? cache.cacheClient.setex(key, res, cache.expire, args.session)
                // cache response without expiration
                : cache.cacheClient.set(key, res, args.session)
            // resolve with response
            return res
        })
    })
    // cache get error
    .catch(err => {
        // if cache get had error then call method
        return runNotCached(args, methodMeta)
        // if method call resolves then cache results
        .then(res => {
            cache.expire
                // cache response with expiration
                ? cache.cacheClient.setex(key, res, cache.expire, args.session)
                // cache response without expiration
                : cache.cacheClient.set(key, res, args.session)
            // resolve with response
            return res
        })
    })
}

/**
 * @function runNotCached
 *
 * call method without caching enabled.
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {Promise}
 */
function runNotCached (args, methodMeta) {
    // Immutable AI enabled
    if (methodMeta.immutableAI) {
        // create immutable ai instance
        var ai = immutableAI(args)
        // call method with Immutable AI instance
        return Promise.resolve( methodMeta.method.call(ai, args) )
    }
    // Immutable AI disabled
    else {
        return Promise.resolve( (methodMeta.method)(args) )
    }
}