// IndexedDB local storage utility for KaigoLingo

const DB_NAME = 'kaigolingo_db';
const DB_VERSION = 14;

let dbInstance = null;
let dbPromise = null;

export function initDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      dbPromise = null;
      reject(event.target.error);
    };

    request.onblocked = () => {
      console.warn('Database upgrade blocked. Please close other tabs of this app.');
      if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
      }
      dbPromise = null;
      reject(new Error('Database upgrade blocked. Please close other tabs and refresh.'));
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      
      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
        console.log('Database connection closed due to version change.');
      };

      dbPromise = null;
      
      checkAndSeedDatabase().then(() => {
        resolve(dbInstance);
      }).catch((err) => {
        console.error('Database seed error:', err);
        resolve(dbInstance);
      });
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Dictionary Store (Default + custom scanned words)
      if (!db.objectStoreNames.contains('dictionary')) {
        const dictStore = db.createObjectStore('dictionary', { keyPath: 'id', autoIncrement: true });
        dictStore.createIndex('romaji', 'romaji', { unique: false });
        dictStore.createIndex('isBookmarked', 'isBookmarked', { unique: false });
        dictStore.createIndex('isCustom', 'isCustom', { unique: false });
      }

      // 2. Biometrics Store (Voice signature)
      if (!db.objectStoreNames.contains('biometrics')) {
        db.createObjectStore('biometrics', { keyPath: 'id' });
      }

      // 3. User Progress & Stats Store
      if (!db.objectStoreNames.contains('progress')) {
        db.createObjectStore('progress', { keyPath: 'id' });
      }

      // 4. B2B Compliance Logs Store
      if (!db.objectStoreNames.contains('logs')) {
        const logsStore = db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        logsStore.createIndex('lpkId', 'lpkId', { unique: false });
      }

      // 5. Questions Store
      if (db.objectStoreNames.contains('questions')) {
        db.deleteObjectStore('questions');
      }
      const qStore = db.createObjectStore('questions', { keyPath: 'id' });
      qStore.createIndex('week', 'week', { unique: false });

      // 6. Vocabulary Store
      if (db.objectStoreNames.contains('vocabulary')) {
        db.deleteObjectStore('vocabulary');
      }
      const vStore = db.createObjectStore('vocabulary', { keyPath: 'vocabId' });
      vStore.createIndex('week', 'week', { unique: false });

      // 7. Student Checklists Store (Process Tracker)
      if (!db.objectStoreNames.contains('student_checklists')) {
        db.createObjectStore('student_checklists', { keyPath: 'studentName' });
      }

      // 8. Dorm Rooms Store
      if (!db.objectStoreNames.contains('dorm_rooms')) {
        db.createObjectStore('dorm_rooms', { keyPath: 'roomId' });
      }

      // 9. Financial Ledgers Store
      if (!db.objectStoreNames.contains('financial_ledgers')) {
        db.createObjectStore('financial_ledgers', { keyPath: 'studentName' });
      }

      // 10. Job Listings Store
      if (!db.objectStoreNames.contains('job_listings')) {
        db.createObjectStore('job_listings', { keyPath: 'jobId' });
      }

      // 11. LPK Registrations Store
      if (!db.objectStoreNames.contains('lpk_registrations')) {
        db.createObjectStore('lpk_registrations', { keyPath: 'email' });
      }

      // 12. Referral Claims Store
      if (!db.objectStoreNames.contains('referral_claims')) {
        db.createObjectStore('referral_claims', { keyPath: 'claimId', autoIncrement: true });
      }
    };
  });
}

// Helper: Run transactional database query
function getStore(storeName, mode = 'readonly') {
  return initDB().then((db) => {
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  });
}

// --- DICTIONARY API ---
export async function getDictionary() {
  const store = await getStore('dictionary');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

export async function addDictionaryEntry(entry) {
  const store = await getStore('dictionary', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add({
      kanji: entry.kanji || '',
      romaji: entry.romaji || '',
      indonesian: entry.indonesian || '',
      image: entry.image || null, // Base64 compressed image
      category: entry.category || 'Dasar Perawatan',
      isCustom: entry.isCustom ?? true,
      isBookmarked: entry.isBookmarked ?? false,
      timestamp: Date.now()
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateDictionaryEntry(id, updates) {
  const store = await getStore('dictionary', 'readwrite');
  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const data = getReq.result;
      if (!data) return reject(new Error('Entry not found'));
      const updated = { ...data, ...updates };
      const putReq = store.put(updated);
      putReq.onsuccess = () => resolve(updated);
      putReq.onerror = () => reject(putReq.error);
    };
  });
}

export async function deleteDictionaryEntry(id) {
  const store = await getStore('dictionary', 'readwrite');
  return new Promise((resolve) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
  });
}

// Seed default dictionary if empty
export async function seedDefaultDictionary() {
  const dict = await getDictionary();
  if (dict.length > 0) return;

  const defaults = [
    { kanji: '介助', romaji: 'Kaijo', indonesian: 'Bantuan / Pendampingan Fisik', category: 'Dasar Perawatan', isCustom: false, isBookmarked: true },
    { kanji: '褥瘡', romaji: 'Jokusou', indonesian: 'Luka Tekan / Dekubitus', category: 'Medis', isCustom: false, isBookmarked: true },
    { kanji: '更衣', romaji: 'Koui', indonesian: 'Mengganti Pakaian', category: 'Kehidupan Sehari-hari', isCustom: false, isBookmarked: true },
    { kanji: '食事介助', romaji: 'Shokuji Kaijo', indonesian: 'Bantuan Makan', category: 'Dasar Perawatan', isCustom: false, isBookmarked: false },
    { kanji: '排泄介助', romaji: 'Haisetsu Kaijo', indonesian: 'Bantuan Buang Air', category: 'Dasar Perawatan', isCustom: false, isBookmarked: false },
    { kanji: '移乗', romaji: 'Ijou', indonesian: 'Transfer / Memindahkan Pasien (misal ke Kursi Roda)', category: 'Dasar Perawatan', isCustom: false, isBookmarked: false },
    { kanji: '車椅子', romaji: 'Kuruma Isu', indonesian: 'Kursi Roda', category: 'Alat Bantu', isCustom: false, isBookmarked: false },
    { kanji: 'めまい', romaji: 'Memai', indonesian: 'Pusing / Sakit Kepala Berputar', category: 'Keluhan Pasien', isCustom: false, isBookmarked: false },
    { kanji: '誤嚥', romaji: 'Goen', indonesian: 'Tersedak (Makanan Masuk Saluran Napas)', category: 'Medis', isCustom: false, isBookmarked: false }
  ];

  for (const entry of defaults) {
    await addDictionaryEntry(entry);
  }
}

// --- BIOMETRICS API ---
export async function getVoiceSignature() {
  const store = await getStore('biometrics');
  return new Promise((resolve) => {
    const request = store.get('voice_signature');
    request.onsuccess = () => resolve(request.result ? request.result.signature : null);
  });
}

export async function saveVoiceSignature(signature) {
  const store = await getStore('biometrics', 'readwrite');
  return new Promise((resolve) => {
    const request = store.put({ id: 'voice_signature', signature, updatedAt: Date.now() });
    request.onsuccess = () => resolve(true);
  });
}

// --- USER PROGRESS API ---
const DEFAULT_PROGRESS = {
  id: 'user_stats',
  streak: 0,
  xp: 0,
  coins: 10,
  completedWeeks: [1], // Only week 1 unlocked by default
  dailyPracticeCounts: {}, // tracks practice counts per week
  studyTime: [0, 0, 0, 0, 0, 0, 0], // Monday to Sunday minutes
  lastStudyDate: new Date().toISOString().split('T')[0],
  lpkId: 'lpk_a'
};

export async function getProgress() {
  const store = await getStore('progress');
  return new Promise((resolve) => {
    const request = store.get('user_stats');
    request.onsuccess = () => {
      if (!request.result) {
        // Initialize default
        resolve(DEFAULT_PROGRESS);
      } else {
        resolve(request.result);
      }
    };
  });
}

export async function saveProgress(progress) {
  const store = await getStore('progress', 'readwrite');
  return new Promise((resolve) => {
    const request = store.put(progress);
    request.onsuccess = () => resolve(true);
  });
}

// --- B2B AUDIT LOGS API ---
export async function getLogs(lpkId) {
  const store = await getStore('logs');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const allLogs = request.result;
      if (lpkId) {
        resolve(allLogs.filter(log => log.lpkId === lpkId));
      } else {
        resolve(allLogs);
      }
    };
  });
}

export async function addLog(log) {
  const store = await getStore('logs', 'readwrite');
  return new Promise((resolve) => {
    const request = store.add({
      timestamp: log.timestamp || Date.now(),
      duration: log.duration || 10,
      activity: log.activity || 'Belajar Harian',
      studentName: log.studentName || 'Budi Utomo',
      lpkId: log.lpkId || 'lpk_a',
      isAlumni: log.isAlumni ?? false
    });
    request.onsuccess = () => resolve(request.result);
  });
}

// Seed default logs if empty
export async function seedDefaultLogs() {
  const logs = await getLogs();
  if (logs.length > 0) return;

  const defaultLogs = [
    // LPK Sakura Mitra Internasional (lpk_a)
    { timestamp: Date.now() - 86400000 * 3, duration: 30, activity: 'Latihan Shadowing: Dasar Aisatsu', studentName: 'Budi Utomo', lpkId: 'lpk_a', isAlumni: false },
    { timestamp: Date.now() - 86400000 * 2, duration: 45, activity: 'Kamus Mandiri: Scan Sendok Makan', studentName: 'Budi Utomo', lpkId: 'lpk_a', isAlumni: false },
    { timestamp: Date.now() - 86400000 * 1, duration: 25, activity: 'Belajar Mandiri: Arah Ruangan Panti', studentName: 'Budi Utomo', lpkId: 'lpk_a', isAlumni: false },
    { timestamp: Date.now(), duration: 15, activity: 'Ujian Mingguan (Week 4)', studentName: 'Budi Utomo', lpkId: 'lpk_a', isAlumni: false },
    
    { timestamp: Date.now() - 86400000 * 10, duration: 60, activity: 'Simulasi Wawancara Kerja', studentName: 'Siti Rahma', lpkId: 'lpk_a', isAlumni: true },
    { timestamp: Date.now() - 86400000 * 9, duration: 40, activity: 'Ujian Akhir Kelulusan', studentName: 'Siti Rahma', lpkId: 'lpk_a', isAlumni: true },

    // LPK Prima Husada (lpk_b)
    { timestamp: Date.now() - 86400000 * 2, duration: 20, activity: 'Belajar Mandiri: Salam Kaigo', studentName: 'Agus Wijaya', lpkId: 'lpk_b', isAlumni: false },
    { timestamp: Date.now() - 86400000 * 1, duration: 35, activity: 'Ujian Mingguan (Week 2)', studentName: 'Agus Wijaya', lpkId: 'lpk_b', isAlumni: false },
    
    { timestamp: Date.now() - 86400000 * 12, duration: 50, activity: 'Latihan Ujian JFT-Basic A2', studentName: 'Dewi Lestari', lpkId: 'lpk_b', isAlumni: true }
  ];

  for (const log of defaultLogs) {
    await addLog(log);
  }
}

// --- QUESTIONS & VOCABULARY API ---
export async function getQuestionsByWeek(weekNum) {
  const store = await getStore('questions');
  return new Promise((resolve) => {
    const index = store.index('week');
    const request = index.getAll(IDBKeyRange.only(parseInt(weekNum)));
    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => a.orderIndex - b.orderIndex);
      resolve(results);
    };
  });
}

export async function getVocabByWeek(weekNum) {
  const store = await getStore('vocabulary');
  return new Promise((resolve) => {
    const index = store.index('week');
    const request = index.getAll(IDBKeyRange.only(parseInt(weekNum)));
    request.onsuccess = () => {
      const results = request.result || [];
      results.sort((a, b) => a.orderIndex - b.orderIndex);
      resolve(results);
    };
  });
}

export async function seedQuestionsAndVocab(questionsData, vocabData) {
  // Seed Questions
  await new Promise(async (resolve, reject) => {
    try {
      const qStore = await getStore('questions', 'readwrite');
      const clearReq = qStore.clear();
      clearReq.onsuccess = () => {
        const weeks = Object.keys(questionsData);
        if (weeks.length === 0) return resolve();
        
        weeks.forEach((week) => {
          const list = questionsData[week] || [];
          list.forEach((q, idx) => {
            qStore.put({
              ...q,
              id: `${week}_${idx}`,
              week: parseInt(week),
              orderIndex: idx
            });
          });
        });
        resolve();
      };
      clearReq.onerror = () => reject(clearReq.error);
    } catch (err) {
      reject(err);
    }
  });

  // Seed Vocabulary
  await new Promise(async (resolve, reject) => {
    try {
      const vStore = await getStore('vocabulary', 'readwrite');
      const clearReq = vStore.clear();
      clearReq.onsuccess = () => {
        const weeks = Object.keys(vocabData);
        if (weeks.length === 0) return resolve();
        
        weeks.forEach((week) => {
          const list = vocabData[week] || [];
          list.forEach((v, idx) => {
            vStore.put({
              ...v,
              vocabId: `${week}_${idx}`,
              week: parseInt(week),
              orderIndex: idx
            });
          });
        });
        resolve();
      };
      clearReq.onerror = () => reject(clearReq.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function exportQuestionsAndVocab() {
  const qStore = await getStore('questions');
  const vStore = await getStore('vocabulary');

  const questions = await new Promise((resolve) => {
    const req = qStore.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  const vocabulary = await new Promise((resolve) => {
    const req = vStore.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  const questionsByWeek = {};
  const vocabByWeek = {};

  questions.forEach(q => {
    const w = q.week.toString();
    if (!questionsByWeek[w]) questionsByWeek[w] = [];
    const { id, week, orderIndex, ...cleanQ } = q;
    questionsByWeek[w].push(cleanQ);
  });

  vocabulary.forEach(v => {
    const w = v.week.toString();
    if (!vocabByWeek[w]) vocabByWeek[w] = [];
    const { vocabId, week, orderIndex, ...cleanV } = v;
    vocabByWeek[w].push(cleanV);
  });

  return { questions: questionsByWeek, vocabulary: vocabByWeek };
}

export async function importQuestionsAndVocab(data) {
  const questions = data.questions || {};
  const vocabulary = data.vocabulary || {};
  await seedQuestionsAndVocab(questions, vocabulary);
}

// --- DYNAMIC CLIENT-SIDE DATABASE SEEDER ---
async function checkAndSeedDatabase() {
  const qStore = await getStore('questions');
  const count = await new Promise((resolve) => {
    const req = qStore.count();
    req.onsuccess = () => resolve(req.result);
  });
  
  if (count === 0) {
    console.log("IndexedDB questions store is empty. Generating 25-week caregiver database...");
    const { questions, vocabulary } = generateDynamicCaregiverData();
    await seedQuestionsAndVocab(questions, vocabulary);
    console.log("Successfully seeded 25-week caregiver database in IndexedDB!");
  }
}

function generateDynamicCaregiverData() {
  const languages = [
    { code: "ja", name: "Jepang" },
    { code: "en", name: "Inggris" },
    { code: "ar", name: "Arab" },
    { code: "zh", name: "Mandarin" },
    { code: "ko", name: "Korea" }
  ];

  const rawNouns = [
    ["Tangan", "手", "te", "手", "shǒu", "يد", "yad", "Hand", "hand", "손", "son"],
    ["Kaki", "足", "ashi", "脚", "jiǎo", "قدم", "qadam", "Foot", "foot", "발", "bal"],
    ["Pinggang", "腰", "koshi", "腰", "yāo", "خصر", "khasr", "Waist", "waist", "허리", "heori"],
    ["Kepala", "頭", "atama", "头", "tóu", "رأس", "ra's", "Head", "head", "머리", "meori"],
    ["Punggung", "背中", "senaka", "背", "bèi", "ظهر", "zahr", "Back", "back", "등", "deung"],
    ["Mata", "目", "me", "眼睛", "yǎnjing", "عين", "ayn", "Eye", "eye", "눈", "nun"],
    ["Perut", "お腹", "onaka", "肚子", "dùzi", "بطن", "batn", "Stomach", "stomach", "배", "bae"],
    ["Dada", "胸", "mune", "胸", "xiōng", "صدر", "sadr", "Chest", "chest", "가슴", "gaseum"],
    ["Leher", "首", "kubi", "脖子", "bózi", "رقبة", "raqabah", "Neck", "neck", "목", "mok"],
    ["Toilet", "トイレ", "toire", "洗手间", "xǐshǒujiān", "مرحاض", "mirhad", "Toilet", "toilet", "화장실", "hwajangsil"],
    ["Kamar", "部屋", "heya", "房间", "fángjiān", "غرفة", "ghurfah", "Room", "room", "방", "bang"],
    ["Kantin", "食堂", "shokudou", "食堂", "shítáng", "مطعم", "mat'am", "Dining Room", "dining room", "식당", "sikdang"],
    ["Dapur", "台所", "daidokoro", "厨房", "chúfáng", "مطبخ", "matbakh", "Kitchen", "kitchen", "주방", "jubang"],
    ["Kursi Roda", "車椅子", "kurumaisu", "轮椅", "lúnyǐ", "كرسي متحرك", "kursi mutaharrik", "Wheelchair", "wheelchair", "휠체어", "hwilcheo"],
    ["Tongkat", "杖", "tsue", "拐杖", "guǎizhàng", "عصا", "asa", "Cane", "cane", "지팡이", "jipangi"],
    ["Ranjang", "ベッド", "beddo", "床", "chuáng", "سرير", "sarir", "Bed", "bed", "침대", "chimdae"],
    ["Obat", "薬", "kusuri", "药", "yào", "دواء", "dawa'", "Medicine", "medicine", "약", "yak"],
    ["Selimut", "毛布", "moufu", "毯子", "tǎnzi", "بطانية", "bataniyah", "Blanket", "blanket", "담요", "damyo"],
    ["Popok", "おむつ", "omutsu", "尿布", "niàobù", "حفاضات", "hifadat", "Diaper", "diaper", "기저귀", "gijeogi"],
    ["Sendok", "スプーン", "supuun", "勺子", "sháozi", "ملعقة", "mil'aqah", "Spoon", "spoon", "숟가락", "sutgarak"],
    ["Gelas", "コップ", "koppu", "杯子", "bēizi", "كوب", "kub", "Glass", "glass", "컵", "keop"],
    ["Pakaian", "衣服", "ifuku", "衣服", "yīfu", "ملابس", "malabis", "Clothes", "clothes", "옷", "ot"]
  ];

  const rawVerbs = [
    ["Sakit", "痛い", "itai", "疼", "téng", "مؤلم", "mu'lim", "Painful", "painful", "아프다", "apeuda"],
    ["Bengkak", "腫れている", "harete iru", "肿了", "zhõng le", "متورم", "mutawarrim", "Swollen", "swollen", "부었다", "bueotda"],
    ["Memar", "青あざがある", "aoaza ga aru", "淤青", "yūqīng", "كدمة", "kadmah", "Bruised", "bruised", "멍들었다", "meongdeureotda"],
    ["Lemas", "だるい", "darui", "无力", "wúlì", "ضعيف", "da'if", "Weak", "weak", "나른하다", "nareunhada"],
    ["Gatal", "痒い", "kayui", "痒", "yǎng", "حكة", "hakkah", "Itchy", "itchy", "가렵다", "garyeopda"],
    ["Luka", "怪我をしている", "kega o shite iru", "受伤", "shòushāng", "مجروح", "majruh", "Injured", "injured", "다치다", "dachida"],
    ["Bersih", "きれい", "kirei", "干净", "gānjìng", "نظيف", "nazif", "Clean", "clean", "깨끗하다", "kkaekkeuthada"],
    ["Kanan", "右", "migi", "右边", "yòubiān", "يمين", "yamin", "Right", "right", "오른쪽", "oreunjjok"],
    ["Kiri", "左", "hidari", "左边", "zuǒbiān", "يسار", "yasar", "Left", "left", "왼쪽", "oenjjok"]
  ];

  const rawSubjects = [
    ["Saya", "私", "watashi", "我", "wǒ", "أنا", "ana", "I", "i", "저", "jeo"],
    ["Anda", "あなた", "anata", "您", "nín", "أنت", "anta", "You", "you", "당신", "dangsin"],
    ["Pasien", "利用者様", "riyousha-sama", "患者", "huànzhě", "المريض", "al-marid", "Patient", "patient", "환자", "hwanja"],
    ["Perawat", "介護士", "kaigoshi", "护工", "hùgōng", "الممرض", "al-mumarrid", "Caregiver", "caregiver", "요양보호사", "yoyang-bohosa"],
    ["Bapak Tanaka", "田中さん", "tanaka-san", "田中先生", "tiánzhōng xiānshēng", "السيد تاناكا", "al-sayyid tanaka", "Mr. Tanaka", "Mr. Tanaka", "다나카 씨", "tanaka ssi"],
    ["Ibu Sato", "佐藤さん", "satou-san", "佐藤女士", "zuǒténg nǚshì", "السيدة ساتو", "al-sayyidah satou", "Ms. Sato", "Ms. Sato", "사토 씨", "satou ssi"]
  ];

  const rawActions = [
    ["membantu", "手伝います", "tetsudaimasu", "帮助", "bāngzhù", "يساعد", "yusa'id", "help", "help", "돕습니다", "dopseumnida"],
    ["membersihkan", "掃除します", "souji shimasu", "清洁", "qīngjié", "ينظف", "yunazzif", "clean", "clean", "청소합니다", "cheongsohamnida"],
    ["memeriksa", "確認します", "kakunin shimasu", "检查", "jiǎnchá", "يفحص", "yafhas", "check", "check", "확인합니다", "hwaginhamnida"],
    ["menyiapkan", "準備します", "junbi shimasu", "准备", "zhǔnbèi", "يجهز", "yujahhiz", "prepare", "prepare", "준비합니다", "junbihamnida"],
    ["membawa", "持ちます", "mochimasu", "拿", "ná", "يحمل", "yahmil", "carry", "carry", "들고 있습니다", "deulgo itseumnida"],
    ["mengganti", "交換します", "koukan shimasu", "更换", "gēnghuàn", "يستبدل", "yastabdil", "change", "change", "교체합니다", "gyochehamnida"]
  ];

  const mapRaw = (arr) => arr.map(x => ({
    id: x[0], ja: x[1], ja_r: x[2], zh: x[3], zh_r: x[4], ar: x[5], ar_r: x[6], en: x[7], en_r: x[8], ko: x[9], ko_r: x[10]
  }));

  const nouns = mapRaw(rawNouns);
  const verbs = mapRaw(rawVerbs);
  const subjects = mapRaw(rawSubjects);
  const actions = mapRaw(rawActions);

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "15", "20", "30", "50"];
  const units = [
    { id: "Gelas", ja: "杯", ja_r: "hai", zh: "杯", zh_r: "bēi", ar: "كوب", ar_r: "kub", en: "glass", en_r: "glass", ko: "잔", ko_r: "jan" },
    { id: "Jam", ja: "時間", ja_r: "jikan", zh: "小时", zh_r: "xiǎoshí", ar: "ساعة", ar_r: "sa'ah", en: "hour", en_r: "hour", ko: "시간", ko_r: "sigan" },
    { id: "Menit", ja: "分", ja_r: "fun", zh: "分钟", zh_r: "fēnzhōng", ar: "دقيقة", ar_r: "daqiqah", en: "minute", en_r: "minute", ko: "분", ko_r: "bun" },
    { id: "Obat", ja: "錠", ja_r: "jou", zh: "片药", zh_r: "piàn yào", ar: "حبة دواء", ar_r: "habbat dawa'", en: "pill", en_r: "pill", ko: "알약", ko_r: "alyak" }
  ];

  const coreGreetings = [
    { id: "Selamat Pagi", ja: "おはようございます", ja_r: "ohayou gozaimasu", zh: "早上好", zh_r: "zǎoshang hǎo", ar: "صباح الخير", ar_r: "sabah al-khayr", en: "Good morning", en_r: "good morning", ko: "좋은 아침이에요", ko_r: "joeun achimieyo" },
    { id: "Selamat Siang", ja: "こんにちは", ja_r: "konnichiwa", zh: "下午好", zh_r: "xiàwǔ hǎo", ar: "طاب يومك", ar_r: "tab yawmuk", en: "Good afternoon", en_r: "good afternoon", ko: "안녕하세요", ko_r: "annyeonghaseyo" },
    { id: "Selamat Malam", ja: "こんばんは", ja_r: "konbanwa", zh: "晚上好", zh_r: "wǎnshàng hǎo", ar: "مساء الخير", ar_r: "masa' al-khayr", en: "Good evening", en_r: "good evening", ko: "안녕하세요", ko_r: "annyeonghaseyo" },
    { id: "Selamat Tidur", ja: "おやすみなさい", ja_r: "oyasuminasai", zh: "晚安", zh_r: "wǎn'ān", ar: "تصبح على خير", ar_r: "tusbih ala khayr", en: "Good night", en_r: "good night", ko: "안녕히 주무세요", ko_r: "annyeonghi jumuseyo" },
    { id: "Tunggu Sebentar", ja: "少々お待ちください", ja_r: "shoushou omachi kudasai", zh: "请稍等", zh_r: "qǐng shāo děng", ar: "انتظر لحظة من فضلك", ar_r: "intazir lahzah min fadlak", en: "Please wait a moment", en_r: "please wait a moment", ko: "잠깐만 기다려 주세요", ko_r: "jamkkanman gidaryeo juseyo" },
    { id: "Terima Kasih Kerja Kerasnya", ja: "お疲れ様です", ja_r: "otsukaresama desu", zh: "辛苦了", zh_r: "xīnkǔle", ar: "شكرا لجهودكم", ar_r: "shukran lijuhudikum", en: "Thank you for your hard work", en_r: "thank you for your hard work", ko: "수고하셨습니다", ko_r: "sugohashyeotseumnida" },
    { id: "Permisi Masuk", ja: "お邪魔します", ja_r: "ojama shimasu", zh: "打扰一下", zh_r: "dǎrǎo yīxià", ar: "تفضل بالدخول", ar_r: "tafaddal bil-dukhul", en: "Excuse me for entering", en_r: "excuse me for entering", ko: "실례하겠습니다", ko_r: "sillyehagesseumnida" },
    { id: "Dimengerti / Baik", ja: "かしこまりました", ja_r: "kashikomarimashita", zh: "知道了", zh_r: "zhīdàole", ar: "مفهوم", ar_r: "mafhum", en: "Understood / Yes, sir", en_r: "understood", ko: "알겠습니다", ko_r: "algetseumnida" },
    { id: "Permisi Mengganggu", ja: "失礼します", ja_r: "shitsurei shimasu", zh: "打扰了", zh_r: "dǎrǎole", ar: "عذراً", ar_r: "udhran", en: "Excuse me", en_r: "excuse me", ko: "실례합니다", ko_r: "sillyehamnida" },
    { id: "Maaf", ja: "すみません", ja_r: "sumimasen", zh: "抱歉", zh_r: "bàoqiàn", ar: "آسف", ar_r: "asif", en: "Sorry", en_r: "sorry", ko: "죄송합니다", ko_r: "joesonghamnida" },
    { id: "Tolong", ja: "お願いします", ja_r: "onegai shimasu", zh: "拜托了", zh_r: "bàituō le", ar: "من فضلك", ar_r: "min fadlak", en: "Please", en_r: "please", ko: "부탁합니다", ko_r: "butakhamnida" },
    { id: "Silakan", ja: "どうぞ", ja_r: "douzo", zh: "请", zh_r: "qǐng", ar: "تفضل", ar_r: "tafaddal", en: "Here you go / Please", en_r: "please go ahead", ko: "어서 오세요", ko_r: "eoseo oseyo" },
    { id: "Sama-sama", ja: "どういたしまして", ja_r: "douitashimashite", zh: "不客气", zh_r: "bù kèqi", ar: "على الرحب والسعة", ar_r: "ala al-rahb wa al-si'ah", en: "You are welcome", en_r: "you are welcome", ko: "천만에요", ko_r: "cheonmaneyo" },
    { id: "Hati-hati", ja: "気をつけてください", ja_r: "ki o tsukete kudasai", zh: "请小心", zh_r: "qǐng xiǎoxīn", ar: "انتبه", ar_r: "intabih", en: "Please take care", en_r: "please take care", ko: "조심하세요", ko_r: "josimhaseyo" }
  ];

  const level1 = [];
  coreGreetings.forEach(g => level1.push(g));
  nouns.forEach(n => level1.push(n));
  verbs.forEach(v => level1.push(v));
  subjects.forEach(s => level1.push(s));

  const level2 = [];
  nouns.forEach(n => {
    verbs.forEach(v => {
      let ja_combo = `${n.ja}が${v.ja}`;
      let ja_romaji = `${n.ja_r} ga ${v.ja_r}`;
      if (v.id === "Kanan" || v.id === "Kiri") {
        ja_combo = `${n.ja}は${v.ja}です`;
        ja_romaji = `${n.ja_r} wa ${v.ja_r} desu`;
      }
      let zh_combo = `${n.zh}${v.zh}`;
      let zh_romaji = `${n.zh_r} ${v.zh_r}`;
      let ar_combo = `ألم في الـ${n.ar}`;
      let ar_romaji = `alam fi al-${n.ar_r}`;
      let en_combo = `${n.en} pain`;
      let en_romaji = `${n.en_r} pain`;
      let ko_combo = `${n.ko} ${v.ko}`;
      let ko_romaji = `${n.ko_r} ${v.ko_r}`;
      level2.push({
        id: `${n.id} ${v.id}`, ja: ja_combo, ja_r: ja_romaji, zh: zh_combo, zh_r: zh_romaji,
        ar: ar_combo, ar_r: ar_romaji, en: en_combo, en_r: en_romaji, ko: ko_combo, ko_r: ko_romaji
      });
    });
  });

  const level3 = [];
  subjects.forEach(s => {
    actions.forEach(act => {
      nouns.forEach(n => {
        level3.push({
          id: `${s.id} ${act.id} ${n.id}`,
          ja: `${s.ja}は${n.ja}を${act.ja}`,
          ja_r: `${s.ja_r} wa ${n.ja_r} o ${act.ja_r}`,
          zh: `${s.zh}${act.zh}${n.zh}`,
          zh_r: `${s.zh_r} ${act.zh_r} ${n.zh_r}`,
          ar: `${s.ar} ${act.ar} الـ${n.ar}`,
          ar_r: `${s.ar_r} ${act.ar_r} al-${n.ar_r}`,
          en: `${s.en} ${act.en} ${n.en}`,
          en_r: `${s.en_r} ${act.en_r} ${n.en_r}`,
          ko: `${s.ko}가 ${n.ko}을/를 ${act.ko}`,
          ko_r: `${s.ko_r}ga ${n.ko_r}eul ${act.ko_r}`
        });
      });
    });
  });

  const level4 = [];
  numbers.forEach(num => {
    units.forEach(u => {
      level4.push({
        id: `${num} ${u.id}`, ja: `${num}${u.ja}`, ja_r: `${num} ${u.ja_r}`, zh: `${num}${u.zh}`, zh_r: `${num} ${u.zh_r}`,
        ar: `${num} ${u.ar}`, ar_r: `${num} ${u.ar_r}`, en: `${num} ${u.en}`, en_r: `${num} ${u.en_r}`, ko: `${num} ${u.ko}`, ko_r: `${num} ${u.ko_r}`
      });
    });
  });

  const level5 = [];
  nouns.forEach(n => {
    verbs.forEach(v => {
      ["Kanan", "Kiri"].forEach(dir => {
        let dirJa = dir === "Kanan" ? "右" : "左";
        let dirRomaji = dir === "Kanan" ? "migi" : "hidari";
        let dirZh = dir === "Kanan" ? "右" : "左";
        let dirAr = dir === "Kanan" ? "الأيمن" : "الأيسر";
        let dirEn = dir === "Kanan" ? "right" : "left";
        let dirKo = dir === "Kanan" ? "오른쪽" : "왼쪽";
        level5.push({
          id: `${n.id} ${dir} ${v.id}`,
          ja: `${dirJa}の${n.ja}が${v.ja}`,
          ja_r: `${dirRomaji} no ${n.ja_r} ga ${v.ja_r}`,
          zh: `${dirZh}边${n.zh}${v.zh}`,
          zh_r: `${dirRomaji} bian ${n.zh_r} ${v.zh_r}`,
          ar: `ألم di الـ${n.ar} ${dirAr}`,
          ar_r: `alam fi al-${n.ar_r} ${dirRomaji}`,
          en: `${dirEn} ${n.en} is ${v.en}`,
          en_r: `${dirEn} ${n.en_r} is ${v.en_r}`,
          ko: `${dirKo} ${n.ko}이/가 ${v.ko}`,
          ko_r: `${dirKo} ${n.ko_r}i/ga ${v.ko_r}`
        });
      });
    });
  });

  const level6 = [];
  for (let i = 1; i <= 1500; i++) {
    const n = nouns[i % nouns.length];
    const s = subjects[Math.floor(i / nouns.length) % subjects.length];
    level6.push({
      id: `${s.id} memeriksa ${n.id} ke-${i}`,
      ja: `${s.ja}は${n.ja}を確認します-${i}`,
      ja_r: `${s.ja_r} wa ${n.ja_r} o kakunin shimasu ${i}`,
      zh: `${s.zh}检查${n.zh}-${i}`,
      zh_r: `${s.zh_r} jiǎnchá ${n.zh_r} ${i}`,
      ar: `${s.ar} ي체크 الـ${n.ar}-${i}`,
      ar_r: `${s.ar_r} yafhas al-${n.ar_r} ${i}`,
      en: `${s.en} checks ${n.en} no.${i}`,
      en_r: `${s.en_r} checks ${n.en_r} ${i}`,
      ko: `${s.ko}가 ${n.ko}을 확인합니다-${i}`,
      ko_r: `${s.ko_r}ga ${n.ko_r}eul hwaginhapnida ${i}`
    });
  }

  const vocabByWeek = {};
  const questionsByWeek = {};
  for (let w = 1; w <= 25; w++) {
    vocabByWeek[w.toString()] = [];
    questionsByWeek[w.toString()] = [];
  }

  const distributeToWeeks = (items, startWeek, endWeek, targetPerWeek) => {
    let itemIdx = 0;
    for (let w = startWeek; w <= endWeek; w++) {
      const weekStr = w.toString();
      for (let count = 0; count < targetPerWeek; count++) {
        const v = items[itemIdx % items.length];
        const translations = {
          zh: { target: v.zh, phonetic: v.zh_r },
          ko: { target: v.ko, phonetic: v.ko_r },
          ar: { target: v.ar, phonetic: v.ar_r },
          en: { target: v.en, phonetic: v.en_r }
        };
        vocabByWeek[weekStr].push({
          ja: v.ja,
          romaji: v.ja_r,
          id: v.id,
          context: `Latihan bahasa perawat (Kaigo) bagian ke-${itemIdx + 1}.`,
          tip: "Gunakan kalimat ini dalam operasional panti lansia.",
          example: `${v.ja} desu.`,
          translations: translations
        });
        itemIdx++;
      }
    }
  };

  distributeToWeeks(level1, 1, 4, 40);
  distributeToWeeks(level2, 5, 8, 80);
  distributeToWeeks(level3, 9, 12, 120);
  distributeToWeeks(level4, 13, 16, 150);
  distributeToWeeks(level5, 17, 20, 180);
  distributeToWeeks(level6, 21, 25, 240);

  const skillsList = ["Listening", "Speaking", "Reading", "Writing"];
  for (let w = 1; w <= 25; w++) {
    const weekVocab = vocabByWeek[w.toString()] || [];
    if (weekVocab.length === 0) continue;

    let allowedTypes = ["B", "A", "E", "F", "D"];
    if (w >= 9) { allowedTypes = ["B", "A", "E", "F", "D", "C"]; }

    for (let qIdx = 0; qIdx < 10; qIdx++) {
      const mainVocab = weekVocab[qIdx % weekVocab.length];
      const typeCode = allowedTypes[qIdx % allowedTypes.length];
      const skill = skillsList[qIdx % skillsList.length];
      const qId = `Q_WEEK_${w}_${qIdx + 1}`;
      const wrong1 = weekVocab[(qIdx + 1) % weekVocab.length];
      const wrong2 = weekVocab[(qIdx + 2) % weekVocab.length];
      const mcCorrect = `${mainVocab.ja}: ${mainVocab.romaji} (${mainVocab.id})`;

      let promptText = "";
      if (typeCode === "B") { promptText = `Pilih istilah bahasa Jepang yang tepat untuk arti: "${mainVocab.id}"`; } 
      else if (typeCode === "A") { promptText = "Pasangkan kosakata bahasa Jepang perawat berikut dengan artinya yang sesuai:"; } 
      else if (typeCode === "D") { promptText = `Ucapkan kata berikut dengan lafal yang benar: "${mainVocab.ja}" (${mainVocab.id})`; } 
      else if (typeCode === "C") { promptText = `Ketik ejaan Romaji yang tepat untuk kata: "${mainVocab.ja}" (${mainVocab.id})`; }
      else if (typeCode === "E") { promptText = "Dengarkan audio berikut dan pilih arti bahasa Indonesia yang tepat:"; }
      else if (typeCode === "F") { promptText = "Dengarkan audio berikut dan ketik ejaan Romaji/lafal yang tepat:"; }

      const qObj = {
        id: qId, jobCategory: "Healthcare", level: w <= 8 ? "N5" : w <= 16 ? "N4" : "N3",
        type: typeCode, prompt: promptText, meaning: mainVocab.id, explanation_id: "Dapatkan ejaan lafal asli dan pilih arti kata yang tepat.",
        audioText: mainVocab.ja, targetJa: mainVocab.ja, romaji: mainVocab.romaji,
        targetRomaji: (typeCode === "C" || typeCode === "F") ? mainVocab.romaji.toLowerCase().replace(/[\s\-]/g, '') : "",
        options: typeCode === "B" 
          ? [mcCorrect, `${wrong1.ja}: ${wrong1.romaji} (${wrong1.id})`, `${wrong2.ja}: ${wrong2.romaji} (${wrong2.id})`] 
          : typeCode === "E"
            ? [mainVocab.id, wrong1.id, wrong2.id]
            : [],
        pairs: typeCode === "A" ? [
          { ja: mainVocab.ja, id: mainVocab.id, romaji: mainVocab.romaji }, 
          { ja: wrong1.ja, id: wrong1.id, romaji: wrong1.romaji }, 
          { ja: wrong2.ja, id: wrong2.id, romaji: wrong2.romaji }
        ] : [],
        answer: 0, skill: skill, week: w.toString(),
        translations: { 
          ja: { 
            targetText: mainVocab.ja, 
            phonetic: mainVocab.romaji, 
            options: typeCode === "B" 
              ? [mcCorrect, `${wrong1.ja}: ${wrong1.romaji} (${wrong1.id})`, `${wrong2.ja}: ${wrong2.romaji} (${wrong2.id})`] 
              : typeCode === "E"
                ? [mainVocab.id, wrong1.id, wrong2.id]
                : [], 
            correctAnswer: typeCode === "E" ? mainVocab.id : mcCorrect, 
            pairs: typeCode === "A" ? [{ ja: mainVocab.ja, id: mainVocab.id, romaji: mainVocab.romaji }, { ja: wrong1.ja, id: wrong1.id, romaji: wrong1.romaji }, { ja: wrong2.ja, id: wrong2.id, romaji: wrong2.romaji }] : [] 
          } 
        }
      };

      languages.filter(l => l.code !== 'ja').forEach(l => {
        const t = mainVocab.translations[l.code] || { target: mainVocab.ja, phonetic: mainVocab.romaji };
        const tw1 = wrong1.translations[l.code] || { target: wrong1.ja, phonetic: wrong1.romaji };
        const tw2 = wrong2.translations[l.code] || { target: wrong2.ja, phonetic: wrong2.romaji };

        const lCorrect = `${t.target}: ${t.phonetic} (${mainVocab.id})`;
        const lWrong1 = `${tw1.target}: ${tw1.phonetic} (${wrong1.id})`;
        const lWrong2 = `${tw2.target}: ${tw2.phonetic} (${wrong2.id})`;

        qObj.translations[l.code] = {
          targetText: t.target,
          phonetic: t.phonetic,
          options: typeCode === "B" 
            ? [lCorrect, lWrong1, lWrong2] 
            : typeCode === "E"
              ? [mainVocab.id, wrong1.id, wrong2.id]
              : [],
          correctAnswer: typeCode === "E" ? mainVocab.id : lCorrect,
          pairs: typeCode === "A" ? [
            { ja: t.target, id: mainVocab.id, romaji: t.phonetic },
            { ja: tw1.target, id: wrong1.id, romaji: tw1.phonetic },
            { ja: tw2.target, id: wrong2.id, romaji: tw2.phonetic }
          ] : []
        };
      });

      questionsByWeek[w.toString()].push(qObj);
    }
  }

  return { questions: questionsByWeek, vocabulary: vocabByWeek };
}

export async function resetDB() {
  dbInstance = null;
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// --- STUDENT CHECKLISTS API ---
export async function getStudentChecklist(studentName) {
  const store = await getStore('student_checklists');
  return new Promise((resolve) => {
    const request = store.get(studentName);
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => resolve(null);
  });
}

export async function updateStudentChecklist(studentName, checklistData) {
  const store = await getStore('student_checklists', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put({
      studentName,
      ...checklistData,
      lastUpdated: Date.now()
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllStudentChecklists() {
  const store = await getStore('student_checklists');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result || []);
    };
    request.onerror = () => resolve([]);
  });
}

export async function seedDefaultChecklists(force = false) {
  // Call new B2B seed functions first (self-guarding)
  try {
    await seedDormRooms(force);
    await seedFinancialLedgers(force);
    await seedJobListings(force);
    await seedRegistrations(force);
    await seedReferralClaims(force);
    await seedDynamicVocab(force);
  } catch (err) {
    console.error("B2B Seeding failed: ", err);
  }

  const store = await getStore('student_checklists', 'readwrite');
  
  if (force) {
    await new Promise((resolve) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } else {
    // Check if already seeded with at least the 17 default students
    const checkReq = store.getAll();
    const existing = await new Promise(resolve => {
      checkReq.onsuccess = () => resolve(checkReq.result || []);
      checkReq.onerror = () => resolve([]);
    });
    
    if (existing.length >= 17) return;
  }

  const defaultChecklists = [
    {
      studentName: 'Budi Utomo',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Hendra Wijaya',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Agus Wijaya',
      lpkId: 'lpk_b',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Yuki Pratama',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Siti Rahma',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Rina Melati',
      lpkId: 'lpk_b',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Rudi Hermawan',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Bayu Segara',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Ahmad Fikri',
      lpkId: 'lpk_b',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Dewi Lestari',
      lpkId: 'lpk_b',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed',
        matching_wawancara: 'completed',
        matching_match: 'completed',
        persiapan_dokumen: 'completed',
        persiapan_mental: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Sinta Bella',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed',
        matching_wawancara: 'completed',
        matching_match: 'completed',
        persiapan_dokumen: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Larasati',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed',
        matching_wawancara: 'completed',
        matching_match: 'completed',
        persiapan_dokumen: 'completed',
        persiapan_mental: 'completed',
        persiapan_kesehatan: 'completed',
        persiapan_checkout: 'completed',
        persiapan_pelunasan: 'completed',
        penempatan_kontrak: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Bambang Pratama',
      lpkId: 'lpk_b',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed',
        matching_wawancara: 'completed',
        matching_match: 'completed',
        persiapan_dokumen: 'completed',
        persiapan_mental: 'completed',
        persiapan_kesehatan: 'completed',
        persiapan_checkout: 'completed',
        persiapan_pelunasan: 'completed',
        penempatan_kontrak: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Fahri Hamzah',
      lpkId: 'lpk_b',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed',
        matching_wawancara: 'completed',
        matching_match: 'completed',
        persiapan_dokumen: 'completed',
        persiapan_mental: 'completed',
        persiapan_kesehatan: 'completed',
        persiapan_checkout: 'completed',
        persiapan_pelunasan: 'completed',
        penempatan_kontrak: 'completed',
        penempatan_tiket: 'completed',
        penempatan_penjemputan: 'completed',
        alumni_komunitas: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Andi Wijaya',
      lpkId: 'lpk_a',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed',
        matching_wawancara: 'completed',
        matching_match: 'completed',
        persiapan_dokumen: 'completed',
        persiapan_mental: 'completed',
        persiapan_kesehatan: 'completed',
        persiapan_checkout: 'completed',
        persiapan_pelunasan: 'completed',
        penempatan_kontrak: 'completed',
        penempatan_tiket: 'completed',
        penempatan_penjemputan: 'completed',
        alumni_komunitas: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Eka Putri',
      lpkId: 'lpk_b',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed',
        matching_wawancara: 'completed',
        matching_match: 'completed',
        persiapan_dokumen: 'completed',
        persiapan_mental: 'completed',
        persiapan_kesehatan: 'completed',
        persiapan_checkout: 'completed',
        persiapan_pelunasan: 'completed',
        penempatan_kontrak: 'completed',
        penempatan_tiket: 'completed',
        penempatan_penjemputan: 'completed',
        alumni_komunitas: 'completed',
        alumni_referensi: 'completed',
        evaluasi_budaya: 'completed'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Diana Puspita',
      lpkId: 'lpk_b',
      statuses: {
        daftar_website: 'completed',
        daftar_wa: 'completed',
        daftar_google_form: 'completed',
        daftar_ref: 'completed',
        daftar_trial: 'completed',
        daftar_booking: 'completed',
        seleksi_doc: 'completed',
        seleksi_cek_fisik: 'completed',
        seleksi_interview: 'completed',
        seleksi_job_desc: 'completed',
        seleksi_room_check: 'completed',
        seleksi_biaya: 'completed',
        pelatihan_budaya: 'completed',
        pelatihan_bahasa: 'completed',
        pelatihan_kurikulum: 'completed',
        pelatihan_asrama: 'completed',
        pelatihan_skill: 'completed',
        pelatihan_penilaian: 'completed',
        matching_job_offer: 'completed',
        matching_video: 'completed',
        matching_wawancara: 'completed',
        matching_match: 'completed',
        persiapan_dokumen: 'completed',
        persiapan_mental: 'completed',
        persiapan_kesehatan: 'completed',
        persiapan_checkout: 'completed',
        persiapan_pelunasan: 'completed',
        penempatan_kontrak: 'completed',
        penempatan_tiket: 'completed',
        penempatan_penjemputan: 'completed',
        alumni_komunitas: 'completed',
        alumni_referensi: 'completed',
        evaluasi_budaya: 'completed'
      },
      documents: {},
      notes: {}
    }
  ];

  for (const checklist of defaultChecklists) {
    await store.put({
      ...checklist,
      lastUpdated: Date.now()
    });
  }

}

// --- DORM ROOMS API ---
export async function getDormRooms() {
  const store = await getStore('dorm_rooms');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function saveDormRoom(room) {
  const store = await getStore('dorm_rooms', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(room);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function seedDormRooms(force = false) {
  const store = await getStore('dorm_rooms', 'readwrite');
  if (force) {
    await new Promise((resolve) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } else {
    const rooms = await getDormRooms();
    if (rooms.length > 0) return;
  }

  const defaultRooms = [
    { roomId: 'A1', name: 'Asrama Sakura - Kamar A1', beds: [
      { bedId: 'A1_1', status: 'occupied', studentName: 'Budi Utomo' },
      { bedId: 'A1_2', status: 'occupied', studentName: 'Hendra Wijaya' },
      { bedId: 'A1_3', status: 'available', studentName: '' },
      { bedId: 'A1_4', status: 'available', studentName: '' }
    ]},
    { roomId: 'A2', name: 'Asrama Sakura - Kamar A2', beds: [
      { bedId: 'A2_1', status: 'occupied', studentName: 'Siti Rahma' },
      { bedId: 'A2_2', status: 'occupied', studentName: 'Rina Melati' }
    ]},
    { roomId: 'B1', name: 'Asrama Prima - Kamar B1', beds: [
      { bedId: 'B1_1', status: 'occupied', studentName: 'Agus Wijaya' },
      { bedId: 'B1_2', status: 'occupied', studentName: 'Dewi Lestari' },
      { bedId: 'B1_3', status: 'occupied', studentName: 'Yuki Pratama' }
    ]}
  ];

  for (const r of defaultRooms) {
    await saveDormRoom(r);
  }
}

// --- FINANCIAL LEDGERS API ---
export async function getFinancialLedgers() {
  const store = await getStore('financial_ledgers');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function getFinancialLedger(studentName) {
  const store = await getStore('financial_ledgers');
  return new Promise((resolve) => {
    const request = store.get(studentName);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function updateFinancialLedger(ledger) {
  const store = await getStore('financial_ledgers', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(ledger);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function seedFinancialLedgers(force = false) {
  const store = await getStore('financial_ledgers', 'readwrite');
  if (force) {
    await new Promise((resolve) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } else {
    const ledgers = await getFinancialLedgers();
    if (ledgers.length >= 17) return;
  }

  const defaultLedgers = [
    {
      studentName: 'Budi Utomo',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 5000000,
      remainingAmount: 10000000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [
        { month: 'Bulan 1', amount: 1000000, status: 'pending' },
        { month: 'Bulan 2', amount: 1000000, status: 'pending' },
        { month: 'Bulan 3', amount: 1000000, status: 'pending' },
        { month: 'Bulan 4', amount: 1000000, status: 'pending' },
        { month: 'Bulan 5', amount: 1000000, status: 'pending' },
        { month: 'Bulan 6', amount: 1000000, status: 'pending' },
        { month: 'Bulan 7', amount: 1000000, status: 'pending' },
        { month: 'Bulan 8', amount: 1000000, status: 'pending' },
        { month: 'Bulan 9', amount: 1000000, status: 'pending' },
        { month: 'Bulan 10', amount: 1000000, status: 'pending' }
      ],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Siti Rahma',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 15000000,
      remainingAmount: 0,
      isBridgingLoan: false,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'received'
    },
    {
      studentName: 'Agus Wijaya',
      lpkId: 'lpk_b',
      program: 'seizogyo',
      totalCost: 12000000,
      paidAmount: 2000000,
      remainingAmount: 10000000,
      isBridgingLoan: true,
      loanPaidToDate: 2000000,
      loanInstallments: [
        { month: 'Bulan 1', amount: 2000000, status: 'paid' },
        { month: 'Bulan 2', amount: 2000000, status: 'pending' },
        { month: 'Bulan 3', amount: 2000000, status: 'pending' },
        { month: 'Bulan 4', amount: 2000000, status: 'pending' },
        { month: 'Bulan 5', amount: 2000000, status: 'pending' }
      ],
      agencyCommission: 4000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Dewi Lestari',
      lpkId: 'lpk_b',
      program: 'seizogyo',
      totalCost: 12000000,
      paidAmount: 12000000,
      remainingAmount: 0,
      isBridgingLoan: false,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 4000000,
      commissionStatus: 'received'
    },
    {
      studentName: 'Rudi Hermawan',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 1500000,
      remainingAmount: 13500000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Larasati',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 10000000,
      remainingAmount: 5000000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Fahri Hamzah',
      lpkId: 'lpk_b',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 15000000,
      remainingAmount: 0,
      isBridgingLoan: false,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'received'
    },
    {
      studentName: 'Eka Putri',
      lpkId: 'lpk_b',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 12000000,
      remainingAmount: 3000000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Hendra Wijaya',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 0,
      remainingAmount: 15000000,
      isBridgingLoan: false,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Yuki Pratama',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 2200000,
      remainingAmount: 12800000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Rina Melati',
      lpkId: 'lpk_b',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 5000000,
      remainingAmount: 10000000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Bayu Segara',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 1500000,
      remainingAmount: 13500000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Ahmad Fikri',
      lpkId: 'lpk_b',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 15000000,
      remainingAmount: 0,
      isBridgingLoan: false,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'received'
    },
    {
      studentName: 'Sinta Bella',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 10000000,
      remainingAmount: 5000000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    },
    {
      studentName: 'Bambang Pratama',
      lpkId: 'lpk_b',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 20000000,
      remainingAmount: 0,
      isBridgingLoan: false,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'received'
    },
    {
      studentName: 'Andi Wijaya',
      lpkId: 'lpk_a',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 15000000,
      remainingAmount: 0,
      isBridgingLoan: false,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'received'
    },
    {
      studentName: 'Diana Puspita',
      lpkId: 'lpk_b',
      program: 'kaigo',
      totalCost: 15000000,
      paidAmount: 14000000,
      remainingAmount: 1000000,
      isBridgingLoan: true,
      loanPaidToDate: 0,
      loanInstallments: [],
      agencyCommission: 5000000,
      commissionStatus: 'pending'
    }
  ];

  for (const l of defaultLedgers) {
    await updateFinancialLedger(l);
  }
}

// --- JOB LISTINGS API ---
export async function getJobListings() {
  const store = await getStore('job_listings');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function addJobListing(job) {
  const store = await getStore('job_listings', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(job);
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function seedJobListings() {
  const jobs = await getJobListings();
  if (jobs.length > 0) return;

  const defaultJobs = [
    { jobId: 'job_1', title: 'Perawat Lansia Senior', company: 'Sakura Care Home, Tokyo', salary: 190000, requirements: 'JLPT N4 / JFT-Basic A2 + SSW Caregiver', program: 'kaigo', slots: 5 },
    { jobId: 'job_2', title: 'Asisten Pendamping Mandiri', company: 'Osaka Elderly Center, Osaka', salary: 185000, requirements: 'JLPT N4 / JFT-Basic A2 + SSW Caregiver', program: 'kaigo', slots: 3 },
    { jobId: 'job_3', title: 'Operator Perakitan Otomotif', company: 'Toyota Kanto Plant, Kanagawa', salary: 210000, requirements: 'JLPT N4 + SSW Seizogyo', program: 'seizogyo', slots: 10 },
    { jobId: 'job_4', title: 'Pekerja Konstruksi Struktur', company: 'Kajima Construction, Kyoto', salary: 220000, requirements: 'JLPT N5 + SSW Kensetsugyo', program: 'kensetsugyo', slots: 8 },
    { jobId: 'job_5', title: 'Pemeliharaan Tanaman & Panen', company: 'Hokkaido Farms, Hokkaido', salary: 175000, requirements: 'SSW Nogyo', program: 'nogyo', slots: 12 }
  ];

  for (const j of defaultJobs) {
    await addJobListing(j);
  }
}

// --- LPK REGISTRATIONS API ---
export async function getRegistrations() {
  const store = await getStore('lpk_registrations');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function addRegistration(reg) {
  const store = await getStore('lpk_registrations', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put({
      email: reg.email,
      name: reg.name,
      phone: reg.phone,
      height: parseInt(reg.height) || 0,
      weight: parseInt(reg.weight) || 0,
      education: reg.education || 'SMA',
      colorBlind: reg.colorBlind || 'no',
      program: reg.program || 'kaigo',
      status: reg.status || 'applied',
      date: reg.date || new Date().toISOString().split('T')[0]
    });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function updateRegistrationStatus(email, status) {
  const store = await getStore('lpk_registrations', 'readwrite');
  return new Promise((resolve, reject) => {
    const getReq = store.get(email);
    getReq.onsuccess = () => {
      const data = getReq.result;
      if (!data) return reject(new Error('Registration not found'));
      data.status = status;
      const putReq = store.put(data);
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = () => reject(putReq.error);
    };
  });
}

export async function seedRegistrations() {
  const regs = await getRegistrations();
  if (regs.length > 0) return;

  const defaultRegs = [
    { email: 'eko@gmail.com', name: 'Eko Prasetyo', phone: '08123456789', height: 165, weight: 60, education: 'SMK Keperawatan', colorBlind: 'no', program: 'kaigo', status: 'short_listed', date: '2026-06-30' },
    { email: 'ratna@gmail.com', name: 'Ratna Sari', phone: '08223456789', height: 155, weight: 48, education: 'SMA', colorBlind: 'no', program: 'kaigo', status: 'applied', date: '2026-07-01' },
    { email: 'joko@gmail.com', name: 'Joko Widodo', phone: '08323456789', height: 145, weight: 55, education: 'SMK Teknik', colorBlind: 'yes', program: 'seizogyo', status: 'rejected', date: '2026-07-02' }
  ];

  for (const r of defaultRegs) {
    await addRegistration(r);
  }
}

// --- REFERRAL CLAIMS API ---
export async function getReferralClaims() {
  const store = await getStore('referral_claims');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function addReferralClaim(claim) {
  const store = await getStore('referral_claims', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add({
      referrerName: claim.referrerName,
      referrerRole: claim.referrerRole || 'alumni',
      referredStudent: claim.referredStudent,
      rewardAmount: claim.rewardAmount || 1000000,
      status: claim.status || 'pending',
      date: claim.date || new Date().toISOString().split('T')[0]
    });
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
}

export async function updateReferralStatus(claimId, status) {
  const store = await getStore('referral_claims', 'readwrite');
  return new Promise((resolve, reject) => {
    const getReq = store.get(claimId);
    getReq.onsuccess = () => {
      const data = getReq.result;
      if (!data) return reject(new Error('Claim not found'));
      data.status = status;
      const putReq = store.put(data);
      putReq.onsuccess = () => resolve(true);
      putReq.onerror = () => reject(putReq.error);
    };
  });
}

export async function seedReferralClaims() {
  const claims = await getReferralClaims();
  if (claims.length > 0) return;

  const defaultClaims = [
    { referrerName: 'Siti Rahma', referrerRole: 'alumni', referredStudent: 'Eko Prasetyo', rewardAmount: 1000000, status: 'pending', date: '2026-07-01' },
    { referrerName: 'Staff Andi', referrerRole: 'staff', referredStudent: 'Agus Wijaya', rewardAmount: 500000, status: 'approved', date: '2026-06-25' }
  ];

  for (const c of defaultClaims) {
    await addReferralClaim(c);
  }
}

// --- Dynamic Vocabulary Seeding Logic ---
export async function seedDynamicVocab() {
  const store = await getStore('vocabulary', 'readwrite');
  const additionalVocabs = [
    { vocabId: 'seizogyo_1', word: '安全第一', reading: 'Anzen Daiichi', meaning: 'Utamakan Keselamatan', week: 1, category: 'Pabrik', orderIndex: 0 },
    { vocabId: 'seizogyo_2', word: '作業服', reading: 'Sagyoufuku', meaning: 'Baju Kerja Pabrik', week: 1, category: 'Pabrik', orderIndex: 1 },
    { vocabId: 'seizogyo_3', word: '点検', reading: 'Tenken', meaning: 'Inspeksi / Pemeriksaan', week: 2, category: 'Pabrik', orderIndex: 0 },
    { vocabId: 'kensetsugyo_1', word: 'ヘルメット', reading: 'Herumetto', meaning: 'Helm Proyek', week: 1, category: 'Konstruksi', orderIndex: 0 },
    { vocabId: 'kensetsugyo_2', word: '足場', reading: 'Ashiba', meaning: 'Scaffolding / Stang Perancah', week: 1, category: 'Konstruksi', orderIndex: 1 },
    { vocabId: 'kensetsugyo_3', word: '図面', reading: 'Zumen', meaning: 'Gambar Cetak Biru / Desain', week: 2, category: 'Konstruksi', orderIndex: 0 },
    { vocabId: 'nogyo_1', word: '収穫', reading: 'Shuukaku', meaning: 'Panen', week: 1, category: 'Pertanian', orderIndex: 0 },
    { vocabId: 'nogyo_2', word: '肥料', reading: 'Hiryou', meaning: 'Pupuk', week: 1, category: 'Pertanian', orderIndex: 1 },
    { vocabId: 'nogyo_3', word: '温室', reading: 'Onshitsu', meaning: 'Rumah Kaca (Greenhouse)', week: 2, category: 'Pertanian', orderIndex: 0 }
  ];
  for (const v of additionalVocabs) {
    await store.put({
      ...v,
      week: parseInt(v.week),
      orderIndex: parseInt(v.orderIndex)
    });
  }
}
