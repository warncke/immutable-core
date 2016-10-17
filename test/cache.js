'use strict'

const MockCacheClient = require('../mock/mock-cache-client')
const Promise = require('bluebird')
const assert = require('chai').assert
const immutable = require('../lib/immutable-core')

describe('immutable-core: caches', function () {

    it('should allow adding cache rule to existing method', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient()
        // add cache to foo
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
        })
    })

    it('should allow adding cache rule to module that does not exist', function () {
        // reset global singleton data
        immutable.reset()
        // build mock cache client
        var mockCacheClient = new MockCacheClient()
        // add cache to foo
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
        })
    })

    it('should allow adding cache rule to method that does not exist', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient()
        // add cache to foo
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
        })
    })

    it('should throw error when trying to add cache rule to same method more than once', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient()
        // add cache to foo
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
        })
        // add cache to foo second time
        assert.throws(() => {
            immutable.cache('FooModule.foo')
        }, Error)
    })

    it('should call get and set when a method is cached with no expiration', function () {
        // reset global singleton data, set strict args to false
        immutable.reset().strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient({
            get: function (key) {
                // validate key
                assert.strictEqual(key, '7719DF2A5745EAF3127112FB1E9EE176')
                // return null which should result in original method being called
                return Promise.resolve(null)
            },
            set: function (key, value) {
                // validate key
                assert.strictEqual(key, '7719DF2A5745EAF3127112FB1E9EE176')
                // validate value which should be return from foo
                assert.strictEqual(value, true)
            },
        })
        // add cache to foo with cache client
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
        })
        // call foo which should call get and set
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, true)
        })
    })

    it('should use cache client for module if none defined for method', function () {
        // reset global singleton data, set strict args to false
        immutable.reset().strictArgs(false)
        // build mock cache client
        var mockCacheClient = new MockCacheClient({
            get: function (key) {
                // this should be returned instead of target method
                return Promise.resolve(false)
            },
        })
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        }, {
            cacheClient: mockCacheClient,
        })
        // add cache to foo with cache client
        immutable.cache('FooModule.foo')
        // call foo which should call get and set
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, false)
        })
    })

    it('should use default cache client if none defined for module or method', function () {
        // build mock cache client
        var mockCacheClient = new MockCacheClient({
            get: function (key) {
                // this should be returned instead of target method
                return Promise.resolve(false)
            },
        })
        // reset global singleton data, set strict args to false
        immutable.reset().strictArgs(false).cacheClient(mockCacheClient)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // add cache to foo with cache client
        immutable.cache('FooModule.foo')
        // call foo which should call get and set
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, false)
        })
    })

    it('should call get and set when a method is cached with expiration', function () {
        // reset global singleton data, set strict args to false
        immutable.reset().strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient({
            get: function (key) {
                // validate key
                assert.strictEqual(key, '7719DF2A5745EAF3127112FB1E9EE176')
                // return null which should result in original method being called
                return Promise.resolve(null)
            },
            setex: function (key, value, expire) {
                // validate key
                assert.strictEqual(key, '7719DF2A5745EAF3127112FB1E9EE176')
                // validate value which should be return from foo
                assert.strictEqual(value, true)
                // validate expiration
                assert.strictEqual(expire, 60)
            },
        })
        // add cache to foo with cache client
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
            expire: 60,
        })
        // call foo which should call get and set
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, true)
        })
    })

    it('should return cached value', function () {
        // reset global singleton data, set strict args to false
        immutable.reset().strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient({
            get: function (key) {
                // return not null value which should be returned
                // instead of calling cached method
                return Promise.resolve(false)
            },
        })
        // add cache to foo with cache client
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
        })
        // call foo which should call get and set
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, false)
        })
    })

    it('should call original method if cache client returns rejected promise', function () {
        // reset global singleton data, set strict args to false
        immutable.reset().strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient({
            get: function (key) {
                return Promise.reject()
            },
            set: function (key, value) {
                // validate key
                assert.strictEqual(key, '7719DF2A5745EAF3127112FB1E9EE176')
                // validate value which should be return from foo
                assert.strictEqual(value, true)
            },
        })
        // add cache to foo with cache client
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
        })
        // call foo which should call get and set
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, true)
        })
    })

    it('should allow custom key generation method', function () {
        // reset global singleton data, set strict args to false
        immutable.reset().strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient({
            get: function (key) {
                // validate cache key
                assert.strictEqual(key, 'FOO')
                // return null so original method is called
                return Promise.resolve(null)
            },
        })
        // add cache to foo with cache client
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
            // custom key generation method
            keyMethod: function (args, methodMeta) {
                // validate args
                assert.strictEqual(args.foo, 'bar')
                // validate method meta data
                assert.strictEqual(methodMeta.signature, 'FooModule.foo')
                // return cache key
                return 'FOO'
            },
        })
        // call foo which should call get and set
        return fooModule.foo({
            foo: 'bar',
        })
        // verify returned value
        .then(value => {
            assert.strictEqual(value, true)
        })
    })

    it('should allow specifying the arg parameters to be used for key generation', function () {
        // reset global singleton data, set strict args to false
        immutable.reset().strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // build mock cache client
        var mockCacheClient = new MockCacheClient({
            get: function (key) {
                // validate cache key
                assert.strictEqual(key, '6A88C6364FEA0EE0C30648A5062FAC2D')
                // return null so original method is called
                return Promise.resolve(null)
            },
        })
        // add cache to foo with cache client
        immutable.cache('FooModule.foo', {
            cacheClient: mockCacheClient,
            // list of args parameters to use for generating key
            keyParams: ['foo'],
        })
        // call foo which should call get and set
        return fooModule.foo({
            foo: 1,
            bar: 2,
        })
        // verify returned value
        .then(value => {
            assert.strictEqual(value, true)
        })
    })

})