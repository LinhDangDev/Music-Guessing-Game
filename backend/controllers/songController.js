const Song = require('../models/Song');
const path = require('path');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

// Thiết lập đường dẫn ffmpeg và ffprobe
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomClip = async (req, res) => {
  try {
    // Đảm bảo thư mục clips tồn tại
    const clipsDir = path.join(__dirname, '..', 'assets', 'clips');
    if (!fs.existsSync(clipsDir)) {
      fs.mkdirSync(clipsDir, { recursive: true });
      console.log('Đã tạo thư mục clips');
    }

    // Lấy danh sách bài hát từ database
    const allSongs = await Song.find();

    if (allSongs.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài hát nào trong cơ sở dữ liệu' });
    }

    if (allSongs.length < 4) {
      return res.status(400).json({ message: 'Cần ít nhất 4 bài hát trong cơ sở dữ liệu để tạo câu hỏi' });
    }

    // Chọn ngẫu nhiên một bài hát
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    const selectedSong = allSongs[randomIndex];

    // Đường dẫn đầy đủ đến file nhạc
    const musicFilePath = path.join(__dirname, '..', '..', selectedSong.file);

    // Kiểm tra file có tồn tại
    if (!fs.existsSync(musicFilePath)) {
      console.error(`File không tồn tại: ${musicFilePath}`);
      return res.status(404).json({ message: 'File nhạc không tồn tại' });
    }

    // Lấy thông tin về file nhạc
    const getMetadata = () => {
      return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(musicFilePath, (err, metadata) => {
          if (err) return reject(err);
          resolve(metadata);
        });
      });
    };

    const metadata = await getMetadata();
    const duration = metadata.format.duration;

    if (isNaN(duration)) {
      return res.status(500).json({ message: 'Không thể lấy thông tin độ dài của file nhạc' });
    }

    // Đảm bảo clip dài 7 giây
    const clipDuration = 7;

    // Tính thời điểm bắt đầu ngẫu nhiên (đảm bảo có đủ 7 giây để cắt)
    const maxStartTime = Math.max(0, duration - clipDuration);
    const startTime = Math.floor(Math.random() * maxStartTime);

    // Tạo tên file clip ngẫu nhiên
    const clipFileName = `clip_${Date.now()}.mp3`;
    const clipFilePath = path.join(clipsDir, clipFileName);

    // Cắt file nhạc sử dụng ffmpeg
    const createClip = () => {
      return new Promise((resolve, reject) => {
        ffmpeg(musicFilePath)
          .setStartTime(startTime)
          .setDuration(clipDuration)
          .audioCodec('libmp3lame')
          .audioQuality(2)
          .output(clipFilePath)
          .on('end', resolve)
          .on('error', reject)
          .run();
      });
    };

    await createClip();

    // Tạo URL cho clip
    const clipUrl = `/assets/clips/${clipFileName}`;

    // Tạo các lựa chọn (1 đúng, 3 sai)
    // Loại bỏ bài hát đã chọn khỏi danh sách để chọn các lựa chọn sai
    const otherSongs = allSongs.filter(song => song._id.toString() !== selectedSong._id.toString());

    // Lấy ngẫu nhiên 3 bài hát khác làm lựa chọn sai
    const wrongOptions = [];
    for (let i = 0; i < 3; i++) {
      const randomWrongIndex = Math.floor(Math.random() * otherSongs.length);
      wrongOptions.push({
        title: otherSongs[randomWrongIndex].title,
        artist: otherSongs[randomWrongIndex].artist
      });
      // Loại bỏ bài hát đã chọn để tránh trùng lặp
      otherSongs.splice(randomWrongIndex, 1);
    }

    // Tạo lựa chọn đúng
    const correctOption = {
      title: selectedSong.title,
      artist: selectedSong.artist
    };

    // Kết hợp các lựa chọn và xáo trộn
    const options = [...wrongOptions, correctOption];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Xóa file clip sau 1 phút
    setTimeout(() => {
      if (fs.existsSync(clipFilePath)) {
        fs.unlinkSync(clipFilePath);
        console.log(`Đã xóa file tạm: ${clipFilePath}`);
      }
    }, 60000); // 60 giây

    // Trả về thông tin cho client
    res.json({
      clip: clipUrl,
      options: options,
      correctAnswer: correctOption
    });

  } catch (error) {
    console.error('Lỗi khi tạo đoạn nhạc ngẫu nhiên:', error);
    res.status(500).json({ message: 'Lỗi khi tạo đoạn nhạc ngẫu nhiên', error: error.message });
  }
};

const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách bài hát', error: error.message });
  }
};

module.exports = { getRandomClip, getAllSongs };
