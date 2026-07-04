import React, { useState, useEffect, useRef } from 'react';
import { getStudentChecklist, updateStudentChecklist } from '../utils/db';
import { Compass, FileText, Activity, Award, CheckCircle2, AlertCircle, Clock, ArrowRight, UploadCloud, Camera, Info, Lock, FileCheck, RefreshCw } from 'lucide-react';

const PROCESS_STEPS = [
  {
    stage: '1',
    title: 'Pendaftaran & Seleksi Awal',
    description: 'Penyaringan awal dokumen, fisik, akademik, dan kesehatan.',
    items: [
      { id: 'briefing', label: 'Edukasi & Briefing Seputar Info Peluang Karir, Jenis Program, Pengalaman Kerja & Hidup di Jepang, dll', isOnline: false, type: 'info', desc: 'Briefing tatap muka di kantor LPK SAMIT.' },
      { id: 'doc_admin', label: 'Cek Dokumen (e-KTP, Kartu Keluarga, Akta Kelahiran, Ijazah SMA/SMK)', isOnline: true, type: 'upload', desc: 'Silakan upload foto dokumen asli Anda untuk diverifikasi LPK.' },
      { id: 'physical_check', label: 'Cek Fisik (Tinggi badan, berat badan proporsional/BMI, cek tato/tindik/bekas operasi)', isOnline: false, type: 'info', desc: 'Dilakukan offline di ruang medis LPK.' },
      { id: 'physical_test', label: 'Tes Fisik Dasar & Akademik (Lari, push-up, sit-up, psikotes, matematika dasar)', isOnline: false, type: 'info', desc: 'Dilakukan offline di lapangan olahraga LPK.' },
      { id: 'mcu_1', label: 'Medical Check-Up (MCU) Tahap 1 (Pemeriksaan bebas TBC, ambeien, buta warna, dll)', isOnline: false, type: 'info', desc: 'Harus dilakukan di klinik rujukan LPK.' }
    ]
  },
  {
    stage: '2',
    title: 'Pelatihan Bahasa & Budaya',
    description: 'Pendidikan intensif 3-6 bulan di asrama LPK SAKURA MITRA INTERNASIONAL.',
    items: [
      { id: 'dormitory', label: 'Masuk Asrama & Pembentukan Karakter (Kedisiplinan & Etos Kerja)', isOnline: false, type: 'info', desc: 'Wajib tinggal di asrama selama pelatihan.' },
      { id: 'kaiwa_n4', label: 'Kelas Bahasa Jepang & Percakapan (Target JFT-Basic A2 / JLPT N4)', isOnline: true, type: 'action', screen: 'learn', desc: 'Kerjakan latihan kosakata mingguan di aplikasi ini!' },
      { id: 'jlpt_prep', label: 'Kelas Persiapan Ujian JLPT N3 & N2 (Kondisional *S&K)', isOnline: true, type: 'action', screen: 'learn', desc: 'Kosakata khusus persiapan ujian N3/N2.' },
      { id: 'ssw_prep', label: 'Pelatihan Keterampilan Khusus (SSW Caregiver / Skill Test)', isOnline: true, type: 'action', screen: 'learn', desc: 'Pelatihan istilah khusus keperawatan lansia.' },
      { id: 'cultural_orientation', label: 'Orientasi Budaya & Kebiasaan Hidup di Jepang', isOnline: false, type: 'info', desc: 'Briefing budaya Jepang bersama Sensei native.' }
    ]
  },
  {
    stage: '3',
    title: 'Wawancara Kerja (Job Interview)',
    description: 'Pertemuan langsung dengan perusahaan dan penandatanganan kontrak.',
    items: [
      { id: 'kaiwa_mensetsu', label: 'Simulasi Wawancara Kerja (Mensetsu)', isOnline: true, type: 'action', screen: 'learn', desc: 'Berlatih percakapan wawancara dengan mic.' },
      { id: 'job_interview', label: 'Wawancara Kerja Langsung dengan User Jepang', isOnline: false, type: 'info', desc: 'Didampingi penerjemah LPK secara offline atau online via Zoom.' },
      { id: 'contract_signing', label: 'Tanda Tangan Kontrak Kerja Resmi (Detail Gaji & Fasilitas)', isOnline: false, type: 'info', desc: 'Dilakukan di kantor LPK setelah dinyatakan lulus.' }
    ]
  },
  {
    stage: '4',
    title: 'Pengurusan Dokumen Keberangkatan',
    description: 'Birokrasi imigrasi dan administrasi internasional (3-6 bulan).',
    items: [
      { id: 'mcu_final', label: 'MCU Tahap Akhir (Pemeriksaan kesehatan menyeluruh pra-terbang)', isOnline: false, type: 'info', desc: 'Dilakukan 1 bulan sebelum jadwal keberangkatan.' },
      { id: 'passport', label: 'Pembuatan Paspor & Surat Rekomendasi Disnaker', isOnline: false, type: 'info', desc: 'Pengurusan di Imigrasi setempat dengan pengantar LPK.' },
      { id: 'coe_issuance', label: 'Penerbitan Izin Kelayakan Tinggal (Certificate of Eligibility / CoE)', isOnline: false, type: 'info', desc: 'Diajukan LPK ke Imigrasi Jepang (proses 2-4 bulan).' },
      { id: 'visa_application', label: 'Pengajuan Visa Kerja di Kedutaan Besar Jepang', isOnline: false, type: 'info', desc: 'Diajukan kolektif oleh staf LPK ke Kedubes.' }
    ]
  },
  {
    stage: '5',
    title: 'Pembekalan Akhir & Keberangkatan',
    description: 'Langkah terakhir sebelum resmi terbang ke Jepang.',
    items: [
      { id: 'final_prep', label: 'Pelatihan Pemantapan Bahasa Jepang Kerja & Mental', isOnline: true, type: 'action', screen: 'learn', desc: 'Latihan shadowing intensif kosakata kaigo.' },
      { id: 'opp_bp2mi', label: 'Orientasi Pra-Pemberangkatan (OPP) Resmi dari BP2MI', isOnline: false, type: 'info', desc: 'Pembekalan regulasi dan hak tenaga kerja di luar negeri.' },
      { id: 'flight_departure', label: 'Pembelian Tiket Pesawat & Pelepasan Resmi SAMIT', isOnline: false, type: 'milestone', desc: 'Terbang ke bandara tujuan di Jepang! Selamat berjuang!' }
    ]
  }
];

export default function PathScreen({ progress }) {
  const studentName = 'Budi Utomo'; // Default student in profile
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('1');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const loadStudentData = async () => {
    setLoading(true);
    const data = await getStudentChecklist(studentName);
    if (data) {
      setChecklist(data);
    } else {
      // Create empty checklist if not exist
      const newCheck = {
        studentName,
        lpkId: 'lpk_a',
        statuses: {},
        documents: {},
        notes: {}
      };
      await updateStudentChecklist(studentName, newCheck);
      setChecklist(newCheck);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleUploadClick = (item) => {
    setSelectedItem(item);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedItem) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // Compress image using canvas to WebP 60%
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.6);

        // Update DB
        const updatedStatuses = { ...checklist.statuses, [selectedItem.id]: 'in_progress' };
        const updatedDocs = { ...checklist.documents, [selectedItem.id]: dataUrl };
        const updatedNotes = { ...checklist.notes, [selectedItem.id]: '' }; // Clear old notes

        const updatedChecklist = {
          ...checklist,
          statuses: updatedStatuses,
          documents: updatedDocs,
          notes: updatedNotes
        };

        await updateStudentChecklist(studentName, updatedChecklist);
        setChecklist(updatedChecklist);
        setIsUploading(false);
        setSelectedItem(null);
        alert('Dokumen berhasil diunggah dan sedang dalam verifikasi LPK!');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Calculate stats
  const getProgressStats = () => {
    if (!checklist) return { percentage: 0, completed: 0, total: 0 };
    const allItems = PROCESS_STEPS.flatMap(s => s.items);
    const completed = allItems.filter(item => checklist.statuses[item.id] === 'completed').length;
    return {
      completed,
      total: allItems.length,
      percentage: Math.round((completed / allItems.length) * 100)
    };
  };

  const getStatusBadge = (itemId) => {
    const status = checklist?.statuses[itemId] || 'pending';
    switch (status) {
      case 'completed':
        return <span className="badge badge-green" style={{ fontSize: '10px' }}>✓ Selesai</span>;
      case 'in_progress':
        return <span className="badge badge-blue" style={{ fontSize: '10px' }}>⌛ Verifikasi</span>;
      case 'needs_action':
        return <span className="badge badge-orange" style={{ fontSize: '10px' }}>⚠️ Butuh Aksi</span>;
      default:
        return <span className="badge" style={{ backgroundColor: 'var(--surface-container-high)', color: 'var(--outline)', fontSize: '10px' }}>Belum</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin" color="var(--primary)" size={32} />
      </div>
    );
  }

  const stats = getProgressStats();

  return (
    <div className="screen-content">
      {/* Header & Overall Progress */}
      <div className="card no-press" style={{ backgroundColor: 'var(--surface-container-low)', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
        <Compass size={32} color="var(--primary)" style={{ margin: '0 auto 8px auto' }} />
        <h2 style={{ color: 'var(--primary)' }}>Alur Keberangkatan</h2>
        <p className="body-md">Pantau status pendaftaran, pelatihan, & dokumen kerja Anda.</p>
        
        {/* Progress Bar */}
        <div style={{ marginTop: '16px', backgroundColor: 'var(--surface-container-high)', padding: '12px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', fontWeight: '700' }}>
            <span>Progress Kesiapan Kerja</span>
            <span style={{ color: 'var(--primary)' }}>{stats.percentage}% ({stats.completed}/{stats.total} Selesai)</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${stats.percentage}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.4s' }} />
          </div>
        </div>
      </div>

      {/* Stage Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', marginBottom: '16px', paddingBottom: '4px' }}>
        {PROCESS_STEPS.map(stage => (
          <button
            key={stage.stage}
            onClick={() => setActiveStage(stage.stage)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: activeStage === stage.stage ? '2px solid var(--primary)' : '1px solid var(--outline-variant)',
              backgroundColor: activeStage === stage.stage ? 'var(--primary-container)' : 'transparent',
              color: activeStage === stage.stage ? 'var(--on-primary-container)' : 'var(--on-surface-variant)',
              fontWeight: '700',
              fontSize: '12px',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            Tahap {stage.stage}
          </button>
        ))}
      </div>

      {/* Active Stage Details */}
      {PROCESS_STEPS.map(stage => {
        if (stage.stage !== activeStage) return null;
        return (
          <div key={stage.stage} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ paddingLeft: '8px' }}>
              <h3 style={{ color: 'var(--primary)' }}>Tahap {stage.stage}: {stage.title}</h3>
              <p className="body-sm" style={{ color: 'var(--outline)' }}>{stage.description}</p>
            </div>

            {/* Steps list */}
            {stage.items.map((item, idx) => {
              const status = checklist?.statuses[item.id] || 'pending';
              const hasNotes = checklist?.notes[item.id];
              return (
                <div 
                  key={item.id} 
                  className="card no-press" 
                  style={{ 
                    borderLeft: `4px solid ${status === 'completed' ? 'var(--secondary)' : status === 'needs_action' ? 'var(--tertiary)' : 'var(--outline-variant)'}`,
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--on-surface)' }}>
                      {stage.stage}.{idx + 1} {item.label}
                    </span>
                    {getStatusBadge(item.id)}
                  </div>

                  <p className="body-sm" style={{ color: 'var(--outline)', marginBottom: '12px' }}>
                    {item.desc}
                  </p>

                  {/* Rejected Notes from LPK */}
                  {status === 'needs_action' && hasNotes && (
                    <div style={{ marginBottom: '12px', padding: '8px 12px', backgroundColor: '#fff7ed', border: '1px solid #ffedd5', borderRadius: '8px', color: '#c2410c', fontSize: '11px', fontWeight: '600' }}>
                      Catatan LPK: "{hasNotes}"
                    </div>
                  )}

                  {/* User Interactions */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.type === 'upload' && (
                      <button 
                        className="btn btn-outline" 
                        onClick={() => handleUploadClick(item)}
                        style={{ fontSize: '12px', padding: '6px 12px', height: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <Camera size={14} />
                        {checklist.documents[item.id] ? 'Ganti Foto Bukti' : 'Foto Dokumen Asli'}
                      </button>
                    )}

                    {item.isOnline && item.type === 'action' && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => alert('Buka tab Belajar di menu bawah untuk berlatih kosakata mingguan & mensetsu!')}
                        style={{ fontSize: '12px', padding: '6px 12px', height: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        Mulai Online
                        <ArrowRight size={14} />
                      </button>
                    )}

                    <button 
                      className="action-icon-btn" 
                      onClick={() => alert(`Informasi Proses:\n\n${item.desc}\n\nStatus: ${status.toUpperCase()}\nMetode: ${item.isOnline ? 'Online via Aplikasi' : 'Offline di Kampus LPK'}`)}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    >
                      <Info size={14} />
                    </button>
                  </div>

                  {/* Render Thumbnail if uploaded */}
                  {checklist.documents[item.id] && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img 
                        src={checklist.documents[item.id]} 
                        alt="Preview" 
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--outline-variant)' }} 
                      />
                      <span className="body-sm" style={{ color: 'var(--secondary)', fontWeight: '600' }}>Bukti terunggah (Verifikasi lokal)</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}
