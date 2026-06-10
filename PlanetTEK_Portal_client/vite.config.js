import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  plugins: [react()],
  preview: {
    host: '0.0.0.0',        // Dış bağlantılara izin ver
    port: 5174,             // Portu 5174'e sabitle ki Nginx ile eşleşsin
    allowedHosts: ['planettekportal.biz', 'www.planettekportal.biz'], // www'yu ekledik
  },
});