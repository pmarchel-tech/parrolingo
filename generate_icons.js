const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Create proper app icon SVGs using the existing logo_kakatua.png
// These SVGs will be referenced by manifest.json and index.html

const createAppIconSVG = (size) => {
  const radius = Math.round(size * 0.225); // iOS-style corner radius
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <clipPath id="clip">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/>
    </clipPath>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#1a4db8"/>
  <image 
    href="logo_kakatua.png"
    x="${Math.round(size * 0.0)}"
    y="${Math.round(size * 0.08)}"
    width="${size}"
    height="${Math.round(size * 0.92)}"
    preserveAspectRatio="xMidYMax meet"
    clip-path="url(#clip)"
  />
</svg>`;
};

// Generate SVG icons at all needed sizes
const iconDefs = [
  { file: 'icon-512x512.svg', size: 512 },
  { file: 'icon-192x192.svg', size: 192 },
  { file: 'icon-180x180.svg', size: 180 },
  { file: 'icon-167x167.svg', size: 167 },
  { file: 'icon-152x152.svg', size: 152 },
  { file: 'icon-144x144.svg', size: 144 },
];

for (const { file, size } of iconDefs) {
  const outPath = path.join(publicDir, file);
  fs.writeFileSync(outPath, createAppIconSVG(size));
  console.log(`✅ Created: ${file} (${size}x${size})`);
}

// Create a special maskable icon (full bleed, no padding for PWA adaptive icons)
const maskableSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1a4db8"/>
  <image 
    href="logo_kakatua.png"
    x="0"
    y="50"
    width="512"
    height="462"
    preserveAspectRatio="xMidYMax meet"
  />
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSVG);
console.log('✅ Created: icon-maskable.svg (512x512, no clip for Android adaptive)');

console.log('\n🎉 All icon SVGs generated!');
console.log('\nNext: update manifest.json and index.html to use these icons.');
