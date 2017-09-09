# Extend AWS Error

[![Build Status](https://travis-ci.org/tilfin/extend-aws-error.svg)](https://travis-ci.org/tilfin/extend-aws-error)

[AWS SDK for JavaScript](https://github.com/aws/aws-sdk-js) throws an error without the request information,
therefore we are too difficutl to investigate where the problem occurred at debug.
This npm module extends an AWS Request error with the method name, the place where it ran and so on.
It supports only requests with callback and promise requests, does not support the process using readable stream.

## Install

```
$ npm install extend-aws-error
```

## How to use

`const extendAWSError = require('extend-aws-error');`

**extendAWSError(** _options_ **)**

* `options` `<Object>`
  * `noRunStack` `<Boolean>` If it is true, the run stack is not outputed. Defaults to `false`
  * `runStackLines` `<Number>` Specify run stack lines outputed. Defaults to `3`
  * `paramsInspectOptions` `<Object>` Specify the options to inspect request params. Defaults to `{ showHidden: true }`
  * `AWS` `<AWS>` For test. if not specified, load aws-sdk automatically.

## Example

```
const AWS = require('aws-sdk');
require('extend-aws-error')({ AWS }); // must be defined only once in your whole application

/*
 * alternative short method if your application is only 1 file
 *
 * const AWS = require('extend-aws-error')();
 */

const s3 = new AWS.S3({ region: 'ap-northeast-1' });
s3.getObject({
  Bucket: 'BucketNotExists',
  Key: 'KeyNotExists'
}, (err, data) => {
  console.log(err.stack); // The result is outputed by the following
  

  const dynamodb = new AWS.DynamoDB({ region: 'ap-northeast-1' });
  dynamodb.getItem({
    Key: {
     "Artist": {
       S: "Acme Band"
      }
    }, 
    TableName: "Music"
  }).promise()
  .catch(err => {
    console.log(err.stack); // The result is outputed by the following
  });
});
```

#### console.error(err.stack) examples

The heading is `AWS Request failed: <endpoint>.<method>(<params>)`.
If the `options.noRunStack` is not `true`, The run stack is appended after it.
The cost of outputing a run stack is high, so recommending to define `{ noRunStack: process.env.NODE_ENV === 'production' }` so as to be disabled in production.
The number of the run stack lines can be changed by `options.runStackLines` that is default `3`.

```
AWS Request failed: s3-ap-northeast-1.getObject({ Bucket: 'BucketNotExists', Key: 'KeyNotExists' })
    at Object.<anonymous> (/home/tilfin/extend-aws-error/example/main.js:5:4)
    at Module._compile (module.js:569:30)
    at Object.Module._extensions..js (module.js:580:10)

NoSuchBucket: The specified bucket does not exist
    at Request.extractError (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/services/s3.js:577:35)
    at Request.callListeners (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/sequential_executor.js:105:20)
    at Request.emit (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/sequential_executor.js:77:10)
    at Request.emit (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:683:14)
    at Request.transition (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:22:10)
    at AcceptorStateMachine.runTo (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/state_machine.js:14:12)
    at /home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/state_machine.js:26:10
    at Request.<anonymous> (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:38:9)
    at Request.<anonymous> (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:685:12)
    at Request.callListeners (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/sequential_executor.js:115:18)
```

```
AWS Request failed: dynamodb.getItem({ Key: { Artist: { S: 'Acme Band' } }, TableName: 'Music' })
    at Response.s3.getObject (/home/tilfin/extend-aws-error/example/main.js:20:6)
    at Response.callbackEx (/home/tilfin/extend-aws-error/index.js:62:16)
    at Request.<anonymous> (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:364:18)

ResourceNotFoundException: Requested resource not found
    at Request.extractError (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/protocol/json.js:48:27)
    at Request.callListeners (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/sequential_executor.js:105:20)
    at Request.emit (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/sequential_executor.js:77:10)
    at Request.emit (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:683:14)
    at Request.transition (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:22:10)
    at AcceptorStateMachine.runTo (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/state_machine.js:14:12)
    at /home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/state_machine.js:26:10
    at Request.<anonymous> (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:38:9)
    at Request.<anonymous> (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/request.js:685:12)
    at Request.callListeners (/home/tilfin/extend-aws-error/node_modules/aws-sdk/lib/sequential_executor.js:115:18)
```
