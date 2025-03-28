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

// Mảng bao gồm tất cả bài hát từ kho YouTube
const youtubeSongs = [
  "Amy Shark  I Said Hi  Ha Le Cover featuring Tung Tic & FatB",
  "BIỂN NHỚ (REMAKE) #BN - HÀ LÊ ｜ OFFICIAL TEASER",
  "Biển Nhớ (Remake) - Hà Lê ｜ Official Audio",
  "Chợ Tình - (Live at HRC 180720) - Hà Lê x Màu Nước Band",
  "DIỄM XƯA -  HÀ LÊ (#DX) ｜ OFFICIAL LYRICS VIDEO",
  "DIỄM XƯA - HÀ LÊ ｜ OFFICIAL MUSIC VIDEO",
  "Hà Lê - Bước Cùng Nhau (Official Audio)",
  "Hà Lê - Đơn Sơ (Official Audio)",
  "Hà Lê - Em Nhìn Xem (Official Audio)",
  "Hà Lê - I Will Call It Love (Official Music Video)",
  "Hà Lê - KHÓI (Official Music Video) ft. Khắc Hưng",
  "Hà Lê - Món Quà (Official Music Video)",
  "Hà Lê - Nằm Mơ Giữa Ban Ngày (Official Audio)",
  "Hà Lê - Như Ngày Bé (Official Audio) ft. Đỗ Tố Hoa",
  "Hà Lê - Ở Trọ (Full Tracks Playlist Video)",
  "Hà Lê - Quay Lại Giường Đi Em (Official Music Video)",
  "Hà Lê - Ta Đâu Một Mình (Official Audio) ft. Dương Trần Nghĩa",
  "Hà Lê x Màu Nước Band - Ở Trọ Live At HRC (18.07.2020)",
  "Hà Lê x Màu Nước Band ｜ Live At Ấy Lounge (30.06.2020)",
  "Hạ Trắng - (Live at HRC 180720) - Hà Lê x Màu Nước Band",
  "Hạ Trắng - Hà Lê (Gameshow Sao Đại Chiến) ｜ Fan-made Lyrics Video",
  "Hạ Trắng - Hà Lê ｜ Sao Đại Chiến Tập 1",
  "John K ＂parachute＂ - Hà Lê Cover (One-shot video)",
  "LAST CHRISTMAS (COVER) - HÀ LÊ x TÙNG TIC ｜ OFFICIAL MV",
  "Là Hà Nội Của Tôi (Live at HRC 180720) - Hà Lê x Màu Nước Band",
  "Mưa Hồng (Live at HRC 180720) - Hà Lê x Màu Nước Band",
  "Nhớ Mùa Thu Hà Nội (Live at HRC 180720) - Hà Lê x Màu Nước Band",
  "Nhớ Mùa Thu Hà Nội #NMTHN (Remake) - Hà Lê ｜ Official Audio",
  "Ở Trọ - Hà Lê (Official Music Video)",
  "Ở Trọ (Live at HRC 180720) - Hà Lê x Màu Nước Band"
];

// Mảng bao gồm tất cả bài hát từ kho Soundcloud
const soundcloudSongs = [
  "'Quốc ca SACRED' demo  -)",
  "[Demo] HOẠ _ PB NATION ft. VEMT",
  "[Demo] Nhớ chứ ...! _ HA LE",
  "[Guvera Soul Acoustics] TĂNG GA _ PB Nation",
  "[MASH UP] HÈ THU EM ĐỂ TÌM YÊU ĐÔNG _ PB NATION",
  "[Official Audio] Hà Nội mùa vắng những cơn mưa (Remix) _ PB Nation",
  "[Official Audio] HOẠ _ PB NATION",
  "[Official Audio] HOẠ (Extended _ Full version) _ PB Nation feat. VemT",
  "[Official Audio] TĂNG GA _ PB NATION",
  "[PB Nation's mastered version] O.M.E.M _ PB Nation ft. Mark Bonafide",
  "[Remake-] THÀNH PHỐ BUỒN _ Tác giả - LAM PHƯƠNG _ HÀ LÊ X HOÀI LÂM X NSY NGUYỄN DÂN X NEMO#",
  "[TEASER] SAD CITY _ HÀ LÊ ft. NEMO#",
  "BECAUSE YOU LOVED ME _ Ha Le [Originally performed by - Celine Dion]",
  "CHỊ TÔI NHỚ MÙA THU BUỒN HÀ NỘI ... _ PB Nation",
  "CHỢ TÌNH (Love Market) _ PB Nation (World Music special edition)",
  "De Em Roi Xa - Bao Kun feat. Ha Le",
  "ĐÔNG CUỐI - Hà Lê ft. Phúc Bồ ft. Kay Trần",
  "Hoa Thơm Bướm Lượn",
  "I'M NOT THE ONLY ONE (Sam Smith) _ HA LE (Cover)",
  "LÀ HÀ NỘI CỦA TÔI _ PB Nation",
  "MỌI SỰ LÀ VÌ EM _ Hoàng Tôn x Bảo Kun x Hà Lê",
  "Nằm Mơ Giữa Ban Ngày - Nguyễn Duy Anh",
  "OVERMAX _ Ha Le x Phuc Bo x Ellian x AnTei x DJ VemT",
  "Phút Giáng Sinh  - HÀ LÊ -PV.NAMHUONG -J.CHUNG - IRONMAN",
  "PHÚT GIÁNG SINH - PHUC BO FT. HA LE FT. PHU VAN NAM HUONG FT. JC HUNG",
  "Quay Lai Giuong Cover",
  "SPACESPEAKERS & FRIENDS - ME YEU",
  "TAY ANH XA DẦN BẢN TÌNH CA PHƯỢNG HỒNG MASHUP _ PB NATION",
  "Thịnh Suy - Một Đêm Say 2019 - TiLo Ft Chivas Nhí Ft Long Nhật Remix",
  "Tiên Tiên - Say You Do (DSmall Tropical Mix)",
  "Umbala - Hoang Ton, Andree Right Hand, Baokun"
];

// Hàm tạo đối tượng bài hát từ tên file
function createSongFromFilename(filename, source) {
  // Loại bỏ phần mở rộng .mp3
  const title = filename.replace(/\.mp3$/, '');

  // Trích xuất artist nếu có dấu - hoặc dấu |
  let artist = 'Unknown';

  if (title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
  } else if (title.includes('｜')) {
    const parts = title.split('｜');
    artist = parts[0].trim();
  } else if (title.includes('|')) {
    const parts = title.split('|');
    artist = parts[0].trim();
  }

  return {
    title,
    artist,
    source,
    url: `${GITHUB_RAW_BASE_URL}/music/${source}/${filename}.mp3`
  };
}

// Encode URL to handle spaces and special characters
function encodeURL(url) {
  // Split the URL by path segments
  const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
  const fileName = url.substring(url.lastIndexOf('/') + 1);

  // Encode only the filename portion
  const encodedFileName = encodeURIComponent(fileName);

  return baseUrl + encodedFileName;
}

// Hàm quét và thêm tất cả bài hát từ GitHub
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

    console.log('Đang thêm bài hát YouTube từ GitHub...');

    // Thêm bài hát YouTube
    for (const songName of youtubeSongs) {
      try {
        const songObj = createSongFromFilename(songName, 'Youtube');
        const encodedUrl = encodeURL(songObj.url);

        console.log(`Thêm bài hát YouTube: ${songObj.title}`);

                const newSong = new Song({
          title: songObj.title,
          artist: songObj.artist,
          source: songObj.source,
          filePath: encodedUrl,
          clipPath: encodedUrl,
          externalSource: true
                });

                await newSong.save();
                songCount++;

        // Delay nhỏ để tránh quá tải database
        await setTimeout(50);
      } catch (err) {
        console.error(`Lỗi khi thêm bài hát YouTube: ${songName}`, err);
      }
    }

    console.log('Đang thêm bài hát Soundcloud từ GitHub...');

    // Thêm bài hát Soundcloud
    for (const songName of soundcloudSongs) {
      try {
        const songObj = createSongFromFilename(songName, 'Soundcloud');
        const encodedUrl = encodeURL(songObj.url);

        console.log(`Thêm bài hát Soundcloud: ${songObj.title}`);

        const newSong = new Song({
          title: songObj.title,
          artist: songObj.artist,
          source: songObj.source,
          filePath: encodedUrl,
          clipPath: encodedUrl,
          externalSource: true
          });

          await newSong.save();
          songCount++;

        // Delay nhỏ để tránh quá tải database
        await setTimeout(50);
      } catch (err) {
        console.error(`Lỗi khi thêm bài hát Soundcloud: ${songName}`, err);
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
