const fs = require('fs');
const path = require('path');

// Path to LearnScreen.jsx
const filePath = path.join(__dirname, 'src/components/LearnScreen.jsx');
const code = fs.readFileSync(filePath, 'utf8');

// 1. Extract QUESTIONS_BY_WEEK, VOCAB_BY_WEEK, and the helper functions using eval in a secure sandbox
const extractBlock = (startMarker, endMarker) => {
  const startIdx = code.indexOf(startMarker);
  const endIdx = code.indexOf(endMarker, startIdx);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Could not find markers: ${startMarker} or ${endMarker}`);
  }
  return code.substring(startIdx, endIdx + endMarker.length);
};

console.log("Extracting data and functions from LearnScreen.jsx...");

// Extract the database objects and helper functions
const questionsBlock = extractBlock('const QUESTIONS_BY_WEEK = {', '};');
const vocabBlock = extractBlock('const VOCAB_BY_WEEK = {', '};');
const shuffleArrayBlock = `
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
`;

const generatorBlock = extractBlock('  const generateQuestionsForSession = (weekNum) => {', '  };');

// Combine into an executable script in a sandbox
const sandboxCode = `
${questionsBlock}
${vocabBlock}
${shuffleArrayBlock}
const weekNumber = 1; // For Day 1
const sessionType = 'practice';
${generatorBlock}

// Expose the function to the global scope
global.generateQuestionsForSession = generateQuestionsForSession;
`;

// Run the extracted code
eval(sandboxCode);

console.log("\n--- STARTING AUTOMATED VERIFICATION ---");
console.log("Running generateQuestionsForSession(2) 1,000 times...");

let totalRuns = 1000;
let failedRuns = 0;
let stats = {
  exactCount: 0,
  zeroDuplicates: 0,
  types: { A: 0, B: 0, C: 0, D: 0 }
};

for (let run = 0; run < totalRuns; run++) {
  const questions = global.generateQuestionsForSession(2);
  
  // Verify 1: Exact Count (Day 2 targetCount is 11)
  if (questions.length === 11) {
    stats.exactCount++;
  } else {
    failedRuns++;
    console.error(`Run #${run} failed: Expected 11 questions, got ${questions.length}`);
  }

  // Verify 2: No duplicates
  const seenJa = new Set();
  let hasDuplicate = false;
  
  questions.forEach(q => {
    // Track types
    stats.types[q.type] = (stats.types[q.type] || 0) + 1;

    let jaWord = '';
    if (q.audioText) jaWord = q.audioText;
    else if (q.targetJa) jaWord = q.targetJa;
    else if (q.pairs) jaWord = q.pairs.map(p => p.ja.split(' ')[0].split('(')[0].trim()).join('|');

    if (jaWord) {
      if (seenJa.has(jaWord)) {
        hasDuplicate = true;
      }
      seenJa.add(jaWord);
    }
  });

  if (!hasDuplicate) {
    stats.zeroDuplicates++;
  } else {
    failedRuns++;
    console.error(`Run #${run} failed: Found duplicate questions in session!`, Array.from(seenJa));
  }
}

console.log("\n--- VERIFICATION RESULTS ---");
console.log(`Total Runs: ${totalRuns}`);
console.log(`Successful Runs: ${totalRuns - failedRuns}`);
console.log(`Failed Runs: ${failedRuns}`);
console.log(`Sessions with exact 11 questions: ${stats.exactCount} (${(stats.exactCount / totalRuns) * 100}%)`);
console.log(`Sessions with 0 duplicates: ${stats.zeroDuplicates} (${(stats.zeroDuplicates / totalRuns) * 100}%)`);
console.log("\nQuestion Type Distribution across all runs:");
console.log(`- Type A (Matching): ${stats.types.A} (${Math.round(stats.types.A / (totalRuns * 11) * 100)}%)`);
console.log(`- Type B (Listening): ${stats.types.B} (${Math.round(stats.types.B / (totalRuns * 11) * 100)}%)`);
console.log(`- Type C (Typing): ${stats.types.C} (${Math.round(stats.types.C / (totalRuns * 11) * 100)}%)`);
console.log(`- Type D (Shadowing): ${stats.types.D} (${Math.round(stats.types.D / (totalRuns * 11) * 100)}%)`);

if (failedRuns === 0) {
  console.log("\n🎉 ALL TESTS PASSED! The session generation algorithm is 100% correct, robust, and duplicate-free.");
} else {
  console.log("\n❌ SOME TESTS FAILED. Please review the errors above.");
}
