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

describe('immutable-core bind after method call detached', function () {

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
        // bind bar after foo detached
        ImmutableCore.afterDetach('FooModule.foo', barModule.bar)
        // test method call
        var res = await fooModule.foo()
        // test resolve value
        assert.strictEqual(res, true)
        // break to make sure detached method is called
        await Promise.delay(10)
        // check called
        assert.calledOnce(bar)
    })

    it('should not block if bound method rejects', async function () {
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
        // bind bar after foo detached
        ImmutableCore.afterDetach('FooModule.foo', barModule.bar)
        // test method call
        var res = await fooModule.foo()
        // test resolve value
        assert.strictEqual(res, true)
    })    

    it('should not block if bound method throws an error', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // create stub for bar
        var bar = sandbox.stub().throws()
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: bar,
        })
        // bind bar after foo detached
        ImmutableCore.afterDetach('FooModule.foo', barModule.bar)
        // test method call
        var res = await fooModule.foo()
        // test resolve value
        assert.strictEqual(res, true)
    })

    it('should have correct stack', async function () {
        // create stubs for bar and foo
        var bar = sandbox.stub().resolves()
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: bar,
        })
        // bind bar after foo detached
        ImmutableCore.afterDetach('FooModule.foo', barModule.bar)
        // test method call
        await fooModule.foo()
        // break to make sure detached method is called
        await Promise.delay(10)
        // check stack for bar
        assert.calledWithMatch(bar, {session: {stack: [
            'FooModule.foo',
            'BarModule.bar,afterDetach,FooModule.foo',
        ]}})
    })

})