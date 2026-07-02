const { execSync } = require('child_process');

const run = (cmd) => {
  try {
    console.log(`\n▶ ${cmd}`);
    const out = execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (out && out.trim()) console.log(out.trim());
    return true;
  } catch (e) {
    const msg = (e.stdout || '') + (e.stderr || '') || e.message;
    console.log(`  (output) ${msg.trim()}`);
    return false;
  }
};

console.log('=== GITHUB SYNC START ===');

run('git add -A');
run('git pull origin main --no-rebase');
run('git commit -m "feat: add app icon + hide floating nav when modal opens"');
const ok = run('git push origin main');

if (ok) {
  console.log('\n✅ SYNC COMPLETE! All changes pushed to GitHub.');
} else {
  console.log('\n⚠ Push may have failed. Trying with lease...');
  run('git push --force-with-lease origin main');
}
