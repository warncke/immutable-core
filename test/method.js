'use strict'

const MockLogClient = require('../mock/mock-log-client')
const assert = require('chai').assert
const immutable = require('../lib/immutable-core')

// create mock log client instance
var mockLogClient = new MockLogClient()

describe('immutable-core: methods', function () {

    it('should allow creating a new module with methods', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with foo method
        var fooModule = immutable.module('FooModule', {
            'foo': function () {},
        })
        // test method
        assert.isFunction(fooModule.foo)
        // test method meta data
        assert.isObject(fooModule.foo.meta)
    })

    it('method should have correct meta data', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with foo method
        var fooModule = immutable.module('FooModule', {
            'foo': function () {},
        })
        // get meta data
        var methodMeta = fooModule.foo.meta
        // test meta data
        assert.strictEqual(methodMeta.logClient, undefined)
        assert.isFunction(methodMeta.method)
        assert.strictEqual(methodMeta.methodName, 'foo')
        assert.strictEqual(methodMeta.moduleName, 'FooModule')
        assert.strictEqual(methodMeta.signature, 'FooModule.foo')
        assert.strictEqual(methodMeta.strictArgs, true)
    })

    it('should use custom options from module', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with custom options
        var fooModule = immutable.module('FooModule', {
            'foo': function () {},
        }, {
            logClient: mockLogClient,
            strictArgs: false,
        })
        // get meta data
        var methodMeta = fooModule.foo.meta
        // test meta data
        assert.strictEqual(methodMeta.logClient, mockLogClient)
        assert.strictEqual(methodMeta.strictArgs, false)
    })

    it('should allow setting custom options', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {})
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {}, {
            defaultArgs: {
                foo: 0,
            },
            logClient: mockLogClient,
            strictArgs: false,
            validateArgs: {
                foo: {
                    presence: true,
                },
            },
        })
        // get meta data
        var methodMeta = fooModule.foo.meta
        // test meta data
        assert.deepEqual(methodMeta.defaultArgs, {foo:0})
        assert.strictEqual(methodMeta.logClient, mockLogClient)
        assert.strictEqual(methodMeta.strictArgs, false)
        assert.deepEqual(methodMeta.validateArgs, {foo:{presence: true,}})
    })

    it('should throw error on bad log client', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {})
        // create foo method with bad log client
        assert.throws(() => {
            immutable.method('FooModule.foo', function () {}, {
                logClient: function () {},
            })
        }, Error)
    })    

    it('should allow creating methods one at a time', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {})
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {})
        // test that function created
        assert.isFunction(fooMethod)
        // get meta data
        var methodMeta = fooMethod.meta
        // test meta data
        assert.strictEqual(methodMeta.logClient, undefined)
        assert.isFunction(methodMeta.method)
        assert.strictEqual(methodMeta.methodName, 'foo')
        assert.strictEqual(methodMeta.moduleName, 'FooModule')
        assert.strictEqual(methodMeta.signature, 'FooModule.foo')
        assert.strictEqual(methodMeta.strictArgs, true)
    })

    it('should allow creating multiple methods', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {})
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {})
        // test that function created
        assert.isFunction(fooMethod)
        // create bar method
        var barMethod = immutable.method('FooModule.bar', function () {})
        // test that function created
        assert.isFunction(barMethod)
    })

    it('should allow getting method after it is created', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {})
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {})
        // create bar method
        var barMethod = immutable.method('FooModule.bar', function () {})
        // test get module
        assert.strictEqual(immutable.method('FooModule.foo'), fooMethod)
        assert.strictEqual(immutable.method('FooModule.bar'), barMethod)
    })

    it('should throw an error when trying to redefine a method', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with no methods
        immutable.module('FooModule', {})
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {})
        // attempt to create foo method again
        assert.throws(() => immutable.method('FooModule.foo', function () {}), Error)
    })

    it('should not throw an error when trying to redefine a method and global allow override set', function () {
        // reset global singleton data
        immutable.reset().allowOverride(true)
        // create FooModule with no methods
        immutable.module('FooModule', {})
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {})
        // attempt to create foo method again
        assert.doesNotThrow(() => immutable.method('FooModule.foo', function () {}), Error)
    })

    it('should not throw an error when trying to redefine a method and module allow override set', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with no methods
        immutable.module('FooModule', {}, {allowOverride: true})
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {})
        // attempt to create foo method again
        assert.doesNotThrow(() => immutable.method('FooModule.foo', function () {}), Error)
    })

    it('should not throw an error when trying to redefine a method and method allow override set', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with no methods
        immutable.module('FooModule', {})
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {})
        // attempt to create foo method again
        assert.doesNotThrow(() => immutable.method('FooModule.foo', function () {}, {allowOverride: true}), Error)
    })

    it('should throw an error when trying to get an undefined method', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with no methods
        immutable.module('FooModule', {})
        // attempt to get undefined module
        assert.throws(() => immutable.method('FooModule.foo'), Error)
    })

    it('should throw an error when passing invalid options', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with no methods
        immutable.module('FooModule', {})
        // attempt to create method with invalid options
        assert.throws(() => immutable.method('FooModule.foo', function () {}, 0), Error)
    })

    it('should throw an error when creating module with invalid method', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with no methods
        immutable.module('FooModule', {})
        // attempt to create methow with invalid method
        assert.throws(() => immutable.method('FooModule.foo', null), Error)
        assert.throws(() => immutable.method('FooModule.foo', {}), Error)
    })

    it('should throw an error when creating module with invalid name', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with no methods
        immutable.module('FooModule', {})
        // attempt to create methow with invalid name
        assert.throws(() => immutable.method('', function () {}), Error)
        assert.throws(() => immutable.method(0, function () {}), Error)
        assert.throws(() => immutable.method('FooModule.method', function () {}), Error)
        assert.throws(() => immutable.method('FooModule.foo.bar', function () {}), Error)
    })

})