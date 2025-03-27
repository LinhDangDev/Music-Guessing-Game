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
    console.log('Đang lấy clip ngẫu nhiên...');

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
            _id: new mongoose.Types.ObjectId(), // Tạo ID giả với cú pháp mới
            title: fakeSong.title,
            artist: fakeSong.artist
          });
        }
      }
    }

    // Lấy clipUrl từ bài hát
    let clipUrl = randomSong.clipPath || randomSong.filePath;
    console.log(`Sử dụng URL clip: ${clipUrl}`);

    // Đảm bảo clipUrl là Google Drive direct link
    if (clipUrl && clipUrl.includes('drive.google.com/file/d/')) {
      const match = clipUrl.match(/\/d\/([^/]+)/);
      if (match && match[1]) {
        const fileId = match[1];
        clipUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
        console.log(`Đã chuyển đổi thành Google Drive direct link: ${clipUrl}`);
      }
    }

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
      clipUrl,
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

// Hàm tạo clip từ bài hát
const createClip = async (song) => {
  // Nếu là nguồn bên ngoài, không tạo clip mà trả về URL clip có sẵn
  if (song.externalSource && song.clipPath) {
    return song.clipPath;
  }

  // Nếu là file nội bộ, xử lý như cũ
  const sourceFile = path.join(__dirname, '../../', song.filePath);
  const clipFileName = `${song._id}_clip.mp3`;
  const clipPath = path.join(__dirname, '../assets/clips', clipFileName);

  // Kiểm tra xem file clip đã tồn tại chưa
  if (fs.existsSync(clipPath)) {
    return clipPath;
  }

  // Tạo clip 7 giây ở vị trí ngẫu nhiên
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(sourceFile, (err, metadata) => {
      if (err) {
        return reject(err);
      }

      const duration = metadata.format.duration;
      const clipDuration = 7; // 7 seconds
      let startTime = Math.floor(Math.random() * (duration - clipDuration));

      // Đảm bảo startTime không âm
      startTime = Math.max(0, startTime);

      ffmpeg(sourceFile)
        .setStartTime(startTime)
        .setDuration(clipDuration)
        .output(clipPath)
        .on('end', () => {
          console.log(`Đã tạo clip cho bài hát: ${song.title}`);
          resolve(clipPath);
        })
        .on('error', (err) => {
          console.error(`Lỗi khi tạo clip: ${err.message}`);
          reject(err);
        })
        .run();
    });
  });
};

// Hàm xáo trộn mảng
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

module.exports = { getRandomClip, getAllSongs };
