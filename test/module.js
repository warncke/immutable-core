'use strict'

const assert = require('chai').assert
const immutable = require('../lib/immutable-core')
const MockCacheClient = require('../mock/mock-cache-client')
const MockLogClient = require('../mock/mock-log-client')

// create mock cache client instance
var mockCacheClient = new MockCacheClient()
// create mock log client instance
var mockLogClient = new MockLogClient

describe('immutable-core: modules', function () {

    beforeEach(function () {
        // reset global singleton data
        immutable.reset()
    })

    it('should allow creating a new module without any methods', function () {
        // create FooModule with no methods
        var fooModule = immutable.module('FooModule', {})
        // test name
        assert.strictEqual(fooModule.meta().name, 'FooModule')
    })

    it('module should have correct default options', function () {
        // create FooModule with no methods
        var fooModule = immutable.module('FooModule', {})
        // get module options (defaults)
        var options = fooModule.meta().options
        // test default options
        assert.strictEqual(options.cacheClient, undefined)
        assert.strictEqual(options.logClient, undefined)
        assert.strictEqual(options.strictArgs, true)
    })

    it('should allow setting custom options', function () {
        // create FooModule with custom options
        var fooModule = immutable.module('FooModule', {}, {
            cacheClient: mockCacheClient,
            logClient: mockLogClient,
            strictArgs: false,
        })
        // get module options (defaults)
        var options = fooModule.meta().options
        // test default options
        assert.strictEqual(options.cacheClient, mockCacheClient)
        assert.strictEqual(options.logClient, mockLogClient)
        assert.strictEqual(options.strictArgs, false)
    })

    it('should throw error on invalid cache client option', function () {
        // create FooModule with bad cache client
        assert.throws(() => {
            immutable.module('FooModule', {}, {
                cacheClient: function () {},
            })
        }, Error)
    })

    it('should throw error on invalid log client option', function () {
        // create FooModule with bad cache client
        assert.throws(() => {
            immutable.module('FooModule', {}, {
                logClient: function () {},
            })
        }, Error)
    })

    it('should allow setting custom options', function () {
        // set defaults
        immutable.cacheClient(mockCacheClient)
        immutable.logClient(mockLogClient)
        immutable.strictArgs(false)
        // create FooModule with custom options
        var fooModule = immutable.module('FooModule', {})
        // get module options (defaults)
        var options = fooModule.meta().options
        // test default options
        assert.strictEqual(options.cacheClient, mockCacheClient)
        assert.strictEqual(options.logClient, mockLogClient)
        assert.strictEqual(options.strictArgs, false)
    })

    it('should throw error on invalid cache client default', function () {
        // attempt to set bad cache client default
        assert.throws(() => immutable.cacheClient(function () {}), Error)
    })

    it('should throw error on invalid log client default', function () {
        // attempt to set bad log client default
        assert.throws(() => immutable.logClient(function () {}), Error)
    })

    it('should allow creating multiple modules', function () {
        // create FooModule with no methods
        var fooModule = immutable.module('FooModule', {})
        // test name
        assert.strictEqual(fooModule.meta().name, 'FooModule')
        // create BarModule with no methods
        var barModule = immutable.module('BarModule', {})
        // test name
        assert.strictEqual(barModule.meta().name, 'BarModule')
    })

    it('should allow getting module after it is created', function () {
        // create FooModule with no methods
        var fooModule = immutable.module('FooModule', {})
        // create BarModule with no methods
        var barModule = immutable.module('BarModule', {})
        // test get module
        assert.strictEqual(immutable.module('FooModule'), fooModule)
        assert.strictEqual(immutable.module('BarModule'), barModule)
    })

    it('should throw an error when trying to redefine a module', function () {
        // create FooModule with no methods
        immutable.module('FooModule', {})
        // attempt to create moudle again
        assert.throws(() => immutable.module('FooModule', {}), Error)
    })

    it('should throw an error when trying to get an undefined module', function () {
        // attempt to get undefined module
        assert.throws(() => immutable.module('FooModule'), Error)
    })

    it('should throw an error when passing invalid options', function () {
        // attempt to create module with invalid options
        assert.throws(() => immutable.module('FooModule', {}, 0), Error)
    })

    it('should throw an error when creating module with invalid name', function () {
        // attempt to create module with invalid name
        assert.throws(() => immutable.module('', {}), Error)
        assert.throws(() => immutable.module(0, {}), Error)
        assert.throws(() => immutable.module('module', {}), Error)
        assert.throws(() => immutable.module('Foo.Bar', {}), Error)
    })

})