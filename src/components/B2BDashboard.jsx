import React, { useState, useEffect } from 'react';
import { getLogs, getProgress, saveProgress, getStudentChecklist, updateStudentChecklist, seedDefaultChecklists } from '../utils/db';
import { ShieldCheck, Calendar, Clock, User, Award, QrCode, CheckSquare, Square, Plane, HeartHandshake, FileCheck, Ban, Edit3 } from 'lucide-react';

const PROCESS_ITEMS = {
  departure: [
    { id: 'briefing', label: '1.1 Edukasi & Briefing Karir & Hidup di Jepang' },
    { id: 'doc_admin', label: '1.2 Cek Dokumen (e-KTP, KK, Akta, Ijazah)', type: 'upload' },
    { id: 'physical_check', label: '1.3 Cek Fisik & Pengukuran BMI' },
    { id: 'physical_test', label: '1.4 Tes Fisik Dasar & Akademik' },
    { id: 'mcu_1', label: '1.5 Medical Check-Up (MCU) Tahap 1' },
    
    { id: 'dormitory', label: '2.1 Masuk Asrama & Pembentukan Karakter' },
    { id: 'kaiwa_n4', label: '2.2 Kelas Bahasa Jepang & Percakapan (N4/JFT)' },
    { id: 'jlpt_prep', label: '2.3 Kelas Ujian JLPT N3 & N2 (Kondisional)' },
    { id: 'ssw_prep', label: '2.4 Pelatihan Keterampilan Caregiver (SSW)' },
    { id: 'cultural_orientation', label: '2.5 Orientasi Budaya & Hidup di Jepang' },
    
    { id: 'kaiwa_mensetsu', label: '3.1 Simulasi Wawancara Kerja (Mensetsu)' },
    { id: 'job_interview', label: '3.2 Wawancara Kerja dengan User Jepang' },
    { id: 'contract_signing', label: '3.3 Tanda Tangan Kontrak Kerja Resmi' },
    
    { id: 'mcu_final', label: '4.1 MCU Tahap Akhir' },
    { id: 'passport', label: '4.2 Pembuatan Paspor & Rekomendasi Disnaker' },
    { id: 'coe_issuance', label: '4.3 Penerbitan Kelayakan Tinggal (CoE)' },
    { id: 'visa_application', label: '4.4 Pengajuan Visa Kerja di Kedubes' },
    
    { id: 'final_prep', label: '5.1 Pelatihan Pemantapan Bahasa & Mental' },
    { id: 'opp_bp2mi', label: '5.2 Orientasi Pra-Pemberangkatan BP2MI' },
    { id: 'flight_departure', label: '5.3 Pembelian Tiket & Pelepasan Resmi' }
  ],
  support: [
    { id: 'alumni_visit', label: '6.1 Kunjungan & Evaluasi ALUMNI di Jepang' },
    { id: 'alumni_monitoring', label: '6.2 Pengawasan & Pelayanan ALUMNI (Konsultasi)' },
    { id: 'alumni_gathering', label: '6.3 Gathering & Workshop ALUMNI' }
  ]
};

const STUDENTS_BY_LPK = {
  lpk_a: ['Budi Utomo', 'Siti Rahma'],
  lpk_b: ['Agus Wijaya', 'Dewi Lestari']
};

export default function B2BDashboard({ progress, onProgressUpdate }) {
  const [selectedLpk, setSelectedLpk] = useState('lpk_a'); // lpk_a (Sakura Mitra Internasional), lpk_b (Prima Husada)
  const [logs, setLogs] = useState([]);
  const [viewAlumni, setViewAlumni] = useState(false);
  
  // Student Checklist State
  const [selectedStudent, setSelectedStudent] = useState('Budi Utomo');
  const [checklist, setChecklist] = useState(null);
  const [rejectNotesText, setRejectNotesText] = useState('');
  const [showRejectInputId, setShowRejectInputId] = useState(null);

  useEffect(() => {
    const students = STUDENTS_BY_LPK[selectedLpk] || [];
    if (students.length > 0 && !students.includes(selectedStudent)) {
      setSelectedStudent(students[0]);
    }
  }, [selectedLpk]);

  useEffect(() => {
    const initChecklists = async () => {
      await seedDefaultChecklists();
      loadStudentChecklist();
    };
    initChecklists();
  }, [selectedStudent, selectedLpk]);

  const loadStudentChecklist = async () => {
    if (!selectedStudent) return;
    const data = await getStudentChecklist(selectedStudent);
    if (data) {
      setChecklist(data);
    } else {
      const newCheck = {
        studentName: selectedStudent,
        lpkId: selectedLpk,
        statuses: {},
        documents: {},
        notes: {}
      };
      await updateStudentChecklist(selectedStudent, newCheck);
      setChecklist(newCheck);
    }
  };

  const handleUpdateStatus = async (itemId, newStatus) => {
    if (!checklist) return;

    const updatedStatuses = { ...checklist.statuses, [itemId]: newStatus };
    const updatedChecklist = {
      ...checklist,
      statuses: updatedStatuses
    };

    if (newStatus === 'completed' && updatedChecklist.notes[itemId]) {
      updatedChecklist.notes[itemId] = ''; // Clear notes
    }

    await updateStudentChecklist(selectedStudent, updatedChecklist);
    setChecklist(updatedChecklist);
  };

  const handleRejectDocument = async (itemId) => {
    if (!checklist || !rejectNotesText.trim()) return;

    const updatedStatuses = { ...checklist.statuses, [itemId]: 'needs_action' };
    const updatedNotes = { ...checklist.notes, [itemId]: rejectNotesText };

    const updatedChecklist = {
      ...checklist,
      statuses: updatedStatuses,
      notes: updatedNotes
    };

    await updateStudentChecklist(selectedStudent, updatedChecklist);
    setChecklist(updatedChecklist);
    setRejectNotesText('');
    setShowRejectInputId(null);
    alert('Dokumen berhasil ditolak dengan catatan verifikasi!');
  };

  const getStudentProgress = () => {
    if (!checklist) return { percentage: 0, checkedCount: 0, totalCount: 0 };
    const allItems = [
      ...PROCESS_ITEMS.departure,
      ...PROCESS_ITEMS.support
    ];
    const checkedCount = allItems.filter(item => checklist.statuses[item.id] === 'completed').length;
    return {
      percentage: Math.round((checkedCount / allItems.length) * 100) || 0,
      checkedCount,
      totalCount: allItems.length
    };
  };
  
  // Simulator State
  const [isDay85Simulated, setIsDay85Simulated] = useState(false);
  const [paywallModal, setPaywallModal] = useState(false);
  const [isPaidB2C, setIsPaidB2C] = useState(false);

  const loadLogs = async () => {
    const data = await getLogs(selectedLpk);
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, [selectedLpk]);

  useEffect(() => {
    if (progress.isPaidB2C) {
      setIsPaidB2C(true);
    }
  }, [progress]);

  // Filter logs by alumni status
  const filteredLogs = logs.filter(log => log.isAlumni === viewAlumni);

  // Trigger Paywall Simulation
  const handleSimulateDay85 = (checked) => {
    setIsDay85Simulated(checked);
    if (checked && !isPaidB2C) {
      setPaywallModal(true);
    }
  };

  const handleSimulatePayment = async () => {
    const updatedProgress = { ...progress, isPaidB2C: true };
    await saveProgress(updatedProgress);
    onProgressUpdate(updatedProgress);
    setIsPaidB2C(true);
    setPaywallModal(false);
    alert('Pembayaran QRIS Berhasil! Akun Anda kini aktif selamanya sebagai B2C Kamus Saku Jepang.');
  };

  const stats = getStudentProgress();

  return (
    <div className="screen-content">
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ color: 'var(--primary)' }}>Dashboard B2B LPK</h1>
        <p className="body-md">Sistem pemantauan dan pengelolaan siswa terisolasi.</p>
      </div>

      {/* Multi-Tenancy LPK Selector */}
      <div className="card no-press" style={{ backgroundColor: 'var(--surface-container-low)', padding: '16px' }}>
        <label className="label-md" style={{ color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
          Pilih Institusi LPK (Isolasi Data):
        </label>
        <select
          className="input-field"
          value={selectedLpk}
          onChange={(e) => setSelectedLpk(e.target.value)}
          style={{ appearance: 'none', cursor: 'pointer', fontWeight: '700' }}
        >
          <option value="lpk_a">LPK Sakura Mitra Internasional (Budi, Siti)</option>
          <option value="lpk_b">LPK Prima Husada (Agus, Dewi)</option>
        </select>
      </div>

      {/* Day 85 Simulator Control */}
      <div className="card no-press" style={{ border: '2px dashed var(--tertiary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'var(--tertiary)' }}>Simulasi Hari ke-85 (Akhir Pelatihan)</h3>
            <p className="body-md" style={{ maxWidth: '240px' }}>Aktifkan untuk menguji paywall B2C pembatasan akses siswa.</p>
          </div>
          <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '26px' }}>
            <input 
              type="checkbox" 
              checked={isDay85Simulated}
              onChange={(e) => handleSimulateDay85(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{ 
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: isDay85Simulated ? 'var(--tertiary)' : '#ccc', 
              transition: '.4s', borderRadius: '34px' 
            }}>
              <span style={{ 
                position: 'absolute', content: '""', height: '18px', width: '18px', left: isDay85Simulated ? '26px' : '4px', bottom: '4px', 
                backgroundColor: 'white', transition: '.4s', borderRadius: '50%' 
              }}/>
            </span>
          </label>
        </div>
        
        {isPaidB2C && (
          <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#ecfdf5', borderRadius: '8px', color: 'var(--secondary)', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>
            Status Akun: B2C Premium Aktif Selamanya
          </div>
        )}
      </div>

      {/* Student Checklist Tracker Card */}
      <div className="card no-press" style={{ padding: '24px', backgroundColor: '#ffffff', border: '1px solid var(--surface-container-high)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span className="badge badge-orange" style={{ marginBottom: '8px', fontSize: '10px', display: 'inline-block' }}>Akses Peran: Staf LPK (Admin)</span>
              <h2 style={{ color: 'var(--primary)', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                Kelola Alur & Dokumen Keberangkatan
              </h2>
              <p className="body-md" style={{ margin: '4px 0 0 0', color: 'var(--outline)' }}>Mencatat pemeriksaan offline & menyetujui dokumen unggahan siswa.</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="body-md" style={{ fontWeight: '600' }}>Siswa:</span>
              <select
                className="input-field"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                style={{ width: '180px', padding: '6px 12px', height: '36px', appearance: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                {(STUDENTS_BY_LPK[selectedLpk] || []).map(student => (
                  <option key={student} value={student}>{student}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Progress Bar */}
          {checklist && (
            <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--primary)' }}>
                  Kesiapan Keberangkatan Siswa ({selectedStudent})
                </span>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--secondary)' }}>
                  {stats.percentage}% ({stats.checkedCount} dari {stats.totalCount} Selesai)
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-container-high)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${stats.percentage}%`, 
                  height: '100%', 
                  backgroundColor: stats.percentage === 100 ? 'var(--secondary)' : 'var(--primary)', 
                  transition: 'width 0.4s ease' 
                }} />
              </div>
            </div>
          )}

          {/* Checklist Sections */}
          {checklist && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginTop: '8px' }}>
              {/* Section 1: Pra & Pasca Keberangkatan */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', borderBottom: '2px solid var(--primary)', paddingBottom: '6px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <Plane size={16} />
                  Proses & Dokumen Keberangkatan (Tahap 1 - 5)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                  {PROCESS_ITEMS.departure.map(item => {
                    const status = checklist.statuses[item.id] || 'pending';
                    const hasDoc = checklist.documents[item.id];
                    return (
                      <div 
                        key={item.id} 
                        style={{ 
                          padding: '12px', 
                          borderRadius: '8px', border: '1px solid var(--surface-container-high)', 
                          backgroundColor: status === 'completed' ? '#f0fdf4' : '#ffffff',
                          transition: 'all 0.2s', fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', color: 'var(--on-surface)' }}>{item.label}</span>
                          <select
                            value={status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              border: '1px solid var(--outline-variant)', 
                              fontSize: '11px',
                              backgroundColor: status === 'completed' ? '#ecfdf5' : '#fff'
                            }}
                          >
                            <option value="pending">Belum</option>
                            <option value="in_progress">Verifikasi</option>
                            <option value="completed">Selesai</option>
                            <option value="needs_action">Aksi Siswa</option>
                          </select>
                        </div>

                        {/* If Document is uploaded */}
                        {item.type === 'upload' && hasDoc && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: 'var(--surface-container-low)', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <img src={hasDoc} alt="KTP" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                              <div>
                                <span className="badge badge-blue" style={{ fontSize: '9px', marginBottom: '4px' }}>Bukti Terunggah</span>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button 
                                    className="btn btn-outline" 
                                    onClick={() => handleUpdateStatus(item.id, 'completed')}
                                    style={{ fontSize: '10px', height: '24px', padding: '2px 8px' }}
                                  >
                                    Setujui
                                  </button>
                                  <button 
                                    className="btn" 
                                    onClick={() => setShowRejectInputId(item.id)}
                                    style={{ fontSize: '10px', height: '24px', padding: '2px 8px', backgroundColor: '#fee2e2', color: '#ef4444' }}
                                  >
                                    Tolak
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Show Reject Modal/Box inline */}
                            {showRejectInputId === item.id && (
                              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <input
                                  type="text"
                                  className="input-field"
                                  placeholder="Tulis alasan penolakan dokumen..."
                                  value={rejectNotesText}
                                  onChange={(e) => setRejectNotesText(e.target.value)}
                                  style={{ fontSize: '11px', height: '28px', padding: '4px 8px' }}
                                />
                                <button 
                                  className="btn btn-primary"
                                  onClick={() => handleRejectDocument(item.id)}
                                  style={{ fontSize: '10px', height: '24px', padding: '2px 8px' }}
                                >
                                  Kirim Penolakan
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {checklist.notes[item.id] && (
                          <div style={{ marginTop: '6px', color: '#c2410c', fontSize: '10px', fontWeight: '600' }}>
                            Catatan LPK: "{checklist.notes[item.id]}"
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Support Alumni */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={{ fontSize: '14px', borderBottom: '2px solid var(--secondary)', paddingBottom: '6px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <HeartHandshake size={16} />
                  Dukungan & Evaluasi Alumni (Pasca Keberangkatan)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {PROCESS_ITEMS.support.map(item => {
                    const status = checklist.statuses[item.id] || 'pending';
                    return (
                      <div 
                        key={item.id} 
                        style={{ 
                          padding: '12px', 
                          borderRadius: '8px', border: '1px solid var(--surface-container-high)', 
                          backgroundColor: status === 'completed' ? '#f0fdf4' : '#ffffff',
                          transition: 'all 0.2s', fontSize: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '700', color: 'var(--on-surface)' }}>{item.label}</span>
                          <select
                            value={status}
                            onChange={(e) => handleUpdateStatus(item.id, e.target.value)}
                            style={{ 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              border: '1px solid var(--outline-variant)', 
                              fontSize: '11px',
                              backgroundColor: status === 'completed' ? '#ecfdf5' : '#fff'
                            }}
                          >
                            <option value="pending">Belum</option>
                            <option value="in_progress">Berjalan</option>
                            <option value="completed">Selesai</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Audit & Logs Tracker */}
      <div className="card no-press">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Log Kepatuhan Digital</h3>
          
          {/* Alumni Tracker Toggle */}
          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--surface-container-high)', padding: '4px', borderRadius: 'var(--radius-full)' }}>
            <button 
              onClick={() => setViewAlumni(false)}
              style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: !viewAlumni ? 'white' : 'transparent', fontWeight: '700', fontSize: '11px', cursor: 'pointer', color: !viewAlumni ? 'var(--primary)' : 'var(--on-surface-variant)' }}
            >
              Aktif
            </button>
            <button 
              onClick={() => setViewAlumni(true)}
              style={{ padding: '4px 12px', borderRadius: 'var(--radius-full)', border: 'none', backgroundColor: viewAlumni ? 'white' : 'transparent', fontWeight: '700', fontSize: '11px', cursor: 'pointer', color: viewAlumni ? 'var(--primary)' : 'var(--on-surface-variant)' }}
            >
              Alumni
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-container-high)', color: 'var(--outline)' }}>
                <th style={{ padding: '8px' }}>Siswa</th>
                <th style={{ padding: '8px' }}>Aktivitas</th>
                <th style={{ padding: '8px' }}>Durasi</th>
                <th style={{ padding: '8px' }}>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--outline)' }}>
                    Tidak ada data log siswa.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--surface-container-low)' }}>
                    <td style={{ padding: '8px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} color="var(--outline)" />
                        {log.studentName}
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>{log.activity}</td>
                    <td style={{ padding: '8px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {log.duration}m
                      </div>
                    </td>
                    <td style={{ padding: '8px', color: 'var(--outline)' }}>
                      {new Date(log.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QRIS / BANK PAYWALL MODAL */}
      {paywallModal && (
        <div className="modal-backdrop" onClick={() => setPaywallModal(false)}>
          <div className="modal-content paywall-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setPaywallModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <QrCode size={48} color="var(--tertiary)" style={{ margin: '0 auto 12px auto' }} />
            <h2 style={{ color: 'var(--tertiary)' }}>Akses Pelatihan 12 Minggu Selesai</h2>
            <p className="body-md" style={{ margin: '8px 0 20px 0' }}>
              Masa belajar LPK Anda telah habis. Amankan Kamus Mandiri dan Buku Saku Digital buatan Anda sendiri agar dapat diakses selamanya saat bekerja di Jepang!
            </p>

            {/* QRIS Simulator Image */}
            <div className="qris-code">
              <div style={{ textAlign: 'center', padding: '20px', border: '2px solid #000', borderRadius: '8px' }}>
                <div style={{ fontWeight: '900', fontSize: '18px', letterSpacing: '2px' }}>QRIS</div>
                <div style={{ width: '120px', height: '120px', backgroundColor: '#e2e8f0', margin: '10px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--outline)' }}>
                  [QR Kode Simulasi]
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700' }}>KAIGOLINGO B2C</div>
              </div>
            </div>

            <div className="card no-press" style={{ backgroundColor: 'var(--surface-container-low)', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Metode Pembayaran Alternatif:</h3>
              <p className="body-md"><strong>Transfer Bank:</strong> Bank Mandiri 123-456-7890</p>
              <p className="body-md"><strong>Atas Nama:</strong> PT KaigoLingo Indonesia</p>
              <p className="body-md" style={{ marginTop: '8px', color: 'var(--primary)', fontWeight: '700', fontSize: '15px' }}>
                Total Bayar: Rp 49.000 (Bayar Sekali)
              </p>
            </div>

            <button className="btn btn-secondary" onClick={handleSimulatePayment}>
              Simpan & Konfirmasi Pembayaran (Simulasi)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
