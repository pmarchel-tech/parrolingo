const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const originalExcel = path.join(__dirname, 'kaigolingo_questions_and_vocab.xlsx');
const newExcel = path.join(__dirname, 'week1.xlsx');
const learnScreenPath = path.join(__dirname, 'src/components/LearnScreen.jsx');

console.log("Loading Excel files...");
const wbOriginal = XLSX.readFile(originalExcel);
const wbNew = XLSX.readFile(newExcel);

// Clean text function to handle full-width Japanese characters and prefixes
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

// --- Helper to parse questions sheet ---
const parseQuestionsSheet = (sheet) => {
  const data = XLSX.utils.sheet_to_json(sheet);
  const questionsByWeek = {};

  data.forEach(row => {
    const week = parseInt(row['Minggu']);
    if (isNaN(week)) return;

    if (!questionsByWeek[week]) {
      questionsByWeek[week] = [];
    }

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

    questionsByWeek[week].push(qObj);
  });

  return questionsByWeek;
};

// --- Helper to parse vocabulary sheet ---
const parseVocabSheet = (sheet) => {
  const data = XLSX.utils.sheet_to_json(sheet);
  const vocabByWeek = {};

  data.forEach(row => {
    const week = parseInt(row['Minggu']);
    if (isNaN(week)) return;

    if (!vocabByWeek[week]) {
      vocabByWeek[week] = [];
    }

    vocabByWeek[week].push({
      ja: row['Kata Jepang'] ? row['Kata Jepang'].toString().trim() : '',
      romaji: row['Romaji'] ? row['Romaji'].toString().trim() : '',
      id: row['Arti Indonesia'] ? row['Arti Indonesia'].toString().trim() : '',
      context: row['Konteks'] ? row['Konteks'].toString().trim() : '',
      tip: row['Tips'] ? row['Tips'].toString().trim() : '',
      example: row['Contoh Kalimat'] ? row['Contoh Kalimat'].toString().trim() : ''
    });
  });

  return vocabByWeek;
};

// --- Parse Both Files ---
console.log("Parsing original data...");
const originalQuestions = parseQuestionsSheet(wbOriginal.Sheets['Daftar Soal']);
const originalVocab = parseVocabSheet(wbOriginal.Sheets['Daftar Kosakata']);

console.log("Parsing new Week 1 data...");
const newQuestions = parseQuestionsSheet(wbNew.Sheets['pertanyaan']);
const newVocab = parseVocabSheet(wbNew.Sheets['kosakata']);

// --- Combine Data ---
const finalQuestions = { ...originalQuestions };
const finalVocab = { ...originalVocab };

// Overwrite Week 1
finalQuestions[1] = newQuestions[1];
finalVocab[1] = newVocab[1];

console.log("\nSummary of questions per week:");
for (let w = 1; w <= 12; w++) {
  console.log(`- Week ${w}: ${finalQuestions[w] ? finalQuestions[w].length : 0} questions, ${finalVocab[w] ? finalVocab[w].length : 0} vocab words`);
}

// --- Generate JS Code ---
const formatJSObject = (obj) => {
  return JSON.stringify(obj, null, 2);
};

const questionsCode = `const QUESTIONS_BY_WEEK = ${formatJSObject(finalQuestions)};`;
const vocabCode = `const VOCAB_BY_WEEK = ${formatJSObject(finalVocab)};`;

// --- Read and Update LearnScreen.jsx ---
console.log("\nUpdating LearnScreen.jsx...");
let learnScreenCode = fs.readFileSync(learnScreenPath, 'utf8');

// Find the start of QUESTIONS_BY_WEEK and end of VOCAB_BY_WEEK
const qStartIdx = learnScreenCode.indexOf('const QUESTIONS_BY_WEEK = {');
if (qStartIdx === -1) {
  throw new Error("Could not find const QUESTIONS_BY_WEEK in LearnScreen.jsx");
}

// Find the end of VOCAB_BY_WEEK. Since it's currently corrupted, we will find where the next section starts.
// The next section is: "export default function LearnScreen"
const nextSectionIdx = learnScreenCode.indexOf('export default function LearnScreen');
if (nextSectionIdx === -1) {
  throw new Error("Could not find export default function LearnScreen in LearnScreen.jsx");
}

// Replace the entire database block
const oldDbBlock = learnScreenCode.substring(qStartIdx, nextSectionIdx);
const newDbBlock = `${questionsCode}\n\n${vocabCode}\n\n`;

learnScreenCode = learnScreenCode.replace(oldDbBlock, newDbBlock);

fs.writeFileSync(learnScreenPath, learnScreenCode, 'utf8');
console.log("🎉 SUCCESS! LearnScreen.jsx has been reconstructed and updated successfully.");
