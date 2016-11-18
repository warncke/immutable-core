'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const immutable = require('../lib/immutable-core')

chai.use(chaiAsPromised)
const assert = chai.assert

describe('immutable-core: method calls', function () {

    // reset global singleton data
    immutable.reset()
    // create FooModule
    var fooModule = immutable.module('FooModule', {
        // foo method returns valid Promise
        foo: function (args) {
            return Promise.resolve(true)
        },
        // bar method returns invalid boolean
        bar: function (args) {
            return true
        },
    })

    it('should allow calling a method with proper args', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // test method call
        return fooModule.foo({
            session: {}
        })
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })

    it('should reject on invalid args', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // foo method returns valid Promise
            foo: function (args) {
                return Promise.resolve(true)
            },
        })
        // undefined args
        assert.isRejected(fooModule.foo())
        // args not an object
        assert.isRejected(fooModule.foo(0))
        assert.isRejected(fooModule.foo(true))
        assert.isRejected(fooModule.foo(null))
        // too many args
        assert.isRejected(fooModule.foo({session: {}}, true))
    })

    it('should convert all return values to promise', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // bar method returns invalid boolean
            bar: function (args) {
                return true
            },
        })
        return fooModule.bar({
            session: {}
        })
        // test resolve value
        .then(res => {
            assert.strictEqual(res, true)
        })
    })

    it('should not throw errors on invalid args if strictArgs is false', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule with strictArgs false
        var fooModule = immutable.module('FooModule', {
            bam: function (args) {
                return true
            },
        }, {
            strictArgs: false,
        })
        // undefined args
        assert.doesNotThrow(function () { fooModule.bam() }, Error)
        // args not an object
        assert.doesNotThrow(function () { fooModule.bam(0) }, Error)
        assert.doesNotThrow(function () { fooModule.bam(true) }, Error)
        assert.doesNotThrow(function () { fooModule.bam(null) }, Error)
        // too many args
        assert.doesNotThrow(function () {
            fooModule.bam(
                {
                    session: {},
                },
                true
            )
        }, Error)
    })

    it('should set moduleCallId and moduleCallCreateTime on session', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                // validate moduleCallId
                assert.match(args.session.moduleCallId, /^[A-F0-9]{32}$/)
                // validate moduleCallCreateTime
                assert.match(args.session.moduleCallCreateTime, /^\d\d\d\d-\d\d-\d\d \d\d:\d\d:\d\d\.\d\d\d\d\d\d$/)
            },
        })
        // call foo
        return fooModule.foo({
            session: {},
        })
    })

    it('should manage stack for module calls', function () {
        // reset global singleton data
        immutable.reset()
        // create BarModule
        var barModule = immutable.module('BarModule', {
            // x ix called frst
            x: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['BarModule.x'])
                // call y
                return barModule.y({
                    session: args.session,
                })
            },
            // is called second
            y: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['BarModule.x', 'BarModule.y'])
                // call bar
                var barPromise = fooModule.bar({
                    session: args.session,
                })
                // call foo
                var fooPromise = fooModule.foo({
                    session: args.session,
                })
                // wait for both to resolve
                return Promise.all([
                    barPromise,
                    fooPromise,
                ])
            },
            // z is called third
            zBar: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['BarModule.x', 'BarModule.y', 'FooModule.bar', 'BarModule.zBar'])
            },
            // z is called third
            zFoo: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['BarModule.x', 'BarModule.y', 'FooModule.foo', 'BarModule.zFoo'])
            },
        })
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            // bar method returns invalid boolean
            bar: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['BarModule.x', 'BarModule.y', 'FooModule.bar'])
                // call z
                return barModule.zBar({
                    session: args.session,
                })
            },
            // foo method returns valid Promise
            foo: function (args) {
                // validate stack
                assert.deepEqual(args.session.stack, ['BarModule.x', 'BarModule.y', 'FooModule.foo'])
                // call z
                return barModule.zFoo({
                    session: args.session,
                })
            },
        })
        // session object to be passed to method call - should be cloned
        var session = {}
        // call x which calls several other functions to test stack
        return barModule.x({
            session: session,
        })
        // test session when done
        .then(res => {
            // session should not be modified
            assert.deepEqual(session, {})
        })
    })

})