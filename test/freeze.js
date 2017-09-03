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

describe('immutable-core freeze', function () {

    var sandbox

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset().freeze(true).strictArgs(false)
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should freeze arguments to method', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // test method call
        await fooModule.foo()
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.isFrozen(args)
    })

    it('return value should not be frozen', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: args => args,
        })
        // test method call  0
        var res = await fooModule.foo()
        // check that return value is not frozen
        assert.isNotFrozen(res)
    })

    it('should disable freeze globally', async function () {
        // reset global singleton data
        ImmutableCore.reset().freeze(false).strictArgs(false)
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // test method call
        await fooModule.foo()
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.isNotFrozen(args)
    })

    it('should disable freeze for module', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        }, {freeze: false})
        // test method call
        await fooModule.foo()
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.isNotFrozen(args)
    })

    it('should disable freeze for method', async function () {
        // create bar and foo stubs
        var bar = sandbox.stub().resolves()
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: bar,
        })
        // create foo method
        ImmutableCore.method('FooModule.foo', foo, {freeze: false})
        // test method call
        await fooModule.foo()
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.isNotFrozen(args)
        // test method call
        await fooModule.bar()
        // get args
        args = bar.getCall(0).args[0]
        // check that args are frozen
        assert.isFrozen(args)
    })

})