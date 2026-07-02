const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
if (!fs.existsSync(chromePath)) {
  console.error("Error: Chrome 64-bit not found at standard path:", chromePath);
  process.exit(1);
}

const outputPath = "C:\\Users\\WELCOME\\.gemini\\antigravity\\brain\\d2e2037d-49c8-4cf9-9dff-871457b77ef3\\results_screen.png";

console.log("Launching headless Chrome to capture http://localhost:3000...");
const cmd = `"${chromePath}" --headless --disable-gpu --window-size=412,892 --screenshot="${outputPath}" http://localhost:3000`;

exec(cmd, (err, stdout, stderr) => {
  if (err) {
    console.error("Failed to execute Chrome:", err);
    process.exit(1);
  }
  console.log("Success! Screenshot saved to:", outputPath);
});
