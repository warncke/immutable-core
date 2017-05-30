'use strict'

const MockLogClient = require('../mock/mock-log-client')
const assert = require('chai').assert
const immutable = require('../lib/immutable-core')

// create mock log client instance
var mockLogClient = new MockLogClient()

describe('immutable-core: functions', function () {

    beforeEach(function () {
        // reset global singleton data
        immutable.reset()
    })

    it('should allow function to be defined', function () {
        // create new function
        var foo = immutable.function('foo', function (x) {
            return x
        })
        // foo should be a function
        assert.isFunction(foo)
        // foo should return the value it is called with
        assert.strictEqual(foo(1), 1)
    })

    it('should attach meta to function', function () {
        // create new function
        var foo = immutable.function('foo', function (x) {
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
            var foo = immutable.function('foo', Array.isArray)
        })
    })

    it('should throw error when attempting to redefine function', function () {
        // create new function
        var foo = immutable.function('foo', function (x) {
            return x
        })
        assert.throws(function () {
            // redefining function should fail
            foo = immutable.function('foo', function (x) {
                return x
            })
        })
    })

    it('should redefine function with local allowOverride', function () {
        // create new function
        var foo = immutable.function('foo', function (x) {
            return x
        })
        assert.doesNotThrow(function () {
            // redefining function should fail
            foo = immutable.function('foo', function (x) {
                return x
            }, {allowOverride: true})
        })
    })

    it('should redefine function with global allowOverride', function () {
        // set global allowOverride
        immutable.allowOverride(true)
        // create new function
        var foo = immutable.function('foo', function (x) {
            return x
        })
        assert.doesNotThrow(function () {
            // redefining function should fail
            foo = immutable.function('foo', function (x) {
                return x
            })
        })
    })

    it('should return existing function if not defining', function () {
        // create new function
        immutable.function('foo', function (x) {
            return x
        })
        // get function
        var foo = immutable.function('foo')
        // foo should be a function
        assert.isFunction(foo)
        // foo should return the value it is called with
        assert.strictEqual(foo(1), 1)
    })

    it('should throw error getting non-existent function', function () {
        assert.throws(function () {
            // getting non-existent function should throw
            foo = immutable.function('foo', function (x) {
                return x
            })
        })
    })

    it('should have defined function', function () {
        // create new function
        immutable.function('foo', function (x) {
            return x
        })
        assert.isTrue(immutable.hasFunction('foo'))
    })

    it('should not have non-existent function', function () {
        assert.isFalse(immutable.hasFunction('foo'))
    })

    it('should log function call and result', function () {
        var logged
        // create mock log client to test logging
        var mockLogClient = new MockLogClient({
            log: function (type, data) {
                // check log type
                assert.strictEqual(type, 'functionCall')
                // set logged data for checking
                logged = data
            }
        })
        // set log client globally
        immutable.logClient(mockLogClient)
        // create new function
        var foo = immutable.function('foo', function (x) {
            return x
        })
        // calling function should log
        foo(1)
        // check logged value
        assert.deepEqual(logged, {
            functionName: 'foo',
            args: [ 1 ],
            res: 1,
            isError: false,
            moduleCallId: undefined,
            requestId: undefined 
        })
    })

    it('should log extra data when called with session', function () {
        var logged
        // fake session with variables that will be logged
        var fakeSession = {
            moduleCallId: 'FOO',
            requestId: 'BAR',
        }
        // create mock log client to test logging
        var mockLogClient = new MockLogClient({
            log: function (type, data) {
                // check log type
                assert.strictEqual(type, 'functionCall')
                // set logged data for checking
                logged = data
            }
        })
        // set log client globally
        immutable.logClient(mockLogClient)
        // create new function
        var foo = immutable.function('foo', function (x) {
            return x
        })
        // calling function should log
        foo.call(fakeSession, 1)
        // check logged value
        assert.deepEqual(logged, {
            functionName: 'foo',
            args: [ 1 ],
            res: 1,
            isError: false,
            moduleCallId: 'FOO',
            requestId: 'BAR',
        })
    })

})