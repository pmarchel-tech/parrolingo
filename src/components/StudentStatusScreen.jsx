import React, { useState, useEffect } from 'react';
import { 
  getFinancialLedger, 
  updateFinancialLedger, 
  getStudentChecklist,
  getDormRooms,
  seedDefaultChecklists
} from '../utils/db';
import { 
  ShieldCheck, Calendar, Clock, User, Award, Plane, Wallet, 
  AlertCircle, CheckCircle2, ChevronRight, Eye, Users, FileText
} from 'lucide-react';

export default function StudentStatusScreen({ progress }) {
  const [isWaliView, setIsWaliView] = useState(false);
  const [studentName, setStudentName] = useState('Budi Utomo'); // Default simulated student
  
  // Database states
  const [ledger, setLedger] = useState(null);
  const [checklist, setChecklist] = useState(null);
  const [activeBed, setActiveBed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudentData();
  }, [studentName]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      // Ensure seed data is initialized
      try {
        await seedDefaultChecklists();
      } catch (err) {
        console.error("Seeding failed: ", err);
      }

      // Fetch financial ledger
      const l = await getFinancialLedger(studentName);
      if (l) setLedger(l);

      // Fetch checklist (Visa process)
      const c = await getStudentChecklist(studentName);
      if (c) setChecklist(c);

      // Find occupied bed in dormitory rooms
      const rooms = await getDormRooms();
      let foundBed = null;
      rooms.forEach(room => {
        room.beds.forEach((bed, idx) => {
          if (bed.occupiedBy === studentName) {
            foundBed = { roomName: room.name, bedNumber: idx + 1 };
          }
        });
      });
      setActiveBed(foundBed);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Student raises a payment dispute (salary deduction not updated)
  const handleRaiseDispute = async (installmentIndex) => {
    if (!ledger) return;

    const updatedInstallments = [...(ledger.loanInstallments || [])];
    updatedInstallments[installmentIndex] = {
      ...updatedInstallments[installmentIndex],
      disputed: true
    };

    const updatedLedger = {
      ...ledger,
      loanInstallments: updatedInstallments
    };

    await updateFinancialLedger(updatedLedger);
    alert('Sanggahan pembayaran berhasil dikirim! LPK Admin akan melakukan verifikasi manual terhadap slip pemotongan gaji di Jepang.');
    await loadStudentData();
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--outline)' }}>
        Memuat data status...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', boxSizing: 'border-box', overflowY: 'auto', flex: 1, paddingBottom: '80px' }}>
      
      {/* Header & Simulator Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '18px', margin: 0 }}>
            {isWaliView ? '👨‍👩‍👧 Portal Wali / Orang Tua' : '🎒 Status Keberangkatan & Finansial'}
          </h2>
          <p style={{ fontSize: '11px', color: 'var(--outline)', margin: '2px 0 0 0' }}>
            {isWaliView ? 'Pantau perkembangan nilai & kas anak Anda' : 'Pantau cicilan dana talangan & pengurusan visa kerja.'}
          </p>
        </div>
        <button 
          onClick={() => setIsWaliView(!isWaliView)}
          className="btn btn-outline"
          style={{ height: '32px', padding: '0 12px', fontSize: '11px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <Users size={12} />
          {isWaliView ? 'Mode Siswa' : 'Mode Wali'}
        </button>
      </div>

      {/* Simulator Student Switcher (for local review) */}
      <div style={{ backgroundColor: 'var(--surface-container-low)', padding: '12px', borderRadius: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--on-surface-variant)' }}>Simulasi Siswa Aktif:</span>
        <select 
          value={studentName} 
          onChange={(e) => setStudentName(e.target.value)} 
          className="input-field"
          style={{ width: '130px', height: '30px', padding: '0 8px', fontSize: '12px' }}
        >
          <option value="Budi Utomo">Budi Utomo</option>
          <option value="Siti Rahma">Siti Rahma</option>
        </select>
      </div>

      {/* STUDENT VIEW */}
      {!isWaliView && (
        <div>
          {/* Active Bed Info */}
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plane size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--outline)' }}>ASRAMA AKTIF ANDA</div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>
                {activeBed ? `${activeBed.roomName} - Ranjang ${activeBed.bedNumber}` : 'Tidak Menghuni Asrama (Luar)'}
              </div>
            </div>
          </div>

          {/* Financial Ledger Section */}
          {ledger && (
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wallet size={16} color="var(--primary)" /> Pinjaman Dana Talangan Anda
              </h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-container-high)', paddingBottom: '8px', marginBottom: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--outline)' }}>SISA TAGIHAN</span>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--tertiary)' }}>
                    Rp {((ledger.totalCost || 0) - (ledger.paidAmount || 0)).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: 'var(--outline)' }}>TOTAL PINJAMAN</span>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    Rp {(ledger.totalCost || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Installment Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(ledger.loanInstallments || []).map((ins, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '10px 12px', 
                      borderRadius: '8px', 
                      backgroundColor: ins.status === 'Paid' ? '#f0fdf4' : ins.disputed ? '#fffbeb' : '#f8fafc',
                      border: '1px solid',
                      borderColor: ins.status === 'Paid' ? '#bbf7d0' : ins.disputed ? '#fde68a' : 'var(--surface-container-high)'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: '700' }}>Cicilan Bulan ke-{idx + 1}</span>
                      <div style={{ fontSize: '11px', color: 'var(--outline)' }}>Rp {ins.amount.toLocaleString('id-ID')}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {ins.status === 'Paid' ? (
                        <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle2 size={14} /> Lunas
                        </span>
                      ) : ins.disputed ? (
                        <span style={{ fontSize: '11px', color: '#b45309', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertCircle size={14} /> Memverifikasi slip...
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleRaiseDispute(idx)}
                          className="btn btn-primary"
                          style={{ height: '28px', padding: '0 10px', fontSize: '10px', borderRadius: '14px' }}
                        >
                          Ajukan Klaim Potong Gaji
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visa & Checklist Timeline */}
          {checklist && (
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--primary)" /> Linimasa Pengurusan Visa Kerja
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '2px solid var(--primary-container)', paddingLeft: '16px', marginLeft: '8px' }}>
                {/* 1. CoE */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: checklist.statuses.coe_issuance === 'completed' ? 'var(--primary)' : 'var(--outline-variant)' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Penerbitan Kelayakan Kerja (CoE)</span>
                  <div style={{ fontSize: '11px', color: 'var(--outline)' }}>
                    Status: {checklist.statuses.coe_issuance === 'completed' ? '✓ DITERBITKAN OLEH JEPANG' : 'Menunggu Berkas Kontrak'}
                  </div>
                </div>

                {/* 2. Visa */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: checklist.statuses.visa_application === 'completed' ? 'var(--primary)' : 'var(--outline-variant)' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Pengajuan Visa Kerja (Kedubes)</span>
                  <div style={{ fontSize: '11px', color: 'var(--outline)' }}>
                    Status: {checklist.statuses.visa_application === 'completed' ? '✓ VISA DITEMPEL DI PASPOR' : 'Menunggu Penerbitan CoE'}
                  </div>
                </div>

                {/* 3. Penerbangan */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-22px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: checklist.statuses.flight_departure === 'completed' ? 'var(--primary)' : 'var(--outline-variant)' }} />
                  <span style={{ fontSize: '12px', fontWeight: '700' }}>Pembelian Tiket & Penerbangan</span>
                  <div style={{ fontSize: '11px', color: 'var(--outline)' }}>
                    Status: {checklist.statuses.flight_departure === 'completed' ? '✓ FLIGHT SELESAI' : 'Menunggu Penerbitan Visa'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WALI VIEW (PARENT) */}
      {isWaliView && (
        <div>
          {/* Kehadiran & Nilai */}
          <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="var(--primary)" /> Laporan Akademik Anak Anda
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: '700' }}>KEHADIRAN BELAJAR</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--primary)', marginTop: '4px' }}>98%</div>
                <span style={{ fontSize: '9px', color: '#16a34a', fontWeight: '700' }}>Sangat Rajin</span>
              </div>
              <div style={{ backgroundColor: '#f0fdf4', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--outline)', fontWeight: '700' }}>NILAI JLPT PREP</span>
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a', marginTop: '4px' }}>85/100</div>
                <span style={{ fontSize: '9px', color: '#16a34a', fontWeight: '700' }}>Lulus Kualifikasi</span>
              </div>
            </div>
          </div>

          {/* Rincian Keuangan */}
          {ledger && (
            <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} color="var(--primary)" /> Transparansi Kasir LPK
              </h3>
              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--surface-container-high)' }}>
                    <td style={{ padding: '8px 0', color: 'var(--outline)' }}>Uang LPK Terbayar (Cash)</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>Rp {(ledger.paidAmount || 0).toLocaleString('id-ID')}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--surface-container-high)' }}>
                    <td style={{ padding: '8px 0', color: 'var(--outline)' }}>Sisa Cicilan Talangan (Gaji)</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700', color: 'var(--tertiary)' }}>Rp {((ledger.totalCost || 0) - (ledger.paidAmount || 0)).toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 0', color: 'var(--outline)' }}>Status Pembiayaan Anak</td>
                    <td style={{ padding: '8px 0', textAlign: 'right' }}>
                      <span className="badge badge-green">LANCAR & AMAN</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Visa Status for Wali */}
          {checklist && (
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Plane size={16} color="var(--primary)" /> Status Penerbangan & Visa Kerja Anak
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifySelf: 'center', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px' }}>Kelayakan Kerja (CoE)</span>
                  <span className="badge badge-green">✓ Selesai</span>
                </div>
                <div style={{ display: 'flex', justifySelf: 'center', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px' }}>Visa Kedutaan</span>
                  <span className="badge badge-orange">Sedang Diproses</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
