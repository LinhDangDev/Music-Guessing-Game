const mongoose = require('mongoose');
const Song = require('../models/Song');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { setTimeout } = require('timers/promises');

// Danh sách các bài hát từ Google Drive
const googleDriveSongs = [
  {
    title: "Mưa Hồng",
    artist: "Hà Lê x Màu Nước Band",
    source: "Youtube",
    url: "https://drive.google.com/file/d/1Xy7uoTH6-LIRHQtVk7E5_RTHs_eaTJP2/view?usp=sharing"
  },
  {
    title: "Ở Trọ",
    artist: "Hà Lê",
    source: "Youtube",
    url: "https://drive.google.com/file/d/1HYdyBbRkPK2PQtaWW5G3D5-1YXzQPsG-/view?usp=sharing"
  },
  {
    title: "Say You Do",
    artist: "Tiên Tiên",
    source: "Soundcloud",
    url: "https://drive.google.com/file/d/1fzb9SCIjO2g54NsQeYEi7G9X-e6phCrP/view?usp=sharing"
  },
  {
    title: "Một Đêm Say",
    artist: "Thịnh Suy",
    source: "Soundcloud",
    url: "https://drive.google.com/file/d/1rtrKnfVtXP85mJXKPxwEy9MdPf26ELlU/view?usp=sharing"
  }
];

// Hàm chuyển đổi Google Drive view URL thành direct download URL
function getDirectDownloadUrlFromGoogleDrive(viewUrl) {
  if (!viewUrl) return null;

  // Lấy file ID từ URL
  let fileId = null;
  const match = viewUrl.match(/\/d\/([^/]+)/);
  if (match && match[1]) {
    fileId = match[1];
  } else {
    return null;
  }

  // Tạo URL trực tiếp để download
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

// Hàm quét và thêm bài hát
const scanMusicDirectories = async () => {
  try {
    console.log('Đang quét nhạc...');

    // Chuẩn bị thêm bài hát từ Google Drive
    let songCount = 0;

    // Set HAS_DISK_STORAGE to false khi deploy trên Render
    process.env.HAS_DISK_STORAGE = 'false';
    console.log(`HAS_DISK_STORAGE = ${process.env.HAS_DISK_STORAGE}`);

    // Xóa tất cả bài hát trong database để làm mới
    console.log('Xóa tất cả bài hát cũ để cập nhật...');
    await Song.deleteMany({});

    console.log('Đang thêm bài hát từ Google Drive...');

    // Thêm từng bài hát từ Google Drive vào database
    for (const song of googleDriveSongs) {
      try {
        // Chuyển đổi URL Google Drive thành direct URL
        const directUrl = getDirectDownloadUrlFromGoogleDrive(song.url);

        if (!directUrl) {
          console.log(`Không thể tạo direct URL cho bài hát: ${song.title}`);
          continue;
        }

        // Tạo bài hát mới trong database
        const newSong = new Song({
          title: song.title,
          artist: song.artist,
          source: song.source,
          filePath: directUrl,
          clipPath: directUrl, // Sử dụng cùng URL cho cả clip và file gốc
          externalSource: true
        });

        await newSong.save();
        console.log(`Đã thêm bài hát: ${song.title}`);
        songCount++;

        // Delay nhỏ để tránh quá tải database
        await setTimeout(100);
      } catch (err) {
        console.error(`Lỗi khi thêm bài hát ${song.title}:`, err);
      }
    }

    console.log(`Quá trình thêm nhạc hoàn tất. Đã thêm ${songCount} bài hát mới.`);

    // Kiểm tra số bài hát đã thêm
    const totalSongs = await Song.countDocuments();
    console.log(`Tổng số bài hát trong database: ${totalSongs}`);

  } catch (error) {
    console.error('Lỗi khi quét thư mục nhạc:', error);
  }
};

/**
 * Escape các ký tự đặc biệt trong regex
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = { scanMusicDirectories };
