const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Tạo signed URL để truy cập file từ S3
const getSignedUrl = (key) => {
  // Xử lý nếu key là URL GitHub
  if (key.includes('githubusercontent.com')) {
    // Trích xuất phần filename
    const urlParts = key.split('/');
    const filename = urlParts[urlParts.length - 1];

    // Xác định nguồn (Youtube/Soundcloud)
    let source = 'Youtube';
    if (key.includes('Soundcloud')) {
      source = 'Soundcloud';
    }

    // Tạo S3 key mới
    key = `music/${source}/${decodeURIComponent(filename)}`;
  }

  // Đảm bảo key không có tiền tố bucket
  if (key.includes('music-guessing-game-audio/')) {
    key = key.split('music-guessing-game-audio/')[1];
  }

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Expires: 3600
  };

  console.log('Generating signed URL for:', key);
  try {
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
};

// Upload file lên S3
const uploadToS3 = async (filePath, s3Key) => {
  try {
    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: s3Key || path.basename(filePath),
      Body: fileContent,
      ContentType: getContentType(filePath)
    };

    const data = await s3.upload(params).promise();
    console.log(`File uploaded successfully. ${data.Location}`);
    return data;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
};

// Liệt kê các file trong bucket S3
const listS3Objects = async (prefix = '') => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Prefix: prefix
    };

    const data = await s3.listObjectsV2(params).promise();
    return data.Contents;
  } catch (error) {
    console.error('Error listing S3 objects:', error);
    throw error;
  }
};

// Xóa file từ S3
const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: key
    };

    await s3.deleteObject(params).promise();
    console.log(`File deleted successfully: ${key}`);
    return true;
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
};

// Lấy loại nội dung dựa trên phần mở rộng của file
const getContentType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  const contentTypes = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif'
  };

  return contentTypes[ext] || 'application/octet-stream';
};

module.exports = {
  getSignedUrl,
  uploadToS3,
  listS3Objects,
  deleteFromS3
};
