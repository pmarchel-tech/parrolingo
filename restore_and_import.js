const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { execSync } = require('child_process');

// 1. Restore LearnScreen.jsx using git
console.log("Restoring LearnScreen.jsx to clean state...");
try {
  execSync('git checkout src/components/LearnScreen.jsx', { stdio: 'inherit' });
  console.log("LearnScreen.jsx restored successfully.");
} catch (err) {
  console.error("Failed to restore LearnScreen.jsx via git. Trying git checkout manually...", err);
}

// Paths
const excelFile = path.join(__dirname, 'week1.xlsx');
const learnScreenPath = path.join(__dirname, 'src/components/LearnScreen.jsx');

console.log("Reading week1.xlsx...");
const wb = XLSX.readFile(excelFile);

// --- 2. Parse Vocabulary ---
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

// --- 3. Parse Questions ---
const questionsSheet = wb.Sheets['pertanyaan'];
const questionsData = XLSX.utils.sheet_to_json(questionsSheet);
const newQuestionsList = [];

// Robust text cleaning
const cleanText = (str) => {
  if (!str) return '';
  return str.toString()
    .trim()
    .replace(/[Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
    .replace(/．/g, '.')
    .replace(/　/g, ' ')
    .replace(/^[a-z][\.\)\s]\s*/i, '')
    .trim();
};

questionsData.forEach((row, idx) => {
  const rawType = row['Tipe Soal'] || '';
  let type = 'B';
  if (rawType.includes('A')) type = 'A';
  else if (rawType.includes('B')) type = 'B';
  else if (rawType.includes('C')) type = 'C';
  else if (rawType.includes('D')) type = 'D';

  const prompt = row['Instruksi'] ? row['Instruksi'].toString().trim() : '';
  const audioText = row['Audio / Teks Jepang'] ? row['Audio / Teks Jepang'].toString().trim() : '';
  const meaning = row['Arti Indonesia'] ? row['Arti Indonesia'].toString().trim() : '';

  const qObj = { type, prompt };

  if (type === 'A') {
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
    const optionsStr = row['Pilihan / Pasangan'] || '';
    const options = optionsStr.split('|').map(opt => cleanText(opt)).filter(Boolean);

    const correctStr = cleanText(row['Jawaban Benar']);
    let answerIndex = options.findIndex(opt => opt === correctStr);
    if (answerIndex === -1) {
      answerIndex = options.findIndex(opt => opt.toLowerCase() === correctStr.toLowerCase());
    }
    if (answerIndex === -1) {
      console.warn(`Warning: Could not match correct answer "${row['Jawaban Benar']}" in options:`, options);
      answerIndex = 0;
    }

    qObj.options = options;
    qObj.answer = answerIndex;
    qObj.explanation = {
      word: audioText,
      romaji: '',
      translation: meaning,
      context: 'Latihan pengucapan dan pendengaran kosakata dasar Kaigo.',
      tip: 'Dengarkan baik-baik pelafalan huruf vokal dan konsonan ganda.',
      example: ''
    };
  } else if (type === 'C') {
    qObj.targetRomaji = row['Jawaban Benar'] ? row['Jawaban Benar'].toString().trim().toLowerCase() : '';
    qObj.targetJa = audioText;
    qObj.meaning = meaning;
  } else if (type === 'D') {
    qObj.targetJa = audioText;
    qObj.romaji = row['Pilihan / Pasangan'] ? row['Pilihan / Pasangan'].toString().trim() : '';
    qObj.meaning = meaning;
  }

  newQuestionsList.push(qObj);
});

console.log(`Parsed ${newQuestionsList.length} questions.`);

// --- 4. Read and Update LearnScreen.jsx using Bracket Matching ---
console.log("Reading LearnScreen.jsx...");
let code = fs.readFileSync(learnScreenPath, 'utf8');

const findMatchingClosingBracket = (str, startIdx) => {
  let depth = 0;
  for (let i = startIdx; i < str.length; i++) {
    const char = str[i];
    if (char === '[' || char === '{') {
      depth++;
    } else if (char === ']' || char === '}') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1;
};

const replaceWeekArray = (sourceCode, startMarker, newArrayContent) => {
  const startIdx = sourceCode.indexOf(startMarker);
  if (startIdx === -1) {
    throw new Error(`Could not find start marker: ${startMarker}`);
  }
  
  // Find the opening bracket of the array
  const arrayStartIdx = sourceCode.indexOf('[', startIdx + startMarker.length - 5);
  if (arrayStartIdx === -1) {
    throw new Error(`Could not find opening bracket after marker: ${startMarker}`);
  }

  // Find the matching closing bracket
  const arrayEndIdx = findMatchingClosingBracket(sourceCode, arrayStartIdx);
  if (arrayEndIdx === -1) {
    throw new Error(`Could not find matching closing bracket for array starting at ${arrayStartIdx}`);
  }

  // The block to replace is from the start marker to the closing bracket (plus any trailing comma)
  const endIdx = sourceCode.indexOf(',', arrayEndIdx);
  const actualEndIdx = (endIdx !== -1 && endIdx - arrayEndIdx < 5) ? endIdx + 1 : arrayEndIdx + 1;

  const oldBlock = sourceCode.substring(startIdx, actualEndIdx);
  return sourceCode.replace(oldBlock, startMarker + '\n' + newArrayContent);
};

const formatJSObject = (obj) => {
  return JSON.stringify(obj, null, 2);
};

const newQuestionsJS = formatJSObject(newQuestionsList) + ',';
const newVocabJS = formatJSObject(newVocabList) + ',';

console.log("Replacing QUESTIONS_BY_WEEK[1]...");
code = replaceWeekArray(code, '  1: [', newQuestionsJS);

console.log("Replacing VOCAB_BY_WEEK[1]...");
code = replaceWeekArray(code, '  1: [', newVocabJS);

// Save updated LearnScreen.jsx
fs.writeFileSync(learnScreenPath, code, 'utf8');

console.log("\n🎉 SUCCESS! LearnScreen.jsx has been successfully updated with the new questions and vocabulary.");
