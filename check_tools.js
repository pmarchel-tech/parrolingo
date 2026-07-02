const fs = require('fs');
const path = require('path');

// We'll use the existing logo_kakatua.png as our app icon source
// and create a Node.js script to generate multiple sizes using canvas or sharp

// First, let's check if sharp is available
try {
  require('sharp');
  console.log('sharp is available');
} catch(e) {
  console.log('sharp not available:', e.message);
}

// Check if canvas is available  
try {
  const { createCanvas } = require('canvas');
  console.log('canvas is available');
} catch(e) {
  console.log('canvas not available:', e.message);
}

// List public folder
const publicDir = path.join(__dirname, 'public');
const files = fs.readdirSync(publicDir);
console.log('Public folder files:', files);
