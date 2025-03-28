const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { uploadToS3 } = require('./s3Services');
const Song = require('../models/Song');
require('dotenv').config();

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Đã kết nối MongoDB'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Thư mục chứa file nhạc cần upload (thay đổi đường dẫn này)
const musicDir = path.join(__dirname, '../music_files');

async function uploadSongs() {
  try {
    const files = fs.readdirSync(musicDir);

    for (const file of files) {
      if (path.extname(file).toLowerCase() === '.mp3') {
        try {
          console.log(`Đang upload ${file}...`);

          // Tên và nghệ sĩ từ tên file (giả sử định dạng: TenBaiHat_NgheSi.mp3)
          const nameParts = path.basename(file, '.mp3').split('_');
          const title = nameParts[0].replace(/_/g, ' ');
          const artist = nameParts.length > 1 ? nameParts[1].replace(/_/g, ' ') : 'Unknown';

          // Xác định source dựa trên thư mục hoặc metadata (ví dụ)
          const source = 'S3';

          // Upload lên S3
          const s3Key = `music/${source}/${file}`;
          const filePath = path.join(musicDir, file);
          await uploadToS3(filePath, s3Key);

          // Tạo record trong database
          const song = new Song({
            title,
            artist,
            source,
            filePath: s3Key,
            s3Key
          });

          await song.save();
          console.log(`Đã upload thành công: ${title} - ${artist}`);
        } catch (err) {
          console.error(`Lỗi khi upload ${file}:`, err);
        }
      }
    }

    console.log('Hoàn thành quá trình upload!');
  } catch (error) {
    console.error('Lỗi trong quá trình upload:', error);
  } finally {
    mongoose.disconnect();
  }
}

uploadSongs();
