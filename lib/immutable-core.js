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
    // check if modules and methods exist
    hasMethod: hasMethod,
    hasModule: hasModule,
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

// get reference to global singleton instance
var immutable
// initialize global singleton instance if not yet defined
if (!global.__immutable_core__) {
    immutable = global.__immutable_core__ = {
        // allow methods and cache rules to be overriden
        defaultAllowOverride: undefined,
        // immutable-automock wrapper function
        defaultAutomock: undefined,
        // cache client that will be used if client is not set in cache spec
        defaultCacheClient: undefined,
        // log client that will be used if client is not set in module options
        defaultLogClient: undefined,
        // set default value for strict args handling
        defaultStrictArgs: undefined,
        // global store of method binds
        binds: undefined,
        // global store of caching rules
        caches: undefined,
        // global store of module objects
        modules: undefined,
    }
    // all default global variable values must be set by reset() method
    reset()
}
// use existing singleton instance
else {
    immutable = global.__immutable_core__
}

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
        immutable.defaultAllowOverride = allowOverride ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultAllowOverride
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
        immutable.defaultAutomock = automock
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultAutomock
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
    var moduleCaches = immutable.caches[signature.moduleName] = immutable.caches[signature.moduleName] || {}
    // set default value if cache objecct not defined
    if (cache === undefined) {
        cache = {}
    }
    // require valid cache data
    if (!cache || typeof cache !== 'object') {
        throw new Error('cache error: cache object required')
    }
    // throw error if attempting to add multiple caching rules to the same method
    if (moduleCaches[signature.methodName] && !immutable.defaultAllowOverride) {
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
        immutable.defaultCacheClient = cacheClient
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultCacheClient
}

/**
 * @function hasMethod
 *
 * check if method exists.
 *
 * throws error on invalid method signature.
 *
 * @param {string} signature - ModuleName.methodName of method
 *
 * @returns {boolean}
 *
 * @throws {Error}
 */
function hasMethod (signature) {
    // convert signature string to method and function name
    signature = getValidSignature(signature)
    // get module
    var module = immutable.modules[signature.moduleName]
    // return false if module does not exist
    if (!module) {
        return false
    }
    // check if method exists
    return module[signature.methodName] ? true : false
}

/**
 * @function hasModule
 *
 * check if module exists.
 *
 * throws error on invalid mdoule name.
 *
 * @param {string} name - name of module
 *
 * @returns {boolean}
 *
 * @throws {Error}
 */
function hasModule (name) {
    // throw error on invalid name
    requireValidName(name)
    // check if module exists
    return immutable.modules[name] ? true : false
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
    var module = immutable.modules[signature.moduleName]
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
    method = module.method(signature.methodName, method, options)
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
        if (!immutable.modules[name]) {
            throw new Error('module error: module not found '+name)
        }
        // return module
        return immutable.modules[name]
    }
    // if methods were passed throw error if module already defined
    if (immutable.modules[name]) {
        throw new Error('module error: module already defined '+name)
    }
    // create new module
    var module = immutable.modules[name] = ImmutableModule(name, options)
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
        immutable.defaultLogClient = logClient
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultLogClient
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
    immutable.defaultAllowOverride = false
    immutable.defaultAutomock = undefined
    immutable.defaultCacheClient = undefined
    immutable.defaultLogClient = undefined
    immutable.defaultStrictArgs = true
    // global data stores
    immutable.binds = {}
    immutable.caches = {}
    immutable.modules = {}
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
        immutable.defaultStrictArgs = strictArgs ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultStrictArgs
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
    var moduleBinds = immutable.binds[signature.moduleName] = immutable.binds[signature.moduleName] || {}
    // create bind entry for method if it does not exist
    var methodBinds = moduleBinds[signature.methodName] = moduleBinds[signature.methodName] || {}
    // create bind entry for bind method if it does not exist
    var bindMethodBinds = methodBinds[bindMethod] = methodBinds[bindMethod] || {}
    // throw error if attempting to bind the same method at the same point multiple times
    if (bindMethodBinds[method.meta.signature] && !immutable.defaultAllowOverride) {
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
    if (!immutable.binds[signature.moduleName]) {
        return
    }
    // skip if no binds for method
    if (!immutable.binds[signature.moduleName][signature.methodName]) {
        return
    }
    // get all binds for method indexed by bind method
    var bindMethodBinds = immutable.binds[signature.moduleName][signature.methodName]
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
    if (!immutable.caches[signature.moduleName] || !immutable.caches[signature.moduleName][signature.methodName]) {
        return
    }
    // get cache entry
    var cache = immutable.caches[signature.moduleName][signature.methodName]
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
        options.allowOverride = immutable.defaultAllowOverride
    }
    // set default for automock
    if (options.automock === undefined) {
        options.automock = immutable.defaultAutomock
    }
    // set default for cache client
    if (options.cacheClient === undefined) {
        options.cacheClient = immutable.defaultCacheClient
    }
    // set default for log client
    if (options.logClient === undefined) {
        options.logClient = immutable.defaultLogClient
    }
    // set default for strict args
    if (options.strictArgs === undefined) {
        options.strictArgs = immutable.defaultStrictArgs
    }

    // return options
    return options
}