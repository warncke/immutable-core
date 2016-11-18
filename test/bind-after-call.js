'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const immutable = require('../lib/immutable-core')

chai.use(chaiAsPromised)
const assert = chai.assert

describe('immutable-core: bind after detached method call', function () {

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
        // bind bar after foo
        immutable.after('FooModule.foo', barModule.bar)
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
        // bind bar after foo
        immutable.after('FooModule.foo', barModule.bar)
        // test method call
        return assert.isRejected(fooModule.foo())
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
        // bind bar after foo
        immutable.after('FooModule.foo', barModule.bar)
        // test method call
        return assert.isRejected(fooModule.foo())
    })

    it('should merge values returned by bound method into return', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                return Promise.resolve({foo: true})
            },
        })
        // create BarModule
        var barModule = immutable.module('BarModule', {
            // bar method returns valid Promise
            bar: function (args) {
                return Promise.resolve({bar: true})
            },
        })
        // bind bar after foo
        immutable.after('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo({foo: true})
        // test resolve value
        .then(res => {
            // ignore session
            delete res.session
            // validate merged return value
            assert.deepEqual(res, {foo: true, bar: true})
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
        // bind bar after foo
        immutable.after('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
    })

    it('bound after method should have correct args', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // capture args to test
        var captureArgs
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                // capture args
                captureArgs = args
                return Promise.resolve(true)
            },
        })
        // create BarModule
        var barModule = immutable.module('BarModule', {
            // bar method returns valid Promise
            bar: function (args) {
                // args for after should contain args for bound method
                assert.deepEqual(args.args, captureArgs)
                // args for after should have return from bound method
                assert.strictEqual(args.res, true)
                // args for single after should have no origRes
                assert.strictEqual(args.origRes, undefined)
            },
        })
        // bind bar after foo
        immutable.after('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })

    it('second bound after method should have correct args', function () {
        // reset global singleton data
        immutable.reset().strictArgs(false)
        // capture args to test
        var captureArgs
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                // capture args
                captureArgs = args
                return Promise.resolve(true)
            },
        })
        // create BarModule
        var barModule = immutable.module('BarModule', {
            // bar method returns valid Promise
            bar: function (args) {
                return Promise.resolve(false)
            },
        })
        // create BamModule
        var bamModule = immutable.module('BamModule', {
            // bar method returns valid Promise
            bam: function (args) {
                // args for after should contain args for bound method
                assert.deepEqual(args.args, captureArgs)
                // args for after should have return from bound method
                assert.strictEqual(args.res, false)
                // args for chained after should have original return
                assert.strictEqual(args.origRes, true)
            },
        })
        // bind bar after foo
        immutable.after('FooModule.foo', barModule.bar)
        // bind bam after bar
        immutable.after('BarModule.bar', bamModule.bam)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })

})