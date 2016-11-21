'use strict'

/* npm modules */
const _ = require('lodash')
const requireValidLogClient = require('immutable-require-valid-log-client')

/* application modules */
const ImmutableModule = require('./immutable-module')
const getValidSignature = require('./get-valid-signature')
const requireValidCacheClient = require('./require-valid-cache-client')
const requireValidName = require('./require-valid-name')

/* exports */

const ImmutableCore = {
    // bind methods
    after: after,
    afterDetach: afterDetach,
    before: before,
    beforeDetach: beforeDetach,
    // define caching
    cache: cache,
    // get/set module and methods
    method: getMethod,
    module: getModule,
    // set default options
    allowOverride: allowOverride,
    automock: automock,
    cacheClient: cacheClient,
    logClient: logClient,
    strictArgs: strictArgs,
    // clear global data
    reset: reset,
}

module.exports = ImmutableCore

/* global variables */

// allow methods and cache rules to be overriden
var defaultAllowOverride
// immutable-automock wrapper function
var defaultAutomock
// cache client that will be used if client is not set in cache spec
var defaultCacheClient
// log client that will be used if client is not set in module options
var defaultLogClient
// set default value for strict args handling
var defaultStrictArgs

// global store of method binds
var binds
// global store of caching rules
var caches
// global store of module objects
var modules

// all default global variable values must be set by reset() method
reset()

/* public functions */

/**
 * @function after
 *
 * bind ImmutableModule method to execute after the target ImmutableModule
 * method identified by signature.
 *
 * bound method will execute after the target method resolves. if the target
 * method rejects then the after method will not be executed.
 *
 * resolution of the target method call will not complete until the bound
 * method resolves. if the after method rejects the target method will reject.
 *
 * data return by after method will be merged into the data returned by the
 * target method if the target method returned an object.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableModule method to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function after (signature, method) {
    return bind('after', signature, method)
}

/**
 * @function afterDetach
 *
 * bind ImmutableModule method to execute after the target ImmutableModule
 * method identified by signature.
 *
 * unlike `after` methods `afterDetach` methods do not block resolution of
 * the target method and if they reject this will not result in the target
 * method rejecting.
 *
 * any data return will be ignored.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableModule method to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function afterDetach (signature, method) {
    return bind('afterDetach', signature, method)
}

/**
 * @function allowOverride
 *
 * get/set the default value for allowing override of methods and cache rules
 *
 * @param {boolean} strictArgs
 *
 * @returns {ImmutableCore|boolean}
 */
function allowOverride (allowOverride) {
    // set default if value passed
    if (allowOverride !== undefined) {
        defaultAllowOverride = allowOverride ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return defaultAllowOverride
}

/**
 * @function automock
 *
 * get/set the immutable-automock wrapper function
 *
 * @param {function} automock
 *
 * @returns {ImmutableCore|boolean}
 *
 * @throws {Error}
 */
function automock (automock) {
    // set default if value passed
    if (automock !== undefined) {
        // require function
        if (typeof automock !== 'function') {
            throw new Error('automock error: automock must be function')
        }
        // set global value
        defaultAutomock = automock
        // return immutable
        return ImmutableCore
    }
    // return default value
    return defaultAutomock
}

/**
 * @function before
 *
 * bind ImmutableModule method to execute before the target ImmutableModule
 * method identified by signature.
 *
 * bound method must resolve before the target method is called. if the before
 * method rejects then the target method will not be called.
 *
 * data return by before method will be merged into the args for the target
 * method before calling the target method.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableModule method to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function before (signature, method) {
    return bind('before', signature, method)
}

/**
 * @function beforeDetach
 *
 * bind ImmutableModule method to execute before the target ImmutableModule
 * method identified by signature.
 *
 * unlike `before` methods `beforeDetach` methods do not block calling of the
 * target method and if they reject this does not prevent target method from
 * resolving.
 *
 * any data returned by before method is ignored.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableModule method to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function beforeDetach (signature, method) {
    return bind('beforeDetach', signature, method)
}

/**
 * @function cache
 *
 * define cache rule for module method. cache rule will be stored in global
 * caches register. if module method is not yet defined cache rule will be
 * applied when the module method is defined.
 *
 * the cache object can include the following parameters:
 *
 *     cacheClient - object conforming to require-valid-cache-client spect.
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
 *     keyParams - array of parameters from args to be used for generating key.
 *
 * an error will be thrown on attempt to add multiple cache rules to same
 * method.
 *
 * @oaram {string} signature - moduleName.functionName to cache
 * @param {object} cache - cache rules
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function cache (signature, cache) {
    // validate signature
    var signature = getValidSignature(signature)
    // create cache entry for module if it does not exist
    var moduleCaches = caches[signature.moduleName] = caches[signature.moduleName] || {}
    // set default value if cache objecct not defined
    if (cache === undefined) {
        cache = {}
    }
    // require valid cache data
    if (!cache || typeof cache !== 'object') {
        throw new Error('cache error: cache object required')
    }
    // throw error if attempting to add multiple caching rules to the same method
    if (moduleCaches[signature.methodName] && !defaultAllowOverride) {
        throw new Error('cache error: cache rule already defined for '+signature)
    }
    // add caching rule
    moduleCaches[signature.methodName] = {
        cached: false,
        cache: cache,
    }
    // cache method if it exists
    doCacheForMethod(signature.signature)
    // return immutable
    return ImmutableCore
}

/**
 * @function cacheClient
 *
 * get/set the default cache client
 *
 * @param {object} cacheClient
 *
 * @returns {ImmutableCore|object}
 *
 * @throws {Error} on invalid cacheClient
 */
function cacheClient (cacheClient) {
    if (cacheClient) {
        // validate that cache client has required methods
        requireValidCacheClient(cacheClient)
        // set default
        defaultCacheClient = cacheClient
        // return immutable
        return ImmutableCore
    }
    // return default value
    return defaultCacheClient
}

/**
 * @function getMethod
 *
 * get and optionally create a new method. if method object is passed then
 * new module will be created, otherwise existing module will be returned.
 *
 * errors will be thrown on attempts to create multiple modules or methods
 * with the same name as well as if attempting to use the reserved words
 * defined in get-valid-name.
 *
 * error will be thrown in attempting to get method that is not defined.
 *
 * @param {string} signature - ModuleName.methodName of method
 * @param {object} method - method function (optional)
 * @param {object} options - options (optional)
 *
 * @returns {function} - method function
 *
 * @throws {Error}
 */
function getMethod (signature, method, options) {
    // convert signature string to method and function name
    signature = getValidSignature(signature)
    // get module
    var module = modules[signature.moduleName]
    // throw error if module not defined
    if (!module) {
        throw new Error('method error: module not found '+signature.signature)
    }
    // if method not passed then attempt to get existing
    if (!method) {
        // throw error if method not defined
        if (!module[signature.methodName]) {
            throw new Error('method error: method not found '+signature.signature)
        }
        // return method
        return module[signature.methodName]
    }
    // get validated options, do not set defaults which will come from module
    options = getValidOptions(options)
    // attempt to create new module method
    module.method(signature.methodName, method, options)
    // do binds for method
    doBindForMethod(signature.signature)
    // set cache rules for method
    doCacheForMethod(signature.signature)
    // return method
    return method
}

/**
 * @function getModule
 *
 * get and optionally create a new module. if methods object is passed then
 * new module will be created, otherwise existing module will be returned.
 *
 * errors will be thrown on attempts to create multiple modules or methods
 * with the same name as well as if attempting to use the reserved words
 * defined in get-valid-name.
 *
 * @param {string} name - name of module
 * @param {object} methods - module functions (optional)
 * @param {object} options - options (optional)
 *
 * @returns {object} - object containing wrapped module functions
 *
 * @throws {Error}
 */
function getModule (name, methods, options) {
    // throw error on invalid name
    requireValidName(name)
    // get validated options, set defaults
    options = getValidOptions(options, true)
    // if no methods were passed then return module instance
    if (!methods) {
        // throw error if module not defined
        if (!modules[name]) {
            throw new Error('module error: module not found '+name)
        }
        // return module
        return modules[name]
    }
    // if methods were passed throw error if module already defined
    if (modules[name]) {
        throw new Error('module error: module already defined '+name)
    }
    // create new module
    var module = modules[name] = ImmutableModule(name, options)
    // get module meta data
    var moduleMeta = module.meta()
    // add methods to object
    _.each(methods, (method, methodName) => {
        // create new method use module options
        module.method(methodName, method, moduleMeta.options)
        // bind to method if it exists
        doBindForMethod(name+'.'+methodName)
    })
    // return module
    return module
}

/**
 * @function logClient
 *
 * get/set the default log client
 *
 * @param {object} logClient
 *
 * @returns {ImmutableCore|object}
 *
 * @throws {Error} on invalid logClient
 */
function logClient (logClient) {
    if (logClient) {
        // validate that log client has required methods
        requireValidLogClient(logClient)
        // set default
        defaultLogClient = logClient
        // return immutable
        return ImmutableCore
    }
    // return default value
    return defaultLogClient
}

/**
 * @function reset
 *
 * clear global data: binds, caches, modules
 *
 * @returns {ImmutableCore}
 */
function reset () {
    // default options
    defaultAllowOverride = false
    defaultAutomock = undefined
    defaultCacheClient = undefined
    defaultLogClient = undefined
    defaultStrictArgs = true
    // global data stores
    binds = {}
    caches = {}
    modules = {}
    // return immutable
    return ImmutableCore
}

/**
 * @function strictArgs
 *
 * get/set the default value for strict args
 *
 * @param {boolean} strictArgs
 *
 * @returns {ImmutableCore|boolean}
 */
function strictArgs (strictArgs) {
    // set default if value passed
    if (strictArgs !== undefined) {
        defaultStrictArgs = strictArgs ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return defaultStrictArgs
}

/* private functions */

/**
 * @function bind
 *
 * bind immutable module method to given immutable method signature.
 *
 * when bind is called the method will be added to the global bind store.
 *
 * if the target method is already defined then methods will be bound to it.
 * if the target method has not yet been created then bind will occur if and
 * when the method is created.
 *
 * @param {string} bindMethod - when and how to bind
 * @param {string} signature - moduleName.functionName to bind to
 * @param {function} method - function to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function bind (bindMethod, signature, method) {
    // validate signature
    signature = getValidSignature(signature)
    // create bind entry for module if it does not exist
    var moduleBinds = binds[signature.moduleName] = binds[signature.moduleName] || {}
    // create bind entry for method if it does not exist
    var methodBinds = moduleBinds[signature.methodName] = moduleBinds[signature.methodName] || {}
    // create bind entry for bind method if it does not exist
    var bindMethodBinds = methodBinds[bindMethod] = methodBinds[bindMethod] || {}
    // throw error if attempting to bind the same method at the same point multiple times
    if (bindMethodBinds[method.meta.signature] && !defaultAllowOverride) {
        throw new Error('bind error: method '+method.meta.signature+' already bound '+bindMethod+' to '+signature.signature)
    }
    // add bind method entry
    bindMethodBinds[method.meta.signature] = {
        bound: false,
        method: method,
    }
    // bind to method if it exists
    doBindForMethod(signature.signature)
    // return immutable
    return ImmutableCore
}

/**
 * @function doBindForMethod
 *
 * @param {string} signature - moduleName.functionName to do bind(s) for
 *
 * @throws {Error}
 */
function doBindForMethod (signature) {
    // validate signature
    signature = getValidSignature(signature)
    // get method and module
    try {
        var method = getMethod(signature.signature)
        var module = getModule(signature.moduleName)
    }
    // ignore exceptions which should be due to module/method not found
    catch (ex) {
        return
    }
    // skip if no binds for module
    if (!binds[signature.moduleName]) {
        return
    }
    // skip if no binds for method
    if (!binds[signature.moduleName][signature.methodName]) {
        return
    }
    // get all binds for method indexed by bind method
    var bindMethodBinds = binds[signature.moduleName][signature.methodName]
    // iterate over each bind method
    _.each(bindMethodBinds, (boundMethods, bindMethod) => {
        // iterate over each bind
        _.each(boundMethods, boundMethod => {
            // do nothing if already bound
            if (boundMethod.bound) {
                return
            }
            // bind method
            module.bind(bindMethod, signature.methodName, boundMethod.method)
            // set bound flag
            boundMethod.bound = true
        })
    })
}

/**
 * @function doCacheForMethod
 *
 * @param {string} signature - moduleName.functionName to set cache rule for
 *
 * @throws {Error}
 */
function doCacheForMethod (signature) {
    // validate signature
    signature = getValidSignature(signature)
    // get method and module
    try {
        var method = getMethod(signature.signature)
        var module = getModule(signature.moduleName)
    }
    // ignore exceptions which should be due to module/method not found
    catch (ex) {
        return
    }
    // skip if no caches for method
    if (!caches[signature.moduleName] || !caches[signature.moduleName][signature.methodName]) {
        return
    }
    // get cache entry
    var cache = caches[signature.moduleName][signature.methodName]
    // set cache rule on method
    module.cache(signature.methodName, cache.cache)
    // set cached flag true now that cache rule added
    cache.cached = true
}

/**
 * @function getValidOptions
 *
 * validate options param and set defaults
 *
 * @param {*} options
 * @param {boolean} setDefaults
 *
 * @returns {object}
 *
 * @throws {Error} on invalid arguments
 */
function getValidOptions (options, setDefaults) {
    // require object if options is defined
    if (options !== undefined && typeof options !== 'object') {
        throw new Error('options error: options must be an object')
    }
    // default options to empty object
    if (!options) {
        options = {}
    }
    // validate automock if passed
    if (options.automock !== undefined) {
        if (typeof options.automock !== 'function') {
            throw new Error('options error: automock must be function')
        }
    }
    // validate cache client if passed
    if (options.cacheClient !== undefined) {
        requireValidCacheClient(options.cacheClient)
    }
    // validate log client if passed
    if (options.logClient !== undefined) {
        requireValidLogClient(options.logClient)
    }

    // do not set default values unless flag set
    if (!setDefaults) {
        return options
    }

    // set default for allowing overrides
    if (options.allowOverride === undefined) {
        options.allowOverride = defaultAllowOverride
    }
    // set default for automock
    if (options.automock === undefined) {
        options.automock = defaultAutomock
    }
    // set default for cache client
    if (options.cacheClient === undefined) {
        options.cacheClient = defaultCacheClient
    }
    // set default for log client
    if (options.logClient === undefined) {
        options.logClient = defaultLogClient
    }
    // set default for strict args
    if (options.strictArgs === undefined) {
        options.strictArgs = defaultStrictArgs
    }

    // return options
    return options
}