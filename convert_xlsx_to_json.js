const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelFile = path.join(__dirname, 'multilingual_questions_100.xlsx');
const outputFile = path.join(__dirname, 'public/questions.json');

console.log("Reading multilingual_questions_100.xlsx...");
const wb = XLSX.readFile(excelFile);

// Parse Sheets
const mainSheet = wb.Sheets['Main_Questions'];
const transSheet = wb.Sheets['Translations'];

const mainData = XLSX.utils.sheet_to_json(mainSheet);
const transData = XLSX.utils.sheet_to_json(transSheet);

console.log(`Loaded ${mainData.length} main questions and ${transData.length} translation rows.`);

// Group translations by Question_ID and Language_Code
const translationsMap = {};
transData.forEach(row => {
  const qId = row.Question_ID;
  const lang = row.Language_Code;
  
  if (!translationsMap[qId]) {
    translationsMap[qId] = {};
  }

  // Parse options array "A (ID) | B (ID) | C (ID)"
  const optionsList = row.Options_Target ? row.Options_Target.split('|').map(o => o.trim()) : [];
  
  // Parse vocabulary pairs if matching type
  const pairsList = [];
  if (row.Options_Target && row.Options_Target.includes('=')) {
    row.Options_Target.split('|').forEach(item => {
      const parts = item.split('=');
      if (parts[0] && parts[1]) {
        pairsList.push({
          ja: parts[0].trim(), // practicing target (e.g. Arabic or Japanese)
          id: parts[1].trim()  // translation (Indonesian)
        });
      }
    });
  }

  translationsMap[qId][lang] = {
    targetText: row.Target_Text || "",
    phonetic: row.Phonetic || "",
    options: optionsList,
    correctAnswer: row.Correct_Answer || "",
    pairs: pairsList
  };
});

// Compile final questions grouped by week (weeks 1 to 12)
const questionsByWeek = {};
for (let i = 1; i <= 12; i++) {
  questionsByWeek[i.toString()] = [];
}

mainData.forEach((q, idx) => {
  // Distribute 100 questions across 12 weeks (~8 questions per week)
  const weekNum = Math.min(12, Math.floor(idx / 8) + 1).toString();
  
  // Map spreadsheet columns to database types
  let type = "B"; // default multiple choice
  if (q.Question_Type === "Speech Repetition") type = "D";
  else if (q.Question_Type === "Short Answer") type = "C";
  else if (q.Question_Type === "Matching") type = "A";
  else if (q.Question_Type === "True/False") type = "B";

  const qId = q.Question_ID;
  const qTrans = translationsMap[qId] || {};
  
  // Base default is Japanese ('ja')
  const baseTrans = qTrans['ja'] || { targetText: "", phonetic: "", options: [], pairs: [], correctAnswer: "" };

  const qObj = {
    id: qId,
    jobCategory: q.Job_Group,
    level: q.Level,
    type: type,
    prompt: q.Prompt_ID || "Jawablah pertanyaan berikut.", // Always Indonesian
    meaning: q.Meaning_ID || "",                           // Always Indonesian
    explanation_id: q.Explanation_ID || "",                 // Always Indonesian
    
    // Core target fields (defaulting to Japanese)
    audioText: baseTrans.targetText,
    targetJa: baseTrans.targetText,
    romaji: baseTrans.phonetic,
    targetRomaji: type === "C" ? baseTrans.correctAnswer.toLowerCase() : "",
    options: baseTrans.options,
    pairs: baseTrans.pairs,
    answer: type === "B" && q.Question_Type === "Multiple Choice" ? 0 : 0, // default index
    
    // Translations map containing other selectable languages
    translations: qTrans
  };

  // Setup options for True/False
  if (q.Question_Type === "True/False") {
    qObj.options = ["Benar / True", "Salah / False"];
    qObj.answer = 0; // True
  }

  questionsByWeek[weekNum].push(qObj);
});

// Save to public/questions.json
fs.writeFileSync(outputFile, JSON.stringify(questionsByWeek, null, 2), 'utf8');

console.log(`\n🎉 SUCCESS! Written processed multilingual questions to ${outputFile}`);
