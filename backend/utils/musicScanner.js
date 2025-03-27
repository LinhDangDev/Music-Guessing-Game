const fs = require('fs');
const path = require('path');
const Song = require('../models/Song');

/**
 * Quét các thư mục nhạc và thêm vào cơ sở dữ liệu
 */
const scanMusicDirectories = async () => {
  console.log('Bắt đầu quét thư mục nhạc...');

  // Thư mục chứa file nhạc
  const musicDirs = [
    path.join(__dirname, '../../music/Youtube'),
    path.join(__dirname, '../../music/Soundcloud')
  ];

  let totalAdded = 0;
  let totalExisting = 0;
  let totalErrors = 0;

  // Xử lý từng thư mục
  for (const musicDir of musicDirs) {
    // Kiểm tra thư mục có tồn tại
    if (!fs.existsSync(musicDir)) {
      console.error(`Thư mục không tồn tại: ${musicDir}`);
      continue;
    }

    try {
      const dirName = path.basename(musicDir);
      console.log(`Đang quét thư mục: ${dirName}`);

      // Đọc tất cả file trong thư mục
      const files = fs.readdirSync(musicDir);

      // Lọc chỉ lấy file mp3
      const mp3Files = files.filter(file => file.toLowerCase().endsWith('.mp3'));

      console.log(`Tìm thấy ${mp3Files.length} file mp3 trong thư mục ${dirName}`);

      // Xử lý từng file mp3
      for (const file of mp3Files) {
        try {
          // Tạo đường dẫn tương đối so với thư mục gốc của project
          const relativePath = path.join('music', dirName, file);

          // Parse thông tin từ tên file
          let title, artist;

          // Format tên file khác nhau tùy thuộc vào nguồn (Youtube/Soundcloud)
          if (dirName === 'Youtube') {
            // Youtube format: Artist - Title.mp3
            const match = file.match(/^(.+) - (.+)\.mp3$/);
            if (match) {
              artist = match[1].trim();
              title = match[2].trim();
            } else {
              title = path.basename(file, '.mp3');
              artist = 'Unknown';
            }
          } else if (dirName === 'Soundcloud') {
            // Soundcloud format: Title - Artist.mp3
            const match = file.match(/^(.+) - (.+)\.mp3$/);
            if (match) {
              title = match[1].trim();
              artist = match[2].trim();
            } else {
              title = path.basename(file, '.mp3');
              artist = 'Unknown';
            }
          }

          // Kiểm tra xem bài hát đã tồn tại trong database chưa
          const existingSong = await Song.findOne({
            title: new RegExp(escapeRegex(title), 'i'),
            artist: new RegExp(escapeRegex(artist), 'i')
          });

          if (existingSong) {
            console.log(`Bài hát đã tồn tại: ${title} - ${artist}`);
            totalExisting++;
            continue;
          }

          // Tạo bài hát mới
          const newSong = new Song({
            title: title,
            artist: artist,
            file: relativePath
          });

          // Lưu vào database
          await newSong.save();
          console.log(`Đã thêm bài hát: ${title} - ${artist}`);
          totalAdded++;

        } catch (err) {
          console.error(`Lỗi khi xử lý file ${file}:`, err);
          totalErrors++;
        }
      }

    } catch (err) {
      console.error(`Lỗi khi quét thư mục ${musicDir}:`, err);
      totalErrors++;
    }
  }

  console.log('=== Kết quả quét ===');
  console.log(`Tổng số bài hát đã thêm: ${totalAdded}`);
  console.log(`Tổng số bài hát đã tồn tại: ${totalExisting}`);
  console.log(`Tổng số lỗi: ${totalErrors}`);
  console.log('====================');
};

/**
 * Escape các ký tự đặc biệt trong regex
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = { scanMusicDirectories };
