/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, FormEvent } from "react";
import { 
  Settings as SettingsIcon, 
  Clock, 
  Calendar, 
  FolderLock, 
  Trash2, 
  Plus, 
  Edit2, 
  Save, 
  Database,
  CheckCircle,
  AlertTriangle,
  Link2,
  HelpCircle,
  CreditCard,
  Image as ImageIcon
} from "lucide-react";
import { callGas, getGasUrl } from "../lib/gasApi";
import { ConfigJam, HariLibur } from "../types";

export default function Settings() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("SIAS_SESSION");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const isGuru = currentUser?.role === "Guru";

  // Change Password Form
  const [passLama, setPassLama] = useState("");
  const [passBaru, setPassBaru] = useState("");
  const [passKonfirm, setPassKonfirm] = useState("");
  const [passStatus, setPassStatus] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  const handleUbahPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPassStatus(null);
    setPassError(null);

    if (passBaru !== passKonfirm) {
      setPassError("Konfirmasi password baru tidak cocok.");
      return;
    }

    if (!passBaru.trim()) {
      setPassError("Password baru tidak boleh kosong.");
      return;
    }

    try {
      setLoading(true);
      const res = await callGas("ubahPasswordUser", [currentUser.username, passLama, passBaru]);
      if (res && res.success) {
        setPassStatus("Password berhasil diperbarui!");
        setPassLama("");
        setPassBaru("");
        setPassKonfirm("");
      } else {
        setPassError(res?.message || "Gagal mengubah password.");
      }
    } catch (err: any) {
      setPassError("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Operational Hours
  const [configJam, setConfigJam] = useState<ConfigJam>({
    jam_masuk_mulai: "06:00",
    jam_masuk_batas: "07:15",
    jam_pulang_mulai: "15:30"
  });

  // Holidays
  const [liburList, setLiburList] = useState<HariLibur[]>([]);
  const [newLiburTgl, setNewLiburTgl] = useState("");
  const [newLiburKet, setNewLiburKet] = useState("");

  // Classes list
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [newKelasName, setNewKelasName] = useState("");
  const [editKelasLama, setEditKelasLama] = useState<string | null>(null);
  const [editKelasBaru, setEditKelasBaru] = useState("");

  const [loading, setLoading] = useState(false);

  // Card Settings
  const [cardConfig, setCardConfig] = useState({
    schoolName: localStorage.getItem('cardSchoolName') || 'SMP AL-HIKAM',
    schoolAddress: localStorage.getItem('cardSchoolAddress') || 'Sendang Mulyo, Kec. Sendang Agung, Kab. Lampung Tengah, Lampung',
    principalName: localStorage.getItem('cardPrincipalName') || 'Khoirul Malik, S.Kom.',
    signatureUrl: localStorage.getItem('cardSignatureUrl') || '',
    logoLeftUrl: localStorage.getItem('cardLogoLeftUrl') || 'https://khoirul2901.github.io/absensi-smp/src/LOGO SMP AL-HIKAM.png',
    logoRightUrl: localStorage.getItem('cardLogoRightUrl') || ''
  });

  const handleCardConfigChange = (e: any) => {
    const { name, value } = e.target;
    setCardConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCardConfig = (e: any) => {
    e.preventDefault();
    localStorage.setItem('cardSchoolName', cardConfig.schoolName);
    localStorage.setItem('cardSchoolAddress', cardConfig.schoolAddress);
    localStorage.setItem('cardPrincipalName', cardConfig.principalName);
    localStorage.setItem('cardSignatureUrl', cardConfig.signatureUrl);
    localStorage.setItem('cardLogoLeftUrl', cardConfig.logoLeftUrl);
    localStorage.setItem('cardLogoRightUrl', cardConfig.logoRightUrl);
    alert('Pengaturan kartu berhasil disimpan!');
  };

  // Load config & data
  const loadConfig = async () => {
    try {
      setLoading(true);
      const url = getGasUrl();
      
      if (url) {
        const testRes = await callGas("getPengaturanSemua");
        if (testRes && testRes.success !== false) {
          setConfigJam(testRes);
        }
      } else {
        // Load mock configs
        const mockCfg = await callGas("getPengaturanSemua");
        setConfigJam(mockCfg);
      }

      // Load holidays
      const liburRes = await callGas("getHariLiburSemua");
      if (Array.isArray(liburRes)) {
        setLiburList(liburRes);
      }

      // Load classes
      const kelasRes = await callGas("getKelasSemua");
      if (Array.isArray(kelasRes)) {
        setKelasList(kelasRes);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Save Hours Config
  const handleSaveHours = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await callGas("simpanKonfigurasiJam", [
        configJam.jam_masuk_mulai,
        configJam.jam_masuk_batas,
        configJam.jam_pulang_mulai
      ]);
      if (res && res.success) {
        alert(res.message);
      } else {
        alert(res?.message || "Gagal menyimpan jam operasional");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Add Holiday
  const handleAddHoliday = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLiburTgl || !newLiburKet.trim()) return;
    try {
      setLoading(true);
      const res = await callGas("tambahHariLibur", [newLiburTgl, newLiburKet]);
      if (res && res.success) {
        setNewLiburTgl("");
        setNewLiburKet("");
        // Reload holidays
        const liburRes = await callGas("getHariLiburSemua");
        if (Array.isArray(liburRes)) setLiburList(liburRes);
      } else {
        alert(res?.message || "Gagal menambah hari libur");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = async (tgl: string) => {
    if (!confirm(`Hapus libur pada tanggal ${tgl}?`)) return;
    try {
      setLoading(true);
      const res = await callGas("hapusHariLibur", [tgl]);
      if (res && res.success) {
        // Reload holidays
        const liburRes = await callGas("getHariLiburSemua");
        if (Array.isArray(liburRes)) setLiburList(liburRes);
      } else {
        alert(res?.message || "Gagal menghapus hari libur");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Add Class Name
  const handleAddClass = async (e: FormEvent) => {
    e.preventDefault();
    if (!newKelasName.trim()) return;
    try {
      setLoading(true);
      const res = await callGas("tambahKelas", [newKelasName.trim()]);
      if (res && res.success) {
        setNewKelasName("");
        const kRes = await callGas("getKelasSemua");
        if (Array.isArray(kRes)) setKelasList(kRes);
      } else {
        alert(res?.message || "Gagal menambah kelas");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Edit Class Name
  const handleEditClass = async (e: FormEvent) => {
    e.preventDefault();
    if (!editKelasLama || !editKelasBaru.trim()) return;
    try {
      setLoading(true);
      const res = await callGas("editKelas", [editKelasLama, editKelasBaru.trim()]);
      if (res && res.success) {
        setEditKelasLama(null);
        setEditKelasBaru("");
        const kRes = await callGas("getKelasSemua");
        if (Array.isArray(kRes)) setKelasList(kRes);
      } else {
        alert(res?.message || "Gagal memperbarui kelas");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Delete Class Name
  const handleDeleteClass = async (name: string) => {
    if (!confirm(`Hapus kelas "${name}"?`)) return;
    try {
      setLoading(true);
      const res = await callGas("hapusKelas", [name]);
      if (res && res.success) {
        const kRes = await callGas("getKelasSemua");
        if (Array.isArray(kRes)) setKelasList(kRes);
      } else {
        alert(res?.message || "Gagal menghapus kelas");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Database structure reset
  const handleRebuildDatabase = async () => {
    if (!confirm("⚠️ PERINGATAN KERAS! Aksi ini akan menghapus dan menyetel ulang seluruh tabel spreadsheet (users, data_siswa, data_guru, dsb) di Google Drive Anda. Lanjutkan?")) return;
    if (!confirm("Konfirmasi akhir: Apakah Anda benar-benar yakin ingin membuat ulang database? Semua data kehadiran yang ada akan terhapus.")) return;

    try {
      setLoading(true);
      const res = await callGas("buatStrukturDatabaseOtomatis");
      if (res && res.success) {
        alert("Sukses! Struktur database Google Spreadsheet Anda berhasil dibuat ulang.");
        loadConfig();
      } else {
        alert("Gagal: " + (res?.message || "Terjadi error"));
      }
    } catch (e: any) {
      alert("Error: " + e.toString());
    } finally {
      setLoading(false);
    }
  };

  if (isGuru) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-6">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Ubah Password Akun Anda</h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed font-semibold">
            Halo <span className="text-gray-900 font-bold">{currentUser?.username}</span>, silakan isi form di bawah ini untuk mengganti password login Anda. Username login Anda adalah nama Anda tanpa spasi dan huruf kecil: <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold">{currentUser?.username?.replace(/\s+/g, "").toLowerCase()}</span>.
          </p>

          <form onSubmit={handleUbahPassword} className="space-y-4">
            {passStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {passStatus}
              </div>
            )}
            {passError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {passError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Password Lama</label>
              <input 
                type="password"
                required
                value={passLama}
                onChange={(e) => setPassLama(e.target.value)}
                placeholder="Masukkan kata sandi lama"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Password Baru</label>
              <input 
                type="password"
                required
                value={passBaru}
                onChange={(e) => setPassBaru(e.target.value)}
                placeholder="Sandi baru"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Konfirmasi Password Baru</label>
              <input 
                type="password"
                required
                value={passKonfirm}
                onChange={(e) => setPassKonfirm(e.target.value)}
                placeholder="Ulangi sandi baru"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="bg-slate-900 text-white font-bold text-xs w-full py-2.5 rounded-xl hover:bg-slate-800 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {loading ? "Menyimpan..." : "Simpan Password Baru"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-xs text-gray-500">Kelola operasional sekolah, sinkronisasi Google Apps Script, hari libur, dan data kelas</p>
      </div>

      {/* SINKRONISASI API GOOGLE APPS SCRIPT DIHAPUS (HARDCODED DI KODE) */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* OPERATIONAL HOURS */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-gray-800 text-sm">Jam Operasional Sekolah</h3>
          </div>

          <form onSubmit={handleSaveHours} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Mulai Scan Masuk (Buka)</label>
              <input 
                type="time"
                value={configJam.jam_masuk_mulai}
                onChange={(e) => setConfigJam({ ...configJam, jam_masuk_mulai: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Batas Telat Masuk</label>
              <input 
                type="time"
                value={configJam.jam_masuk_batas}
                onChange={(e) => setConfigJam({ ...configJam, jam_masuk_batas: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Mulai Scan Pulang (Buka)</label>
              <input 
                type="time"
                value={configJam.jam_pulang_mulai}
                onChange={(e) => setConfigJam({ ...configJam, jam_pulang_mulai: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="bg-slate-900 text-white font-bold text-xs w-full py-2.5 rounded-xl hover:bg-slate-800 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan Jam
            </button>
          </form>
        </div>

        {/* CLASS NAMES MANAGER */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
            <FolderLock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-gray-800 text-sm">Data Kelas Sekolah</h3>
          </div>

          {/* Edit form */}
          {editKelasLama ? (
            <form onSubmit={handleEditClass} className="flex gap-2">
              <input 
                type="text"
                value={editKelasBaru}
                onChange={(e) => setEditKelasBaru(e.target.value)}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800"
                placeholder="Nama kelas baru..."
              />
              <button 
                type="submit"
                className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-700"
              >
                Ubah
              </button>
              <button 
                type="button"
                onClick={() => setEditKelasLama(null)}
                className="bg-gray-100 text-gray-500 font-semibold text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200"
              >
                Batal
              </button>
            </form>
          ) : (
            /* Add form */
            <form onSubmit={handleAddClass} className="flex gap-2">
              <input 
                type="text"
                value={newKelasName}
                onChange={(e) => setNewKelasName(e.target.value)}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800"
                placeholder="Tambah nama kelas baru (misal: XI RPL 1)..."
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* List display */}
          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[190px] overflow-y-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <tbody className="divide-y divide-gray-50">
                {kelasList.length === 0 ? (
                  <tr>
                    <td className="py-4 text-center text-gray-400 font-medium">Belum ada kelas terdaftar</td>
                  </tr>
                ) : (
                  kelasList.map((kls, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-gray-800">{kls}</td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => { setEditKelasLama(kls); setEditKelasBaru(kls); }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClass(kls)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

            {/* CARD SETTINGS MANAGER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
          <CreditCard className="w-5 h-5 text-fuchsia-500" />
          <h3 className="font-bold text-gray-800 text-sm">Pengaturan Desain Kartu</h3>
        </div>
        <form onSubmit={handleSaveCardConfig} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">Nama Sekolah</label>
            <input type="text" name="schoolName" value={cardConfig.schoolName} onChange={handleCardConfigChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">Alamat Sekolah</label>
            <input type="text" name="schoolAddress" value={cardConfig.schoolAddress} onChange={handleCardConfigChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">Nama Kepala Sekolah</label>
            <input type="text" name="principalName" value={cardConfig.principalName} onChange={handleCardConfigChange} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">URL Tanda Tangan (Opsional)</label>
            <input type="text" name="signatureUrl" value={cardConfig.signatureUrl} onChange={handleCardConfigChange} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">URL Logo Kiri (Opsional)</label>
            <input type="text" name="logoLeftUrl" value={cardConfig.logoLeftUrl} onChange={handleCardConfigChange} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500">URL Logo Kanan (Opsional)</label>
            <input type="text" name="logoRightUrl" value={cardConfig.logoRightUrl} onChange={handleCardConfigChange} placeholder="https://..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="sm:col-span-2 flex justify-end mt-2">
            <button type="submit" className="bg-fuchsia-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-fuchsia-700 transition-all duration-150 flex items-center gap-1.5 shadow-sm">
              <Save className="w-4 h-4" />
              Simpan Pengaturan Kartu
            </button>
          </div>
        </form>
      </div>

      {/* HOLIDAYS MANAGER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
          <Calendar className="w-5 h-5 text-emerald-500" />
          <h3 className="font-bold text-gray-800 text-sm">Hari Libur Sekolah</h3>
        </div>

        <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input 
            type="date"
            required
            value={newLiburTgl}
            onChange={(e) => setNewLiburTgl(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none"
          />
          <input 
            type="text"
            required
            placeholder="Keterangan libur (misal: Tahun Baru)..."
            value={newLiburKet}
            onChange={(e) => setNewLiburKet(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-gray-800 focus:outline-none"
          />
          <button 
            type="submit"
            className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah Hari Libur
          </button>
        </form>

        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-gray-700">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-2.5 px-4">Tanggal</th>
                <th className="py-2.5 px-4">Keterangan</th>
                <th className="py-2.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {liburList.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-gray-400 font-medium">Tidak ada hari libur terdaftar</td>
                </tr>
              ) : (
                liburList.map((lbl, idx) => {
                  const tglStr = typeof lbl.tanggal === "string" ? lbl.tanggal : new Date(lbl.tanggal).toISOString().split("T")[0];
                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-gray-500">{tglStr}</td>
                      <td className="py-2.5 px-4 font-semibold text-gray-900">{lbl.keterangan}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button 
                          onClick={() => handleDeleteHoliday(tglStr)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DATABASE REBUILD SYSTEM */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-rose-600" />
          <h3 className="font-extrabold text-rose-800 text-sm">Zona Bahaya (Sistem Database)</h3>
        </div>

        <p className="text-xs text-rose-700 leading-relaxed font-semibold">
          Jika struktur file Google Spreadsheet Anda rusak, terhapus, atau tidak sinkron dengan struktur SIAS yang baru, Anda dapat membangun kembali seluruh struktur sheet secara otomatis menggunakan tombol di bawah ini.
        </p>

        <div className="flex items-center justify-between gap-4 pt-2 border-t border-rose-200/50 flex-col sm:flex-row">
          <span className="text-[10px] text-rose-600 uppercase font-mono tracking-wider font-bold">
            ⚠️ TINDAKAN INI BERSIFAT PERMANEN & MERUSAK DATA SEBELUMNYA!
          </span>
          <button 
            onClick={handleRebuildDatabase}
            className="bg-rose-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-rose-700 transition-all duration-150 shadow-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <AlertTriangle className="w-4 h-4" />
            Inisialisasi Ulang Struktur Sheets
          </button>
        </div>
      </div>
    </div>
  );
}
