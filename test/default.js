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
    assert.match(err.stack, /^AWS Request failed\: dynamodb\.getItem\(\{ TableName\: \'table-does-not-exist\',/);
    assert.include(err.runStack[0], 'test/default.js');
    assert.equal(err.runStack.length, 3);
  };

  describe('options are default', () => {
    const AWS = extendAWSError({ AWS: require('aws-sdk') });
    const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });

    it('extends AWS Error via callback', (done) => {
      dynamodb.getItem(params, (err, data) => {
        try {
          sharedAssert(err);
          done();
        } catch(e) { done(e) }
      });
    });

    it('extends AWS Error promise throws', (done) => {
      dynamodb.getItem(params).promise()
      .catch(sharedAssert)
      .then(done).catch(done);
    });
  });
});
