'use strict'

/* npm modules */
const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSubset = require('chai-subset')
const sinon = require('sinon')

/* application modules */
const ImmutableCore = require('../lib/immutable-core')

/* chai config */
chai.use(chaiAsPromised)
chai.use(chaiSubset)
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core bind after detached method call', function () {

    var sandbox

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false)
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should call bound function', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // create stub for bar
        var bar = sandbox.stub().resolves(true)
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: bar,
        })
        // bind bar after foo
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // test method call
        var res = await fooModule.foo()
        // test resolve value
        assert.strictEqual(res, true)
        assert.calledOnce(bar)
    })

    it('should reject if bound method rejects', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // create stub for bar
        var bar = sandbox.stub().rejects()
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: bar,
        })
        // bind bar after foo
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // test method call
        await assert.isRejected(fooModule.foo())
    })

    it('should merge values returned by bound method into return', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => { return {foo: true} },
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: () => { return {bar: true} },
        })
        // bind bar after foo
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // test method call
        var res = await fooModule.foo()
        // validate merged return value
        assert.containSubset(res, {foo: true, bar: true})
    })

    it('should have correct stack', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['FooModule.foo'])
            },
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['FooModule.foo', 'BarModule.bar'])
            },
        })
        // bind bar after foo
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
    })

    it('bound after method should have correct args', function () {
        // capture args to test
        var captureArgs
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                // capture args
                captureArgs = args
                return Promise.resolve(true)
            },
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
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
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })

    it('second bound after method should have correct args', function () {
        // capture args to test
        var captureArgs
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                // capture args
                captureArgs = args
                return Promise.resolve(true)
            },
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            // bar method returns valid Promise
            bar: function (args) {
                return Promise.resolve(false)
            },
        })
        // create BamModule
        var bamModule = ImmutableCore.module('BamModule', {
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
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // bind bam after bar
        ImmutableCore.after('BarModule.bar', bamModule.bam)
        // test method call
        return fooModule.foo()
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })

})