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
  HelpCircle
} from "lucide-react";
import { callGas, getGasUrl, setGasUrl, isUsingMock } from "../lib/gasApi";
import { ConfigJam, HariLibur } from "../types";

export default function Settings() {
  const [gasUrl, setGasUrlState] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "testing" | null>(null);
  const [connectionMsg, setConnectionMsg] = useState<string | null>(null);

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

  // Load config & data
  const loadConfig = async () => {
    try {
      setLoading(true);
      const url = getGasUrl();
      setGasUrlState(url);
      
      if (url) {
        setConnectionStatus("testing");
        const testRes = await callGas("getPengaturanSemua");
        if (testRes && !testRes.error) {
          setConnectionStatus("connected");
          setConfigJam(testRes);
        } else {
          setConnectionStatus("disconnected");
          setConnectionMsg(testRes?.error || "Gagal menghubungi API Google Apps Script");
        }
      } else {
        setConnectionStatus(null);
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
      setConnectionStatus("disconnected");
      setConnectionMsg(e.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Save GAS URL setting
  const handleSaveUrl = async () => {
    try {
      setConnectionStatus("testing");
      setConnectionMsg(null);
      setGasUrl(gasUrl);
      
      if (!gasUrl.trim()) {
        setConnectionStatus(null);
        loadConfig();
        return;
      }

      // Test connection
      const testRes = await callGas("getPengaturanSemua");
      if (testRes && !testRes.error) {
        setConnectionStatus("connected");
        alert("Sukses! Koneksi ke Google Apps Script berhasil terjalin.");
        loadConfig();
      } else {
        setConnectionStatus("disconnected");
        setConnectionMsg(testRes?.error || "Koneksi gagal. Periksa kembali URL Web App GAS Anda.");
        alert("Gagal mengkoneksikan URL Apps Script.");
      }
    } catch (err: any) {
      setConnectionStatus("disconnected");
      setConnectionMsg(err.toString());
      alert("Error: " + err.toString());
    }
  };

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-xs text-gray-500">Kelola operasional sekolah, sinkronisasi Google Apps Script, hari libur, dan data kelas</p>
      </div>

      {/* SINKRONISASI API GOOGLE APPS SCRIPT */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-50 pb-3">
          <Link2 className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-gray-800 text-sm">Integrasi Google Apps Script (SaaS Gateway)</h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-600">Web App URL</label>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              connectionStatus === "connected" ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse" :
              connectionStatus === "disconnected" ? "bg-rose-50 text-rose-700 border border-rose-200" :
              connectionStatus === "testing" ? "bg-amber-50 text-amber-700 border border-amber-200" :
              "bg-gray-50 text-gray-500 border border-gray-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === "connected" ? "bg-emerald-500" :
                connectionStatus === "disconnected" ? "bg-rose-500" :
                connectionStatus === "testing" ? "bg-amber-500 animate-ping" :
                "bg-gray-400"
              }`}></span>
              {connectionStatus === "connected" ? "ONLINE • REAL-TIME DB" :
               connectionStatus === "disconnected" ? "KONEKSI ERROR" :
               connectionStatus === "testing" ? "MENGETES KONEKSI..." :
               "MODE SIMULASI OFFLINE"}
            </span>
          </div>

          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={gasUrl}
              onChange={(e) => setGasUrlState(e.target.value)}
              className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
            />
            <button 
              onClick={handleSaveUrl}
              className="bg-blue-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all duration-150 shadow-sm whitespace-nowrap"
            >
              Simpan & Tes
            </button>
          </div>

          {connectionStatus === "disconnected" && connectionMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-[11px] leading-relaxed">
              <strong>Error Log:</strong> {connectionMsg}
            </div>
          )}

          {isUsingMock() && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs space-y-2">
              <div className="flex gap-2 font-bold">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Panduan Deploiyment Google Apps Script:</span>
              </div>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed opacity-90">
                <li>Buka Editor Apps Script di Google Sheets Anda.</li>
                <li>Salin seluruh kode dari file <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">sias-gas-project/Main.gs</code> dan file pendukung lainnya.</li>
                <li>Klik tombol <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan baru (New deployment)</strong>.</li>
                <li>Pilih jenis penerapan: <strong>Aplikasi web (Web app)</strong>.</li>
                <li>Setel Jalankan sebagai: <strong>Saya (Admin)</strong>, dan Siapa yang memiliki akses: <strong>Siapa saja (Anyone)</strong>.</li>
                <li>Salin <strong>URL Aplikasi Web</strong> yang dihasilkan dan tempelkan di atas lalu klik Simpan.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

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
