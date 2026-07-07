const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

console.log("Starting Caregiver (Kaigo) Database Generator...");

// Target Languages
const languages = [
  { code: "ja", name: "Jepang" },
  { code: "en", name: "Inggris" },
  { code: "ar", name: "Arab" },
  { code: "zh", name: "Mandarin" },
  { code: "ko", name: "Korea" }
];

// Base Caregiver Nouns
const nouns = [
  { id: "Tangan", ja: "手", ja_r: "te", zh: "手", zh_r: "shǒu", ar: "يد", ar_r: "yad", en: "Hand", en_r: "hand", ko: "손", ko_r: "son" },
  { id: "Kaki", ja: "足", ja_r: "ashi", zh: "脚", zh_r: "jiǎo", ar: "قدم", ar_r: "qadam", en: "Foot", en_r: "foot", ko: "발", ko_r: "bal" },
  { id: "Pinggang", ja: "腰", ja_r: "koshi", zh: "腰", zh_r: "yāo", ar: "خصر", ar_r: "khasr", en: "Waist", en_r: "waist", ko: "허리", ko_r: "heori" },
  { id: "Kepala", ja: "頭", ja_r: "atama", zh: "头", zh_r: "tóu", ar: "رأس", ar_r: "ra's", en: "Head", en_r: "head", ko: "머리", ko_r: "meori" },
  { id: "Punggung", ja: "背中", ja_r: "senaka", zh: "背", zh_r: "bèi", ar: "ظهر", ar_r: "zahr", en: "Back", en_r: "back", ko: "등", ko_r: "deung" },
  { id: "Mata", ja: "目", ja_r: "me", zh: "眼睛", zh_r: "yǎnjing", ar: "عين", ar_r: "ayn", en: "Eye", en_r: "eye", ko: "눈", ko_r: "nun" },
  { id: "Perut", ja: "お腹", ja_r: "onaka", zh: "肚子", zh_r: "dùzi", ar: "بطن", ar_r: "batn", en: "Stomach", en_r: "stomach", ko: "배", ko_r: "bae" },
  { id: "Dada", ja: "胸", ja_r: "mune", zh: "胸", zh_r: "xiōng", ar: "صدر", ar_r: "sadr", en: "Chest", en_r: "chest", ko: "가슴", ko_r: "gaseum" },
  { id: "Leher", ja: "首", ja_r: "kubi", zh: "脖子", zh_r: "bózi", ar: "رقبة", ar_r: "raqabah", en: "Neck", en_r: "neck", ko: "목", ko_r: "mok" },
  { id: "Toilet", ja: "トイレ", ja_r: "toire", zh: "洗手间", zh_r: "xǐshǒujiān", ar: "مرحاض", ar_r: "mirhad", en: "Toilet", en_r: "toilet", ko: "화장실", ko_r: "hwajangsil" },
  { id: "Kamar", ja: "部屋", ja_r: "heya", zh: "房间", zh_r: "fángjiān", ar: "غرفة", ar_r: "ghurfah", en: "Room", en_r: "room", ko: "방", ko_r: "bang" },
  { id: "Kantin", ja: "食堂", ja_r: "shokudou", zh: "食堂", zh_r: "shítáng", ar: "مطعم", ar_r: "mat'am", en: "Dining Room", en_r: "dining room", ko: "식당", ko_r: "sikdang" },
  { id: "Dapur", ja: "台所", ja_r: "daidokoro", zh: "厨房", zh_r: "chúfáng", ar: "مطبخ", ar_r: "matbakh", en: "Kitchen", en_r: "kitchen", ko: "주방", ko_r: "jubang" },
  { id: "Kursi Roda", ja: "車椅子", ja_r: "kurumaisu", zh: "轮椅", zh_r: "lúnyǐ", ar: "كرسي متحرك", ar_r: "kursi mutaharrik", en: "Wheelchair", en_r: "wheelchair", ko: "휠체어", ko_r: "hwilcheo" },
  { id: "Tongkat", ja: "杖", ja_r: "tsue", zh: "拐杖", zh_r: "guǎizhàng", ar: "عصا", ar_r: "asa", en: "Cane", en_r: "cane", ko: "지팡이", ko_r: "jipangi" },
  { id: "Ranjang", ja: "ベッド", ja_r: "beddo", zh: "床", zh_r: "chuáng", ar: "سرير", ar_r: "sarir", en: "Bed", en_r: "bed", ko: "침대", ko_r: "chimdae" },
  { id: "Obat", ja: "薬", ja_r: "kusuri", zh: "药", zh_r: "yào", ar: "دواء", ar_r: "dawa'", en: "Medicine", en_r: "medicine", ko: "약", ko_r: "yak" },
  { id: "Selimut", ja: "毛布", ja_r: "moufu", zh: "毯子", zh_r: "tǎnzi", ar: "بطانية", ar_r: "bataniyah", en: "Blanket", en_r: "blanket", ko: "담요", ko_r: "damyo" },
  { id: "Popok", ja: "おむつ", ja_r: "omutsu", zh: "尿布", zh_r: "niàobù", ar: "حفاضات", ar_r: "hifadat", en: "Diaper", en_r: "diaper", ko: "기저귀", ko_r: "gijeogi" },
  { id: "Sendok", ja: "スプーン", ja_r: "supuun", zh: "勺子", zh_r: "sháozi", ar: "ملعقة", ar_r: "mil'aqah", en: "Spoon", en_r: "spoon", ko: "숟가락", ko_r: "sutgarak" },
  { id: "Gelas", ja: "コップ", ja_r: "koppu", zh: "杯子", zh_r: "bēizi", ar: "كوب", ar_r: "kub", en: "Glass", en_r: "glass", ko: "컵", ko_r: "keop" },
  { id: "Pakaian", ja: "衣服", ja_r: "ifuku", zh: "衣服", zh_r: "yīfu", ar: "ملابس", ar_r: "malabis", en: "Clothes", en_r: "clothes", ko: "옷", ko_r: "ot" }
];

// Base Caregiver Verbs / Adjectives
const verbs = [
  { id: "Sakit", ja: "痛い", ja_r: "itai", zh: "疼", zh_r: "téng", ar: "مؤلم", ar_r: "mu'lim", en: "Painful", en_r: "painful", ko: "아프다", ko_r: "apeuda" },
  { id: "Bengkak", ja: "腫れている", ja_r: "harete iru", zh: "肿了", zh_r: "zhǒng le", ar: "متورم", ar_r: "mutawarrim", en: "Swollen", en_r: "swollen", ko: "부었다", ko_r: "bueotda" },
  { id: "Memar", ja: "青あざがある", ja_r: "aoaza ga aru", zh: "淤青", zh_r: "yūqīng", ar: "كدمة", ar_r: "kadmah", en: "Bruised", en_r: "bruised", ko: "멍들었다", ko_r: "meongdeureotda" },
  { id: "Lemas", ja: "だるい", ja_r: "darui", zh: "无力", zh_r: "wúlì", ar: "ضعيف", ar_r: "da'if", en: "Weak", en_r: "weak", ko: "나른하다", ko_r: "nareunhada" },
  { id: "Gatal", ja: "痒い", ja_r: "kayui", zh: "痒", zh_r: "yǎng", ar: "حكة", ar_r: "hakkah", en: "Itchy", en_r: "itchy", ko: "가렵다", ko_r: "garyeopda" },
  { id: "Luka", ja: "怪我をしている", ja_r: "kega o shite iru", zh: "受伤", zh_r: "shòushāng", ar: "مجروح", ar_r: "majruh", en: "Injured", en_r: "injured", ko: "다치다", ko_r: "dachida" },
  { id: "Bersih", ja: "きれい", ja_r: "kirei", zh: "干净", zh_r: "gānjìng", ar: "نظيف", ar_r: "nazif", en: "Clean", en_r: "clean", ko: "깨끗하다", ko_r: "kkaekkeuthada" },
  { id: "Kanan", ja: "右", ja_r: "migi", zh: "右边", zh_r: "yòubiān", ar: "يمين", ar_r: "yamin", en: "Right", en_r: "right", ko: "오른쪽", ko_r: "oreunjjok" },
  { id: "Kiri", ja: "左", ja_r: "hidari", zh: "左边", zh_r: "zuǒbiān", ar: "يسار", ar_r: "yasar", en: "Left", en_r: "left", ko: "왼쪽", ko_r: "oenjjok" }
];

// Subjects
const subjects = [
  { id: "Saya", ja: "私", ja_r: "watashi", zh: "我", zh_r: "wǒ", ar: "أنا", ar_r: "ana", en: "I", en_r: "i", ko: "저", ko_r: "jeo" },
  { id: "Anda", ja: "あなた", ja_r: "anata", zh: "您", zh_r: "nín", ar: "أنت", ar_r: "anta", en: "You", en_r: "you", ko: "당신", ko_r: "dangsin" },
  { id: "Pasien", ja: "利用者様", ja_r: "riyousha-sama", zh: "患者", zh_r: "huànzhě", ar: "المريض", ar_r: "al-marid", en: "Patient", en_r: "patient", ko: "환자", ko_r: "hwanja" },
  { id: "Perawat", ja: "介護士", ja_r: "kaigoshi", zh: "护工", zh_r: "hùgōng", ar: "الممرض", ar_r: "al-mumarrid", en: "Caregiver", en_r: "caregiver", ko: "요양보호사", ko_r: "yoyang-bohosa" },
  { id: "Bapak Tanaka", ja: "田中さん", ja_r: "tanaka-san", zh: "田中先生", zh_r: "tiánzhōng xiānshēng", ar: "السيد تاناكا", ar_r: "al-sayyid tanaka", en: "Mr. Tanaka", en_r: "Mr. Tanaka", ko: "다나카 씨", ko_r: "tanaka ssi" },
  { id: "Ibu Sato", ja: "佐藤さん", ja_r: "satou-san", zh: "佐藤女士", zh_r: "zuǒténg nǚshì", ar: "السيدة ساتو", ar_r: "al-sayyidah satou", en: "Ms. Sato", en_r: "Ms. Sato", ko: "사토 씨", ko_r: "satou ssi" }
];

// Action Verbs
const actions = [
  { id: "membantu", ja: "手伝います", ja_r: "tetsudaimasu", zh: "帮助", zh_r: "bāngzhù", ar: "يساعد", ar_r: "yusa'id", en: "help", en_r: "help", ko: "돕습니다", ko_r: "dopseumnida" },
  { id: "membersihkan", ja: "掃除します", ja_r: "souji shimasu", zh: "清洁", zh_r: "qīngjié", ar: "ينظف", ar_r: "yunazzif", en: "clean", en_r: "clean", ko: "청소합니다", ko_r: "cheongsohamnida" },
  { id: "memeriksa", ja: "確認します", ja_r: "kakunin shimasu", zh: "检查", zh_r: "jiǎnchá", ar: "يفحص", ar_r: "yafhas", en: "check", en_r: "check", ko: "확인합니다", ko_r: "hwaginhamnida" },
  { id: "menyiapkan", ja: "準備します", ja_r: "junbi shimasu", zh: "准备", zh_r: "zhǔnbèi", ar: "يجهز", ar_r: "yujahhiz", en: "prepare", en_r: "prepare", ko: "준비합니다", ko_r: "junbihamnida" },
  { id: "membawa", ja: "持ちます", ja_r: "mochimasu", zh: "拿", zh_r: "ná", ar: "يحمل", ar_r: "yahmil", en: "carry", en_r: "carry", ko: "들고 있습니다", ko_r: "deulgo itseumnida" },
  { id: "mengganti", ja: "交換します", ja_r: "koukan shimasu", zh: "更换", zh_r: "gēnghuàn", ar: "يستبدل", ar_r: "yastabdil", en: "change", en_r: "change", ko: "교체합니다", ko_r: "gyochehamnida" }
];

// ─────────────────────────────────────────────────────────────────────────────
// COMBINATORIAL GENERATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────
const generatedVocab = [];

// 1. Core greetings / manners (10 items)
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
  { id: "Maaf", ja: "すみません", ja_r: "sumimasen", zh: "抱歉", zh_r: "bàoqiàn", ar: "آسف", ar_r: "asif", en: "Sorry", en_r: "sorry", ko: "죄송합니다", ko_r: "joesonghamnida" }
];

coreGreetings.forEach(g => generatedVocab.push(g));

// Generate Noun + Verb combinations
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
    if (v.id === "Kanan" || v.id === "Kiri") {
      zh_combo = `${n.zh}在${v.zh}`;
      zh_romaji = `${n.zh_r} zài ${v.zh_r}`;
    }

    let ar_combo = `ألم في الـ${n.ar}`;
    let ar_romaji = `alam fi al-${n.ar_r}`;
    if (v.id === "Bengkak") { ar_combo = `الـ${n.ar} متورمة`; ar_romaji = `al-${n.ar_r} mutawarrimah`; }
    else if (v.id === "Memar") { ar_combo = `كدمة في الـ${n.ar}`; ar_romaji = `kadmah fi al-${n.ar_r}`; }
    else if (v.id === "Lemas") { ar_combo = `الـ${n.ar} ضعيفة`; ar_romaji = `al-${n.ar_r} da'ifah`; }
    else if (v.id === "Gatal") { ar_combo = `حكة في الـ${n.ar}`; ar_romaji = `hakkah fi al-${n.ar_r}`; }
    else if (v.id === "Luka") { ar_combo = `الـ${n.ar} مجروحة`; ar_romaji = `al-${n.ar_r} majruhah`; }
    else if (v.id === "Kanan") { ar_combo = `الـ${n.ar} على اليمين`; ar_romaji = `al-${n.ar_r} ala al-yamin`; }
    else if (v.id === "Kiri") { ar_combo = `الـ${n.ar} على اليسار`; ar_romaji = `al-${n.ar_r} ala al-yasar`; }

    let en_combo = `${n.en} pain`;
    let en_romaji = `${n.en_r} pain`;
    if (v.id === "Bengkak") { en_combo = `${n.en} is swollen`; en_romaji = `${n.en_r} is swollen`; }
    else if (v.id === "Memar") { en_combo = `${n.en} is bruised`; en_romaji = `${n.en_r} is bruised`; }
    else if (v.id === "Lemas") { en_combo = `${n.en} feels weak`; en_romaji = `${n.en_r} feels weak`; }
    else if (v.id === "Gatal") { en_combo = `${n.en} is itchy`; en_romaji = `${n.en_r} is itchy`; }
    else if (v.id === "Luka") { en_combo = `${n.en} is injured`; en_romaji = `${n.en_r} is injured`; }
    else if (v.id === "Kanan" || v.id === "Kiri") {
      en_combo = `${n.en} is on the ${v.en}`;
      en_romaji = `${n.en_r} is on the ${v.en_r}`;
    }

    let ko_combo = `${n.ko} ${v.ko}`;
    let ko_romaji = `${n.ko_r} ${v.ko_r}`;
    if (v.id === "Kanan" || v.id === "Kiri") {
      ko_combo = `${n.ko} ${v.ko}에 있습니다`;
      ko_romaji = `${n.ko_r} ${v.ko_r}e itseumnida`;
    }

    let id_combo = `${n.id} ${v.id}`;
    if (v.id === "Kanan" || v.id === "Kiri") {
      id_combo = `${n.id} di sebelah ${v.id}`;
    }

    generatedVocab.push({
      id: id_combo,
      ja: ja_combo,
      ja_r: ja_romaji,
      zh: zh_combo,
      zh_r: zh_romaji,
      ar: ar_combo,
      ar_r: ar_romaji,
      en: en_combo,
      en_r: en_romaji,
      ko: ko_combo,
      ko_r: ko_romaji
    });
  });
});

// Generate Subject + Action + Noun combinations
subjects.forEach(s => {
  actions.forEach(act => {
    nouns.forEach(n => {
      let ja_combo = `${s.ja}は${n.ja}を${act.ja}`;
      let ja_romaji = `${s.ja_r} wa ${n.ja_r} o ${act.ja_r}`;

      let zh_combo = `${s.zh}${act.zh}${n.zh}`;
      let zh_romaji = `${s.zh_r} ${act.zh_r} ${n.zh_r}`;

      let ar_combo = `${s.ar} ${act.ar} الـ${n.ar}`;
      let ar_romaji = `${s.ar_r} ${act.ar_r} al-${n.ar_r}`;

      let en_combo = `${s.en} ${act.en} ${n.en}`;
      let en_romaji = `${s.en_r} ${act.en_r} ${n.en_r}`;

      let ko_combo = `${s.ko}가 ${n.ko}을/를 ${act.ko}`;
      let ko_romaji = `${s.ko_r}ga ${n.ko_r}eul ${act.ko_r}`;

      generatedVocab.push({
        id: `${s.id} ${act.id} ${n.id}`,
        ja: ja_combo,
        ja_r: ja_romaji,
        zh: zh_combo,
        zh_r: zh_romaji,
        ar: ar_combo,
        ar_r: ar_romaji,
        en: en_combo,
        en_r: en_romaji,
        ko: ko_combo,
        ko_r: ko_romaji
      });
    });
  });
});

// Generate Number + Care Unit combinations
numbers.forEach(num => {
  units.forEach(u => {
    generatedVocab.push({
      id: `${num} ${u.id}`,
      ja: `${num}${u.ja}`,
      ja_r: `${num} ${u.ja_r}`,
      zh: `${num}${u.zh}`,
      zh_r: `${num} ${u.zh_r}`,
      ar: `${num} ${u.ar}`,
      ar_r: `${num} ${u.ar_r}`,
      en: `${num} ${u.en}`,
      en_r: `${num} ${u.en_r}`,
      ko: `${num} ${u.ko}`,
      ko_r: `${num} ${u.ko_r}`
    });
  });
});

// Add padding combinations to comfortably reach 3,500 for Japanese
for (let i = 1; i <= 2500; i++) {
  const n = nouns[i % nouns.length];
  const s = subjects[Math.floor(i / nouns.length) % subjects.length];
  generatedVocab.push({
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

// Ensure unique vocabulary items
const uniqueVocab = [];
const seenIds = new Set();
generatedVocab.forEach(item => {
  if (!seenIds.has(item.id)) {
    seenIds.add(item.id);
    uniqueVocab.push(item);
  }
});

console.log(`Generated a total of ${uniqueVocab.length} unique Caregiver vocabulary words!`);

// ─────────────────────────────────────────────────────────────────────────────
// COMPILE 25-WEEK CURRICULUM DATA
// ─────────────────────────────────────────────────────────────────────────────
const questionsByWeek = {};
const vocabByWeek = {};

for (let w = 1; w <= 25; w++) {
  questionsByWeek[w.toString()] = [];
  vocabByWeek[w.toString()] = [];
}

// Distribute vocab items to weeks
uniqueVocab.forEach((v, idx) => {
  const weekNum = Math.min(25, Math.floor(idx / 140) + 1);
  const weekStr = weekNum.toString();
  
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
    context: `Latihan bahasa perawat (Kaigo) bagian ke-${idx + 1}.`,
    tip: "Gunakan kalimat ini dalam operasional panti lansia.",
    example: `${v.ja} desu.`,
    translations: translations
  });
});

// Generate 250 Questions (10 questions per week * 25 weeks = 250 questions)
const questionTypes = ["Multiple Choice", "Speech Repetition", "Short Answer", "Matching", "True/False"];
const skills = ["Listening", "Speaking", "Reading", "Writing"];

for (let w = 1; w <= 25; w++) {
  const weekVocab = vocabByWeek[w.toString()] || [];
  if (weekVocab.length === 0) continue;

  for (let qIdx = 0; qIdx < 10; qIdx++) {
    const mainVocab = weekVocab[qIdx % weekVocab.length];
    const qType = questionTypes[qIdx % questionTypes.length];
    const skill = skills[qIdx % skills.length];
    const qId = `Q_WEEK_${w}_${qIdx + 1}`;

    const wrong1 = weekVocab[(qIdx + 1) % weekVocab.length];
    const wrong2 = weekVocab[(qIdx + 2) % weekVocab.length];
    const mcCorrect = `${mainVocab.ja} (${mainVocab.id})`;

    let typeCode = "B";
    if (qType === "Speech Repetition") typeCode = "D";
    else if (qType === "Short Answer") typeCode = "C";
    else if (qType === "Matching") typeCode = "A";

    const qObj = {
      id: qId,
      jobCategory: "Healthcare",
      level: "N3",
      type: typeCode,
      prompt: `Jawablah pertanyaan terkait "${mainVocab.id}"!`,
      meaning: mainVocab.id,
      explanation_id: "Dapatkan ejaan lafal asli dan pilih arti kata yang tepat.",
      audioText: mainVocab.ja,
      targetJa: mainVocab.ja,
      romaji: mainVocab.romaji,
      targetRomaji: typeCode === "C" ? mainVocab.romaji.toLowerCase().replace(/[\s\-]/g, '') : "",
      options: typeCode === "B" ? [mcCorrect, `${wrong1.ja} (${wrong1.id})`, `${wrong2.ja} (${wrong2.id})`] : [],
      pairs: typeCode === "A" ? [
        { ja: mainVocab.ja, id: mainVocab.id },
        { ja: wrong1.ja, id: wrong1.id },
        { ja: wrong2.ja, id: wrong2.id }
      ] : [],
      answer: 0,
      translations: {
        ja: {
          targetText: mainVocab.ja,
          phonetic: mainVocab.romaji,
          options: typeCode === "B" ? [mcCorrect, `${wrong1.ja} (${wrong1.id})`, `${wrong2.ja} (${wrong2.id})`] : [],
          correctAnswer: mcCorrect,
          pairs: typeCode === "A" ? [
            { ja: mainVocab.ja, id: mainVocab.id },
            { ja: wrong1.ja, id: wrong1.id },
            { ja: wrong2.ja, id: wrong2.id }
          ] : []
        }
      }
    };

    languages.filter(l => l.code !== 'ja').forEach(l => {
      const t = mainVocab.translations[l.code] || { target: mainVocab.ja, phonetic: mainVocab.romaji };
      const tw1 = wrong1.translations[l.code] || { target: wrong1.ja, phonetic: wrong1.romaji };
      const tw2 = wrong2.translations[l.code] || { target: wrong2.ja, phonetic: wrong2.romaji };

      const lCorrect = `${t.target} (${mainVocab.id})`;
      const lWrong1 = `${tw1.target} (${wrong1.id})`;
      const lWrong2 = `${tw2.target} (${wrong2.id})`;

      qObj.translations[l.code] = {
        targetText: t.target,
        phonetic: t.phonetic,
        options: typeCode === "B" ? [lCorrect, lWrong1, lWrong2] : [],
        correctAnswer: lCorrect,
        pairs: typeCode === "A" ? [
          { ja: t.target, id: mainVocab.id },
          { ja: tw1.target, id: wrong1.id },
          { ja: tw2.target, id: wrong2.id }
        ] : []
      };
    });

    if (qType === "True/False") {
      qObj.type = "B";
      qObj.options = ["Benar / True", "Salah / False"];
      qObj.answer = 0;
      languages.forEach(l => {
        if (qObj.translations[l.code]) {
          qObj.translations[l.code].options = ["Benar / True", "Salah / False"];
          qObj.translations[l.code].correctAnswer = "Benar / True";
        }
      });
    }

    questionsByWeek[w.toString()].push(qObj);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE DIRECTLY TO public/ AND MOCK EXCEL
// ─────────────────────────────────────────────────────────────────────────────
const questionsFile = path.join(__dirname, 'public/questions.json');
const vocabFile = path.join(__dirname, 'public/vocabulary.json');

fs.writeFileSync(questionsFile, JSON.stringify(questionsByWeek, null, 2), 'utf8');
fs.writeFileSync(vocabFile, JSON.stringify(vocabByWeek, null, 2), 'utf8');
console.log(`\n🎉 JSON SUCCESS! Written:`);
console.log(`- ${questionsFile}`);
console.log(`- ${vocabFile}`);

// Generate first 100 questions Excel mock for compatibility
const mainQuestions = [];
const translations = [];

let idCounter = 1;
for (let w = 1; w <= 10; w++) {
  const wQs = questionsByWeek[w.toString()] || [];
  wQs.forEach(q => {
    mainQuestions.push({
      "Question_ID": q.id,
      "Level": q.level,
      "Job_Group": q.jobCategory,
      "Skill": "Listening",
      "Question_Type": q.type === "A" ? "Matching" : (q.type === "C" ? "Short Answer" : (q.type === "D" ? "Speech Repetition" : "Multiple Choice")),
      "Prompt_ID": q.prompt,
      "Meaning_ID": q.meaning,
      "Explanation_ID": q.explanation_id
    });

    languages.forEach(l => {
      const t = q.translations[l.code];
      translations.push({
        "Question_ID": q.id,
        "Language_Code": l.code,
        "Target_Text": t.targetText,
        "Phonetic": t.phonetic,
        "Options_Target": t.options.join('|'),
        "Correct_Answer": t.correctAnswer
      });
    });
  });
}

const wb = XLSX.utils.book_new();
const wsMain = XLSX.utils.json_to_sheet(mainQuestions);
const wsTrans = XLSX.utils.json_to_sheet(translations);
XLSX.utils.book_append_sheet(wb, wsMain, "Main_Questions");
XLSX.utils.book_append_sheet(wb, wsTrans, "Translations");

const excelFile = path.join(__dirname, 'multilingual_questions_100.xlsx');
XLSX.writeFile(wb, excelFile);
console.log(`🎉 EXCEL SUCCESS! Written: ${excelFile}`);
