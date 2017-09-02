'use strict'

/* npm modules */
const Promise = require('bluebird')

/* application modules */
const ImmutableCore = require('../lib/immutable-core')

/* chai config */
const assert = require('chai').assert

describe('immutable-core binds', function () {

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset()
    })

    it('should allow binding between two existing modules', function () {
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            bar: function (args) {
                return Promise.resolve(true)
            },
        })
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // test all bind methods
        assert.doesNotThrow(function () { ImmutableCore.after('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { ImmutableCore.afterDetach('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { ImmutableCore.before('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { ImmutableCore.beforeDetach('BarModule.bar', fooModule.foo) }, Error)
    })

    it('should allow binding to not yet defined modules/methods', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // test all bind methods
        assert.doesNotThrow(function () { ImmutableCore.after('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { ImmutableCore.afterDetach('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { ImmutableCore.before('BarModule.bar', fooModule.foo) }, Error)
        assert.doesNotThrow(function () { ImmutableCore.beforeDetach('BarModule.bar', fooModule.foo) }, Error)
    })

    it('should throw an error on double binding to same method/bind method/target', function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // first bind should succeed
        assert.doesNotThrow(function () { ImmutableCore.after('BarModule.bar', fooModule.foo) }, Error)
        // second bind should throw error
        assert.throws(function () { ImmutableCore.after('BarModule.bar', fooModule.foo) }, Error)
    })

    it('should not throw an error when double binding to same method/bind method/target and global allowOverride set', function () {
        // allow methods/modules to be redefined
        ImmutableCore.allowOverride(true)
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // first bind should succeed
        assert.doesNotThrow(function () { ImmutableCore.after('BarModule.bar', fooModule.foo) }, Error)
        // second bind should not throw error
        assert.doesNotThrow(function () { ImmutableCore.after('BarModule.bar', fooModule.foo) }, Error)
    })

})