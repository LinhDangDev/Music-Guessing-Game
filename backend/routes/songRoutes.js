const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { getRandomClip, getAllSongs, getSongById, uploadSongToS3 } = require('../controllers/songController');

// Cấu hình multer để upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Đảm bảo thư mục uploads đã được tạo
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận file âm thanh
  if (
    file.mimetype === 'audio/mpeg' ||
    file.mimetype === 'audio/wav' ||
    file.mimetype === 'audio/ogg' ||
    file.mimetype === 'audio/mp4'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file âm thanh (mp3, wav, ogg, m4a)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 50 // Giới hạn 50MB
  }
});

// Lấy một đoạn nhạc ngẫu nhiên
router.get('/random-clip', getRandomClip);

// Lấy tất cả bài hát
router.get('/', getAllSongs);

// Lấy thông tin bài hát theo ID
router.get('/:id', getSongById);

// Upload bài hát lên S3
router.post('/upload', upload.single('audioFile'), uploadSongToS3);

module.exports = router;
