const XLSX = require('xlsx');
const path = require('path');

// Target Languages to practice
const languages = [
  { code: "ja", name: "Jepang",    prefix: "JA" },
  { code: "en", name: "Inggris",   prefix: "EN" },
  { code: "ar", name: "Arab",      prefix: "AR" },
  { code: "zh", name: "Mandarin",  prefix: "ZH" },
  { code: "ko", name: "Korea",     prefix: "KO" }
];

// 10 Job Groups
const sectors = [
  { name: "Healthcare",              n3g: "Komunikasi dasar dengan pasien.",         n2g: "Komunikasi medis formal." },
  { name: "Hospitality & Food",      n3g: "Melayani tamu dan pengunjung.",            n2g: "Kehormatan tingkat tinggi." },
  { name: "Manufacturing",           n3g: "Petunjuk dasar operasional pabrik.",       n2g: "Prosedur keselamatan kerja." },
  { name: "Construction & Engineering", n3g: "Instruksi keselamatan konstruksi.",    n2g: "Spesifikasi teknis bangunan." },
  { name: "Agriculture",             n3g: "Kosakata penanaman dan panen.",            n2g: "Manajemen perkebunan modern." },
  { name: "Administration & Office", n3g: "Bahasa surat-menyurat dasar.",            n2g: "Negosiasi bisnis formal." },
  { name: "Cleaning & Maintenance",  n3g: "Instruksi kebersihan ruangan.",           n2g: "Manajemen pemeliharaan gedung." },
  { name: "Sales & Retail",          n3g: "Melayani pembeli di toko.",               n2g: "Menangani keluhan pelanggan." },
  { name: "Transportation",          n3g: "Kosakata pengiriman dasar.",              n2g: "Manajemen logistik rantai pasok." },
  { name: "Other",                   n3g: "Komunikasi harian di tempat kerja.",      n2g: "Negosiasi dan kolaborasi umum." }
];

const skills = ["Speaking", "Reading", "Listening", "Writing"];
const types  = ["Multiple Choice", "Speech Repetition", "Short Answer", "Matching", "True/False"];
const levels = ["N3", "N2"];

// ─────────────────────────────────────────────────────────────────────────────
// RICH PHRASE BANK  — short, natural, beginner-level
// Each sector has an array of question "sets". We cycle through them.
// Each set has: id, prompt_id (Indonesian UI text), meaning_id (Indonesian translation),
// and per-language: target + phonetic + options (for MC) + correct + matching pairs
// ─────────────────────────────────────────────────────────────────────────────
const phraseBank = {

  "Healthcare": [
    {
      prompt_id:  "Apa artinya 'Selamat pagi' dalam Bahasa Target?",
      meaning_id: "Ucapan selamat pagi yang umum digunakan saat mulai bekerja.",
      zh: { target: "早上好", phonetic: "zǎo shàng hǎo",
            mc_options: "早上好 (Selamat Pagi)|晚安 (Selamat Malam)|谢谢 (Terima Kasih)", mc_correct: "早上好 (Selamat Pagi)",
            match: "早上好=Selamat Pagi|晚安=Selamat Malam|谢谢=Terima Kasih", tf_correct: "T", sa_correct: "zaoshang" },
      ja: { target: "おはようございます", phonetic: "ohayou gozaimasu",
            mc_options: "おはようございます (Selamat Pagi)|こんばんは (Selamat Malam)|ありがとう (Terima Kasih)", mc_correct: "おはようございます (Selamat Pagi)",
            match: "おはようございます=Selamat Pagi|こんばんは=Selamat Malam|ありがとう=Terima Kasih", tf_correct: "T", sa_correct: "ohayou" },
      en: { target: "Good morning", phonetic: "good MOR-ning",
            mc_options: "Good morning (Selamat Pagi)|Good night (Selamat Malam)|Thank you (Terima Kasih)", mc_correct: "Good morning (Selamat Pagi)",
            match: "Good morning=Selamat Pagi|Good night=Selamat Malam|Thank you=Terima Kasih", tf_correct: "T", sa_correct: "morning" },
      ar: { target: "صباح الخير", phonetic: "sabah al-khayr",
            mc_options: "صباح الخير (Selamat Pagi)|مساء الخير (Selamat Malam)|شكراً (Terima Kasih)", mc_correct: "صباح الخير (Selamat Pagi)",
            match: "صباح الخير=Selamat Pagi|مساء الخير=Selamat Malam|شكراً=Terima Kasih", tf_correct: "T", sa_correct: "sabah" },
      ko: { target: "좋은 아침이에요", phonetic: "jo-eun achim-i-e-yo",
            mc_options: "좋은 아침이에요 (Selamat Pagi)|안녕히 주무세요 (Selamat Malam)|감사합니다 (Terima Kasih)", mc_correct: "좋은 아침이에요 (Selamat Pagi)",
            match: "좋은 아침이에요=Selamat Pagi|안녕히 주무세요=Selamat Malam|감사합니다=Terima Kasih", tf_correct: "T", sa_correct: "achim" }
    },
    {
      prompt_id:  "Bagaimana cara mengatakan 'Tunggu sebentar' kepada pasien?",
      meaning_id: "Kalimat singkat meminta pasien untuk bersabar sebentar.",
      zh: { target: "请稍等", phonetic: "qǐng shāo děng",
            mc_options: "请稍等 (Tunggu sebentar)|请进来 (Silakan masuk)|请坐下 (Silakan duduk)", mc_correct: "请稍等 (Tunggu sebentar)",
            match: "请稍等=Tunggu sebentar|请进来=Silakan masuk|请坐下=Silakan duduk", tf_correct: "T", sa_correct: "qing" },
      ja: { target: "少々お待ちください", phonetic: "shoushou omachi kudasai",
            mc_options: "少々お待ちください (Tunggu sebentar)|どうぞ入ってください (Silakan masuk)|座ってください (Silakan duduk)", mc_correct: "少々お待ちください (Tunggu sebentar)",
            match: "少々お待ちください=Tunggu sebentar|どうぞ入ってください=Silakan masuk|座ってください=Silakan duduk", tf_correct: "T", sa_correct: "omachi" },
      en: { target: "Please wait a moment", phonetic: "PLEEZ wayt a MO-ment",
            mc_options: "Please wait a moment (Tunggu sebentar)|Please come in (Silakan masuk)|Please sit down (Silakan duduk)", mc_correct: "Please wait a moment (Tunggu sebentar)",
            match: "Please wait=Tunggu sebentar|Please come in=Silakan masuk|Please sit=Silakan duduk", tf_correct: "T", sa_correct: "wait" },
      ar: { target: "انتظر لحظة من فضلك", phonetic: "intazir lahzah min fadlak",
            mc_options: "انتظر لحظة (Tunggu sebentar)|تفضل بالدخول (Silakan masuk)|اجلس من فضلك (Silakan duduk)", mc_correct: "انتظر لحظة (Tunggu sebentar)",
            match: "انتظر لحظة=Tunggu sebentar|تفضل بالدخول=Silakan masuk|اجلس=Silakan duduk", tf_correct: "T", sa_correct: "intazir" },
      ko: { target: "잠깐만 기다려 주세요", phonetic: "jamkkanman gidaryeo juseyo",
            mc_options: "잠깐만 기다려 주세요 (Tunggu sebentar)|들어오세요 (Silakan masuk)|앉아 주세요 (Silakan duduk)", mc_correct: "잠깐만 기다려 주세요 (Tunggu sebentar)",
            match: "잠깐만=Tunggu sebentar|들어오세요=Silakan masuk|앉아 주세요=Silakan duduk", tf_correct: "T", sa_correct: "jamkkan" }
    }
  ],

  "Hospitality & Food": [
    {
      prompt_id:  "Bagaimana cara menyambut tamu yang datang?",
      meaning_id: "Ucapan selamat datang kepada tamu atau pelanggan.",
      zh: { target: "欢迎光临", phonetic: "huānyíng guānglín",
            mc_options: "欢迎光临 (Selamat datang)|再见 (Sampai jumpa)|谢谢 (Terima kasih)", mc_correct: "欢迎光临 (Selamat datang)",
            match: "欢迎光临=Selamat datang|再见=Sampai jumpa|谢谢=Terima kasih", tf_correct: "T", sa_correct: "huanying" },
      ja: { target: "いらっしゃいませ", phonetic: "irasshaimase",
            mc_options: "いらっしゃいませ (Selamat datang)|さようなら (Sampai jumpa)|ありがとう (Terima kasih)", mc_correct: "いらっしゃいませ (Selamat datang)",
            match: "いらっしゃいませ=Selamat datang|さようなら=Sampai jumpa|ありがとう=Terima kasih", tf_correct: "T", sa_correct: "irasshaimase" },
      en: { target: "Welcome!", phonetic: "WEL-kum",
            mc_options: "Welcome! (Selamat datang)|Goodbye (Sampai jumpa)|Thank you (Terima kasih)", mc_correct: "Welcome! (Selamat datang)",
            match: "Welcome=Selamat datang|Goodbye=Sampai jumpa|Thank you=Terima kasih", tf_correct: "T", sa_correct: "welcome" },
      ar: { target: "أهلاً وسهلاً", phonetic: "ahlan wa-sahlan",
            mc_options: "أهلاً وسهلاً (Selamat datang)|مع السلامة (Sampai jumpa)|شكراً (Terima kasih)", mc_correct: "أهلاً وسهلاً (Selamat datang)",
            match: "أهلاً=Selamat datang|مع السلامة=Sampai jumpa|شكراً=Terima kasih", tf_correct: "T", sa_correct: "ahlan" },
      ko: { target: "어서 오세요", phonetic: "eoseo oseyo",
            mc_options: "어서 오세요 (Selamat datang)|안녕히 가세요 (Sampai jumpa)|감사합니다 (Terima kasih)", mc_correct: "어서 오세요 (Selamat datang)",
            match: "어서 오세요=Selamat datang|안녕히 가세요=Sampai jumpa|감사합니다=Terima kasih", tf_correct: "T", sa_correct: "eoseo" }
    },
    {
      prompt_id:  "Bagaimana menanyakan berapa jumlah orang dalam rombongan tamu?",
      meaning_id: "Pertanyaan untuk mengetahui jumlah orang yang akan duduk.",
      zh: { target: "几位？", phonetic: "jǐ wèi?",
            mc_options: "几位？(Berapa orang?)|您好 (Halo)|买单 (Minta tagihan)", mc_correct: "几位？(Berapa orang?)",
            match: "几位=Berapa orang|您好=Halo|买单=Minta tagihan", tf_correct: "T", sa_correct: "ji" },
      ja: { target: "何名様ですか？", phonetic: "nanmei-sama desu ka?",
            mc_options: "何名様ですか？(Berapa orang?)|こんにちは (Halo)|お会計 (Minta tagihan)", mc_correct: "何名様ですか？(Berapa orang?)",
            match: "何名様=Berapa orang|こんにちは=Halo|お会計=Minta tagihan", tf_correct: "T", sa_correct: "nanmei" },
      en: { target: "How many people?", phonetic: "how MEH-nee PEE-pul",
            mc_options: "How many people? (Berapa orang?)|Hello (Halo)|Check please (Minta tagihan)", mc_correct: "How many people? (Berapa orang?)",
            match: "How many=Berapa orang|Hello=Halo|Check please=Minta tagihan", tf_correct: "T", sa_correct: "many" },
      ar: { target: "كم شخصاً؟", phonetic: "kam shakhsan?",
            mc_options: "كم شخصاً؟ (Berapa orang?)|مرحبا (Halo)|الحساب (Minta tagihan)", mc_correct: "كم شخصاً؟ (Berapa orang?)",
            match: "كم شخصاً=Berapa orang|مرحبا=Halo|الحساب=Minta tagihan", tf_correct: "T", sa_correct: "kam" },
      ko: { target: "몇 분이세요?", phonetic: "myeot bun-i-se-yo?",
            mc_options: "몇 분이세요? (Berapa orang?)|안녕하세요 (Halo)|계산서 주세요 (Minta tagihan)", mc_correct: "몇 분이세요? (Berapa orang?)",
            match: "몇 분이세요=Berapa orang|안녕하세요=Halo|계산서=Minta tagihan", tf_correct: "T", sa_correct: "myeot" }
    }
  ],

  "Manufacturing": [
    {
      prompt_id:  "Bagaimana cara mengatakan 'Hati-hati' saat bekerja?",
      meaning_id: "Peringatan keselamatan dasar di area pabrik.",
      zh: { target: "小心！", phonetic: "xiǎo xīn!",
            mc_options: "小心！(Hati-hati!)|出发 (Berangkat)|关机 (Matikan mesin)", mc_correct: "小心！(Hati-hati!)",
            match: "小心=Hati-hati|出发=Berangkat|关机=Matikan mesin", tf_correct: "T", sa_correct: "xiaoxin" },
      ja: { target: "気をつけて！", phonetic: "ki wo tsukete!",
            mc_options: "気をつけて！(Hati-hati!)|出発 (Berangkat)|電源を切る (Matikan mesin)", mc_correct: "気をつけて！(Hati-hati!)",
            match: "気をつけて=Hati-hati|出発=Berangkat|電源を切る=Matikan mesin", tf_correct: "T", sa_correct: "kiwotsukete" },
      en: { target: "Be careful!", phonetic: "bee KAYR-ful!",
            mc_options: "Be careful! (Hati-hati!)|Let's go (Berangkat)|Turn off (Matikan mesin)", mc_correct: "Be careful! (Hati-hati!)",
            match: "Be careful=Hati-hati|Let's go=Berangkat|Turn off=Matikan mesin", tf_correct: "T", sa_correct: "careful" },
      ar: { target: "احذر!", phonetic: "ihzar!",
            mc_options: "احذر! (Hati-hati!)|لنذهب (Berangkat)|أطفئ الجهاز (Matikan mesin)", mc_correct: "احذر! (Hati-hati!)",
            match: "احذر=Hati-hati|لنذهب=Berangkat|أطفئ=Matikan mesin", tf_correct: "T", sa_correct: "ihzar" },
      ko: { target: "조심하세요!", phonetic: "josim-ha-se-yo!",
            mc_options: "조심하세요! (Hati-hati!)|출발 (Berangkat)|전원을 끄세요 (Matikan mesin)", mc_correct: "조심하세요! (Hati-hati!)",
            match: "조심하세요=Hati-hati|출발=Berangkat|전원을 끄세요=Matikan mesin", tf_correct: "T", sa_correct: "josim" }
    },
    {
      prompt_id:  "Bagaimana cara meminta seseorang untuk memakai sarung tangan?",
      meaning_id: "Instruksi penggunaan APD (Alat Pelindung Diri) sarung tangan.",
      zh: { target: "戴手套", phonetic: "dài shǒutào",
            mc_options: "戴手套 (Pakai sarung tangan)|戴帽子 (Pakai topi)|脱鞋子 (Lepas sepatu)", mc_correct: "戴手套 (Pakai sarung tangan)",
            match: "戴手套=Pakai sarung tangan|戴帽子=Pakai topi|脱鞋子=Lepas sepatu", tf_correct: "T", sa_correct: "dai" },
      ja: { target: "手袋をつけてください", phonetic: "tebukuro wo tsukete kudasai",
            mc_options: "手袋をつけて (Pakai sarung tangan)|帽子をかぶって (Pakai topi)|靴を脱いで (Lepas sepatu)", mc_correct: "手袋をつけて (Pakai sarung tangan)",
            match: "手袋=Sarung tangan|帽子=Topi|靴=Sepatu", tf_correct: "T", sa_correct: "tebukuro" },
      en: { target: "Put on your gloves", phonetic: "put ON yor GLUVZ",
            mc_options: "Put on your gloves (Pakai sarung tangan)|Put on your hat (Pakai topi)|Take off your shoes (Lepas sepatu)", mc_correct: "Put on your gloves (Pakai sarung tangan)",
            match: "Gloves=Sarung tangan|Hat=Topi|Shoes=Sepatu", tf_correct: "T", sa_correct: "gloves" },
      ar: { target: "ارتدِ قفازاتك", phonetic: "irtadi quffazatik",
            mc_options: "ارتدِ قفازاتك (Pakai sarung tangan)|ارتدِ قبعتك (Pakai topi)|اخلع حذاءك (Lepas sepatu)", mc_correct: "ارتدِ قفازاتك (Pakai sarung tangan)",
            match: "قفازات=Sarung tangan|قبعة=Topi|حذاء=Sepatu", tf_correct: "T", sa_correct: "quffaz" },
      ko: { target: "장갑을 끼세요", phonetic: "janggabeul kki-se-yo",
            mc_options: "장갑을 끼세요 (Pakai sarung tangan)|모자를 쓰세요 (Pakai topi)|신발을 벗으세요 (Lepas sepatu)", mc_correct: "장갑을 끼세요 (Pakai sarung tangan)",
            match: "장갑=Sarung tangan|모자=Topi|신발=Sepatu", tf_correct: "T", sa_correct: "janggap" }
    }
  ],

  "Construction & Engineering": [
    {
      prompt_id:  "Bagaimana cara mengatakan 'Helm wajib dipakai di sini'?",
      meaning_id: "Aturan keselamatan konstruksi: wajib memakai helm.",
      zh: { target: "这里必须戴安全帽", phonetic: "zhèlǐ bìxū dài ānquánmào",
            mc_options: "必须戴安全帽 (Wajib pakai helm)|不用戴帽 (Tidak perlu helm)|请回家 (Silakan pulang)", mc_correct: "必须戴安全帽 (Wajib pakai helm)",
            match: "安全帽=Helm|安全带=Tali pengaman|手套=Sarung tangan", tf_correct: "T", sa_correct: "bixu" },
      ja: { target: "ここでは必ずヘルメットを着用してください", phonetic: "koko de wa kanarazu herumetto wo chakuyou shite kudasai",
            mc_options: "ヘルメットを着用 (Wajib pakai helm)|必要なし (Tidak perlu helm)|帰ってください (Silakan pulang)", mc_correct: "ヘルメットを着用 (Wajib pakai helm)",
            match: "ヘルメット=Helm|安全帯=Tali pengaman|手袋=Sarung tangan", tf_correct: "T", sa_correct: "herumetto" },
      en: { target: "Hard hat required here", phonetic: "hard hat reh-KWIRED heer",
            mc_options: "Hard hat required (Wajib pakai helm)|No hat needed (Tidak perlu helm)|Go home (Silakan pulang)", mc_correct: "Hard hat required (Wajib pakai helm)",
            match: "Hard hat=Helm|Safety belt=Tali pengaman|Gloves=Sarung tangan", tf_correct: "T", sa_correct: "hardhat" },
      ar: { target: "يجب ارتداء خوذة الأمان هنا", phonetic: "yajib irtida' khawzat al-aman huna",
            mc_options: "خوذة الأمان (Wajib pakai helm)|لا حاجة لخوذة (Tidak perlu helm)|اذهب للمنزل (Silakan pulang)", mc_correct: "خوذة الأمان (Wajib pakai helm)",
            match: "خوذة=Helm|حزام الأمان=Tali pengaman|قفازات=Sarung tangan", tf_correct: "T", sa_correct: "khawzah" },
      ko: { target: "여기서는 안전모를 꼭 써야 해요", phonetic: "yeogiseo-neun anjeonmo-reul kkok sseo-ya hae-yo",
            mc_options: "안전모를 써야 해요 (Wajib pakai helm)|모자 필요 없어요 (Tidak perlu helm)|집에 가세요 (Silakan pulang)", mc_correct: "안전모를 써야 해요 (Wajib pakai helm)",
            match: "안전모=Helm|안전벨트=Tali pengaman|장갑=Sarung tangan", tf_correct: "T", sa_correct: "anjeonmo" }
    }
  ],

  "Agriculture": [
    {
      prompt_id:  "Bagaimana cara mengatakan 'Siram tanaman' dalam Bahasa Target?",
      meaning_id: "Instruksi dasar perawatan tanaman: menyiram.",
      zh: { target: "给植物浇水", phonetic: "gěi zhíwù jiāo shuǐ",
            mc_options: "浇水 (Siram air)|收割 (Panen)|施肥 (Beri pupuk)", mc_correct: "浇水 (Siram air)",
            match: "浇水=Menyiram|收割=Memanen|施肥=Memberi pupuk", tf_correct: "T", sa_correct: "jiaoshui" },
      ja: { target: "植物に水をやってください", phonetic: "shokubutsu ni mizu wo yatte kudasai",
            mc_options: "水をやる (Siram air)|収穫する (Panen)|肥料を与える (Beri pupuk)", mc_correct: "水をやる (Siram air)",
            match: "水やり=Menyiram|収穫=Memanen|肥料=Memberi pupuk", tf_correct: "T", sa_correct: "mizu" },
      en: { target: "Water the plants", phonetic: "WAH-ter the PLANTS",
            mc_options: "Water the plants (Siram air)|Harvest (Panen)|Add fertilizer (Beri pupuk)", mc_correct: "Water the plants (Siram air)",
            match: "Water=Menyiram|Harvest=Memanen|Fertilizer=Memberi pupuk", tf_correct: "T", sa_correct: "water" },
      ar: { target: "اسقِ النباتات", phonetic: "isqi an-nabataat",
            mc_options: "اسقِ النباتات (Siram air)|احصد (Panen)|أضف السماد (Beri pupuk)", mc_correct: "اسقِ النباتات (Siram air)",
            match: "اسقِ=Menyiram|احصد=Memanen|السماد=Memberi pupuk", tf_correct: "T", sa_correct: "isqi" },
      ko: { target: "식물에 물을 주세요", phonetic: "singmure mul-eul ju-se-yo",
            mc_options: "물을 주세요 (Siram air)|수확하세요 (Panen)|비료를 주세요 (Beri pupuk)", mc_correct: "물을 주세요 (Siram air)",
            match: "물=Menyiram|수확=Memanen|비료=Memberi pupuk", tf_correct: "T", sa_correct: "mul" }
    }
  ],

  "Administration & Office": [
    {
      prompt_id:  "Bagaimana cara mengatakan 'Silakan tandatangani di sini'?",
      meaning_id: "Instruksi meminta tanda tangan pada dokumen.",
      zh: { target: "请在这里签名", phonetic: "qǐng zài zhèlǐ qiānmíng",
            mc_options: "请签名 (Mohon tandatangani)|请盖章 (Mohon stempel)|请打印 (Mohon cetak)", mc_correct: "请签名 (Mohon tandatangani)",
            match: "签名=Tanda tangan|盖章=Stempel|打印=Cetak", tf_correct: "T", sa_correct: "qianming" },
      ja: { target: "ここにサインをお願いします", phonetic: "koko ni sain wo onegai shimasu",
            mc_options: "サインをお願い (Mohon tandatangani)|スタンプをお願い (Mohon stempel)|印刷お願い (Mohon cetak)", mc_correct: "サインをお願い (Mohon tandatangani)",
            match: "サイン=Tanda tangan|スタンプ=Stempel|印刷=Cetak", tf_correct: "T", sa_correct: "sain" },
      en: { target: "Please sign here", phonetic: "PLEEZ sign HEER",
            mc_options: "Please sign here (Mohon tandatangani)|Please stamp here (Mohon stempel)|Please print (Mohon cetak)", mc_correct: "Please sign here (Mohon tandatangani)",
            match: "Sign=Tanda tangan|Stamp=Stempel|Print=Cetak", tf_correct: "T", sa_correct: "sign" },
      ar: { target: "من فضلك وقّع هنا", phonetic: "min fadlik waqqi' huna",
            mc_options: "وقّع هنا (Mohon tandatangani)|ختم هنا (Mohon stempel)|اطبع (Mohon cetak)", mc_correct: "وقّع هنا (Mohon tandatangani)",
            match: "توقيع=Tanda tangan|ختم=Stempel|طباعة=Cetak", tf_correct: "T", sa_correct: "waqqia" },
      ko: { target: "여기에 서명해 주세요", phonetic: "yeogi-e seomyeong-hae ju-se-yo",
            mc_options: "서명해 주세요 (Mohon tandatangani)|도장 찍어 주세요 (Mohon stempel)|인쇄해 주세요 (Mohon cetak)", mc_correct: "서명해 주세요 (Mohon tandatangani)",
            match: "서명=Tanda tangan|도장=Stempel|인쇄=Cetak", tf_correct: "T", sa_correct: "seomyeong" }
    }
  ],

  "Cleaning & Maintenance": [
    {
      prompt_id:  "Bagaimana cara mengatakan 'Sudah selesai dibersihkan'?",
      meaning_id: "Laporan bahwa ruangan/area sudah selesai dibersihkan.",
      zh: { target: "打扫完了", phonetic: "dǎsǎo wán le",
            mc_options: "打扫完了 (Sudah selesai)|还没打扫 (Belum dibersihkan)|正在打扫 (Sedang dibersihkan)", mc_correct: "打扫完了 (Sudah selesai)",
            match: "打扫=Membersihkan|拖地=Mengepel|擦窗=Membersihkan jendela", tf_correct: "T", sa_correct: "dasao" },
      ja: { target: "清掃が終わりました", phonetic: "seisou ga owarimashita",
            mc_options: "清掃が終わりました (Sudah selesai)|まだ終わっていません (Belum)|清掃中です (Sedang dibersihkan)", mc_correct: "清掃が終わりました (Sudah selesai)",
            match: "掃除=Membersihkan|モップがけ=Mengepel|窓拭き=Membersihkan jendela", tf_correct: "T", sa_correct: "seisou" },
      en: { target: "Cleaning is done", phonetic: "KLEE-ning iz DUN",
            mc_options: "Cleaning is done (Sudah selesai)|Not done yet (Belum)|Cleaning in progress (Sedang)", mc_correct: "Cleaning is done (Sudah selesai)",
            match: "Clean=Membersihkan|Mop=Mengepel|Wipe window=Membersihkan jendela", tf_correct: "T", sa_correct: "done" },
      ar: { target: "انتهيت من التنظيف", phonetic: "antahaytu min at-tanzif",
            mc_options: "انتهيت (Sudah selesai)|لم أنتهِ بعد (Belum)|جاري التنظيف (Sedang)", mc_correct: "انتهيت (Sudah selesai)",
            match: "تنظيف=Membersihkan|تمسيح=Mengepel|مسح الزجاج=Membersihkan jendela", tf_correct: "T", sa_correct: "antahaytu" },
      ko: { target: "청소가 끝났습니다", phonetic: "cheongso-ga kkeunnasseumnida",
            mc_options: "청소가 끝났습니다 (Sudah selesai)|아직 안 끝났어요 (Belum)|청소 중입니다 (Sedang)", mc_correct: "청소가 끝났습니다 (Sudah selesai)",
            match: "청소=Membersihkan|걸레질=Mengepel|창문 닦기=Membersihkan jendela", tf_correct: "T", sa_correct: "cheongso" }
    }
  ],

  "Sales & Retail": [
    {
      prompt_id:  "Bagaimana cara mengatakan 'Boleh saya bantu?' kepada pelanggan?",
      meaning_id: "Kalimat menawarkan bantuan kepada pelanggan toko.",
      zh: { target: "我能帮您吗？", phonetic: "wǒ néng bāng nín ma?",
            mc_options: "我能帮您吗？(Boleh saya bantu?)|请稍等 (Tunggu sebentar)|谢谢光临 (Terima kasih sudah datang)", mc_correct: "我能帮您吗？(Boleh saya bantu?)",
            match: "帮=Membantu|买=Membeli|卖=Menjual", tf_correct: "T", sa_correct: "bang" },
      ja: { target: "いらっしゃいませ、何かお手伝いできますか？", phonetic: "irasshaimase, nanika otetsudai dekimasuka?",
            mc_options: "お手伝いできますか？(Boleh saya bantu?)|少々お待ちください (Tunggu)|ありがとうございます (Terima kasih)", mc_correct: "お手伝いできますか？(Boleh saya bantu?)",
            match: "手伝う=Membantu|買う=Membeli|売る=Menjual", tf_correct: "T", sa_correct: "tetsudai" },
      en: { target: "May I help you?", phonetic: "may eye HELP yoo?",
            mc_options: "May I help you? (Boleh saya bantu?)|Please wait (Tunggu)|Thank you for coming (Terima kasih)", mc_correct: "May I help you? (Boleh saya bantu?)",
            match: "Help=Membantu|Buy=Membeli|Sell=Menjual", tf_correct: "T", sa_correct: "help" },
      ar: { target: "هل يمكنني مساعدتك؟", phonetic: "hal yumkinuni musa'adatuk?",
            mc_options: "مساعدتك؟ (Boleh saya bantu?)|انتظر (Tunggu)|شكراً على قدومك (Terima kasih)", mc_correct: "مساعدتك؟ (Boleh saya bantu?)",
            match: "مساعدة=Membantu|شراء=Membeli|بيع=Menjual", tf_correct: "T", sa_correct: "musaadah" },
      ko: { target: "도와드릴까요?", phonetic: "do-wa-deu-ril-kka-yo?",
            mc_options: "도와드릴까요? (Boleh saya bantu?)|잠깐만요 (Tunggu)|감사합니다 (Terima kasih)", mc_correct: "도와드릴까요? (Boleh saya bantu?)",
            match: "도움=Membantu|사다=Membeli|팔다=Menjual", tf_correct: "T", sa_correct: "dowa" }
    }
  ],

  "Transportation": [
    {
      prompt_id:  "Bagaimana cara mengatakan 'Barang sudah dikirim'?",
      meaning_id: "Konfirmasi pengiriman barang telah selesai dilakukan.",
      zh: { target: "货物已经送到了", phonetic: "huòwù yǐjīng sòng dào le",
            mc_options: "货物已经送到 (Sudah dikirim)|货物丢失 (Barang hilang)|货物损坏 (Barang rusak)", mc_correct: "货物已经送到 (Sudah dikirim)",
            match: "货物=Barang|送到=Dikirim|地址=Alamat", tf_correct: "T", sa_correct: "huowu" },
      ja: { target: "荷物は届きました", phonetic: "nimotsu wa todokimashita",
            mc_options: "荷物は届きました (Sudah dikirim)|荷物が紛失しました (Barang hilang)|荷物が破損しました (Barang rusak)", mc_correct: "荷物は届きました (Sudah dikirim)",
            match: "荷物=Barang|届く=Dikirim|住所=Alamat", tf_correct: "T", sa_correct: "nimotsu" },
      en: { target: "The package has been delivered", phonetic: "the PACK-ij has been deh-LIV-erd",
            mc_options: "Package delivered (Sudah dikirim)|Package lost (Hilang)|Package damaged (Rusak)", mc_correct: "Package delivered (Sudah dikirim)",
            match: "Package=Barang|Deliver=Mengirim|Address=Alamat", tf_correct: "T", sa_correct: "delivered" },
      ar: { target: "تم تسليم الطرد", phonetic: "tamma taslim at-tard",
            mc_options: "تم التسليم (Sudah dikirim)|الطرد مفقود (Hilang)|الطرد تالف (Rusak)", mc_correct: "تم التسليم (Sudah dikirim)",
            match: "طرد=Barang|تسليم=Mengirim|عنوان=Alamat", tf_correct: "T", sa_correct: "taslim" },
      ko: { target: "소포가 배달됐습니다", phonetic: "sopo-ga baedal-dwaet-seumnida",
            mc_options: "배달됐습니다 (Sudah dikirim)|분실됐습니다 (Hilang)|파손됐습니다 (Rusak)", mc_correct: "배달됐습니다 (Sudah dikirim)",
            match: "소포=Barang|배달=Mengirim|주소=Alamat", tf_correct: "T", sa_correct: "baedal" }
    }
  ],

  "Other": [
    {
      prompt_id:  "Bagaimana cara mengatakan 'Terima kasih atas bantuan Anda'?",
      meaning_id: "Ucapan terima kasih yang umum di tempat kerja.",
      zh: { target: "感谢您的帮助", phonetic: "gǎnxiè nín de bāngzhù",
            mc_options: "感谢您的帮助 (Terima kasih bantuannya)|对不起 (Maaf)|没关系 (Tidak apa-apa)", mc_correct: "感谢您的帮助 (Terima kasih bantuannya)",
            match: "感谢=Terima kasih|帮助=Bantuan|对不起=Maaf", tf_correct: "T", sa_correct: "ganxie" },
      ja: { target: "お手伝いいただきありがとうございます", phonetic: "otetsudai itadaki arigatou gozaimasu",
            mc_options: "ありがとうございます (Terima kasih)|すみません (Maaf)|大丈夫です (Tidak apa-apa)", mc_correct: "ありがとうございます (Terima kasih)",
            match: "ありがとう=Terima kasih|助け=Bantuan|すみません=Maaf", tf_correct: "T", sa_correct: "arigatou" },
      en: { target: "Thank you for your help", phonetic: "THANK yoo for yor HELP",
            mc_options: "Thank you for help (Terima kasih)|I'm sorry (Maaf)|No problem (Tidak apa-apa)", mc_correct: "Thank you for help (Terima kasih)",
            match: "Thank you=Terima kasih|Help=Bantuan|Sorry=Maaf", tf_correct: "T", sa_correct: "thankyou" },
      ar: { target: "شكراً لمساعدتك", phonetic: "shukran li-musa'adatik",
            mc_options: "شكراً لمساعدتك (Terima kasih)|آسف (Maaf)|لا بأس (Tidak apa-apa)", mc_correct: "شكراً لمساعدتك (Terima kasih)",
            match: "شكراً=Terima kasih|مساعدة=Bantuan|آسف=Maaf", tf_correct: "T", sa_correct: "shukran" },
      ko: { target: "도와주셔서 감사합니다", phonetic: "dowa-ju-syeo-seo gamsa-hamnida",
            mc_options: "감사합니다 (Terima kasih)|죄송합니다 (Maaf)|괜찮아요 (Tidak apa-apa)", mc_correct: "감사합니다 (Terima kasih)",
            match: "감사=Terima kasih|도움=Bantuan|죄송=Maaf", tf_correct: "T", sa_correct: "gamsa" }
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// BUILD ROWS
// ─────────────────────────────────────────────────────────────────────────────
const mainQuestions = [];
const translations  = [];
let idCounter = 1;

const sectorNames = sectors.map(s => s.name);

// We'll generate 100 questions by cycling phrase bank + question types
for (let j = 0; j < 100; j++) {
  const sectorName  = sectorNames[j % sectorNames.length];
  const sector      = sectors[j % sectors.length];
  const bank        = phraseBank[sectorName] || phraseBank["Other"];
  const phraseSet   = bank[Math.floor((j / sectorNames.length)) % bank.length];
  const skill       = skills[j % skills.length];
  const type        = types[j % types.length];
  const lvl         = levels[j % levels.length];
  const idStr       = `Q_GEN_${String(idCounter).padStart(3, '0')}`;
  idCounter++;

  mainQuestions.push({
    "Question_ID":     idStr,
    "Level":           lvl,
    "Job_Group":       sectorName,
    "Skill":           skill,
    "Question_Type":   type,
    "Prompt_ID":       phraseSet.prompt_id,
    "Meaning_ID":      phraseSet.meaning_id,
    "Explanation_ID":  `Grammar: ${lvl === "N3" ? sector.n3g : sector.n2g}`
  });

  languages.forEach((lang) => {
    const p          = phraseSet[lang.code];
    let targetText   = p ? p.target   : `[${lang.name}] ${phraseSet.prompt_id}`;
    let phonetic     = p ? p.phonetic : targetText;
    let optionsStr   = "";
    let correctAnswer= "";

    if (type === "Multiple Choice") {
      optionsStr    = p ? p.mc_options : "";
      correctAnswer = p ? p.mc_correct : "";
    } else if (type === "Matching") {
      optionsStr    = p ? p.match : "";
      correctAnswer = "";
    } else if (type === "True/False") {
      correctAnswer = p ? p.tf_correct : "T";
    } else if (type === "Short Answer" || type === "Speech Repetition") {
      correctAnswer = p ? p.sa_correct : phonetic.split(' ')[0];
    }

    translations.push({
      "Question_ID":     idStr,
      "Language_Code":   lang.code,
      "Target_Text":     targetText,
      "Phonetic":        phonetic,
      "Options_Target":  optionsStr,
      "Correct_Answer":  correctAnswer
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE EXCEL
// ─────────────────────────────────────────────────────────────────────────────
const wb      = XLSX.utils.book_new();
const wsMain  = XLSX.utils.json_to_sheet(mainQuestions);
const wsTrans = XLSX.utils.json_to_sheet(translations);

XLSX.utils.book_append_sheet(wb, wsMain,  "Main_Questions");
XLSX.utils.book_append_sheet(wb, wsTrans, "Translations");

const outputExcel = path.join(__dirname, 'multilingual_questions_100.xlsx');
XLSX.writeFile(wb, outputExcel);

console.log(`\n🎉 SUCCESS! Generated Excel at: ${outputExcel}`);
console.log(`- Main Questions:  ${mainQuestions.length} rows`);
console.log(`- Translations:    ${translations.length} rows`);
