import React, { useState, useEffect } from 'react';
import { 
  getLogs, 
  getStudentChecklist, 
  updateStudentChecklist, 
  getDormRooms,
  saveDormRoom,
  getFinancialLedgers,
  updateFinancialLedger,
  getJobListings,
  addJobListing,
  getRegistrations,
  updateRegistrationStatus,
  getReferralClaims,
  updateReferralStatus,
  addLog,
  seedDefaultChecklists
} from '../../src/utils/db.js';
import { 
  ShieldCheck, Calendar, Clock, User, Award, CheckSquare, Square, Plane, 
  HeartHandshake, FileCheck, Ban, Edit3, BedDouble, Wallet, Users, Briefcase, 
  PlayCircle, RefreshCw, Send, CheckCircle2, AlertCircle, FileSignature, 
  LogOut, PlusCircle, Check, Search, Sparkles, Building, Video
} from 'lucide-react';

const PROCESS_ITEMS = {
  departure: [
    { id: 'briefing', label: '1.1 Edukasi & Briefing Karir' },
    { id: 'doc_admin', label: '1.2 Cek Dokumen (e-KTP, KK, Ijazah)' },
    { id: 'physical_check', label: '1.3 Cek Fisik & Pengukuran BMI' },
    { id: 'physical_test', label: '1.4 Tes Fisik Dasar & Akademik' },
    { id: 'mcu_1', label: '1.5 Medical Check-Up (MCU) Tahap 1' },
    { id: 'dormitory', label: '2.1 Masuk Asrama & Karakter' },
    { id: 'kaiwa_n4', label: '2.2 Kelas Bahasa Jepang (N4/JFT)' },
    { id: 'jlpt_prep', label: '2.3 Kelas Ujian JLPT Prep' },
    { id: 'ssw_prep', label: '2.4 Pelatihan Caregiver (SSW)' },
    { id: 'cultural_orientation', label: '2.5 Orientasi Budaya Jepang' },
    { id: 'kaiwa_mensetsu', label: '3.1 Wawancara Kerja (Mensetsu)' },
    { id: 'job_interview', label: '3.2 Wawancara dengan User Jepang' },
    { id: 'contract_signing', label: '3.3 Tanda Tangan Kontrak' },
    { id: 'mcu_final', label: '4.1 MCU Tahap Akhir' },
    { id: 'passport', label: '4.2 Pembuatan Paspor & Rekomendasi' },
    { id: 'coe_issuance', label: '4.3 Penerbitan CoE (Kelayakan)' },
    { id: 'visa_application', label: '4.4 Pengajuan Visa Kerja' },
    { id: 'final_prep', label: '5.1 Pembekalan Mental & Bahasa' },
    { id: 'opp_bp2mi', label: '5.2 Orientasi Pra-Pemberangkatan' },
    { id: 'flight_departure', label: '5.3 Tiket Penerbangan & Terbang' }
  ]
};

const STUDENTS_BY_LPK = {
  lpk_a: ['Budi Utomo', 'Siti Rahma'],
  lpk_b: ['Agus Wijaya', 'Dewi Lestari']
};

export default function LPKDashboard() {
  const [activeRole, setActiveRole] = useState('lpk_admin'); // lpk_admin, perusahaan_jepang, penyalur_agency
  const [selectedLpk, setSelectedLpk] = useState('lpk_a');
  
  // Navigation Screens per Role
  const [activeTab, setActiveTab] = useState('overview'); 
  
  // Database States
  const [checklist, setChecklist] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState('Budi Utomo');
  const [dormRooms, setDormRooms] = useState([]);
  const [financialLedgers, setFinancialLedgers] = useState([]);
  const [jobListings, setJobListings] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [referralClaims, setReferralClaims] = useState([]);
  const [logs, setLogs] = useState([]);

  // Form states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  
  // Partner & Job creation states
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    requirements: ''
  });
  
  // Talent Filtering
  const [filterProgram, setFilterProgram] = useState('kaigo');
  const [filterCert, setFilterCert] = useState('all');

  // Evaluation Form
  const [selectedAlumni, setSelectedAlumni] = useState('Siti Rahma');
  const [alumniEval, setAlumniEval] = useState({
    rating: 'A',
    comment: ''
  });

  // Bed allocation modal
  const [showBedModal, setShowBedModal] = useState(false);
  const [targetBedSlot, setTargetBedSlot] = useState(null); // { roomId, bedId }
  const [tempStudentName, setTempStudentName] = useState('');

  // Load Data
  useEffect(() => {
    const initData = async () => {
      try {
        await seedDefaultChecklists();
      } catch (e) {
        console.error("Seeding failed: ", e);
      }
      await refreshData();
    };
    initData();
  }, [selectedStudent, selectedLpk]);

  const refreshData = async () => {
    try {
      const checkData = await getStudentChecklist(selectedStudent);
      if (checkData) setChecklist(checkData);

      const rooms = await getDormRooms();
      setDormRooms(rooms);

      const ledgers = await getFinancialLedgers();
      setFinancialLedgers(ledgers);

      const jobs = await getJobListings();
      setJobListings(jobs);

      const regs = await getRegistrations();
      setRegistrations(regs);

      const claims = await getReferralClaims();
      setReferralClaims(claims);

      const auditLogs = await getLogs(selectedLpk);
      setLogs(auditLogs || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Switch tabs when changing roles
  useEffect(() => {
    setActiveTab('overview');
  }, [activeRole]);

  // Adjust Student selector when switching LPK
  useEffect(() => {
    const students = STUDENTS_BY_LPK[selectedLpk] || [];
    if (students.length > 0 && !students.includes(selectedStudent)) {
      setSelectedStudent(students[0]);
    }
  }, [selectedLpk]);

  // Financial Stats Calculation
  const getFinancialStats = () => {
    let totalKas = 0;
    let totalTalangan = 0;
    let outstandingTalangan = 0;
    financialLedgers.forEach(l => {
      totalKas += l.paidAmount || 0;
      totalTalangan += l.totalCost || 0;
      outstandingTalangan += ((l.totalCost || 0) - (l.paidAmount || 0));
    });
    return { totalKas, totalTalangan, outstandingTalangan };
  };

  const { totalKas, totalTalangan, outstandingTalangan } = getFinancialStats();

  // 1. LPK Admin Check-in / Check-out Bed Room Manual
  const handleAssignBed = async () => {
    if (!targetBedSlot || !tempStudentName.trim()) return;
    const { roomId, bedIndex } = targetBedSlot;
    
    const updatedRooms = dormRooms.map(room => {
      if (room.roomId === roomId) {
        const newBeds = [...room.beds];
        newBeds[bedIndex] = { ...newBeds[bedIndex], occupiedBy: tempStudentName.trim(), status: 'occupied' };
        return { ...room, beds: newBeds };
      }
      return room;
    });

    const targetRoom = updatedRooms.find(r => r.roomId === roomId);
    if (targetRoom) {
      await saveDormRoom(targetRoom);
      await addLog({
        lpkId: selectedLpk,
        timestamp: Date.now(),
        action: `Check-in Asrama`,
        details: `${tempStudentName} dialokasikan ke ${targetRoom.name} - Ranjang ${bedIndex + 1}`
      });
      await refreshData();
    }
    setShowBedModal(false);
    setTempStudentName('');
  };

  const handleReleaseBed = async (roomId, bedIndex, studentName) => {
    const confirm = window.confirm(`Apakah Anda yakin ingin membebaskan ranjang untuk ${studentName}?`);
    if (!confirm) return;

    const updatedRooms = dormRooms.map(room => {
      if (room.roomId === roomId) {
        const newBeds = [...room.beds];
        newBeds[bedIndex] = { ...newBeds[bedIndex], occupiedBy: '', status: 'available' };
        return { ...room, beds: newBeds };
      }
      return room;
    });

    const targetRoom = updatedRooms.find(r => r.roomId === roomId);
    if (targetRoom) {
      await saveDormRoom(targetRoom);
      await addLog({
        lpkId: selectedLpk,
        timestamp: Date.now(),
        action: `Check-out Asrama`,
        details: `Ranjang ${bedIndex + 1} di ${targetRoom.name} dikosongkan (Siswa: ${studentName})`
      });
      await refreshData();
    }
  };

  // 2. LPK Admin / Penyalur Approval of salary deduction installments
  const handleVerifyInstallment = async (studentName, installmentIndex) => {
    const ledger = financialLedgers.find(l => l.studentName === studentName);
    if (!ledger) return;

    const updatedInstallments = [...(ledger.loanInstallments || [])];
    updatedInstallments[installmentIndex] = {
      ...updatedInstallments[installmentIndex],
      status: 'Paid',
      disputed: false // Clear any student dispute claims
    };

    const totalPaid = updatedInstallments
      .filter(ins => ins.status === 'Paid')
      .reduce((sum, ins) => sum + ins.amount, 0);

    const updatedLedger = {
      ...ledger,
      loanInstallments: updatedInstallments,
      paidAmount: totalPaid,
      remainingAmount: ledger.totalCost - totalPaid
    };

    await updateFinancialLedger(updatedLedger);
    await addLog({
      lpkId: selectedLpk,
      timestamp: Date.now(),
      action: `Persetujuan Potong Gaji`,
      details: `Penerimaan cicilan Bulan ke-${installmentIndex + 1} dari ${studentName} disetujui`
    });
    await refreshData();
  };

  // 3. Reject / Dispute installment claim
  const handleRejectDispute = async (studentName, installmentIndex) => {
    const ledger = financialLedgers.find(l => l.studentName === studentName);
    if (!ledger) return;

    const updatedInstallments = [...(ledger.loanInstallments || [])];
    updatedInstallments[installmentIndex] = {
      ...updatedInstallments[installmentIndex],
      disputed: false // Reset dispute flag
    };

    const updatedLedger = {
      ...ledger,
      loanInstallments: updatedInstallments
    };

    await updateFinancialLedger(updatedLedger);
    alert(`Sanggahan cicilan siswa ditolak. LPK akan memproses investigasi slip gaji Jepang secara manual.`);
    await refreshData();
  };

  // 4. LPK Admin Pre-screening Registration Approval & temporary key generation
  const handleApproveRegistration = async (email, name) => {
    // Generate simple activation key for mobile app
    const tempKey = 'HK-' + Math.floor(100000 + Math.random() * 900000);
    await updateRegistrationStatus(email, 'Joined');
    await addLog({
      lpkId: selectedLpk,
      timestamp: Date.now(),
      action: `Pendaftaran Disetujui`,
      details: `${name} dinyatakan lulus seleksi. Token Aktivasi Akun Belajar: ${tempKey}`
    });
    alert(`Calon siswa ${name} disetujui!\nKirimkan token aktivasi ini ke nomor mereka:\n🔑 ${tempKey}`);
    await refreshData();
  };

  const handleRejectRegistration = async (email, name) => {
    await updateRegistrationStatus(email, 'Rejected');
    await addLog({
      lpkId: selectedLpk,
      timestamp: Date.now(),
      action: `Pendaftaran Ditolak`,
      details: `Calon siswa ${name} ditolak karena tidak memenuhi kriteria fisik/buta warna`
    });
    await refreshData();
  };

  // 5. Penyalur / Sending Agency: Add job listings
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.company) return;

    const job = {
      jobId: 'job-' + Date.now(),
      title: newJob.title,
      company: newJob.company,
      location: newJob.location,
      salary: newJob.salary,
      requirements: newJob.requirements,
      postedDate: new Date().toLocaleDateString('id-ID')
    };

    await addJobListing(job);
    setNewJob({ title: '', company: '', location: '', salary: '', requirements: '' });
    alert('Lowongan pekerjaan baru dipublikasikan untuk alumni & pekerja!');
    await refreshData();
  };

  // 6. Mitra Jepang: Submit Alumnus Performance review
  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    const l = financialLedgers.find(ledger => ledger.studentName === selectedAlumni);
    if (!l) return;

    const updatedLedger = {
      ...l,
      evaluations: [
        ...(l.evaluations || []),
        {
          evalId: 'eval-' + Date.now(),
          reviewer: 'Sakura Care Facility',
          rating: alumniEval.rating,
          comment: alumniEval.comment,
          date: new Date().toLocaleDateString('id-ID')
        }
      ]
    };

    await updateFinancialLedger(updatedLedger);
    await addLog({
      lpkId: selectedLpk,
      timestamp: Date.now(),
      action: `Ulasan Kinerja Alumni`,
      details: `Mitra Jepang mengirim ulasan kinerja (${alumniEval.rating}) untuk ${selectedAlumni}`
    });
    setAlumniEval({ rating: 'A', comment: '' });
    alert(`Evaluasi ulasan untuk ${selectedAlumni} berhasil dikirim ke LPK!`);
    await refreshData();
  };

  // LPK Admin: Checkbox checklist status
  const handleToggleChecklist = async (itemId, currentStatus) => {
    if (!checklist) return;
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    const updatedStatuses = { ...checklist.statuses, [itemId]: newStatus };
    const updatedChecklist = { ...checklist, statuses: updatedStatuses };

    await updateStudentChecklist(selectedStudent, updatedChecklist);
    await addLog({
      lpkId: selectedLpk,
      timestamp: Date.now(),
      action: `Update Alur Proses`,
      details: `Siswa ${selectedStudent}: Tahap ${itemId} diubah menjadi ${newStatus.toUpperCase()}`
    });
    await refreshData();
  };

  return (
    <div className="lpk-layout">
      {/* Sidebar Nav */}
      <aside className="lpk-sidebar">
        <div className="lpk-logo-area">
          <Building size={28} color="var(--primary)" />
          <h2 className="lpk-logo-title">Hikari LPK Center</h2>
        </div>

        {/* Global Role Switcher */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--outline)', fontWeight: '700' }}>Simulasi Peran</label>
          <select 
            value={activeRole} 
            onChange={(e) => setActiveRole(e.target.value)}
            className="input-field"
            style={{ marginTop: '4px', border: '2px solid var(--primary)', backgroundColor: 'var(--primary-container)', fontWeight: '700' }}
          >
            <option value="lpk_admin">🏫 LPK Admin / Owner</option>
            <option value="perusahaan_jepang">🏢 Mitra User (Jepang)</option>
            <option value="penyalur_agency">🤝 Penyalur (Sending Agency)</option>
          </select>
        </div>

        <nav className="sidebar-nav">
          {activeRole === 'lpk_admin' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Ringkasan LPK</button>
              <button className={`sidebar-link ${activeTab === 'asrama' ? 'active' : ''}`} onClick={() => setActiveTab('asrama')}>Peta Ranjang Asrama</button>
              <button className={`sidebar-link ${activeTab === 'keuangan' ? 'active' : ''}`} onClick={() => setActiveTab('keuangan')}>Buku Kas & Cicilan</button>
              <button className={`sidebar-link ${activeTab === 'siswa_proses' ? 'active' : ''}`} onClick={() => setActiveTab('siswa_proses')}>Alur Kerja Siswa</button>
              <button className={`sidebar-link ${activeTab === 'prescreening' ? 'active' : ''}`} onClick={() => setActiveTab('prescreening')}>Pendaftaran Baru</button>
            </>
          )}

          {activeRole === 'perusahaan_jepang' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Dashboard Kerja</button>
              <button className={`sidebar-link ${activeTab === 'talent_pool' ? 'active' : ''}`} onClick={() => setActiveTab('talent_pool')}>Cari Bakat (Talent)</button>
              <button className={`sidebar-link ${activeTab === 'evaluasi' ? 'active' : ''}`} onClick={() => setActiveTab('evaluasi')}>Evaluasi Alumni</button>
            </>
          )}

          {activeRole === 'penyalur_agency' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Dashboard Penyalur</button>
              <button className={`sidebar-link ${activeTab === 'lowongan' ? 'active' : ''}`} onClick={() => setActiveTab('lowongan')}>Kelola Lowongan</button>
              <button className={`sidebar-link ${activeTab === 'referral' ? 'active' : ''}`} onClick={() => setActiveTab('referral')}>Ledger Sponsor</button>
            </>
          )}
        </nav>

        <div style={{ borderTop: '1px solid var(--surface-container-high)', paddingTop: '16px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
              {activeRole === 'lpk_admin' ? 'AD' : activeRole === 'perusahaan_jepang' ? 'JP' : 'AG'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>
                {activeRole === 'lpk_admin' ? 'Staff Admin LPK' : activeRole === 'perusahaan_jepang' ? 'Sakura Care Corp' : 'Penyalur Sakura'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--outline)' }}>Simulasi Sesi</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lpk-main-content">
        
        {/* LPK ADMIN VIEW */}
        {activeRole === 'lpk_admin' && (
          <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '24px' }}>🏫 Panel LPK Admin (B2B)</h1>
                <p style={{ color: 'var(--outline)', margin: '4px 0 0 0', fontSize: '13px' }}>Kelola ranjang asrama, monitoring cicilan dana talangan, filter pre-screening, dan alur terbang.</p>
              </div>
              <div>
                <select value={selectedLpk} onChange={(e) => setSelectedLpk(e.target.value)} className="input-field" style={{ width: '180px' }}>
                  <option value="lpk_a">LPK Sakura (A)</option>
                  <option value="lpk_b">LPK Kaigo Sejahtera (B)</option>
                </select>
              </div>
            </header>

            {/* SCREEN: OVERVIEW */}
            {activeTab === 'overview' && (
              <div>
                <div className="finance-grid">
                  <div className="finance-card">
                    <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: '700' }}>TOTAL KAS LPK</div>
                    <div className="finance-val">Rp {totalKas.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="finance-card">
                    <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: '700' }}>OUTSTANDING DANA TALANGAN</div>
                    <div className="finance-val">Rp {outstandingTalangan.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="finance-card">
                    <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: '700' }}>KAPASITAS ASRAMA</div>
                    <div className="finance-val">
                      {dormRooms.reduce((sum, r) => sum + r.beds.filter(b => b.status === 'occupied').length, 0)}
                      {' / '}
                      {dormRooms.reduce((sum, r) => sum + r.beds.length, 0)} Ranjang
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  <div className="card">
                    <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={18} color="var(--primary)" /> Log Audit Aktivitas LPK
                    </h2>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {logs.length === 0 ? (
                        <p style={{ color: 'var(--outline)', fontSize: '13px' }}>Belum ada log terekam.</p>
                      ) : (
                        <table className="ledger-table">
                          <thead>
                            <tr>
                              <th>Waktu</th>
                              <th>Aksi</th>
                              <th>Keterangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...logs].reverse().map((log) => (
                              <tr key={log.id}>
                                <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.timestamp).toLocaleTimeString('id-ID')}</td>
                                <td><span className="badge badge-blue">{log.action}</span></td>
                                <td>{log.details}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <h2 style={{ fontSize: '16px', marginBottom: '16px' }}><Video size={18} /> Panduan Modul</h2>
                    <div 
                      className="video-mockup" 
                      onClick={() => {
                        setVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
                        setShowVideoModal(true);
                      }}
                    >
                      <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" alt="Video Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, position: 'absolute' }} />
                      <div className="video-play-btn">
                        <PlayCircle size={32} />
                      </div>
                      <span style={{ position: 'absolute', bottom: '12px', left: '12px', color: 'white', fontWeight: '700', fontSize: '11px', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
                        Modul Panduan Dana Talangan
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: ASRAMA */}
            {activeTab === 'asrama' && (
              <div className="card">
                <h2 style={{ fontSize: '18px', marginBottom: '8px' }}>🛏️ Peta Alokasi Ranjang Asrama</h2>
                <p style={{ color: 'var(--outline)', fontSize: '13px', marginBottom: '24px' }}>
                  Atur ranjang secara visual. Klik ranjang kosong untuk check-in siswa. Ranjang dihuni dapat dibebaskan/check-out secara manual.
                </p>

                <div className="dorm-grid">
                  {dormRooms.map(room => (
                    <div key={room.roomId} className="room-card">
                      <div className="room-title">{room.name} ({room.type})</div>
                      <div className="bed-grid">
                        {room.beds.map((bed, idx) => (
                          <div 
                            key={idx} 
                            className={`bed-slot ${bed.status}`}
                            onClick={() => {
                              if (bed.status === 'available') {
                                setTargetBedSlot({ roomId: room.roomId, bedIndex: idx });
                                setShowBedModal(true);
                              } else {
                                handleReleaseBed(room.roomId, idx, bed.occupiedBy);
                              }
                            }}
                          >
                            <BedDouble size={20} />
                            <span style={{ fontSize: '10px', marginTop: '4px' }}>Ranjang {idx + 1}</span>
                            {bed.status === 'occupied' ? (
                              <span className="bed-name">{bed.occupiedBy}</span>
                            ) : (
                              <span style={{ fontSize: '9px', color: '#10b981', fontWeight: '700' }}>KOSONG</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN: KEUANGAN */}
            {activeTab === 'keuangan' && (
              <div className="card">
                <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>💵 Buku Ledger & Cicilan Dana Talangan</h2>
                
                {financialLedgers.map(l => {
                  const hasDispute = (l.loanInstallments || []).some(ins => ins.disputed);
                  return (
                    <div 
                      key={l.studentName} 
                      style={{ 
                        border: '1px solid var(--surface-container-high)', 
                        borderRadius: '12px', 
                        padding: '20px', 
                        marginBottom: '20px',
                        backgroundColor: hasDispute ? '#fffbeb' : 'var(--surface)',
                        borderLeft: hasDispute ? '6px solid #d97706' : '1px solid var(--surface-container-high)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '16px' }}>{l.studentName}</h3>
                          <span style={{ fontSize: '12px', color: 'var(--outline)' }}>
                            Program: {l.program === 'kaigo' ? 'Kaigo' : l.program === 'seizogyo' ? 'Pabrik' : 'Nogyo'}
                          </span>
                        </div>
                        {hasDispute && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: '700', fontSize: '12px' }}>
                            <AlertCircle size={16} />
                            <span>Terdapat Sanggahan Siswa (Dispute)!</span>
                          </div>
                        )}
                        <div>
                          <span style={{ fontSize: '13px', fontWeight: '700' }}>
                            Terbayar: Rp {(l.paidAmount || 0).toLocaleString('id-ID')} / Rp {l.totalCost.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      {/* Installments tracker */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                        {(l.loanInstallments || []).map((ins, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              padding: '8px 12px', 
                              borderRadius: '8px', 
                              border: '1px solid',
                              borderColor: ins.status === 'Paid' ? '#10b981' : ins.disputed ? '#d97706' : 'var(--outline-variant)',
                              backgroundColor: ins.status === 'Paid' ? '#ecfdf5' : ins.disputed ? '#fef3c7' : '#f8fafc',
                              fontSize: '11px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px'
                            }}
                          >
                            <span style={{ fontWeight: '700' }}>Bulan {idx + 1}</span>
                            <span>Rp {ins.amount.toLocaleString('id-ID')}</span>
                            <span style={{ 
                              fontWeight: '700', 
                              color: ins.status === 'Paid' ? '#047857' : ins.disputed ? '#b45309' : 'var(--outline)' 
                            }}>
                              {ins.status === 'Paid' ? 'Paid' : ins.disputed ? 'SANGGAHAN' : 'Pending'}
                            </span>
                            
                            {/* Action Buttons for Pending/Disputed Installments */}
                            {ins.status === 'Pending' && (
                              <button 
                                onClick={() => handleVerifyInstallment(l.studentName, idx)}
                                className="btn btn-secondary" 
                                style={{ height: '24px', padding: '0 8px', fontSize: '10px', marginTop: '4px', borderRadius: '4px' }}
                              >
                                Tandai Lunas
                              </button>
                            )}

                            {ins.disputed && (
                              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                <button 
                                  onClick={() => handleVerifyInstallment(l.studentName, idx)}
                                  className="btn btn-primary" 
                                  style={{ height: '24px', padding: '0 6px', fontSize: '9px', borderRadius: '4px' }}
                                  title="Gaji telah dipotong di Jepang. Klik untuk setuju."
                                >
                                  Terima Klaim
                                </button>
                                <button 
                                  onClick={() => handleRejectDispute(l.studentName, idx)}
                                  className="btn btn-outline" 
                                  style={{ height: '24px', padding: '0 6px', fontSize: '9px', borderColor: '#ef4444', color: '#ef4444', borderRadius: '4px' }}
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SCREEN: ALUR PROSES */}
            {activeTab === 'siswa_proses' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '18px', margin: 0 }}>📋 Checklist Alur Proses Kerja & Terbang</h2>
                  <div>
                    <label style={{ fontSize: '12px', marginRight: '8px', color: 'var(--outline)', fontWeight: '600' }}>Siswa Aktif:</label>
                    <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input-field" style={{ width: '160px', display: 'inline-block' }}>
                      {(STUDENTS_BY_LPK[selectedLpk] || []).map(std => (
                        <option key={std} value={std}>{std}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {checklist ? (
                  <div>
                    <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: '700' }}>Siswa: {checklist.studentName}</span>
                      <span className="badge badge-blue">Program: {checklist.program === 'kaigo' ? 'Kaigo' : 'Pabrik'}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                      {PROCESS_ITEMS.departure.map(item => {
                        const status = checklist.statuses[item.id] || 'pending';
                        return (
                          <div 
                            key={item.id} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between', 
                              padding: '12px 16px', 
                              borderBottom: '1px solid var(--surface-container-high)',
                              backgroundColor: status === 'completed' ? '#f0fdf4' : 'transparent'
                            }}
                          >
                            <span style={{ fontSize: '14px', color: status === 'completed' ? '#047857' : 'var(--on-surface)' }}>
                              {item.label}
                            </span>
                            <button 
                              onClick={() => handleToggleChecklist(item.id, status)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: status === 'completed' ? '#10b981' : 'var(--outline)' }}
                            >
                              {status === 'completed' ? <CheckSquare size={22} /> : <Square size={22} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--outline)', fontSize: '13px' }}>Memuat checklist siswa...</p>
                )}
              </div>
            )}

            {/* SCREEN: PRE-SCREENING */}
            {activeTab === 'prescreening' && (
              <div className="card">
                <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>📝 Pendaftaran Calon Siswa Baru (Pre-screening)</h2>
                
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Calon Pelamar</th>
                      <th>Program</th>
                      <th>Usia & Kualifikasi Fisik</th>
                      <th>Buta Warna</th>
                      <th>Kualifikasi</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.email}>
                        <td>
                          <div style={{ fontWeight: '700' }}>{reg.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--outline)' }}>{reg.email} | {reg.phone}</div>
                        </td>
                        <td><span className="badge badge-blue">{reg.program.toUpperCase()}</span></td>
                        <td>{reg.age} Thn | {reg.height} cm / {reg.weight} kg</td>
                        <td>
                          <span style={{ fontWeight: '700', color: reg.colorBlind === 'no' ? '#10b981' : '#ef4444' }}>
                            {reg.colorBlind === 'no' ? 'Tidak' : 'Ya'}
                          </span>
                        </td>
                        <td>{reg.education}</td>
                        <td>
                          <span className={`badge ${
                            reg.status === 'Applied' ? 'badge-orange' : reg.status === 'Joined' ? 'badge-green' : 'badge-pink'
                          }`}>
                            {reg.status}
                          </span>
                        </td>
                        <td>
                          {reg.status === 'Applied' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                onClick={() => handleApproveRegistration(reg.email, reg.name)}
                                className="btn btn-secondary" 
                                style={{ height: '30px', padding: '0 12px', fontSize: '11px', borderRadius: '15px' }}
                              >
                                Terima ke LPK
                              </button>
                              <button 
                                onClick={() => handleRejectRegistration(reg.email, reg.name)}
                                className="btn btn-outline" 
                                style={{ height: '30px', padding: '0 12px', fontSize: '11px', borderColor: '#ef4444', color: '#ef4444', borderRadius: '15px' }}
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                          {reg.status === 'Joined' && (
                            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>✓ Akun Dibuat</span>
                          )}
                          {reg.status === 'Rejected' && (
                            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '700' }}>✗ Tidak Memenuhi</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* MITRA JEPANG VIEW */}
        {activeRole === 'perusahaan_jepang' && (
          <div>
            <header style={{ marginBottom: '24px' }}>
              <h1 style={{ margin: 0, fontSize: '24px' }}>🏢 Portal Mitra Kerja (Panti Lansia Jepang)</h1>
              <p style={{ color: 'var(--outline)', margin: '4px 0 0 0', fontSize: '13px' }}>Pemberi kerja dapat menyaring siswa, memutar video Jikoshoukai, dan mengirim ulasan kinerja alumni.</p>
            </header>

            {/* SCREEN: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Pemberitahuan & Kuota Panti Anda</h2>
                <div className="finance-grid">
                  <div className="finance-card">
                    <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: '700' }}>ALUMNI AKTIF</div>
                    <div className="finance-val">2 Caregivers</div>
                  </div>
                  <div className="finance-card">
                    <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: '700' }}>KUOTA KONTRAK BARU</div>
                    <div className="finance-val">4 Slot Terbuka</div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: TALENT POOL */}
            {activeTab === 'talent_pool' && (
              <div className="card">
                <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>🔍 Talent Pool (Siswa Siap Salur)</h2>
                
                {/* Filters */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--outline)' }}>Program Bidang Kerja:</label>
                    <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="input-field" style={{ width: '160px', marginTop: '4px' }}>
                      <option value="kaigo">Caregiver (Kaigo)</option>
                      <option value="seizogyo">Pabrik (Seizogyo)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--outline)' }}>Sertifikat Bahasa:</label>
                    <select value={filterCert} onChange={(e) => setFilterCert(e.target.value)} className="input-field" style={{ width: '160px', marginTop: '4px' }}>
                      <option value="all">Semua</option>
                      <option value="n4">Lulus JLPT N4 / JFT</option>
                      <option value="ssw">Lulus Ujian SSW</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  {financialLedgers.map(l => (
                    <div key={l.studentName} style={{ border: '1px solid var(--surface-container-high)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '15px' }}>{l.studentName}</h3>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <span className="badge badge-blue">{l.program.toUpperCase()}</span>
                          <span className="badge badge-green">N4 & SSW Lulus</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => {
                            setVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
                            setShowVideoModal(true);
                          }}
                          className="btn btn-outline" 
                          style={{ height: '36px', padding: '0 16px', fontSize: '12px', borderRadius: '18px' }}
                        >
                          <PlayCircle size={16} /> Video Jikoshoukai
                        </button>
                        <button 
                          onClick={() => alert(`Undangan wawancara (Mensetsu) online dikirim untuk ${l.studentName}!`)}
                          className="btn btn-secondary" 
                          style={{ height: '36px', padding: '0 16px', fontSize: '12px', borderRadius: '18px' }}
                        >
                          Panggil Mensetsu
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN: EVALUASI */}
            {activeTab === 'evaluasi' && (
              <div className="card">
                <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>📝 Form Evaluasi Berkala Alumni</h2>
                <p style={{ color: 'var(--outline)', fontSize: '13px', marginBottom: '24px' }}>
                  Berikan nilai kinerja dan penguasaan bahasa Jepang alumni LPK yang sedang bekerja di panti Anda.
                </p>

                <form onSubmit={handleSubmitEvaluation}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--outline)' }}>Pilih Pekerja:</label>
                    <select 
                      value={selectedAlumni} 
                      onChange={(e) => setSelectedAlumni(e.target.value)} 
                      className="input-field" 
                      style={{ marginTop: '4px' }}
                    >
                      {financialLedgers.map(l => (
                        <option key={l.studentName} value={l.studentName}>{l.studentName}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--outline)' }}>Nilai Kinerja & Bahasa Jepang:</label>
                    <select 
                      value={alumniEval.rating} 
                      onChange={(e) => setAlumniEval({ ...alumniEval, rating: e.target.value })} 
                      className="input-field" 
                      style={{ marginTop: '4px' }}
                    >
                      <option value="A">A - Sangat Baik & Lancar</option>
                      <option value="B">B - Kinerja Bagus, Bahasa Perlu Peningkatan</option>
                      <option value="C">C - Cukup, Perlu Bimbingan Tambahan</option>
                      <option value="D">D - Kurang Memuaskan</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--outline)' }}>Komentar Detail Kinerja:</label>
                    <textarea 
                      value={alumniEval.comment}
                      onChange={(e) => setAlumniEval({ ...alumniEval, comment: e.target.value })}
                      placeholder="Masukkan ulasan harian atau kendala komunikasi siswa..."
                      className="input-field"
                      style={{ height: '100px', borderRadius: '12px', padding: '12px', marginTop: '4px', resize: 'none' }}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-secondary">Kirim Ulasan Evaluasi</button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* PENYALUR VIEW */}
        {activeRole === 'penyalur_agency' && (
          <div>
            <header style={{ marginBottom: '24px' }}>
              <h1 style={{ margin: 0, fontSize: '24px' }}>🤝 Portal Penyalur (Sending Agency Indonesia)</h1>
              <p style={{ color: 'var(--outline)', margin: '4px 0 0 0', fontSize: '13px' }}>Buka lowongan kerja caregiver baru dan kelola piutang komisi rekrutmen.</p>
            </header>

            {/* SCREEN: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '12px' }}>Ledger Rekrutmen Anda</h2>
                <div className="finance-grid">
                  <div className="finance-card">
                    <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: '700' }}>LOWONGAN AKTIF</div>
                    <div className="finance-val">{jobListings.length} Pekerjaan</div>
                  </div>
                  <div className="finance-card">
                    <div style={{ fontSize: '12px', color: 'var(--outline)', fontWeight: '700' }}>KOMISI DISETUJUI LPK</div>
                    <div className="finance-val">Rp 25.000.000</div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: LOWONGAN */}
            {activeTab === 'lowongan' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card">
                  <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>➕ Terbitkan Lowongan Kerja Baru</h2>
                  
                  <form onSubmit={handleCreateJob}>
                    <div style={{ marginBottom: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Posisi Pekerjaan (cth: Caregiver Lansia)" 
                        value={newJob.title}
                        onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Nama Perusahaan / Panti" 
                        value={newJob.company}
                        onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                        className="input-field"
                        required
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Lokasi di Jepang (cth: Tokyo, Chiba)" 
                        value={newJob.location}
                        onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Estimasi Gaji Bulanan (cth: ¥180,000)" 
                        value={newJob.salary}
                        onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <textarea 
                        placeholder="Persyaratan Kualifikasi (Bahasa, Usia, Buta Warna...)" 
                        value={newJob.requirements}
                        onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                        className="input-field"
                        style={{ height: '80px', borderRadius: '12px', padding: '12px', resize: 'none' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary">Terbitkan Lowongan</button>
                  </form>
                </div>

                <div className="card">
                  <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>💼 Lowongan Aktif di Jepang</h2>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {jobListings.map(job => (
                      <div key={job.jobId} style={{ border: '1px solid var(--surface-container-high)', borderRadius: '12px', padding: '16px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 style={{ margin: 0, fontSize: '15px', color: 'var(--primary)' }}>{job.title}</h3>
                          <span className="badge badge-green">{job.salary}</span>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '700', marginTop: '4px' }}>{job.company} - {job.location}</div>
                        <div style={{ fontSize: '12px', color: 'var(--outline)', marginTop: '8px' }}>{job.requirements}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: REFERRAL */}
            {activeTab === 'referral' && (
              <div className="card">
                <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>💰 Klaim Komisi Sponsor / Referral Fee</h2>
                
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Rekomendator</th>
                      <th>Nama Siswa</th>
                      <th>Besar Komisi</th>
                      <th>Status Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referralClaims.map((claim) => (
                      <tr key={claim.claimId}>
                        <td>{claim.referrerName}</td>
                        <td>{claim.studentName}</td>
                        <td>Rp {claim.amount.toLocaleString('id-ID')}</td>
                        <td>
                          <span className={`badge ${claim.status === 'Paid' ? 'badge-green' : 'badge-orange'}`}>
                            {claim.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: VIDEO EXPLAINER PLAYER */}
      {showVideoModal && (
        <div className="modal-backdrop" onClick={() => setShowVideoModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>▶ Pemutar Video Jikoshoukai / Panduan</h2>
              <button onClick={() => setShowVideoModal(false)} className="btn btn-outline" style={{ height: '32px', padding: '0 12px', borderRadius: '16px' }}>Tutup</button>
            </div>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px', backgroundColor: '#000' }}>
              <iframe 
                src={videoUrl} 
                title="Explainer Player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DORM BED ALLOCATION */}
      {showBedModal && (
        <div className="modal-backdrop" onClick={() => setShowBedModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Check-in Kamar Asrama</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--outline)' }}>Nama Siswa:</label>
              <input 
                type="text" 
                placeholder="Masukkan nama lengkap siswa..." 
                value={tempStudentName}
                onChange={(e) => setTempStudentName(e.target.value)}
                className="input-field"
                style={{ marginTop: '6px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowBedModal(false)} className="btn btn-outline">Batal</button>
              <button onClick={handleAssignBed} className="btn btn-secondary">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
