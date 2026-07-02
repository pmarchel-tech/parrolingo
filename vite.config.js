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
        
      } catch (err) {}
      
      // Read PNG dimensions for diagnostics
      const brainDir = 'C:/Users/WELCOME/.gemini/antigravity/brain/b10e39dd-ce5f-4d4e-a3d8-f1efcaed14d3';
      try {
        const files = fs.readdirSync(brainDir).filter(f => f.startsWith('media__') && f.endsWith('.png'));
        console.log("DIAGNOSTIC PNG DIMENSIONS:");
        files.forEach(f => {
          const buf = fs.readFileSync(brainDir + '/' + f);
          // Check PNG signature
          if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) {
            const width = buf.readInt32BE(16);
            const height = buf.readInt32BE(20);
            console.log(`- ${f}: ${width} x ${height} (Size: ${Math.round(buf.length/1024)} KB)`);
          } else {
            console.log(`- ${f}: Not a valid PNG (Size: ${Math.round(buf.length/1024)} KB)`);
          }
        });
      } catch (e) {
        console.error("Failed to read PNG dimensions:", e);
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
