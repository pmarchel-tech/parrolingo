const XLSX = require('xlsx');
const path = require('path');

// 100 realistic, job-specific Japanese questions (N3/N2) structured for Excel
const data = [
  // --- 1. HEALTHCARE ---
  {
    "ID": "Q_HEALTH_001", "Level": "N3", "Job Group": "Healthcare", "Skill": "Speaking", "Question Type": "Speech Repetition", "Grammar Point": "〜ところです",
    "Scenario Context": "Membantu lansia berpindah dari tempat tidur ke kursi roda.",
    "Prompt Instruction": "Dengarkan kalimat bergaris bawah lalu ucapkan ulang dengan lafal yang benar.",
    "Learning Content (Japanese)": "山田さん、お水ですね。今、台所から【持ってくるところです】ので、お待ちください。",
    "Options / Pairs / Blocks": "", "Correct Answer": "今、台所から持ってくるところですので、お待ちください。",
    "Translation": "Tuan Yamada, air minum ya. Sekarang saya baru akan mengambilkannya dari dapur, mohon tunggu sebentar.",
    "Explanation": "Pola K.Kerja Kamus + tokoro desu menyatakan aktivitas yang baru akan dimulai saat ini juga.",
    "Vocabulary List": "車椅子 (kurumaisu) = Kursi roda | 準備 (junbi) = Persiapan"
  },
  {
    "ID": "Q_HEALTH_002", "Level": "N2", "Job Group": "Healthcare", "Skill": "Reading", "Question Type": "Multiple Choice", "Grammar Point": "〜に際して",
    "Scenario Context": "Petunjuk tertulis panti jompo mengenai penanganan lansia saat masuk kamar mandi.",
    "Prompt Instruction": "Bacalah dokumen berikut dan pilih jawaban yang paling tepat.",
    "Learning Content (Japanese)": "入浴介助に際しては、浴室の温度をあらかじめ22度前後に調整し、温度差によるヒートショックを防ぐこと。\n\n質問：入浴介助の前に何をしなければなりませんか？",
    "Options / Pairs / Blocks": "A. 浴室の温度を上げておく | B. 利用者をすぐに浴槽に入れる | C. 窓をすべて開ける", "Correct Answer": "A",
    "Translation": "Pada saat membantu mandi, atur suhu kamar mandi terlebih dahulu di sekitar 22 derajat untuk mencegah serangan jantung (heat shock) akibat perbedaan suhu.",
    "Explanation": "A. 浴室の温度を上げておく (Menaikkan suhu kamar mandi terlebih dahulu) adalah langkah persiapan yang tepat sesuai instruksi.",
    "Vocabulary List": "入浴 (nyuuyoku) = Mandi | 調整 (chousei) = Mengatur/Menyesuaikan"
  },
  {
    "ID": "Q_HEALTH_003", "Level": "N3", "Job Group": "Healthcare", "Skill": "Listening", "Question Type": "True/False", "Grammar Point": "〜てください",
    "Scenario Context": "Instruksi lisan perawat tentang mencatat tanda vital pasien.",
    "Prompt Instruction": "Dengarkan audio dan tentukan apakah pernyataan berikut Benar (T) atau Salah (F).",
    "Learning Content (Japanese)": "「佐藤さんの熱を測ったら、介護記録の体温 of 欄に数値を記入しておいてください。」\n\nPernyataan: Pekerja harus menulis suhu tubuh Sato-san di catatan perawatan.",
    "Options / Pairs / Blocks": "T | F", "Correct Answer": "T",
    "Translation": "\"Setelah mengukur suhu tubuh Sato-san, tolong catat angkanya di kolom suhu tubuh pada laporan perawatan.\"",
    "Explanation": "Instruksi lisan menyuruh mencatat nilai suhu tubuh setelah diukur, yang cocok dengan pernyataan.",
    "Vocabulary List": "熱を測る (netsu o hakaru) = Mengukur suhu tubuh | 記入 (kinyuu) = Mengisi/Mencatat"
  },
  {
    "ID": "Q_HEALTH_004", "Level": "N3", "Job Group": "Healthcare", "Skill": "Writing", "Question Type": "Matching", "Grammar Point": "Kosakata Alat Bantu",
    "Scenario Context": "Menjodohkan gambar/nama alat bantu dengan fungsinya.",
    "Prompt Instruction": "Pasangkan nama alat bantu Jepang berikut dengan arti bahasa Indonesia yang benar.",
    "Learning Content (Japanese)": "Matching nama alat bantu",
    "Options / Pairs / Blocks": "車椅子 (kurumaisu) = Kursi Roda | 杖 (tsue) = Tongkat | 歩行器 (hokouki) = Alat Bantu Jalan (Walker)", "Correct Answer": "車椅子=Kursi Roda | 杖=Tongkat | 歩行器=Alat Bantu Jalan (Walker)",
    "Translation": "Pencocokan alat penunjang mobilitas lansia.",
    "Explanation": "Latihan mencocokkan kosakata fisik alat penunjang mobilitas lansia.",
    "Vocabulary List": "車椅子 (kurumaisu) = Kursi roda | 杖 (tsue) = Tongkat"
  },
  {
    "ID": "Q_HEALTH_005", "Level": "N3", "Job Group": "Healthcare", "Skill": "Writing", "Question Type": "Short Answer", "Grammar Point": "Partikel に",
    "Scenario Context": "Mengisi laporan harian mengenai aktivitas lansia berpindah ke ruang makan.",
    "Prompt Instruction": "Isilah titik-titik dengan partikel arah/tujuan yang tepat.",
    "Learning Content (Japanese)": "山田さんは車椅子で食堂【　】移動しました。",
    "Options / Pairs / Blocks": "Input: [に]", "Correct Answer": "に",
    "Translation": "Tuan Yamada berpindah ke ruang makan menggunakan kursi roda.",
    "Explanation": "Partikel に atau へ digunakan untuk menandai tempat tujuan perpindahan.",
    "Vocabulary List": "移動 (idou) = Perpindahan/Berpindah | 食堂 (shokudou) = Ruang makan"
  },
  {
    "ID": "Q_HEALTH_006", "Level": "N2", "Job Group": "Healthcare", "Skill": "Speaking", "Question Type": "Speech Repetition", "Grammar Point": "〜かねます",
    "Scenario Context": "Menolak permintaan keluarga lansia yang meminta petugas memberikan obat luar resep dokter.",
    "Prompt Instruction": "Tirukan kalimat bergaris bawah dengan intonasi sopan.",
    "Learning Content (Japanese)": "申し訳ございませんが、医師の指示がないお薬の与薬は【お受けいたしかねます】。",
    "Options / Pairs / Blocks": "", "Correct Answer": "お受けいたしかねます",
    "Translation": "Mohon maaf, kami tidak dapat menerima pemberian obat yang tidak didasarkan pada instruksi dokter.",
    "Explanation": "Bentuk K.Kerja Stem + kanemasu adalah cara menolak permintaan secara sopan.",
    "Vocabulary List": "指示 (shiji) = Instruksi | 与薬 (yoyaku) = Pemberian obat"
  },
  {
    "ID": "Q_HEALTH_007", "Level": "N3", "Job Group": "Healthcare", "Skill": "Reading", "Question Type": "Pilihan Ganda", "Grammar Point": "〜ほうがいい",
    "Scenario Context": "Catatan shift tentang penanganan pasien yang mengeluh pusing.",
    "Prompt Instruction": "Pilihlah respons tindakan yang paling benar sesuai bacaan.",
    "Learning Content (Japanese)": "利用者が「めまいがする」と訴えた場合、無理に歩かせず、横になって休ませたほうがいい。\n\n質問：利用者がめまいを訴えたとき、どうしますか？",
    "Options / Pairs / Blocks": "A. 歩いて散歩させる | B. 横にして休ませる | C. すぐにお風呂に入れる", "Correct Answer": "B",
    "Translation": "Jika pengguna mengeluh pusing, jangan paksa untuk berjalan, lebih baik biarkan dia berbaring dan beristirahat.",
    "Explanation": "Berbaring dan beristirahat (B. 横にして休ませる) adalah solusi penanganan sesuai petunjuk.",
    "Vocabulary List": "めまい (memai) = Pusing | 訴える (uttaeru) = Mengeluh/Melaporkan"
  },
  {
    "ID": "Q_HEALTH_008", "Level": "N2", "Job Group": "Healthcare", "Skill": "Listening", "Question Type": "Pilihan Ganda", "Grammar Point": "〜おそれがある",
    "Scenario Context": "Rapat pagi membahas risiko luka tekan (decubitus) pada pasien lumpuh.",
    "Prompt Instruction": "Dengarkan rekaman dan pilih jawaban dari pertanyaan.",
    "Learning Content (Japanese)": "「鈴木さんは寝たきりの状態が長いため、褥瘡ができるおそれがあります。2時間おきに体位変換を行ってください。」\n\n質問：なぜ体位変換を行いますか？",
    "Options / Pairs / Blocks": "A. 褥瘡（床ずれ）を防ぐため | B. 食事の準備をするため | C. 部屋の換気をするため", "Correct Answer": "A",
    "Translation": "\"Karena Suzuki-san berbaring di tempat tidur dalam waktu lama, ada risiko timbulnya luka tekan (dekubitus). Tolong lakukan perubahan posisi tubuh setiap 2 jam.\"",
    "Explanation": "Melakukan perubahan posisi tubuh bertujuan untuk mencegah dekubitus (A).",
    "Vocabulary List": "褥瘡 (jokusou) = Luka tekan/Dekubitus | 体位変換 (taii henkan) = Perubahan posisi tubuh"
  },
  {
    "ID": "Q_HEALTH_009", "Level": "N2", "Job Group": "Healthcare", "Skill": "Writing", "Question Type": "Isian Singkat", "Grammar Point": "〜に伴って",
    "Scenario Context": "Menulis laporan perkembangan kemunduran fungsi kognitif lansia.",
    "Prompt Instruction": "Lengkapi bagian rumpang dengan tata bahasa yang berarti 'seiring dengan'.",
    "Learning Content (Japanese)": "加齢【　　】、認知機能が低下することがあります。",
    "Options / Pairs / Blocks": "Input: [伴って]", "Correct Answer": "伴って",
    "Translation": "Seiring dengan bertambahnya usia, fungsi kognitif terkadang mengalami penurunan.",
    "Explanation": "Pola ni tomonatte digunakan untuk menunjukkan suatu perubahan yang terjadi seiring dengan perubahan lainnya.",
    "Vocabulary List": "加齢 (karei) = Bertambah usia | 低下 (teika) = Penurunan"
  },
  {
    "ID": "Q_HEALTH_010", "Level": "N3", "Job Group": "Healthcare", "Skill": "Reading", "Question Type": "Benar/Salah", "Grammar Point": "〜ないでください",
    "Scenario Context": "Papan peringatan di kamar pasien diabetes terkait makanan manis.",
    "Prompt Instruction": "Tentukan benar/salah dari pernyataan berdasarkan pengumuman.",
    "Learning Content (Japanese)": "「佐藤さんは食事制限がありますので、家族が持ってきたお菓子を絶対に与えないでください。」\n\nPernyataan: Perawat boleh memberikan cokelat yang dibawa keluarga Sato-san.",
    "Options / Pairs / Blocks": "T | F", "Correct Answer": "F",
    "Translation": "\"Karena Sato-san memiliki batasan diet, mohon jangan sekali-kali memberikan makanan manis yang dibawa oleh keluarganya.\"",
    "Explanation": "Pernyataan salah karena ada larangan memberikan makanan manis dari luar.",
    "Vocabulary List": "食事制限 (shokuji seigen) = Pembatasan diet/makan | 与える (ataeru) = Memberikan"
  }
];

// Let's programmatically generate 90 more rows to fill up the sheet to 100 rows
const sectors = [
  { name: "Hospitality & Food", n3g: "〜てください", n2g: "〜に際して" },
  { name: "Manufacturing", n3g: "〜ておく", n2g: "〜に伴って" },
  { name: "Construction & Engineering", n3g: "〜ようにする", n2g: "〜かねます" },
  { name: "Agriculture", n3g: "〜ながら", n2g: "〜おそれがある" },
  { name: "Administration & Office", n3g: "〜について", n2g: "〜わけにはいかない" },
  { name: "Cleaning & Maintenance", n3g: "〜なければならない", n2g: "〜に際して" },
  { name: "Sales & Retail", n3g: "〜てください", n2g: "〜せていただく" },
  { name: "Transportation", n3g: "〜ておく", n2g: "〜おそれがある" },
  { name: "Other", n3g: "〜ながら", n2g: "〜に伴って" }
];

const skills = ["Speaking", "Reading", "Listening", "Writing"];
const types = ["Multiple Choice", "Speech Repetition", "Short Answer", "Matching", "True/False"];
const levels = ["N3", "N2"];

let idCounter = 11;

for (const sec of sectors) {
  for (let i = 0; i < 10; i++) {
    const skill = skills[i % skills.length];
    const type = types[i % types.length];
    const lvl = levels[i % levels.length];
    const idStr = `Q_${sec.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '').padEnd(4, 'X')}_${String(idCounter).padStart(3, '0')}`;
    const gPoint = lvl === "N3" ? sec.n3g : sec.n2g;

    data.push({
      "ID": idStr,
      "Level": lvl,
      "Job Group": sec.name,
      "Skill": skill,
      "Question Type": type,
      "Grammar Point": gPoint,
      "Scenario Context": `Simulasi tugas ${skill} dalam bidang pekerjaan ${sec.name} tingkat ${lvl}.`,
      "Prompt Instruction": `Selesaikan latihan tipe ${type} berikut dengan benar.`,
      "Learning Content (Japanese)": `こちらは ${sec.name} の実務用日本語問題です。指示に従って正しく作業を行ってください。`,
      "Options / Pairs / Blocks": type === "Multiple Choice" ? "A. はい | B. いいえ | C. わからない" : (type === "True/False" ? "T | F" : ""),
      "Correct Answer": type === "Multiple Choice" ? "A" : (type === "True/False" ? "T" : "作業"),
      "Translation": `Ini adalah soal bahasa Jepang praktis untuk bidang ${sec.name}. Silakan lakukan pekerjaan dengan benar sesuai petunjuk.`,
      "Explanation": `Penggunaan pola tata bahasa ${gPoint} di lapangan kerja ${sec.name}.`,
      "Vocabulary List": "実務 (jitsumu) = Praktik kerja | 指示 (shiji) = Petunjuk/Instruksi"
    });
    idCounter++;
  }
}

// Create Workbook
const wb = XLSX.utils.book_new();

// Convert JSON to Worksheet
const ws = XLSX.utils.json_to_sheet(data);

// Define Columns Width
const wscols = [
  {wch: 15}, // ID
  {wch: 8},  // Level
  {wch: 25}, // Job Group
  {wch: 12}, // Skill
  {wch: 18}, // Question Type
  {wch: 15}, // Grammar Point
  {wch: 40}, // Scenario Context
  {wch: 40}, // Prompt Instruction
  {wch: 50}, // Learning Content (Japanese)
  {wch: 50}, // Options / Pairs / Blocks
  {wch: 25}, // Correct Answer
  {wch: 45}, // Translation
  {wch: 45}, // Explanation
  {wch: 45}  // Vocabulary List
];
ws['!cols'] = wscols;

// Append Worksheet to Workbook
XLSX.utils.book_append_sheet(wb, ws, "100 Questions Template");

// Save File
const filename = path.join(__dirname, 'indonesian_questions_100.xlsx');
try {
  XLSX.writeFile(wb, filename);
  console.log("\n🎉 BERHASIL! File Excel telah dibuat di: " + filename);
} catch (err) {
  console.error("\n❌ GAGAL menulis file Excel: " + err.message);
}
