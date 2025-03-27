import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Cấu hình hot reload
    hmr: true,
    // Tự động mở trình duyệt khi chạy
    open: true,
    // Cấu hình port
    port: 5173,
    // Thêm hot reload cho React
    watch: {
      usePolling: true,
    },
  },
})
