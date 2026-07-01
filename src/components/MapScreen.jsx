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

const WEEKS_DATA = [
  {
    number: 1,
    title: 'Salam & Angka 1-20',
    phase: 1,
    phaseName: 'FASE 1: FONDASI & REFLEKS KERJA',
    desc: 'Belajar menyapa pasien dan mengucapkan angka dasar untuk keperluan panti.',
    color: 'badge-blue',
    vocab: [
      'おはようございます (Selamat Pagi)',
      'いち (Satu)',
      'に (Dua)',
      'さん (Tiga)',
      'おやすみなさい (Selamat Tidur)'
    ],
  },
  {
    number: 2,
    title: 'Aisatsu Kerja',
    phase: 1,
    phaseName: 'FASE 1: FONDASI & REFLEKS KERJA',
    desc: 'Salam formal dan bahasa santun saat bekerja di panti lansia Jepang.',
    color: 'badge-blue',
    vocab: [
      'お疲れ様です (Terima kasih atas kerja kerasnya)',
      '失礼します (Permisi / Maaf mengganggu)',
      'お邪魔します (Permisi / Masuk rumah)',
      'かしこまりました (Baik / Dimengerti)'
    ],
  },
  {
    number: 3,
    title: 'Arah & Lokasi Ruangan',
    phase: 1,
    phaseName: 'FASE 1: FONDASI & REFLEKS KERJA',
    desc: 'Menemukan ruangan panti, dapur, toilet, dan mengarahkan lansia.',
    color: 'badge-blue',
    vocab: [
      '食堂: shokudou (Kantin / Ruang makan)',
      'トイレ: toire (Toilet)',
      'あちら: achira (Sebelah sana)',
      '右: migi (Kanan)'
    ],
  },
  {
    number: 4,
    title: 'Tanda Bahaya Operasional',
    phase: 1,
    phaseName: 'FASE 1: FONDASI & REFLEKS KERJA',
    desc: 'Mengidentifikasi kode bahaya (Anzen) dan merespons alarm darurat.',
    color: 'badge-blue',
    vocab: [
      '危ない: abunai (Bahaya)',
      '注意: chuui (Peringatan / Hati-hati)',
      '火事: kaji (Kebakaran)',
      '助けて: tasukete (Tolong)'
    ],
  },
  {
    number: 5,
    title: 'Bagian Tubuh Lansia',
    phase: 2,
    phaseName: 'FASE 2: SPESIALISASI TUGAS MANDIRI KAIGO',
    desc: 'Mengenal anatomi tubuh lansia untuk pendampingan mobilitas yang aman.',
    color: 'badge-green',
    vocab: [
      '足: ashi (Kaki)',
      '手: te (Tangan)',
      '腰: koshi (Pinggang)',
      '頭: atama (Kepala)',
      '背中: senaka (Punggung)'
    ],
  },
  {
    number: 6,
    title: 'Keluhan Sakit Pasien',
    phase: 2,
    phaseName: 'FASE 2: SPESIALISASI TUGAS MANDIRI KAIGO',
    desc: 'Mendengarkan keluhan lansia tentang rasa sakit, pusing, atau mual.',
    color: 'badge-green',
    vocab: [
      '痛い: itai (Sakit)',
      '痛みます: itamimasu (Terasa sakit)',
      '吐き気: hakike (Mual)',
      '熱: netsu (Demam)'
    ],
  },
  {
    number: 7,
    title: 'Nama Alat Bantu',
    phase: 2,
    phaseName: 'FASE 2: SPESIALISASI TUGAS MANDIRI KAIGO',
    desc: 'Kosakata kursi roda, tongkat, ranjang dorong, dan alat bantu lainnya.',
    color: 'badge-green',
    vocab: [
      '車椅子: kurumaisu (Kursi roda)',
      '杖: tsue (Tongkat)',
      '歩行器: hokouki (Alat bantu jalan)',
      'ベッド: beddo (Tempat tidur)'
    ],
  },
  {
    number: 8,
    title: 'Waktu Minum Obat',
    phase: 2,
    phaseName: 'FASE 2: SPESIALISASI TUGAS MANDIRI KAIGO',
    desc: 'Membaca jadwal obat: sebelum/sesudah makan, dosis, dan konfirmasi obat.',
    color: 'badge-green',
    vocab: [
      '薬: kusuri (Obat)',
      '食後: shokugo (Setelah makan)',
      '食前: shokuzen (Sebelum makan)',
      '飲みます: nomimasu (Minum)'
    ],
  },
  {
    number: 9,
    title: 'Pelaporan Kerusakan (Hou-Ren-So)',
    phase: 2,
    phaseName: 'FASE 2: SPESIALISASI TUGAS MANDIRI KAIGO',
    desc: 'Melaporkan masalah alat rusak atau kejadian tidak biasa ke atasan.',
    color: 'badge-green',
    vocab: [
      '報告: houkoku (Melapor)',
      '連絡: renraku (Menghubungi)',
      '相談: soudan (Konsultasi)',
      '故障: koshou (Kerusakan)'
    ],
  },
  {
    number: 10,
    title: 'Evakuasi Bencana (Bousai)',
    phase: 2,
    phaseName: 'FASE 2: SPESIALISASI TUGAS MANDIRI KAIGO',
    desc: 'Instruksi keselamatan saat gempa bumi, kebakaran, dan evakuasi panti.',
    color: 'badge-green',
    vocab: [
      '地震: jishin (Gempa bumi)',
      '避難: hinan (Evakuasi)',
      '出口: deguchi (Pintu keluar)',
      '落ち着いて: ochitsuite (Tenanglah)'
    ],
  },
  {
    number: 11,
    title: 'Latihan Soal JFT-Basic A2',
    phase: 3,
    phaseName: 'FASE 3: KESIAPAN UJIAN & INTERVIEW',
    desc: 'Uji kemampuan bahasa Jepang standar A2 untuk kelulusan ujian resmi.',
    color: 'badge-pink',
    vocab: [
      '問題: mondai (Soal / Masalah)',
      '文法: bunpou (Tata bahasa)',
      '読解: dokkai (Membaca)',
      '聴解: choukai (Mendengarkan)'
    ],
  },
  {
    number: 12,
    title: 'Simulasi Wawancara AI',
    phase: 3,
    phaseName: 'FASE 3: KESIAPAN UJIAN & INTERVIEW',
    desc: 'Simulasi wawancara dengan pewawancara Jepang tanpa teks bantu.',
    color: 'badge-pink',
    vocab: [
      '自己紹介: jikoshoukai (Perkenalan diri)',
      '志望動機: shiboudouki (Alasan melamar)',
      '面接: mensetsu (Wawancara)'
    ],
  }
];

// Exact coordinates for a 360 x 1800 winding map path
const NODE_COORDINATES = {
  1: { x: 180, y: 1680 },
  2: { x: 270, y: 1540 },
  3: { x: 180, y: 1400 },
  4: { x: 90,  y: 1260 },
  5: { x: 180, y: 1120 },
  6: { x: 270, y: 980 },
  7: { x: 180, y: 840 },
  8: { x: 90,  y: 700 },
  9: { x: 180, y: 560 },
  10: { x: 270, y: 420 },
  11: { x: 180, y: 280 },
  12: { x: 180, y: 140 }
};

// SVG Cubic Bezier Path segments connecting centers of nodes (from bottom 1 to top 12)
const PATH_SEGMENTS = [
  "M 180 1680", // Start at Week 1
  "C 240 1680, 270 1610, 270 1540", // 1 -> 2
  "C 270 1470, 240 1400, 180 1400", // 2 -> 3
  "C 120 1400, 90 1330, 90 1260",   // 3 -> 4
  "C 90 1190, 120 1120, 180 1120",   // 4 -> 5
  "C 240 1120, 270 1050, 270 980",   // 5 -> 6
  "C 270 910, 240 840, 180 840",     // 6 -> 7
  "C 120 840, 90 770, 90 700",       // 7 -> 8
  "C 90 630, 120 560, 180 560",       // 8 -> 9
  "C 240 560, 270 490, 270 420",     // 9 -> 10
  "C 270 350, 220 280, 180 280",     // 10 -> 11
  "L 180 140"                        // 11 -> 12
];

export default function MapScreen({ progress, onStartSession }) {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const scrollContainerRef = useRef(null);

  const completedWeeks = Array.isArray(progress?.completedWeeks) ? progress.completedWeeks : [];
  const maxCompletedWeek = completedWeeks.length > 0 ? Math.max(0, ...completedWeeks) : 0;
  const activeWeek = Math.min(12, maxCompletedWeek + 1);

  // Scroll to bottom (Week 1) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  const handleNodeClick = (week) => {
    if (week.number > activeWeek) return; // Locked
    setSelectedWeek(week);
  };

  // Build the completed path segment dynamically
  const completedSegments = PATH_SEGMENTS.slice(0, maxCompletedWeek + 1);
  const completedPathD = completedSegments.join(" ");
  const fullPathD = PATH_SEGMENTS.join(" ");

  // Active node coordinates for the avatar
  const activeCoords = NODE_COORDINATES[activeWeek];

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
      `}</style>
      {/* Map Header */}
      <div style={{ padding: '24px 20px 10px 20px', textAlign: 'center', backgroundColor: 'var(--surface-container-lowest)', borderBottom: '1px solid var(--surface-container-high)' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', fontSize: '28px', fontWeight: '700' }}>
          Jalur Belajar
        </h1>
        <p className="body-md" style={{ color: 'var(--on-surface-variant)', fontSize: '14px', marginTop: '4px' }}>
          Mulai dari bawah ke atas. Selesaikan 12 Minggu untuk terbang ke Jepang! ✈️
        </p>
      </div>

      {/* Map Content Container */}
      <div style={{ 
        position: 'relative', 
        width: '360px', 
        height: '1820px', 
        margin: '20px auto 40px auto',
        backgroundImage: 'radial-gradient(var(--surface-container) 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}>
        {/* SVG Winding Path Lines */}
        <svg viewBox="0 0 360 1820" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
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
          {maxCompletedWeek > 0 && (
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

        {/* Floating Winding Map Elements (Trees, Clouds) for Game Atmosphere */}
        <div style={{ position: 'absolute', left: '35px', top: '1500px', fontSize: '38px', pointerEvents: 'none', opacity: 0.85 }}>🌲</div>
        <div style={{ position: 'absolute', right: '25px', top: '1350px', fontSize: '38px', pointerEvents: 'none', opacity: 0.85 }}>🌸</div>
        <div style={{ position: 'absolute', left: '15px', top: '1100px', fontSize: '38px', pointerEvents: 'none', opacity: 0.85 }}>🏢</div>
        <div style={{ position: 'absolute', right: '35px', top: '900px', fontSize: '38px', pointerEvents: 'none', opacity: 0.85 }}>🌲</div>
        <div style={{ position: 'absolute', left: '25px', top: '650px', fontSize: '38px', pointerEvents: 'none', opacity: 0.85 }}>🏥</div>
        <div style={{ position: 'absolute', right: '15px', top: '480px', fontSize: '38px', pointerEvents: 'none', opacity: 0.85 }}>🌸</div>
        <div style={{ position: 'absolute', left: '35px', top: '250px', fontSize: '38px', pointerEvents: 'none', opacity: 0.85 }}>⛩️</div>

        {/* Animated Floating Clouds */}
        <div style={{ position: 'absolute', top: '150px', fontSize: '34px', opacity: 0.35, pointerEvents: 'none', animation: 'driftLTR 25s linear infinite' }}>☁️</div>
        <div style={{ position: 'absolute', top: '580px', fontSize: '42px', opacity: 0.25, pointerEvents: 'none', animation: 'driftRTL 35s linear infinite' }}>☁️</div>
        <div style={{ position: 'absolute', top: '1020px', fontSize: '36px', opacity: 0.3, pointerEvents: 'none', animation: 'driftLTR 30s linear infinite' }}>☁️</div>
        <div style={{ position: 'absolute', top: '1480px', fontSize: '38px', opacity: 0.35, pointerEvents: 'none', animation: 'driftRTL 28s linear infinite' }}>☁️</div>

        {/* Winding Phase Headers */}
        <div style={{ position: 'absolute', left: '180px', top: '1770px', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
          <div style={{ backgroundColor: '#eff6ff', color: 'var(--primary)', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '700', border: '1px solid var(--outline-variant)' }}>
            FASE 1: FONDASI
          </div>
        </div>
        <div style={{ position: 'absolute', left: '180px', top: '1200px', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
          <div style={{ backgroundColor: '#ecfdf5', color: 'var(--secondary)', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '700', border: '1px solid #a7f3d0' }}>
            FASE 2: TUGAS MANDIRI
          </div>
        </div>
        <div style={{ position: 'absolute', left: '180px', top: '360px', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
          <div style={{ backgroundColor: '#fff1f2', color: 'var(--tertiary)', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '11px', fontWeight: '700', border: '1px solid #fecdd3' }}>
            FASE 3: UJIAN & INTERVIEW
          </div>
        </div>

        {/* Winding Nodes (Week 1 to Week 12) */}
        {WEEKS_DATA.map((week) => {
          const coords = NODE_COORDINATES[week.number];
          const isCompleted = completedWeeks.includes(week.number);
          const isActive = week.number === activeWeek;
          const isLocked = week.number > activeWeek;

          return (
            <div
              key={week.number}
              style={{
                position: 'absolute',
                left: `${coords.x}px`,
                top: `${coords.y}px`,
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

              {/* Node Label (Positioned Below/Above depending on space, let's place it below) */}
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
              top: `${activeCoords.y - 54}px`, // Place slightly above the center of the node
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
                {/* Small arrow down */}
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
        <div className="modal-backdrop" onClick={() => setSelectedWeek(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className={`badge ${selectedWeek.color}`} style={{ fontSize: '11px', fontWeight: '700' }}>
                {selectedWeek.phaseName}
              </span>
              <button 
                onClick={() => setSelectedWeek(null)}
                style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: 'var(--outline)', padding: '4px' }}
              >
                &times;
              </button>
            </div>
            
            <h2 style={{ marginBottom: '8px', fontSize: '22px' }}>Minggu {selectedWeek.number}: {selectedWeek.title}</h2>
            <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginBottom: '20px', fontSize: '15px', lineHeight: '22px' }}>
              {selectedWeek.desc}
            </p>

            <div className="card no-press" style={{ backgroundColor: 'var(--surface-container-low)', padding: '16px', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                Kosakata Inti:
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedWeek.vocab.map((v, idx) => (
                  <span key={idx} style={{ padding: '6px 12px', backgroundColor: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                    {v}
                  </span>
                ))}
              </div>
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
                onClick={() => {
                  onStartSession(selectedWeek.number, 'exam');
                  setSelectedWeek(null);
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
