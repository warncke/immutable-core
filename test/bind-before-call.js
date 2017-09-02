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

describe('immutable-core bind before method call', function () {

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
        // bind bar before foo
        ImmutableCore.before('FooModule.foo', barModule.bar)
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
        // bind bar before foo
        ImmutableCore.before('FooModule.foo', barModule.bar)
        // test method call
        await assert.isRejected(fooModule.foo())
    })

    it('should reject if bound method throws error', async function () {
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
        // bind bar before foo
        ImmutableCore.before('FooModule.foo', barModule.bar)
        // test method call
        await assert.isRejected(fooModule.foo())
    })

    it('should merge values returned by bound method into args', async function () {
        // create stubs for bar and foo
        var bar = sandbox.stub().resolves({bar: true})
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: bar,
        })
        // bind bar before foo
        ImmutableCore.before('FooModule.foo', barModule.bar)
        // test method call
        var res = await fooModule.foo({foo: true})
        // check args
        assert.calledWithMatch(foo, {foo: true, bar: true})
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
        // bind bar before foo
        ImmutableCore.before('FooModule.foo', barModule.bar)
        // test method call
        await fooModule.foo()
        // check stack for bar
        assert.calledWithMatch(bar, {session: {stack: [
            'FooModule.foo',
            'BarModule.bar,before,FooModule.foo',
        ]}})
    })

})