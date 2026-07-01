const XLSX = require('xlsx');
const path = require('path');

const file = path.join(__dirname, 'week1.xlsx');
const wb = XLSX.readFile(file);

// Print all vocabulary words
const vocabSheet = wb.Sheets['kosakata'];
const vocabData = XLSX.utils.sheet_to_json(vocabSheet);
console.log("\n--- ALL VOCABULARY WORDS IN 'kosakata' SHEET ---");
vocabData.forEach((row, idx) => {
  console.log(`${idx + 1}. [Week ${row.Minggu}] ${row['Kata Jepang']} (${row.Romaji}) - ${row['Arti Indonesia']}`);
});

// Analyze question topics
const questionsSheet = wb.Sheets['pertanyaan'];
const questionsData = XLSX.utils.sheet_to_json(questionsSheet);
console.log("\n--- QUESTION TYPES & PROMPTS SUMMARY ---");
const promptCounts = {};
questionsData.forEach(row => {
  const prompt = row['Instruksi'] || '';
  promptCounts[prompt] = (promptCounts[prompt] || 0) + 1;
});
Object.keys(promptCounts).forEach(prompt => {
  console.log(`- "${prompt}": ${promptCounts[prompt]} questions`);
});

