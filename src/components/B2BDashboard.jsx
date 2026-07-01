import React, { useState, useEffect } from 'react';
import { getLogs, getProgress, saveProgress } from '../utils/db';
import { ShieldCheck, Calendar, Clock, User, Award, QrCode } from 'lucide-react';

export default function B2BDashboard({ progress, onProgressUpdate }) {
  const [selectedLpk, setSelectedLpk] = useState('lpk_a'); // lpk_a (Karya Mulia), lpk_b (Prima Husada)
  const [logs, setLogs] = useState([]);
  const [viewAlumni, setViewAlumni] = useState(false);
  
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
    // Save to DB
    const updatedProgress = { ...progress, isPaidB2C: true };
    await saveProgress(updatedProgress);
    onProgressUpdate(updatedProgress);
    setIsPaidB2C(true);
    setPaywallModal(false);
    alert('Pembayaran QRIS Berhasil! Akun Anda kini aktif selamanya sebagai B2C Kamus Saku Jepang.');
  };

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
          <option value="lpk_a">LPK Karya Mulia (Budi, Siti)</option>
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
