'use strict'

const Promise = require('bluebird')
const assert = require('chai').assert
const immutable = require('../lib/immutable-core')

describe('immutable-core: bind after detached method call', function () {

    beforeEach(function () {
        // reset global singleton data
        immutable.reset()
        // disable arg validation
        immutable.strictArgs(false)
    })

    it('should call bound function', function () {
        // flag set when module called
        var called = false
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // create BarModule
        var barModule = immutable.module('BarModule', {
            // bar method returns valid Promise
            bar: function (args) {
                // set called flag true
                called = true
                return Promise.resolve(true)
            },
        })
        // bind bar after foo detached
        immutable.afterDetach('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
            // wait a bit for after call to finish
            return Promise.delay(20).then(() => {
                assert.strictEqual(called, true)
            })
        })
    })

    it('should not block if bound method rejects', function () {
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // create BarModule
        var barModule = immutable.module('BarModule', {
            // bar method returns valid Promise
            bar: function (args) {
                return Promise.reject()
            },
        })
        // bind bar after foo detached
        immutable.afterDetach('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })    

    it('should not block if bound method throws an error', function () {
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // create BarModule
        var barModule = immutable.module('BarModule', {
            // bar method returns valid Promise
            bar: function (args) {
                throw new Error("Foobar!")
            },
        })
        // bind bar after foo detached
        immutable.afterDetach('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })

    it('should have correct stack', function () {
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['FooModule.foo'])
            },
        })
        // create BarModule
        var barModule = immutable.module('BarModule', {
            bar: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['FooModule.foo', 'BarModule.bar'])
            },
        })
        // bind bar after foo detached
        immutable.afterDetach('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
    })

})