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
  Image as ImageIcon,
  Code,
  Copy,
  Check
} from "lucide-react";
import { callGas, getGasUrl, getStorageKey, setStorage, getStorage, extractArrayData } from "../lib/gasApi";
import { ConfigJam, HariLibur } from "../types";

export default function Settings() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isScriptCopied, setIsScriptCopied] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
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

  // Classes list & Teachers list
  const [kelasList, setKelasList] = useState<{ nama_kelas: string; wali_kelas: string }[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [newKelasName, setNewKelasName] = useState("");
  const [newWaliKelas, setNewWaliKelas] = useState("-");
  const [editKelasLama, setEditKelasLama] = useState<string | null>(null);
  const [editKelasBaru, setEditKelasBaru] = useState("");
  const [editWaliKelas, setEditWaliKelas] = useState("-");

  const [loading, setLoading] = useState(false);

  // Card Settings
  const [cardConfig, setCardConfig] = useState(() => ({
    schoolName: localStorage.getItem(getStorageKey('cardSchoolName')) || 'SMK AL-HIKAM KREJENGAN',
    schoolAddress: localStorage.getItem(getStorageKey('cardSchoolAddress')) || 'Krejengan Kec. Krejengan Kab. Probolinggo',
    principalName: localStorage.getItem(getStorageKey('cardPrincipalName')) || 'Fulan, S.Pd',
    signatureUrl: localStorage.getItem(getStorageKey('cardSignatureUrl')) || '',
    logoLeftUrl: localStorage.getItem(getStorageKey('cardLogoLeftUrl')) || '',
    logoRightUrl: localStorage.getItem(getStorageKey('cardLogoRightUrl')) || ''
  }));

  const handleCardConfigChange = (e: any) => {
    const { name, value } = e.target;
    setCardConfig(prev => ({ ...prev, [name]: value }));
  };

  const getRawGithubUrl = (url: string): string => {
    if (!url) return "";
    let cleanUrl = url.trim();
    if (cleanUrl.includes("github.com") && !cleanUrl.includes("raw.githubusercontent.com")) {
      cleanUrl = cleanUrl
        .replace("github.com", "raw.githubusercontent.com")
        .replace("/blob/", "/")
        .replace("/raw/", "/");
    }
    return cleanUrl;
  };

  const handleSaveCardConfig = async (e: any) => {
    e.preventDefault();
    const cleanSignature = getRawGithubUrl(cardConfig.signatureUrl);
    const cleanLogoLeft = getRawGithubUrl(cardConfig.logoLeftUrl);
    const cleanLogoRight = getRawGithubUrl(cardConfig.logoRightUrl);

    const updatedConfig = {
      cardSchoolName: cardConfig.schoolName,
      cardSchoolAddress: cardConfig.schoolAddress,
      cardPrincipalName: cardConfig.principalName,
      cardSignatureUrl: cleanSignature,
      cardLogoLeftUrl: cleanLogoLeft,
      cardLogoRightUrl: cleanLogoRight
    };

    setCardConfig(prev => ({
      ...prev,
      signatureUrl: cleanSignature,
      logoLeftUrl: cleanLogoLeft,
      logoRightUrl: cleanLogoRight
    }));

    // Save locally
    localStorage.setItem(getStorageKey('cardSchoolName'), cardConfig.schoolName);
    localStorage.setItem(getStorageKey('cardSchoolAddress'), cardConfig.schoolAddress);
    localStorage.setItem(getStorageKey('cardPrincipalName'), cardConfig.principalName);
    localStorage.setItem(getStorageKey('cardSignatureUrl'), cleanSignature);
    localStorage.setItem(getStorageKey('cardLogoLeftUrl'), cleanLogoLeft);
    localStorage.setItem(getStorageKey('cardLogoRightUrl'), cleanLogoRight);

    try {
      setLoading(true);
      const res = await callGas("simpanPengaturanCustom", [updatedConfig]);
      if (res && res.success !== false) {
        alert('Pengaturan kartu berhasil disimpan dan disinkronkan ke database cloud! Jika Anda memasukkan link GitHub, sistem telah mengonversinya secara otomatis ke direct link (raw.githubusercontent.com) agar gambar muncul.');
      } else {
        alert('Pengaturan kartu berhasil disimpan secara lokal, namun gagal disinkronkan ke cloud: ' + (res?.message || 'Error tidak diketahui'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Pengaturan kartu berhasil disimpan secara lokal, namun gagal disinkronkan ke cloud karena masalah jaringan/koneksi.');
    } finally {
      setLoading(false);
    }
  };

  // Load config & data
  const loadConfig = async () => {
    try {
      setLoading(true);
      const url = getGasUrl();
      
      let allConfig: any = null;
      const testRes = await callGas("getPengaturanSemua");
      if (testRes && testRes.success !== false) {
        const cfgObj = (testRes && typeof testRes.data === "object" && !Array.isArray(testRes.data)) ? testRes.data : testRes;
        setConfigJam({
          jam_masuk_mulai: cfgObj.jam_masuk_mulai || "06:00",
          jam_masuk_batas: cfgObj.jam_masuk_batas || "07:15",
          jam_pulang_mulai: cfgObj.jam_pulang_mulai || "15:30"
        });
        allConfig = cfgObj;
      }

      // Sync cloud config values to card settings state and localStorage if present
      if (allConfig) {
        const updatedCardConfig = {
          schoolName: allConfig.cardSchoolName || cardConfig.schoolName,
          schoolAddress: allConfig.cardSchoolAddress || cardConfig.schoolAddress,
          principalName: allConfig.cardPrincipalName || cardConfig.principalName,
          signatureUrl: allConfig.cardSignatureUrl || cardConfig.signatureUrl,
          logoLeftUrl: allConfig.cardLogoLeftUrl || cardConfig.logoLeftUrl,
          logoRightUrl: allConfig.cardLogoRightUrl || cardConfig.logoRightUrl
        };
        
        setCardConfig(updatedCardConfig);

        localStorage.setItem(getStorageKey('cardSchoolName'), updatedCardConfig.schoolName);
        localStorage.setItem(getStorageKey('cardSchoolAddress'), updatedCardConfig.schoolAddress);
        localStorage.setItem(getStorageKey('cardPrincipalName'), updatedCardConfig.principalName);
        localStorage.setItem(getStorageKey('cardSignatureUrl'), updatedCardConfig.signatureUrl);
        localStorage.setItem(getStorageKey('cardLogoLeftUrl'), updatedCardConfig.logoLeftUrl);
        localStorage.setItem(getStorageKey('cardLogoRightUrl'), updatedCardConfig.logoRightUrl);
      }

      // Load teachers for Wali Kelas dropdown
      let guruRes = await callGas("getDataMaster", ["Guru"]);
      let gList = extractArrayData(guruRes);
      if (!gList || gList.length === 0) {
        guruRes = await callGas("getDataGuru");
        gList = extractArrayData(guruRes);
      }
      if (!gList || gList.length === 0) {
        gList = getStorage("data_guru") || [];
      }
      const parsedGuru = gList.map((item: any) => ({
        id_guru: item.id_guru || item.id || "",
        nama_guru: item.nama_guru || item.nama || item.name || String(item)
      })).filter((g: any) => g.nama_guru);
      setGuruList(parsedGuru);

      // Load holidays
      const liburRes = await callGas("getHariLiburSemua");
      const libList = extractArrayData(liburRes);
      setLiburList(libList);

      // Load classes
      await fetchKelasList();
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchKelasList = async () => {
    try {
      const kelasRes = await callGas("getKelasSemua");
      const kList = extractArrayData(kelasRes);
      const storedKelas = getStorage("data_kelas") || [];

      const parsed = kList.map((item: any) => {
        let name = "";
        let wali = "-";
        if (typeof item === 'string') {
          name = item;
        } else {
          name = item.nama_kelas || item.kelas || String(item);
          wali = item.wali_kelas || item.wali || item.waliKelas || item.guru_wali || item["Wali Kelas"] || "-";
        }

        if ((!wali || wali === "-") && Array.isArray(storedKelas)) {
          const matchedLocal = storedKelas.find((sk: any) => (typeof sk === "string" ? sk : (sk.nama_kelas || sk.kelas)) === name);
          if (matchedLocal && typeof matchedLocal === "object" && matchedLocal.wali_kelas) {
            wali = matchedLocal.wali_kelas;
          }
        }

        return {
          nama_kelas: String(name).trim(),
          wali_kelas: String(wali).trim()
        };
      }).filter((item: any) => Boolean(item.nama_kelas));
      
      setKelasList(parsed);
      return parsed;
    } catch (err) {
      console.error("Gagal memuat kelas:", err);
      return [];
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
        const libList = Array.isArray(liburRes)
          ? liburRes
          : (liburRes?.data && Array.isArray(liburRes.data) ? liburRes.data : []);
        setLiburList(libList);
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
        const libList = Array.isArray(liburRes)
          ? liburRes
          : (liburRes?.data && Array.isArray(liburRes.data) ? liburRes.data : []);
        setLiburList(libList);
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
      const chosenWali = newWaliKelas && newWaliKelas.trim() ? newWaliKelas : "-";
      await callGas("tambahKelas", [newKelasName.trim(), chosenWali]);
      await callGas("simpanWaliKelas", [newKelasName.trim(), chosenWali]);

      let dataKelas = getStorage("data_kelas");
      if (!Array.isArray(dataKelas)) dataKelas = [];
      const idx = dataKelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === newKelasName.trim());
      if (idx !== -1) {
        dataKelas[idx] = { nama_kelas: newKelasName.trim(), wali_kelas: chosenWali };
      } else {
        dataKelas.push({ nama_kelas: newKelasName.trim(), wali_kelas: chosenWali });
      }
      setStorage("data_kelas", dataKelas);

      setNewKelasName("");
      setNewWaliKelas("-");
      await fetchKelasList();
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.toString());
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
      const chosenWali = editWaliKelas && editWaliKelas.trim() ? editWaliKelas : "-";
      await callGas("editKelas", [editKelasLama, editKelasBaru.trim(), chosenWali]);
      await callGas("simpanWaliKelas", [editKelasBaru.trim(), chosenWali]);

      let dataKelas = getStorage("data_kelas");
      if (!Array.isArray(dataKelas)) dataKelas = [];
      const idx = dataKelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === editKelasLama);
      if (idx !== -1) {
        dataKelas[idx] = { nama_kelas: editKelasBaru.trim(), wali_kelas: chosenWali };
      } else {
        dataKelas.push({ nama_kelas: editKelasBaru.trim(), wali_kelas: chosenWali });
      }
      setStorage("data_kelas", dataKelas);

      setEditKelasLama(null);
      setEditKelasBaru("");
      setEditWaliKelas("-");
      await fetchKelasList();
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Quick Wali Kelas update
  const handleQuickWaliKelasChange = async (namaKelas: string, waliKelasBaru: string) => {
    try {
      const chosenWali = waliKelasBaru || "-";
      
      // Update UI state immediately
      setKelasList(prev => prev.map(k => k.nama_kelas === namaKelas ? { ...k, wali_kelas: chosenWali } : k));

      // Update local storage
      let dataKelas = getStorage("data_kelas");
      if (!Array.isArray(dataKelas)) dataKelas = [];
      const idx = dataKelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      if (idx !== -1) {
        if (typeof dataKelas[idx] === "string") {
          dataKelas[idx] = { nama_kelas: namaKelas, wali_kelas: chosenWali };
        } else {
          dataKelas[idx].wali_kelas = chosenWali;
        }
      } else {
        dataKelas.push({ nama_kelas: namaKelas, wali_kelas: chosenWali });
      }
      setStorage("data_kelas", dataKelas);

      // Call GAS APIs
      await callGas("simpanWaliKelas", [namaKelas, chosenWali]);
      await callGas("editKelas", [namaKelas, namaKelas, chosenWali]);
    } catch (e: any) {
      console.error("Error updating wali kelas:", e);
    }
  };

  // Delete Class Name
  const handleDeleteClass = async (name: string) => {
    if (!confirm(`Hapus kelas "${name}"?`)) return;
    try {
      setLoading(true);
      const res = await callGas("hapusKelas", [name]);
      if (res && res.success) {
        await fetchKelasList();
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
            <form onSubmit={handleEditClass} className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text"
                value={editKelasBaru}
                onChange={(e) => setEditKelasBaru(e.target.value)}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800"
                placeholder="Nama kelas baru..."
              />
              <select
                value={editWaliKelas}
                onChange={(e) => setEditWaliKelas(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800"
              >
                <option value="-">-- Pilih Wali Kelas --</option>
                {guruList.map((g, i) => {
                  const name = g.nama_guru || g.nama || g.name || (typeof g === "string" ? g : "");
                  return (
                    <option key={i} value={name}>
                      {name}
                    </option>
                  );
                })}
              </select>
              <div className="flex gap-1 shrink-0">
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
              </div>
            </form>
          ) : (
            /* Add form */
            <form onSubmit={handleAddClass} className="flex flex-col sm:flex-row gap-2">
              <input 
                type="text"
                value={newKelasName}
                onChange={(e) => setNewKelasName(e.target.value)}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-800"
                placeholder="Tambah nama kelas baru (misal: XI RPL 1)..."
              />
              <select
                value={newWaliKelas}
                onChange={(e) => setNewWaliKelas(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-800"
              >
                <option value="-">-- Pilih Wali Kelas --</option>
                {guruList.map((g, i) => {
                  const name = g.nama_guru || g.nama || g.name || (typeof g === "string" ? g : "");
                  return (
                    <option key={i} value={name}>
                      {name}
                    </option>
                  );
                })}
              </select>
              <button 
                type="submit"
                className="bg-blue-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl hover:bg-blue-700 shrink-0 flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah</span>
              </button>
            </form>
          )}

          {/* List display */}
          <div className="border border-gray-100 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-4">Nama Kelas</th>
                  <th className="py-2 px-4">Wali Kelas</th>
                  <th className="py-2 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {kelasList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-400 font-medium">Belum ada kelas terdaftar</td>
                  </tr>
                ) : (
                  kelasList.map((kls, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-gray-800">{kls.nama_kelas}</td>
                      <td className="py-2.5 px-4 font-semibold text-indigo-700">
                        {kls.wali_kelas && kls.wali_kelas !== "-" ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {kls.wali_kelas}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal italic">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => { setEditKelasLama(kls.nama_kelas); setEditKelasBaru(kls.nama_kelas); setEditWaliKelas(kls.wali_kelas || "-"); }}
                            className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Edit Kelas & Wali Kelas"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteClass(kls.nama_kelas)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Hapus Kelas"
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

        {/* Info Tip GitHub URL */}
        <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Link2 className="w-4 h-4 shrink-0" />
            Tips Memasukkan Logo dari GitHub:
          </p>
          <p className="font-medium text-[11px] leading-relaxed">
            Link GitHub standar (seperti <code className="bg-blue-100/80 px-1 py-0.5 rounded text-blue-900 font-mono">github.com/.../blob/main/logo.png</code>) adalah halaman viewer web dan <strong>tidak bisa langsung dibaca</strong> sebagai elemen gambar oleh browser. 
            <strong>Kabar baik:</strong> Masukkan saja link GitHub tersebut seperti biasa, sistem kami akan <strong>secara otomatis mendeteksi dan mengonversinya</strong> ke direct link (raw) saat disimpan agar logo langsung muncul sempurna!
          </p>
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
                  const tglStr = typeof lbl.tanggal === "string" ? lbl.tanggal : (lbl.tanggal && !isNaN(new Date(lbl.tanggal).getTime()) ? new Date(lbl.tanggal).toISOString().split("T")[0] : String(lbl.tanggal || "-"));
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

      {/* GOOGLE APPS SCRIPT KODE.GS CODE & INSTRUCTION */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-sm border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-sm">Kode Backend Google Apps Script Terbaru v3.0 (Kode.gs)</h3>
          </div>
          <button
            onClick={() => {
              const codeText = `/**
 * ==============================================================================
 * GOOGLE APPS SCRIPT BACKEND (Kode.gs) - VERSION 3.0 (FULL SYNC)
 * SISTEM INFORMASI PRESENSI & JADWAL PELAJARAN SEKOLAH (SIAS)
 * ==============================================================================
 */

function doGet(e) {
  return responseJSON({
    status: "ok",
    message: "Google Apps Script Backend SIAS v3.0 Berjalan Aktif",
    timestamp: new Date().toISOString()
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ success: false, message: "Request body kosong." });
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const args = data.args || [];

    initSheets();

    let result = { success: false, message: "Action '" + action + "' tidak dikenal." };

    switch (action) {
      case "getDataMaster": result = getDataMaster(args[0]); break;
      case "tambahDataMaster": result = tambahDataMaster(args[0], args[1]); break;
      case "editDataMaster": result = editDataMaster(args[0], args[1], args[2]); break;
      case "hapusDataMaster": result = hapusDataMaster(args[0], args[1]); break;
      case "importDataMassal": result = importDataMassal(args[0], args[1]); break;
      case "getSiswa": result = getDataMaster("Siswa"); break;
      case "getGuru": result = getDataMaster("Guru"); break;

      case "prosesScanQR": result = prosesScanQR(args[0], args[1], args[2], args[3]); break;
      case "simpanAbsenManual": result = simpanAbsenManual(args[0], args[1], args[2], args[3], args[4], args[5], args[6]); break;
      case "simpanBulkAbsenManual": result = simpanBulkAbsenManual(args[0], args[1], args[2], args[3], args[4], args[5]); break;
      case "simpanKoreksiManual":
      case "editKehadiran":
      case "editKehadiranFull": result = editKehadiran(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7]); break;
      case "editKehadiranBulk": result = editKehadiranBulk(args[0], args[1], args[2]); break;
      case "hapusKehadiran":
      case "hapusLogKehadiran":
      case "hapusAbsensi":
      case "hapusAbsen":
      case "deleteKehadiran": result = hapusKehadiran(args[0], args[1], args[2]); break;
      case "getLiveAbsenHariIni": result = getLiveAbsenHariIni(args[0], args[1], args[2]); break;

      case "getLaporanPresensi":
      case "getLaporanFilter": result = getLaporanFilter(args[0], args[1], args[2], args[3], args[4], args[5]); break;
      case "hitungRekapPersentase": result = hitungRekapPersentase(args[0], args[1], args[2], args[3], args[4], args[5]); break;
      case "getDashboardMetrics": result = getDashboardMetrics(); break;

      case "getJamPelajaran": result = getJamPelajaran(); break;
      case "simpanJamPelajaran":
      case "tambahJamPelajaran":
      case "editJamPelajaran": result = simpanJamPelajaran(args[0], args[1]); break;
      case "hapusJamPelajaran": result = hapusRowByColumn("JamPelajaran", ["id_jam"], args[0]); break;

      case "getJadwalPelajaranSemua": result = getSheetDataObj("JadwalPelajaran"); break;
      case "tambahJadwalPelajaran":
      case "editJadwalPelajaran":
      case "simpanJadwalPelajaran": result = simpanJadwalPelajaran(args[0], args[1]); break;
      case "hapusJadwalPelajaran": result = hapusRowByColumn("JadwalPelajaran", ["id_jadwal"], args[0]); break;

      case "getAbsensiMengajarGuru": result = getSheetDataObj("AbsensiMengajar"); break;
      case "simpanAbsensiMengajarGuru":
      case "tambahAbsensiMengajarGuru": result = simpanAbsensiMengajarGuru(args[0]); break;
      case "hapusAbsensiMengajarGuru": result = hapusRowByColumn("AbsensiMengajar", ["id_log_mengajar"], args[0]); break;

      case "getJadwalGuruSemua": result = getSheetDataObj("JadwalGuru"); break;
      case "tambahJadwalGuru":
      case "editJadwalGuru": result = simpanJadwalGuru(args[0], args[1]); break;
      case "hapusJadwalGuru": result = hapusRowByColumn("JadwalGuru", ["id_jadwal"], args[0]); break;

      case "getKelasSemua": result = getKelasSemua(); break;
      case "tambahKelas": result = simpanKelas(args[0]); break;
      case "editKelas": result = editKelas(args[0], args[1]); break;
      case "hapusKelas": result = hapusRowByColumn("Kelas", ["nama_kelas", "id_kelas"], args[0]); break;

      case "getHariLiburSemua": result = getSheetDataObj("HariLibur"); break;
      case "tambahHariLibur":
      case "simpanHariLibur": result = simpanHariLibur(args[0], args[1]); break;
      case "hapusHariLibur": result = hapusRowByColumn("HariLibur", ["tanggal"], args[0]); break;

      case "getPengaturanSemua":
      case "getKonfigurasiJam": result = getPengaturan(); break;
      case "simpanKonfigurasiJam":
      case "simpanPengaturan": result = simpanPengaturan(args[0], args[1], args[2]); break;
      case "simpanPengaturanCustom": result = simpanPengaturanCustom(args[0]); break;

      case "verifikasiLogin": result = verifikasiLogin(args[0], args[1]); break;
      case "ubahPasswordUser": result = ubahPasswordUser(args[0], args[1], args[2]); break;
      case "getUsersSemua":
      case "getUsers": result = getSheetDataObj("Users"); break;
      case "tambahUserData": result = simpanUser(args[0], null); break;
      case "editUserData": result = simpanUser(args[1], args[0]); break;
      case "hapusUserData": result = hapusRowByColumn("Users", ["username"], args[0]); break;

      default: result = { success: false, message: "Action '" + action + "' tidak dikenali di Kode.gs." };
    }

    return responseJSON(result);
  } catch (err) {
    return responseJSON({ success: false, message: "Exception Error: " + err.toString() });
  }
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet() { return SpreadsheetApp.getActiveSpreadsheet(); }

function findSheetByName(possibleNames) {
  const ss = getSpreadsheet();
  if (typeof possibleNames === "string") possibleNames = [possibleNames];
  for (let i = 0; i < possibleNames.length; i++) {
    const sheet = ss.getSheetByName(possibleNames[i]);
    if (sheet) return sheet;
  }
  return null;
}

function getOrCreateSheet(primaryName, headers, aliases) {
  let sheet = findSheetByName([primaryName].concat(aliases || []));
  if (!sheet) {
    sheet = getSpreadsheet().insertSheet(primaryName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f4f6");
  }
  return sheet;
}

function initSheets() {
  getOrCreateSheet("Siswa", ["id_siswa", "nisn", "nama_siswa", "jenis_kelamin", "kelas", "jurusan", "no_hp_ortu", "qr_content"], ["DataSiswa", "Data_Siswa"]);
  getOrCreateSheet("Guru", ["id_guru", "nip_nuptk", "nama_guru", "jenis_kelamin", "jabatan_tugas", "no_hp", "qr_content", "password"], ["DataGuru", "Data_Guru"]);
  getOrCreateSheet("PresensiSiswa", ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"], ["LaporanSiswa"]);
  getOrCreateSheet("PresensiGuru", ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"], ["LaporanGuru"]);
  getOrCreateSheet("JamPelajaran", ["id_jam", "jam_ke", "nama_jam", "jam_mulai", "jam_selesai", "tipe"]);
  getOrCreateSheet("JadwalPelajaran", ["id_jadwal", "hari", "kelas", "jam_ke", "id_jam", "jam_mulai", "jam_selesai", "mapel", "id_guru", "nama_guru", "ruangan"]);
  getOrCreateSheet("AbsensiMengajar", ["id_log_mengajar", "tanggal", "waktu_absen", "hari", "id_guru", "nama_guru", "kelas", "mapel", "jam_ke", "jam_mulai_jadwal", "jam_selesai_jadwal", "status", "catatan_materi"]);
  getOrCreateSheet("JadwalGuru", ["id_jadwal", "id_guru", "nama_guru", "hari", "jam_masuk_mulai", "jam_masuk_batas", "jam_pulang_mulai"]);
  getOrCreateSheet("Kelas", ["id_kelas", "nama_kelas", "wali_kelas"]);
  getOrCreateSheet("HariLibur", ["tanggal", "keterangan"]);
  getOrCreateSheet("Pengaturan", ["key", "value"]);
  getOrCreateSheet("Users", ["username", "password", "role", "target_id"]);
}

function formatJamHM(val) {
  if (!val || val === "-") return "-";
  if (val instanceof Date) {
    try {
      return Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "HH:mm");
    } catch (e) {}
  }
  const str = String(val).trim();
  if (!str) return "-";
  if (str.indexOf("T") !== -1 || str.indexOf("1899") !== -1 || str.indexOf("1900") !== -1) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return Utilities.formatDate(d, Session.getScriptTimeZone() || "GMT+7", "HH:mm");
      }
    } catch (e) {}
  }
  if (/^\d{1,2}:\d{2}/.test(str)) {
    return str.substring(0, 5);
  }
  return str;
}

function formatTanggalYMD(val) {
  if (!val || val === "-") return "";
  const tz = Session.getScriptTimeZone() || "GMT+7";
  const todayStr = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");

  if (val instanceof Date) {
    try {
      if (val.getFullYear() <= 1900) {
        return todayStr;
      }
      return Utilities.formatDate(val, tz, "yyyy-MM-dd");
    } catch (e) {
      return todayStr;
    }
  }

  const str = String(val).trim();
  if (!str) return "";

  if (str.indexOf("1899") !== -1 || str.indexOf("1900") !== -1) {
    return todayStr;
  }

  if (str.indexOf("T") !== -1) {
    const parts = str.split("T");
    if (parts[0].indexOf("1899") !== -1 || parts[0].indexOf("1900") !== -1) {
      return todayStr;
    }
    return parts[0];
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    if (str.startsWith("1899") || str.startsWith("1900")) {
      return todayStr;
    }
    return str.substring(0, 10);
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() <= 1900) {
        return todayStr;
      }
      return Utilities.formatDate(d, tz, "yyyy-MM-dd");
    }
  } catch (e) {}

  return str;
}

function getSheetDataObj(sheetPrimaryName, aliases) {
  const sheet = findSheetByName([sheetPrimaryName].concat(aliases || []));
  if (!sheet) return { success: true, data: [] };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, data: [] };
  const rawHeaders = data[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    let row = {};
    let empty = true;
    for (let j = 0; j < rawHeaders.length; j++) {
      let val = data[i][j];
      if (val !== "" && val !== null && val !== undefined) empty = false;
      const key = rawHeaders[j];
      if (key) {
        const keyLower = key.toLowerCase();
        if (keyLower === "tanggal" || keyLower.indexOf("tanggal") !== -1) {
          row[key] = formatTanggalYMD(val);
        } else if (keyLower.indexOf("jam") !== -1 || keyLower.indexOf("waktu") !== -1) {
          row[key] = formatJamHM(val);
        } else if (val instanceof Date) {
          if (val.getFullYear() <= 1900) {
            row[key] = formatJamHM(val);
          } else {
            row[key] = Utilities.formatDate(val, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd HH:mm:ss");
          }
        } else if (typeof val === "string" && (val.indexOf("1899") !== -1 || val.indexOf("1900") !== -1)) {
          if (keyLower.indexOf("jam") !== -1 || keyLower.indexOf("waktu") !== -1) {
            row[key] = formatJamHM(val);
          } else {
            row[key] = formatTanggalYMD(val);
          }
        } else {
          row[key] = val;
        }
      }
    }
    if (!empty) rows.push(row);
  }
  return { success: true, data: rows };
}

function getDataMaster(kategori) {
  const isSiswa = kategori === "Siswa";
  const primarySheet = isSiswa ? "Siswa" : "Guru";
  const aliases = isSiswa ? ["DataSiswa", "Data_Siswa"] : ["DataGuru", "Data_Guru"];
  const res = getSheetDataObj(primarySheet, aliases);

  if (!res.data) return { success: true, data: [] };

  const idKey = isSiswa ? "id_siswa" : "id_guru";
  const nameKey = isSiswa ? "nama_siswa" : "nama_guru";
  const idNumKey = isSiswa ? "nisn" : "nip_nuptk";

  const normalized = res.data.map((item, idx) => {
    const idVal = item[idKey] || item.id || (isSiswa ? "S-" + (1000 + idx) : "G-" + (1000 + idx));
    const nameVal = item[nameKey] || item.nama || item.nama_lengkap || "-";
    const idNumVal = item[idNumKey] || item.nis || item.nip || item.nuptk || "-";
    const qrVal = item.qr_content || (idVal + "_" + idNumVal + "_" + String(nameVal).replace(/\\s+/g, '-'));

    if (isSiswa) {
      return {
        id_siswa: String(idVal),
        nisn: String(idNumVal),
        nama_siswa: String(nameVal),
        jenis_kelamin: String(item.jenis_kelamin || item.jk || "L"),
        kelas: String(item.kelas || "-"),
        jurusan: String(item.jurusan || "-"),
        no_hp_ortu: String(item.no_hp_ortu || item.hp_ortu || item.no_hp || "-"),
        qr_content: String(qrVal)
      };
    } else {
      return {
        id_guru: String(idVal),
        nip_nuptk: String(idNumVal),
        nama_guru: String(nameVal),
        jenis_kelamin: String(item.jenis_kelamin || item.jk || "L"),
        jabatan_tugas: String(item.jabatan_tugas || item.jabatan || item.mapel || "Guru"),
        no_hp: String(item.no_hp || item.hp || "-"),
        qr_content: String(qrVal),
        password: String(item.password || "guru123")
      };
    }
  });

  return { success: true, data: normalized };
}

function tambahDataMaster(kategori, dataObj) {
  if (!dataObj) return { success: false, message: "Data tidak valid." };
  const isSiswa = kategori === "Siswa";
  const sheet = getOrCreateSheet(isSiswa ? "Siswa" : "Guru", isSiswa ?
    ["id_siswa", "nisn", "nama_siswa", "jenis_kelamin", "kelas", "jurusan", "no_hp_ortu", "qr_content"] :
    ["id_guru", "nip_nuptk", "nama_guru", "jenis_kelamin", "jabatan_tugas", "no_hp", "qr_content", "password"]
  );

  const prefix = isSiswa ? "S-" : "G-";
  const newId = prefix + Date.now();
  const qrContent = "QR-" + newId;

  if (isSiswa) {
    sheet.appendRow([newId, dataObj.nisn || "-", dataObj.nama_siswa || "-", dataObj.jenis_kelamin || "L", dataObj.kelas || "-", dataObj.jurusan || "-", dataObj.no_hp_ortu || "-", qrContent]);
  } else {
    sheet.appendRow([newId, dataObj.nip_nuptk || "-", dataObj.nama_guru || "-", dataObj.jenis_kelamin || "L", dataObj.jabatan_tugas || "-", dataObj.no_hp || "-", qrContent, dataObj.password || "guru123"]);
  }
  return { success: true, message: "Berhasil menambah " + kategori + " baru!" };
}

function editDataMaster(kategori, idTarget, dataObj) {
  const isSiswa = kategori === "Siswa";
  const primarySheet = isSiswa ? "Siswa" : "Guru";
  const sheet = findSheetByName([primarySheet, isSiswa ? "DataSiswa" : "DataGuru"]);
  if (!sheet) return { success: false, message: "Sheet tidak ditemukan." };

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: false, message: "Data kosong." };
  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id"]);
  if (idColIdx === -1) return { success: false, message: "Kolom ID tidak ditemukan." };

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIdx]) === String(idTarget)) {
      if (isSiswa) {
        setRowValueByHeader(sheet, i + 1, headers, "nisn", dataObj.nisn);
        setRowValueByHeader(sheet, i + 1, headers, "nama_siswa", dataObj.nama_siswa);
        setRowValueByHeader(sheet, i + 1, headers, "jenis_kelamin", dataObj.jenis_kelamin);
        setRowValueByHeader(sheet, i + 1, headers, "kelas", dataObj.kelas);
        setRowValueByHeader(sheet, i + 1, headers, "jurusan", dataObj.jurusan);
        setRowValueByHeader(sheet, i + 1, headers, "no_hp_ortu", dataObj.no_hp_ortu);
      } else {
        setRowValueByHeader(sheet, i + 1, headers, "nip_nuptk", dataObj.nip_nuptk);
        setRowValueByHeader(sheet, i + 1, headers, "nama_guru", dataObj.nama_guru);
        setRowValueByHeader(sheet, i + 1, headers, "jenis_kelamin", dataObj.jenis_kelamin);
        setRowValueByHeader(sheet, i + 1, headers, "jabatan_tugas", dataObj.jabatan_tugas);
        setRowValueByHeader(sheet, i + 1, headers, "no_hp", dataObj.no_hp);
        if (dataObj.password) setRowValueByHeader(sheet, i + 1, headers, "password", dataObj.password);
      }
      return { success: true, message: "Data " + kategori + " berhasil diperbarui!" };
    }
  }
  return { success: false, message: "ID target tidak ditemukan." };
}

function hapusDataMaster(kategori, idTarget) {
  const isSiswa = kategori === "Siswa";
  return hapusRowByColumn(isSiswa ? "Siswa" : "Guru", [isSiswa ? "id_siswa" : "id_guru", "id"], idTarget);
}

function importDataMassal(kategori, arrayData) {
  if (!arrayData || !arrayData.length) return { success: false, message: "Tidak ada data." };
  let count = 0;
  arrayData.forEach(item => { tambahDataMaster(kategori, item); count++; });
  return { success: true, message: "Berhasil mengimpor " + count + " data " + kategori + "!" };
}

function prosesScanQR(qrContent, kategori, mode, tanggal) {
  const masterRes = getDataMaster(kategori);
  if (!masterRes.data || !masterRes.data.length) return { success: false, message: "Data master kosong." };
  const user = masterRes.data.find(x => x.qr_content === qrContent || x.id_siswa === qrContent || x.id_guru === qrContent);
  if (!user) return { success: false, message: "QR Code tidak valid atau belum terdaftar!" };

  const tgl = tanggal || new Date().toISOString().split("T")[0];
  const jamNow = new Date().toTimeString().slice(0, 5);
  const isSiswa = kategori === "Siswa";
  const idTarget = isSiswa ? user.id_siswa : user.id_guru;
  const namaTarget = isSiswa ? user.nama_siswa : user.nama_guru;
  const classKey = isSiswa ? (user.kelas + " " + user.jurusan).trim() : "-";
  const cfg = getPengaturan().data || { jam_masuk_mulai: "06:00", jam_masuk_batas: "07:15", jam_pulang_mulai: "15:30" };
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const sheet = getOrCreateSheet(sheetName, isSiswa ?
    ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"] :
    ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]
  );

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id_target"]);
  const tglColIdx = findHeaderIndex(headers, ["tanggal"]);

  let foundRowIdx = -1;
  let existingRowData = null;
  if (idColIdx !== -1 && tglColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][tglColIdx]).split("T")[0] === tgl && String(data[i][idColIdx]) === String(idTarget)) {
        foundRowIdx = i + 1;
        existingRowData = data[i];
        break;
      }
    }
  }

  if (mode === "Masuk") {
    if (foundRowIdx > 0 && existingRowData) {
      const jamMskIdx = findHeaderIndex(headers, ["jam_masuk"]);
      if (jamMskIdx !== -1 && existingRowData[jamMskIdx] !== "-" && existingRowData[jamMskIdx] !== "") {
        return { success: false, message: namaTarget + " sudah scan masuk hari ini!" };
      }
    }
    if (jamNow < (cfg.jam_masuk_mulai || "06:00")) return { success: false, message: "Absen masuk belum dibuka." };
    const statusMasuk = (jamNow <= (cfg.jam_masuk_batas || "07:15")) ? "Tepat Waktu" : "Terlambat";
    const logId = (isSiswa ? "LOG-S-" : "LOG-G-") + Date.now();

    if (foundRowIdx > 0) {
      setRowValueByHeader(sheet, foundRowIdx, headers, "jam_masuk", jamNow);
      setRowValueByHeader(sheet, foundRowIdx, headers, "status_masuk", statusMasuk);
    } else {
      if (isSiswa) sheet.appendRow([logId, tgl, idTarget, namaTarget, classKey, jamNow, statusMasuk, "-", "-", "-"]);
      else sheet.appendRow([logId, tgl, idTarget, namaTarget, jamNow, statusMasuk, "-", "-", "-"]);
    }
    return { success: true, message: "Absen Masuk Berhasil!\nNama: " + namaTarget + "\nStatus: " + statusMasuk + "\nJam: " + jamNow };
  } else {
    if (jamNow < (cfg.jam_pulang_mulai || "15:30")) return { success: false, message: "Absen pulang belum dibuka." };
    if (foundRowIdx > 0) {
      setRowValueByHeader(sheet, foundRowIdx, headers, "jam_pulang", jamNow);
      setRowValueByHeader(sheet, foundRowIdx, headers, "status_pulang", "Tepat Waktu");
      return { success: true, message: "Absen Pulang Berhasil!\nNama: " + namaTarget + "\nJam: " + jamNow };
    } else {
      const logId = (isSiswa ? "LOG-S-" : "LOG-G-") + Date.now();
      if (isSiswa) sheet.appendRow([logId, tgl, idTarget, namaTarget, classKey, "-", "Lupa Scan Masuk", jamNow, "Tepat Waktu", "-"]);
      else sheet.appendRow([logId, tgl, idTarget, namaTarget, "-", "Lupa Scan Masuk", jamNow, "Tepat Waktu", "-"]);
      return { success: true, message: "Absen Pulang Berhasil!\nCatatan: Lupa scan masuk.\nNama: " + namaTarget };
    }
  }
}

function simpanAbsenManual(idTarget, kategori, mode, tanggal, status, keterangan, jamCustom) {
  const isSiswa = kategori === "Siswa";
  const tgl = tanggal || new Date().toISOString().split("T")[0];
  const isAbsentStatus = status === "Sakit" || status === "Izin" || status === "Alfa" || status === "Alpha";
  const jamDefault = mode === "Masuk" ? "07:00" : "15:30";
  const jam = isAbsentStatus ? "-" : (jamCustom && jamCustom !== "-" ? jamCustom : jamDefault);
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const sheet = getOrCreateSheet(sheetName, isSiswa ?
    ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"] :
    ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]
  );

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id_target"]);
  const tglColIdx = findHeaderIndex(headers, ["tanggal"]);

  let foundRowIdx = -1;
  if (idColIdx !== -1 && tglColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][tglColIdx]).split("T")[0] === tgl && String(data[i][idColIdx]) === String(idTarget)) {
        foundRowIdx = i + 1;
        break;
      }
    }
  }

  if (foundRowIdx > 0) {
    if (isAbsentStatus) {
      setRowValueByHeader(sheet, foundRowIdx, headers, "status_masuk", status);
      setRowValueByHeader(sheet, foundRowIdx, headers, "status_pulang", status);
      setRowValueByHeader(sheet, foundRowIdx, headers, "jam_masuk", "-");
      setRowValueByHeader(sheet, foundRowIdx, headers, "jam_pulang", "-");
    } else {
      if (mode === "Masuk") {
        setRowValueByHeader(sheet, foundRowIdx, headers, "jam_masuk", jam);
        setRowValueByHeader(sheet, foundRowIdx, headers, "status_masuk", status);
      } else {
        setRowValueByHeader(sheet, foundRowIdx, headers, "jam_pulang", jam);
        setRowValueByHeader(sheet, foundRowIdx, headers, "status_pulang", status);
      }
    }
    setRowValueByHeader(sheet, foundRowIdx, headers, "ket", keterangan || "-");
  } else {
    const masterRes = getDataMaster(kategori);
    const user = (masterRes.data || []).find(x => x.id_siswa === idTarget || x.id_guru === idTarget);
    const namaTarget = user ? (isSiswa ? user.nama_siswa : user.nama_guru) : "Target";
    const classKey = user && isSiswa ? (user.kelas + " " + user.jurusan).trim() : "-";
    const logId = "LOG-" + Date.now();

    const statusMasuk = isAbsentStatus ? status : (mode === "Masuk" ? status : "-");
    const statusPulang = isAbsentStatus ? status : (mode === "Pulang" ? status : "-");
    const jamMasuk = isAbsentStatus ? "-" : (mode === "Masuk" ? jam : "-");
    const jamPulang = isAbsentStatus ? "-" : (mode === "Pulang" ? jam : "-");

    if (isSiswa) sheet.appendRow([logId, tgl, idTarget, namaTarget, classKey, jamMasuk, statusMasuk, jamPulang, statusPulang, keterangan || "-"]);
    else sheet.appendRow([logId, tgl, idTarget, namaTarget, jamMasuk, statusMasuk, jamPulang, statusPulang, keterangan || "-"]);
  }
  return { success: true, message: "Koreksi manual berhasil disimpan!" };
}

function simpanBulkAbsenManual(ids, kategori, mode, tanggal, status, keterangan) {
  if (!ids || !ids.length) return { success: false, message: "Pilih minimal 1 data." };
  let count = 0;
  ids.forEach(idTarget => { simpanAbsenManual(idTarget, kategori, mode, tanggal, status, keterangan, "-"); count++; });
  return { success: true, message: "Berhasil memperbarui " + count + " data presensi!" };
}

function editKehadiran(idTarget, kategori, tanggal, arg3, arg4, arg5, arg6, arg7) {
  const dataObj = typeof arg3 === "object" && arg3 !== null ? arg3 : { jam_masuk: arg3 || "-", status_masuk: arg4 || "-", jam_pulang: arg5 || "-", status_pulang: arg6 || "-", ket: arg7 || "-" };
  const isSiswa = kategori === "Siswa";
  const tgl = tanggal || new Date().toISOString().split("T")[0];
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const sheet = getOrCreateSheet(sheetName, isSiswa ?
    ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"] :
    ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]
  );

  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id_target"]);
  const tglColIdx = findHeaderIndex(headers, ["tanggal"]);

  let foundRowIdx = -1;
  if (idColIdx !== -1 && tglColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][tglColIdx]).split("T")[0] === tgl && String(data[i][idColIdx]) === String(idTarget)) {
        foundRowIdx = i + 1;
        break;
      }
    }
  }

  const isAllEmpty = (!dataObj.jam_masuk || dataObj.jam_masuk === "-") && (!dataObj.status_masuk || dataObj.status_masuk === "-") && (!dataObj.jam_pulang || dataObj.jam_pulang === "-") && (!dataObj.status_pulang || dataObj.status_pulang === "-") && (!dataObj.ket || dataObj.ket === "-");

  if (foundRowIdx > 0) {
    if (isAllEmpty) sheet.deleteRow(foundRowIdx);
    else {
      if (dataObj.jam_masuk !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "jam_masuk", dataObj.jam_masuk);
      if (dataObj.status_masuk !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "status_masuk", dataObj.status_masuk);
      if (dataObj.jam_pulang !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "jam_pulang", dataObj.jam_pulang);
      if (dataObj.status_pulang !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "status_pulang", dataObj.status_pulang);
      if (dataObj.ket !== undefined) setRowValueByHeader(sheet, foundRowIdx, headers, "ket", dataObj.ket);
    }
  } else if (!isAllEmpty) {
    const masterRes = getDataMaster(kategori);
    const user = (masterRes.data || []).find(x => x.id_siswa === idTarget || x.id_guru === idTarget);
    const namaTarget = user ? (isSiswa ? user.nama_siswa : user.nama_guru) : "Target";
    const classKey = user && isSiswa ? (user.kelas + " " + user.jurusan).trim() : "-";
    const logId = "LOG-" + Date.now();

    if (isSiswa) sheet.appendRow([logId, tgl, idTarget, namaTarget, classKey, dataObj.jam_masuk || "-", dataObj.status_masuk || "-", dataObj.jam_pulang || "-", dataObj.status_pulang || "-", dataObj.ket || "-"]);
    else sheet.appendRow([logId, tgl, idTarget, namaTarget, dataObj.jam_masuk || "-", dataObj.status_masuk || "-", dataObj.jam_pulang || "-", dataObj.status_pulang || "-", dataObj.ket || "-"]);
  }
  return { success: true, message: "Koreksi kehadiran berhasil diperbarui!" };
}

function editKehadiranBulk(rows, kategori, tanggal) {
  if (!rows || !rows.length) return { success: false, message: "Data kosong." };
  let count = 0;
  rows.forEach(item => {
    if (item.id_target) {
      editKehadiran(item.id_target, kategori, tanggal, item.jam_masuk, item.status_masuk, item.jam_pulang, item.status_pulang, item.ket);
      count++;
    }
  });
  return { success: true, message: "Berhasil memperbarui " + count + " baris kehadiran!" };
}

function hapusKehadiran(idTarget, kategori, tanggal) {
  const isSiswa = kategori === "Siswa";
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const sheet = findSheetByName([sheetName, "Presensi"]);
  if (!sheet) return { success: true };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true };
  const headers = data[0].map(h => String(h).trim());
  const idColIdx = findHeaderIndex(headers, [isSiswa ? "id_siswa" : "id_guru", "id_target"]);
  const tglColIdx = findHeaderIndex(headers, ["tanggal"]);
  if (idColIdx === -1 || tglColIdx === -1) return { success: true };

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][tglColIdx]).split("T")[0] === tanggal && String(data[i][idColIdx]) === String(idTarget)) {
      sheet.deleteRow(i + 1);
    }
  }
  return { success: true, message: "Presensi berhasil dihapus!" };
}

function getLiveAbsenHariIni(kategori, tanggal, filterKelas) {
  const tgl = tanggal || new Date().toISOString().split("T")[0];
  const isSiswa = kategori === "Siswa";
  const masterRes = getDataMaster(kategori);
  const masterData = masterRes.data || [];
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const rptRes = getSheetDataObj(sheetName, ["Presensi"]);
  const rptData = rptRes.data || [];
  const idKey = isSiswa ? "id_siswa" : "id_guru";
  const nameKey = isSiswa ? "nama_siswa" : "nama_guru";

  const result = masterData.map(m => {
    const idVal = m[idKey];
    const rep = rptData.find(r => String(r.tanggal || "").split("T")[0] === tgl && (String(r[idKey]) === String(idVal) || String(r.id_target) === String(idVal))) || {};
    return {
      id_target: idVal,
      nama_target: m[nameKey] || "-",
      kelas_jurusan: isSiswa ? (m.kelas + " " + m.jurusan).trim() : "-",
      tanggal: tgl,
      jam_masuk: rep.jam_masuk || "-",
      status_masuk: rep.status_masuk || "-",
      jam_pulang: rep.jam_pulang || "-",
      status_pulang: rep.status_pulang || "-",
      ket: rep.ket || "-"
    };
  });

  const filtered = result.filter(item => {
    if (isSiswa && filterKelas && filterKelas !== "Semua") {
      return item.kelas_jurusan.indexOf(filterKelas) !== -1;
    }
    return true;
  });
  return { success: true, data: filtered };
}

function getLaporanFilter(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta) {
  const isSiswa = kategori === "Siswa";
  const sheetName = isSiswa ? "PresensiSiswa" : "PresensiGuru";
  const aliases = isSiswa ? ["DataPresensiSiswa", "Presensi_Siswa", "LaporanSiswa", "Laporan_Siswa", "Presensi"] : ["DataPresensiGuru", "Presensi_Guru", "LaporanGuru", "Laporan_Guru", "Presensi"];
  const res = getSheetDataObj(sheetName, aliases);
  const data = res.data || [];

  const filtered = data.filter(row => {
    const rowTgl = formatTanggalYMD(row.tanggal);
    if (!rowTgl) return false;
    if (jenisFilter === "rentang" && tanggalMulai && tanggalSelesai) {
      if (rowTgl < tanggalMulai || rowTgl > tanggalSelesai) return false;
    } else if (jenisFilter === "bulan" && bulanMinta) {
      if (rowTgl.indexOf(bulanMinta) !== 0) return false;
    }
    if (isSiswa && kelas && kelas !== "Semua") {
      const kJur = String(row.kelas_jurusan || row.kelas || "").replace(/[\s-]+/g, " ").toLowerCase();
      const cleanKelas = String(kelas).replace(/[\s-]+/g, " ").toLowerCase();
      if (kJur.indexOf(cleanKelas) === -1 && cleanKelas.indexOf(kJur) === -1) return false;
    }
    return true;
  });
  return { success: true, data: filtered };
}

function hitungRekapPersentase(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta) {
  const isSiswa = kategori === "Siswa";
  const masterRes = getDataMaster(kategori);
  let masterData = masterRes.data || [];

  if (isSiswa && kelas && kelas !== "Semua") {
    const cleanKelas = String(kelas).replace(/[\s-]+/g, " ").toLowerCase();
    masterData = masterData.filter(m => {
      const kJur = (String(m.kelas || "") + " " + String(m.jurusan || "")).replace(/[\s-]+/g, " ").toLowerCase();
      return kJur.indexOf(cleanKelas) !== -1 || cleanKelas.indexOf(kJur) !== -1;
    });
  }

  const rptRes = getLaporanFilter(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta);
  const rptData = rptRes.data || [];
  const idKey = isSiswa ? "id_siswa" : "id_guru";
  const nameKey = isSiswa ? "nama_siswa" : "nama_guru";

  const rekap = masterData.map(m => {
    const idVal = String(m[idKey] || "").trim();
    const namaVal = String(m[nameKey] || "").trim();
    const userRpts = rptData.filter(r => {
      const rId = String(r[idKey] || r.id_target || r.id_siswa || r.id_guru || "").trim();
      const rNama = String(r.nama_siswa || r.nama_guru || r.nama || "").trim();
      if (idVal && rId && rId === idVal) return true;
      if (namaVal && rNama && rNama.toLowerCase() === namaVal.toLowerCase()) return true;
      return false;
    });

    let hadir = 0, sakit = 0, izin = 0, alfa = 0;
    const jamMasuks = [], jamPulangs = [];

    userRpts.forEach(r => {
      const sm = String(r.status_masuk || "").toLowerCase();
      if (sm.indexOf("tepat") !== -1 || sm.indexOf("terlambat") !== -1 || sm.indexOf("lupa") !== -1 || sm.indexOf("hadir") !== -1) hadir++;
      else if (sm.indexOf("sakit") !== -1) sakit++;
      else if (sm.indexOf("izin") !== -1) izin++;
      else if (sm.indexOf("alfa") !== -1 || sm.indexOf("alpha") !== -1) alfa++;
      else if (r.status_masuk && r.status_masuk !== "-") hadir++;

      if (r.jam_masuk && r.jam_masuk !== "-") jamMasuks.push(r.jam_masuk);
      if (r.jam_pulang && r.jam_pulang !== "-") jamPulangs.push(r.jam_pulang);
    });

    const totalDays = hadir + sakit + izin + alfa;
    const persentase = totalDays === 0 ? "0%" : ((hadir / totalDays) * 100).toFixed(1) + "%";

    return { id: idVal, nama: namaVal, hadir, sakit, izin, alfa, persentase, jam_masuk: jamMasuks.length > 0 ? jamMasuks.join(", ") : "-", jam_pulang: jamPulangs.length > 0 ? jamPulangs.join(", ") : "-" };
  });

  return { success: true, data: rekap };
}

function getDashboardMetrics() {
  const siswaData = (getDataMaster("Siswa").data) || [];
  const guruData = (getDataMaster("Guru").data) || [];
  const tgl = new Date().toISOString().split("T")[0];
  const aliasesSiswa = ["DataPresensiSiswa", "Presensi_Siswa", "LaporanSiswa", "Laporan_Siswa", "Presensi"];
  const aliasesGuru = ["DataPresensiGuru", "Presensi_Guru", "LaporanGuru", "Laporan_Guru", "Presensi"];
  const rptSiswa = (getSheetDataObj("PresensiSiswa", aliasesSiswa).data) || [];
  const rptGuru = (getSheetDataObj("PresensiGuru", aliasesGuru).data) || [];

  function calcStats(masterList, rptList) {
    let hadirMasuk = 0, hadirPulang = 0, totalTepat = 0, rawAlfa = 0;
    const todayRpts = rptList.filter(r => String(r.tanggal || "").split("T")[0] === tgl);
    todayRpts.forEach(r => {
      const sm = String(r.status_masuk || "").toLowerCase();
      const sp = String(r.status_pulang || "").toLowerCase();
      if (sm.indexOf("tepat") !== -1 || sm.indexOf("terlambat") !== -1 || sm.indexOf("lupa") !== -1 || sm.indexOf("hadir") !== -1) {
        hadirMasuk++;
        if (sm.indexOf("tepat") !== -1) totalTepat++;
      } else if (sm.indexOf("alfa") !== -1 || sm.indexOf("alpha") !== -1) rawAlfa++;
      if (sp.indexOf("tepat") !== -1 || sp.indexOf("terlambat") !== -1 || sp.indexOf("lupa") !== -1 || sp.indexOf("hadir") !== -1) hadirPulang++;
    });
    const persentaseTepatInt = hadirMasuk > 0 ? Math.round((totalTepat / hadirMasuk) * 100) : 0;
    const pAlfa = masterList.length > 0 ? Math.round((rawAlfa / masterList.length) * 100) : 0;
    const pPulang = masterList.length > 0 ? Math.round((hadirPulang / masterList.length) * 100) : 0;
    return { hadirMasuk, hadirPulang, persentaseTepat: persentaseTepatInt + "%", persentaseTepatInt, pAlfa, pPulang };
  }

  const sStat = calcStats(siswaData, rptSiswa);
  const gStat = calcStats(guruData, rptGuru);
  const chartLabels = [], chartData = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agus", "Sep", "Okt", "Nov", "Des"];
    chartLabels.push(d.getDate() + " " + monthNames[d.getMonth()]);
    const count = rptSiswa.filter(r => String(r.tanggal || "").split("T")[0] === dateStr && (String(r.status_masuk || "").toLowerCase().indexOf("tepat") !== -1 || String(r.status_masuk || "").toLowerCase().indexOf("terlambat") !== -1 || String(r.status_masuk || "").toLowerCase().indexOf("hadir") !== -1)).length;
    chartData.push(count);
  }

  return {
    success: true,
    data: {
      totalSiswa: siswaData.length, siswaMasuk: sStat.hadirMasuk, siswaPulang: sStat.hadirPulang, siswaTepat: sStat.persentaseTepat, siswaTepatInt: sStat.persentaseTepatInt, siswaPulangPersenInt: sStat.pPulang, siswaAlfaInt: sStat.pAlfa,
      totalGuru: guruData.length, guruMasuk: gStat.hadirMasuk, guruPulang: gStat.hadirPulang, guruTepat: gStat.persentaseTepat, guruTepatInt: gStat.persentaseTepatInt, guruPulangPersenInt: gStat.pPulang, guruAlfaInt: gStat.pAlfa,
      chartLabels, chartData
    }
  };
}

function getJamPelajaran() {
  const res = getSheetDataObj("JamPelajaran");
  const data = res.data || [];
  data.sort((a, b) => String(a.jam_mulai || "").localeCompare(String(b.jam_mulai || "")));
  return { success: true, data };
}

function simpanJamPelajaran(param1, param2) {
  const payload = (typeof param1 === 'object' && param1 !== null) ? param1 : param2;
  if (!payload) return { success: false, message: "Payload tidak valid." };
  const sheet = getOrCreateSheet("JamPelajaran", ["id_jam", "jam_ke", "nama_jam", "jam_mulai", "jam_selesai", "tipe"]);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idJam = payload.id_jam || ("JP-" + Date.now());
  const idColIdx = findHeaderIndex(headers, ["id_jam"]);
  let foundRowIdx = -1;
  if (idColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColIdx]) === String(idJam)) { foundRowIdx = i + 1; break; }
    }
  }
  const newRow = [idJam, payload.jam_ke || 1, payload.nama_jam || ("Jam ke-" + (payload.jam_ke || 1)), payload.jam_mulai || "07:00", payload.jam_selesai || "07:45", payload.tipe || "Pelajaran"];
  if (foundRowIdx > 0) sheet.getRange(foundRowIdx, 1, 1, newRow.length).setValues([newRow]);
  else sheet.appendRow(newRow);
  return { success: true, message: "Slot Jam Pelajaran berhasil disimpan!" };
}

function simpanJadwalPelajaran(param1, param2) {
  const payload = (typeof param1 === 'object' && param1 !== null) ? param1 : param2;
  if (!payload) return { success: false, message: "Payload tidak valid." };
  const sheet = getOrCreateSheet("JadwalPelajaran", ["id_jadwal", "hari", "kelas", "jam_ke", "id_jam", "jam_mulai", "jam_selesai", "mapel", "id_guru", "nama_guru", "ruangan"]);
  const data = sheet.getDataRange().getValues();
  const headers = data[0].map(h => String(h).trim());
  const idJadwal = payload.id_jadwal || ("JPEL-" + Math.floor(Math.random() * 100000));
  const idColIdx = findHeaderIndex(headers, ["id_jadwal"]);
  let foundRowIdx = -1;
  if (idColIdx !== -1) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][idColIdx]) === String(idJadwal)) { foundRowIdx = i + 1; break; }
    }
  }
  const newRow = [idJadwal, payload.hari || "Senin", payload.kelas || "", payload.jam_ke || 1, payload.id_jam || ("JP-" + payload.jam_ke), payload.jam_mulai || "-", payload.jam_selesai || "-", payload.mapel || "", payload.id_guru || "", payload.nama_guru || "", payload.ruangan || "Kelas Utama"];
  if (foundRowIdx > 0) sheet.getRange(foundRowIdx, 1, 1, newRow.length).setValues([newRow]);
  else sheet.appendRow(newRow);
  return { success: true, message: "Jadwal Pelajaran berhasil disimpan!" };
}

function simpanAbsensiMengajarGuru(payload) {
  if (!payload) return { success: false, message: "Payload tidak valid." };
  const sheet = getOrCreateSheet("AbsensiMengajar", ["id_log_mengajar", "tanggal", "waktu_absen", "hari", "id_guru", "nama_guru", "kelas", "mapel", "jam_ke", "jam_mulai_jadwal", "jam_selesai_jadwal", "status", "catatan_materi"]);
  sheet.appendRow([payload.id_log_mengajar || ("LOG-MENG-" + Date.now()), payload.tanggal || new Date().toISOString().split("T")[0], payload.waktu_absen || new Date().toTimeString().slice(0, 5), payload.hari || "Senin", payload.id_guru || "", payload.nama_guru || "", payload.kelas || "", payload.mapel || "", payload.jam_ke || 1, payload.jam_mulai_jadwal || "-", payload.jam_selesai_jadwal || "-", payload.status || "Hadir Tepat Waktu", payload.catatan_materi || "-"]);
  return { success: true, message: "Presensi Mengajar Guru berhasil dicatat!" };
}

function simpanJadwalGuru(param1, param2) {
  const payload = (typeof param1 === 'object' && param1 !== null) ? param1 : param2;
  if (!payload) return { success: false, message: "Payload tidak valid." };
  const sheet = getOrCreateSheet("JadwalGuru", ["id_jadwal", "id_guru", "nama_guru", "hari", "jam_masuk_mulai", "jam_masuk_batas", "jam_pulang_mulai"]);
  sheet.appendRow([payload.id_jadwal || ("J-" + Math.floor(Math.random() * 10000)), payload.id_guru || "", payload.nama_guru || "", payload.hari || "Senin", payload.jam_masuk_mulai || "06:00", payload.jam_masuk_batas || "07:15", payload.jam_pulang_mulai || "15:30"]);
  return { success: true, message: "Jadwal guru berhasil disimpan!" };
}

function getKelasSemua() {
  const res = getSheetDataObj("Kelas");
  const list = res.data || [];
  return { success: true, data: list.map(item => item.nama_kelas || item.kelas || String(item)).filter(Boolean) };
}

function simpanKelas(namaKelasInput) {
  const namaKelas = typeof namaKelasInput === "string" ? namaKelasInput : (namaKelasInput.nama_kelas || "");
  if (!namaKelas) return { success: false, message: "Nama kelas tidak boleh kosong." };
  const sheet = getOrCreateSheet("Kelas", ["id_kelas", "nama_kelas", "wali_kelas"]);
  sheet.appendRow(["KLS-" + Date.now(), namaKelas, "Wali Kelas"]);
  return { success: true, message: "Kelas berhasil ditambahkan!" };
}

function editKelas(kelasLama, kelasBaru) {
  const sheet = findSheetByName(["Kelas"]);
  if (!sheet) return { success: false, message: "Sheet Kelas tidak ditemukan." };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(kelasLama) || String(data[i][0]) === String(kelasLama)) {
      sheet.getRange(i + 1, 2).setValue(kelasBaru);
      return { success: true, message: "Kelas berhasil diperbarui!" };
    }
  }
  return { success: false, message: "Kelas lama tidak ditemukan." };
}

function simpanHariLibur(param1, param2) {
  const tgl = (typeof param1 === 'string') ? param1 : (param1.tanggal || "");
  const ket = param2 || (typeof param1 === 'object' ? param1.keterangan : "Libur Sekolah");
  if (!tgl) return { success: false, message: "Tanggal libur tidak valid." };
  const sheet = getOrCreateSheet("HariLibur", ["tanggal", "keterangan"]);
  sheet.appendRow([tgl, ket]);
  return { success: true, message: "Hari Libur berhasil disimpan!" };
}

function getPengaturan() {
  const sheet = findSheetByName(["Pengaturan"]);
  if (!sheet) return { success: true, data: { jam_masuk_mulai: "06:00", jam_masuk_batas: "07:15", jam_pulang_mulai: "15:30" } };
  const data = sheet.getDataRange().getValues();
  let cfg = { jam_masuk_mulai: "06:00", jam_masuk_batas: "07:15", jam_pulang_mulai: "15:30" };
  for (let i = 1; i < data.length; i++) { if (data[i][0]) cfg[String(data[i][0])] = data[i][1]; }
  return { success: true, data: cfg };
}

function simpanPengaturan(jMulai, jBatas, jPulang) {
  const sheet = getOrCreateSheet("Pengaturan", ["key", "value"]);
  sheet.clearContents(); sheet.appendRow(["key", "value"]);
  sheet.appendRow(["jam_masuk_mulai", jMulai || "06:00"]);
  sheet.appendRow(["jam_masuk_batas", jBatas || "07:15"]);
  sheet.appendRow(["jam_pulang_mulai", jPulang || "15:30"]);
  return { success: true, message: "Pengaturan operasional berhasil disimpan!" };
}

function simpanPengaturanCustom(configObj) {
  if (!configObj) return { success: false, message: "Pengaturan tidak valid." };
  const sheet = getOrCreateSheet("Pengaturan", ["key", "value"]);
  sheet.clearContents(); sheet.appendRow(["key", "value"]);
  Object.keys(configObj).forEach(k => sheet.appendRow([k, configObj[k]]));
  return { success: true, message: "Pengaturan kustom berhasil disimpan!" };
}

function verifikasiLogin(username, password) {
  const sheet = getOrCreateSheet("Users", ["username", "password", "role", "target_id"]);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase() === String(username).toLowerCase() && String(data[i][1]) === String(password)) {
      return { success: true, role: data[i][2] || "Admin", target_id: data[i][3] || "-", username: data[i][0], message: "Login Berhasil!" };
    }
  }
  const guruRes = getDataMaster("Guru");
  const guruMatch = (guruRes.data || []).find(g => String(username).replace(/\\s+/g, "").toLowerCase() === String(g.nama_guru || "").replace(/\\s+/g, "").toLowerCase() && String(password) === String(g.password || "guru123"));
  if (guruMatch) return { success: true, role: "Guru", target_id: guruMatch.id_guru, username: guruMatch.nama_guru, message: "Login Berhasil (Otomatis Guru)!" };
  return { success: false, message: "Username atau Password salah!" };
}

function ubahPasswordUser(username, passwordLama, passwordBaru) {
  const sheet = findSheetByName(["Users"]);
  if (sheet) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(username).toLowerCase() && String(data[i][1]) === String(passwordLama)) {
        sheet.getRange(i + 1, 2).setValue(passwordBaru);
        return { success: true, message: "Password berhasil diperbarui!" };
      }
    }
  }
  return { success: false, message: "Password lama tidak sesuai." };
}

function simpanUser(userObj, oldUsername) {
  if (!userObj || !userObj.username) return { success: false, message: "Data user tidak valid." };
  const sheet = getOrCreateSheet("Users", ["username", "password", "role", "target_id"]);
  const data = sheet.getDataRange().getValues();
  if (oldUsername) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase() === String(oldUsername).toLowerCase()) {
        sheet.getRange(i + 1, 1).setValue(userObj.username);
        sheet.getRange(i + 1, 2).setValue(userObj.password || "123456");
        sheet.getRange(i + 1, 3).setValue(userObj.role || "TU");
        sheet.getRange(i + 1, 4).setValue(userObj.target_id || "-");
        return { success: true, message: "User berhasil diperbarui!" };
      }
    }
  }
  sheet.appendRow([userObj.username, userObj.password || "123456", userObj.role || "TU", userObj.target_id || "-"]);
  return { success: true, message: "User baru berhasil ditambahkan!" };
}

function findHeaderIndex(headers, possibleKeys) {
  for (let i = 0; i < possibleKeys.length; i++) {
    const key = possibleKeys[i].toLowerCase();
    for (let j = 0; j < headers.length; j++) {
      if (headers[j].toLowerCase() === key) return j;
    }
  }
  return -1;
}

function setRowValueByHeader(sheet, rowNum, headers, targetHeader, value) {
  const idx = findHeaderIndex(headers, [targetHeader]);
  if (idx !== -1) sheet.getRange(rowNum, idx + 1).setValue(value);
}

function hapusRowByColumn(sheetPrimaryName, possibleColHeaders, value) {
  const sheet = findSheetByName([sheetPrimaryName]);
  if (!sheet) return { success: true, message: "Sheet tidak ditemukan." };
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return { success: true, message: "Data kosong." };
  const headers = data[0].map(h => String(h).trim());
  const colIdx = findHeaderIndex(headers, possibleColHeaders);
  if (colIdx === -1) return { success: false, message: "Kolom kunci tidak ditemukan." };
  let deletedCount = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][colIdx]) === String(value)) { sheet.deleteRow(i + 1); deletedCount++; }
  }
  return { success: true, message: deletedCount + " baris berhasil dihapus!" };
}`;
              navigator.clipboard.writeText(codeText);
              setIsScriptCopied(true);
              setTimeout(() => setIsScriptCopied(false), 2500);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isScriptCopied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
            {isScriptCopied ? "Berhasil Disalin!" : "Salin Kode.gs v3.0 Terbaru ke Clipboard"}
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Jika Anda menghubungkan SIAS ke Google Sheets, pastikan Web App Google Apps Script Anda memuat seluruh handler tindakan jadwal, presensi & data master terbaru v3.0. Klik tombol di atas untuk menyalin kode lengkap backend Google Apps Script yang sudah diselaraskan dengan database Google Sheets Anda.
        </p>

        <button
          onClick={() => setShowScriptCode(!showScriptCode)}
          className="text-xs text-amber-400 font-bold underline hover:text-amber-300 flex items-center gap-1"
        >
          {showScriptCode ? "Sembunyikan Cuplikan Kode.gs" : "Tampilkan Ringkasan Kode.gs Backend v3.0"}
        </button>

        {showScriptCode && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-200 overflow-x-auto max-h-60 leading-relaxed">
            <pre>{`/**
 * Google Apps Script Backend v3.0 (Kode.gs) - Database Google Sheets SIAS
 * Full support untuk Data Master (Siswa/Guru), Presensi QR & Manual, Laporan, Dashboard, Jadwal & Slot Jam
 */
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  initSheets(); // Pembuatan otomatis tab jika belum ada, tanpa merusak data lama
  
  switch (data.action) {
    case "getDataMaster": return getDataMaster(data.args[0]);
    case "prosesScanQR": return prosesScanQR(data.args[0], data.args[1], data.args[2], data.args[3]);
    case "simpanAbsenManual": return simpanAbsenManual(data.args[0], data.args[1], data.args[2], data.args[3], data.args[4], data.args[5], data.args[6]);
    case "getLaporanFilter": return getLaporanFilter(data.args[0], data.args[1], data.args[2], data.args[3], data.args[4], data.args[5]);
    case "getDashboardMetrics": return getDashboardMetrics();
    case "getJamPelajaran": return getJamPelajaran();
    case "getJadwalPelajaranSemua": return getSheetDataObj("JadwalPelajaran");
    case "getAbsensiMengajarGuru": return getSheetDataObj("AbsensiMengajar");
    // ... 24+ handler lengkap
  }
}`}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
