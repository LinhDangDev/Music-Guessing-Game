# Hướng dẫn Deploy Music Guessing Game không cần Disk Storage

## Giới thiệu
Tài liệu này hướng dẫn cách deploy ứng dụng Music Guessing Game trên Render mà không cần sử dụng Disk Storage (tiết kiệm chi phí khi dùng gói miễn phí).

## Cách triển khai

Thay vì lưu trữ nhạc trực tiếp trên Render, chúng ta sẽ sử dụng danh sách nhạc từ URLs bên ngoài. Đã cấu hình code để chấp nhận cả 2 cách.

## Bước 1: Chuẩn bị nhạc

1. Upload các file nhạc lên một dịch vụ lưu trữ bên ngoài như:
   - **Google Drive**: Tạo các public links
   - **Dropbox**: Chia sẻ các file có public links
   - **Firebase Storage**: Tạo một bucket và upload files
   - **Cloudinary**: Upload files âm thanh lên dịch vụ này

2. Sau khi upload, lấy public URL cho mỗi bài hát

3. Cập nhật danh sách `externalSongs` trong file `backend/utils/musicScanner.js` với URLs thực tế của bạn:
   ```javascript
   const externalSongs = [
     {
       title: "Shape of You",
       artist: "Ed Sheeran",
       source: "Youtube",
       url: "https://your-storage.com/music/shape-of-you.mp3", // URL thực tế
       clipUrl: "https://your-storage.com/clips/shape-of-you-clip.mp3" // URL thực tế (có thể để trống)
     },
     // Thêm các bài hát khác vào đây
   ];
   ```

## Bước 2: Deploy Backend lên Render

1. Đăng nhập vào Render dashboard
2. Click "New" > "Web Service"
3. Kết nối GitHub account
4. Chọn repository chứa Music Guessing Game
5. Cấu hình Web Service:
   - **Name**: `music-guessing-backend`
   - **Environment**: `Node`
   - **Branch**: `main` (hoặc branch bạn muốn deploy)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan Type**: Free

6. Cấu hình Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret key
   - `NODE_ENV`: `production`
   - `HAS_DISK_STORAGE`: `false` (quan trọng!)

7. Click "Create Web Service" để bắt đầu deploy backend

## Bước 3: Deploy Frontend lên Render

1. Quay lại Render dashboard
2. Click "New" > "Static Site"
3. Chọn cùng repository GitHub
4. Cấu hình Static Site:
   - **Name**: `music-guessing-frontend`
   - **Root Directory**: `frontend/duanon`
   - **Build Command**: `npm install && npm run build:prod`
   - **Publish Directory**: `dist`
   - **Branch**: `main` (hoặc branch bạn muốn deploy)

5. Cấu hình Environment Variables:
   - `VITE_API_BASE_URL`: URL backend của bạn, thường có dạng `https://music-guessing-backend.onrender.com/api`
   - `VITE_CLIPS_URL`: URL clips, thường có dạng `https://music-guessing-backend.onrender.com/assets/clips`

6. Click "Create Static Site" để bắt đầu deploy frontend

## Bước 4: Kiểm tra API

1. Truy cập API endpoint của backend:
   ```
   https://music-guessing-backend.onrender.com/api
   ```

2. Bạn sẽ thấy thông tin:
   ```json
   {
     "message": "API đang hoạt động!",
     "hasDiskStorage": false,
     "environment": "production"
   }
   ```

3. Kiểm tra endpoint lấy danh sách bài hát:
   ```
   https://music-guessing-backend.onrender.com/api/songs
   ```

## Xử lý sự cố

### Nếu không thấy bài hát nào
1. Kiểm tra `musicScanner.js` - đảm bảo `externalSongs` đã được cập nhật với URLs hợp lệ
2. Kiểm tra logs của backend trong Render dashboard để xem lỗi
3. Thử truy cập trực tiếp URLs nhạc để đảm bảo chúng hoạt động

### Nếu bài hát không phát
1. Kiểm tra URLs của bài hát có khả năng truy cập công khai
2. Đảm bảo định dạng file là MP3 hoặc được hỗ trợ
3. Kiểm tra CORS headers của dịch vụ lưu trữ của bạn

### Nếu gặp lỗi CORS
1. Thêm tên miền (domain) của dịch vụ lưu trữ nhạc vào `corsOptions` trong `backend/index.js`
2. Hoặc chọn dịch vụ lưu trữ hỗ trợ CORS

## Lưu ý về hiệu suất

Khi sử dụng URLs bên ngoài:
1. Tốc độ tải nhạc phụ thuộc vào dịch vụ lưu trữ bên ngoài
2. Tránh sử dụng các dịch vụ có giới hạn băng thông nghiêm ngặt
3. Đảm bảo dịch vụ lưu trữ của bạn đáng tin cậy

## Cải tiến sau này

1. Thêm tính năng tạo clips tự động
2. Tích hợp với API nhạc như Spotify hoặc YouTube
3. Cache bài hát phổ biến để cải thiện hiệu suất
