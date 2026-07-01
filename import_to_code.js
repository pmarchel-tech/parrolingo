const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Paths
const excelFile = path.join(__dirname, 'week1.xlsx');
const learnScreenPath = path.join(__dirname, 'src/components/LearnScreen.jsx');

console.log("Reading week1.xlsx...");
const wb = XLSX.readFile(excelFile);

// --- 1. Parse Vocabulary ---
const vocabSheet = wb.Sheets['kosakata'];
const vocabData = XLSX.utils.sheet_to_json(vocabSheet);
const newVocabList = vocabData.map(row => {
  return {
    ja: row['Kata Jepang'] ? row['Kata Jepang'].toString().trim() : '',
    romaji: row['Romaji'] ? row['Romaji'].toString().trim() : '',
    id: row['Arti Indonesia'] ? row['Arti Indonesia'].toString().trim() : '',
    context: row['Konteks'] ? row['Konteks'].toString().trim() : '',
    tip: row['Tips'] ? row['Tips'].toString().trim() : '',
    example: row['Contoh Kalimat'] ? row['Contoh Kalimat'].toString().trim() : ''
  };
});

console.log(`Parsed ${newVocabList.length} vocabulary words.`);

// --- 2. Parse Questions ---
const questionsSheet = wb.Sheets['pertanyaan'];
const questionsData = XLSX.utils.sheet_to_json(questionsSheet);
const newQuestionsList = [];

// Robust text cleaning to handle full-width Japanese characters and various prefixes
const cleanText = (str) => {
  if (!str) return '';
  return str.toString()
    .trim()
    // Convert full-width letters to half-width
    .replace(/[Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    // Convert full-width dot to half-width
    .replace(/．/g, '.')
    // Convert full-width space to half-width
    .replace(/　/g, ' ')
    // Remove leading A. B. C. D. or A) B) C) D) (case-insensitive)
    .replace(/^[a-z][\.\)\s]\s*/i, '')
    .trim();
};

questionsData.forEach((row, idx) => {
  const rawType = row['Tipe Soal'] || '';
  let type = 'B'; // default
  if (rawType.includes('A')) type = 'A';
  else if (rawType.includes('B')) type = 'B';
  else if (rawType.includes('C')) type = 'C';
  else if (rawType.includes('D')) type = 'D';

  const prompt = row['Instruksi'] ? row['Instruksi'].toString().trim() : '';
  const audioText = row['Audio / Teks Jepang'] ? row['Audio / Teks Jepang'].toString().trim() : '';
  const meaning = row['Arti Indonesia'] ? row['Arti Indonesia'].toString().trim() : '';

  const qObj = { type, prompt };

  if (type === 'A') {
    // Parse pairs: "いち (Ichi) = Satu | に (Ni) = Dua"
    const pairsStr = row['Pilihan / Pasangan'] || '';
    const pairs = pairsStr.split('|').map(p => {
      const parts = p.split('=');
      return {
        ja: parts[0] ? parts[0].trim() : '',
        id: parts[1] ? parts[1].trim() : ''
      };
    }).filter(p => p.ja && p.id);
    qObj.pairs = pairs;
  } else if (type === 'B') {
    qObj.audioText = audioText;
    
    // Parse options: "A. Option 1 | B. Option 2 | C. Option 3"
    const optionsStr = row['Pilihan / Pasangan'] || '';
    const options = optionsStr.split('|').map(opt => cleanText(opt)).filter(Boolean);

    // Parse answer index
    const correctStr = cleanText(row['Jawaban Benar']);
    let answerIndex = options.findIndex(opt => opt === correctStr);
    if (answerIndex === -1) {
      // Fallback: case insensitive or partial match
      answerIndex = options.findIndex(opt => opt.toLowerCase() === correctStr.toLowerCase());
    }
    if (answerIndex === -1) {
      console.warn(`Warning: Could not match correct answer "${row['Jawaban Benar']}" (cleaned: "${correctStr}") in options:`, options);
      answerIndex = 0; // fallback to first
    }

    qObj.options = options;
    qObj.answer = answerIndex;

    // Add explanation
    qObj.explanation = {
      word: audioText,
      romaji: '', // Will be filled dynamically if needed
      translation: meaning,
      context: 'Latihan pengucapan dan pendengaran kosakata dasar Kaigo.',
      tip: 'Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.',
      example: ''
    };
  } else if (type === 'C') {
    // Typing: targetRomaji, targetJa, meaning
    // We can extract targetRomaji from the sheet if we have it, or generate it.
    // In our sheet, the columns are: 'Minggu', 'No. Soal', 'Tipe Soal', 'Instruksi', 'Audio / Teks Jepang', 'Pilihan / Pasangan', 'Jawaban Benar', 'Arti Indonesia'
    // For Type C, 'Audio / Teks Jepang' is the targetJa (e.g. こんにちは), and 'Jawaban Benar' is the targetRomaji (e.g. konnichiwa)
    qObj.targetRomaji = row['Jawaban Benar'] ? row['Jawaban Benar'].toString().trim().toLowerCase() : '';
    qObj.targetJa = audioText;
    qObj.meaning = meaning;
  } else if (type === 'D') {
    // Shadowing: targetJa, romaji, meaning
    // For Type D, 'Audio / Teks Jepang' is targetJa, and we can generate romaji or get it from 'Pilihan / Pasangan' if present, or just leave it empty/generate.
    // Let's check if 'Pilihan / Pasangan' contains the Romaji
    qObj.targetJa = audioText;
    qObj.romaji = row['Pilihan / Pasangan'] ? row['Pilihan / Pasangan'].toString().trim() : '';
    qObj.meaning = meaning;
  }

  newQuestionsList.push(qObj);
});

console.log(`Parsed ${newQuestionsList.length} questions.`);

// --- 3. Update LearnScreen.jsx ---
console.log("Reading LearnScreen.jsx...");
let learnScreenCode = fs.readFileSync(learnScreenPath, 'utf8');

// We need to replace QUESTIONS_BY_WEEK[1] and VOCAB_BY_WEEK[1]
// To do this safely, we will locate the blocks:
// For QUESTIONS_BY_WEEK:
// 1: [ ... ],
// For VOCAB_BY_WEEK:
// 1: [ ... ],

const formatJSObject = (obj) => {
  return JSON.stringify(obj, null, 2)
    .replace(/"([^"]+)":/g, '$1:') // remove quotes from keys
    .replace(/"/g, "'"); // convert double quotes to single quotes
};

const newQuestionsJS = `  1: ${formatJSObject(newQuestionsList)},`;
const newVocabJS = `  1: ${formatJSObject(newVocabList)},`;

// Find and replace QUESTIONS_BY_WEEK[1]
const qStartMarker = 'const QUESTIONS_BY_WEEK = {\n  1: [';
const qEndMarker = '  ],';
const qStartIdx = learnScreenCode.indexOf(qStartMarker);
if (qStartIdx === -1) {
  throw new Error("Could not find QUESTIONS_BY_WEEK[1] start marker in LearnScreen.jsx");
}
const qEndIdx = learnScreenCode.indexOf(qEndMarker, qStartIdx);
if (qEndIdx === -1) {
  throw new Error("Could not find QUESTIONS_BY_WEEK[1] end marker in LearnScreen.jsx");
}

const oldQuestionsBlock = learnScreenCode.substring(qStartIdx, qEndIdx + qEndMarker.length);
const newQuestionsBlock = `const QUESTIONS_BY_WEEK = {\n${newQuestionsJS}`;

learnScreenCode = learnScreenCode.replace(oldQuestionsBlock, newQuestionsBlock);

// Find and replace VOCAB_BY_WEEK[1]
const vStartMarker = 'const VOCAB_BY_WEEK = {\n  1: [';
const vEndMarker = '  ],';
const vStartIdx = learnScreenCode.indexOf(vStartMarker);
if (vStartIdx === -1) {
  throw new Error("Could not find VOCAB_BY_WEEK[1] start marker in LearnScreen.jsx");
}
const vEndIdx = learnScreenCode.indexOf(vEndMarker, vStartIdx);
if (vEndIdx === -1) {
  throw new Error("Could not find VOCAB_BY_WEEK[1] end marker in LearnScreen.jsx");
}

const oldVocabBlock = learnScreenCode.substring(vStartIdx, vEndIdx + vEndMarker.length);
const newVocabBlock = `const VOCAB_BY_WEEK = {\n${newVocabJS}`;

learnScreenCode = learnScreenCode.replace(oldVocabBlock, newVocabBlock);

// Save updated LearnScreen.jsx
fs.writeFileSync(learnScreenPath, learnScreenCode, 'utf8');

console.log("\n🎉 SUCCESS! LearnScreen.jsx has been successfully updated with the new questions and vocabulary.");
