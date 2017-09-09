const assert = require('chai').assert;
const extendAWSError = require('../');

describe('extendAWSError', () => {
  const params = {
    Bucket: 'bucket-does-not-exist',
    Key: 'no-such-key'
  };

  const sharedAssert = (err) => {
    assert.equal(err.requestInfo.host, 's3.amazonaws.com');
    assert.equal(err.requestInfo.operation, 'getObject');
    assert.equal(err.requestInfo.params.Bucket, 'bucket-does-not-exist');
    assert.equal(err.requestInfo.params.Key, 'no-such-key');
    assert.match(err.stack, /^AWS Request failed\: s3\.getObject\(\{ Bucket\: \'bucket-does-not-exist\',/);
    assert.equal(err.runStack.length, 1);
  };

  describe('options.runStackLines', () => {
    const AWS = extendAWSError({ AWS: require('aws-sdk'), runStackLines: 1 });
    const s3 = new AWS.S3({ region: 'us-east-1' });

    it('extends AWS Error with 1 line runStack via callback', (done) => {
      s3.getObject(params, (err, data) => {
        try {
          sharedAssert(err);
          done();
        } catch(e) { done(e) }
      });
    });

    it('extends AWS Error with 1 line runStack promise throws', (done) => {
      s3.getObject(params).promise()
      .catch(sharedAssert)
      .then(done).catch(done);
    });
  });
});
