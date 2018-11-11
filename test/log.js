'use strict'

/* npm modules */
const chai = require('chai')
const chaiSubset = require('chai-subset')
const sinon = require('sinon')

/* app modules */
const ImmutableCore = require('../lib/immutable-core')
const MockLogClient = require('../mock/mock-log-client')

/* chai config */
chai.use(chaiSubset)
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core log', function () {

    var sandbox

    var logClient

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false)
        // create sinon sandbox
        sandbox = sinon.createSandbox()
        // create mock logclient
        logClient = new MockLogClient(sandbox)
        // set global log client
        ImmutableCore.logClient(logClient)
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should log module call and return', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // call foo which should log
        var value = await fooModule.foo({foo: true})
        // verify returned value
        assert.strictEqual(value, true)
        // check that log client called
        assert.calledTwice(logClient.log)
        // get args from log client calls
        var first = logClient.log.getCall(0).args
        var second = logClient.log.getCall(1).args
        // check args for first log call
        assert.containSubset(first, ['moduleCall', {args: {foo: true}}])
        // get module call id from first log
        var moduleCallId = first[1].moduleCallId
        // check args for second log call
        assert.containSubset(second, ['moduleCallResolve', {
            moduleCallId: moduleCallId,
            moduleCallResolveData: true,
        }])
    })

    it('should have correct stack in log', async function () {
        // create bar stub
        var bar = sandbox.stub().resolves(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: bar,
            foo: args => fooModule.bar(args),
        })
        // call foo which should log
        var value = await fooModule.foo()
        // verify returned value
        assert.strictEqual(value, true)
        // check that log client called
        assert.callCount(logClient.log, 4)
        // get args from log client call
        var second = logClient.log.getCall(1).args
        // check stack for bar
        assert.containSubset(second, ['moduleCall', {
            args: {
                session: { stack: ['FooModule.foo','FooModule.bar'] },
            },
            functionName: 'bar',
            moduleName: 'FooModule',
        }])
    })

})