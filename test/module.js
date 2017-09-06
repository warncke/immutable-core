'use strict'

/* npm modules */
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSubset = require('chai-subset')
const sinon = require('sinon')

/* app modules */
const ImmutableCore = require('../lib/immutable-core')
const MockLogClient = require('../mock/mock-log-client')
const MockCacheClient = require('../mock/mock-cache-client')

/* chai config */
chai.use(chaiAsPromised)
chai.use(chaiSubset)
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core modules', function () {

    var sandbox

    var cacheClient, logClient

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset()
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
        // create mock log client
        logClient = new MockLogClient(sandbox)
        // create mock cache client
        cacheClient = new MockCacheClient(sandbox)
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should allow creating a new module without any methods', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // test name
        assert.strictEqual(fooModule.meta.name, 'FooModule')
    })

    it('module should have correct default options', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // test default options
        assert.containSubset(fooModule.meta.options, {
            allowOverride: false,
            automock: undefined,
            cacheClient: undefined,
            freeze: false,
            freezeData: true,
            immutableAI: true,
            logClient: undefined,
            resolve: false,
            strictArgs: true,
        })
    })

    it('should allow setting custom options', function () {
        // create FooModule with custom options
        var fooModule = ImmutableCore.module('FooModule', {}, {
            allowOverride: true,
            cacheClient: cacheClient,
            freeze: true,
            freezeData: false,
            immutableAI: false,
            logClient: logClient,
            resolve: true,
            strictArgs: false,
        })
        // test default options
        assert.containSubset(fooModule.meta.options, {
            allowOverride: true,
            cacheClient: cacheClient,
            freeze: true,
            freezeData: false,
            immutableAI: false,
            logClient: logClient,
            resolve: true,
            strictArgs: false,
        })
    })

    it('should add method to module', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // add method
        var foo = fooModule.method('foo', () => true)
        // check that foo added
        assert.isFunction(fooModule.foo)
        // check that method added to global register
        assert.isTrue(ImmutableCore.hasMethod('FooModule.foo'))
    })

    it('should add bind to method', function () {
        // create FooModule with bar and foo methods
        var fooModule = ImmutableCore.module('FooModule', {
            bar: () => true,
            foo: () => true,
        })
        // bind bar to foo
        fooModule.bind('with', 'foo', fooModule.bar)
        // check that bind added to global config
        assert.containSubset(ImmutableCore.getGlobal(), {
            binds: {FooModule: {foo: {with: {'FooModule.bar': {
                bound: true,
                method: fooModule.bar,
            }}}}}
        })
    })

    it('should add cache to method', function () {
        // create FooModule with bar and foo methods
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // and cache to foo
        fooModule.cache('foo', {cacheClient: cacheClient})
        // check that bind added to global config
        assert.containSubset(ImmutableCore.getGlobal(), {
            caches: {FooModule: {foo: {
                cached: true,
                cacheClient: cacheClient,
            }}}
        })
    })

    it('should throw error on invalid cache client option', function () {
        // create FooModule with bad cache client
        assert.throws(() => {
            ImmutableCore.module('FooModule', {}, {
                cacheClient: () => true,
            })
        })
    })

    it('should throw error on invalid log client option', function () {
        // create FooModule with bad cache client
        assert.throws(() => {
            ImmutableCore.module('FooModule', {}, {
                logClient: () => true,
            })
        })
    })

    it('should allow setting custom options', function () {
        // set defaults
        ImmutableCore.allowOverride(true)
        ImmutableCore.cacheClient(cacheClient)
        ImmutableCore.freeze(true)
        ImmutableCore.freezeData(false)
        ImmutableCore.immutableAI(false)
        ImmutableCore.logClient(logClient)
        ImmutableCore.resolve(true)
        ImmutableCore.strictArgs(false)
        // create FooModule with custom options
        var fooModule = ImmutableCore.module('FooModule', {})
        // test default options
        assert.containSubset(fooModule.meta.options, {
            allowOverride: true,
            cacheClient: cacheClient,
            freeze: true,
            freezeData: false,
            immutableAI: false,
            logClient: logClient,
            resolve: true,
            strictArgs: false,
        })
    })

    it('should throw error on invalid cache client default', function () {
        // attempt to set bad cache client default
        assert.throws(() => ImmutableCore.cacheClient(() => true))
    })

    it('should throw error on invalid log client default', function () {
        // attempt to set bad log client default
        assert.throws(() => ImmutableCore.logClient(() => true))
    })

    it('should allow creating multiple modules', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // test name
        assert.strictEqual(fooModule.meta.name, 'FooModule')
        // create BarModule with no methods
        var barModule = ImmutableCore.module('BarModule', {})
        // test name
        assert.strictEqual(barModule.meta.name, 'BarModule')
    })

    it('should allow getting module after it is created', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // create BarModule with no methods
        var barModule = ImmutableCore.module('BarModule', {})
        // test get module
        assert.strictEqual(ImmutableCore.module('FooModule'), fooModule)
        assert.strictEqual(ImmutableCore.module('BarModule'), barModule)
    })

    it('should throw an error when trying to redefine a module', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // attempt to create moudle again
        assert.throws(() => ImmutableCore.module('FooModule', {}))
    })

    it('should not throw an error when trying to redefine a module and allowOverride set', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // attempt to create moudle again
        assert.doesNotThrow(() => ImmutableCore.module('FooModule', {}, {allowOverride: true}))
    })

    it('should throw an error when trying to get an undefined module', function () {
        // attempt to get undefined module
        assert.throws(() => ImmutableCore.module('FooModule'))
    })

    it('should throw an error when passing invalid options', function () {
        // attempt to create module with invalid options
        assert.throws(() => ImmutableCore.module('FooModule', {}, 0))
    })

    it('should throw an error when creating module with invalid name', function () {
        // attempt to create module with invalid name
        assert.throws(() => ImmutableCore.module('', {}))
        assert.throws(() => ImmutableCore.module(0, {}))
        assert.throws(() => ImmutableCore.module('module', {}))
        assert.throws(() => ImmutableCore.module('Foo.Bar', {}))
    })

    it('should test if module exists', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // check that module exists
        assert.isTrue(ImmutableCore.hasModule('FooModule'))
    })

    it('should test if module does not exist', function () {
        // check that module does not exist
        assert.isFalse(ImmutableCore.hasModule('FooModule'))
    })

    it('should throw error when checking if invalid name exists', function () {
        // attempt to check if invalid name exists
        assert.throws(() => ImmutableCore.hasModule(''))
    })
})