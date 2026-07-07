import React, { useState, useEffect } from 'react';
import { 
  getLogs, 
  getStudentChecklist, 
  updateStudentChecklist, 
  getAllStudentChecklists,
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
  LogOut, PlusCircle, Check, Search, Sparkles, Building, Video, Download, Upload, FileText
} from 'lucide-react';

const PROCESS_ITEMS = {
  daftar: [
    { id: 'daftar_website', label: '1.1 Website LPK' },
    { id: 'daftar_wa', label: '1.2 Chat Hubungan WhatsApp' },
    { id: 'daftar_google_form', label: '1.3 Isi Form Google/Formulir' },
    { id: 'daftar_ref', label: '1.4 Referensi Sponsor' },
    { id: 'daftar_trial', label: '1.5 Kelas Uji Coba (Trial Class)' },
    { id: 'daftar_booking', label: '1.6 Booking Seat Pembayaran' }
  ],
  seleksi: [
    { id: 'seleksi_doc', label: '2.1 Pemeriksaan Dokumen' },
    { id: 'seleksi_cek_fisik', label: '2.2 Cek Tinggi, Berat & Tato' },
    { id: 'seleksi_interview', label: '2.3 Wawancara Awal' },
    { id: 'seleksi_job_desc', label: '2.4 Penjelasan Kriteria Pekerjaan' },
    { id: 'seleksi_room_check', label: '2.5 Cek Kapasitas Kamar/Asrama' },
    { id: 'seleksi_biaya', label: '2.6 Skema Pembiayaan & Dana Talangan' }
  ],
  pelatihan: [
    { id: 'pelatihan_budaya', label: '3.1 Budaya Jepang & Asing' },
    { id: 'pelatihan_bahasa', label: '3.2 Pengenalan Huruf & Istilah' },
    { id: 'pelatihan_kurikulum', label: '3.3 Kurikulum Pendidikan' },
    { id: 'pelatihan_asrama', label: '3.4 Tata Tertib Masuk Asrama' },
    { id: 'pelatihan_skill', label: '3.5 Pelatihan Teknis Caregiver (Kaigo)' },
    { id: 'pelatihan_penilaian', label: '3.6 Penilaian Bulanan Siswa' }
  ],
  matching: [
    { id: 'matching_job_offer', label: '4.1 Tinjauan Informasi Job Offer' },
    { id: 'matching_video', label: '4.2 Unggah Video Keterampilan / Perkenalan' },
    { id: 'matching_wawancara', label: '4.3 Wawancara dengan Pengguna Asing' },
    { id: 'matching_match', label: '4.4 Hasil Match / Diterima User' }
  ],
  persiapan: [
    { id: 'persiapan_dokumen', label: '5.1 Dokumen COE & Kontrak Kerja' },
    { id: 'persiapan_mental', label: '5.2 Kesiapan Mental & Wawancara' },
    { id: 'persiapan_kesehatan', label: '5.3 MCU Tahap Akhir' },
    { id: 'persiapan_checkout', label: '5.4 Check Out Asrama LPK' },
    { id: 'persiapan_pelunasan', label: '5.5 Pembayaran / Cicilan Awal' }
  ],
  penempatan: [
    { id: 'penempatan_kontrak', label: '6.1 Tanda Tangan Kontrak Kerja' },
    { id: 'penempatan_tiket', label: '6.2 Tiket Pesawat & Rencana Keberangkatan' },
    { id: 'penempatan_penjemputan', label: '6.3 Penjemputan Bandara di Jepang/Korea' }
  ],
  alumni: [
    { id: 'alumni_komunitas', label: '7.1 Pembuatan Komunitas Alumni' },
    { id: 'alumni_referensi', label: '7.2 Referensi Rekomendasi Siswa Baru' }
  ],
  evaluasi: [
    { id: 'evaluasi_budaya', label: '8.1 Evaluasi Adaptasi Budaya Kerja' },
    { id: 'evaluasi_cicilan', label: '8.2 Pelunasan Dana Talangan Potong Gaji' },
    { id: 'evaluasi_berkala', label: '8.3 Evaluasi Kinerja Kerja Berkala (1, 3, 6 Bulan)' }
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
  const [allChecklists, setAllChecklists] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('Budi Utomo');

  // Helper to get student's current active workflow phase
  const getStudentCurrentPhase = (studentChecklist) => {
    if (!studentChecklist || !studentChecklist.statuses) return 'daftar';
    const phases = ['daftar', 'seleksi', 'pelatihan', 'matching', 'persiapan', 'penempatan', 'alumni', 'evaluasi'];
    let currentPhase = 'daftar';
    for (let i = 0; i < phases.length; i++) {
      const phaseKey = phases[i];
      const items = PROCESS_ITEMS[phaseKey] || [];
      const completedCount = items.filter(item => studentChecklist.statuses[item.id] === 'completed').length;
      if (completedCount > 0) {
        currentPhase = phaseKey;
      }
    }
    return currentPhase;
  };
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
    requirements: '',
    program: 'kaigo'
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

      const allChecklistsData = await getAllStudentChecklists();
      setAllChecklists(allChecklistsData || []);

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

  // 5. Penyalur / Sending Agency: Add job listings manually
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
      program: newJob.program || 'kaigo',
      postedDate: new Date().toLocaleDateString('id-ID')
    };

    await addJobListing(job);
    setNewJob({ title: '', company: '', location: '', salary: '', requirements: '', program: 'kaigo' });
    alert('Lowongan pekerjaan baru dipublikasikan untuk alumni & pekerja!');
    await refreshData();
  };

  // CSV Template Downloader
  const downloadCSVTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "title,company,location,salary,requirements,program\n"
      + "\"Caregiver Lansia Senior\",\"Sakura Care Home\",\"Tokyo\",\"¥190,000\",\"JLPT N4 & SSW Caregiver\",\"kaigo\"\n"
      + "\"Operator Perakitan Otomotif\",\"Toyota Kanto Plant\",\"Kanagawa\",\"¥210,000\",\"JLPT N4 & SSW Seizogyo\",\"seizogyo\"";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_lowongan_jepang.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Importer
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n');
        let importedCount = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple CSV line parser split by comma, ignoring commas inside quotes
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
          if (matches.length < 2) continue;

          const title = matches[0]?.replace(/"/g, '') || '';
          const company = matches[1]?.replace(/"/g, '') || '';
          const location = matches[2]?.replace(/"/g, '') || '';
          const salary = matches[3]?.replace(/"/g, '') || '';
          const requirements = matches[4]?.replace(/"/g, '') || '';
          const program = matches[5]?.replace(/"/g, '') || 'kaigo';

          const job = {
            jobId: 'job-csv-' + Date.now() + '-' + i,
            title,
            company,
            location,
            salary,
            requirements,
            program,
            postedDate: new Date().toLocaleDateString('id-ID')
          };

          await addJobListing(job);
          importedCount++;
        }

        alert(`Berhasil mengimpor ${importedCount} lowongan kerja dari berkas CSV!`);
        await refreshData();
      } catch (err) {
        alert('Gagal mengimpor berkas CSV. Pastikan format kolom sesuai dengan template.');
        console.error(err);
      }
    };
    reader.readAsText(file);
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

  // LPK Admin: Toggle checklist status
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
          <Building size={24} color="var(--primary-accent)" />
          <h2 className="lpk-logo-title">Hikari LPK Center</h2>
        </div>

        {/* Global Role Switcher */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Simulasi Peran</label>
          <select 
            value={activeRole} 
            onChange={(e) => setActiveRole(e.target.value)}
            className="input-field"
            style={{ marginTop: '4px', border: '1px solid var(--primary-accent)', fontWeight: '700', color: 'var(--primary-accent)', backgroundColor: 'var(--primary-light)' }}
          >
            <option value="lpk_admin">🏫 LPK Admin & Owner</option>
            <option value="perusahaan_jepang">🏢 Mitra User (Jepang)</option>
            <option value="penyalur_agency">🤝 Penyalur / Agency</option>
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

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>
              {activeRole === 'lpk_admin' ? 'AD' : activeRole === 'perusahaan_jepang' ? 'JP' : 'AG'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>
                {activeRole === 'lpk_admin' ? 'Staff Admin LPK' : activeRole === 'perusahaan_jepang' ? 'Sakura Care Corp' : 'Penyalur Sakura'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Simulasi Sesi</div>
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
                <h1 style={{ margin: 0, fontSize: '22px' }}>🏫 Panel LPK Admin Overview</h1>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '12px' }}>Kelola kapasitas fisik asrama, kas cicilan dana talangan, dan kualifikasi calon siswa.</p>
              </div>
              <div>
                <select value={selectedLpk} onChange={(e) => setSelectedLpk(e.target.value)} className="input-field" style={{ width: '180px' }}>
                  <option value="lpk_a">LPK Sakura (A)</option>
                  <option value="lpk_b">LPK Kaigo Sejahtera (B)</option>
                </select>
              </div>
            </header>

            {/* SCREEN: OVERVIEW (Interactive Dashboard with SVG Graphs) */}
            {activeTab === 'overview' && (
              <div>
                {/* Clickable Kpi Summary Cards */}
                <div className="finance-grid">
                  <div className="finance-card" onClick={() => setActiveTab('keuangan')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>TOTAL KAS LPK ➔</div>
                    <div className="finance-val">Rp {totalKas.toLocaleString('id-ID')}</div>
                    <div style={{ fontSize: '11px', color: 'var(--secondary)', marginTop: '4px', fontWeight: '600' }}>Klik untuk detail transaksi</div>
                  </div>
                  
                  <div className="finance-card" onClick={() => setActiveTab('keuangan')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>OUTSTANDING DANA TALANGAN ➔</div>
                    <div className="finance-val" style={{ color: 'var(--danger)' }}>Rp {outstandingTalangan.toLocaleString('id-ID')}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Verifikasi slip potong gaji</div>
                  </div>

                  <div className="finance-card" onClick={() => setActiveTab('asrama')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>KAPASITAS ASRAMA ➔</div>
                    <div className="finance-val">
                      {dormRooms.reduce((sum, r) => sum + r.beds.filter(b => b.status === 'occupied').length, 0)}
                      {' / '}
                      {dormRooms.reduce((sum, r) => sum + r.beds.length, 0)} Ranjang
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-accent)', marginTop: '4px', fontWeight: '600' }}>Klik untuk peta kamar tidur</div>
                  </div>
                </div>

                {/* VISUAL CHARTS & GRAPHS SECTION */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  {/* Graph 1: Student Pipeline Stage distribution */}
                  <div className="card" onClick={() => setActiveTab('siswa_proses')} style={{ cursor: 'pointer' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📊 Distribusi Tahap Alur Kerja Siswa (Klik untuk Detail)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {['daftar', 'seleksi', 'pelatihan', 'matching', 'persiapan', 'penempatan', 'alumni', 'evaluasi'].map(categoryKey => {
                        const label = {
                          daftar: '1. Pendaftaran (Daftar)',
                          seleksi: '2. Tahap Seleksi',
                          pelatihan: '3. Pelatihan & Asrama',
                          matching: '4. Job Matching',
                          persiapan: '5. Persiapan Terbang',
                          penempatan: '6. Penempatan & Kerja',
                          alumni: '7. Komunitas Alumni',
                          evaluasi: '8. Evaluasi & Cicilan'
                        }[categoryKey];
                        
                        const count = allChecklists.filter(c => getStudentCurrentPhase(c) === categoryKey).length;
                        const total = allChecklists.length || 1;
                        const percentage = Math.round((count / total) * 100);
                        
                        return (
                          <div key={categoryKey}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                              <span>{label}</span>
                              <span style={{ color: count > 0 ? 'var(--primary-accent)' : 'var(--text-muted)' }}>
                                {count} Siswa ({percentage}%)
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--primary-light)', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: categoryKey === 'matching' ? 'var(--warning)' : categoryKey === 'penempatan' ? 'var(--secondary)' : 'var(--primary-accent)', transition: 'width 0.3s ease' }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Graph 2: Financial collection target */}
                  <div className="card" onClick={() => setActiveTab('keuangan')} style={{ cursor: 'pointer' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>📉 Cash Flow: Cicilan Dana Talangan Terkumpul</h3>
                    
                    {/* SVG Minimalist Column Chart */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '110px', gap: '20px', borderBottom: '1.5px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{ height: '70px', width: '24px', backgroundColor: 'var(--secondary)', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Target</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{ height: '23px', width: '24px', backgroundColor: 'var(--primary-accent)', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Diterima</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{ height: '47px', width: '24px', backgroundColor: 'var(--danger)', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Tertunda</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                      <span>Target: Rp 15.000.000</span>
                      <span>Tertunda (Dispute): Rp 10.000.000</span>
                    </div>
                  </div>

                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                  <div className="card">
                    <h2 style={{ fontSize: '14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} color="var(--primary-accent)" /> Log Audit Aktivitas LPK Terbaru
                    </h2>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {logs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Belum ada aktivitas audit.</p>
                      ) : (
                        <table className="ledger-table">
                          <thead>
                            <tr>
                              <th>Waktu</th>
                              <th>Aksi</th>
                              <th>Rincian Audit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...logs].reverse().slice(0, 5).map((log) => (
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
                    <h2 style={{ fontSize: '14px', marginBottom: '12px' }}><Video size={16} /> Panduan Video Operasional</h2>
                    <div 
                      className="video-mockup" 
                      onClick={() => {
                        setVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
                        setShowVideoModal(true);
                      }}
                    >
                      <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" alt="Video Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4, position: 'absolute' }} />
                      <div className="video-play-btn">
                        <PlayCircle size={24} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: ASRAMA */}
            {activeTab === 'asrama' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '8px' }}>🛏️ Peta Alokasi Ranjang Asrama</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>
                  Klik ranjang kosong untuk check-in siswa. Ranjang dihuni dapat dibebaskan secara manual.
                </p>

                <div className="dorm-grid">
                  {dormRooms.map(room => (
                    <div key={room.roomId} className="room-card">
                      <div className="room-title">
                        <span>{room.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{room.type}</span>
                      </div>
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
                            <BedDouble size={16} />
                            <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: '500' }}>Ranjang {idx + 1}</span>
                            {bed.status === 'occupied' ? (
                              <span className="bed-name">{bed.occupiedBy}</span>
                            ) : (
                              <span style={{ fontSize: '9px', color: 'var(--secondary)', fontWeight: '700', marginTop: '4px' }}>KOSONG</span>
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
                <h2 style={{ fontSize: '16px', marginBottom: '20px' }}>💵 Buku Ledger & Cicilan Dana Talangan</h2>
                
                {financialLedgers.map(l => {
                  const hasDispute = (l.loanInstallments || []).some(ins => ins.disputed);
                  return (
                    <div 
                      key={l.studentName} 
                      style={{ 
                        border: '1px solid var(--border)', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        marginBottom: '16px',
                        backgroundColor: hasDispute ? '#fffbeb' : 'var(--surface)',
                        borderLeft: hasDispute ? '4px solid var(--warning)' : '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '14px' }}>{l.studentName}</h3>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Program: {l.program === 'kaigo' ? 'Kaigo' : l.program === 'seizogyo' ? 'Pabrik' : 'Nogyo'}
                          </span>
                        </div>
                        {hasDispute && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontWeight: '700', fontSize: '11px' }}>
                            <AlertCircle size={14} />
                            <span>Terdapat Sanggahan Siswa!</span>
                          </div>
                        )}
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: '700' }}>
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
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              border: '1px solid',
                              borderColor: ins.status === 'Paid' ? '#bbf7d0' : ins.disputed ? '#fde68a' : 'var(--border)',
                              backgroundColor: ins.status === 'Paid' ? '#f0fdf4' : ins.disputed ? '#fffbeb' : '#f8fafc',
                              fontSize: '11px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px'
                            }}
                          >
                            <span style={{ fontWeight: '700' }}>Bulan {idx + 1}</span>
                            <span>Rp {ins.amount.toLocaleString('id-ID')}</span>
                            <span style={{ 
                              fontWeight: '700', 
                              color: ins.status === 'Paid' ? 'var(--secondary)' : ins.disputed ? 'var(--warning)' : 'var(--text-muted)' 
                            }}>
                              {ins.status === 'Paid' ? 'Paid' : ins.disputed ? 'SANGGAHAN' : 'Pending'}
                            </span>
                            
                            {/* Action Buttons for Pending/Disputed Installments */}
                            {ins.status === 'Pending' && (
                              <button 
                                onClick={() => handleVerifyInstallment(l.studentName, idx)}
                                className="btn btn-secondary" 
                                style={{ height: '22px', padding: '0 6px', fontSize: '9px', marginTop: '4px', borderRadius: '4px' }}
                              >
                                Tandai Lunas
                              </button>
                            )}

                            {ins.disputed && (
                              <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                                <button 
                                  onClick={() => handleVerifyInstallment(l.studentName, idx)}
                                  className="btn btn-primary" 
                                  style={{ height: '22px', padding: '0 4px', fontSize: '9px', borderRadius: '4px' }}
                                  title="Gaji telah dipotong di Jepang."
                                >
                                  Setuju
                                </button>
                                <button 
                                  onClick={() => handleRejectDispute(l.studentName, idx)}
                                  className="btn btn-outline" 
                                  style={{ height: '22px', padding: '0 4px', fontSize: '9px', borderColor: 'var(--danger)', color: 'var(--danger)', borderRadius: '4px' }}
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
                  <h2 style={{ fontSize: '16px', margin: 0 }}>📋 Checklist Alur Proses Kerja & Terbang</h2>
                  <div>
                    <label style={{ fontSize: '11px', marginRight: '6px', color: 'var(--text-muted)', fontWeight: '600' }}>Siswa Aktif:</label>
                    <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="input-field" style={{ width: '160px', display: 'inline-block' }}>
                      {(STUDENTS_BY_LPK[selectedLpk] || []).map(std => (
                        <option key={std} value={std}>{std}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {checklist ? (
                  <div>
                    <div style={{ backgroundColor: 'var(--background)', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '13px', fontWeight: '700' }}>Siswa: {checklist.studentName}</span>
                      <span className="badge badge-blue">Program: {checklist.program === 'kaigo' ? 'Kaigo' : 'Pabrik'}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {Object.keys(PROCESS_ITEMS).map(categoryKey => {
                        const categoryLabel = {
                          daftar: '📋 1. Alur Pendaftaran (Daftar)',
                          seleksi: '🔍 2. Tahap Seleksi & Administrasi',
                          pelatihan: '🏫 3. Masa Pelatihan & Asrama',
                          matching: '🤝 4. Job Matching & Wawancara',
                          persiapan: '✈️ 5. Persiapan Terbang (COE & Dokumen)',
                          penempatan: '💼 6. Penempatan & Kerja',
                          alumni: '👥 7. Komunitas Alumni',
                          evaluasi: '📈 8. Evaluasi & Dana Talangan'
                        }[categoryKey];
                        
                        return (
                          <div key={categoryKey} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary-accent)', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span>{categoryLabel}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {Object.values(PROCESS_ITEMS[categoryKey]).filter(x => (checklist.statuses[x.id] || 'pending') === 'completed').length} / {PROCESS_ITEMS[categoryKey].length} Selesai
                              </span>
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                              {PROCESS_ITEMS[categoryKey].map(item => {
                                const status = checklist.statuses[item.id] || 'pending';
                                return (
                                  <div 
                                    key={item.id} 
                                    style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'space-between', 
                                      padding: '8px 10px', 
                                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                                      backgroundColor: status === 'completed' ? '#f0fdf4' : 'transparent',
                                      borderRadius: '6px',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <span style={{ fontSize: '12.5px', color: status === 'completed' ? 'var(--secondary)' : 'var(--text-main)', fontWeight: status === 'completed' ? '600' : '400' }}>
                                      {item.label}
                                    </span>
                                    <button 
                                      onClick={() => handleToggleChecklist(item.id, status)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: status === 'completed' ? 'var(--secondary)' : 'var(--text-light)', transition: 'transform 0.1s ease' }}
                                    >
                                      {status === 'completed' ? <CheckSquare size={19} /> : <Square size={19} />}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Memuat checklist siswa...</p>
                )}
              </div>
            )}

            {/* SCREEN: PRE-SCREENING */}
            {activeTab === 'prescreening' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>📝 Calon Siswa Baru (Hasil Filter Otomatis)</h2>
                
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Calon Pelamar</th>
                      <th>Program</th>
                      <th>Usia & Fisik</th>
                      <th>Buta Warna</th>
                      <th>Sekolah</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg) => (
                      <tr key={reg.email}>
                        <td>
                          <div style={{ fontWeight: '700' }}>{reg.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{reg.email}</div>
                        </td>
                        <td><span className="badge badge-blue">{reg.program.toUpperCase()}</span></td>
                        <td>{reg.age} Thn | {reg.height} cm / {reg.weight} kg</td>
                        <td>
                          <span style={{ fontWeight: '700', color: reg.colorBlind === 'no' ? 'var(--secondary)' : 'var(--danger)' }}>
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
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => handleApproveRegistration(reg.email, reg.name)}
                                className="btn btn-secondary" 
                                style={{ height: '28px', padding: '0 10px', fontSize: '11px' }}
                              >
                                Terima ke LPK
                              </button>
                              <button 
                                onClick={() => handleRejectRegistration(reg.email, reg.name)}
                                className="btn btn-outline" 
                                style={{ height: '28px', padding: '0 10px', fontSize: '11px', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                              >
                                Tolak
                              </button>
                            </div>
                          )}
                          {reg.status === 'Joined' && <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '700' }}>✓ Diterima</span>}
                          {reg.status === 'Rejected' && <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: '700' }}>✗ Gugur Fisik</span>}
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
              <h1 style={{ margin: 0, fontSize: '22px' }}>🏢 Portal Mitra Kerja (Panti Lansia Jepang)</h1>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '12px' }}>Pemberi kerja dapat menyaring siswa, memutar video Jikoshoukai, dan mengimpor template lowongan.</p>
            </header>

            {/* SCREEN: OVERVIEW (Mitra Jepang Dashboard with Clickable SVG Graphics) */}
            {activeTab === 'overview' && (
              <div>
                <div className="finance-grid">
                  <div className="finance-card" onClick={() => setActiveTab('talent_pool')} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>KANDIDAT TERSEDIA ➔</div>
                    <div className="finance-val">4 Siswa Siap</div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-accent)', marginTop: '4px', fontWeight: '600' }}>Klik untuk cari bakat</div>
                  </div>

                  <div className="finance-card" onClick={() => setActiveTab('evaluasi')} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>ALUMNI DI PANTI ANDA ➔</div>
                    <div className="finance-val">2 Caregivers</div>
                    <div style={{ fontSize: '11px', color: 'var(--secondary)', marginTop: '4px', fontWeight: '600' }}>Klik untuk ulasan bulanan</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                  
                  {/* Alumnus Performance Distribution Graph */}
                  <div className="card" onClick={() => setActiveTab('evaluasi')} style={{ cursor: 'pointer' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>📊 Distribusi Penilaian Kinerja Alumni di Panti Anda (Klik untuk Nilai)</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '100px', gap: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{ height: '70px', width: '32px', backgroundColor: 'var(--secondary)', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>A (Sangat Baik)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{ height: '30px', width: '32px', backgroundColor: 'var(--primary-accent)', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>B (Cukup)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{ height: '0px', width: '32px', backgroundColor: 'var(--danger)', borderRadius: '4px' }}></div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>C/D (Kurang)</span>
                      </div>
                    </div>
                  </div>

                  {/* CSV Template & Upload Card */}
                  <div className="card">
                    <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} color="var(--primary-accent)" /> Muat Pekerjaan Baru via Template CSV
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Unduh berkas template CSV, masukkan daftar lowongan kerja dari Jepang, lalu unggah kembali untuk menyebarkannya ke LPK.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={downloadCSVTemplate} className="btn btn-outline" style={{ flex: 1 }}>
                        <Download size={14} /> Unduh Template
                      </button>
                      <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer' }}>
                        <Upload size={14} /> Unggah CSV
                        <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SCREEN: TALENT POOL */}
            {activeTab === 'talent_pool' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>🔍 Talent Pool (Siswa Siap Salur)</h2>
                
                {/* Filters */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Program Bidang Kerja:</label>
                    <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)} className="input-field" style={{ width: '160px', marginTop: '4px' }}>
                      <option value="kaigo">Caregiver (Kaigo)</option>
                      <option value="seizogyo">Pabrik (Seizogyo)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Sertifikat Bahasa:</label>
                    <select value={filterCert} onChange={(e) => setFilterCert(e.target.value)} className="input-field" style={{ width: '160px', marginTop: '4px' }}>
                      <option value="all">Semua</option>
                      <option value="n4">Lulus JLPT N4 / JFT</option>
                      <option value="ssw">Lulus Ujian SSW</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  {financialLedgers.map(l => (
                    <div key={l.studentName} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '14px' }}>{l.studentName}</h3>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
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
                          style={{ height: '34px', padding: '0 12px', fontSize: '12px' }}
                        >
                          <PlayCircle size={14} /> Video Jikoshoukai
                        </button>
                        <button 
                          onClick={() => alert(`Undangan wawancara (Mensetsu) online dikirim untuk ${l.studentName}!`)}
                          className="btn btn-secondary" 
                          style={{ height: '34px', padding: '0 12px', fontSize: '12px' }}
                        >
                          Panggil Wawancara
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
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>📝 Form Evaluasi Berkala Alumni</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '24px' }}>
                  Berikan nilai kinerja dan penguasaan bahasa Jepang alumni LPK yang sedang bekerja di panti Anda.
                </p>

                <form onSubmit={handleSubmitEvaluation}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Pilih Pekerja:</label>
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
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Nilai Kinerja & Bahasa Jepang:</label>
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
                    <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Komentar Detail Kinerja:</label>
                    <textarea 
                      value={alumniEval.comment}
                      onChange={(e) => setAlumniEval({ ...alumniEval, comment: e.target.value })}
                      placeholder="Masukkan ulasan harian atau kendala komunikasi siswa..."
                      className="input-field"
                      style={{ height: '80px', borderRadius: '8px', padding: '12px', marginTop: '4px', resize: 'none' }}
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
              <h1 style={{ margin: 0, fontSize: '22px' }}>🤝 Portal Penyalur (Sending Agency Indonesia)</h1>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '12px' }}>Kelola komisi sponsor pendaftaran dan import daftar lowongan kerja Jepang via CSV.</p>
            </header>

            {/* SCREEN: OVERVIEW (Penyalur Dashboard with SVG Graphs) */}
            {activeTab === 'overview' && (
              <div>
                <div className="finance-grid">
                  <div className="finance-card" onClick={() => setActiveTab('lowongan')} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>LOWONGAN AKTIF ➔</div>
                    <div className="finance-val">{jobListings.length} Pekerjaan</div>
                    <div style={{ fontSize: '11px', color: 'var(--primary-accent)', marginTop: '4px', fontWeight: '600' }}>Klik untuk tambah lowongan</div>
                  </div>

                  <div className="finance-card" onClick={() => setActiveTab('referral')} style={{ cursor: 'pointer' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>KOMISI DISETUJUI LPK ➔</div>
                    <div className="finance-val">Rp 25.000.000</div>
                    <div style={{ fontSize: '11px', color: 'var(--secondary)', marginTop: '4px', fontWeight: '600' }}>Klik untuk ledger sponsor</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  
                  {/* Graph 1: Desired Jobs by Category Chart */}
                  <div className="card" onClick={() => setActiveTab('lowongan')} style={{ cursor: 'pointer' }}>
                    <h3 style={{ fontSize: '14px', marginBottom: '16px' }}>📊 Distribusi Lowongan Kerja Aktif berdasarkan Sektor</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                          <span>Caregiver (Kaigo)</span>
                          <span>{jobListings.filter(j => j.program === 'kaigo').length} Lowongan</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '3px' }}>
                          <div style={{ width: `${(jobListings.filter(j => j.program === 'kaigo').length / Math.max(1, jobListings.length)) * 100}%`, height: '100%', backgroundColor: 'var(--secondary)', borderRadius: '3px' }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                          <span>Pabrik (Seizogyo)</span>
                          <span>{jobListings.filter(j => j.program === 'seizogyo').length} Lowongan</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '3px' }}>
                          <div style={{ width: `${(jobListings.filter(j => j.program === 'seizogyo').length / Math.max(1, jobListings.length)) * 100}%`, height: '100%', backgroundColor: 'var(--primary-accent)', borderRadius: '3px' }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px' }}>
                          <span>Pertanian & Perkebunan (Nogyo)</span>
                          <span>{jobListings.filter(j => j.program === 'nogyo').length} Lowongan</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--primary-light)', borderRadius: '3px' }}>
                          <div style={{ width: `${(jobListings.filter(j => j.program === 'nogyo').length / Math.max(1, jobListings.length)) * 100}%`, height: '100%', backgroundColor: 'var(--warning)', borderRadius: '3px' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CSV Template & Upload Card */}
                  <div className="card">
                    <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} color="var(--primary-accent)" /> Muat Pekerjaan Baru via Template CSV
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                      Unduh berkas template CSV, masukkan daftar lowongan kerja dari Jepang, lalu unggah kembali untuk menyebarkannya ke LPK.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={downloadCSVTemplate} className="btn btn-outline" style={{ flex: 1 }}>
                        <Download size={14} /> Unduh Template
                      </button>
                      <label className="btn btn-secondary" style={{ flex: 1, cursor: 'pointer' }}>
                        <Upload size={14} /> Unggah CSV
                        <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SCREEN: LOWONGAN */}
            {activeTab === 'lowongan' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
                <div className="card">
                  <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>➕ Terbitkan Lowongan Kerja Baru Manual</h2>
                  
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
                    <div style={{ marginBottom: '12px' }}>
                      <select 
                        value={newJob.program} 
                        onChange={(e) => setNewJob({ ...newJob, program: e.target.value })} 
                        className="input-field"
                      >
                        <option value="kaigo">Caregiver (Kaigo)</option>
                        <option value="seizogyo">Pabrik (Seizogyo)</option>
                        <option value="kensetsugyo">Konstruksi (Kensetsugyo)</option>
                        <option value="nogyo">Pertanian (Nogyo)</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      <textarea 
                        placeholder="Persyaratan Kualifikasi..." 
                        value={newJob.requirements}
                        onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                        className="input-field"
                        style={{ height: '70px', borderRadius: '8px', padding: '10px', resize: 'none' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary">Terbitkan Lowongan</button>
                  </form>
                </div>

                <div className="card">
                  <h2 style={{ fontSize: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>💼 Lowongan Kerja Terdaftar</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total: {jobListings.length} Sektor</span>
                  </h2>
                  <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    {jobListings.map(job => (
                      <div key={job.jobId} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h3 style={{ margin: 0, fontSize: '13px', color: 'var(--primary-accent)' }}>{job.title}</h3>
                          <span className="badge badge-green">{job.salary || '¥170,000'}</span>
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '700', marginTop: '2px' }}>{job.company} - {job.location}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>{job.requirements}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '4px', textAlign: 'right' }}>Bidang: {job.program?.toUpperCase()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SCREEN: REFERRAL */}
            {activeTab === 'referral' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>💰 Klaim Komisi Sponsor / Referral Fee</h2>
                
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
              <h2 style={{ fontSize: '16px', margin: 0 }}>▶ Pemutar Video Jikoshoukai / Panduan</h2>
              <button onClick={() => setShowVideoModal(false)} className="btn btn-outline" style={{ height: '30px', padding: '0 12px' }}>Tutup</button>
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
            <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>Check-in Kamar Asrama</h2>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>Nama Siswa:</label>
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
