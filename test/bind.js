'use strict'

const Promise = require('bluebird')
const assert = require('chai').assert
const immutable = require('../lib/immutable-core')

describe('immutable-core: binds', function () {

    it('should allow binding between two existing modules', function () {
        // reset global singleton data
        immutable.reset()
        // create BarModule
        var barModule = immutable.module('BarModule', {
            bar: function (args) {
                return Promise.resolve(true)
            },
        })
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // test all bind methods
        assert.doesNotThrow(function () { immutable.after('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { immutable.afterDetach('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { immutable.before('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { immutable.beforeDetach('BarModule.bar', fooModule.foo) }, Error)
    })

    it('should allow binding to not yet defined modules/methods', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // test all bind methods
        assert.doesNotThrow(function () { immutable.after('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { immutable.afterDetach('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { immutable.before('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { immutable.beforeDetach('BarModule.bar', fooModule.foo) }, Error)
    })

    it('should throw an error on double binding to same method/bind method/target', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // first bind should succeed
        assert.doesNotThrow(function () { immutable.after('BarModule.bar', fooModule.foo) }, Error)
        // second bind should throw error
        assert.throws(function () { immutable.after('BarModule.bar', fooModule.foo) }, Error)
    })

    it('should not throw an error when double binding to same method/bind method/target and global allowOverride set', function () {
        // reset global singleton data
        immutable.reset().allowOverride(true)
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // first bind should succeed
        assert.doesNotThrow(function () { immutable.after('BarModule.bar', fooModule.foo) }, Error)
        // second bind should not throw error
        assert.doesNotThrow(function () { immutable.after('BarModule.bar', fooModule.foo) }, Error)
    })

})