const mongoose = require('mongoose');
const Song = require('../models/Song');
require('dotenv').config();

// Kết nối tới MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Đã kết nối MongoDB'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

async function updateSongsForS3() {
  try {
    // Lấy tất cả bài hát có URL từ GitHub
    const songs = await Song.find({
      filePath: { $regex: /github/ }
    });

    console.log(`Tìm thấy ${songs.length} bài hát cần cập nhật`);

    for (const song of songs) {
      try {
        console.log(`Đang cập nhật: ${song.title} - ${song.artist}`);

        // Lấy tên file từ URL
        const urlParts = song.filePath.split('/');
        const encodedFilename = urlParts[urlParts.length - 1];
        const filename = decodeURIComponent(encodedFilename);

        // Tạo S3 key mới
        const s3Key = `music/${song.source}/${filename}`;

        // Cập nhật database
        song.s3Key = s3Key;
        song.filePath = s3Key;
        await song.save();

        console.log(`Đã cập nhật thành công: ${song.title} -> ${s3Key}`);
      } catch (err) {
        console.error(`Lỗi xử lý ${song.title}:`, err);
      }
    }

    console.log('Hoàn thành quá trình cập nhật!');
  } catch (error) {
    console.error('Lỗi trong quá trình cập nhật:', error);
  } finally {
    mongoose.disconnect();
  }
}

updateSongsForS3();
