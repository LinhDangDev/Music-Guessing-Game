const Song = require('../models/Song');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const mongoose = require('mongoose');

// Đặt đường dẫn ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// Lấy tất cả bài hát
exports.getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().select('title artist source');
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy chi tiết một bài hát
exports.getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Không tìm thấy bài hát' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy một đoạn nhạc ngẫu nhiên và các lựa chọn đáp án
exports.getRandomClip = async (req, res) => {
  try {
    console.log('Đang lấy đoạn nhạc ngẫu nhiên...');

    // Đếm tổng số bài hát
    const count = await Song.countDocuments();
    console.log(`Tổng số bài hát: ${count}`);

    if (count === 0) {
      console.log('Không có bài hát nào trong cơ sở dữ liệu');
      return res.status(404).json({ message: 'Không có bài hát nào trong cơ sở dữ liệu' });
    }

    // Lấy ngẫu nhiên một bài hát, ưu tiên bài hát có externalSource
    let randomSong;
    const externalCount = await Song.countDocuments({ externalSource: true });

    if (externalCount > 0) {
      console.log(`Sử dụng bài hát từ nguồn bên ngoài (có ${externalCount} bài)`);
      const randomExternalIndex = Math.floor(Math.random() * externalCount);
      randomSong = await Song.findOne({ externalSource: true }).skip(randomExternalIndex);
    } else {
      console.log('Không có bài hát từ nguồn bên ngoài, sử dụng bài hát bất kỳ');
      const randomIndex = Math.floor(Math.random() * count);
      randomSong = await Song.findOne().skip(randomIndex);
    }

    console.log(`Bài hát ngẫu nhiên: ${randomSong.title} (ID: ${randomSong._id})`);

    // Lấy 3 bài hát ngẫu nhiên khác làm đáp án nhiễu
    // Ưu tiên lấy các bài hát cùng nguồn (Youtube/Soundcloud)
    let otherSongs = await Song.find({
      _id: { $ne: randomSong._id },
      source: randomSong.source
    }).select('title artist').limit(3);

    // Nếu không đủ bài hát từ cùng nguồn, lấy thêm từ nguồn khác
    if (otherSongs.length < 3) {
      const remainingSongs = await Song.find({
        _id: { $ne: randomSong._id },
        _id: { $nin: otherSongs.map(s => s._id) }
      }).select('title artist').limit(3 - otherSongs.length);

      otherSongs = [...otherSongs, ...remainingSongs];
    }

    // Nếu không đủ bài hát làm đáp án nhiễu
    if (otherSongs.length < 3) {
      console.log('Không đủ bài hát để tạo đáp án nhiễu, tạo đáp án giả');

      // Tạo đáp án giả để đủ 4 lựa chọn
      const fakeSongs = [
        { title: "Despacito", artist: "Luis Fonsi" },
        { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars" },
        { title: "See You Again", artist: "Wiz Khalifa ft. Charlie Puth" },
        { title: "Believer", artist: "Imagine Dragons" },
        { title: "Havana", artist: "Camila Cabello" }
      ];

      while (otherSongs.length < 3) {
        const fakeSong = fakeSongs[Math.floor(Math.random() * fakeSongs.length)];
        if (!otherSongs.some(s => s.title === fakeSong.title)) {
          otherSongs.push({
            _id: new mongoose.Types.ObjectId(),
            title: fakeSong.title,
            artist: fakeSong.artist
          });
        }
      }
    }

    // Lấy URL nguyên bản từ bài hát
    const fullSongUrl = randomSong.filePath;
    console.log(`URL đầy đủ: ${fullSongUrl}`);

    // Tạo URL với tham số để cắt đoạn ngẫu nhiên từ bài hát
    // Sử dụng cách này để hỗ trợ client cắt đoạn nhạc mà không cần xử lý ở server
    const randomStartPercentage = Math.floor(Math.random() * 60); // Bắt đầu từ 0-60% của bài hát
    const clipDuration = 7; // 7 giây

    // Tạo URL với tham số start_time và duration
    let clipUrl = fullSongUrl;
    // Giữ nguyên fullSongUrl cho GitHub raw URLs, sẽ xử lý cắt ở client
    console.log(`Đoạn nhạc bắt đầu từ: ${randomStartPercentage}%, thời lượng: ${clipDuration}s`);

    // Tạo mảng đáp án gồm cả đáp án đúng
    const choices = [
      {
        id: randomSong._id,
        title: randomSong.title,
        artist: randomSong.artist
      },
      ...otherSongs.map(song => ({
        id: song._id,
        title: song.title,
        artist: song.artist
      }))
    ];

    // Xáo trộn mảng đáp án
    shuffleArray(choices);

    // Trả về thông tin cho client
    const responseData = {
      clipUrl: fullSongUrl,
      clipStartPercent: randomStartPercentage,
      clipDuration: clipDuration,
      correctAnswerId: randomSong._id,
      choices
    };

    console.log('Đã gửi dữ liệu clip: correctAnswerId =', randomSong._id);
    console.log('Số lượng lựa chọn:', choices.length);
    res.json(responseData);
  } catch (error) {
    console.error('Lỗi khi lấy clip ngẫu nhiên:', error);
    res.status(500).json({ message: error.message });
  }
};

// Hàm xáo trộn mảng
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Correctly export the functions that were defined with exports.*
module.exports = exports;
