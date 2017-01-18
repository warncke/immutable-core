'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const immutable = require('../lib/immutable-core')

chai.use(chaiAsPromised)
const assert = chai.assert

describe('immutable-core: automock', function () {

    beforeEach(function () {
        // reset global singleton data
        immutable.reset()
    })

    it('should allow setting an automock function', function () {
        // set automock function
        immutable.automock(function () {})
        // test automock function
        assert.isFunction(immutable.automock())
    })


    it('should throw error when calling automock with non-function', function () {
        // call automock with object which should throw error
        assert.throws(function () {
            immutable.automock({})
        }, Error)
    })

    it('should call automock function when creating module with method', function () {
        // flag set if automock function called
        var autoMockCalled = false
        // automock application function
        var automock = function (method) {
            autoMockCalled = true
        }
        // set automock function
        immutable.automock(automock)
        // create new module with method
        var fooModule = immutable.module('FooModule', {
            foo: function () {},
        })
        // automock function should have been called
        assert.isTrue(autoMockCalled)
    })

    it('should call automock function when creating method', function () {
        // flag set if automock function called
        var autoMockCalled = false
        // automock application function
        var automock = function (method) {
            autoMockCalled = true
        }
        // set automock function
        immutable.automock(automock)
        // create new module
        var fooModule = immutable.module('FooModule', {})
        // create new method
        immutable.method('FooModule.foo', function () {})
        // automock function should have been called
        assert.isTrue(autoMockCalled)
    })

    it('should call automock wrapper function when calling method', function () {
        // disable arg validation
        immutable.strictArgs(false)
        // flag set if automock function called
        var autoMockWrapperCalled = false
        // automock application function
        var automock = function (method) {
            return function (args) {
                autoMockWrapperCalled = true
                // call original method
                return method(args)
            }
        }
        // set automock function
        immutable.automock(automock)
        // create new module with method
        var fooModule = immutable.module('FooModule', {
            foo: function () {},
        })
        // call foo method which should call wrapper function
        return fooModule.foo().then(function () {
            // automock function should have been called
            assert.isTrue(autoMockWrapperCalled)
        })
    })
})