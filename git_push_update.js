const fs = require('fs');
const { execSync } = require('child_process');

const projectPath = 'c:/MARCHEL FILES/ANTIGRAVITY/PARROLINGO';
const pkgPath = 'c:/MARCHEL FILES/ANTIGRAVITY/PARROLINGO/package.json';

console.log("=== START SELF-HEALING GIT PUSH ===");

try {
  // 1. Read package.json
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // 2. Restore standard scripts
  pkg.scripts.build = "vite build";
  pkg.scripts.preview = "vite preview";

  // 3. Write standard package.json back to disk
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
  console.log("✓ Restored standard package.json scripts on disk.");

  // 4. Delete the temporary helper scripts so they don't clutter the workspace
  const tempFiles = [
    'git_push_update.js',
    'C:/Users/WELCOME/.gemini/antigravity/brain/d2e2037d-49c8-4cf9-9dff-871457b77ef3/git_fresh_init.js',
    'C:/Users/WELCOME/.gemini/antigravity/brain/d2e2037d-49c8-4cf9-9dff-871457b77ef3/git_sync.js',
    'C:/Users/WELCOME/.gemini/antigravity/brain/d2e2037d-49c8-4cf9-9dff-871457b77ef3/git_clean.js',
    'C:/Users/WELCOME/.gemini/antigravity/brain/d2e2037d-49c8-4cf9-9dff-871457b77ef3/check_confetti.js',
    'C:/Users/WELCOME/.gemini/antigravity/brain/d2e2037d-49c8-4cf9-9dff-871457b77ef3/check_yama.js',
    'C:/Users/WELCOME/.gemini/antigravity/brain/d2e2037d-49c8-4cf9-9dff-871457b77ef3/find_all_hiragana.js'
  ];

  tempFiles.forEach(file => {
    try {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`✓ Cleaned up temporary file: ${path.basename(file)}`);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  // 5. Stage, commit, and push
  console.log("Running git operations...");
  execSync('git add package.json', { cwd: projectPath });
  
  // Try staging gitignore if not tracked
  try {
    execSync('git add .gitignore', { cwd: projectPath });
  } catch (e) {}

  execSync('git commit -m "chore: restore build scripts and clean workspace for Vercel deployment"', { cwd: projectPath });
  
  console.log("Pushing commit to GitHub...");
  const pushOutput = execSync('git push origin main', { cwd: projectPath, encoding: 'utf8' });
  console.log(pushOutput);
  
  console.log("=== SELF-HEALING GIT PUSH COMPLETE ===");
} catch (e) {
  console.error("Error during self-healing push:", e.message);
  process.exit(1);
}
