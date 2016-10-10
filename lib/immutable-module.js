'use strict'

/* npm modules */
var Promise = require('bluebird')
var _ = require('lodash')
var microTimestamp = require('micro-timestamp')
var randomUniqueId = require('random-unique-id')
var stableId = require('stable-id')

/* application modules */
var requireValidCacheClient = require('./require-valid-cache-client')
var requireValidName = require('./require-valid-name')

/* public functions */
module.exports = ImmutableModule

/* global variables */

// valid bind methods
const bindMethods = {
    'after': true,
    'afterDetach': true,
    'before': true,
    'beforeDetach': true,
}

/**
 * @function ImmutableModule
 *
 * instantiate new ImmutableModule object. throws error when if to redefine
 * a module.
 *
 * @param {string} moduleName
 * @param {object} options
 *
 * @returns {ImmutableModule}
 *
 * @throws {Error}
 */
function ImmutableModule (moduleName, options) {
    // require options to be an object
    if (!options || typeof options !== 'object') {
        options = {}
    }
    // module meta data
    var meta = {
        name: moduleName,
        options: options,
    }
    // create new module class
    var Module = function () {}
    // inherit from ImmutableModule
    Module.prototype = Object.create(ImmutableModule.prototype)
    // add custom meta function to prototype
    Module.prototype.meta = function () { return meta }
    // return new module instance
    return new Module()
}

ImmutableModule.prototype = {
    bind: bind,
    cache: cache,
    method: method,
}

/**
 * @function bind
 *
 * bind another ImmutableModule method to the method specified by methodName
 *
 * bindMethod must be one of:
 *     after - executes synchronously after method
 *     afterDetach - executes asynchronously after method
 *     before - executes synchronously before method
 *     beforeDetach - executes asynchronously before method
 *
 * @param {string} bindMethod
 * @param {string} methodName
 * @param {string} method
 *
 * @returns {undefined}
 *
 * @throws {Error}
 */
function bind (bindMethod, methodName, method) {
    // get module object
    var module = this
    // get module meta data
    var moduleMeta = module.meta()
    // require function to bind to
    if (!module[methodName]) {
        throw new Error('bind error: function '+functionName+' not defined for '+moduleMeta.name)
    }
    // get method meta data
    var methodMeta = module[methodName].meta
    // require valid bind method
    if (!bindMethods[bindMethod]) {
        throw new Error('bind error: invalid bind method '+method+' for '+methodMeta.signature)
    }
    // require function to bind
    if (typeof method !== 'function') {
        throw new Error('bind error: must bind function not '+typeof method+' for '+methodMeta.signature)
    }
    // only bind ImmutableModule methods
    if (!method.meta) {
        throw new Error('bind error: must bind ImmutableModule method for '+methodMeta.signature)
    }
    // create bind list for method if it does not already exist
    if (!methodMeta[bindMethod]) {
        methodMeta[bindMethod] = []
    }
    // add function to bind list
    methodMeta[bindMethod].push(method)
}

/**
 * @function cache
 *
 * define caching for method.
 *
 * cache object must define a cache client with the methods:
 *     get(key)
 *     set(key, value, session)
 *     setex(key, value, expires, session)
 *
 * @param {string} methodName
 * @param {string} cache
 *
 * @returns {undefined}
 */
function cache (methodName, cache) {
    // get module object
    var module = this
    // require function to bind to
    if (!module[methodName]) {
        throw new Error('cache error: function '+functionName+' not defined')
    }
    // get method meta data
    var methodMeta = module[methodName].meta
    // require valid cache data
    if (!cache || typeof cache !== 'object') {
        throw new Error('cache error: cache object required')
    }
    // validate that cache client has required methods
    requireValidCacheClient(cache.cacheClient)
    // set cache for method
    methodMeta.cache = cache
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
    // get module object
    var module = this
    // get module instance data
    var moduleMeta = module.meta()
    // return method meta (if any) if method is not passed
    if (!method) {
        return module[methodName]
    }
    // throw exception if method already defined
    if (module[methodName]) {
        throw new Error('method error: '+methodName+' already defined for '+moduleMeta.name)
    }
    // require function
    if (typeof method !== 'function') {
        throw new Error('method error: function required for '+moduleMeta.name+'.'+methodName)
    }
    // require valid name
    requireValidName(methodName)
    // create meta data entry for function
    var methodMeta = {
        // set logging client using either method options or module options
        logClient: options.logClient || moduleMeta.options.logClient,
        // original method function
        method: method,
        // method name
        methodName: methodName,
        // module name
        moduleName: moduleMeta.name,
        // method signature - ModuleName.methodName
        signature: moduleMeta.name+'.'+methodName,
        // strict mode for args only - do not require return to be promise
        strictArgs: options.strictArgs !== undefined ? options.strictArgs : moduleMeta.options.strictArgs
    }
    // create wrapper function
    this[methodName] = createMethodWrapperFunction(moduleMeta, methodMeta)
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
            throw new Error('too many arguments for '+methodMeta.signature)
        }
        // get validated and shallow-cloned args with module call data added
        args = getValidArgs(args, methodMeta)
        // log module call
        logCall(args, methodMeta)
        // run any beforeDetach extensions
        runBeforeDetach(args, methodMeta)
        // run any before extensions
        return runBefore(args, methodMeta)
        // call target function with potentially modified args
        .then(args => {
            // get return value for method call with optional caching
            var ret = methodMeta.cache
                // method call should be cached
                ? runCached(args, methodMeta)
                // method call should not be cached
                : Promise.resolve( (methodMeta.method)(args) )
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
    if (cacheSpec.keyParams) {
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
            throw new Error('invalid args for '+methodMeta.signature+' - typeof args: '+typeof args)
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
            throw new Error('invalid session for '+methodMeta.signature+' - typeof session: '+typeof args.session)
        }
        // otherwise create new object for args
        else {
            args.session = {}
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
    // add current call to stack
    args.session.stack.push(methodMeta.signature)
    // generate random unique id
    var uniqueId = randomUniqueId()
    // store module call id and timestamp on session for db and http logging
    args.session.moduleCallCreateTime = uniqueId.timestamp
    args.session.moduleCallId = uniqueId.id
    // return valid args
    return args
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
    if (!args.session.noLogging) {
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
    if (!args.session.noLogging) {
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
        var args = {
            args: args.args ? args.args : args,
            res: res,
            origRes: args.origRes ? args.origRes : args.res,
            session: args.session,
        }
        // wait for all extension methods to complete
        return Promise.all(
            // run all before methods in order making sure they return promise
            _.map(methodMeta.after, method => Promise.resolve((method)(args)))
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
        var args = {
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
        _.map(methodMeta.before, method => Promise.resolve((method)(args)))
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
 * if there is an error with the cache call then the method will be called
 * but not attempt will be made to cache result.
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
        return Promise.resolve( (methodMeta.meta)(args) )
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
        return Promise.resolve( (methodMeta.meta)(args) )
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