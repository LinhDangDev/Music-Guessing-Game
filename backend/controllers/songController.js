const Song = require('../models/Song');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const mongoose = require('mongoose');
const { getSignedUrl, uploadToS3 } = require('../utils/s3Services');

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

// Upload bài hát mới lên S3 và lưu vào database
exports.uploadSongToS3 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }

    const { title, artist, source = 'S3' } = req.body;

    if (!title || !artist) {
      return res.status(400).json({ message: 'Thiếu thông tin title hoặc artist' });
    }

    // Tạo key cho S3 từ thông tin bài hát
    const s3Key = `songs/${source}/${title.replace(/\s+/g, '_')}_${artist.replace(/\s+/g, '_')}_${Date.now()}.mp3`;

    // Upload file lên S3
    const filePath = req.file.path;
    const uploadResult = await uploadToS3(filePath, s3Key);

    // Tạo bài hát mới trong database
    const newSong = new Song({
      title,
      artist,
      source,
      filePath: s3Key,
      s3Key: s3Key
    });

    await newSong.save();

    // Xóa file tạm sau khi đã upload lên S3
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Không thể xóa file tạm:', err);
    }

    res.status(201).json({
      message: 'Bài hát đã được tải lên thành công',
      song: newSong,
      s3Url: uploadResult.Location
    });
  } catch (error) {
    console.error('Lỗi khi upload bài hát:', error);
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

    // Lấy ngẫu nhiên một bài hát từ S3
    const randomIndex = Math.floor(Math.random() * count);
    const randomSong = await Song.findOne().skip(randomIndex);

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

    // Lấy URL từ S3 cho bài hát
    const s3Key = randomSong.filePath;
    console.log(`S3 Key: ${s3Key}`);

    // Tạo Signed URL từ Amazon S3
    const signedUrl = getSignedUrl(s3Key);
    console.log(`Đã tạo Signed URL từ S3`);

    // Tạo thông tin về vị trí bắt đầu của đoạn nhạc (sẽ được xử lý ở client)
    const randomStartPercentage = Math.floor(Math.random() * 60); // Bắt đầu từ 0-60% của bài hát
    const clipDuration = 7; // 7 giây

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
      clipUrl: signedUrl,
      clipStartPercent: randomStartPercentage,
      clipDuration: clipDuration,
      correctAnswerId: randomSong._id,
      choices
    };

    console.log('Generated Signed URL:', signedUrl);
    // Thêm URL gốc vào response để debug
    responseData.originalFilePath = s3Key;

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
