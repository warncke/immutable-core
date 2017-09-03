'use strict'

/* native modules */
const assert = require('assert')

/* npm modules */
const Ajv = require('ajv')
const ImmutableAI = require('immutable-ai')
const _ = require('lodash')
const defined = require('if-defined')
const requireValidLogClient = require('immutable-require-valid-log-client')
const getEnv = require('get-env')

/* application modules */
const ImmutableCoreModule = require('./immutable-core-module')
const ImmutableFunction = require('./immutable-function')
const getValidSignature = require('./get-valid-signature')
const requireValidCacheClient = require('./require-valid-cache-client')
const requireValidName = require('./require-valid-name')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')

/* exports */

const ImmutableCore = {
    // bind methods
    after: after,
    afterDetach: afterDetach,
    before: before,
    beforeDetach: beforeDetach,
    with: _with,
    withDetach: withDetach,
    // define caching
    cache: cache,
    // check if functions modules and methods exist
    hasFunction: hasFunction,
    hasMethod: hasMethod,
    hasModule: hasModule,
    // get/set functions module and methods
    function: getFunction,
    method: getMethod,
    module: getModule,
    // get/set module global data
    getData: getData,
    setData: setData,
    // set default options
    ajv: ajv,
    allowOverride: allowOverride,
    automock: automock,
    cacheClient: cacheClient,
    freeze: freeze,
    freezeData: freezeData,
    immutableAI: immutableAI,
    logClient: logClient,
    resolve: resolve,
    strictArgs: strictArgs,
    validateArgs: validateArgs,
    validateReturn: validateReturn,
    // access global data
    getGlobal: getGlobal,
    reset: reset,
    // class properties
    ImmutableCore: true,
    class: 'ImmutableCore',
}

module.exports = ImmutableCore

/* global variables */

// default options - optionName: defaultOptionName
const defaultOptions = {
    ajv: 'defaultAjv',
    allowOverride: 'defaultAllowOverride',
    automock: 'defaultAutomock',
    cacheClient: 'defaultCacheClient',
    freeze: 'defaultFreeze',
    freezeData: 'defaultFreezeData',
    immutableAI: 'defaultImmutableAI',
    logClient: 'defaultLogClient',
    resolve: 'defaultResolve',
    strictArgs: 'defaultStrictArgs',
    validateArgs: 'defaultValidateArgs',
    validateReturn: 'defaultValidateReturn',
}
// environment
const env = getEnv()
// get reference to global singleton instance
const immutable = getGlobal()

// initialize ImmutableAI with ImmutableCore instance
ImmutableAI.immutableCore(ImmutableCore)

/* public functions */

/**
 * @function after
 *
 * bind ImmutableCoreModule method to execute after the target
 * ImmutableCoreModule method identified by signature.
 *
 * bound method will execute after the target method resolves. if the target
 * method rejects then the after method will not be executed.
 *
 * resolution of the target method call will not complete until the bound
 * method resolves. if the after method rejects the target method will reject.
 *
 * data return by after method will be merged into the data returned by the
 * target method if both methods return objects. If non-object value is
 * returned by either the value returned by after will replace.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableCoreModule method to bind
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
 * bind ImmutableCoreModule method to execute after the target
 * ImmutableCoreModule method identified by signature.
 *
 * unlike `after` methods `afterDetach` methods do not block resolution of
 * the target method and if they reject this will not result in the target
 * method rejecting.
 *
 * any data return will be ignored.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableCoreModule method to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function afterDetach (signature, method) {
    return bind('afterDetach', signature, method)
}

/**
 * @function ajv
 *
 * get/set the default ajv validator
 *
 * @param {Ajv} ajv
 *
 * @returns {Ajv|ImmutableCore}
 */
function ajv (ajv) {
    // set default if value passed
    if (defined(ajv)) {
        immutable.defaultAjv = ajv
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultAjv
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
    if (defined(allowOverride)) {
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
    if (defined(automock)) {
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
 * bind ImmutableCoreModule method to execute before the target
 * ImmutableCoreModule method identified by signature.
 *
 * bound method must resolve before the target method is called. if the before
 * method rejects then the target method will not be called.
 *
 * data return by before method will be merged into the args for the target
 * method before calling the target method.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableCoreModule method to bind
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
 * bind ImmutableCoreModule method to execute before the target
 * ImmutableCoreModule method identified by signature.
 *
 * unlike `before` methods `beforeDetach` methods do not block calling of the
 * target method and if they reject this does not prevent target method from
 * resolving.
 *
 * any data returned by before method is ignored.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableCoreModule method to bind
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
    // make sure cache is object
    cache = requireValidOptionalObject(cache)
    // create cache entry for module if it does not exist
    if (!defined(immutable.caches[signature.moduleName])) {
        immutable.caches[signature.moduleName] = {}
    }
    var moduleCaches = immutable.caches[signature.moduleName]
    // throw error if attempting to add multiple caching rules to the same method
    if (defined(moduleCaches[signature.methodName]) && !immutable.defaultAllowOverride) {
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
    if (defined(cacheClient)) {
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
 * @function freeze
 *
 * get/set the default freeze option
 *
 * @param {boolean} freeze
 *
 * @returns {ImmutableCore|boolean}
 */
function freeze (freeze) {
    if (defined(freeze)) {
        // set default
        immutable.defaultFreeze = freeze ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultFreeze
}

/**
 * @function freezeData
 *
 * get/set the default freezeData option
 *
 * @param {boolean} freezeData
 *
 * @returns {ImmutableCore|boolean}
 */
function freezeData (freezeData) {
    if (defined(freezeData)) {
        // set default
        immutable.defaultFreezeData = freezeData ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultFreezeData
}

/**
 * @function getData
 *
 * get global data for module - optionally throw error if require is set
 *
 * @param {string} moduleName
 * @param {boolean} require
 *
 * @returns {object|undefined}
 *
 * @throws {Error}
 */
function getData (moduleName, require) {
    // get module - throws error if not defined
    var module = getModule(moduleName)
    // if require flag is set throw error if data is not defined
    if (require === true && !defined(module.meta.data)) {
        throw new Error(`no data for ${moduleName}`)
    }
    // return data if any
    return module.meta.data
}

/**
 * @function getFunction
 *
 * get and optionally create a new function. if function is passed then new
 * function will be created, otherwise existing function will be returned.
 *
 * errors will be thrown on attempts to create multiple functions with the
 * same name.
 *
 * error will be thrown if attempting to get function that is not defined.
 *
 * @param {string} functionName - name of function
 * @param {object} functionObj - function (optional)
 * @param {object} options - options (optional)
 *
 * @returns {function}
 *
 * @throws {Error}
 */
function getFunction (functionName, functionObj, options) {
    // if function not being defined then attempt to get
    if (!defined(functionObj)) {
        // require function to be defined
        if (!defined(immutable.functions[functionName])) {
            throw new Error(`function error: function not found ${functionName}`)
        }
        // return function
        return immutable.functions[functionName]
    }
    // get validated options with defaults set
    options = getValidOptions(options, true)
    // throw error if function already defined and allow override not
    if (defined(immutable.functions[functionName]) && !options.allowOverride) {
        throw new Error(`function error: ${functionName} already defined`)
    }
    // create new function
    immutable.functions[functionName] = new ImmutableFunction(functionName, functionObj, options)
    // return function
    return immutable.functions[functionName]
}

/**
 * @function getGlobal
 *
 * return global data - initialize of not defined
 *
 * @returns {object}
 */
function getGlobal () {
    // return global data if defined
    if (defined(global.__immutable_core__)) {
        return global.__immutable_core__   
    }
    // create global data object
    global.__immutable_core__ = {}
    // initialize global defaults
    reset()
    // return global data
    return global.__immutable_core__
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
    if (!defined(module)) {
        throw new Error(`method error: module not found ${signature.signature}`)
    }
    // if method not passed then attempt to get existing
    if (!defined(method)) {
        // throw error if method not defined
        if (!defined(module[signature.methodName])) {
            throw new Error(`method error: method not found ${signature.signature}`)
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
    if (!defined(methods)) {
        // throw error if module not defined
        if (!defined(immutable.modules[name])) {
            throw new Error(`module error: module not found ${name}`)
        }
        // return module
        return immutable.modules[name]
    }
    // if methods were passed throw error if module already defined
    if (defined(immutable.modules[name]) && !options.allowOverride) {
        throw new Error(`module error: module already defined ${name}`)
    }
    // create new module
    var module = immutable.modules[name] = new ImmutableCoreModule(name, options)
    // add methods to object
    _.each(methods, (method, methodName) => {
        // create new method use module options
        module.method(methodName, method, module.meta.options)
        // bind to method if it exists
        doBindForMethod(`${name}.${methodName}`)
    })
    // return module
    return module
}

/**
 * @function hasFunction
 *
 * check if function exists.
 *
 * @param {string} functionName
 *
 * @returns {boolean}
 */
function hasFunction (functionName) {
    // check if function exists
    return defined(immutable.functions[functionName]) ? true : false
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
    if (!defined(module)) {
        return false
    }
    // check if method exists
    return defined(module[signature.methodName]) ? true : false
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
    return defined(immutable.modules[name]) ? true : false
}

/**
 * @function immutableAi
 *
 * set global flag for whether or not to use ImmutableAI
 *
 * @param {boolean} bool
 *
 * @returns {ImmutableCore|boolean}
 */
function immutableAI (immutableAI) {
    if (defined(immutableAI)) {
        // set default
        immutable.defaultImmutableAI = immutableAI
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultImmutableAI
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
    if (defined(logClient)) {
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
    var immutable = global.__immutable_core__
    // default options
    immutable.defaultAjv = new Ajv({
        allErrors: true,
        coerceTypes: 'array',
        removeAdditional: true,
        useDefaults: true,
        v5: true,
    })
    immutable.defaultAllowOverride = false
    immutable.defaultAutomock = undefined
    immutable.defaultCacheClient = undefined
    immutable.defaultFreeze = env === 'prod' ? false : true
    immutable.defaultFreezeData = true
    immutable.defaultImmutableAI = true
    immutable.defaultLogClient = undefined
    immutable.defaultResolve = true
    immutable.defaultStrictArgs = true
    immutable.defaultValidateArgs = true
    immutable.defaultValidateReturn = true
    // global data stores
    immutable.binds = {}
    immutable.caches = {}
    immutable.functions = {}
    immutable.modules = {}
    // return immutable
    return ImmutableCore
}

/**
 * @function resolve
 *
 * get/set the default resolve option
 *
 * @param {boolean} resolve
 *
 * @returns {ImmutableCore|boolean}
 */
function resolve (resolve) {
    if (defined(resolve)) {
        // set default
        immutable.defaultResolve = resolve ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultResolve
}

/**
 * @function setData
 *
 * set global data for module
 *
 * @param {string} moduleName
 * @param {object} data
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function setData (moduleName, data) {
    // get module - throws error if not defined
    var module = getModule(moduleName)
    // set data
    module.meta.data = data
    // return module
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
    if (defined(strictArgs)) {
        immutable.defaultStrictArgs = strictArgs ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultStrictArgs
}

/**
 * @function with
 *
 * bind ImmutableCoreModule method to execute at the same time as the target
 * ImmutableCoreModule method identified by signature.
 *
 * bound method will execute after any methods bound before the target method
 * and will recieve the same args as the target method.
 *
 * resolution of the target method call will not complete until the bound
 * method resolves. if the with method rejects the target method will reject.
 *
 * data return by with method will be merged into the data returned by the
 * target method if both methods return objects.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableCoreModule method to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function _with (signature, method) {
    return bind('with', signature, method)
}

/**
 * @function withDetach
 *
 * bind ImmutableCoreModule method to execute at the same time as the target
 * ImmutableCoreModule method identified by signature.
 *
 * bound method will execute after any methods bound before the target method
 * and will recieve the same args as the target method.
 *
 * unlike with methods withDetach methods do not block resolution of the
 * target method and if they reject this will not result in the target
 * method rejecting.
 *
 * any data return will be ignored.
 *
 * @oaram {string} signature - moduleName.functionName to bind to
 * @param {function} method - ImmutableCoreModule method to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function withDetach (signature, method) {
    return bind('withDetach', signature, method)
}

/**
 * @function validateArgs
 *
 * get/set the default value for json schema validation of args values
 *
 * @param {boolean} validateArgs
 *
 * @returns {ImmutableCore|boolean}
 */
function validateArgs (validateArgs) {
    // set default if value passed
    if (defined(validateArgs)) {
        immutable.defaultValidateArgs = validateArgs ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultValidateArgs
}

/**
 * @function validateReturn
 *
 * get/set the default value for json schema validation of return values
 *
 * @param {boolean} validateReturn
 *
 * @returns {ImmutableCore|boolean}
 */
function validateReturn (validateReturn) {
    // set default if value passed
    if (defined(validateReturn)) {
        immutable.defaultValidateReturn = validateReturn ? true : false
        // return immutable
        return ImmutableCore
    }
    // return default value
    return immutable.defaultValidateReturn
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
 * @param {string} bindType - when and how to bind
 * @param {string} signature - moduleName.functionName to bind to
 * @param {function} method - function to bind
 *
 * @returns {ImmutableCore}
 *
 * @throws {Error}
 */
function bind (bindType, signature, method) {
    // validate signature
    signature = getValidSignature(signature)
    // require valid bind method
    if (typeof method !== 'function' || !defined(method.meta)) {
        throw new Error('invalid bind method')
    }
    // create bind entry for module if it does not exist
    if (!defined(immutable.binds[signature.moduleName])) {
        immutable.binds[signature.moduleName] = {}
    }
    var moduleBinds = immutable.binds[signature.moduleName]
    // create bind entry for method if it does not exist
    if (!defined(moduleBinds[signature.methodName])) {
        moduleBinds[signature.methodName] = {}
    }
    var methodBinds = moduleBinds[signature.methodName]
    // create bind entry for bind type if it does not exist
    if (!defined(methodBinds[bindType])) {
        methodBinds[bindType] = {}
    }
    var bindTypeBinds = methodBinds[bindType]
    // throw error on override
    if (defined(bindTypeBinds[method.meta.signature]) && !immutable.defaultAllowOverride) {
        throw new Error(`bind error: method ${method.meta.signature} already bound ${bindType} to ${signature.signature}`)
    }
    // add bind method entry
    bindTypeBinds[method.meta.signature] = {
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
    // if method is not defined do nothing
    if (!hasMethod(signature.signature)) {
        return
    }
    // get method and module
    var method = getMethod(signature.signature)
    var module = getModule(signature.moduleName)
    // skip if no binds for module
    if (!defined(immutable.binds[signature.moduleName])) {
        return
    }
    // skip if no binds for method
    if (!defined(immutable.binds[signature.moduleName][signature.methodName])) {
        return
    }
    // get all binds for method indexed by bind method
    var bindTypeBinds = immutable.binds[signature.moduleName][signature.methodName]
    // iterate over each bind method
    _.each(bindTypeBinds, (boundMethods, bindType) => {
        // iterate over each bind
        _.each(boundMethods, boundMethod => {
            // do nothing if already bound
            if (boundMethod.bound) {
                return
            }
            // bind method
            module.bind(bindType, signature.methodName, boundMethod.method)
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
    // if method is not defined do nothing
    if (!hasMethod(signature.signature)) {
        return
    }
    // get method and module
    var method = getMethod(signature.signature)
    var module = getModule(signature.moduleName)
    // skip if no caches for module
    if (!defined(immutable.caches[signature.moduleName])) {
        return
    }
    // skip if no caches for method
    if (!defined(immutable.caches[signature.moduleName][signature.methodName])) {
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
    // make sure options is object
    options = requireValidOptionalObject(options)
    // validate automock if passed
    if (defined(options.automock)) {
        if (typeof options.automock !== 'function') {
            throw new Error('options error: automock must be function')
        }
    }
    // validate cache client if passed
    if (defined(options.cacheClient)) {
        requireValidCacheClient(options.cacheClient)
    }
    // validate log client if passed
    if (defined(options.logClient)) {
        requireValidLogClient(options.logClient)
    }

    // do not set default values unless flag set
    if (!setDefaults) {
        return options
    }

    // set defaults
    _.each(defaultOptions, (defaultOptionName, optionName) => {
        if (!defined(options[optionName])) {
            options[optionName] = immutable[defaultOptionName]
        }
    })

    // return options
    return options
}