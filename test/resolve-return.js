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

describe('immutable-core resolve return', function () {

    var sandbox

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false).resolve(true)
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should resolve promises in return', async function () {
        // promise to test
        var promise = Promise.resolve(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => {
                return {foo: promise}
            },
        })
        // test method call
        var res = await fooModule.foo()
        // check that args are frozen
        assert.containSubset(res, {foo: true})
    })

    it('should resolve deep promises in return', async function () {
        // promise to test
        var promise = Promise.resolve(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => {
                return { foo: { bar: [0, promise] } }
            },
        })
        // test method call
        var res = await fooModule.foo({})
        // check that args are frozen
        assert.containSubset(res, {foo: { bar: [0, true] } })
    })

    it('should resolve promises in before return', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // promise to test
        var promise = Promise.resolve(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: () => {
                return {foo: promise}
            },
            foo: foo,
        })
        // bind bar before foo
        fooModule.bind('before', 'foo', fooModule.bar)
        // test method call
        var res = await fooModule.foo()
        // get args for foo
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: true})
    })

    it('should resolve promises in with return', async function () {
        // promise to test
        var promise = Promise.resolve(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: () => {
                return {foo: promise}
            },
            foo: () => {
                return {bar: true}
            },
        })
        // bind bar before foo
        fooModule.bind('with', 'foo', fooModule.bar)
        // test method call
        var res = await fooModule.foo()
        // check that args are frozen
        assert.containSubset(res, {bar: true, foo: true})
    })

    it('should resolve promises in after return', async function () {
        // promise to test
        var promise = Promise.resolve(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: () => {
                return {foo: promise}
            },
            foo: () => {
                return {bar: true}
            },
        })
        // bind bar before foo
        fooModule.bind('after', 'foo', fooModule.bar)
        // test method call
        var res = await fooModule.foo()
        // check that args are frozen
        assert.containSubset(res, {bar: true, foo: true})
    })

    it('should not resolve promises in return when disbaled globally', async function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false).resolve(false)
        // promise to test
        var promise = Promise.resolve(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => {
                return {foo: promise}
            },
        })
        // test method call
        var res = await fooModule.foo()
        // check that args are frozen
        assert.containSubset(res, {foo: promise})
    })

    it('should not resolve promises in return when disbaled for module', async function () {
        // promise to test
        var promise = Promise.resolve(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => {
                return {foo: promise}
            },
        }, {resolve: false})
        // test method call
        var res = await fooModule.foo()
        // check that args are frozen
        assert.containSubset(res, {foo: promise})
    })

    it('should not resolve promises in return when disbaled for method', async function () {
        // promise to test
        var promise = Promise.resolve(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create foo method
        fooModule.method('foo', () => { return {foo: promise} }, {resolve: false})
        // test method call
        var res = await fooModule.foo()
        // check that args are frozen
        assert.containSubset(res, {foo: promise})
    })

})