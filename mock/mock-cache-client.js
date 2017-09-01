'use strict'

/* exports */
module.exports = MockCacheClient

/**
 * @function MockCacheClient
 *
 * create a new mock cache client with sinon sandbox
 *
 * @params {object} sandbox
 *
 * @returns {MockCacheClient}
 */
function MockCacheClient (sandbox) {
    return {
        get: sandbox.stub().resolves(null),
        set: sandbox.stub().resolves(),
        setex: sandbox.stub().resolves(),
    }
}