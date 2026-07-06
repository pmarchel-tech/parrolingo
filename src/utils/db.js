// IndexedDB local storage utility for KaigoLingo

const DB_NAME = 'kaigolingo_db';
const DB_VERSION = 5;

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
      resolve(dbInstance);
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
      if (!db.objectStoreNames.contains('questions')) {
        const qStore = db.createObjectStore('questions', { keyPath: 'id' });
        qStore.createIndex('week', 'week', { unique: false });
      }

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
  streak: 12,
  xp: 450,
  coins: 75,
  completedWeeks: [1, 2, 3, 4], // defaults for showcase
  studyTime: [20, 30, 15, 35, 25, 45, 0], // Monday to Sunday minutes
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

export async function seedDefaultChecklists() {
  // Call new B2B seed functions first (self-guarding)
  try {
    await seedDormRooms();
    await seedFinancialLedgers();
    await seedJobListings();
    await seedRegistrations();
    await seedReferralClaims();
    await seedDynamicVocab();
  } catch (err) {
    console.error("B2B Seeding failed: ", err);
  }

  const store = await getStore('student_checklists', 'readwrite');
  
  // Check if already seeded
  const checkReq = store.getAll();
  const existing = await new Promise(resolve => {
    checkReq.onsuccess = () => resolve(checkReq.result || []);
    checkReq.onerror = () => resolve([]);
  });
  
  if (existing.length > 0) return;

  const defaultChecklists = [
    {
      studentName: 'Budi Utomo',
      lpkId: 'lpk_a',
      statuses: {
        briefing: 'completed',
        kaiwa_n4: 'completed',
        kaiwa_mensetsu: 'in_progress',
        matching_job: 'pending',
        doc_admin: 'needs_action'
      },
      documents: {
        doc_admin: null
      },
      notes: {
        doc_admin: 'Foto Akta Kelahiran buram, mohon unggah ulang.'
      }
    },
    {
      studentName: 'Siti Rahma',
      lpkId: 'lpk_a',
      statuses: {
        briefing: 'completed',
        kaiwa_n4: 'completed',
        kaiwa_mensetsu: 'completed',
        matching_job: 'completed',
        doc_admin: 'completed',
        mcu_2: 'completed',
        n3_basic: 'completed',
        p3mi: 'completed',
        bpjs_visa: 'completed',
        jacket: 'completed',
        pre_departure: 'completed',
        jlpt_prep: 'completed',
        alumni_visit: 'completed',
        alumni_monitoring: 'in_progress'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Agus Wijaya',
      lpkId: 'lpk_b',
      statuses: {
        briefing: 'completed',
        kaiwa_n4: 'in_progress'
      },
      documents: {},
      notes: {}
    },
    {
      studentName: 'Dewi Lestari',
      lpkId: 'lpk_b',
      statuses: {
        briefing: 'completed',
        kaiwa_n4: 'completed',
        kaiwa_mensetsu: 'completed',
        matching_job: 'completed',
        doc_admin: 'completed',
        mcu_2: 'completed',
        n3_basic: 'completed',
        p3mi: 'completed',
        bpjs_visa: 'completed',
        jacket: 'completed',
        pre_departure: 'completed'
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

export async function seedDormRooms() {
  const rooms = await getDormRooms();
  if (rooms.length > 0) return;

  const defaultRooms = [
    { roomId: 'A1', name: 'Asrama Sakura - Kamar A1', beds: [
      { bedId: 'A1_1', status: 'occupied', studentName: 'Budi Utomo' },
      { bedId: 'A1_2', status: 'available', studentName: '' },
      { bedId: 'A1_3', status: 'available', studentName: '' },
      { bedId: 'A1_4', status: 'available', studentName: '' }
    ]},
    { roomId: 'A2', name: 'Asrama Sakura - Kamar A2', beds: [
      { bedId: 'A2_1', status: 'occupied', studentName: 'Siti Rahma' },
      { bedId: 'A2_2', status: 'available', studentName: '' }
    ]},
    { roomId: 'B1', name: 'Asrama Prima - Kamar B1', beds: [
      { bedId: 'B1_1', status: 'occupied', studentName: 'Agus Wijaya' },
      { bedId: 'B1_2', status: 'occupied', studentName: 'Dewi Lestari' }
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

export async function seedFinancialLedgers() {
  const ledgers = await getFinancialLedgers();
  if (ledgers.length > 0) return;

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
