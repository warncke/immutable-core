'use strict'

const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const immutable = require('../lib/immutable-core')

chai.use(chaiAsPromised)
const assert = chai.assert

describe('immutable-core: immutable ai', function () {

    // fake session to use for testing
    var session = {
        sessionId: '11111111111111111111111111111111',
    }

    beforeEach(function () {
        // reset global singleton data
        immutable.reset()
    })

    it('should pass session when calling with no args', async function () {
        // create barModule
        var barModule = immutable.module('barModule', {
            bar: function (args) {
                // check that session passed
                assert.strictEqual(args.session.sessionId, session.sessionId)
                // return value to check
                return 'bar'
            },
        })
        // create FooModule
        var fooModule = immutable.module('fooModule', {
            foo: function (args) {
                return this.module.bar.bar()
            },
        })
        // test method call
        var ret = await fooModule.foo({session: session})
        // test returned value
        assert.strictEqual(ret, 'bar')
    })

    it('should pass session when calling with args', async function () {
        // create barModule
        var barModule = immutable.module('barModule', {
            bar: function (args) {
                // check that session passed
                assert.strictEqual(args.session.sessionId, session.sessionId)
                // check args
                assert.strictEqual(args.foo, 'foo')
                // return value to check
                return 'bar'
            },
        })
        // create FooModule
        var fooModule = immutable.module('fooModule', {
            foo: function (args) {
                return this.module.bar.bar({foo: 'foo'})
            },
        })
        // test method call
        var ret = await fooModule.foo({session: session})
        // test returned value
        assert.strictEqual(ret, 'bar')
    })

    it('should work with Model namespace', async function () {
        // create barModel
        var barModule = immutable.module('barModel', {
            bar: function (args) {
                // check that session passed
                assert.strictEqual(args.session.sessionId, session.sessionId)
                // return value to check
                return 'bar'
            },
        })
        // create FooModule
        var fooModule = immutable.module('fooModule', {
            foo: function (args) {
                return this.model.bar.bar()
            },
        })
        // test method call
        var ret = await fooModule.foo({session: session})
        // test returned value
        assert.strictEqual(ret, 'bar')
    })

    it('should work with Controller namespace', async function () {
        // create barController
        var barModule = immutable.module('barController', {
            bar: function (args) {
                // check that session passed
                assert.strictEqual(args.session.sessionId, session.sessionId)
                // return value to check
                return 'bar'
            },
        })
        // create FooModule
        var fooModule = immutable.module('fooModule', {
            foo: function (args) {
                return this.controller.bar.bar()
            },
        })
        // test method call
        var ret = await fooModule.foo({session: session})
        // test returned value
        assert.strictEqual(ret, 'bar')
    })

    it('should disable immutableAI globally', async function () {
        // disable globally
        immutable.immutableAI(false)
        // create FooModule
        var fooModule = immutable.module('fooModule', {
            foo: function (args) {
                // this should not be function
                assert.notStrictEqual(typeof this, 'function')
            },
        })
        // check that immutable ai disabled on method method
        assert.strictEqual(fooModule.foo.meta.immutableAI, false)
        // call foo to check this
        await fooModule.foo({session: session})
    })

    it('should disable immutableAI at module level', async function () {
        // create FooModule
        var fooModule = immutable.module('fooModule', {
            foo: function (args) {
                // this should not be function
                assert.notStrictEqual(typeof this, 'function')
            },
        }, {
            immutableAI: false,
        })
        // check that immutable ai disabled on method method
        assert.strictEqual(fooModule.foo.meta.immutableAI, false)
        // call foo to check this
        await fooModule.foo({session: session})
    })

    it('should disable immutableAI at method level', async function () {
        // create FooModule
        var fooModule = immutable.module('fooModule', {})
        // create foo method
        var fooMethod = immutable.method('fooModule.foo', function (args) {
            // this should not be function
            assert.notStrictEqual(typeof this, 'function')
        }, {immutableAI: false})
        // check that immutable ai disabled on method method
        assert.strictEqual(fooMethod.meta.immutableAI, false)
        // call foo to check this
        await fooMethod({session: session})
    })

})