const assert = require('chai').assert;
const extendAWSError = require('../');

describe('extendAWSError', () => {
  const params = {
    TableName: 'table-does-not-exist',
    Key: { name: { S: 'no-such-key' } }
  };

  const sharedAssert = (err) => {
    assert.equal(err.requestInfo.host, 'dynamodb.us-east-1.amazonaws.com');
    assert.equal(err.requestInfo.operation, 'getItem');
    assert.equal(err.requestInfo.params.TableName, 'table-does-not-exist');
    assert.equal(err.requestInfo.params.Key.name.S, 'no-such-key');
    assert.match(err.stack, /^AWS Request failed\: dynamodb\.getItem\(\{ TableName\: \u001b\[32m\'table-does-not-exist\'\u001b\[39m\,/);
    assert.include(err.stack, 'Key: \u001b[36m[Object]\u001b[39m');
    assert.equal(err.runStack.length, 3);
    assert.equal(err.requestInfo.params, params);
  };

  describe('options.paramsInspectOptions is not default', () => {
    const AWS = extendAWSError({ paramsInspectOptions: { depth: 0, colors: true } });
    const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });

    it('extends AWS Error with 1 line runStack via callback', (done) => {
      dynamodb.getItem(params, (err, data) => {
        try {
          sharedAssert(err);
          done();
        } catch(e) { done(e) }
      });
    });

    it('extends AWS Error with 1 line runStack promise throws', (done) => {
      dynamodb.getItem(params).promise()
      .catch(sharedAssert)
      .then(done).catch(done);
    });
  });
});
