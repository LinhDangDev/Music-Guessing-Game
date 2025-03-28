const mongoose = require('mongoose');
const Song = require('../models/Song');
const { uploadToS3 } = require('./s3Services');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Kết nối tới MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Đã kết nối MongoDB'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

// Tạo thư mục tạm
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Hàm tải file từ GitHub về local
async function downloadFile(url, filePath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Lỗi tải file ${url}:`, error);
    throw error;
  }
}

// Hàm chính để chuyển đổi
async function migrateToS3() {
  try {
    // Lấy tất cả bài hát có URL từ GitHub
    const songs = await Song.find({
      filePath: { $regex: /github/ }
    });

    console.log(`Tìm thấy ${songs.length} bài hát cần chuyển đổi`);

    for (const song of songs) {
      try {
        console.log(`Đang xử lý: ${song.title} - ${song.artist}`);

        // Tạo tên file tạm
        const fileName = `${song.title.replace(/\s+/g, '_')}_${song.artist.replace(/\s+/g, '_')}.mp3`;
        const tempFilePath = path.join(tempDir, fileName);

        // Tải file từ GitHub
        console.log(`Đang tải file từ: ${song.filePath}`);
        await downloadFile(song.filePath, tempFilePath);

        // Tạo S3 key
        const s3Key = `music/${song.source}/${fileName}`;

        // Upload lên S3
        console.log(`Đang upload lên S3 với key: ${s3Key}`);
        await uploadToS3(tempFilePath, s3Key);

        // Cập nhật database
        song.s3Key = s3Key;
        song.filePath = s3Key; // Thay đổi filePath thành S3 key
        await song.save();

        // Xóa file tạm
        fs.unlinkSync(tempFilePath);

        console.log(`Đã chuyển đổi thành công: ${song.title}`);
      } catch (err) {
        console.error(`Lỗi xử lý ${song.title}:`, err);
      }
    }

    console.log('Hoàn thành quá trình chuyển đổi!');
  } catch (error) {
    console.error('Lỗi trong quá trình chuyển đổi:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Chạy hàm chuyển đổi
migrateToS3();
