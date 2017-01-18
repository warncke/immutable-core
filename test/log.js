'use strict'

const MockLogClient = require('../mock/mock-log-client')
const Promise = require('bluebird')
const assert = require('chai').assert
const immutable = require('../lib/immutable-core')

describe('immutable-core: log', function () {

    beforeEach(function () {
        // reset global singleton data
        immutable.reset()
    })

    it('should allow setting default log client', function () {
        // capture module call id
        var moduleCallId
        // create mock lock client
        var mockLogClient = new MockLogClient()
        // set immutable params
        immutable
            .logClient(mockLogClient)
            .strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // call foo which should log
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, true)
        })
    })

    it('should log module call and return', function () {
        // capture module call id
        var moduleCallId
        // create mock lock client
        var mockLogClient = new MockLogClient({
            log: ()=> [
                // 1st call: module call
                (type, data) => {
                    // validate args
                    assert.strictEqual(type, 'moduleCall')
                    assert.isObject(data.args)
                    // capture module call id
                    moduleCallId = data.moduleCallId
                },
                // 2nd call: module call resolve
                (type, data) => {
                    // validate args
                    assert.strictEqual(type, 'moduleCallResolve')
                    assert.strictEqual(data.moduleCallId, moduleCallId)
                    assert.strictEqual(data.moduleCallResolveData, true)
                },
            ],
        })
        // set immutable params
        immutable
            .logClient(mockLogClient)
            .strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // call foo which should log
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, true)
        })
    })

    it('should have correct stack in log', function () {
        // capture module call id
        var moduleCallId
        // create mock lock client
        var mockLogClient = new MockLogClient({
            log: ()=> [
                // 1st call: module call foo
                (type, data) => {
                    assert.deepEqual(data.args.session.stack, [])
                },
                // 2nd call: module call bar
                (type, data) => {
                    assert.deepEqual(data.args.session.stack, ['FooModule.foo'])
                },
                // 3rd call: resolve bar
                () => {},
                // 4th call: resolve foo
                () => {},
            ],
        })
        // set immutable params
        immutable
            .logClient(mockLogClient)
            .strictArgs(false)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            bar: function (args) {
                return Promise.resolve(true)
            },
            foo: function (args) {
                return fooModule.bar(args)
            },
        })
        // call foo which should log
        return fooModule.foo()
        // verify returned value
        .then(value => {
            assert.strictEqual(value, true)
        })
    })

})