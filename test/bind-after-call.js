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
        sandbox = sinon.createSandbox()
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

    it('bound after method should have correct stack', async function () {
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
        // bind bar after foo
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // test method call
        await fooModule.foo()
        // check stack for foo
        assert.calledWithMatch(foo, {session: {stack: [
            'FooModule.foo'
        ]}})
        // check stack for bar
        assert.calledWithMatch(bar, {session: {stack: [
            'FooModule.foo',
            'BarModule.bar,after,FooModule.foo',
        ]}})
    })

    it('bound after method should have correct args', async function () {
        // create stubs for bar and foo
        var bar = sandbox.stub().resolves(true)
        var foo = sandbox.stub().resolves(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: bar,
        })
        // bind bar after foo
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // test method call
        await fooModule.foo({foo: true})
        // get args from first call
        var args = foo.getCall(0).args[0]
        // check args
        assert.calledWithMatch(bar, {
            args: args,
            origRes: undefined,
            res: true,
        })
    })

    it('second bound after method should have correct args', async function () {
        // create stubs for bar and foo
        var bar = sandbox.stub().resolves(false)
        var bam = sandbox.stub().resolves(1)
        var foo = sandbox.stub().resolves(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: bar,
        })
        // create BamModule
        var bamModule = ImmutableCore.module('BamModule', {
            bam: bam,
        })
        // bind bar after foo
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // bind bam after bar
        ImmutableCore.after('BarModule.bar', bamModule.bam)
        // test method call
        var res = await fooModule.foo()
        // test resolve value
        assert.strictEqual(res, 1)
        // get args from first call
        var args = foo.getCall(0).args[0]
        // check args
        assert.calledWithMatch(bam, {
            args: args,
            origRes: true,
            res: false,
        })
    })

    it('second bound after method should have correct stack', async function () {
        // create stubs for bar and foo
        var bar = sandbox.stub().resolves(false)
        var bam = sandbox.stub().resolves(1)
        var foo = sandbox.stub().resolves(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: bar,
        })
        // create BamModule
        var bamModule = ImmutableCore.module('BamModule', {
            bam: bam,
        })
        // bind bar after foo
        ImmutableCore.after('FooModule.foo', barModule.bar)
        // bind bam after bar
        ImmutableCore.after('BarModule.bar', bamModule.bam)
        // test method call
        var res = await fooModule.foo()
        // check args
        assert.calledWithMatch(bam, {
            session: {
                stack: [
                    'FooModule.foo',
                    'BarModule.bar,after,FooModule.foo',
                    'BamModule.bam,after,BarModule.bar',
                ],
            },
        })
    })

})