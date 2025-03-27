/**
 * File kiểm tra quá trình quét thư mục nhạc và tạo đoạn nhạc
 */
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { scanMusicDirectories } = require('./musicScanner');
const { getRandomClip, getAllSongs } = require('../controllers/songController');

// Tạo thư mục music nếu chưa tồn tại
const musicDirs = [
  path.join(__dirname, '../../music/Youtube'),
  path.join(__dirname, '../../music/Soundcloud')
];

for (const dir of musicDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Đã tạo thư mục ${dir}`);
  }
}

// Mock express request và response
const mockRequest = {};
const mockResponse = {
  status: function(code) {
    console.log(`Response status: ${code}`);
    return this;
  },
  json: function(data) {
    console.log('Response data:', JSON.stringify(data, null, 2));
    return this;
  }
};

// Kết nối MongoDB
async function runTest() {
  try {
    console.log('Đang kết nối đến MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Đã kết nối đến MongoDB');

    console.log('\n=== KIỂM TRA QUÉT THƯ MỤC NHẠC ===');
    await scanMusicDirectories();

    console.log('\n=== KIỂM TRA LẤY TẤT CẢ BÀI HÁT ===');
    await getAllSongs(mockRequest, mockResponse);

    console.log('\n=== KIỂM TRA TẠO ĐOẠN NHẠC NGẪU NHIÊN ===');
    await getRandomClip(mockRequest, mockResponse);

    console.log('\nĐã kiểm tra xong!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi chạy kiểm tra:', error);
    process.exit(1);
  }
}

runTest();
