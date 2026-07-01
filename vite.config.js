import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const copyMascotPlugin = () => {
  return {
    name: 'copy-mascot',
    buildStart() {
      const srcPath = 'C:/Users/WELCOME/.gemini/antigravity/brain/d2e2037d-49c8-4cf9-9dff-871457b77ef3/mascot_cheering_1782818311523.png';
      const destPath = './public/mascot_cheering.png';
      try {
        if (fs.existsSync(srcPath)) {
          fs.copyFileSync(srcPath, destPath);
          console.log('--- MASCOT COPIED SUCCESSFULLY DURING BUILD START ---');
        }
      } catch (err) {
        console.error('Failed to copy mascot during build:', err);
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyMascotPlugin()],
  server: {
    port: 3000,
    host: true
  }
})
