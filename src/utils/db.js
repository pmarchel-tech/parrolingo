// IndexedDB local storage utility for KaigoLingo

const DB_NAME = 'kaigolingo_db';
const DB_VERSION = 1;

let dbInstance = null;

export function initDB() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
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
    // LPK Karya Mulia (lpk_a)
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
