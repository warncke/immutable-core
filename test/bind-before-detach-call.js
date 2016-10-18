'use strict'

const Promise = require('bluebird')
const assert = require('chai').assert
const immutable = require('../lib/immutable-core')

describe('immutable-core: bind before detached method call', function () {

    it('should call bound function', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
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
        // bind bar before foo detached
        immutable.beforeDetach('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
            // wait a bit for before call to finish
            return Promise.delay(20).then(() => {
                assert.strictEqual(called, true)
            })
        })
    })

    it('should not block if bound method rejects', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
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
        // bind bar before foo detached
        immutable.beforeDetach('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })    

    it('should not block if bound method throws an error', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
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
        // bind bar before foo detached
        immutable.beforeDetach('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })

    it('should have correct stack', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
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
        immutable.beforeDetach('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
    })

})