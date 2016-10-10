'use strict'

const MockCacheClient = require('../mock/mock-cache-client')
const Promise = require('bluebird')
const assert = require('chai').assert
const immutable = require('../lib/immutable-core')

describe('immutable-core: caches', function () {

    it('should allow adding cache to existing method', function () {
        // reset global singleton data
        immutable.reset()
        // create FooModule
        var fooModule = immutable.module('FooModule', {
            foo: function (args) {
                return Promise.resolve(true)
            },
        })

    })

})