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
  LogOut, PlusCircle, Check, Search, Sparkles, Building, Video, Download, Upload, FileText, Bell
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
  lpk_a: ['Budi Utomo', 'Siti Rahma', 'Rudi Hermawan', 'Larasati'],
  lpk_b: ['Agus Wijaya', 'Dewi Lestari', 'Fahri Hamzah', 'Eka Putri']
};

export default function LPKDashboard() {
  const [activeRole, setActiveRole] = useState('owner'); // owner, rekrutmen, pelatihan, asrama, dokumentasi, IT, agen, mitra
  const [selectedLpk, setSelectedLpk] = useState('lpk_a');
  
  // Navigation Screens per Role
  const [activeTab, setActiveTab] = useState('overview'); 
  const [selectedReportType, setSelectedReportType] = useState('akademik');
  const [showNotifications, setShowNotifications] = useState(false);
  const sampleNotifications = [
    { id: 1, title: '📢 Pendaftaran Baru', text: 'Rudi Hermawan mengisi google form (Buta Warna: Tidak, BMI: Ideal).', time: '10 menit lalu', tag: 'rekrutmen' },
    { id: 2, title: '🏫 Kelulusan Ujian', text: 'Siti Rahma menyelesaikan Ujian Gerbang Mingguan level 4 dengan skor 92%.', time: '1 jam lalu', tag: 'pelatihan' },
    { id: 3, title: '💰 Buku Keuangan', text: 'Kas masuk Rp 1.500.000 dari Dewi Lestari (Pelunasan cicilan bulan pertama).', time: '2 jam lalu', tag: 'owner' },
    { id: 4, title: '🏢 Lowongan Baru', text: 'Sakura Care Corp (Jepang) memposting lowongan Kerja Caregiver Lansia (SSW).', time: '1 hari lalu', tag: 'agen' }
  ];
  
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
          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700' }}>Simulasi Departemen</label>
          <select 
            value={activeRole} 
            onChange={(e) => {
              const role = e.target.value;
              setActiveRole(role);
              const defaultTab = {
                rekrutmen: 'overview',
                pelatihan: 'overview',
                asrama: 'asrama',
                dokumentasi: 'siswa_proses',
                it: 'overview',
                agen: 'overview',
                mitra: 'overview',
                owner: 'overview'
              }[role] || 'overview';
              setActiveTab(defaultTab);
            }}
            className="input-field"
            style={{ marginTop: '4px', border: '1px solid var(--primary-accent)', fontWeight: '700', color: 'var(--primary-accent)', backgroundColor: 'var(--primary-light)' }}
          >
            <option value="rekrutmen">📢 1. Rekrutmen</option>
            <option value="pelatihan">🏫 2. Pelatihan & Bahasa</option>
            <option value="asrama">🛏️ 3. Pengelola Asrama</option>
            <option value="dokumentasi">📄 4. Dokumentasi & COE</option>
            <option value="it">💻 5. IT Support</option>
            <option value="agen">🤝 6. Agen Penyalur</option>
            <option value="mitra">🏢 7. Mitra Jepang (User)</option>
            <option value="owner">👑 8. Owner / Pemilik LPK</option>
          </select>
        </div>

        <nav className="sidebar-nav">
          {/* 1. REKRUTMEN */}
          {activeRole === 'rekrutmen' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Ringkasan LPK</button>
              <button className={`sidebar-link ${activeTab === 'prescreening' ? 'active' : ''}`} onClick={() => setActiveTab('prescreening')}>Pendaftaran Baru</button>
            </>
          )}

          {/* 2. PELATIHAN */}
          {activeRole === 'pelatihan' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Ringkasan LPK</button>
              <button className={`sidebar-link ${activeTab === 'siswa_proses' ? 'active' : ''}`} onClick={() => setActiveTab('siswa_proses')}>Alur Kerja Siswa</button>
              <button className={`sidebar-link ${activeTab === 'laporan_analisa' ? 'active' : ''}`} onClick={() => setActiveTab('laporan_analisa')}>Laporan Akademik</button>
            </>
          )}

          {/* 3. ASRAMA */}
          {activeRole === 'asrama' && (
            <>
              <button className={`sidebar-link ${activeTab === 'asrama' ? 'active' : ''}`} onClick={() => setActiveTab('asrama')}>Peta Ranjang Asrama</button>
            </>
          )}

          {/* 4. DOKUMENTASI */}
          {activeRole === 'dokumentasi' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Ringkasan LPK</button>
              <button className={`sidebar-link ${activeTab === 'siswa_proses' ? 'active' : ''}`} onClick={() => setActiveTab('siswa_proses')}>Alur Kerja (COE)</button>
            </>
          )}

          {/* 5. IT SUPPORT */}
          {activeRole === 'it' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Ringkasan LPK</button>
            </>
          )}

          {/* 6. AGEN PENYALUR */}
          {activeRole === 'agen' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Dashboard Penyalur</button>
              <button className={`sidebar-link ${activeTab === 'lowongan' ? 'active' : ''}`} onClick={() => setActiveTab('lowongan')}>Kelola Lowongan</button>
              <button className={`sidebar-link ${activeTab === 'referral' ? 'active' : ''}`} onClick={() => setActiveTab('referral')}>Ledger Sponsor</button>
            </>
          )}

          {/* 7. MITRA JEPANG */}
          {activeRole === 'mitra' && (
            <>
              <button className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Dashboard Kerja</button>
              <button className={`sidebar-link ${activeTab === 'talent_pool' ? 'active' : ''}`} onClick={() => setActiveTab('talent_pool')}>Cari Bakat (Talent)</button>
              <button className={`sidebar-link ${activeTab === 'evaluasi' ? 'active' : ''}`} onClick={() => setActiveTab('evaluasi')}>Evaluasi Alumni</button>
            </>
          )}

          {/* 8. OWNER (FULL ACCESS - ALPHABETICALLY SORTED) */}
          {activeRole === 'owner' && (
            <>
              {[
                { id: 'absensi', label: '📅 Absensi' },
                { id: 'alumni', label: '👥 Alumni' },
                { id: 'keuangan', label: '💰 Buku Kas & Cicilan' },
                { id: 'detail_siswa', label: '👤 Detail Siswa & Orang Tua' },
                { id: 'dompet_koperasi', label: '👛 Dompet & Koperasi' },
                { id: 'events', label: '🎉 Events' },
                { id: 'hrd', label: '👔 HRD' },
                { id: 'inventory', label: '📦 Inventory' },
                { id: 'job_offer', label: '💼 Job Offer' },
                { id: 'kelas_akademis', label: '🏫 Kelas & Akademis' },
                { id: 'laporan_analisa', label: '📊 Laporan & Analisa' },
                { id: 'prescreening', label: '📝 Pendaftaran Baru' },
                { id: 'asrama', label: '🛏️ Peta Ranjang Asrama' },
                { id: 'siswa_proses', label: '📋 Progres Kerja Siswa' },
                { id: 'overview', label: '🏢 Ringkasan LPK (Overview)' },
                { id: 'skill_sertifikasi', label: '🏆 Skill vs Sertifikasi' },
                { id: 'teachers', label: '🎓 Teachers' },
                { id: 'ujian', label: '📝 Ujian' }
              ].map(tab => (
                <button 
                  key={tab.id}
                  className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </>
          )}
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '800' }}>
              {{
                rekrutmen: 'REC',
                pelatihan: 'EDU',
                asrama: 'ASM',
                dokumentasi: 'DOC',
                it: 'IT',
                agen: 'AGN',
                mitra: 'MTR',
                owner: 'OWN'
              }[activeRole] || 'LPK'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700' }}>
                {{
                  rekrutmen: 'Staf Rekrutmen',
                  pelatihan: 'Staf Pelatihan/Bahasa',
                  asrama: 'Staf Pengelola Asrama',
                  dokumentasi: 'Staf Dokumentasi/COE',
                  it: 'IT Support System',
                  agen: 'Agen Penyalur',
                  mitra: 'Mitra Jepang',
                  owner: 'Pemilik LPK (Owner)'
                }[activeRole] || 'Staf LPK'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Simulasi Sesi</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lpk-main-content">
        
        {/* LPK ADMIN VIEW */}
        {['rekrutmen', 'pelatihan', 'asrama', 'dokumentasi', 'it', 'owner'].includes(activeRole) && (
          <div>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h1 style={{ margin: 0, fontSize: '22px' }}>🏫 Panel LPK Overview ({(activeRole === 'it' ? 'IT Support' : activeRole.charAt(0).toUpperCase() + activeRole.slice(1))})</h1>
                <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '12px' }}>Kelola kapasitas fisik asrama, kas cicilan dana talangan, dan kualifikasi calon siswa.</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* Notification Bell */}
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      position: 'relative',
                      color: 'var(--text-main)',
                      padding: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Bell size={20} color="var(--primary-accent)" />
                    <span style={{ 
                      position: 'absolute', 
                      top: '-2px', 
                      right: '-2px', 
                      backgroundColor: 'var(--danger)', 
                      color: 'white', 
                      fontSize: '9px', 
                      fontWeight: '800', 
                      padding: '2px 5px', 
                      borderRadius: '50%',
                      lineHeight: '1'
                    }}>
                      {sampleNotifications.length}
                    </span>
                  </button>

                  {showNotifications && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '40px', 
                      right: '0', 
                      width: '320px', 
                      backgroundColor: 'var(--surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: '12px', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)', 
                      zIndex: '999',
                      padding: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: '800', color: 'var(--text-main)' }}>🔔 Notifikasi Sistem</span>
                        <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer' }}>Tutup</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                        {sampleNotifications.map(n => (
                          <div key={n.id} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: 'var(--primary-accent)' }}>
                              <span>{n.title}</span>
                              <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{n.time}</span>
                            </div>
                            <span style={{ color: 'var(--text-main)', lineHeight: '1.3' }}>{n.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <select value={selectedLpk} onChange={(e) => setSelectedLpk(e.target.value)} className="input-field" style={{ width: '180px', margin: 0 }}>
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

                  <div className="finance-card" onClick={() => setActiveTab('absensi')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>ABSENSI HARI INI ➔</div>
                    <div className="finance-val">96.8% Hadir</div>
                    <div style={{ fontSize: '11px', color: 'var(--secondary)', marginTop: '4px', fontWeight: '600' }}>7 Hadir | 1 Sakit</div>
                  </div>

                  <div className="finance-card" onClick={() => setActiveTab('job_offer')} style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.02em' }}>JOB OPEN VS MATCH ➔</div>
                    <div className="finance-val">15 / 6 Lowongan</div>
                    <div style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '4px', fontWeight: '600' }}>9 Lowongan Tersisa</div>
                  </div>
                </div>

                {/* PIPELINE WORKFLOW STEPS (100% WIDTH) */}
                <div className="card" onClick={() => setActiveTab('siswa_proses')} style={{ cursor: 'pointer', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)' }}>
                    📊 Distribusi Tahap Alur Kerja Siswa (Step-by-Step Pipeline)
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                    {['daftar', 'seleksi', 'pelatihan', 'matching', 'persiapan', 'penempatan', 'alumni', 'evaluasi'].map((categoryKey, idx) => {
                      const label = {
                        daftar: '1. Pendaftaran (Daftar)',
                        seleksi: '2. Tahap Seleksi awal',
                        pelatihan: '3. Pelatihan & Asrama',
                        matching: '4. Job Matching / Wawancara',
                        persiapan: '5. Persiapan Terbang (COE)',
                        penempatan: '6. Penempatan & Kerja',
                        alumni: '7. Komunitas Alumni',
                        evaluasi: '8. Evaluasi & Dana Talangan'
                      }[categoryKey];
                      
                      const info = {
                        daftar: 'Pendaftaran via Website/WA, pengisian Google Form, kelas trial, dan booking seat LPK.',
                        seleksi: 'Pemeriksaan dokumen, tes fisik & BMI, interview awal LPK, penjelasan kriteria kerja, & skema talangan.',
                        pelatihan: 'Pelatihan bahasa & budaya, kurikulum caregiver (Kaigo), masuk asrama, & ujian berkala.',
                        matching: 'Tinjauan job offer Jepang/Korea, unggah video skill, wawancara mensetsu dengan pengguna asing.',
                        persiapan: 'Penerbitan visa & COE, kesiapan mental & fisik, check out asrama LPK, & cicilan talangan awal.',
                        penempatan: 'Tanda tangan kontrak kerja resmi, tiket pesawat & jadwal terbang, penjemputan bandara di negara tujuan.',
                        alumni: 'Pembentukan jaringan alumni/komunitas Kaigo, rekomendasi / referensi pendaftar baru.',
                        evaluasi: 'Adaptasi budaya kerja di lapangan, pelunasan potong gaji, evaluasi kinerja 1, 3, 6 bulan oleh mitra.'
                      }[categoryKey];
                      
                      const studentsInPhase = allChecklists.filter(c => getStudentCurrentPhase(c) === categoryKey).map(c => c.studentName);
                      const count = studentsInPhase.length;
                      const isActive = count > 0;
                      
                      return (
                        <div 
                          key={categoryKey} 
                          style={{
                            border: isActive ? '2px solid var(--primary-accent)' : '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '16px',
                            backgroundColor: isActive ? 'rgba(37, 99, 235, 0.04)' : 'var(--background)',
                            boxShadow: isActive ? '0 8px 16px rgba(37, 99, 235, 0.1)' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.2s ease',
                            transform: isActive ? 'scale(1.01)' : 'none'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '13px', fontWeight: '800', color: isActive ? 'var(--primary-accent)' : 'var(--text-main)' }}>
                                {label}
                              </span>
                              <span style={{ 
                                fontSize: '10px', 
                                fontWeight: '700', 
                                padding: '2px 8px', 
                                borderRadius: '12px', 
                                backgroundColor: isActive ? 'var(--primary-accent)' : 'var(--border)',
                                color: isActive ? 'white' : 'var(--text-muted)'
                              }}>
                                {count} Siswa
                              </span>
                            </div>
                            
                            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '12px', minHeight: '44px' }}>
                              {info}
                            </p>
                          </div>

                          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px' }}>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                              Siswa di Tahap Ini:
                            </span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                              {isActive ? (
                                studentsInPhase.map(name => (
                                  <span 
                                    key={name} 
                                    className="badge badge-blue" 
                                    style={{ 
                                      fontSize: '10px', 
                                      fontWeight: '600', 
                                      padding: '2px 6px',
                                      backgroundColor: 'var(--primary-light)',
                                      color: 'var(--primary-accent)',
                                      border: '1px solid rgba(37, 99, 235, 0.15)'
                                    }}
                                  >
                                    {name}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                  Kosong
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* GRAPH 2 & QUICK GUIDE (2-COLUMN ROW) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
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

                  <div className="card">
                    <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>💡 Panduan Akses Cepat Dashboard</h3>
                    <ul style={{ fontSize: '11.5px', color: 'var(--text-muted)', paddingLeft: '20px', lineHeight: '1.6' }}>
                      <li>Kelola pendaftaran otomatis dan BMI di tab <b>Prescreening</b>.</li>
                      <li>Perbarui asrama dan penempatan ranjang siswa di tab <b>Asrama</b>.</li>
                      <li>Verifikasi pembayaran dana talangan dan potong gaji di tab <b>Buku Keuangan</b>.</li>
                      <li>Lihat postingan lowongan kerja yang diunggah mitra Jepang di tab <b>Lowongan</b>.</li>
                    </ul>
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

            {/* SCREEN: LAPORAN & ANALISA */}
            {activeTab === 'laporan_analisa' && (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', margin: 0 }}>📊 Laporan & Analisa Operasional LPK</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0 0' }}>Dashboard analitik untuk memantau performa bahasa, arus kas talangan, efisiensi terbang, dan tingkat kelulusan seleksi.</p>
                  </div>
                  <button 
                    onClick={() => alert(`Laporan (${selectedReportType.toUpperCase()}) berhasil diekspor sebagai file XLSX/PDF!`)} 
                    className="btn btn-outline" 
                    style={{ fontSize: '11px', height: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Download size={14} /> Ekspor Data
                  </button>
                </div>

                {/* Sub Tab selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'akademik', label: '📖 Kelulusan & Kesiapan Akademik', desc: 'Nilai kelulusan, skor latihan, & status kelayakan SSW.' },
                    { id: 'keuangan', label: '💰 Keuangan & Aging Talangan', desc: 'Distribusi piutang dana talangan alumni di Jepang/Korea.' },
                    { id: 'keberangkatan', label: '✈️ Keberangkatan & Pipeline', desc: 'Rata-rata durasi tunggu wawancara (Mensetsu) & COE.' },
                    { id: 'screening', label: '🔍 Pre-Screening & Rekrutmen', desc: 'Statistik drop-out calon siswa & kegagalan uji fisik.' },
                    { id: 'talent_mapping', label: '🗺️ Talent Mapping', desc: 'Pengelompokan siswa berdasarkan level bahasa vs keahlian.' },
                    { id: 'skill_job_desc', label: '📋 Skill vs Job Desc Match', desc: 'Kesesuaian keahlian siswa dengan deskripsi pekerjaan mitra.' },
                    { id: 'skill_terbanyak', label: '📊 Distribusi Skill Terbanyak', desc: 'Daftar sertifikat keahlian terbanyak diurutkan.' }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setSelectedReportType(tab.id)}
                      className={`btn ${selectedReportType === tab.id ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '11.5px', height: '34px', fontWeight: '700', padding: '0 12px' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* REPORT SECTION content */}
                {selectedReportType === 'akademik' && (
                  <div>
                    <div className="finance-grid" style={{ marginBottom: '20px' }}>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>RATA-RATA NILAI KUIS</div>
                        <div className="finance-val" style={{ color: 'var(--secondary)' }}>88.4%</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Target LPK: 80.0%</div>
                      </div>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>SSW & JFT READY</div>
                        <div className="finance-val">3 Siswa</div>
                        <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '4px' }}>Kelayakan terbang tinggi</div>
                      </div>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL SESI LATIHAN</div>
                        <div className="finance-val">142 Kali</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Diperbarui real-time dari PWA</div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '13px', marginBottom: '8px' }}>Daftar Kesiapan Ujian & Bahasa Mandiri</h3>
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>Nama Siswa</th>
                          <th>Bahasa Jepang (N4/JFT)</th>
                          <th>Skill Kaigo (SSW)</th>
                          <th>Rata-rata Skor</th>
                          <th>Status Belajar</th>
                          <th>Nilai Huruf</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Budi Utomo', lang: 'Lulus (JFT-Basic)', skill: 'Siap Ujian', score: '92%', status: 'Aktif Belajar', grade: 'A' },
                          { name: 'Siti Rahma', lang: 'Lulus (JFT-Basic)', skill: 'Siap Ujian', score: '89%', status: 'Wawancara Selesai', grade: 'B' },
                          { name: 'Dewi Lestari', lang: 'Lulus (N4 Prep)', skill: 'Siap Ujian', score: '91%', status: 'Proses Visa', grade: 'A' },
                          { name: 'Agus Wijaya', lang: 'Belum Ujian', skill: 'Belum Siap', score: '45%', status: 'Perlu Bimbingan', grade: 'D' }
                        ].map((item, idx) => (
                          <tr key={idx}>
                            <td><b style={{ color: 'var(--text-main)' }}>{item.name}</b></td>
                            <td>
                              <span className={`badge ${item.lang.includes('Lulus') ? 'badge-blue' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                                {item.lang}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${item.skill.includes('Siap') ? 'badge-blue' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                                {item.skill}
                              </span>
                            </td>
                            <td><b>{item.score}</b></td>
                            <td><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.status}</span></td>
                            <td>
                              <span style={{ 
                                fontWeight: '900', 
                                color: item.grade === 'A' ? 'var(--secondary)' : item.grade === 'B' ? 'var(--primary-accent)' : 'var(--danger)',
                                fontSize: '12px'
                              }}>
                                {item.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedReportType === 'keuangan' && (
                  <div>
                    <div className="finance-grid" style={{ marginBottom: '20px' }}>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL PENYALURAN TALANGAN</div>
                        <div className="finance-val">Rp 60.000.000</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Untuk 4 siswa LPK</div>
                      </div>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>SUDAH DIKEMBALIKAN</div>
                        <div className="finance-val" style={{ color: 'var(--secondary)' }}>Rp 15.000.000</div>
                        <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '4px' }}>Rasio Pengembalian: 25.0%</div>
                      </div>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>SISA PIUTANG AKTIF (OUTSTANDING)</div>
                        <div className="finance-val" style={{ color: 'var(--danger)' }}>Rp 45.000.000</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Sedang berjalan potong gaji</div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '13px', marginBottom: '8px' }}>Laporan Kualifikasi & Umur Piutang Alumni (Aging Analysis)</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Daftar status pembayaran dana talangan LPK setelah alumni ditempatkan di panti lansia/pabrik mitra Jepang.</p>
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>Klasifikasi Umur Piutang</th>
                          <th>Jumlah Alumni</th>
                          <th>Total Nominal</th>
                          <th>Status Risiko</th>
                          <th>Aksi Rekomendasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { aging: 'Lancar (Lunas tepat waktu, 0-30 Hari)', count: '3 Alumni', amount: 'Rp 12.500.000', risk: 'Sangat Rendah', color: 'var(--secondary)', action: 'Terbitkan Kuitansi & Slip Gaji' },
                          { aging: 'Dalam Perhatian (Terlambat 31-90 Hari)', count: '1 Alumni', amount: 'Rp 2.500.000', risk: 'Sedang', color: 'var(--warning)', action: 'Kirim Pengingat WA Otomatis' },
                          { aging: 'Macet (Menunggak >90 Hari)', count: '0 Alumni', amount: 'Rp 0', risk: 'Tinggi', color: 'var(--danger)', action: 'Hubungi Agency / Penyalur' }
                        ].map((item, idx) => (
                          <tr key={idx}>
                            <td><b>{item.aging}</b></td>
                            <td>{item.count}</td>
                            <td><b>{item.amount}</b></td>
                            <td>
                              <span style={{ fontWeight: '700', color: item.color, fontSize: '11.5px' }}>
                                {item.risk}
                              </span>
                            </td>
                            <td>
                              <button 
                                onClick={() => alert(`Menjalankan aksi: "${item.action}"`)} 
                                className="btn btn-outline" 
                                style={{ height: '24px', padding: '0 8px', fontSize: '10px' }}
                              >
                                {item.action}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedReportType === 'keberangkatan' && (
                  <div>
                    <div className="finance-grid" style={{ marginBottom: '20px' }}>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>RATA-RATA WAKTU TUNGGU MENSETSU</div>
                        <div className="finance-val">18 Hari</div>
                        <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '4px' }}>Siswa Lulus ➔ Sukses Match</div>
                      </div>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>RATA-RATA PROSES COE & VISA</div>
                        <div className="finance-val">42 Hari</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Target Keimigrasian Jepang</div>
                      </div>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TINGKAT KELULUSAN VISA</div>
                        <div className="finance-val" style={{ color: 'var(--secondary)' }}>100%</div>
                        <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '4px' }}>Nol penolakan visa imigrasi</div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '13px', marginBottom: '8px' }}>Corong Efisiensi Operasional (Funnel Keberangkatan)</h3>
                    <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {[
                        { step: 'Daftar -> Lulus Seleksi Fisik LPK', pct: 85, detail: '12 Pendaftar -> 10 Lulus (BMI/Tinggi)' },
                        { step: 'Pelatihan Kelas -> Lulus Ujian JFT & SSW', pct: 80, detail: '10 Siswa -> 8 Lulus Sertifikasi Mandiri' },
                        { step: 'Siswa JFT Lulus -> Sukses Wawancara (Match)', pct: 75, detail: '8 Siswa -> 6 Diterima User Jepang' },
                        { step: 'Proses COE -> Terbang & Penempatan Kerja', pct: 66, detail: '6 Siswa -> 4 Terbang (2 Dalam Proses COE)' }
                      ].map((funnel, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                            <span>{funnel.step}</span>
                            <span style={{ color: 'var(--primary-accent)' }}>{funnel.pct}% Konversi ({funnel.detail})</span>
                          </div>
                          <div style={{ width: '100%', height: '14px', backgroundColor: 'var(--primary-light)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ width: `${funnel.pct}%`, height: '100%', backgroundColor: 'var(--primary-accent)' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedReportType === 'screening' && (
                  <div>
                    <div className="finance-grid" style={{ marginBottom: '20px' }}>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL PENDAFTAR BARU</div>
                        <div className="finance-val">12 Calon</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Periode: Bulan Ini</div>
                      </div>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TINGKAT KELULUSAN FISIK</div>
                        <div className="finance-val" style={{ color: 'var(--secondary)' }}>75.0%</div>
                        <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '4px' }}>Memenuhi kriteria buta warna & BMI</div>
                      </div>
                      <div className="finance-card">
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>PENYEBAB UTAMA GUGUR SELEKSI</div>
                        <div className="finance-val" style={{ color: 'var(--danger)' }}>Buta Warna</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Kriteria mutlak panti lansia Jepang</div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '13px', marginBottom: '8px' }}>Rincian Alasan Gugur Calon Siswa (Pre-Screening Audit)</h3>
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>Alasan Kegagalan Fisik/Administrasi</th>
                          <th>Persentase</th>
                          <th>Jumlah Pendaftar</th>
                          <th>Keterangan Medis & Kriteria LPK</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { reason: 'Buta Warna Parsial / Total', pct: '60%', count: '3 Pelamar', desc: 'Mitra panti lansia Jepang melarang keras buta warna karena risiko keselamatan pemberian obat.' },
                          { reason: 'BMI Obesitas / Terlalu Kurus', pct: '20%', count: '1 Pelamar', desc: 'Pekerjaan caregiver membutuhkan ketahanan fisik prima untuk membantu mobilitas lansia.' },
                          { reason: 'Tinggi Badan di Bawah Batas Minimum (150cm)', pct: '20%', count: '1 Pelamar', desc: 'Persyaratan ergonomis transfer pasien lansia menggunakan alat bantu transfer Jepang.' },
                          { reason: 'Tato Terbuka / Riwayat Operasi Berat', pct: '0%', count: '0 Pelamar', desc: 'Aturan etika berpakaian di panti lansia Jepang.' }
                        ].map((item, idx) => (
                          <tr key={idx}>
                            <td><b style={{ color: 'var(--text-main)' }}>{item.reason}</b></td>
                            <td><span className="badge badge-blue" style={{ fontSize: '10.5px' }}>{item.pct}</span></td>
                            <td><b>{item.count}</b></td>
                            <td><span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{item.desc}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedReportType === 'talent_mapping' && (
                  <div>
                    <h3 style={{ fontSize: '13px', marginBottom: '12px' }}>🗺️ Peta Bakat & Kesiapan Kerja (Talent Mapping)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                      <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--secondary)', margin: '0 0 6px 0', fontWeight: '800' }}>🟩 Kuadran I: JFT Passed & SSW Ready (Siap Terbang)</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {['Siti Rahma', 'Budi Utomo', 'Dewi Lestari', 'Eka Putri'].map(name => (
                            <span key={name} className="badge badge-blue" style={{ fontSize: '10px' }}>{name}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'rgba(37, 99, 235, 0.05)' }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--primary-accent)', margin: '0 0 6px 0', fontWeight: '800' }}>🟦 Kuadran II: JFT Prep & SSW Ready (Siap Wawancara)</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {['Rudi Hermawan', 'Larasati'].map(name => (
                            <span key={name} className="badge badge-blue" style={{ fontSize: '10px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-accent)' }}>{name}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--warning)', margin: '0 0 6px 0', fontWeight: '800' }}>🟨 Kuadran III: JFT Prep & SSW Prep (Sedang Belajar)</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {['Fahri Hamzah'].map(name => (
                            <span key={name} className="badge" style={{ fontSize: '10px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: 'var(--warning)' }}>{name}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--danger)', margin: '0 0 6px 0', fontWeight: '800' }}>🟥 Kuadran IV: Perlu Perhatian Khusus (Skor Rendah)</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {['Agus Wijaya'].map(name => (
                            <span key={name} className="badge" style={{ fontSize: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>{name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedReportType === 'skill_job_desc' && (
                  <div>
                    <h3 style={{ fontSize: '13px', marginBottom: '8px' }}>📋 Kesesuaian Keahlian Siswa dengan Deskripsi Pekerjaan (Skill Match)</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Mengukur kecocokan keahlian teknis caregiver LPK dengan kriteria spesifik panti lansia Jepang.</p>
                    <table className="ledger-table">
                      <thead>
                        <tr>
                          <th>Nama Siswa</th>
                          <th>Pemindahan Pasien (Transfer)</th>
                          <th>Membantu Makan (Feeding)</th>
                          <th>Membantu Mandi (Bathing)</th>
                          <th>Dementia Care</th>
                          <th>Kesesuaian (Match Rate)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'Budi Utomo', transfer: 'Kompete ✓', feeding: 'Kompete ✓', bathing: 'Kompete ✓', dementia: 'Kompete ✓', pct: '95%' },
                          { name: 'Siti Rahma', transfer: 'Kompete ✓', feeding: 'Kompete ✓', bathing: 'Kompete ✓', dementia: 'Kompete ✓', pct: '98%' },
                          { name: 'Larasati', transfer: 'Kompete ✓', feeding: 'Kompete ✓', bathing: 'Belum Uji', dementia: 'Kompete ✓', pct: '80%' },
                          { name: 'Agus Wijaya', transfer: 'Belum Uji', feeding: 'Cukup', bathing: 'Belum Uji', dementia: 'Belum Uji', pct: '40%' }
                        ].map((item, idx) => (
                          <tr key={idx}>
                            <td><b>{item.name}</b></td>
                            <td>{item.transfer}</td>
                            <td>{item.feeding}</td>
                            <td>{item.bathing}</td>
                            <td>{item.dementia}</td>
                            <td><b style={{ color: 'var(--secondary)' }}>{item.pct} Match</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedReportType === 'skill_terbanyak' && (
                  <div>
                    <h3 style={{ fontSize: '13px', marginBottom: '12px' }}>📊 Kepemilikan Sertifikat & Keahlian Terbanyak</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {[
                        { name: 'Sertifikasi JFT-Basic / JLPT N4 (Bahasa Jepang)', count: 5, pct: 62 },
                        { name: 'Sertifikasi Tokutei Ginou SSW Caregiver (Keterampilan)', count: 4, pct: 50 },
                        { name: 'Sertifikasi P3K & Keselamatan Kerja (First Aid)', count: 3, pct: 37 },
                        { name: 'Sertifikasi Pelatihan Dementia Care Lansia', count: 2, pct: 25 },
                        { name: 'Sertifikasi Pengelolaan Gizi & Memasak Lansia', count: 1, pct: 12 }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                            <span>{idx + 1}. {item.name}</span>
                            <span style={{ color: 'var(--primary-accent)' }}>{item.count} Siswa ({item.pct}%)</span>
                          </div>
                          <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--primary-light)', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{ width: `${item.pct}%`, height: '100%', backgroundColor: 'var(--primary-accent)' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SCREEN: ABSENSI */}
            {activeTab === 'absensi' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>📅 Laporan Absensi Harian Siswa LPK</h2>
                <div className="finance-grid" style={{ marginBottom: '20px' }}>
                  <div className="finance-card">
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>PERSENTASE KEHADIRAN BULAN INI</div>
                    <div className="finance-val" style={{ color: 'var(--secondary)' }}>96.8%</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Hadir: 7 Siswa | Sakit: 1 Siswa</div>
                  </div>
                  <div className="finance-card">
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL TERLAMBAT</div>
                    <div className="finance-val">0 Kali</div>
                    <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '4px' }}>Disiplin waktu sangat tinggi</div>
                  </div>
                </div>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Siswa</th>
                      <th>Kehadiran (%)</th>
                      <th>Hadir</th>
                      <th>Sakit / Izin</th>
                      <th>Tanpa Keterangan</th>
                      <th>Status Disiplin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Budi Utomo', pct: '98%', present: 24, permission: 0, absent: 0, status: 'Sangat Disiplin' },
                      { name: 'Siti Rahma', pct: '96%', present: 23, permission: 1, absent: 0, status: 'Sangat Disiplin' },
                      { name: 'Agus Wijaya', pct: '92%', present: 22, permission: 2, absent: 0, status: 'Disiplin' },
                      { name: 'Dewi Lestari', pct: '97%', present: 23, permission: 0, absent: 0, status: 'Sangat Disiplin' },
                      { name: 'Rudi Hermawan', pct: '95%', present: 23, permission: 1, absent: 0, status: 'Disiplin' },
                      { name: 'Larasati', pct: '98%', present: 24, permission: 0, absent: 0, status: 'Sangat Disiplin' },
                      { name: 'Fahri Hamzah', pct: '96%', present: 23, permission: 1, absent: 0, status: 'Disiplin' },
                      { name: 'Eka Putri', pct: '97%', present: 23, permission: 0, absent: 0, status: 'Sangat Disiplin' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td><b style={{ color: 'var(--primary-accent)' }}>{item.pct}</b></td>
                        <td>{item.present} Hari</td>
                        <td>{item.permission} Hari</td>
                        <td>{item.absent} Hari</td>
                        <td><span className="badge badge-blue">{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: ALUMNI */}
            {activeTab === 'alumni' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>👥 Portal Pemantauan & Hubungan Alumni di Jepang / Korea</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '16px' }}>Daftar alumni LPK Hikari yang sudah bekerja di panti lansia / rumah sakit mitra luar negeri.</p>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Alumni</th>
                      <th>Penempatan Mitra</th>
                      <th>Kota / Prefektur</th>
                      <th>Gaji Ditawarkan (Lokal)</th>
                      <th>Kontrak Mulai</th>
                      <th>Ulasan User Jepang</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Siti Rahma', partner: 'Tokyo Elder Care Home', city: 'Tokyo', salary: '¥195.000', start: 'Maret 2026', rating: 'Sangat Baik (A)' },
                      { name: 'Dewi Lestari', partner: 'Osaka Sunrise Care Corp', city: 'Osaka', salary: '¥190.000', start: 'April 2026', rating: 'Sangat Baik (A)' },
                      { name: 'Fahri Hamzah', partner: 'Kyoto Green Garden Lodge', city: 'Kyoto', salary: '¥185.000', start: 'Mei 2026', rating: 'Memuaskan (B)' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td><span className="badge badge-blue">{item.partner}</span></td>
                        <td>{item.city}</td>
                        <td><b style={{ color: 'var(--secondary)' }}>{item.salary}</b></td>
                        <td>{item.start}</td>
                        <td><span style={{ fontWeight: '800', color: 'var(--secondary)' }}>{item.rating}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: DETAIL SISWA & ORANG TUA */}
            {activeTab === 'detail_siswa' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>👤 Detail Informasi Siswa & Kontak Orang Tua</h2>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Siswa</th>
                      <th>Nama Orang Tua / Wali</th>
                      <th>No. Telp Orang Tua</th>
                      <th>Alamat Rumah Lengkap</th>
                      <th>Surat Izin Orang Tua</th>
                      <th>Emergency Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Budi Utomo', parent: 'Slamet Utomo', phone: '0812-3456-7890', address: 'Sleman, D.I. Yogyakarta', permit: 'Terverifikasi ✓', emergency: 'Ibu Utomo (Ibu)' },
                      { name: 'Agus Wijaya', parent: 'Hendro Wijaya', phone: '0813-9876-5432', address: 'Bantul, D.I. Yogyakarta', permit: 'Terverifikasi ✓', emergency: 'Hendro Wijaya (Ayah)' },
                      { name: 'Siti Rahma', parent: 'Ahmad Dahlan', phone: '0857-4321-8765', address: 'Solo, Jawa Tengah', permit: 'Terverifikasi ✓', emergency: 'Ahmad Dahlan (Ayah)' },
                      { name: 'Rudi Hermawan', parent: 'Subagio Hermawan', phone: '0821-5555-1234', address: 'Kulon Progo, DIY', permit: 'Dalam Proses ⏱', emergency: 'Ibu Hermawan (Ibu)' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td>{item.parent}</td>
                        <td>{item.phone}</td>
                        <td>{item.address}</td>
                        <td>
                          <span style={{ fontWeight: '700', color: item.permit.includes('✓') ? 'var(--secondary)' : 'var(--warning)' }}>
                            {item.permit}
                          </span>
                        </td>
                        <td><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.emergency}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: DOMPET & KOPERASI */}
            {activeTab === 'dompet_koperasi' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>👛 Keuangan Dompet Siswa & Simpan-Pinjam Koperasi LPK</h2>
                <div className="finance-grid" style={{ marginBottom: '20px' }}>
                  <div className="finance-card">
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>TOTAL KAS KOPERASI LPK</div>
                    <div className="finance-val">Rp 24.500.000</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Simpanan Pokok & Wajib Aktif</div>
                  </div>
                  <div className="finance-card">
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>ALOKASI KANTIN / TRANSAKSI SISWA</div>
                    <div className="finance-val" style={{ color: 'var(--secondary)' }}>Rp 4.250.000</div>
                    <div style={{ fontSize: '10px', color: 'var(--secondary)', marginTop: '4px' }}>Menggunakan deposit QR Code PWA</div>
                  </div>
                </div>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Siswa</th>
                      <th>Saldo Saku PWA</th>
                      <th>Simpanan Wajib</th>
                      <th>Simpanan Pokok</th>
                      <th>Pinjaman Koperasi</th>
                      <th>Status Anggota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Budi Utomo', wallet: 'Rp 250.000', wajib: 'Rp 100.000', pokok: 'Rp 200.000', loan: 'Rp 0', status: 'Anggota Aktif' },
                      { name: 'Siti Rahma', wallet: 'Rp 120.000', wajib: 'Rp 100.000', pokok: 'Rp 200.000', loan: 'Rp 50.000', status: 'Anggota Aktif' },
                      { name: 'Agus Wijaya', wallet: 'Rp 450.000', wajib: 'Rp 100.000', pokok: 'Rp 200.000', loan: 'Rp 0', status: 'Anggota Aktif' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td><b style={{ color: 'var(--primary-accent)' }}>{item.wallet}</b></td>
                        <td>{item.wajib}</td>
                        <td>{item.pokok}</td>
                        <td><span style={{ color: item.loan !== 'Rp 0' ? 'var(--danger)' : 'var(--text-muted)', fontWeight: '700' }}>{item.loan}</span></td>
                        <td><span className="badge badge-blue">{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: EVENTS */}
            {activeTab === 'events' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>🎉 Kalender Kegiatan & Acara Mendatang LPK</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { title: 'Wawancara Kerja (Mensetsu) Sakura Care Corp', date: '10 Juli 2026', time: '09:00 - 12:00', loc: 'Ruang Rapat Utama & Zoom', desc: 'Wawancara kerja untuk 3 siswa JFT lulus dengan pimpinan panti lansia Tokyo.' },
                    { title: 'Simulasi Ujian JFT-Basic Mandiri', date: '15 Juli 2026', time: '08:00 - 11:30', loc: 'Lab Komputer LPK', desc: 'Simulasi ujian bahasa akhir untuk mengukur kesiapan pendaftaran JFT resmi.' },
                    { title: 'Pemberangkatan Gelombang IV (Terbang Jepang)', date: '25 Juli 2026', time: '17:00 - Selesai', loc: 'Bandara Adisutjipto / YIA', desc: 'Pelepasan resmi dan flight alumni ke Tokyo/Osaka (Dewi Lestari & Larasati).' }
                  ].map((ev, idx) => (
                    <div key={idx} style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--background)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '800', fontSize: '13.5px', color: 'var(--primary-accent)' }}>{ev.title}</span>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: 'var(--primary-accent)' }}>{ev.date}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>🕒 {ev.time} | 📍 {ev.loc}</div>
                      <p style={{ fontSize: '12px', color: 'var(--text-main)', margin: 0 }}>{ev.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SCREEN: HRD */}
            {activeTab === 'hrd' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>👔 Daftar Pegawai & HRD LPK Hikari</h2>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Staff</th>
                      <th>Jabatan / Departemen</th>
                      <th>No. Handphone</th>
                      <th>Status Kepegawaian</th>
                      <th>Kehadiran Bulan Ini</th>
                      <th>Gaji Pokok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Dr. Slamet Budiono', pos: 'Kepala Lembaga LPK / Owner', phone: '0811-2222-3333', type: 'Owner / Direktur', att: '100%', salary: 'Rp 15.000.000' },
                      { name: 'Tanaka Kenji', pos: 'Kepala Kurikulum & Bahasa Jepang', phone: '0812-4444-5555', type: 'Pegawai Kontrak Expat', att: '98%', salary: 'Rp 12.000.000' },
                      { name: 'Heri Prasetyo', pos: 'Staf Dokumentasi & COE Imigrasi', phone: '0813-6666-7777', type: 'Pegawai Tetap', att: '96%', salary: 'Rp 5.500.000' },
                      { name: 'Santi Handayani', pos: 'Pengelola Asrama & Logistik', phone: '0814-8888-9999', type: 'Pegawai Tetap', att: '97%', salary: 'Rp 4.800.000' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td>{item.pos}</td>
                        <td>{item.phone}</td>
                        <td><span className="badge badge-blue">{item.type}</span></td>
                        <td><b>{item.att}</b></td>
                        <td><span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{item.salary}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>📦 Inventaris Logistik & Sarana Pelatihan Asrama</h2>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Barang / Aset</th>
                      <th>Kategori</th>
                      <th>Stok Total</th>
                      <th>Kondisi Baik</th>
                      <th>Kondisi Rusak</th>
                      <th>Status Inventaris</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Buku Pelatihan Minna no Nihongo I', cat: 'Bahan Ajar Bahasa', total: 50, good: 48, bad: 2, status: 'Cukup' },
                      { name: 'Ranjang Kayu Susun Asrama', cat: 'Logistik Asrama', total: 20, good: 20, bad: 0, status: 'Optimal' },
                      { name: 'Kursi Roda Praktek Pasien Lansia', cat: 'Alat Peraga Kaigo', total: 4, good: 4, bad: 0, status: 'Optimal' },
                      { name: 'Dummy Tempat Tidur Transfer Pasien', cat: 'Alat Peraga Kaigo', total: 2, good: 2, bad: 0, status: 'Optimal' },
                      { name: 'Sprei Asrama & Sarung Bantal Set', cat: 'Logistik Asrama', total: 40, good: 35, bad: 5, status: 'Perlu Pengadaan' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td>{item.cat}</td>
                        <td><b>{item.total} Unit</b></td>
                        <td>{item.good} Unit</td>
                        <td>{item.bad} Unit</td>
                        <td>
                          <span className={`badge ${item.status === 'Optimal' ? 'badge-blue' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: JOB OFFER */}
            {activeTab === 'job_offer' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>💼 Informasi Lowongan Kerja Caregiver Aktif (Job Offer Jepang & Korea)</h2>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Posisi / Perusahaan</th>
                      <th>Prefektur (Wilayah)</th>
                      <th>Gaji Ditawarkan</th>
                      <th>Syarat Bahasa</th>
                      <th>Slot Kuota</th>
                      <th>Status Proses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { title: 'Caregiver Lansia / Sakura Care Corp', loc: 'Tokyo, Jepang', salary: '¥195.000 / Bulan', req: 'JFT-Basic / N4 + SSW', slot: '5 Slot', status: 'Wawancara Berjalan' },
                      { title: 'Nursing Assistant / Sunrise Center', loc: 'Osaka, Jepang', salary: '¥190.000 / Bulan', req: 'JFT-Basic / N4 + SSW', slot: '3 Slot', status: 'Match Terpenuhi' },
                      { title: 'Kaigo Care Worker / Green Lodge', loc: 'Kyoto, Jepang', salary: '¥185.000 / Bulan', req: 'JFT-Basic / N4 + SSW', slot: '2 Slot', status: 'Membuka Lamaran' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div style={{ fontWeight: '700' }}>{item.title}</div>
                        </td>
                        <td>{item.loc}</td>
                        <td><b style={{ color: 'var(--secondary)' }}>{item.salary}</b></td>
                        <td><span className="badge badge-blue">{item.req}</span></td>
                        <td><b>{item.slot}</b></td>
                        <td><span style={{ fontSize: '11px', color: 'var(--primary-accent)', fontWeight: '700' }}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: KELAS & AKADEMIS */}
            {activeTab === 'kelas_akademis' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>🏫 Pembagian Kelas Akademik & Bahasa LPK</h2>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Kelas</th>
                      <th>Materi Pembelajaran</th>
                      <th>Sensei Pengajar</th>
                      <th>Jumlah Siswa</th>
                      <th>Jadwal Kelas</th>
                      <th>Ruang Belajar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Kelas Kaigo Alfa (A)', cat: 'Praktek Keterampilan Caregiver (SSW)', teacher: 'Tanaka Kenji Sensei', students: '4 Siswa', schedule: 'Senin - Rabu, 08:00 - 12:00', room: 'Ruang Lab Praktek' },
                      { name: 'Kelas Nihongo Beta (B)', cat: 'Bahasa Jepang & Budaya (N4/JFT)', teacher: 'Yuki Kanda Sensei', students: '4 Siswa', schedule: 'Senin - Jumat, 13:00 - 17:00', room: 'Ruang Teori 102' },
                      { name: 'Kelas Kaiwa Intensive', cat: 'Percakapan Harian & Persiapan Kerja', teacher: 'Tanaka Kenji Sensei', students: '2 Siswa (Lulus JFT)', schedule: 'Kamis - Jumat, 08:00 - 12:00', room: 'Ruang Meeting Utama' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td>{item.cat}</td>
                        <td>{item.teacher}</td>
                        <td><b>{item.students}</b></td>
                        <td>{item.schedule}</td>
                        <td><span className="badge badge-blue">{item.room}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: SKILL VS SERTIFIKASI */}
            {activeTab === 'skill_sertifikasi' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>🏆 Matrix Kompetensi Skill vs Sertifikat Siswa</h2>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Siswa</th>
                      <th>Sertifikat JFT-Basic</th>
                      <th>Sertifikat JLPT N4</th>
                      <th>Sertifikat SSW Kaigo</th>
                      <th>Sertifikat First Aid (P3K)</th>
                      <th>Kesiapan Match Kerja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Budi Utomo', jft: 'Lulus ✓', jlpt: 'Proses Ujian', ssw: 'Lulus ✓', firstaid: 'Lulus ✓', status: 'Sangat Siap (100%)' },
                      { name: 'Agus Wijaya', jft: 'Belum Ujian', jlpt: 'Belum Ujian', ssw: 'Proses Ujian', firstaid: 'Lulus ✓', status: 'Belum Layak (40%)' },
                      { name: 'Siti Rahma', jft: 'Lulus ✓', jlpt: 'Lulus ✓', ssw: 'Lulus ✓', firstaid: 'Lulus ✓', status: 'Sangat Siap (100%)' },
                      { name: 'Dewi Lestari', jft: 'Lulus ✓', jlpt: 'Proses Ujian', ssw: 'Lulus ✓', firstaid: 'Lulus ✓', status: 'Sangat Siap (100%)' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td><span style={{ color: item.jft.includes('✓') ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: '700' }}>{item.jft}</span></td>
                        <td>{item.jlpt}</td>
                        <td><span style={{ color: item.ssw.includes('✓') ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: '700' }}>{item.ssw}</span></td>
                        <td>{item.firstaid}</td>
                        <td>
                          <span style={{ 
                            fontWeight: '800', 
                            color: item.status.includes('100%') ? 'var(--secondary)' : 'var(--danger)'
                          }}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: TEACHERS */}
            {activeTab === 'teachers' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>🎓 Daftar Tenaga Pengajar & Instruktur Caregiver LPK</h2>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Pengajar</th>
                      <th>Spesialisasi</th>
                      <th>Jam Mengajar / Minggu</th>
                      <th>Rating Penilaian Siswa</th>
                      <th>Kontak Email</th>
                      <th>Status Keaktifan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Tanaka Kenji Sensei', spec: 'Keterampilan Caregiver & Kaiwa', hours: '20 Jam', rating: '⭐️ 4.9', email: 'tanaka@lpk-hikari.com', status: 'Aktif Mengajar' },
                      { name: 'Yuki Kanda Sensei', spec: 'Tata Bahasa Jepang & JFT Prep', hours: '24 Jam', rating: '⭐️ 4.7', email: 'yuki.kanda@lpk-hikari.com', status: 'Aktif Mengajar' },
                      { name: 'Budi Santoso, S.Kep.', spec: 'Dasar Medis & Anatomi Lansia', hours: '12 Jam', rating: '⭐️ 4.8', email: 'budi@lpk-hikari.com', status: 'Aktif Mengajar' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td>{item.spec}</td>
                        <td><b>{item.hours}</b></td>
                        <td><span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{item.rating}</span></td>
                        <td>{item.email}</td>
                        <td><span className="badge badge-blue">{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* SCREEN: UJIAN */}
            {activeTab === 'ujian' && (
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '16px' }}>📝 Ujian Akademik & Praktek Kerja Mandiri LPK</h2>
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Nama Siswa</th>
                      <th>Ujian JFT Mock-Test</th>
                      <th>Ujian Teori Caregiver</th>
                      <th>Ujian Praktek Transfer Pasien</th>
                      <th>Nilai Akhir Kelulusan</th>
                      <th>Status Hasil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Budi Utomo', jft: '90 / 100', theory: '85 / 100', practice: 'Sangat Baik', final: '87.5%', status: 'LULUS MANDIRI' },
                      { name: 'Agus Wijaya', jft: '40 / 100', theory: '50 / 100', practice: 'Cukup', final: '45.0%', status: 'MENGULANG (HER)' },
                      { name: 'Siti Rahma', jft: '95 / 100', theory: '90 / 100', practice: 'Sempurna', final: '92.5%', status: 'LULUS MANDIRI' },
                      { name: 'Dewi Lestari', jft: '92 / 100', theory: '88 / 100', practice: 'Sangat Baik', final: '90.0%', status: 'LULUS MANDIRI' }
                    ].map((item, idx) => (
                      <tr key={idx}>
                        <td><b>{item.name}</b></td>
                        <td>{item.jft}</td>
                        <td>{item.theory}</td>
                        <td>{item.practice}</td>
                        <td><b style={{ color: 'var(--primary-accent)' }}>{item.final}</b></td>
                        <td>
                          <span className={`badge ${item.status.includes('LULUS') ? 'badge-blue' : 'badge-danger'}`} style={{ fontSize: '11px' }}>
                            {item.status}
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

        {/* MITRA JEPANG VIEW */}
        {activeRole === 'mitra' && (
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
        {activeRole === 'agen' && (
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
