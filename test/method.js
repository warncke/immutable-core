'use strict'

/* npm modules */
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSubset = require('chai-subset')
const sinon = require('sinon')

/* app modules */
const ImmutableCore = require('../lib/immutable-core')
const MockLogClient = require('../mock/mock-log-client')

/* chai config */
chai.use(chaiAsPromised)
chai.use(chaiSubset)
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core methods', function () {

    var sandbox

    var logClient

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset()
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
        // create mock logclient
        logClient = new MockLogClient(sandbox)
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should allow creating a new module with methods', function () {
        // create FooModule with foo method
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // test method
        assert.strictEqual(typeof fooModule.foo, 'function')
        // test method meta data
        assert.isObject(fooModule.foo.meta)
    })

    it('method should have correct meta data', function () {
        // create foo method
        var foo = () => true
        // create FooModule with foo method
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // check method meta
        assert.containSubset(fooModule.foo.meta, {
            method: foo,
            methodName: 'foo',
            moduleName: 'FooModule',
            signature: 'FooModule.foo',
            strictArgs: true,
        })
    })

    it('should use custom options from module', function () {
        // create FooModule with custom options
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        }, {
            logClient: logClient,
            strictArgs: false,
        })
        // get meta data
        var methodMeta = fooModule.foo.meta
        // test meta data
        assert.strictEqual(methodMeta.logClient, logClient)
        assert.strictEqual(methodMeta.strictArgs, false)
    })

    it('should allow setting custom options', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create foo method
        var fooMethod = ImmutableCore.method('FooModule.foo', function () {}, {
            defaultArgs: {foo: 0},
            logClient: logClient,
            strictArgs: false,
        })
        // check method meta
        assert.containSubset(fooModule.foo.meta, {
            defaultArgs: {foo: 0},
            logClient: logClient,
            strictArgs: false,
        })
    })

    it('should throw error on bad log client', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create foo method with bad log client
        assert.throws(() => {
            ImmutableCore.method('FooModule.foo', function () {}, {
                logClient: function () {},
            })
        })
    })    

    it('should allow creating methods one at a time', function () {
        // create foo method
        var foo = () => true
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create foo method
        var fooMethod = ImmutableCore.method('FooModule.foo', foo)
        // test that function created
        assert.strictEqual(typeof fooMethod, 'function')
        // check method meta
        assert.containSubset(fooModule.foo.meta, {
            method: foo,
            methodName: 'foo',
            moduleName: 'FooModule',
            signature: 'FooModule.foo',
            strictArgs: true,
        })
    })

    it('should allow creating multiple methods', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create foo method
        var fooMethod = ImmutableCore.method('FooModule.foo', () => true)
        // test that function created
        assert.strictEqual(typeof fooMethod, 'function')
        // create bar method
        var barMethod = ImmutableCore.method('FooModule.bar', () => true)
        // test that function created
        assert.strictEqual(typeof barMethod, 'function')
    })

    it('should allow getting method after it is created', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create foo method
        var fooMethod = ImmutableCore.method('FooModule.foo', () => true)
        // create bar method
        var barMethod = ImmutableCore.method('FooModule.bar', () => true)
        // test get module
        assert.strictEqual(ImmutableCore.method('FooModule.foo'), fooMethod)
        assert.strictEqual(ImmutableCore.method('FooModule.bar'), barMethod)
    })

    it('should throw an error when trying to redefine a method', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // create foo method
        var fooMethod = ImmutableCore.method('FooModule.foo', () => true)
        // attempt to create foo method again
        assert.throws(() => ImmutableCore.method('FooModule.foo', () => true))
    })

    it('should not throw an error when trying to redefine a method and global allow override set', function () {
        // allow redefining modules/methods
        ImmutableCore.allowOverride(true)
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // create foo method
        var fooMethod = ImmutableCore.method('FooModule.foo', () => true)
        // attempt to create foo method again
        assert.doesNotThrow(() => ImmutableCore.method('FooModule.foo', () => true))
    })

    it('should not throw an error when trying to redefine a method and module allow override set', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {}, {allowOverride: true})
        // create foo method
        var fooMethod = ImmutableCore.method('FooModule.foo', () => true)
        // attempt to create foo method again
        assert.doesNotThrow(() => ImmutableCore.method('FooModule.foo', () => true))
    })

    it('should not throw an error when trying to redefine a method and method allow override set', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // create foo method
        var fooMethod = ImmutableCore.method('FooModule.foo', () => true)
        // attempt to create foo method again
        assert.doesNotThrow(() => ImmutableCore.method('FooModule.foo', () => true, {allowOverride: true}))
    })

    it('should throw an error when trying to get an undefined method', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // attempt to get undefined module
        assert.throws(() => ImmutableCore.method('FooModule.foo'))
    })

    it('should throw an error when passing invalid options', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // attempt to create method with invalid options
        assert.throws(() => ImmutableCore.method('FooModule.foo', () => true, 0))
    })

    it('should throw an error when creating module with invalid method', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // attempt to create methow with invalid method
        assert.throws(() => ImmutableCore.method('FooModule.foo', null))
        assert.throws(() => ImmutableCore.method('FooModule.foo', {}))
    })

    it('should throw an error when creating module with invalid name', function () {
        // create FooModule with no methods
        ImmutableCore.module('FooModule', {})
        // attempt to create methow with invalid name
        assert.throws(() => ImmutableCore.method('', () => true))
        assert.throws(() => ImmutableCore.method(0, () => true))
        assert.throws(() => ImmutableCore.method('FooModule.method', () => true))
        assert.throws(() => ImmutableCore.method('FooModule.foo.bar', () => true))
    })

    it('should check if method exists', function () {
        // create FooModule with foo method
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // check if method exists
        assert.isTrue(ImmutableCore.hasMethod('FooModule.foo'))
    })

    it('should check if method does not exists', function () {
        // create FooModule with foo method
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // check if method exists
        assert.isFalse(ImmutableCore.hasMethod('FooModule.bar'))
    })

    it('should throw error when checking if invalid method signature exists', function () {
        // check if invalid method signature exists
        assert.throws(() => ImmutableCore.hasMethod(''))
    })
})