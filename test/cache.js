'use strict'

/* npm modules */
const chai = require('chai')
const sinon = require('sinon')

/* application modules */
const ImmutableCore = require('../lib/immutable-core')
const MockCacheClient = require('../mock/mock-cache-client')

/* chai config */
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core cache', function () {

    var sandbox

    var cacheClient

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false)
        // create sinon sandbox
        sandbox = sinon.createSandbox()
        // create mock logclient
        cacheClient = new MockCacheClient(sandbox)
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should allow adding cache rule to existing method', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
    })

    it('should allow adding cache rule to module that does not exist', function () {
        // add cache to foo
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
    })

    it('should allow adding cache rule to method that does not exist', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // add cache to foo
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
    })

    it('should throw error when trying to add cache rule to same method more than once', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
        // add cache to foo second time
        assert.throws(() => ImmutableCore.cache('FooModule.foo'))
    })

    it('should now throw error when trying to add cache rule to same method more than once and global allow override set', function () {
        // allow modules/methods to be redefiend
        ImmutableCore.allowOverride(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
        // add cache to foo second time
        assert.throws(() => ImmutableCore.cache('FooModule.foo'))
    })

    it('should call get and set when a method is cached with no expiration', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo with cache client
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
        // call foo which should call get and set
        var value = await fooModule.foo()
        // verify returned value
        assert.strictEqual(value, true)
        // check that cache called
        assert.calledOnce(cacheClient.get)
        assert.calledWith(cacheClient.get, '7719df2a5745eaf3127112fb1e9ee176')
        assert.calledOnce(cacheClient.set)
        assert.calledWithMatch(cacheClient.set,
            '7719df2a5745eaf3127112fb1e9ee176',
            true,
            {moduleCallSignature: 'FooModule.foo'}
        )
    })

    it('should use cache client for module if none defined for method', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        }, {
            cacheClient: cacheClient,
        })
        // add cache to foo with cache client
        ImmutableCore.cache('FooModule.foo')
        // set cache to return false value
        cacheClient.get.resolves(false)
        // call foo which should call get and set
        var value = await fooModule.foo()
        // verify returned value
        assert.strictEqual(value, false)
    })

    it('should use default cache client if none defined for module or method', async function () {
        // set global cache client
        ImmutableCore.cacheClient(cacheClient)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo with cache client
        ImmutableCore.cache('FooModule.foo')
        // set cache to return false value
        cacheClient.get.resolves(false)
        // call foo which should call get and set
        var value = await fooModule.foo()
        // verify returned value
        assert.strictEqual(value, false)
    })

    it('should call get and set when a method is cached with expiration', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo with cache client
        ImmutableCore.cache('FooModule.foo', {
            cacheClient: cacheClient,
            expire: 60,
        })
        // call foo which should call get and set
        var value = await fooModule.foo()
        // verify returned value
        assert.strictEqual(value, true)
        // check that cache called
        assert.calledOnce(cacheClient.get)
        assert.calledWith(cacheClient.get, '7719df2a5745eaf3127112fb1e9ee176')
        assert.notCalled(cacheClient.set)
        assert.calledOnce(cacheClient.setex)
        assert.calledWithMatch(cacheClient.setex,
            '7719df2a5745eaf3127112fb1e9ee176',
            true,
            60,
            {moduleCallSignature: 'FooModule.foo'}
        )
    })

    it('should return cached value', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo with cache client
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
        // set cache to return false value
        cacheClient.get.resolves(false)
        // call foo which should call get and set
        var value = await fooModule.foo()
        // verify returned value
        assert.strictEqual(value, false)
    })

    it('should set _cached property on returned object', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo with cache client
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
        // set cache to return false value
        cacheClient.get.resolves({foo: true})
        // call foo which should call get and set
        var value = await fooModule.foo()
        // verify returned value
        assert.deepEqual(value, {
            _cached: '7719df2a5745eaf3127112fb1e9ee176',
            foo: true,
        })
    })

    it('should call original method if cache client returns rejected promise', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo with cache client
        ImmutableCore.cache('FooModule.foo', {cacheClient: cacheClient})
        // set cache to reject on get
        cacheClient.get.rejects()
        // call foo which should call get and set
        var value = await fooModule.foo()
        // verify returned value
        assert.strictEqual(value, true)
        // check that cache called
        assert.calledOnce(cacheClient.get)
        assert.calledWith(cacheClient.get, '7719df2a5745eaf3127112fb1e9ee176')
        assert.calledOnce(cacheClient.set)
        assert.calledWithMatch(cacheClient.set,
            '7719df2a5745eaf3127112fb1e9ee176',
            true,
            {moduleCallSignature: 'FooModule.foo'}
        )
    })

    it('should allow custom key generation method', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // create mock key method
        var keyMethod = sandbox.stub().returns('foo')
        // add cache to foo with cache client and key method
        ImmutableCore.cache('FooModule.foo', {
            cacheClient: cacheClient,
            keyMethod: keyMethod,
        })
        // call foo which should call get and set
        var value = await fooModule.foo({foo: 'bar'})
        // verify returned value
        assert.strictEqual(value, true)
        // check that key method called
        assert.calledOnce(keyMethod)
        assert.calledWithMatch(keyMethod,
            {foo: 'bar', session: {}},
            {signature: 'FooModule.foo'}
        )
        // check that cache called
        assert.calledOnce(cacheClient.get)
        assert.calledWith(cacheClient.get, 'foo')
        assert.calledOnce(cacheClient.set)
        assert.calledWithMatch(cacheClient.set,
            'foo',
            true,
            {moduleCallSignature: 'FooModule.foo'}
        )
    })

    it('should allow specifying the arg parameters to be used for key generation', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // add cache to foo with cache client
        ImmutableCore.cache('FooModule.foo', {
            cacheClient: cacheClient,
            // list of args parameters to use for generating key
            keyParams: ['foo'],
        })
        // call foo which should call get and set
        var value = await fooModule.foo({foo: 1, bar: 2})
        // verify returned value
        assert.strictEqual(value, true)
        // check that cache called
        assert.calledOnce(cacheClient.get)
        assert.calledWith(cacheClient.get, '6a88c6364fea0ee0c30648a5062fac2d')
        assert.calledOnce(cacheClient.set)
        assert.calledWithMatch(cacheClient.set,
            '6a88c6364fea0ee0c30648a5062fac2d',
            true,
            {moduleCallSignature: 'FooModule.foo'}
        )
    })

})