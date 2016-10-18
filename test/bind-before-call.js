'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const immutable = require('../lib/immutable-core')

chai.use(chaiAsPromised)
const assert = chai.assert

describe('immutable-core: bind before method call', function () {

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
        // bind bar before foo
        immutable.before('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
            assert.strictEqual(called, true)
        })
    })

    it('should reject if bound method rejects', function () {
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
        // bind bar before foo
        immutable.before('FooModule.foo', barModule.bar)
        // test method call
        assert.isRejected(fooModule.foo())
    })

    it('should reject if bound method throws error', function () {
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
        // bind bar before foo
        immutable.before('FooModule.foo', barModule.bar)
        // test method call
        assert.isRejected(fooModule.foo())
    })

    it('should merge values returned by bound method into args', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                // ignore session
                delete args.session
                // validate merged args
                assert.deepEqual(args, {foo: true, bar: true})
                return Promise.resolve(true)
            },
        })
        // create BarModule
        var barModule = immutable.module('BarModule', {
            // bar method returns valid Promise
            bar: function (args) {
                return Promise.resolve({bar: true})
            },
        })
        // bind bar before foo
        immutable.before('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo({foo: true})
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
        // bind bar before foo
        immutable.before('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
    })

})