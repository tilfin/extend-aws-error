const assert = require('chai').assert;
const extendAWSError = require('../');

describe('extendAWSError', () => {
  const sharedAssert = (err) => {
    assert.equal(err.requestInfo.host, 'dynamodb.us-east-1.amazonaws.com');
    assert.equal(err.requestInfo.operation, 'getItem');
    assert.equal(err.requestInfo.params.TableName, 'table-does-not-exist');
    assert.equal(err.requestInfo.params.Key.name.S, 'no-such-key');
    assert.match(err.stack, /^AWS Request failed\: dynamodb\.getItem\(\{ TableName\: \'table-does-not-exist\',/);
    assert.notExists(err.runStack);
  };

  describe('options.noRunStack is true', () => {
    const AWS = extendAWSError({ AWS: require('aws-sdk'), noRunStack: true });
    const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });

    it('extends AWS Error without runStack via callback', (done) => {
      dynamodb.getItem({
        TableName: 'table-does-not-exist',
        Key: { name: { S: 'no-such-key' } }
      }, (err, data) => {
        try {
          sharedAssert(err);
          done();
        } catch(e) { done(e) }
      });
    });

    it('extends AWS Error without runStack promise throws', (done) => {
      dynamodb.getItem({
        TableName: 'table-does-not-exist',
        Key: { name: { S: 'no-such-key' } }
      }).promise()
      .catch(sharedAssert)
      .then(done).catch(done);
    });
  });
});
