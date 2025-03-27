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

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/songs', songRoutes);
app.use('/api/users', userRoutes);

// Phục vụ file tĩnh cho clips
app.use('/assets/clips', express.static(path.join(__dirname, 'assets', 'clips')));

// Route test API
app.get('/api', (req, res) => {
  res.json({ message: 'API đang hoạt động!' });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
