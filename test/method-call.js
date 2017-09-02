'use strict'

/* npm modules */
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSubset = require('chai-subset')
const sinon = require('sinon')

/* app modules */
const ImmutableCore = require('../lib/immutable-core')

/* chai config */
chai.use(chaiAsPromised)
chai.use(chaiSubset)
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core method calls', function () {

    var sandbox

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset()
        // create sinon sandbox
        sandbox = sinon.sandbox.create()
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should allow calling a method with proper args', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // test method call
        var res = await fooModule.foo({session: {}})
        // test resolve value
        assert.strictEqual(res, true)
    })

    it('should reject on invalid args', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        })
        // undefined args
        await assert.isRejected(fooModule.foo())
        // args not an object
        await assert.isRejected(fooModule.foo(0))
        await assert.isRejected(fooModule.foo(true))
        await assert.isRejected(fooModule.foo(null))
        // too many args
        await assert.isRejected(fooModule.foo({session: {}}, true))
    })

    it('should not throw errors on invalid args if strictArgs is false', async function () {
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: () => true,
        }, {strictArgs: false})
        // undefined args
        await assert.isFulfilled(fooModule.foo())
        // args not an object
        await assert.isFulfilled(fooModule.foo(0))
        await assert.isFulfilled(fooModule.foo(true))
        await assert.isFulfilled(fooModule.foo(null))
        // too many args
        await assert.isFulfilled(fooModule.foo({}, true))
    })

    it('should set moduleCallId, moduleCallSignature and moduleCallCreateTime on session', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // call foo
        await fooModule.foo({session: {}})
        // get args from call
        var args = foo.getCall(0).args[0]
        // validate moduleCallId
        assert.match(args.session.moduleCallId, /^[a-f0-9]{32}$/)
        // validate moduleCallSignature
        assert.strictEqual(args.session.moduleCallSignature, 'FooModule.foo')
        // validate moduleCallCreateTime
        assert.match(args.session.moduleCallCreateTime, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6}$/)

    })

    it('should manage stack for module calls', async function () {
        // create BarModule
        var barModule = ImmutableCore.module('BarModule', {
            // x ix called frst
            x: args => barModule.y(args),
            // is called second
            y: async args => {
                // call bar
                await fooModule.bar(args)
                // call foo
                await fooModule.foo(args)
            },
            // z is called fourth
            zBar: () => true,
            // z is called fourth
            zFoo: () => true,
        })
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            // called third
            bar: args => barModule.zBar(args),
            // called third
            foo: args => barModule.zFoo(args),
        })
        // create spies for methods
        var xSpy = sandbox.spy(barModule, 'x')
        var ySpy = sandbox.spy(barModule, 'y')
        var zBarSpy = sandbox.spy(barModule, 'zBar')
        var zFooSpy = sandbox.spy(barModule, 'zFoo')
        var barSpy = sandbox.spy(fooModule, 'bar')
        var fooSpy = sandbox.spy(fooModule, 'foo')
        // session object to be passed to method call - should be cloned
        var session = {}
        // call x which calls several other functions to test stack
        return barModule.x({session: session})
        // session should not be modified
        assert.deepEqual(session, {})
        // check stacks
        assert.calledWithMatch(xSpy, {session: {stack: []}})
        assert.calledWithMatch(ySpy, {session: {stack: [
            'BarModule.x',
        ]}})
        assert.calledWithMatch(barSpy, {session: {stack: [
            'BarModule.x',
            'BarModule.y',
        ]}})
        assert.calledWithMatch(fooSpy, {session: {stack: [
            'BarModule.x',
            'BarModule.y',
        ]}})
        assert.calledWithMatch(zBarSpy, {session: {stack: [
            'BarModule.x',
            'BarModule.y',
            'FooModule.bar',
        ]}})
        assert.calledWithMatch(zFooSpy, {session: {stack: [
            'BarModule.x',
            'BarModule.y',
            'FooModule.foo',
        ]}})
    })

    it('should set default arg values', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // set default args
        var defaultArgs = {
            bar: null,
            foo: 0,
            x: 'x',
            y: {foo: 'bar'},
            z: ['foo'],
        }
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {}, {
            strictArgs: false,
        })
        // create foo method
        ImmutableCore.method('FooModule.foo', foo, {
            defaultArgs: defaultArgs,
        })
        // call should resolve
        await fooModule.foo()
        // check args
        assert.calledWithMatch(foo, defaultArgs)
    })

    it('should set default arg values using lodash get/set', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {}, {
            strictArgs: false,
        })
        // create foo method
        ImmutableCore.method('FooModule.foo', foo, {
            defaultArgs: {'foo.bar': true},
        })
        // call should resolve
        await fooModule.foo()
        // check args
        assert.calledWithMatch(foo, {foo: {bar: true}})
    })

})