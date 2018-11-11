'use strict'

/* npm modules */
const chai = require('chai')
const instanceId = require('immutable-instance-id')
const sinon = require('sinon')

/* app modules */
const ImmutableCore = require('../lib/immutable-core')
const MockLogClient = require('../mock/mock-log-client')

/* chai config */
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core module data', function () {

    var sandbox

    var logClient

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset()
        // create sinon sandbox
        sandbox = sinon.createSandbox()
        // create mock logclient
        logClient = new MockLogClient(sandbox)
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should set data', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // set data
        ImmutableCore.setData('FooModule', {foo: true})
        // check that data set
        assert.deepEqual(fooModule.meta.data, {foo: true})
        assert.strictEqual(fooModule.meta.dataId, 'ce35fd691fe6c26448191f4528e1ffef')
    })

    it('should set data via module meta', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // set data
        fooModule.meta.data = {foo: true}
        // check that data set
        assert.deepEqual(fooModule.meta.data, {foo: true})
        assert.strictEqual(fooModule.meta.dataId, 'ce35fd691fe6c26448191f4528e1ffef')
    })

    it('set data should return ImmutableCore', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // set data
        var ret = ImmutableCore.setData('FooModule', {foo: true})
        // check return
        assert.strictEqual(ret.class, 'ImmutableCore')
    })

    it('should log set data when log client defined', function () {
        // set log client
        ImmutableCore.logClient(logClient)
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // set data
        var ret = ImmutableCore.setData('FooModule', {foo: true})
        // check that log called
        assert.calledOnce(logClient.log)
        assert.calledWithMatch(logClient.log, 'setData', {
            data: {foo: true},
            dataId: 'ce35fd691fe6c26448191f4528e1ffef',
            instanceId: instanceId.id,
            moduleName: 'FooModule',
        })
    })

    it('should freeze data by default', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // data to set
        var data = {foo: true}
        // set data
        ImmutableCore.setData('FooModule', data)
        // data should be frozen
        assert.throws(() => data.foo = false, TypeError)
    })

    it('should not freeze data when option set globally', function () {
        // set global freezeData option
        ImmutableCore.freezeData(false)
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // data to set
        var data = {foo: true}
        // set data
        ImmutableCore.setData('FooModule', data)
        // data should not be frozen
        assert.doesNotThrow(() => data.foo = false)
    })

    it('should freeze data when global option false and module option true', function () {
        // set global freezeData option
        ImmutableCore.freezeData(false)
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {}, {freezeData: true})
        // data to set
        var data = {foo: true}
        // set data
        ImmutableCore.setData('FooModule', data)
        // data should be frozen
        assert.throws(() => data.foo = false, TypeError)
    })

    it('should not freeze data when option set on module', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {}, {freezeData: false})
        // data to set
        var data = {foo: true}
        // set data
        ImmutableCore.setData('FooModule', data)
        // data should not be frozen
        assert.doesNotThrow(() => data.foo = false)
    })

    it('should get data', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // set data
        ImmutableCore.setData('FooModule', {foo: true})
        // get data
        assert.deepEqual(ImmutableCore.getData('FooModule'), {foo: true})
    })

    it('should throw error on get data required when no data', function () {
        // create FooModule with no methods
        var fooModule = ImmutableCore.module('FooModule', {})
        // get data - should throw
        assert.throws(() => ImmutableCore.getData('FooModule', true))
    })

    it('should throw error on set data for undefined module', function () {
        // get data - should throw
        assert.throws(() => ImmutableCore.setData('FooModule', {foo: true}))
    })

    it('should throw error on get data for undefined module', function () {
        // get data - should throw
        assert.throws(() => ImmutableCore.getData('FooModule'))
    })

})