'use strict'

/* npm modules */
var _ = require('lodash')

/* application modules */
var ImmutableModule = require('./immutable-module')
var getValidSignature = require('./get-valid-signature')
var requireValidCacheClient = require('./require-valid-cache-client')
var requireValidLogClient = require('./require-valid-log-client')
var requireValidName = require('./require-valid-name')

/* public functions */
module.exports = {
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
    cacheClient: cacheClient,
    logClient: logClient,
    strictArgs: strictArgs,
    // clear global data
    reset: reset,
}

/* global variables */

// cache client that will be used if client is not set in cache spec
var defaultCacheClient = undefined
// log client that will be used if client is not set in module options
var defaultLogClient = undefined
// set default value for strict args handling
var defaultStrictArgs = true

// global store of method binds
var binds = {}
// global store of caching rules
var caches = {}
// global store of module objects
var modules = {}

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
 * @returns {undefined}
 *
 * @throws {Error}
 */
function after (signature, method) {
    bind('after', signature, method)
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
 * @returns {undefined}
 *
 * @throws {Error}
 */
function afterDetach (signature, method) {
    bind('afterDetach', signature, method)
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
 * @returns {undefined}
 *
 * @throws {Error}
 */
function before (signature, method) {
    bind('before', signature, method)
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
 * @returns {undefined}
 *
 * @throws {Error}
 */
function beforeDetach (signature, method) {
    bind('beforeDetach', signature, method)
}

/**
 * @function cache
 *
 * @oaram {string} targetFunctionSignature - moduleName.functionName to cache
 * @param {object} spec - caching specification
 */
function cache (targetFunctionSignature, spec) {
    // validate signature
    var signature = getValidSignature(targetFunctionSignature)
    // try to get module
    var module = ImmutableModule(signature.moduleName)
    // if module already exists then cache function
    if (module) {
        module.cache(signature.moduleName, signature.functionName, spec)
    }
    // if module does not exist yet store cache spec to be applied if it is created
    else {
        // create deferred cache entry for mdoule
        if (!deferredCache[signature.moduleName]) {
            deferredCache[signature.moduleName] = {}
        }
        // throw error if cache has already been defined for this function
        if (deferredCache[signature.moduleName][signature.functionName]) {
            throw new Error('cache already defined for '+targetFunctionSignature)
        }
        // store cache spec
        deferredCache[signature.moduleName][signature.functionName] = spec
    }
}

/**
 * @function cacheClient
 *
 * get/set the default cache client
 *
 * @param {object} cacheClient
 *
 * @returns {object}
 *
 * @throws {Error} on invalid cacheClient
 */
function cacheClient (cacheClient) {
    if (cacheClient) {
        // validate that cache client has required methods
        requireValidCacheClient(cacheClient)
        // set default
        defaultCacheClient = cacheClient
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
    // get validated options
    options = getValidOptions(options)
    // attempt to create new module method
    method = module.method(signature.methodName, method, options)
    // bind to method if it exists
    doBindForMethod(signature.signature)
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
    // get validated options
    options = getValidOptions(options)
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
        method = module.method(methodName, method, moduleMeta.options)
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
 * @returns {object}
 *
 * @throws {Error} on invalid logClient
 */
function logClient (logClient) {
    if (logClient) {
        // validate that log client has required methods
        requireValidLogClient(logClient)
        // set default
        defaultLogClient = logClient
    }
    // return default value
    return defaultLogClient
}

/**
 * @function reset
 *
 * clear global data: binds, caches, modules
 *
 * @returns {undefind}
 */
function reset () {
    // default options
    defaultCacheClient = undefined
    defaultLogClient = undefined
    defaultStrictArgs = true
    // global data stores
    binds = {}
    caches = {}
    modules = {}
}

/**
 * @function strictArgs
 *
 * get/set the default value for strict args
 *
 * @param {boolean} strictArgs
 *
 * @returns {boolean}
 */
function strictArgs (strictArgs) {
    // set default if value passed
    if (typeof strictArgs === 'boolean') {
        defaultStrictArgs = strictArgs
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
    if (bindMethodBinds[method.meta.signature]) {
        throw new Error('bind error: method '+method.meta.signature+' already bound '+bindMethod+' to '+signature.signature)
    }
    // add bind method entry
    bindMethodBinds[method.meta.signature] = {
        bound: false,
        method: method,
    }
    // bind to method if it exists
    doBindForMethod(signature.signature)
}

/**
 * @function cacheDeferred
 *
 * @param {string} moduleName - name of module
 * @param {object} module - module
 */
function cacheDeferred (moduleName, module) {
    // return unless there are deferred binds to process
    if (!deferredCache[moduleName]) {
        return
    }
    // get all function names for deferred binds
    _.forEach(deferredCache[moduleName], function (spec, functionName) {
        // set cache spec
        module.cache(moduleName, functionName, spec)
    })
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
 * @function getValidOptions
 *
 * validate options param and set defaults
 *
 * @param {*} options
 *
 * @returns {object}
 *
 * @throws {Error} on invalid arguments
 */
function getValidOptions (options) {
    // require object if options is defined
    if (options !== undefined && typeof options !== 'object') {
        throw new Error('options error: options must be an object')
    }
    // default options to empty object
    if (!options) {
        options = {}
    }
    // validate cache client if passed
    if (options.cacheClient !== undefined) {
        requireValidCacheClient(options.cacheClient)
    }
    // otherwise use default
    else {
        options.cacheClient = defaultCacheClient
    }
    // validate log client if passed
    if (options.logClient !== undefined) {
        requireValidLogClient(options.logClient)
    }
    // otherwise set default
    else {
        options.logClient = defaultLogClient
    }
    // set default for strict args
    if (options.strictArgs === undefined) {
        options.strictArgs = defaultStrictArgs
    }
    // return options
    return options
}