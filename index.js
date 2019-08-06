const util = require('util');

function extendError(AWS, opts) {
  const needRunAt = !(opts.noRunStack || false);
  const paramsInspectOpts = opts.paramsInspectOptions || { showHidden: true };
  const rsLines = opts.runStackLines || 3;

  function getRunStack(target) {
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack) { return stack };
    const err = new Error;
    Error.captureStackTrace(err, target);
    const stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack.map(line => line.toString());
  }

  function injectRequestInfo(err, req, runStack) {
    try {
      const host = req.service.endpoint.host;
      const service = host.split('.')[0];

      const reqInfo = {
        host: host,
        operation: req.operation,
        params: req.params
      };

      const paramStr = util.inspect(req.params, paramsInspectOpts);
      let reqErrStr = `AWS Request failed: ${service}.${req.operation}(${paramStr})\n`;

      if (runStack) {
        const rs = runStack.slice(0, rsLines);
        reqErrStr += '    at ' + rs.join('\n    at ') + '\n';
        err.runStack = rs;
      }

      err.requestInfo = reqInfo;
      err.stack = `${reqErrStr}\n${err.stack}`;
    } catch(e) {
      console.warn('Failed to inject RequestInfo to AWS error', e);
    }
  }

  /*
   * Extend a method with callback
   */
  const origSend = AWS.Request.prototype.send;

  AWS.Request.prototype.send = function sendEx(callback) {
    const req = this;
    let runStack = null;
    if (needRunAt) runStack = getRunStack(arguments.callee).slice(2);

    const callbackEx = function () {
      if (arguments.length > 0) {
        const err = arguments[0];
        if (err instanceof Error) {
          injectRequestInfo(err, req, runStack);
        }
      }
      callback.apply(this, arguments);
    };

    return origSend.call(this, callbackEx);
  }

  /*
   * Extend a promise method
   */
  const origPromise = AWS.Request.prototype.promise;

  AWS.Request.prototype.promise = function promiseEx() {
    let runStack = null;
    if (needRunAt) runStack = getRunStack(arguments.callee);

    return origPromise.call(this)
      .catch(err => {
        injectRequestInfo(err, this, runStack);
        throw err;
      });
  }

  /*
   * Extend a createReadStream method
   */
  const origCreateReadStream = AWS.Request.prototype.createReadStream;

  AWS.Request.prototype.createReadStream = function createReadStreamEx() {
    const req = this;
    let runStack = null;
    if (needRunAt) runStack = getRunStack(arguments.callee);

    const stream = origCreateReadStream.call(this);
    const origOn = stream.on;
    stream.on = function (name, callback) {
      if (name === 'error') {
        origOn.call(this, name, function(err) {
          if (err instanceof Error) {
            injectRequestInfo(err, req, runStack);
          }
          callback(err);
        })
      } else {
        origOn.call(this, name, callback)
      }
    }

    return stream
  }
  return AWS;
}

/**
 * Extend AWS Error
 *
 * @param {Boolean} options.noRunStack - If it is true, the run stack is not outputed. default is false.
 * @param {Number} options.runStackLines - Specify run stack lines outputed. default is 3.
 * @param {Object} options.paramsInspectOptions - The options to inspect requset params, default is `{ showHidden: true }`.
 * @param {AWS} options.AWS - For test. if not specified, load aws-sdk automatically.
 * @return {AWS} aws-sdk
 */
module.exports = function extendAWSError(options) {
  const opts = options || {};
  const AWS = opts.AWS || require('aws-sdk');
  delete opts.AWS;
  return extendError(AWS, opts);
}
