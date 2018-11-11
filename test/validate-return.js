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

describe('immutable-core validate return', function () {

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

    it('should reject on invalid return when schema.return defined', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for return
        fooModule.method('foo', () => undefined, {
            schema: {
                return: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
        })
        // calling method without correct args should reject
        await assert.isRejected(fooModule.foo())
    })

    it('should resolve on valid return when schema.return defined', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for return
        fooModule.method('foo', () => {
            return {foo: true}
        }, {
            schema: {
                return: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
        })
        // calling method without correct args should reject
        await assert.isFulfilled(fooModule.foo())
    })

    it('should resolve on valid return with non object type', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for return
        fooModule.method('foo', () => true, {
            schema: {
                return: {
                    type: 'boolean',
                },
            },
        })
        // calling method without correct args should reject
        await assert.isFulfilled(fooModule.foo())
    })

    it('should reject on valid return with non object type', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for return
        fooModule.method('foo', () => [], {
            schema: {
                return: {
                    type: 'boolean',
                },
            },
        })
        // calling method without correct args should reject
        await assert.isRejected(fooModule.foo())
    })

    it('should add defaults to return when schema.return defined', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for return
        fooModule.method('foo', () => {
            return {}
        }, {
            schema: {
                return: {
                    properties: {
                        foo: { type: 'boolean', default: true},
                    },
                    required: ['foo'],
                },
            },
        })
        // call method
        var res = await fooModule.foo()
        // check result
        assert.deepEqual(res, {foo: true})
    })

    it('should not validate return when disabled globally', async function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false).validateReturn(false)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for return
        fooModule.method('foo', () => undefined, {
            schema: {
                return: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
        })
        // calling method without correct args should reject
        await assert.isFulfilled(fooModule.foo())
    })

    it('should not validate return when disabled for module', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {}, {validateReturn: false})
        // create method foo with schema for return
        fooModule.method('foo', () => undefined, {
            schema: {
                return: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
        })
        // calling method without correct args should reject
        await assert.isFulfilled(fooModule.foo())
    })

    it('should not validate return when disabled for method', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // create method foo with schema for return
        fooModule.method('foo', () => undefined, {
            schema: {
                return: {
                    properties: {
                        foo: { type: 'boolean'},
                    },
                    required: ['foo'],
                },
            },
            validateReturn: false
        })
        // calling method without correct args should reject
        await assert.isFulfilled(fooModule.foo())
    })

})