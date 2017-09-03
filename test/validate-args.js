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

describe('immutable-core validate args', function () {

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

    it('should validate args when schema.args defined', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for args
        fooModule.method('foo', () => true, {
            schema: {
                args: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
        })
        // calling method without correct args should reject
        await assert.isRejected(fooModule.foo())
        // calling method with correct args should resolve
        await assert.isFulfilled(fooModule.foo({foo: true}))
    })

    it('should add defaults to args when schema.args defined', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for args
        fooModule.method('foo', foo, {
            schema: {
                args: {
                    properties: {
                        foo: { type: 'boolean', default: true},
                    },
                    required: ['foo'],
                },
            },
        })
        // calling method with missing default arg should resolv
        await assert.isFulfilled(fooModule.foo())
        // method should have default added to args
        assert.calledWithMatch(foo, {foo: true})
    })

    it('should not validate args when disabled globally', async function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false).validateArgs(false)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for args
        fooModule.method('foo', () => true, {
            schema: {
                args: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
        })
        // calling method with correct args should resolve
        await assert.isFulfilled(fooModule.foo())
    })

    it('should not validate args when disabled for module', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {}, {
            validateArgs: false,
        })
        // create method foo with schema for args
        fooModule.method('foo', () => true, {
            schema: {
                args: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
        })
        // calling method with correct args should resolve
        await assert.isFulfilled(fooModule.foo())
    })

    it('should not validate args when disabled for method', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for args
        fooModule.method('foo', () => true, {
            schema: {
                args: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
            validateArgs: false,
        })
        // calling method with correct args should resolve
        await assert.isFulfilled(fooModule.foo())
    })

})