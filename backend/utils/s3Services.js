const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const getSignedUrl = (key) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 3600 // URL hết hạn sau 1 giờ
  };

  return s3.getSignedUrl('getObject', params);
};

module.exports = { getSignedUrl };
