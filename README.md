# immutable-core

Immutable Core provides the foundational infrastructure for building modular
applications that use immutable data.

Immutable Core organizes code into named modules. Modules have named methods
which are plain functions.

Every Immutable method takes a single plain object for arguments and returns
a Promise.

Immutable Core provides a framework for defining modules and methods, logging
and caching method calls, and binding method calls to execute either before
or after other methods.

## Native async/await

Immutable Core requires Node.js v7.6.0 or greater with native async/await
support.

## Using Immutable Core

    var immutable = require('immutable-core')

## Creating a new module with no methods

    var fooModule = immutable.module('fooModule', {})

## Creating a new module with a method

    var fooModule = immutable.module('fooModule', {
        fooMethod: function (args) {}
    })

## Adding a method to a module

    var fooMethod = immutable.method('fooModule.fooMethod', function (args) {

    })

## Calling a method

    fooModule.fooMethod({
        session: {}
    })

## Checking if a module exists

    immutable.hasModule('fooModule')

## Checking if a method exists

    immutable.hasMethod('fooModule.fooMethod')

## Method args

By default methods must have a single object as an argument and this object
must contain a `session` object as a property.

Using a single calling pattern for all methods and requiring all arguments
to be named properties has many benefits from a developer standpoint and is
highly recommended.

The `session` object that is required for all method calls is used for access
control, logging, and other critical functionality.

If a method is called with invalid args an Error will be thrown.

Argument validation can be disabled at the global, module, and method level.

### Disabling args validation globally

    immutable.strictArgs(false)

### Disabling args validation at the module level

    immutable.module('fooModule', {}, {strictArgs: false})

### Disabling args validation at the method level

    immutable.method('fooModule.fooMethod', function () {

    }, {strictArgs: false})

## Creating an Immutable functions

    var foo = immutable.function('foo', function (x, y) {
        return x + y
    })

Immutable functions can accept any number and type of arguments.

If a global or local logClient is set then function args and responses will
be logged for each function call.

### Function id

Every function has a unique id that is calculated by running the function
through uglify-js to remove whitespace and comments and then calculating a
hash of the resulting string.

### Calling a function in session context

    foo.call(session, arg1, ...)
    foo.apply(session, [...])

If function is called with a session object as its this argument then the
requestId and moduleCallId from the session will be logged with the function
call.

## Immutable Logging

Immutable Core is designed to log the arguments and return values of all
method calls.

When used in conjuction with the logging facilities provided by immutable http
and db clients these logs provide an invaluable tool for developers as well
as integrating with the immutable-autotest and immutable-automock modules
to automate unit and regression testing.

Log client requirements are defined by immutable-require-valid-log-client.

The log client can be set at the global, module, and method level.

### Setting log client globally

    immutable.logClient(logClient)

### Setting log client at the module level

    immutable.module('fooModule', {}, {logClient: logClient})

### Setting log client at the method level

    immutable.method('fooModule.fooMethod', function () {

    }, {logClient: logClient})

## Immutable Caching

Immutable method calls are designed to be cached using an injected caching
client and configurable caching rules.

Method call return values will only be cached if the method call resolves.

If the cache client returns null or does not resolve then the original method
will be called.

If the cached value is an object then a `cacheId` property will be added to it
with the cache key that was used to retrieve it.

Cache client requirements are defined by `immutable-require-valid-cache-client`.

The cache client can be set globally or with each caching rule. An Error will
be thrown for inavlid cache clients.

### Setting cache client globally

    immutable.cacheClient(cacheClient)

### Setting cache client with a caching rule

    immutable.cache('fooModule.fooMethod', {
        cacheClient: cacheClient
    })

## Immutable Cache Keys

By default the values of the `args` object excluding the `session` will be used
along with the method signature (moduleName.methodName) to generate a 128bit
SHA-2 hex id that is used as the cache key.

Cache key generation can be customized by setting a list of properties from the
args object to use for generating the key or by setting a custom key generation
function.

### Setting properties to use for cache key with a caching rule

    immutable.cache('fooModule.fooMethod', {
        keyParams: ['foo', 'bar']
    })

### Setting a custom key generation method with a caching rule

    immutable.cache('fooModule.fooMethod', {
        keyMethod: function (args, methodMeta) {
            // args are method call args
            // methodMeta contains module and method meta data
        }
    })

## Immutable Cache Expiration

By default cache entries do not expire. The `expire` option can be set with an
integer value that specifies the expiration time in seconds.

Expiration must be handled by the cache client. Immutable Core does not make
any attempt to validate or enforce expire values.

### Setting properties to use for cache key with a caching rule

    immutable.cache('fooModule.fooMethod', {
        keyParams: ['foo', 'bar']
    })

## Binding Methods

In Immutable Core any method can be bound to execute either before or after any
other method.

### Binding a Method Before Another

    var fooModule = immutable.module('FooModule', {
        fooMethod: function (args) {}
    })

    var barModule = immutable.module('BarModule', {
        barMethod: function (args) {}
    })

    immutable.before('fooModule.fooMethod', barModule.barMethod)

When fooModule.fooMethod is called barModule.barMethod will be called first.

If barModule.barMethod rejects then the call to fooModule.fooMethod will
reject with that error.

If barModule.barMethod resolves with an object then that object will be merged
into the arguments for barModule.barMethod using lodash _.merge.

### Binding a Method Before Another Without Promise Chaining

    immutable.beforeDetach('fooModule.fooMethod', barModule.barMethod)

When fooModule.fooMethod is called barModule.barMethod will be called first.

fooModule.fooMethod will be executed immediately and will not wait for
barModule.barMethod to resolve.

Whether barModule.barMethod resolves or rejects and any values that it resolves
with are ignored.

### Binding a Method After Another

    var fooModule = immutable.module('FooModule', {
        fooMethod: function (args) {}
    })

    var barModule = immutable.module('BarModule', {
        barMethod: function (args) {}
    })

    immutable.after('fooModule.fooMethod', barModule.barMethod)

If fooModule.fooMethod is called and it resolves then barModule.barMethod will
be called after it resolves.

If fooModule.fooMethod rejects then barModule.barMethod will not be called.

If barModule.barMethod rejects then fooModule.fooMethod will reject with that
error.

barModule.barMethod will be called with the following args object:

    {
        args:    // original arguments to fooModule.fooMethod
        res:     // data resolved with by fooModule.fooMethod
        origRes: // in this case the same as res
        session: // session object
    }

When barModule.barMethod is bound after fooModule.fooMethod and
fooModule.fooMethod is called the `res` and `origRes` properties will be the
same.

If another method was bound after barModule.barMethod then the `res` property
for that method would be data resolved with by barModule.barMethod but the
`origRes` would be the data resolved with by fooModule.fooMethod.

If many methods are chained one after the other `origRes` will always be the
value resolved with by the first method call in the chain while `res` will be
the value resolved with by the target method bound to.

If barModule.barMethod resolves with an object and fooModule.fooMethod
resolved with an object then the data resolved with by barModule.barMethod will
be merged into the data resolved with by fooModule.fooMethod using lodash
_.merge.

### Binding a Method After Another Without Promise Chaining

    immutable.afterDetach('fooModule.fooMethod', barModule.barMethod)

If fooModule.fooMethod is called and it resolves then barModule.barMethod will
be called after it resolves.

If fooModule.fooMethod rejects then barModule.barMethod will not be called.

fooModule.fooMethod will resolve immediately and will not wait for
barModule.barMethod to execute.

Whether barModule.barMethod resolves or rejects and any values that it resolves
with are ignored.

When bound with afterDetach barModule.barMethod will be called with same args as
when bound with after.

## Immutable Core Global Configuration Methods

Immutable Core use a singleton memory space. Wherever immutable-core is
required the same immutable instance with the same configuration, modules, and
methods will be returned.

Some configuration options can be set globally by calling methods on the
immutable object.

### allowOverride

    immutable.allowOverride(true)

By default Immutable Core will throw an error if you attempt to redefine a
module, method, or caching rule.

With allowOverride set to true redefining modules, methods, and caching rules
is allowed.

### cacheClient

    immutable.cacheClient(cacheClient)

Sets the cacheClient that will be used by default for all caching rules unless
a caching rule specifies a different cache client.

The cache client must conform to the specification in
immutable-require-valid-cache-client. An error will be throw for non-conforming
clients.

### logClient

    immutable.logClient(logClient)

Sets the logClient that will be used by default unless a different logClient is
specified at the module or method level.

The log client must conform to the specification in
immutable-require-valid-log-client. An error will be throw for non-conforming
clients.

### strictArgs

    immutable.strictArgs(false)

By default Immutable Core requires all methods to be called with a single
object containing a session property that is an object. Errors are throw for
invalid arguments.

When strictArgs is set to false errors will not be thrown on invalid args.

The global default value for strictArgs can be overridden at the module and
method level.

When strictArgs is disabled Immutable Core will create an args object and a
session object if they do not exist or are invalid. Invalid arguments will be
silently ignored.

### reset

    immutable.reset()

The reset method clears out all modules, methods, and caching rules, and
returns all global configuration variables to their default states.

## global.__immutable_core__

Immutable Core stores its singleton instance data in the
global.__immutable_core object.