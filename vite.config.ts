import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    "import.meta.env.VITE_DASHSCOPE_API_KEY": JSON.stringify(
      process.env.DASHSCOPE_API_KEY || "default-api-key"
    ),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // 将 @ 指向 src 目录
    }
  }
});
