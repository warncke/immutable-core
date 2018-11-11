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

describe('immutable-core immutable ai', function () {

    var sandbox, session

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false)
        // create sinon sandbox
        sandbox = sinon.createSandbox()
        // fake session to use for testing
        session = {
            sessionId: '11111111111111111111111111111111',
        }
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should pass session when calling with no args', async function () {
        // create bar stub
        var bar = sandbox.stub().resolves('bar')
        // create barModule
        var barModule = ImmutableCore.module('barModule', {
            bar: bar,
        })
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function () {
                return this.module.bar.bar()
            },
        })
        // test method call
        var ret = await fooModule.foo({session: session})
        // test returned value
        assert.strictEqual(ret, 'bar')
        // test that bar called with session
        assert.calledOnce(bar)
        assert.calledWithMatch(bar, {
            session: session,
        })
    })

    it('should pass session when calling with args', async function () {
        // create bar stub
        var bar = sandbox.stub().resolves('bar')
        // create barModule
        var barModule = ImmutableCore.module('barModule', {
            bar: bar,
        })
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function () {
                return this.module.bar.bar({foo: true})
            },
        })
        // test method call
        var ret = await fooModule.foo({session: session})
        // test returned value
        assert.strictEqual(ret, 'bar')
        // test that bar called with session
        assert.calledOnce(bar)
        assert.calledWithMatch(bar, {
            foo: true,
            session: session,
        })
    })

    it('should work with Controller namespace', async function () {
        // create bar stub
        var bar = sandbox.stub().resolves('bar')
        // create barController
        var barModule = ImmutableCore.module('barController', {
            bar: bar,
        })
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function (args) {
                return this.controller.bar.bar()
            },
        })
        // test method call
        var ret = await fooModule.foo({session: session})
        // test returned value
        assert.strictEqual(ret, 'bar')
        // test that bar called with session
        assert.calledOnce(bar)
        assert.calledWithMatch(bar, {
            session: session,
        })
    })

    it('should disable immutableAI globally', async function () {
        // disable globally
        ImmutableCore.immutableAI(false)
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function (args) {
                // this should not be function
                assert.notStrictEqual(typeof this, 'function')
            },
        })
        // check that immutable ai disabled on method method
        assert.strictEqual(fooModule.foo.meta.immutableAI, false)
        // call foo to check this
        await fooModule.foo({session: session})
    })

    it('should disable immutableAI at module level', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function (args) {
                // this should not be function
                assert.notStrictEqual(typeof this, 'function')
            },
        }, {
            immutableAI: false,
        })
        // check that immutable ai disabled on method method
        assert.strictEqual(fooModule.foo.meta.immutableAI, false)
        // call foo to check this
        await fooModule.foo({session: session})
    })

    it('should disable immutableAI at method level', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {})
        // create foo method
        var fooMethod = ImmutableCore.method('fooModule.foo', function (args) {
            // this should not be function
            assert.notStrictEqual(typeof this, 'function')
        }, {immutableAI: false})
        // check that immutable ai disabled on method method
        assert.strictEqual(fooMethod.meta.immutableAI, false)
        // call foo to check this
        await fooMethod({session: session})
    })

})