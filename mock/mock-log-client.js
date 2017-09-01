'use strict'

/* exports */
module.exports = MockLogClient

/**
 * @function MockLogClient
 *
 * create a new mock log client with sinon sandbox
 *
 * @params {object} sandbox
 *
 * @returns {MockLogClient}
 */
function MockLogClient (sandbox) {
    return {
        error: sandbox.stub(),
        log: sandbox.stub(),
    }
}