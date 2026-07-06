const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Let's see the commits and the diffs for LearnScreen.jsx
  const commands = [
    'git log -n 5',
    'git show 47c4d69:src/components/LearnScreen.jsx'
  ];

  let output = '';
  for (const cmd of commands) {
    output += `=== RUNNING: ${cmd} ===\n`;
    try {
      const res = execSync(cmd, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
      // We only want the part of git show around romajiToHiragana or getLevenshteinDistance
      if (cmd.includes('git show')) {
        const lines = res.split('\n');
        const matches = [];
        lines.forEach((line, idx) => {
          if (line.includes('romajiToHiragana') || line.includes('getLevenshteinDistance')) {
            matches.push(idx);
          }
        });
        output += `Found ${matches.length} matches\n`;
        matches.forEach(lineIdx => {
          output += `--- Match at line ${lineIdx + 1} ---\n`;
          output += lines.slice(Math.max(0, lineIdx - 10), Math.min(lines.length, lineIdx + 10)).join('\n');
          output += '\n';
        });
      } else {
        output += res;
      }
    } catch (err) {
      output += `ERROR: ${err.message}\n`;
    }
    output += '\n\n';
  }

  fs.writeFileSync('git_helper.log', output);
  console.log('Git commands executed successfully. Output written to git_helper.log');
} catch (globalErr) {
  console.error('Global error:', globalErr);
}
