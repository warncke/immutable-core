'use strict'

/* npm modules */
const Promise = require('bluebird')
const _ = require('lodash')
const deepFreeze = require('deep-freeze-strict')
const deepResolve = require('deep-resolve')
const defined = require('if-defined')
const immutableAI = require('immutable-ai')
const instanceId = require('immutable-instance-id')
const microTimestamp = require('micro-timestamp')
const randomUniqueId = require('random-unique-id')
const requireValidOptionalObject = require('immutable-require-valid-optional-object')
const stableId = require('stable-id')

/* application modules */
const requireValidCacheClient = require('./require-valid-cache-client')
const requireValidName = require('./require-valid-name')

/* public functions */
module.exports = ImmutableCoreModule

/* global variables */

// valid bind types
const bindTypes = {
    after: true,
    afterDetach: true,
    before: true,
    beforeDetach: true,
    with: true,
    withDetach: true,
}

// detach bind types
const detachBindTypes = {
    afterDetach: true,
    beforeDetach: true,
    withDetach: true,
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
    // hidden variable for global meta data
    var data
    // create getter/setter for global meta data
    Object.defineProperty(this.meta, 'data', {
        get: () => data,
        set: (newData) => {
            // require valid data
            if (typeof newData !== 'object' || newData === null) {
                throw new Error(`invalid data for ${this.meta.name}`)
            }
            // get data id
            var dataId = stableId(newData)
            // if data has not changed do not set
            if (dataId === this.meta.dataId) {
                return
            }
            // freeze data
            if (this.meta.options.freezeData) {
                deepFreeze(newData)
            }
            // set data and dataId
            data = newData
            this.meta.dataId = dataId
            // log data set
            if (defined(this.meta.options.logClient)) {
                this.meta.options.logClient.log('setData', {
                    data: newData,
                    dataCreateTime: microTimestamp(),
                    dataId: dataId,
                    instanceId: instanceId.id,
                    moduleName: this.meta.name,
                })
            }
        },
    })
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
 * bindType must be one of globally defined bindTypes
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
    // get immutable global data store
    var immutable = global.__immutable_core__
    // require immutable global to exist
    this.assert(defined(immutable), 'global.__immutable_core__ not defined')
    // create bind entry for module if it does not exist
    if (!defined(immutable.binds[this.meta.name])) {
        immutable.binds[this.meta.name] = {}
    }
    var moduleBinds = immutable.binds[this.meta.name]
    // create bind entry for method if it does not exist
    if (!defined(moduleBinds[methodName])) {
        moduleBinds[methodName] = {}
    }
    var methodBinds = moduleBinds[methodName]
    // create bind entry for bind type if it does not exist
    if (!defined(methodBinds[bindType])) {
        methodBinds[bindType] = {}
    }
    var bindTypeBinds = methodBinds[bindType]
    // get global bind if any
    var globalBind = bindTypeBinds[bindMethod.meta.signature]
    // throw error on override
    this.assert(!defined(globalBind) || !globalBind.bound || immutable.defaultAllowOverride, `method ${bindMethod.meta.signature} already bound ${bindType} to ${methodName}`)
    // add bind to global binds
    if (defined(globalBind)) {
        globalBind.bound = true
    }
    // create global bind
    else {
        bindTypeBinds[bindMethod.meta.signature] = {
            bound: true,
            method: bindMethod,
        }
    }
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
    cache = requireValidOptionalObject(cache)
    // set default cacheClient if not defined
    if (!defined(cache.cacheClient)) {
        cache.cacheClient = this.meta.options.cacheClient
    }
    // validate cache client
    requireValidCacheClient(cache.cacheClient)
    // get immutable global data store
    var immutable = global.__immutable_core__
    // require immutable global to exist
    this.assert(defined(immutable), 'global.__immutable_core__ not defined')
    // create cache entry for module if it does not exist
    if (!defined(immutable.caches[this.meta.name])) {
        immutable.caches[this.meta.name] = {}
    }
    var moduleCaches = immutable.caches[this.meta.name]
    // get global cache entry if any
    var globalCache = moduleCaches[methodName]
    // throw error if attempting to add multiple caching rules to the same method
    this.assert(!defined(globalCache) || !globalCache.cached || immutable.defaultAllowOverride, `cache already defined for ${methodName}`)
    // create global cache entry
    if (!defined(globalCache)) {
        globalCache = moduleCaches[methodName] = cache
    }
    // set global cache as cached
    globalCache.cached = true
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
    // make sure options is object
    options = requireValidOptionalObject(options)
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
        // ajv json schema validator instance
        ajv: defined(options.ajv) ? options.ajv : this.meta.options.ajv,
        // automock function
        automock: defined(options.automock) ? options.automock : this.meta.options.automock,
        // freeze args and return values
        freeze: defined(options.freeze) ? !!options.freeze : this.meta.options.freeze,
        // enable Immutable AI
        immutableAI: defined(options.immutableAI) ? options.immutableAI : this.meta.options.immutableAI,
        // set logging client using either method options or module options
        logClient: defined(options.logClient) ? options.logClient : this.meta.options.logClient,
        // original method function
        method: method,
        // method name
        methodName: methodName,
        // module name
        moduleName: this.meta.name,
        // resolve promises in args and return values
        resolve: defined(options.resolve) ? !!options.resolve : this.meta.options.resolve,
        // json schema
        schema: defined(options.schema) ? options.schema : {},
        // method signature - ModuleName.methodName
        signature: `${this.meta.name}.${methodName}`,
        // strict mode for args only - do not require return to be promise
        strictArgs: options.strictArgs !== undefined ? options.strictArgs : this.meta.options.strictArgs,
        // allow arg validation to be disabled
        validateArgs: defined(options.validateArgs) ? !!options.validateArgs : this.meta.options.validateArgs,
        // allow return validation to be disabled
        validateReturn: defined(options.validateReturn) ? !!options.validateReturn : this.meta.options.validateReturn,
    }
    // get schema
    var schema = methodMeta.schema
    // intialize args schema
    if (defined(schema.args)) {
        // create unique schema id
        schema.args.id = `/module/${this.meta.name}/${methodName}/args`
        // default schema type to object
        if (!defined(schema.args.type)) {
            schema.args.type = 'object'
        }
        // add schema to validator
        methodMeta.ajv.addSchema(schema.args, schema.args.id)
    }
    // intialize return schema
    if (defined(schema.return)) {
        // create unique schema id
        schema.return.id = `/module/${this.meta.name}/${methodName}/return`
        // default schema type to object
        if (!defined(schema.return.type)) {
            schema.return.type = 'object'
        }
        // add schema to validator
        methodMeta.ajv.addSchema(schema.return, schema.return.id)
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
     * @param {string} bindSignature
     * @param {string} bindType
     *
     * @returns {Promise}
     *
     * @throws {Error}
     */
    var methodWrapperFunction = function methodWrapperFunction (args, bindSignature, bindType) {
        // throw exception on invalid arguments
        if (methodMeta.strictArgs && arguments.length > 1 && !bindTypes[bindType]) {
            return Promise.reject(new Error(`${methodMeta.signature}: too many arguments`))
        }
        // get validated and shallow-cloned args with module call data added
        return getValidArgs(args, bindSignature, bindType, methodMeta)
        // run before methods
        .then(args => {
            // log module call
            logCall(args, methodMeta)
            // if this method is bound to another add info to stack
            var stack = bindTypes[bindType]
                ? `${methodMeta.signature},${bindType},${bindSignature}`
                : methodMeta.signature
            // add current call to stack after logging
            args.session.stack.push(stack)
            // run any beforeDetach extensions
            runBeforeDetach(args, methodMeta)
            // run any before extensions
            return runBefore(args, methodMeta)
        })
        // call target function with potentially modified args
        .then(args => {
            // validate args after before methods execute
            validateArgs(args, methodMeta)
            // run any withDetach extensions
            runWithDetach(args, methodMeta)
            // run any with extensions
            var runWith = runWithBefore(args, methodMeta)
            // get return value for method call with optional caching
            var ret = methodMeta.cache
                // method call should be cached
                ? runCached(args, methodMeta)
                // method call should not be cached
                : runNotCached(args, methodMeta)
            // if there are any with exensions merge them in
            if (defined(runWith)) {
                ret = runWithAfter(ret, runWith)
            }
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
 * @param {string} bindSignature
 * @param {string} bindType
 * @param {object} methodMeta
 *
 * @returns {object}
 *
 * @throws (Error)
 */
function getValidArgs (args, bindSignature, bindType, methodMeta) {
    // require object for args
    if (!args || typeof args !== 'object') {
        // throw exception in strict mode
        if (methodMeta.strictArgs) {
            return Promise.reject(new Error(`${methodMeta.signature}: invalid args - ${typeof args}`))
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
            return Promise.reject(new Error(`${methodMeta.signature}: invalid session - ${typeof args.session}`))
        }
        // otherwise create new object for args
        else {
            args.session = {}
        }
    }
    // shallow clone args
    args = _.clone(args)
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
    // resolve any promises in args - do not resolve on bound methods because
    // args will already be resolved by primary method call
    if (methodMeta.resolve && !defined(bindType)) {
        return deepResolve(args)
    }
    // return valid args
    else {
        return Promise.resolve(args)
    }
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
    if (!defined(methodMeta.after)) {
        return ret
    }
    // after original promise resolves then run after methods
    return ret.then(res => {
        // build arguments for after methods
        args = {
            args: defined(args.args) ? args.args : args,
            res: res,
            origRes: defined(args.origRes) ? args.origRes : args.res,
            session: args.session,
        }
        // wait for all extension methods to complete
        return Promise.all(
            // run all after methods in order making sure they return promise
            _.map(methodMeta.after, method => {
                return (method)(args, methodMeta.signature, 'after')
            })
        )
        // merge returned data into original
        .then(function (results) {
            // either merge or replace result
            _.each(results, result => {
                // both original res and after result are objects
                if (typeof res === 'object' && res !== null && typeof result === 'object' && result !== null) {
                    // merge after into original
                    _.merge(res, result)
                }
                // one is not an object
                else if (result !== undefined) {
                    // replace original with after
                    res = result
                }
            })
            // return final result
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
    if (!defined(methodMeta.afterDetach)) {
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
            (method)(args, methodMeta.signature, 'afterDetach')
            // log errors
            .catch(err => {
                // require log client
                if (!defined(methodMeta.logClient)) {
                    return
                }
                // log error
                methodMeta.logClient.error(err, args.session)
            })
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
    if (!defined(methodMeta.before)) {
        return Promise.resolve(args)
    }
    // wait for all extension methods to complete
    return Promise.all(
        // run all before methods in order making sure they return promise
        _.map(methodMeta.before, method => {
            return (method)(args, methodMeta.signature, 'before')
        })
    )
    // merge return values in args
    .then(results => {
        // merge each result into original args
        _.each(results, result => {
            if (typeof result === 'object' && result !== null) {
                _.merge(args, result)
            }
        })
        // resolve with merged result
        return args
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
    if (!defined(methodMeta.beforeDetach)) {
        return
    }
    // run all functions
    _.each(methodMeta.beforeDetach, method => {
        // call method
        (method)(args, methodMeta.signature, 'beforeDetach')
        // log errors
        .catch(err => {
            // require log client
            if (!defined(methodMeta.logClient)) {
                return
            }
            // log error
            methodMeta.logClient.error(err, args.session)
        })
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
        // cached value not found
        if (res === null) {
            // cached value not found, call method
            return runNotCached(args, methodMeta)
            // if method call resolves then cache results
            .then(res => {
                // cache result if not null
                if (res !== null) {
                    cache.expire
                        // cache response with expiration
                        ? cache.cacheClient.setex(key, res, cache.expire, args.session)
                        // cache response without expiration
                        : cache.cacheClient.set(key, res, args.session)
                }
                // resolve with response
                return res
            })
        }
        // cached value found
        else {
            // if result is object then add cache key to it
            if (typeof res === 'object') {
                res._cached = key
            }
            // resolve with response
            return res
        }
    })
    // cache get error
    .catch(err => {
        // if cache get had error then call method
        return runNotCached(args, methodMeta)
        // if method call resolves then cache results
        .then(res => {
            // cache result if not null
            if (res !== null) {
                cache.expire
                    // cache response with expiration
                    ? cache.cacheClient.setex(key, res, cache.expire, args.session)
                    // cache response without expiration
                    : cache.cacheClient.set(key, res, args.session)
            }
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
    // freeze args
    if (methodMeta.freeze) {
        // clone args to prevent leaking frozen objects
        args = _.cloneDeep(args)
        // recursively freeeze all objects in args
        deepFreeze(args)
    }
    // promise to be resolved with method result
    var promise
    // Immutable AI enabled
    if (methodMeta.immutableAI) {
        // create immutable ai instance
        var ai = immutableAI(args)
        // call method with Immutable AI instance
        promise = Promise.resolve( methodMeta.method.call(ai, args) )
    }
    // Immutable AI disabled
    else {
        promise = Promise.resolve( (methodMeta.method)(args) )
    }
    // args are frozen
    if (methodMeta.freeze) {
        // after result resolves clone to prevent leaking frozen objects
        promise = promise.then(_.cloneDeep)
    }
    // resolve promises
    if (methodMeta.resolve) {
        promise = promise.then(
            // if result is object then resolve promises
            ret => typeof ret === 'object' && ret !== null ? deepResolve(ret) : ret
        )
    }
    // validate return value
    if (defined(methodMeta.schema.return) && methodMeta.validateArgs) {
        promise = promise.then(ret => validateReturn(ret, methodMeta))
    }
    // return promise to be resolved with method result
    return promise
}

/**
 * @function runWithAfter
 *
 * merge results from run with methods into method result
 *
 * @param {object} ret
 * @param {array} runWith
 *
 * @returns {Promise}
 */
function runWithAfter (ret, runWith) {
    // after original promise resolves then run after methods
    return ret.then(res => {
        // wait for all extension methods to complete
        return Promise.all(runWith)
        // merge returned data into original
        .then(function (results) {
            // either merge or replace result
            _.each(results, result => {
                // both original res and after result are objects
                if (typeof res === 'object' && res !== null && typeof result === 'object' && result !== null) {
                    // merge after into original
                    _.merge(res, result)
                }
                // one is not an object
                else if (result !== undefined) {
                    // replace original with after
                    res = result
                }
            })
            // return final result
            return res
        })
    })
}

/**
 * @function runWithBefore
 *
 * execute with extensions. return list of promises.
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {array}
 */
function runWithBefore (args, methodMeta) {
    // resolve with original args if no before extensions
    if (!defined(methodMeta.with)) {
        return
    }
    // return list of promises from with methods
    return _.map(methodMeta.with, method => {
        return (method)(args, methodMeta.signature, 'with')
    })
}

/**
 * @function runWithDetach
 *
 * execute withDetach extensions.
 *
 * @param {object} args
 * @param {object} methodMeta
 */
function runWithDetach (args, methodMeta) {
    // skip if no withDetach methods
    if (!defined(methodMeta.withDetach)) {
        return
    }
    // run all functions
    _.each(methodMeta.withDetach, method => {
        // call method
        (method)(args, methodMeta.signature, 'withDetach')
        // log errors
        .catch(err => {
            // require log client
            if (!defined(methodMeta.logClient)) {
                return
            }
            // log error
            methodMeta.logClient.error(err, args.session)
        })
    })
}

/**
 * @function validateArgs
 *
 * validate args if schema is set
 *
 * @param {object} args
 * @param {object} methodMeta
 *
 * @returns {any}
 *
 * @throws {Error}
 */
function validateArgs (args, methodMeta) {
    // do not validate if no schema
    if (!defined(methodMeta.schema.args)) {
        return args
    }
    // do not validate if disabled
    if (!methodMeta.validateArgs) {
        return args
    }
    // get validator
    var ajv = methodMeta.ajv
    // throw error if validation fails
    if (!ajv.validate(methodMeta.schema.args.id, args)) {
        // create error
        var error = new Error(`${methodMeta.signature}: invalid args - ${ajv.errorsText()}`)
        // add ajv errors to error data
        error.data = ajv.errors
        // throw error
        throw error
    }
    // return possibly modified args
    return args
}

/**
 * @function validateReturn
 *
 * validate return if schema is set
 *
 * @param {object} ret
 * @param {object} methodMeta
 *
 * @returns {any}
 *
 * @throws {Error}
 */
function validateReturn (ret, methodMeta) {
    // do not validate if no schema
    if (!defined(methodMeta.schema.return)) {
        return ret
    }
    // do not validate if disabled
    if (!methodMeta.validateReturn) {
        return ret
    }
    // get validator
    var ajv = methodMeta.ajv
    // throw error if validation fails
    if (!ajv.validate(methodMeta.schema.return.id, ret)) {
        // create error
        var error = new Error(`${methodMeta.signature}: invalid return - ${ajv.errorsText()}`)
        // add ajv errors to error data
        error.data = ajv.errors
        // throw error
        throw error
    }
    // return possibly modified result
    return ret
}