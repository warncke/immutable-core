'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const immutable = require('../lib/immutable-core')

chai.use(chaiAsPromised)
const assert = chai.assert

describe('immutable-core: method call validation', function () {

    beforeEach(function () {
        // reset global singleton data
        immutable.reset()
    })

    it('should resolve on valid arguments', function () {
        // create FooModule
        var fooModule = immutable.module('FooModule', {}, {
            strictArgs: false,
        })
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {}, {
            validateArgs: {
                foo: {
                    presence: true,
                },
            },
        })
        // call should resolve
        return assert.isFulfilled(fooMethod({foo: true}))
    })

    it('should reject on invalid arguments', function () {
        // create FooModule
        var fooModule = immutable.module('FooModule', {}, {
            strictArgs: false,
        })
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {}, {
            validateArgs: {
                foo: {
                    presence: true,
                },
            },
        })
        // call should reject
        return assert.isRejected(fooMethod({}))
    })

    it('should reject with error object containing errors', function () {
        // create FooModule
        var fooModule = immutable.module('FooModule', {}, {
            strictArgs: false,
        })
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {}, {
            validateArgs: {
                foo: {
                    presence: true,
                },
            },
        })
        // call should reject
        return fooMethod({})
        // test error
        .catch(function (err) {
            assert.instanceOf(err, Error)
            assert.strictEqual(err.message, 'FooModule.foo: validation error')
            assert.deepEqual(err.errors, {foo:['Foo can\'t be blank']})
        })
    })

    it('should validate default arg values', function () {
        // create FooModule
        var fooModule = immutable.module('FooModule', {}, {
            strictArgs: false,
        })
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {}, {
            defaultArgs: {
                foo: 0,
            },
            validateArgs: {
                foo: {
                    presence: true,
                },
            },
        })
        // call should resolve
        return assert.isFulfilled(fooMethod({}))
    })

    it('should validate deep default arg values', function () {
        // create FooModule
        var fooModule = immutable.module('FooModule', {}, {
            strictArgs: false,
        })
        // create foo method
        var fooMethod = immutable.method('FooModule.foo', function () {}, {
            defaultArgs: {
                'foo.bar': 0,
            },
            validateArgs: {
                'foo.bar': {
                    presence: true,
                },
            },
        })
        // call should resolve
        return assert.isFulfilled(fooMethod({}))
    })

});