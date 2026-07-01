const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Path to LearnScreen.jsx
const filePath = path.join(__dirname, 'src/components/LearnScreen.jsx');
const code = fs.readFileSync(filePath, 'utf8');

// Helper to extract code blocks
const extractBlock = (startMarker, endMarker) => {
  const startIdx = code.indexOf(startMarker);
  const endIdx = code.indexOf(endMarker, startIdx);
  if (startIdx === -1 || endIdx === -1) {
    throw new Error(`Could not find markers: ${startMarker} or ${endMarker}`);
  }
  return code.substring(startIdx, endIdx + endMarker.length);
};

console.log("Extracting database from LearnScreen.jsx...");

// Extract and evaluate the database objects in a sandbox
const questionsBlock = extractBlock('const QUESTIONS_BY_WEEK = {', '};');
const vocabBlock = extractBlock('const VOCAB_BY_WEEK = {', '};');

const sandboxCode = `
${questionsBlock}
${vocabBlock}
global.QUESTIONS_BY_WEEK = QUESTIONS_BY_WEEK;
global.VOCAB_BY_WEEK = VOCAB_BY_WEEK;
`;

eval(sandboxCode);

const questionsDb = global.QUESTIONS_BY_WEEK;
const vocabDb = global.VOCAB_BY_WEEK;

// --- 1. Format Questions Sheet ---
const questionsRows = [];
Object.keys(questionsDb).forEach(week => {
  questionsDb[week].forEach((q, idx) => {
    let typeName = '';
    if (q.type === 'A') typeName = 'A (Cocokkan)';
    else if (q.type === 'B') typeName = 'B (Pilihan Ganda)';
    else if (q.type === 'C') typeName = 'C (Ketik Romaji)';
    else if (q.type === 'D') typeName = 'D (Shadowing)';

    let optionsStr = '';
    if (q.options) {
      optionsStr = q.options.map((opt, oIdx) => `${String.fromCharCode(65 + oIdx)}. ${opt}`).join(' | ');
    } else if (q.pairs) {
      optionsStr = q.pairs.map(p => `${p.ja} = ${p.id}`).join(' | ');
    }

    let correctAnswer = '';
    if (q.type === 'B' && q.options) {
      correctAnswer = `${String.fromCharCode(65 + q.answer)}. ${q.options[q.answer]}`;
    } else if (q.type === 'C') {
      correctAnswer = q.targetRomaji;
    } else if (q.type === 'D') {
      correctAnswer = q.targetJa;
    }

    questionsRows.push({
      'Minggu': parseInt(week),
      'No. Soal': idx + 1,
      'Tipe Soal': typeName,
      'Instruksi': q.prompt || '',
      'Audio / Teks Jepang': q.audioText || q.targetJa || '',
      'Pilihan / Pasangan': optionsStr,
      'Jawaban Benar': correctAnswer,
      'Kunci Romaji': q.targetRomaji || '',
      'Kunci Jepang': q.targetJa || '',
      'Arti Indonesia': q.meaning || (q.explanation ? q.explanation.translation : '')
    });
  });
});

// --- 2. Format Vocabulary Sheet ---
const vocabRows = [];
Object.keys(vocabDb).forEach(week => {
  vocabDb[week].forEach((v, idx) => {
    vocabRows.push({
      'Minggu': parseInt(week),
      'No. Kosakata': idx + 1,
      'Kata Jepang': v.ja,
      'Romaji': v.romaji,
      'Arti Indonesia': v.id,
      'Konteks': v.context || '',
      'Tips': v.tip || '',
      'Contoh Kalimat': v.example || ''
    });
  });
});

// --- 3. Create Workbook and Sheets ---
const wb = XLSX.utils.book_new();

const wsQuestions = XLSX.utils.json_to_sheet(questionsRows);
const wsVocab = XLSX.utils.json_to_sheet(vocabRows);

// Set column widths for better readability
const setColWidths = (ws) => {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const cols = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxLen = 10;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.v) {
        const len = cell.v.toString().length;
        if (len > maxLen) maxLen = len;
      }
    }
    cols.push({ wch: Math.min(maxLen + 2, 45) }); // cap at 45 width
  }
  ws['!cols'] = cols;
};

setColWidths(wsQuestions);
setColWidths(wsVocab);

XLSX.utils.book_append_sheet(wb, wsQuestions, "Daftar Soal");
XLSX.utils.book_append_sheet(wb, wsVocab, "Daftar Kosakata");

// --- 4. Write Excel File ---
const outputFilename = 'kaigolingo_questions_and_vocab.xlsx';
const outputPath = path.join(__dirname, outputFilename);
const publicPath = path.join(__dirname, 'public', outputFilename);

XLSX.writeFile(wb, outputPath);
XLSX.writeFile(wb, publicPath);

console.log(`\n🎉 SUCCESS! Excel file exported to:`);
console.log(`- Root: ${outputPath}`);
console.log(`- Public: ${publicPath}`);
console.log(`- Total Questions Exported: ${questionsRows.length}`);
console.log(`- Total Vocabulary Words Exported: ${vocabRows.length}`);
