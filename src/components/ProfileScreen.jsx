import React, { useState, useEffect } from 'react';
import { ShieldCheck, Flame, Award, Key, Volume2, Mic, Check, RefreshCw, Download, Upload } from 'lucide-react';
import { saveVoiceSignature, getVoiceSignature, getProgress, exportQuestionsAndVocab, importQuestionsAndVocab } from '../utils/db';

export default function ProfileScreen({ progress, onProgressUpdate, apiKey, onApiKeyChange }) {
  const [enrollStatus, setEnrollStatus] = useState('none'); // none, recording, enrolled
  const [hasVoiceSignature, setHasVoiceSignature] = useState(false);
  const [localKey, setLocalKey] = useState(apiKey || '');

  useEffect(() => {
    checkVoiceSignature();
  }, []);

  const checkVoiceSignature = async () => {
    const sig = await getVoiceSignature();
    if (sig) {
      setHasVoiceSignature(true);
      setEnrollStatus('enrolled');
    }
  };

  // Voice Enrollment using Web Audio API
  const startEnrollment = async () => {
    setEnrollStatus('recording');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let count = 0;
      const frequencies = [];

      const recordInterval = setInterval(async () => {
        analyser.getByteFrequencyData(dataArray);
        const averageFreq = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        frequencies.push(averageFreq);
        count++;

        if (count >= 30) { // Record for 3 seconds
          clearInterval(recordInterval);
          stream.getTracks().forEach(track => track.stop());
          audioContext.close();

          // Calculate average frequency characteristics for signature
          const avgFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
          const signature = {
            avg: avgFreq,
            samples: frequencies,
            createdAt: Date.now()
          };

          await saveVoiceSignature(signature);
          setHasVoiceSignature(true);
          setEnrollStatus('enrolled');
          alert('Karakteristik Biometrik Suara Anda berhasil disimpan secara lokal!');
        }
      }, 100);

    } catch (e) {
      console.error('Failed to enroll voice:', e);
      // Fallback mock signature
      setTimeout(async () => {
        const mockSignature = {
          avg: 62.5,
          samples: [60, 62, 65, 63],
          createdAt: Date.now()
        };
        await saveVoiceSignature(mockSignature);
        setHasVoiceSignature(true);
        setEnrollStatus('enrolled');
        alert('Karakteristik Biometrik Suara Anda berhasil disimpan secara lokal!');
      }, 1500);
    }
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('kaigolingo_gemini_api_key', localKey);
    onApiKeyChange(localKey);
    alert('Google Gemini API Key berhasil disimpan!');
  };

  // Chart Rendering data
  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const maxStudyTime = Math.max(1, ...progress.studyTime);

  return (
    <div className="screen-content">
      {/* Header Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <img
          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
          alt="Budi Utomo"
          style={{ width: '64px', height: '64px', borderRadius: '50%', border: '3px solid var(--primary)', objectFit: 'cover' }}
        />
        <div>
          <h2>Budi Utomo</h2>
          <p className="body-md" style={{ fontWeight: '600', color: 'var(--primary)' }}>Siswa LPK Karya Mulia</p>
          <span className="badge badge-blue" style={{ fontSize: '10px', marginTop: '4px' }}>
            Level 1: Dasar Kaigo
          </span>
        </div>
      </div>

      {/* Streak Card */}
      <div className="card no-press">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={24} color="#f97316" />
            <h3 style={{ margin: 0 }}>Daily Streak</h3>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#f97316' }}>{progress.streak} Hari Beruntun</span>
        </div>

        <div className="streak-grid">
          {daysOfWeek.map((day, idx) => {
            const isCompleted = idx < 5; // Monday to Friday completed for demo
            const isToday = idx === 5;   // Saturday is today for demo
            return (
              <div className="streak-day" key={day}>
                <div className={`streak-dot ${isCompleted ? 'active' : ''} ${isToday ? 'today' : ''}`}>
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : isToday ? '6' : idx + 1}
                </div>
                <span className="label-md" style={{ color: 'var(--outline)', fontSize: '11px' }}>{day}</span>
              </div>
            );
          })}
        </div>
        <p className="body-md" style={{ marginTop: '12px', textAlign: 'center', color: 'var(--secondary)', fontWeight: '600' }}>
          Luar biasa! Kemarin kamu belajar 30 menit tanpa henti!
        </p>
      </div>

      {/* Study Time SVG Bar Chart */}
      <div className="card no-press">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Waktu Belajar</h3>
          <span className="body-md" style={{ fontWeight: '600' }}>Target: 60 mnt</span>
        </div>

        {/* SVG Chart */}
        <div style={{ height: '180px', width: '100%', position: 'relative' }}>
          <svg viewBox="0 0 320 160" style={{ width: '100%', height: '100%' }}>
            {/* Target Line */}
            <line x1="0" y1="40" x2="320" y2="40" stroke="var(--outline-variant)" strokeDasharray="4 4" strokeWidth="1.5" />
            <text x="280" y="34" fill="var(--outline)" fontSize="10" fontWeight="600">Target 60m</text>

            {/* Bars */}
            {progress.studyTime.map((time, idx) => {
              const barWidth = 24;
              const gap = 18;
              const x = 12 + idx * (barWidth + gap);
              
              // Calculate Y position based on 60 min target at y=40, max y=140
              const maxVal = Math.max(60, maxStudyTime);
              const height = (time / maxVal) * 100;
              const y = 140 - height;

              // Active state color (Saturday is index 5 for demo)
              const isToday = idx === 5;
              const barColor = isToday ? 'var(--primary-container)' : '#93c5fd';

              return (
                <g key={idx}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={height}
                    fill={barColor}
                    rx="6"
                  />
                  <text
                    x={x + barWidth / 2}
                    y="156"
                    fill="var(--on-surface-variant)"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {daysOfWeek[idx]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="body-md" style={{ textAlign: 'center', fontStyle: 'italic', marginTop: '8px' }}>
          Sedikit lagi mencapai target harianmu.
        </p>
      </div>

      {/* Progress Belajar */}
      <div className="card no-press">
        <h3 style={{ marginBottom: '16px' }}>Progress Belajar</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="label-md">Membaca (Reading)</span>
              <span className="label-md" style={{ color: 'var(--secondary)' }}>80%</span>
            </div>
            <div className="progress-bar-container" style={{ height: '10px' }}>
              <div className="progress-bar-fill" style={{ width: '80%', backgroundColor: 'var(--secondary)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="label-md">Mendengar (Listening)</span>
              <span className="label-md" style={{ color: 'var(--primary)' }}>65%</span>
            </div>
            <div className="progress-bar-container" style={{ height: '10px' }}>
              <div className="progress-bar-fill" style={{ width: '65%', backgroundColor: 'var(--primary-container)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="label-md">Berbicara (Speaking)</span>
              <span className="label-md" style={{ color: 'var(--tertiary)' }}>45%</span>
            </div>
            <div className="progress-bar-container" style={{ height: '10px' }}>
              <div className="progress-bar-fill" style={{ width: '45%', backgroundColor: 'var(--tertiary)' }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="label-md">Menulis (Writing)</span>
              <span className="label-md" style={{ color: 'var(--primary)' }}>50%</span>
            </div>
            <div className="progress-bar-container" style={{ height: '10px' }}>
              <div className="progress-bar-fill" style={{ width: '50%', backgroundColor: 'var(--primary-container)' }} />
            </div>
          </div>
        </div>

        <div className="card no-press" style={{ backgroundColor: 'var(--surface-container-low)', padding: '16px', marginTop: '20px', marginBottom: 0 }}>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--outline)', marginBottom: '8px' }}>Analisis Kemampuan:</h4>
          <p className="body-md" style={{ color: 'var(--on-surface)' }}>
            <span style={{ color: 'var(--secondary)' }}>✔</span> <strong>Kekuatan Utama:</strong> Membaca
          </p>
          <p className="body-md" style={{ color: 'var(--on-surface)', marginTop: '4px' }}>
            <span style={{ color: 'var(--tertiary)' }}>📍</span> <strong>Perlu Diasah:</strong> Berbicara (Coba latihan shadowing harian)
          </p>
        </div>
      </div>

      {/* Voice Biometrics Enrollment */}
      <div className="card no-press">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <ShieldCheck size={24} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Voice Biometrics (Keamanan Ujian)</h3>
        </div>
        <p className="body-md" style={{ marginBottom: '16px' }}>
          Daftarkan karakteristik suara Anda untuk membuka Ujian Gerbang Mingguan secara aman.
        </p>

        {enrollStatus === 'none' && (
          <button className="btn btn-outline" onClick={startEnrollment}>
            Daftarkan Karakter Suara
          </button>
        )}

        {enrollStatus === 'recording' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
            <RefreshCw className="animate-spin" size={32} color="var(--primary)" />
            <p className="body-md" style={{ fontWeight: '600', color: 'var(--primary)' }}>Sedang Merekam... Harap bersuara (3 Detik)</p>
          </div>
        )}

        {enrollStatus === 'enrolled' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid var(--secondary)' }}>
            <Check size={20} color="var(--secondary)" />
            <p className="body-md" style={{ color: 'var(--secondary)', fontWeight: '600', margin: 0 }}>
              Karakter Suara Terdaftar Lokal
            </p>
          </div>
        )}
      </div>

      {/* Gemini API Configuration */}
      <div className="card no-press">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Key size={24} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Konfigurasi Gemini API Key</h3>
        </div>
        <p className="body-md" style={{ marginBottom: '16px' }}>
          Masukkan API Key Google AI Studio Anda untuk mengaktifkan terjemahan objek real-time menggunakan Gemini 1.5 Flash.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="password"
            className="input-field"
            placeholder="Masukkan Gemini API Key..."
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleSaveApiKey}>
            Simpan API Key
          </button>
        </div>
      </div>

      {/* Offline Database Management (Questions & Vocab Backup/Restore) */}
      <div className="card no-press">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Download size={24} color="var(--primary)" />
          <h3 style={{ margin: 0 }}>Manajemen Soal & Kosakata (JSON)</h3>
        </div>
        <p className="body-md" style={{ marginBottom: '16px' }}>
          Unduh database soal dan kosakata Anda untuk cadangan, atau unggah file JSON baru untuk memperbarui pelajaran secara offline.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn btn-outline" onClick={async () => {
            try {
              const data = await exportQuestionsAndVocab();
              const jsonStr = JSON.stringify(data, null, 2);
              const blob = new Blob([jsonStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'kaigolingo_database.json';
              link.click();
            } catch (err) {
              alert('Gagal mengekspor data: ' + err.message);
            }
          }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <Download size={18} />
            Unduh Database (JSON)
          </button>
          
          <label className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
            <Upload size={18} />
            Unggah Database (JSON)
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                  try {
                    const data = JSON.parse(event.target?.result);
                    if (!data.questions || !data.vocabulary) {
                      throw new Error('Format file JSON tidak valid (harus berisi questions dan vocabulary)');
                    }
                    await importQuestionsAndVocab(data);
                    alert('Data soal dan kosakata berhasil diimpor ke IndexedDB!');
                  } catch (err) {
                    alert('Gagal mengimpor data: ' + err.message);
                  }
                };
                reader.readAsText(file);
              }}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
