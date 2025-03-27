const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const songRoutes = require('./routes/songRoutes');
const userRoutes = require('./routes/userRoutes');
const { scanMusicDirectories } = require('./utils/musicScanner');

const app = express();
const PORT = process.env.PORT || 5000;

// Đặt biến môi trường HAS_DISK_STORAGE
// Trên Render, đặt giá trị là 'false' nếu không sử dụng disk storage
process.env.HAS_DISK_STORAGE = process.env.HAS_DISK_STORAGE || 'false';

// Tạo thư mục assets/clips nếu chưa tồn tại
const clipsDir = path.join(__dirname, 'assets', 'clips');
if (!fs.existsSync(clipsDir)) {
  fs.mkdirSync(clipsDir, { recursive: true });
  console.log('Đã tạo thư mục clips');
}

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Atlas connection successful');
    // Quét thư mục nhạc khi khởi động
    scanMusicDirectories();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    if (process.env.MONGODB_URI.includes('<db_username>') ||
        process.env.MONGODB_URI.includes('<db_password>')) {
      console.error('ERROR: You need to replace <db_username> and <db_password> in your .env file with your actual MongoDB Atlas credentials');
    }
  });

// CORS Configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = [
      'https://music-guessing-frontend.onrender.com',
      'https://raw.githubusercontent.com',
      'https://github.com',
      'https://linhangdev.software'
    ];

    // Allow all origins in development and specified origins in production
    if (!origin || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else if (allowedOrigins.some(allowed => origin.includes(allowed))) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(null, true); // Still allow all origins for now to debug issues
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Routes
app.use('/api/songs', songRoutes);
app.use('/api/users', userRoutes);

// Phục vụ file tĩnh cho clips
app.use('/assets/clips', express.static(path.join(__dirname, 'assets', 'clips')));

// Route test API
app.get('/api', (req, res) => {
  res.json({
    message: 'API đang hoạt động!',
    hasDiskStorage: process.env.HAS_DISK_STORAGE === 'true',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  console.log(`Disk Storage: ${process.env.HAS_DISK_STORAGE === 'true' ? 'Được kích hoạt' : 'Không được kích hoạt'}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
