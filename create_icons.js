const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

// Create the app icon as an SVG that embeds the logo_kakatua.png
// with the blue rounded square background — matching the provided image
const sizes = [
  { name: 'icon-192x192.svg', size: 192 },
  { name: 'icon-512x512.svg', size: 512 },
];

const createIconSVG = (size) => {
  const radius = size * 0.22; // ~22% corner radius like iOS icons
  const bgColor = '#1a4db8'; // Deep blue matching the provided icon
  
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <clipPath id="rounded">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}"/>
    </clipPath>
  </defs>
  <!-- Blue background -->
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${bgColor}"/>
  <!-- Parrot mascot centered and scaled to fill bottom 85% -->
  <image 
    href="logo_kakatua.png" 
    x="${size * 0.02}" 
    y="${size * 0.15}" 
    width="${size * 0.96}" 
    height="${size * 0.85}"
    preserveAspectRatio="xMidYMax meet"
    clip-path="url(#rounded)"
  />
</svg>`;
};

for (const { name, size } of sizes) {
  const svgContent = createIconSVG(size);
  fs.writeFileSync(path.join(publicDir, name), svgContent);
  console.log(`✅ Created: ${name}`);
}

// Also create the PWA manifest-ready icon references
console.log('\nDone! Icon SVGs created.');
