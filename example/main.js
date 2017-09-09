const AWS = require('../')();


const s3 = new AWS.S3({ region: 'ap-northeast-1' });
s3.getObject({
  Bucket: 'BucketNotExists',
  Key: 'KeyNotExists'
}, (err, data) => {
	console.log(err.stack); // an error occurred
  

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
    console.log(err.stack); // an error occurred
  });
});
