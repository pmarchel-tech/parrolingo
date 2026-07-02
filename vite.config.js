import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'

const copyMascotPlugin = () => {
  return {
    name: 'copy-mascot',
    buildStart() {
      const srcPath = 'C:/Users/WELCOME/.gemini/antigravity/brain/b10e39dd-ce5f-4d4e-a3d8-f1efcaed14d3/media__1782957017681.png';
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
