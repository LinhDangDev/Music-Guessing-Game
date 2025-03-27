const mongoose = require('mongoose');
const Song = require('../models/Song');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { setTimeout } = require('timers/promises');

// GitHub repository information
const GITHUB_REPO_OWNER = 'LinhDangDev';
const GITHUB_REPO_NAME = 'Music-Guessing-Game';
const GITHUB_BRANCH = 'main';
const GITHUB_RAW_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}`;

// Danh sách các bài hát từ GitHub repository
const githubSongs = [
  // Youtube songs
  {
    title: "Mưa Hồng",
    artist: "Hà Lê x Màu Nước Band",
    source: "Youtube",
    url: `${GITHUB_RAW_BASE_URL}/music/Youtube/Hà Lê x Màu Nước Band - Mưa Hồng - (Live at HRC 180720).mp3`
  },
  {
    title: "Ở Trọ",
    artist: "Hà Lê",
    source: "Youtube",
    url: `${GITHUB_RAW_BASE_URL}/music/Youtube/Ở Trọ (Full Tracks Playlist Video) - Hà Lê.mp3`
  },
  {
    title: "Biển Nhớ",
    artist: "Hà Lê",
    source: "Youtube",
    url: `${GITHUB_RAW_BASE_URL}/music/Youtube/Hà Lê ｜ Official Audio - Biển Nhớ (Remake).mp3`
  },
  {
    title: "Diễm Xưa",
    artist: "Hà Lê",
    source: "Youtube",
    url: `${GITHUB_RAW_BASE_URL}/music/Youtube/HÀ LÊ (#DX) ｜ OFFICIAL LYRICS VIDEO - DIỄM XƯA.mp3`
  },

  // Soundcloud songs
  {
    title: "Say You Do",
    artist: "Tiên Tiên",
    source: "Soundcloud",
    url: `${GITHUB_RAW_BASE_URL}/music/Soundcloud/Tiên Tiên - Say You Do (DSmall Tropical Mix).mp3`
  },
  {
    title: "Một Đêm Say",
    artist: "Thịnh Suy",
    source: "Soundcloud",
    url: `${GITHUB_RAW_BASE_URL}/music/Soundcloud/Thịnh Suy - Một Đêm Say 2019 - TiLo Ft Chivas Nhí Ft Long Nhật Remix.mp3`
  },
  {
    title: "Chợ Tình",
    artist: "PB Nation",
    source: "Soundcloud",
    url: `${GITHUB_RAW_BASE_URL}/music/Soundcloud/CHỢ TÌNH (Love Market) _ PB Nation (World Music special edition).mp3`
  },
  {
    title: "Là Hà Nội Của Tôi",
    artist: "PB Nation",
    source: "Soundcloud",
    url: `${GITHUB_RAW_BASE_URL}/music/Soundcloud/LÀ HÀ NỘI CỦA TÔI _ PB Nation.mp3`
  }
];

// Encode URL to handle spaces and special characters
function encodeURL(url) {
  // Split the URL by path segments
  const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
  const fileName = url.substring(url.lastIndexOf('/') + 1);

  // Encode only the filename portion
  const encodedFileName = encodeURIComponent(fileName);

  return baseUrl + encodedFileName;
}

// Hàm quét và thêm bài hát
const scanMusicDirectories = async () => {
  try {
    console.log('Bắt đầu thêm nhạc từ GitHub repository...');

    // Chuẩn bị thêm bài hát
    let songCount = 0;

    // Set HAS_DISK_STORAGE to false khi deploy trên Render
    process.env.HAS_DISK_STORAGE = 'false';
    console.log(`HAS_DISK_STORAGE = ${process.env.HAS_DISK_STORAGE}`);

    // Xóa tất cả bài hát trong database để làm mới
    console.log('Xóa tất cả bài hát cũ để cập nhật...');
    await Song.deleteMany({});

    console.log('Đang thêm bài hát từ GitHub...');

    // Thêm từng bài hát từ GitHub vào database
    for (const song of githubSongs) {
      try {
        // Encode the URL to handle spaces and special characters
        const encodedUrl = encodeURL(song.url);
        console.log(`Bài hát: ${song.title}`);
        console.log(`URL gốc: ${song.url}`);
        console.log(`URL đã encode: ${encodedUrl}`);

        // Tạo bài hát mới trong database
        const newSong = new Song({
          title: song.title,
          artist: song.artist,
          source: song.source,
          filePath: encodedUrl,
          clipPath: encodedUrl, // Sử dụng cùng URL cho cả clip và file gốc
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
    console.error('Lỗi khi thêm nhạc từ GitHub:', error);
  }
};

/**
 * Escape các ký tự đặc biệt trong regex
 */
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = { scanMusicDirectories };
