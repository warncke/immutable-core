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

    var fooModule, sandbox, session

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false)
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
        // fake session to use for testing
        session = {
            sessionId: '11111111111111111111111111111111',
        }
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should get module data', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function () {
                // check data
                assert.deepEqual(this.data, {foo: true})
            },
        })
        // set module data
        fooModule.meta.data = {foo: true}
        // test method call
        await fooModule.foo({session: session})
    })

    it('should set module data', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function () {
                // set module data
                this.data = {foo: false}
                // check data
                assert.deepEqual(this.data, {foo: false})
            },
        })
        // set module data
        fooModule.meta.data = {foo: true}
        // test method call
        await fooModule.foo({session: session})
    })

    it('should get module data for another module', async function () {
        // create barModule
        var barModule = ImmutableCore.module('barModule', {})
        // set default bar data
        barModule.meta.data = {bar: true}
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function () {
                // check data
                assert.deepEqual(this.module.bar.data, {bar: true})
            },
        })
        // set module data
        fooModule.meta.data = {foo: true}
        // test method call
        await fooModule.foo({session: session})
    })

    it('should set module data for another module', async function () {
        // create barModule
        var barModule = ImmutableCore.module('barModule', {})
        // set default bar data
        barModule.meta.data = {bar: true}
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: function () {
                // set module data
                this.module.bar.data = {bar: false}
                // check data
                assert.deepEqual(ImmutableCore.getData('barModule'), {bar: false})
            },
        })
        // set module data
        fooModule.meta.data = {foo: true}
        // test method call
        await fooModule.foo({session: session})
    })

    it('should get/set data and do other immutable ai calls in sequence', async function () {
        // create barModule
        var barModule = ImmutableCore.module('barModule', {
            bar: function () {
                return this.data.bar
            }, 
        })
        // set default bar data
        barModule.meta.data = {bar: true}
        // create FooModule
        var fooModule = ImmutableCore.module('fooModule', {
            foo: async function () {
                // call bar to get value
                var val = await this.module.bar.bar()
                // check value
                assert.isTrue(val)
                // set module data
                this.module.bar.data = {bar: false}
                // check data
                assert.deepEqual(this.module.bar.data, {bar: false})
                // get val
                val = await this.module.bar.bar()
                // check value
                assert.isFalse(val)
                // get foo data
                val = this.data.foo
                // set foo data
                this.data = {foo: false}
                // check foo data
                assert.deepEqual(this.data, {foo: false})
            },
        })
        // set module data
        fooModule.meta.data = {foo: true}
        // test method call
        await fooModule.foo({session: session})
    })

})