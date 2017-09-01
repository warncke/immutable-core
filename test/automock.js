'use strict'

/* npm modules */
const chai = require('chai')
const sinon = require('sinon')

/* application modules */
const ImmutableCore = require('../lib/immutable-core')

/* chai config */
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core automock', function () {

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

    it('should allow setting an automock function', function () {
        // set automock function
        ImmutableCore.automock(function () {})
        // test automock function
        assert.isFunction(ImmutableCore.automock())
    })


    it('should throw error when calling automock with non-function', function () {
        // call automock with object which should throw error
        assert.throws(() => ImmutableCore.automock({}))
    })

    it('should call automock function when creating module with method', function () {
        // create automock stub
        var automock = sandbox.stub()
        // set automock function
        ImmutableCore.automock(automock)
        // create new module with method
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // automock function should have been called
        assert.calledOnce(automock)
    })

    it('should call automock function when creating method', function () {
        // create automock stub
        var automock = sandbox.stub()
        // set automock function
        ImmutableCore.automock(automock)
        // create new module
        var fooModule = ImmutableCore.module('FooModule', {})
        // create new method
        ImmutableCore.method('FooModule.foo', function () {})
        // automock function should have been called
        assert.calledOnce(automock)
    })

    it('should call automock wrapper function when calling method', async function () {
        // wrapper function for foo method
        var wrapper = sandbox.stub().returns(true)
        // create automock stub
        var automock = sandbox.stub().returns(wrapper)
        // set automock function
        ImmutableCore.automock(automock)
        // create new module with method
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // call foo method which should call wrapper function
        var value = await fooModule.foo({bar: true})
        // check value
        assert.isTrue(value)
        // check that automock called
        assert.calledOnce(automock)
        // check that wrapper called with method args
        assert.calledOnce(wrapper)
        assert.calledWithMatch(wrapper, {bar: true})
    })
})