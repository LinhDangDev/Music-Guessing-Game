# Hướng dẫn Deploy Music Guessing Game lên Render

## Chuẩn bị trước khi deploy

1. Đảm bảo code của bạn đã được đẩy lên GitHub
2. Đăng ký tài khoản trên [Render](https://render.com/)
3. Xác nhận bạn có quyền truy cập vào repository GitHub

## Bước 1: Deploy Backend lên Render

1. Đăng nhập vào Render dashboard
2. Click "New" > "Web Service"
3. Kết nối GitHub account (nếu chưa kết nối)
4. Chọn repository chứa Music Guessing Game
5. Cấu hình Web Service:
   - **Name**: `music-guessing-backend`
   - **Environment**: `Node`
   - **Region**: Chọn vùng gần với người dùng của bạn
   - **Branch**: `main` (hoặc branch bạn muốn deploy)
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan Type**: Free (hoặc gói phù hợp với nhu cầu của bạn)

6. Cấu hình Environment Variables (bấm "Advanced" > "Add Environment Variable"):
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret key
   - `NODE_ENV`: `production`

7. Thiết lập Disk Storage:
   - Bấm vào tab "Disks"
   - Click "Add Disk"
   - **Name**: `music-data`
   - **Mount Path**: `/opt/render/project/src/music`
   - **Size**: 1GB (hoặc lớn hơn tùy vào nhu cầu)

8. Click "Create Web Service" để bắt đầu deploy backend

## Bước 2: Upload music files lên Render disk

1. Đợi backend triển khai xong
2. Vào mục "Shell" trong dashboard của backend service
3. Upload nhạc vào thư mục được mount:
   ```bash
   # Kiểm tra thư mục đã được mount
   ls -la /opt/render/project/src/music

   # Tạo thư mục con (nếu cần)
   mkdir -p /opt/render/project/src/music/Youtube
   mkdir -p /opt/render/project/src/music/Soundcloud

   # Từ đây, bạn có thể upload file bằng SFTP hoặc dùng công cụ file manager của Render
   ```

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

## Bước 4: Kiểm tra và kết nối

1. Đợi cả backend và frontend hoàn tất deploy
2. Kiểm tra API backend hoạt động bằng cách truy cập:
   ```
   https://music-guessing-backend.onrender.com/api
   ```
   Bạn sẽ thấy thông báo "API đang hoạt động!"

3. Truy cập frontend site:
   ```
   https://music-guessing-frontend.onrender.com
   ```

4. Kiểm tra xem frontend có kết nối được với backend không:
   - Thử chơi game
   - Kiểm tra các request trong Developer Tools của trình duyệt (tab Network)

## Xử lý sự cố

### Lỗi CORS
Nếu gặp lỗi CORS, hãy kiểm tra:
1. Mở file `backend/index.js`
2. Đảm bảo domain frontend được thêm vào mảng `corsOptions.origin`:
   ```javascript
   const corsOptions = {
     origin: process.env.NODE_ENV === 'production'
       ? ['https://music-guessing-frontend.onrender.com', /\.onrender\.com$/]
       : 'http://localhost:5173',
     // ...
   };
   ```
3. Deploy lại backend sau khi sửa

### Lỗi không tải được nhạc
1. Kiểm tra xem nhạc đã được upload vào disk trên Render chưa
2. Đảm bảo `scanMusicDirectories` chạy đúng khi khởi động server
3. Kiểm tra logs của backend trong Render dashboard

### Lỗi không build được frontend
1. Kiểm tra logs build trong Render dashboard
2. Đảm bảo tất cả dependencies đã được cài đặt đúng
3. Kiểm tra xem file `vite.config.ts` có lỗi gì không

## Cập nhật ứng dụng

### Cập nhật Backend
1. Push code mới lên GitHub
2. Render sẽ tự động deploy lại backend

### Cập nhật Frontend
1. Push code mới lên GitHub
2. Render sẽ tự động deploy lại frontend

## Thiết lập Custom Domain (Tùy chọn)

### Cho Backend
1. Vào dashboard của backend service trong Render
2. Vào tab "Settings" > "Custom Domain"
3. Thêm domain của bạn và làm theo hướng dẫn

### Cho Frontend
1. Vào dashboard của frontend static site trong Render
2. Vào tab "Settings" > "Custom Domain"
3. Thêm domain của bạn và làm theo hướng dẫn

Lưu ý: Nếu sử dụng custom domain, đừng quên cập nhật CORS settings trong backend và environment variables trong frontend để khớp với domain mới.
