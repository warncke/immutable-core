'use strict'

/* npm modules */
const Promise = require('bluebird')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const chaiSubset = require('chai-subset')
const sinon = require('sinon')

/* application modules */
const ImmutableCore = require('../lib/immutable-core')

/* chai config */
chai.use(chaiAsPromised)
chai.use(chaiSubset)
const assert = chai.assert
sinon.assert.expose(chai.assert, { prefix: '' })

describe('immutable-core resolve args', function () {

    var sandbox

    beforeEach(function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false).resolve(true)
        // create sinon sandbox
        sandbox = sinon.createSandbox()
    })

    afterEach(function () {
        // clear sinon sandbox
        sandbox.restore()
    })

    it('should resolve promises in args', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: true})
    })

    it('should resolve deep promises in args', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: { bar: [0, promise] },
        })
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: { bar: [0, true] } })
    })

    it('should resolve promises in args for bound before method', async function () {
        // create bar and foo stubs
        var bar = sandbox.stub().resolves()
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: bar,
            foo: foo,
        })
        // bind bar before foo
        ImmutableCore.before('FooModule.foo', fooModule.bar)
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = bar.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: true})
    })

    it('should resolve promises in args for bound beforeDetach method', async function () {
        // create bar and foo stubs
        var bar = sandbox.stub().resolves()
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: bar,
            foo: foo,
        })
        // bind bar before foo
        ImmutableCore.beforeDetach('FooModule.foo', fooModule.bar)
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = bar.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: true})
    })

    it('should resolve promises in args for bound with method', async function () {
        // create bar and foo stubs
        var bar = sandbox.stub().resolves()
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: bar,
            foo: foo,
        })
        // bind bar before foo
        ImmutableCore.with('FooModule.foo', fooModule.bar)
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = bar.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: true})
    })

    it('should resolve promises in args for bound withDetach method', async function () {
        // create bar and foo stubs
        var bar = sandbox.stub().resolves()
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: bar,
            foo: foo,
        })
        // bind bar before foo
        ImmutableCore.withDetach('FooModule.foo', fooModule.bar)
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = bar.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: true})
    })

    it('should resolve promises in args for bound after method', async function () {
        // create bar and foo stubs
        var bar = sandbox.stub().resolves()
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: bar,
            foo: foo,
        })
        // bind bar before foo
        ImmutableCore.after('FooModule.foo', fooModule.bar)
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = bar.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {args: {foo: true}})
    })

    it('should resolve promises in args for bound afterDetach method', async function () {
        // create bar and foo stubs
        var bar = sandbox.stub().resolves()
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            bar: bar,
            foo: foo,
        })
        // bind bar before foo
        ImmutableCore.afterDetach('FooModule.foo', fooModule.bar)
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = bar.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {args: {foo: true}})
    })

    it('should not resolve promises in args if disabled globally', async function () {
        // reset global singleton data
        ImmutableCore.reset().strictArgs(false).resolve(false)
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        })
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: promise})
    })

    it('should not resolve promises in args if disabled for module', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {
            foo: foo,
        }, {resolve: false})
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: promise})
    })

    it('should not resolve promises in args if disabled for method', async function () {
        // create foo stub
        var foo = sandbox.stub().resolves()
        // create FooModule
        var fooModule = ImmutableCore.module('FooModule', {})
        // crete method
        fooModule.method('foo', foo, {resolve: false})
        // promise to test
        var promise = Promise.resolve(true)
        // test method call
        await fooModule.foo({
            foo: promise,
        })
        // get args
        var args = foo.getCall(0).args[0]
        // check that args are frozen
        assert.containSubset(args, {foo: promise})
    })

})