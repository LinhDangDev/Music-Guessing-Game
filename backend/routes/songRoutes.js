const express = require('express');
const router = express.Router();
const { getRandomClip, getAllSongs } = require('../controllers/songController');

// Lấy một đoạn nhạc ngẫu nhiên
router.get('/random-clip', getRandomClip);

// Lấy tất cả bài hát
router.get('/', getAllSongs);

module.exports = router;
