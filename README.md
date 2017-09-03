# immutable-core

Immutable Core provides the foundational infrastructure for building modular
applications that use immutable data.

Immutable Core organizes code into named modules. Modules have named methods
which are plain functions.

Every Immutable method takes a single plain object for arguments and returns
a Promise.

Each Immutable Module may have a shared immutable global data state that cannot
be modified but can be replaced.

Immutable Core provides a framework for defining modules and methods, logging
and caching method calls, and binding method calls to execute either before
or after other methods.

## Native async/await

Immutable Core requires Node.js v7.6.0 or greater with native async/await
support.

## Version 2.0.0

Version 2.0.0 of Immutable Core is a major release with significant new
features and a few major breaking changes.

### Breaking Changes

* make module an instance of ImmutableCoreModule
* change meta property from function on prototype to own property object
* remove support for validate.js (replaced with Ajv/JSON schema)
* remove `defaultArgs` support (replaced with Ajv/JSON schema)
* after return data will replace instead of merge if not object
* `cacheId` for cached data changed to `_cached`
* stack entry for bound methods now appends ,bindType,bindSignature
* change from uglify-js to uglify-es for normalizing functions

### New Features

* args and return validation with Ajv/JSON schema
* `freeze` calls Object.freeze on args - enabled by default except in prod
* `resolve` resolves promises in args/return - enabled by default
* globally shared immutable module.meta.data
* `freezeData` calls Object.freeze on module data - enabled by default
* `with` bind type executes at same time with same args and merges results
* `withDetach` bind type executes the same as `with` but does not block
* calling method, bind, and cache on module instance work as expected

## Using Immutable Core

    var ImmutableCore = require('immutable-core')

### Creating a new module with no methods

    var fooModule = ImmutableCore.module('fooModule', {})

### Creating a new module with a method

    var fooModule = ImmutableCore.module('fooModule', {
        fooMethod: function (args) {}
    })

### Adding a method to a module

    var fooMethod = ImmutableCore.method('fooModule.fooMethod', function (args) {

    })

    var fooMethod = fooModule.method('fooMethod', function (args) {

    })

### Calling a method

    fooModule.fooMethod({
        session: {}
    })

### Checking if a module exists

    ImmutableCore.hasModule('fooModule')

### Checking if a method exists

    ImmutableCore.hasMethod('fooModule.fooMethod')

## Using Immutable AI

    ImmutableCore.module('barModule', {
        bar: function (args) {
            ...
        }
    })

    var fooModule = ImmutableCore.module('fooModule', {
        fooMethod: function (args) {
            // call barModule.bar using Immutable AI
            this.module.bar.bar()
        }
    })

[Immutable AI](https://www.npmjs.com/package/immutable-ai) provides an object-
oriented facade that simplifies the use of Immutable Core.

Without Immutable AI it is necessary to manually pass the `session` object that
is passed in the arguments to an Immutable method to all subsequent method
calls, http requests, and other Immutable framework operations.

With Immutable AI an new Immutable AI instance is created for each method call
and the method function is called with that instance as the `this` argument.

All calls made through Immutable AI access via `this` will have the current
`session` object added to them.

Immutable AI implements namespaces which help to organize modules.

Using Immutable AI gives access to all Immutable Modules currently loaded so
it is not necessary to `require` individual module files in order to use them.

### Immutable AI performance considerations

Immutable AI uses
[javascript proxies](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
and must instantiate a new function object and Proxy function for each method
call.

For most Immutable Core modules and methods the overheads of Immutable AI will
be relatively small but if profiling shows that these overheads are having a
significant impact on application performance Immutable AI can be disabled.

### Disabling Immutable AI globally

    ImmutableCore.immutableAI(false)

### Disabling Immutable AI at the module level

    ImmutableCore.module('fooModule', {}, {immutableAI: false})

### Disabling Immutable AI at the method level

    ImmutableCore.method('fooModule.fooMethod', function () {

    }, {immutableAI: false})

## Method args

By default methods must have a single object as an argument and this object
must contain a `session` object as a property.

Using a single calling pattern for all methods and requiring all arguments
to be named properties has many benefits from a developer standpoint and is
highly recommended.

The `session` object that is required for all method calls is used for access
control, logging, and other critical functionality.

If a method is called with invalid args an Error will be thrown.

String args enforcement can be disabled at the global, module, and method level.

### Disabling strict args globally

    ImmutableCore.strictArgs(false)

### Disabling strict args at the module level

    ImmutableCore.module('fooModule', {}, {strictArgs: false})

### Disabling strict args args at the method level

    ImmutableCore.method('fooModule.fooMethod', function () {

    }, {strictArgs: false})

## Creating an Immutable function

    var foo = ImmutableCore.function('foo', function (x, y) {
        return x + y
    })

Immutable functions can accept any number and type of arguments.

If a global or local logClient is set then function args and responses will
be logged for each function call.

### Function id

Every function has a unique id that is calculated by running the function
through [uglify-es](https://www.npmjs.com/package/uglify-es) to remove
whitespace and comments and then calculating a hash of the resulting string.

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

    ImmutableCore.logClient(logClient)

### Setting log client at the module level

    ImmutableCore.module('fooModule', {}, {logClient: logClient})

### Setting log client at the method level

    ImmutableCore.method('fooModule.fooMethod', function () {

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

    ImmutableCore.cacheClient(cacheClient)

### Setting cache client with a caching rule

    ImmutableCore.cache('fooModule.fooMethod', {
        cacheClient: cacheClient
    })

### Setting a caching rule

    ImmutableCore.cache('fooModule.fooMethod')

    fooModule.cache('fooMethod', {
        expire: 60
    })

A caching rule can be set either by calling `ImmutableCore.cache` or the `cache`
method on the ImmutableCoreModule with the method being cached.

If a `cacheClient` is not specified in the options it must already be set for
the module or an error will be thrown.

## Immutable Cache Keys

By default the values of the `args` object excluding the `session` will be used
along with the method signature (moduleName.methodName) to generate a 128bit
SHA-2 hex id that is used as the cache key.

Cache key generation can be customized by setting a list of properties from the
args object to use for generating the key or by setting a custom key generation
function.

### Setting properties to use for cache key with a caching rule

    ImmutableCore.cache('fooModule.fooMethod', {
        keyParams: ['foo', 'bar']
    })

### Setting a custom key generation method with a caching rule

    ImmutableCore.cache('fooModule.fooMethod', {
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

    ImmutableCore.cache('fooModule.fooMethod', {
        keyParams: ['foo', 'bar']
    })

## JSON Schema Args Validation with Ajv

    var fooModule = ImmutableCore.module('FooModule', {})

    fooModule.method('foo', function () {
        ...
    }, {
        schema: {
            args: {
                properties: {
                    foo: { type: 'boolean', default: true},
                },
                required: ['foo'],
            },
        },
    })

The `schema.args` option allows an Ajv compatible JSON schema for validating
args to be defined when defining a method.

This schema will be used to validate method args as long as the `validateArgs`
option is true which it is by default.

Any properties with a `default` value will be added to args.

## JSON Schema Return Value Validation with Ajv

    fooModule.method('foo', function () {
        ...
    }, {
        schema: {
            return: {
                properties: {
                    foo: { type: 'boolean', default: true},
                },
                required: ['foo'],
            },
        },
    })

The `schema.return` option allows an Ajv compatible JSON schema for validating
return values to be defined when defining a method.

This schema will be used to validate method return values as long as the
`validateReturn` option is true which it is by default.

Any properties with a `default` value will be added to return values.

## Resolving Promises

    var fooModule = ImmutableCore.module('FooModule', {
        fooMethod: function (args) {
            return {
                foo: Promise.resolve(true)
            }
        }
    })

    fooModule.fooMethod({
        foo: Promise.resolve(true)
    })

By default Immutable Core will resolve all promises in both args and return
values.

In the above example the args for `fooMethod` will be {foo: true} and the
return value will be {foo: true}.

## Setting Immutable Shared Module Data

    var fooModule = ImmutableCore.module('FooModule', {})

    ImmutableCore.setData('fooModule', {})

    fooModule.meta.data = { ... }

Shared module data can be set for a module either directly on the module
`meta.data` property for via the `ImmutableCore.setData` method.

Whenever data is set it will have its id calculated and the data will not be
set if the id has not changed. Data cannot have circular references.

Data will be frozen with a recursive Object.freeze by default.

## Getting Immutable Shared Module Data

    ImmutableCore.getData('fooModule')

    fooModule.meta.data

Shared module data can be read directly from the module `meta.data` or via the
`ImmutableCore.getData` method.

## Freezing method args

    var fooModule = ImmutableCore.module('FooModule', {
        fooMethod: function (args) {
            // this will throw error when freeze is enabled
            args.foo = false
        }
    })

The `freeze` option is enabled by default except in prod (NODE_ENV=production).

When `freeze` is enabled method arguments will be frozen recursively with
Object.freeze so that any attempt to change values will throw an error.

The args will be cloned using lodash _.cloneDeep before freezing so that if the
args object is modified by the caller it will not be frozen.

The return values from methods will be cloned using lodash _.cloneDeep so that
if a frozen object is passed from the args to the return it will not be frozen
when it is returned to the caller.

The args object should never be modified inside of methods. Especially with
methods that are bound together. Having `freeze` enabled during development and
testing will help to catch any improper args modifications.

Because cloning/freezing objects has a very high overhead `freeze` is disabled
by default in production. If code is adequately tested this should be fine but
for highly critical code it may be desirable to enable `freeze` in production
after verifying that the overhead is acceptable.

## Binding Methods

In Immutable Core any method can be bound to execute either before or after any
other method.

### Binding a Method Before Another

    var fooModule = ImmutableCore.module('FooModule', {
        fooMethod: function (args) {}
    })

    var barModule = ImmutableCore.module('BarModule', {
        barMethod: function (args) {}
    })

    ImmutableCore.before('fooModule.fooMethod', barModule.barMethod)

When fooModule.fooMethod is called barModule.barMethod will be called first.

If barModule.barMethod rejects then the call to fooModule.fooMethod will
reject with that error.

If barModule.barMethod resolves with an object then that object will be merged
into the arguments for barModule.barMethod using lodash _.merge.

### Binding a Method Before Another Without Waiting for Result

    ImmutableCore.beforeDetach('fooModule.fooMethod', barModule.barMethod)

When fooModule.fooMethod is called barModule.barMethod will be called first.

fooModule.fooMethod will be executed immediately and will not wait for
barModule.barMethod to resolve.

Whether barModule.barMethod resolves or rejects and any values that it resolves
with are ignored.

### Binding a Method With Another

    var fooModule = ImmutableCore.module('FooModule', {
        fooMethod: function (args) {}
    })

    var barModule = ImmutableCore.module('BarModule', {
        barMethod: function (args) {}
    })

    ImmutableCore.with('fooModule.fooMethod', barModule.barMethod)

When fooModule.fooMethod is called barModule.barMethod will be run at the same
time.

Methods that are bound with will run after any methods that are bound before the
target method and will always get the same args as the target method.

If barModule.barMethod rejects then the call to fooModule.fooMethod will
reject with that error.

If barModule.barMethod resolves with an object then that object will be merged
into the return value from barModule.barMethod using lodash _.merge.

If barModule.barMethod resolves with a non-object value then that value will
replace the return value returned by fooModule.fooMethod.

If barModule.barMethod resolves with undefined it will be ignored.

### Binding a Method With Another Without Waiting for Result

    var fooModule = ImmutableCore.module('FooModule', {
        fooMethod: function (args) {}
    })

    var barModule = ImmutableCore.module('BarModule', {
        barMethod: function (args) {}
    })

    ImmutableCore.withDetach('fooModule.fooMethod', barModule.barMethod)

When fooModule.fooMethod is called barModule.barMethod will be run at the same
time.

Methods that are bound with will run after any methods that are bound before the
target method and will always get the same args as the target method.

Whether barModule.barMethod resolves or rejects and any values that it resolves
with are ignored.

### Binding a Method After Another

    var fooModule = ImmutableCore.module('FooModule', {
        fooMethod: function (args) {}
    })

    var barModule = ImmutableCore.module('BarModule', {
        barMethod: function (args) {}
    })

    ImmutableCore.after('fooModule.fooMethod', barModule.barMethod)

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

If barModule.barMethod resolves with a non-object value then that value will
replace the return value returned by fooModule.fooMethod.

If barModule.barMethod resolves with undefined it will be ignored.

### Binding a Method After Another Without Promise Chaining

    ImmutableCore.afterDetach('fooModule.fooMethod', barModule.barMethod)

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

The following configuration options can be set globally and overriden for
modules and methods.

### ajv

    ImmutableCore.ajv( new Ajv({...}) )

Immutable Core uses an Ajv instance with the following args by default:

     {
        allErrors: true,
        coerceTypes: 'array',
        removeAdditional: true,
        useDefaults: true,
        v5: true,
    }

### allowOverride

    ImmutableCore.allowOverride(true)

By default Immutable Core will throw an error if you attempt to redefine a
module, method, or caching rule.

With allowOverride set to true redefining modules, methods, and caching rules
is allowed.

### automock

    ImmutableCore.automock(function () {...})

Set automock callback that will be called when creating new methods.

### cacheClient

    ImmutableCore.cacheClient(cacheClient)

Sets the cacheClient that will be used by default for all caching rules unless
a caching rule specifies a different cache client.

The cache client must conform to the specification in
immutable-require-valid-cache-client. An error will be throw for non-conforming
clients.

### freeze

    ImmutableCore.freeze(true)

Apply Object.freeze recursively to args before calling method.

Freezing is disabled by default in prod (NODE_ENV=production) and enabled
everywhere else.

The overhead for Object.freeze is relatively high which is why is is disabled
by default in production.

### freezeData

    ImmutableCore.freezeData(false)

By default Immutable Core will apply Object.freeze to module.meta.data. The
`freezeData` option allows this to be disabled.

Compared to applying Object.freeze to all method call args module.meta.data
should typically be set much less frequently and the scope of potential bugs
due to corrupted data is larger with globally shared data which is why this
option is always enabled by default.

### immutableAI

    ImmutableCore.immutableAI(false)

By default Immutable Core will create a new Immutable AI instance with each
method call and call the method with the Immutable AI instance as the `this`
argument.

This can be disabled globally or at the module or method level.

### logClient

    ImmutableCore.logClient(logClient)

Sets the logClient that will be used by default unless a different logClient is
specified at the module or method level.

The log client must conform to the specification in
immutable-require-valid-log-client. An error will be throw for non-conforming
clients.

### resolve

    ImmutableCore.resolve(false)

By default Immutable Core will resolve all promises in method args and return
values.

Traversing objects to look for promises to resolve incurs significant overhead,
especially with very large objects, so this can be disabled where not needed.

### strictArgs

    ImmutableCore.strictArgs(false)

By default Immutable Core requires all methods to be called with a single
object containing a session property that is an object. Errors are throw for
invalid arguments.

When strictArgs is set to false errors will not be thrown on invalid args.

The global default value for strictArgs can be overridden at the module and
method level.

When strictArgs is disabled Immutable Core will create an args object and a
session object if they do not exist or are invalid. Invalid arguments will be
silently ignored.

### validateArgs

    ImmutableCore.validateArgs(false)

By default method args will be validated using Ajv if an args schema is set.

`validateArgs` allows args schema validation to be disabled even when schemas
are defined.

### validateReturn

    ImmutableCore.validateReturn(false)

By default method return values will be validated using Ajv if a return schema
is set.

`validateReturn` allows return value schema validation to be disabled even when
schemas are defined.

## Setting options for modules

    ImmutableCore.module('FooModule', {}, {
        allowOverride: true,
        strictArgs: false,
    })

The third option when defining an Immutable Core module allows any global
options to be overriden for the defined module.

The options set for a module will not be changed after the module is defined
even if the global defaults are changed.

## Setting options for methods

    ImmutableCore.method('FooModule.foo', () => {}, {
        allowOverride: true,
        strictArgs: false,
    })

    fooModule.method('foo', () => {}, {
        allowOverride: true,
        strictArgs: false,
    })

The third option when defining an Immutable Core method allows any global
options to be overriden for the defined method.

## Immutable Core Global Data

### reset

    ImmutableCore.reset()

The reset method clears out all modules, methods, and caching rules, and
returns all global configuration variables to their default states.

### getGlobal

    ImmutableCore.getGlobal()

Return Immutable Core global data store.

### global.__immutable_core__

Immutable Core stores its singleton instance data in the
global.__immutable_core object.