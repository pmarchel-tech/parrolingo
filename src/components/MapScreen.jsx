import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, Check, Play, ShieldAlert, 
  Smile, Briefcase, MapPin, AlertTriangle, 
  Heart, Activity, Accessibility, Pill, 
  ClipboardList, Siren, BookOpen, Award 
} from 'lucide-react';

// Map week numbers to themed icons
const getWeekIcon = (weekNumber) => {
  switch (weekNumber) {
    case 1: return Smile;          // Salam & Angka
    case 2: return Briefcase;      // Aisatsu Kerja
    case 3: return MapPin;         // Arah & Lokasi
    case 4: return AlertTriangle;  // Tanda Bahaya
    case 5: return Heart;          // Bagian Tubuh
    case 6: return Activity;       // Keluhan Sakit
    case 7: return Accessibility;  // Alat Bantu
    case 8: return Pill;           // Waktu Minum Obat
    case 9: return ClipboardList;  // Pelaporan (Hou-Ren-So)
    case 10: return Siren;         // Evakuasi Bencana
    case 11: return BookOpen;      // Latihan Soal
    case 12: return Award;         // Simulasi Wawancara
    default: return Smile;
  }
};

const getDestinationCountry = (lang) => {
  switch (lang) {
    case 'ja': return 'Jepang 🇯🇵';
    case 'ko': return 'Korea Selatan 🇰🇷';
    case 'zh': return 'Taiwan 🇹🇼';
    case 'ar': return 'Arab Saudi 🇸🇦';
    case 'en': return 'Inggris / Singapura 🇸🇬';
    default: return 'Negara Tujuan ✈️';
  }
};

const generateWeeksData = (lang, numWeeks) => {
  const allWeeks = [
    { number: 1, title: 'Salam & Tata Krama Dasar', phase: 1, phaseName: 'FASE 1: FONDASI & REFLEKS SOSIAL', desc: 'Ucapan salam harian dasar dan etika penyambutan lansia.', color: 'badge-blue', vocab: ['Selamat Pagi', 'Selamat Siang', 'Selamat Malam', 'Selamat Tidur', 'Tunggu Sebentar'] },
    { number: 2, title: 'Komunikasi Shift Kerja', phase: 1, phaseName: 'FASE 1: FONDASI & REFLEKS SOSIAL', desc: 'Sopan santun kerja, merespons instruksi atasan, dan meminta maaf.', color: 'badge-blue', vocab: ['Terima Kasih Kerja Kerasnya', 'Permisi Masuk', 'Dimengerti / Baik', 'Permisi Mengganggu', 'Maaf'] },
    { number: 3, title: 'Perkenalan Diri & Identitas', phase: 1, phaseName: 'FASE 1: FONDASI & REFLEKS SOSIAL', desc: 'Cara memperkenalkan diri secara profesional kepada lansia dan staf panti.', color: 'badge-blue', vocab: ['Saya', 'Anda', 'Pasien', 'Perawat', 'Bapak Tanaka'] },
    { number: 4, title: 'Menanyakan Kondisi Lansia', phase: 1, phaseName: 'FASE 1: FONDASI & REFLEKS SOSIAL', desc: 'Memeriksa dan bertanya kabar kesehatan atau kenyamanan pasien.', color: 'badge-blue', vocab: ['Sakit', 'Bengkak', 'Lemas', 'Gatal', 'Luka'] },
    { number: 5, title: 'Fasilitas Panti & Arah', phase: 2, phaseName: 'FASE 2: RUANG LINGKUP & NAVIGASI', desc: 'Menjelaskan lokasi ruangan (toilet, kantin, kamar) dan arah jalan.', color: 'badge-green', vocab: ['Toilet', 'Kamar', 'Kantin', 'Dapur', 'Kanan'] },
    { number: 6, title: 'Peralatan Kamar & Ranjang', phase: 2, phaseName: 'FASE 2: RUANG LINGKUP & NAVIGASI', desc: 'Mengenal benda-benda di kamar tidur pasien (selimut, ranjang, bantal).', color: 'badge-green', vocab: ['Ranjang', 'Selimut', 'Popok', 'Pakaian', 'Kamar'] },
    { number: 7, title: 'Angka, Waktu & Jadwal', phase: 2, phaseName: 'FASE 2: RUANG LINGKUP & NAVIGASI', desc: 'Menyebutkan jam, hari, dan menghitung barang operasional.', color: 'badge-green', vocab: ['1 Jam', '2 Menit', '3 Gelas', '5 Obat', '10 Gelas'] },
    { number: 8, title: 'Dokumen Laporan Harian', phase: 2, phaseName: 'FASE 2: RUANG LINGKUP & NAVIGASI', desc: 'Bahasa pelaporan log aktivitas harian (kaigo-kiroku) dan serah terima shift.', color: 'badge-green', vocab: ['memeriksa', 'menyiapkan', 'membawa', 'mengganti', 'membersihkan'] },
    { number: 9, title: 'Anatomi & Bagian Tubuh', phase: 3, phaseName: 'FASE 3: ANATOMI & FISIK PERAWATAN', desc: 'Menyebutkan anggota tubuh lansia untuk bantuan fisik yang presisi.', color: 'badge-orange', vocab: ['Tangan', 'Kaki', 'Pinggang', 'Kepala', 'Punggung'] },
    { number: 10, title: 'Gerakan Tubuh & Mobilitas', phase: 3, phaseName: 'FASE 3: ANATOMI & FISIK PERAWATAN', desc: 'Bantuan fisik saat memindahkan, memapah, atau membalikkan badan lansia.', color: 'badge-orange', vocab: ['membantu', 'membawa', 'Kanan', 'Kiri', 'Pinggang'] },
    { number: 11, title: 'Alat Bantu Jalan & Kursi Roda', phase: 3, phaseName: 'FASE 3: ANATOMI & FISIK PERAWATAN', desc: 'Mengoperasikan kursi roda, tongkat, dan alat bantu penopang tubuh.', color: 'badge-orange', vocab: ['Kursi Roda', 'Tongkat', 'membawa', 'membantu', 'Kiri'] },
    { number: 12, title: 'Kebersihan Diri & Pakaian', phase: 3, phaseName: 'FASE 3: ANATOMI & FISIK PERAWATAN', desc: 'Pendampingan saat mandi, mengganti popok, sprei, dan baju lansia.', color: 'badge-orange', vocab: ['Pakaian', 'Popok', 'membersihkan', 'mengganti', 'Bersih'] },
    { number: 13, title: 'Jenis Makanan & Alat Makan', phase: 4, phaseName: 'FASE 4: ASUPAN & PERAWATAN MEDIS', desc: 'Menyiapkan alat makan (sendok, garpu, gelas) dan menu makanan panti.', color: 'badge-purple', vocab: ['Sendok', 'Gelas', 'Kantin', 'Dapur', 'membawa'] },
    { number: 14, title: 'Pendampingan Makan & Diet', phase: 4, phaseName: 'FASE 4: ASUPAN & PERAWATAN MEDIS', desc: 'Menyuapi pasien, mengawasi tersedak, dan jenis diet (cair/lembut).', color: 'badge-purple', vocab: ['Pasien', 'membantu', '1 Gelas', '3 Gelas', '5 Obat'] },
    { number: 15, title: 'Jadwal Obat & Dosis', phase: 4, phaseName: 'FASE 4: ASUPAN & PERAWATAN MEDIS', desc: 'Instruksi jadwal minum obat: sebelum/sesudah makan, pagi/malam.', color: 'badge-purple', vocab: ['Obat', '1 Obat', '2 Obat', 'memeriksa', 'mengganti'] },
    { number: 16, title: 'Tanda Vital & Suhu Tubuh', phase: 4, phaseName: 'FASE 4: ASUPAN & PERAWATAN MEDIS', desc: 'Mengukur suhu badan (termometer) dan memeriksa tensi pasien.', color: 'badge-purple', vocab: ['Kepala', 'Dada', 'Leher', 'memeriksa', 'Sakit'] },
    { number: 17, title: 'Keluhan Sakit Badan', phase: 5, phaseName: 'FASE 5: GEJALA KLINIS & KELUHAN', desc: 'Mendengarkan keluhan pusing, pegal, kesemutan, atau nyeri sendi.', color: 'badge-teal', vocab: ['Sakit', 'Bengkak', 'Memar', 'Lemas', 'Gatal'] },
    { number: 18, title: 'Pencernaan & Buang Air', phase: 5, phaseName: 'FASE 5: GEJALA KLINIS & KELUHAN', desc: 'Bantuan toilet, memantau diare, konstipasi, atau warna urin.', color: 'badge-teal', vocab: ['Toilet', 'Popok', 'Lemas', 'Sakit', 'mengganti'] },
    { number: 19, title: 'Gejala Batuk & Demam', phase: 5, phaseName: 'FASE 5: GEJALA KLINIS & KELUHAN', desc: 'Menangani pasien yang flu, batuk, pilek, atau menggigil kedinginan.', color: 'badge-teal', vocab: ['Kepala', 'Dada', 'Leher', 'Sakit', 'Lemas'] },
    { number: 20, title: 'Luka, Gatal & Alergi Kulit', phase: 5, phaseName: 'FASE 5: GEJALA KLINIS & KELUHAN', desc: 'Keluhan gatal kulit, luka tekan (dekubitus), memar, atau ruam merah.', color: 'badge-teal', vocab: ['Luka', 'Gatal', 'Bengkak', 'Memar', 'Sakit'] },
    { number: 21, title: 'Kecelakaan Kerja & Jatuh', phase: 6, phaseName: 'FASE 6: PENANGANAN KEJADIAN & DARURAT', desc: 'Merespons pasien jatuh terpeleset, memar, atau berdarah di lantai.', color: 'badge-pink', vocab: ['Pasien', 'Luka', 'Memar', 'Bengkak', 'Sakit'] },
    { number: 22, title: 'Pelaporan Insiden (Hou-Ren-So)', phase: 6, phaseName: 'FASE 6: PENANGANAN KEJADIAN & DARURAT', desc: 'Melaporkan insiden jatuh, alat rusak ke supervisor secara taktis.', color: 'badge-pink', vocab: ['Perawat', 'memeriksa', 'membantu', 'Pasien', 'Luka'] },
    { number: 23, title: 'Tanggap Gempa & Kebakaran', phase: 6, phaseName: 'FASE 6: PENANGANAN KEJADIAN & DARURAT', desc: 'Merespons sirine kebakaran, gempa bumi, mencari jalan keluar.', color: 'badge-pink', vocab: ['Kamar', 'Toilet', 'Kantin', 'Dapur', 'Sakit'] },
    { number: 24, title: 'Evakuasi & Penyelamatan', phase: 6, phaseName: 'FASE 6: PENANGANAN KEJADIAN & DARURAT', desc: 'Prosedur evakuasi pasien ke tempat titik kumpul aman.', color: 'badge-pink', vocab: ['membantu', 'membawa', 'Pasien', 'Kanan', 'Kiri'] },
    { number: 25, title: 'Simulasi Wawancara Kerja', phase: 6, phaseName: 'FASE 6: PENANGANAN KEJADIAN & DARURAT', desc: 'Simulasi wawancara akhir (mensetsu) kerja panti lansia.', color: 'badge-pink', vocab: ['Saya', 'Perawat', 'membantu', 'Bapak Tanaka', 'Ibu Sato'] }
  ];

  return allWeeks.slice(0, numWeeks);
};

const generateMapConfig = (numWeeks) => {
  const coords = {};
  const pathSegments = [];
  const height = numWeeks * 140 + 120;
  
  for (let i = 1; i <= numWeeks; i++) {
    const y = height - (i * 140 - 40);
    let x = 180;
    if (i % 4 === 2) x = 270;
    else if (i % 4 === 0) x = 90;
    
    coords[i] = { x, y };
    
    if (i === 1) {
      pathSegments.push(`M 180 ${y}`);
    } else {
      const prev = coords[i - 1];
      const cp1x = prev.x;
      const cp1y = prev.y - 40;
      const cp2x = x;
      const cp2y = y + 40;
      pathSegments.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`);
    }
  }

  // Generate decorations
  const decorations = [];
  const mapEmojis = ["🌳", "🌸", "🏥", "🏢", "🏠", "🌲", "👵", "👴", "🍵", "🍱", "💊", "🩹", "🧺", "🚿"];
  for (let i = 1; i <= numWeeks; i++) {
    const nodeCoord = coords[i];
    if (nodeCoord) {
      const isLeft = i % 2 === 0;
      const emoji = mapEmojis[i % mapEmojis.length];
      decorations.push({
        x: isLeft ? '30px' : undefined,
        r: isLeft ? undefined : '30px',
        y: nodeCoord.y + 20,
        emoji: emoji
      });
    }
  }

  // Generate clouds
  const clouds = [];
  for (let i = 1; i <= Math.floor(numWeeks / 2); i++) {
    const y = height - (i * 280);
    const isLeft = i % 2 === 0;
    clouds.push({
      y: y,
      size: 30 + (i % 3) * 10,
      anim: isLeft ? 'driftLTR 30s linear infinite' : 'driftRTL 40s linear infinite'
    });
  }

  // Generate phase banners
  const phaseBanners = [];
  const phaseList = [
    { start: 1, label: 'FASE 1: FONDASI', style: { backgroundColor: '#eff6ff', borderColor: '#3b82f6', color: '#1d4ed8' } },
    { start: 5, label: 'FASE 2: RUANG LINGKUP', style: { backgroundColor: '#f0fdf4', borderColor: '#22c55e', color: '#15803d' } },
    { start: 9, label: 'FASE 3: FISIK PERAWATAN', style: { backgroundColor: '#fff7ed', borderColor: '#f97316', color: '#c2410c' } },
    { start: 13, label: 'FASE 4: ASUPAN & MEDIS', style: { backgroundColor: '#faf5ff', borderColor: '#a855f7', color: '#7e22ce' } },
    { start: 17, label: 'FASE 5: GEJALA KLINIS', style: { backgroundColor: '#f0fdfa', borderColor: '#14b8a6', color: '#0f766e' } },
    { start: 21, label: 'FASE 6: DARURAT & SIMULASI', style: { backgroundColor: '#fff5f5', borderColor: '#f43f5e', color: '#be123c' } }
  ];

  phaseList.forEach(ph => {
    if (ph.start <= numWeeks) {
      const nodeCoord = coords[ph.start];
      if (nodeCoord) {
        phaseBanners.push({
          y: nodeCoord.y + 70,
          label: ph.label,
          style: ph.style
        });
      }
    }
  });
  
  return { coords, path: pathSegments.join(' '), height, decorations, clouds, phaseBanners };
};

const VOCAB_TRANSLATIONS = {
  ja: {
    'おはようございます (Selamat Pagi)': 'おはようございます (Selamat Pagi)',
    'いち (Satu)': 'いち (Satu)',
    'に (Dua)': 'に (Dua)',
    'さん (Tiga)': 'さん (Tiga)',
    'おやすみなさい (Selamat Tidur)': 'おやすみなさい (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': 'お疲れ様です (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': '失礼します (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': 'お邪魔します (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': 'かしこまりました (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': '食堂: shokudou (Kantin)',
    'トイレ: toire (Toilet)': 'トイレ: toire (Toilet)',
    'あちら: achira (Sebelah sana)': 'あちら: achira (Sebelah sana)',
    '右: migi (Kanan)': '右: migi (Kanan)',
    '危ない: abunai (Bahaya)': '危ない: abunai (Bahaya)',
    '注意: chuui (Peringatan / Hati-たたみ)': '注意: chuui (Hati-hati)',
    '火事: kaji (Kebakaran)': '火事: kaji (Kebakaran)',
    '助けて: tasukete (Tolong)': '助けて: tasukete (Tolong)',
    '足: ashi (Kaki)': '足: ashi (Kaki)',
    '手: te (Tangan)': '手: te (Tangan)',
    '腰: koshi (Pinggang)': '腰: koshi (Pinggang)',
    '頭: atama (Kepala)': '頭: atama (Kepala)',
    '背中: senaka (Punggung)': '背中: senaka (Punggung)',
    '痛い: itai (Sakit)': '痛い: itai (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': '痛みます: itamimasu (Sakit)',
    '吐き気: hakike (Mual)': '吐き気: hakike (Mual)',
    '熱: netsu (Demam)': '熱: netsu (Demam)',
    '車椅子: kurumaisu (Kursi roda)': '車椅子: kurumaisu (Kursi roda)',
    '杖: tsue (Tongkat)': '杖: tsue (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': '歩行器: hokouki (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': 'ベッド: beddo (Ranjang)',
    '薬: kusuri (Obat)': '薬: kusuri (Obat)',
    '食後: shokugo (Setelah makan)': '食後: shokugo (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': '食前: shokuzen (Sebelum makan)',
    '飲みます: nomimasu (Minum)': '飲みます: nomimasu (Minum)',
    '報告: houkoku (Laporan)': '報告: houkoku (Lapor)',
    '連絡: renraku (Hubungi)': '連絡: renraku (Hubungi)',
    '相談: soudan (Konsultasi)': '相談: soudan (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': '壊れました: kowaremashita (Rusak)',
    '地震: jishin (Gempa bumi)': '地震: jishin (Gempa)',
    '避難: henan (Evakuasi)': '避難: henan (Evakuasi)',
    '火災: kasai (Kebakaran)': '火災: kasai (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': '非常口: hijouguchi (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': '日本語能力試験: jlpt (Ujian JLPT)',
    '練習問題: renshuu mondai (Latihan Soal)': '練習問題: renshuu mondai (Soal)',
    '文法: bunpou (Tata Bahasa)': '文法: bunpou (Tata Bahasa)',
    '読解: dokkai (Membaca)': '読解: dokkai (Membaca)',
    '面接: mensetsu (Wawancara)': '面接: mensetsu (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': '自己紹介 (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': '履歴書 (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': '志望動機 (Motivasi Melamar)'
  },
  zh: {
    'おはようございます (Selamat Pagi)': '早上好: zǎoshang hǎo (Selamat Pagi)',
    'いち (Satu)': '一: yī (Satu)',
    'に (Dua)': '二: èr (Dua)',
    'さん (Tiga)': '三: sān (Tiga)',
    'おやすみなさい (Selamat Tidur)': '晚安: wǎn\'ān (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': '辛苦了: xīnkǔle (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': '打扰了: dǎrǎole (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': '打扰一下 (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': '知道了: zhīdàole (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': '食堂: shítáng (Kantin)',
    'トイレ: toire (Toilet)': '洗手间: xǐshǒujiān (Toilet)',
    'あちら: achira (Sebelah sana)': '那儿: nà\'er (Sebelah sana)',
    '右: migi (Kanan)': '右边: yòubiān (Kanan)',
    '危ない: abunai (Bahaya)': '危险: wēixiǎn (Bahaya)',
    '注意: chuui (Peringatan / Hati-hati)': '注意: zhùyì (Hati-hati)',
    '火事: kaji (Kebakaran)': '着火: zháohuǒ (Kebakaran)',
    '助けて: tasukete (Tolong)': '救命: jiùmìng (Tolong)',
    '足: ashi (Kaki)': '脚: jiǎo (Kaki)',
    '手: te (Tangan)': '手: shǒu (Tangan)',
    '腰: koshi (Pinggang)': '腰: yāo (Pinggang)',
    '頭: atama (Kepala)': '头: tóu (Kepala)',
    '背中: senaka (Punggung)': '背: bèi (Punggung)',
    '痛い: itai (Sakit)': '疼: téng (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': '痛: tòng (Sakit)',
    '吐き気: hakike (Mual)': '恶心: ěxīn (Mual)',
    '熱: netsu (Demam)': '发烧: fāshāo (Demam)',
    '車椅子: kurumaisu (Kursi roda)': '轮椅: lúnyǐ (Kursi roda)',
    '杖: tsue (Tongkat)': '拐杖: guǎizhàng (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': '助行器: zhùxíngqì (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': '床: chuáng (Ranjang)',
    '薬: kusuri (Obat)': '药: yào (Obat)',
    '食後: shokugo (Setelah makan)': '饭后: fànhòu (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': '饭前: fànqián (Sebelum makan)',
    '飲みます: nomimasu (Minum)': '吃药: chīyào (Minum)',
    '報告: houkoku (Laporan)': '报告: bàogào (Lapor)',
    '連絡: renraku (Hubungi)': '联系: liánxì (Hubungi)',
    '相談: soudan (Konsultasi)': '商量: shāngliang (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': '坏了: huàile (Rusak)',
    '地震: jishin (Gempa bumi)': '地震: dìzhèn (Gempa)',
    '避難: henan (Evakuasi)': '避难: bìnán (Evakuasi)',
    '火災: kasai (Kebakaran)': '火灾: huǒzāi (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': '安全出口 (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': '汉语水平考试: hsk (Ujian Bahasa)',
    '練習問題: renshuu mondai (Latihan Soal)': '练习题 (Soal)',
    '文法: bunpou (Tata Bahasa)': '语法: yǔfǎ (Tata Bahasa)',
    '読解: dokkai (Membaca)': '阅读: yuèdú (Membaca)',
    '面接: mensetsu (Wawancara)': '面试: miànshì (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': '自我介绍 (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': '简历: jiǎnlì (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': '求职意向 (Motivasi Melamar)'
  },
  en: {
    'おはようございます (Selamat Pagi)': 'Good Morning (Selamat Pagi)',
    'いち (Satu)': 'One (Satu)',
    'に (Dua)': 'Two (Dua)',
    'さん (Tiga)': 'Three (Tiga)',
    'おやすみなさい (Selamat Tidur)': 'Good Night (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': 'Thank you for your hard work (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': 'Excuse me (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': 'Excuse me (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': 'Understood (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': 'Cafeteria / Dining Hall (Kantin)',
    'トイレ: toire (Toilet)': 'Restroom / Toilet (Toilet)',
    'あちら: achira (Sebelah sana)': 'Over there (Sebelah sana)',
    '右: migi (Kanan)': 'Right (Kanan)',
    '危ない: abunai (Bahaya)': 'Danger (Bahaya)',
    '注意: chuui (Peringatan / Hati-hati)': 'Caution / Attention (Hati-hati)',
    '火事: kaji (Kebakaran)': 'Fire (Kebakaran)',
    '助けて: tasukete (Tolong)': 'Help (Tolong)',
    '足: ashi (Kaki)': 'Leg / Foot (Kaki)',
    '手: te (Tangan)': 'Hand (Tangan)',
    '腰: koshi (Pinggang)': 'Waist / Lower Back (Pinggang)',
    '頭: atama (Kepala)': 'Head (Kepala)',
    '背中: senaka (Punggung)': 'Back (Punggung)',
    '痛い: itai (Sakit)': 'Painful (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': 'It hurts (Sakit)',
    '吐き気: hakike (Mual)': 'Nausea (Mual)',
    '熱: netsu (Demam)': 'Fever (Demam)',
    '車椅子: kurumaisu (Kursi roda)': 'Wheelchair (Kursi roda)',
    '杖: tsue (Tongkat)': 'Cane / Stick (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': 'Walker (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': 'Bed (Ranjang)',
    '薬: kusuri (Obat)': 'Medicine (Obat)',
    '食後: shokugo (Setelah makan)': 'After meals (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': 'Before meals (Sebelum makan)',
    '飲みます: nomimasu (Minum)': 'Drink / Take (Minum)',
    '報告: houkoku (Laporan)': 'Report (Lapor)',
    '連絡: renraku (Hubungi)': 'Contact (Hubungi)',
    '相談: soudan (Konsultasi)': 'Consult (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': 'Broken (Rusak)',
    '地震: jishin (Gempa bumi)': 'Earthquake (Gempa)',
    '避難: henan (Evakuasi)': 'Evacuation (Evakuasi)',
    '火災: kasai (Kebakaran)': 'Fire (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': 'Emergency Exit (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': 'Language Test (Ujian Bahasa)',
    '練習問題: renshuu mondai (Latihan Soal)': 'Practice Exercises (Soal)',
    '文法: bunpou (Tata Bahasa)': 'Grammar (Tata Bahasa)',
    '読解: dokkai (Membaca)': 'Reading Comprehension (Membaca)',
    '面接: mensetsu (Wawancara)': 'Interview (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': 'Self Introduction (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': 'Resume / CV (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': 'Reason for Applying (Motivasi Melamar)'
  },
  ar: {
    'おはようございます (Selamat Pagi)': 'صباح الخير (Selamat Pagi)',
    'いち (Satu)': 'واحد (Satu)',
    'に (Dua)': 'اثنان (Dua)',
    'さん (Tiga)': 'ثلاثة (Tiga)',
    'おやすみなさい (Selamat Tidur)': 'تصبح على خير (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': 'شكرا لجهودكم (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': 'عذراً (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': 'تفضل بالدخول (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': 'مفهوم (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': 'مطعم (Kantin)',
    'トイレ: toire (Toilet)': 'مرحاض (Toilet)',
    'あちら: achira (Sebelah sana)': 'هناك (Sebelah sana)',
    '右: migi (Kanan)': 'يمين (Kanan)',
    '危ない: abunai (Bahaya)': 'خطر (Bahaya)',
    '注意: chuui (Peringatan / Hati-hati)': 'انتباه (Hati-hati)',
    '火事: kaji (Kebakaran)': 'حريق (Kebakaran)',
    '助けて: tasukete (Tolong)': 'النجدة (Tolong)',
    '足: ashi (Kaki)': 'قدم (Kaki)',
    '手: te (Tangan)': 'يد (Tangan)',
    '腰: koshi (Pinggang)': 'خصر (Pinggang)',
    '頭: atama (Kepala)': 'رأس (Kepala)',
    '背中: senaka (Punggung)': 'ظهر (Punggung)',
    '痛い: itai (Sakit)': 'مؤلم (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': 'يؤلم (Sakit)',
    '吐き気: hakike (Mual)': 'غثيان (Mual)',
    '熱: netsu (Demam)': 'حمى (Demam)',
    '車椅子: kurumaisu (Kursi roda)': 'كرسي متحرك (Kursi roda)',
    '杖: tsue (Tongkat)': 'عصا (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': 'مشاية (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': 'سرير (Ranjang)',
    '薬: kusuri (Obat)': 'دواء (Obat)',
    '食後: shokugo (Setelah makan)': 'بعد الأكل (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': 'قبل الأكل (Sebelum makan)',
    '飲みます: nomimasu (Minum)': 'يأخذ الدواء (Minum)',
    '報告: houkoku (Laporan)': 'تقرير (Lapor)',
    '連絡: renraku (Hubungi)': 'اتصال (Hubungi)',
    '相談: soudan (Konsultasi)': 'استشارة (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': 'مكسور (Rusak)',
    '地震: jishin (Gempa bumi)': 'زلزال (Gempa)',
    '避難: henan (Evakuasi)': 'إخلاء (Evakuasi)',
    '火災: kasai (Kebakaran)': 'حريق (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': 'مخرج طوارئ (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': 'امتحان اللغة (Ujian Bahasa)',
    '練習問題: renshuu mondai (Latihan Soal)': 'تمارين (Soal)',
    '文法: bunpou (Tata Bahasa)': 'قواعد (Tata Bahasa)',
    '読解: dokkai (Membaca)': 'قراءة (Membaca)',
    '面接: mensetsu (Wawancara)': 'مقابلة (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': 'تعريف بالنفس (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': 'سيرة ذاتية (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': 'دافع للتقديم (Motivasi Melamar)'
  },
  ko: {
    'おはようございます (Selamat Pagi)': '좋은 아침입니다 (Selamat Pagi)',
    'いち (Satu)': '하나 (Satu)',
    'に (Dua)': '둘 (Dua)',
    'さん (Tiga)': '셋 (Tiga)',
    'おやすみなさい (Selamat Tidur)': '안녕히 주무세요 (Selamat Tidur)',
    'お疲れ様です (Terima kasih atas kerja kerasnya)': '수고하셨습니다 (Terima kasih)',
    '失礼します (Permisi / Maaf mengganggu)': '실례합니다 (Permisi)',
    'お邪魔します (Permisi / Masuk rumah)': '실례하겠습니다 (Permisi Masuk)',
    'かしこまりました (Baik / Dimengerti)': '알겠습니다 (Baik)',
    '食堂: shokudou (Kantin / Ruang makan)': '식당 (Kantin)',
    'トイレ: toire (Toilet)': '화장실 (Toilet)',
    'あちら: achira (Sebelah sana)': '저쪽 (Sebelah sana)',
    '右: migi (Kanan)': '오른쪽 (Kanan)',
    '危ない: abunai (Bahaya)': '위험해 (Bahaya)',
    '注意: chuui (Peringatan / Hati-hati)': '주의 / 조심 (Hati-hati)',
    '火事: kaji (Kebakaran)': '불이야 (Kebakaran)',
    '助けて: tasukete (Tolong)': '살려주세요 (Tolong)',
    '足: ashi (Kaki)': '발 / 다리 (Kaki)',
    '手: te (Tangan)': '손 (Tangan)',
    '腰: koshi (Pinggang)': '허리 (Pinggang)',
    '頭: atama (Kepala)': '머리 (Kepala)',
    '背中: senaka (Punggung)': '등 (Punggung)',
    '痛い: itai (Sakit)': '아프다 (Sakit)',
    '痛みます: itamimasu (Terasa sakit)': '아픕니다 (Sakit)',
    '吐き気: hakike (Mual)': '메스꺼움 (Mual)',
    '熱: netsu (Demam)': '열 (Demam)',
    '車椅子: kurumaisu (Kursi roda)': '휠체어 (Kursi roda)',
    '杖: tsue (Tongkat)': '지팡이 (Tongkat)',
    '歩行器: hokouki (Alat bantu jalan)': '보행기 (Alat bantu jalan)',
    'ベッド: beddo (Tempat tidur)': '침대 (Ranjang)',
    '薬: kusuri (Obat)': '약 (Obat)',
    '食後: shokugo (Setelah makan)': '식후 (Setelah makan)',
    '食前: shokuzen (Sebelum makan)': '식전 (Sebelum makan)',
    '飲みます: nomimasu (Minum)': '약을 먹습니다 (Minum)',
    '報告: houkoku (Laporan)': '보고 (Lapor)',
    '連絡: renraku (Hubungi)': '연락 (Hubungi)',
    '相談: soudan (Konsultasi)': '상담 (Konsultasi)',
    '壊れました: kowaremashita (Rusak)': '고장 났습니다 (Rusak)',
    '地震: jishin (Gempa bumi)': '지진 (Gempa)',
    '避難: henan (Evakuasi)': '대피 (Evakuasi)',
    '火災: kasai (Kebakaran)': '화재 (Kebakaran)',
    '非常口: hijouguchi (Pintu darurat)': '비상구 (Pintu darurat)',
    '日本語能力試験: jlpt (Ujian JLPT)': '시험 (Ujian Bahasa)',
    '練習問題: renshuu mondai (Latihan Soal)': '연습 문제 (Soal)',
    '文法: bunpou (Tata Bahasa)': '문법 (Tata Bahasa)',
    '読解: dokkai (Membaca)': '독해 (Membaca)',
    '面接: mensetsu (Wawancara)': '면접 (Wawancara)',
    '自己紹介: jiko shoukai (Perkenalan Diri)': '자기소개 (Perkenalan Diri)',
    '履歴書: rirekisho (Daftar Riwayat Hidup)': '이력서 (CV / Riwayat Hidup)',
    '志望動機: shibou douki (Motivasi Melamar)': '지원 동기 (Motivasi Melamar)'
  }
};

export default function MapScreen({ progress, onStartSession, onModalOpen, onModalClose }) {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const scrollContainerRef = useRef(null);

  const completedWeeks = Array.isArray(progress?.completedWeeks) ? progress.completedWeeks : [];
  const maxCompletedWeek = completedWeeks.length > 0 ? Math.max(0, ...completedWeeks) : 0;

  const lang = localStorage.getItem('kaigolingo_selected_language') || 'ja';
  
  let numWeeks = 12;
  if (lang === 'ja') numWeeks = 25;
  else if (lang === 'ko') numWeeks = 20;
  else if (lang === 'zh') numWeeks = 15;
  else if (lang === 'ar' || lang === 'en') numWeeks = 10;

  const activeWeek = Math.min(numWeeks, maxCompletedWeek + 1);

  const weeksData = generateWeeksData(lang, numWeeks);
  const { coords, path: fullPathD, height: mapHeight, decorations, clouds, phaseBanners } = generateMapConfig(numWeeks);

  const completedPathSegments = [];
  for (let i = 2; i <= maxCompletedWeek + 1 && i <= numWeeks; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    if (prev && curr) {
      completedPathSegments.push(`C ${prev.x} ${prev.y - 40}, ${curr.x} ${curr.y + 40}, ${curr.x} ${curr.y}`);
    }
  }
  const completedPathD = coords[1] && completedPathSegments.length > 0 
    ? `M 180 ${coords[1].y} ` + completedPathSegments.join(' ') 
    : '';

  const activeCoords = coords[activeWeek];

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  const handleNodeClick = (week) => {
    if (week.number > activeWeek) return; 
    setSelectedWeek(week);
    if (onModalOpen) onModalOpen();
  };

  const practiceCount = selectedWeek ? (progress?.dailyPracticeCounts?.[selectedWeek.number] || 0) : 0;
  const isExamUnlocked = practiceCount >= 3;

  return (
    <div className="screen-content" ref={scrollContainerRef} style={{ padding: 0 }}>
      <style>{`
        @keyframes driftLTR {
          0% { left: -60px; }
          100% { left: 380px; }
        }
        @keyframes driftRTL {
          0% { left: 380px; }
          100% { left: -60px; }
        }
        @keyframes bobbing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
      {/* Map Header */}
      <div style={{ padding: '24px 20px 10px 20px', textAlign: 'center', backgroundColor: 'var(--surface-container-lowest)', borderBottom: '1px solid var(--surface-container-high)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '28px', fontWeight: '700' }}>
          Jalur Belajar
        </h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>
          Mulai dari bawah ke atas. Selesaikan {numWeeks} Minggu untuk terbang ke {getDestinationCountry(lang)}!
        </p>
      </div>

      {/* Map Content Container */}
      <div style={{ 
        position: 'relative', 
        width: '360px', 
        height: `${mapHeight}px`, 
        margin: '20px auto 40px auto',
        backgroundImage: 'radial-gradient(var(--surface-container) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        {/* SVG Winding Path Lines */}
        <svg viewBox={`0 0 360 ${mapHeight}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {/* Background Path (Dashed Gray) */}
          <path 
            d={fullPathD} 
            fill="none" 
            stroke="var(--surface-container-highest)" 
            strokeWidth="12" 
            strokeDasharray="16, 12" 
            strokeLinecap="round" 
          />
          {/* Completed Path (Dashed Green) */}
          {completedPathD && (
            <path 
              d={completedPathD} 
              fill="none" 
              stroke="var(--secondary)" 
              strokeWidth="12" 
              strokeDasharray="16, 12" 
              strokeLinecap="round" 
              style={{ transition: 'stroke-dashoffset 2s ease-in-out' }}
            />
          )}
        </svg>

        {/* Dynamic Map Decorations */}
        {decorations.map((d, idx) => (
          <div 
            key={idx} 
            style={{ 
              position: 'absolute', 
              left: d.x, 
              right: d.r, 
              top: `${d.y}px`, 
              fontSize: '38px', 
              pointerEvents: 'none', 
              opacity: 0.85 
            }}
          >
            {d.emoji}
          </div>
        ))}

        {/* Dynamic Cloud Elements */}
        {clouds.map((c, idx) => (
          <div 
            key={idx} 
            style={{ 
              position: 'absolute', 
              top: `${c.y}px`, 
              fontSize: `${c.size}px`, 
              opacity: 0.3, 
              pointerEvents: 'none', 
              animation: c.anim 
            }}
          >
            ☁️
          </div>
        ))}

        {/* Dynamic Phase Banners */}
        {phaseBanners.map((pb, idx) => (
          <div 
            key={idx} 
            style={{ 
              position: 'absolute', 
              left: '180px', 
              top: `${pb.y}px`, 
              transform: 'translate(-50%, -50%)', 
              zIndex: 5 
            }}
          >
            <div style={{ 
              ...pb.style, 
              padding: '6px 16px', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '11px', 
              fontWeight: '700', 
              border: '1px solid' 
            }}>
              {pb.label}
            </div>
          </div>
        ))}

        {/* Winding Nodes */}
        {weeksData.map((week) => {
          const coord = coords[week.number];
          if (!coord) return null;

          const isCompleted = completedWeeks.includes(week.number);
          const isLocked = week.number > activeWeek;

          return (
            <div
              key={week.number}
              style={{
                position: 'absolute',
                left: `${coord.x}px`,
                top: `${coord.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              {/* Node Circular Button */}
              <div
                onClick={() => handleNodeClick(week)}
                style={{
                  position: 'relative',
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  backgroundColor: isCompleted ? 'var(--secondary)' : isLocked ? 'var(--surface-container-highest)' : 'var(--primary-container)',
                  border: isCompleted ? '5px solid #005236' : isLocked ? '5px solid var(--surface-dim)' : '5px solid var(--primary)',
                  boxShadow: isLocked 
                    ? 'none' 
                    : isCompleted 
                      ? '0 6px 0 0 #004d34, 0 8px 12px rgba(0, 108, 73, 0.15)' 
                      : '0 6px 0 0 #1e40af, 0 8px 12px rgba(37, 99, 235, 0.2)',
                  color: 'white',
                  transform: 'scale(1)',
                  transition: 'all 0.15s ease'
                }}
                className="map-node-btn"
              >
                {(() => {
                  const IconComponent = getWeekIcon(week.number);
                  return (
                    <IconComponent 
                      size={32} 
                      strokeWidth={2.5} 
                      color={isLocked ? 'var(--outline)' : 'white'} 
                    />
                  );
                })()}

                {/* Lock Badge for Locked Nodes */}
                {isLocked && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      backgroundColor: 'var(--surface-dim)',
                      border: '2px solid var(--outline-variant)',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Lock size={12} color="var(--outline)" />
                  </div>
                )}
              </div>

              {/* Node Label */}
              <div
                style={{
                  marginTop: '10px',
                  fontFamily: 'var(--font-display)',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: isLocked ? 'var(--outline)' : 'var(--on-surface)',
                  textAlign: 'center',
                  maxWidth: '120px',
                  lineHeight: '16px',
                  backgroundColor: 'var(--surface-container-lowest)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                {week.title}
              </div>
            </div>
          );
        })}

        {/* Character Avatar Walking Along the Path */}
        {activeCoords && (
          <div
            style={{
              position: 'absolute',
              left: `${activeCoords.x}px`,
              top: `${activeCoords.y - 54}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
              transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            {/* Bobbing Container */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                animation: 'bobbing 2s ease-in-out infinite'
              }}
            >
              {/* Speech Bubble */}
              <div style={{
                backgroundColor: 'var(--primary-container)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '10px',
                fontWeight: '700',
                marginBottom: '4px',
                boxShadow: 'var(--shadow-soft-pop)',
                whiteSpace: 'nowrap',
                position: 'relative'
              }}>
                Mulai Belajar! 🎯
                <div style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  width: '8px',
                  height: '8px',
                  backgroundColor: 'var(--primary-container)'
                }} />
              </div>

              {/* Avatar Circle */}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                border: '3px solid white',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                backgroundColor: '#cbd5e1'
              }}>
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                  alt="Avatar Siswa"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Week Details Modal */}
      {selectedWeek && (
        <div className="modal-backdrop" onClick={() => { setSelectedWeek(null); if (onModalClose) onModalClose(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className={`badge ${selectedWeek.color}`} style={{ fontSize: '11px', fontWeight: '700' }}>
                {selectedWeek.phaseName}
              </span>
              <button 
                onClick={() => { setSelectedWeek(null); if (onModalClose) onModalClose(); }}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--outline)', padding: '4px' }}
              >
                &times;
              </button>
            </div>
            
            <h2 style={{ marginBottom: '8px', fontSize: '22px' }}>Minggu {selectedWeek.number}: {selectedWeek.title}</h2>
            <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '20px', fontSize: '15px', lineHeight: '22px' }}>
              {selectedWeek.desc}
            </p>

            <div className="card no-press" style={{ backgroundColor: 'var(--surface-container-low)', padding: '16px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Kosakata Inti:
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedWeek.vocab.map((v, idx) => {
                  const lang = localStorage.getItem('kaigolingo_selected_language') || 'ja';
                  const displayVocab = VOCAB_TRANSLATIONS[lang]?.[v] || v;
                  return (
                    <span key={idx} style={{ padding: '6px 12px', backgroundColor: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                      {displayVocab}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Weekly Gate Lock Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              backgroundColor: isExamUnlocked ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.05)',
              border: isExamUnlocked ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.12)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '22px' }}>{isExamUnlocked ? '🔓' : '🔒'}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: isExamUnlocked ? 'var(--secondary)' : 'var(--error)' }}>
                    {isExamUnlocked ? 'Ujian Gerbang Terbuka' : 'Ujian Gerbang Terkunci'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>
                    Latihan diselesaikan: <strong>{practiceCount}</strong> dari 3 kali.
                  </div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: isExamUnlocked ? 'var(--secondary)' : 'var(--error)', backgroundColor: 'var(--surface-container-lowest)', padding: '2px 8px', borderRadius: '10px' }}>
                {practiceCount}/3
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  onStartSession(selectedWeek.number, 'practice');
                  setSelectedWeek(null);
                }}
              >
                <Play size={18} style={{ marginRight: '8px', fill: 'currentColor' }} />
                Mulai Latihan Harian
              </button>

              <button 
                className="btn btn-secondary"
                disabled={!isExamUnlocked}
                onClick={() => {
                  onStartSession(selectedWeek.number, 'exam');
                  setSelectedWeek(null);
                }}
                style={{
                  opacity: isExamUnlocked ? 1 : 0.6,
                  cursor: isExamUnlocked ? 'pointer' : 'not-allowed',
                  backgroundColor: isExamUnlocked ? 'var(--secondary-container)' : 'var(--surface-container-highest)',
                  color: isExamUnlocked ? 'var(--on-secondary-container)' : 'var(--outline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldAlert size={18} style={{ marginRight: '8px' }} />
                Ujian Gerbang Mingguan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
