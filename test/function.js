'use strict'

/* npm modules */
const chai = require('chai')
const sinon = require('sinon')

/* app modules */
const ImmutableCore = require('../lib/immutable-core')
const MockLogClient = require('../mock/mock-log-client')

/* chai config */
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core: functions', function () {

    var sandbox

    var logClient

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset()
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
        // create mock logclient
        logClient = new MockLogClient(sandbox)
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should allow function to be defined', function () {
        // create new function
        var foo = ImmutableCore.function('foo', x => x)
        // foo should be a function
        assert.isFunction(foo)
        // foo should return the value it is called with
        assert.strictEqual(foo(1), 1)
    })

    it('should attach meta to function', function () {
        // create new function
        var foo = ImmutableCore.function('foo', function (x) {
            // comments should be ignored
            if (x) {
                try {
                    var y = JSON.stringify(x);
                }
                catch (err) {
                    console.log(err);
                }
            }
            return y;
        })
        // validate meta data
        assert.deepEqual(foo.meta, {
            functionBody: 'function(x){if(x){try{var y=JSON.stringify(x)}catch(err){console.log(err)}}return y}',
            functionName: 'foo',
            functionId: 'fb3079417f7eb36ebd624cea77b5a796',
            logClient: undefined,
        })
    })

    it('should throw error on native function', function () {
        assert.throws(function () {
            // creating new function from native should throw error
            var foo = ImmutableCore.function('foo', Array.isArray)
        })
    })

    it('should throw error when attempting to redefine function', function () {
        // create new function
        var foo = ImmutableCore.function('foo', x => x)
        // redefining function should fail
        assert.throws(() => ImmutableCore.function('foo', x => x))
    })

    it('should redefine function with local allowOverride', function () {
        // create new function
        var foo = ImmutableCore.function('foo', x => x)
        // redefining function should fail
        assert.doesNotThrow(() => ImmutableCore.function('foo', x => x, {allowOverride: true}))
    })

    it('should redefine function with global allowOverride', function () {
        // set global allowOverride
        ImmutableCore.allowOverride(true)
        // create new function
        var foo = ImmutableCore.function('foo', x => x)
        // redefining function should fail
        assert.doesNotThrow(() => ImmutableCore.function('foo', x => x))
    })

    it('should return existing function if not defining', function () {
        // create new function
        var foo = ImmutableCore.function('foo', x => x)
        // get function
        var foo = ImmutableCore.function('foo')
        // foo should be a function
        assert.isFunction(foo)
        // foo should return the value it is called with
        assert.strictEqual(foo(1), 1)
    })

    it('should throw error getting non-existent function', function () {
        assert.throws(() => ImmutableCore.function('foo'))
    })

    it('should have defined function', function () {
        // create new function
        var foo = ImmutableCore.function('foo', x => x)
        // check if function defined
        assert.isTrue(ImmutableCore.hasFunction('foo'))
    })

    it('should not have non-existent function', function () {
        // check if function defined
        assert.isFalse(ImmutableCore.hasFunction('foo'))
    })

    it('should log function call and result', function () {
        // set log client globally
        ImmutableCore.logClient(logClient)
        // create new function
        var foo = ImmutableCore.function('foo', x => x)
        // calling function should log
        foo(1)
        // check logged value
        assert.calledOnce(logClient.log)
        assert.calledWithMatch(logClient.log, 'functionCall', {
            functionName: 'foo',
            args: [ 1 ],
            res: 1,
            isError: false,
        })
    })

    it('should log extra data when called with session', function () {
        // fake session with variables that will be logged
        var fakeSession = {
            moduleCallId: 'FOO',
            requestId: 'BAR',
        }
        // set log client globally
        ImmutableCore.logClient(logClient)
        // create new function
        var foo = ImmutableCore.function('foo', x => x)
        // calling function should log
        foo.call(fakeSession, 1)
        // check logged value
        assert.calledOnce(logClient.log)
        assert.calledWithMatch(logClient.log, 'functionCall', {
            functionName: 'foo',
            args: [ 1 ],
            res: 1,
            isError: false,
            moduleCallId: 'FOO',
            requestId: 'BAR',
        })
    })

})