import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // Expose the project to the local network
    port: 5173, // The port to use (default is 5173)
  },
  plugins: [react()],
  build: {
    target: 'esnext', // <--- burayı esnext yap
  },

});
