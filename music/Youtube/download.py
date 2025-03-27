import yt_dlp
import os

# Cấu hình options cho yt-dlp
ydl_opts = {
    'format': 'bestaudio/best',
    'outtmpl': '%(title)s.%(ext)s',  # Tên file = tên bài hát
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',     # Chuyển đổi sang MP3
        'preferredquality': '320',    # Chất lượng audio (320kbps - cao nhất)
    }],
    'ignoreerrors': True,             # Bỏ qua lỗi nếu có
    'verbose': True,                  # Hiển thị chi tiết quá trình tải
}

# URL playlist YouTube
url = 'https://www.youtube.com/playlist?list=PLr1-EhgV88FW2V3LcaQWQ2YH9pow-Gpoz'

# Thực hiện tải
print("Đang tải nhạc từ playlist YouTube...")
print("Các file nhạc sẽ được lưu dưới dạng MP3 với chất lượng cao nhất (320kbps)")
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    ydl.download([url])

print("Tải xuống hoàn tất!")
