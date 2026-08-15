/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import { 
  Building2, 
  Clock, 
  Calendar, 
  FolderLock, 
  Trash2, 
  Plus, 
  Save, 
  Database,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  HardDrive,
  Download,
  Upload,
  Cloud,
  FileJson,
  ShieldCheck,
  UserCheck,
  ArrowRight,
  Loader2,
  Code,
  FileSpreadsheet,
  Layers,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { callGas, getStorageKey, setStorage, getStorage, extractArrayData, cleanTimeHHMM, getSchoolProfile, setSchoolProfile } from "../lib/gasApi";
import { ConfigJam, HariLibur } from "../types";

export default function Settings() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"profil" | "jam" | "keamanan" | "spreadsheet" | "backup">("profil");
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Password Change State
  const [passLama, setPassLama] = useState("");
  const [passBaru, setPassBaru] = useState("");
  const [passKonfirm, setPassKonfirm] = useState("");
  const [passStatus, setPassStatus] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Card & Identity Settings State
  const schoolProf = getSchoolProfile();
  const [cardConfig, setCardConfig] = useState({
    schoolName: localStorage.getItem(getStorageKey('cardSchoolName')) || schoolProf.namaSekolah || 'AL-HIKAM SCHOOL',
    schoolAddress: localStorage.getItem(getStorageKey('cardSchoolAddress')) || schoolProf.alamatSekolah || 'SENDANG AGUNG',
    principalName: localStorage.getItem(getStorageKey('cardPrincipalName')) || 'Fulan, S.Pd',
    signatureUrl: localStorage.getItem(getStorageKey('cardSignatureUrl')) || '',
    logoLeftUrl: localStorage.getItem(getStorageKey('cardLogoLeftUrl')) || '',
    logoRightUrl: localStorage.getItem(getStorageKey('cardLogoRightUrl')) || ''
  });

  // Operational Hours State
  const [configJam, setConfigJam] = useState<ConfigJam>(() => {
    try {
      const localCfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || localStorage.getItem(getStorageKey("pengaturan_jam")) || "{}");
      return {
        jam_masuk_mulai: cleanTimeHHMM(localCfg.jam_masuk_mulai || localCfg.jamMasukMulai) || "06:00",
        jam_masuk_batas: cleanTimeHHMM(localCfg.jam_masuk_batas || localCfg.jamMasukBatas) || "07:15",
        jam_pulang_mulai: cleanTimeHHMM(localCfg.jam_pulang_mulai || localCfg.jamPulangMulai) || "15:30"
      };
    } catch (e) {
      return {
        jam_masuk_mulai: "06:00",
        jam_masuk_batas: "07:15",
        jam_pulang_mulai: "15:30"
      };
    }
  });

  // Holidays State
  const [liburList, setLiburList] = useState<HariLibur[]>([]);
  const [newLiburTgl, setNewLiburTgl] = useState("");
  const [newLiburKet, setNewLiburKet] = useState("");

  // Token API State
  const [apiToken, setApiToken] = useState<string>(() => {
    return localStorage.getItem(getStorageKey("GAS_TOKEN")) || localStorage.getItem(getStorageKey("apiToken")) || "sias_token_smkalhikam_2026";
  });
  const [showToken, setShowToken] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Backup & Restore State
  const [backupMode, setBackupMode] = useState<"manual" | "otomatis">("manual");
  const [backupFrekuensi, setBackupFrekuensi] = useState<"harian" | "mingguan" | "bulanan">("harian");
  const [backupJam, setBackupJam] = useState("00:00");
  const [driveFolderId, setDriveFolderId] = useState("");
  const [lastBackupTime, setLastBackupTime] = useState<string>(() => {
    return localStorage.getItem(getStorageKey("lastBackupTime")) || "Belum pernah backup";
  });

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

  // Centralized Save Function: Merges all settings so nothing gets wiped
  const saveFullConfig = async (partialUpdates: Partial<typeof cardConfig & ConfigJam & { apiToken: string; backupMode: string; backupFrekuensi: string; backupJam: string; driveFolderId: string; lastBackupTime: string }> = {}) => {
    const cleanSignature = getRawGithubUrl(partialUpdates.signatureUrl !== undefined ? partialUpdates.signatureUrl : cardConfig.signatureUrl);
    const cleanLogoLeft = getRawGithubUrl(partialUpdates.logoLeftUrl !== undefined ? partialUpdates.logoLeftUrl : cardConfig.logoLeftUrl);
    const cleanLogoRight = getRawGithubUrl(partialUpdates.logoRightUrl !== undefined ? partialUpdates.logoRightUrl : cardConfig.logoRightUrl);

    const fullObj = {
      cardSchoolName: partialUpdates.schoolName !== undefined ? partialUpdates.schoolName : cardConfig.schoolName,
      cardSchoolAddress: partialUpdates.schoolAddress !== undefined ? partialUpdates.schoolAddress : cardConfig.schoolAddress,
      cardPrincipalName: partialUpdates.principalName !== undefined ? partialUpdates.principalName : cardConfig.principalName,
      cardSignatureUrl: cleanSignature,
      cardLogoLeftUrl: cleanLogoLeft,
      cardLogoRightUrl: cleanLogoRight,
      jam_masuk_mulai: partialUpdates.jam_masuk_mulai !== undefined ? partialUpdates.jam_masuk_mulai : configJam.jam_masuk_mulai,
      jam_masuk_batas: partialUpdates.jam_masuk_batas !== undefined ? partialUpdates.jam_masuk_batas : configJam.jam_masuk_batas,
      jam_pulang_mulai: partialUpdates.jam_pulang_mulai !== undefined ? partialUpdates.jam_pulang_mulai : configJam.jam_pulang_mulai,
      apiToken: partialUpdates.apiToken !== undefined ? partialUpdates.apiToken : apiToken,
      backupMode: partialUpdates.backupMode !== undefined ? partialUpdates.backupMode : backupMode,
      backupFrekuensi: partialUpdates.backupFrekuensi !== undefined ? partialUpdates.backupFrekuensi : backupFrekuensi,
      backupJam: partialUpdates.backupJam !== undefined ? partialUpdates.backupJam : backupJam,
      driveFolderId: partialUpdates.driveFolderId !== undefined ? partialUpdates.driveFolderId : driveFolderId,
      lastBackupTime: partialUpdates.lastBackupTime !== undefined ? partialUpdates.lastBackupTime : lastBackupTime
    };

    // Update Local States
    setCardConfig({
      schoolName: fullObj.cardSchoolName,
      schoolAddress: fullObj.cardSchoolAddress,
      principalName: fullObj.cardPrincipalName,
      signatureUrl: fullObj.cardSignatureUrl,
      logoLeftUrl: fullObj.cardLogoLeftUrl,
      logoRightUrl: fullObj.cardLogoRightUrl
    });

    setConfigJam({
      jam_masuk_mulai: fullObj.jam_masuk_mulai,
      jam_masuk_batas: fullObj.jam_masuk_batas,
      jam_pulang_mulai: fullObj.jam_pulang_mulai
    });

    if (partialUpdates.apiToken !== undefined) setApiToken(fullObj.apiToken);
    if (partialUpdates.backupMode !== undefined) setBackupMode(fullObj.backupMode as any);
    if (partialUpdates.backupFrekuensi !== undefined) setBackupFrekuensi(fullObj.backupFrekuensi as any);
    if (partialUpdates.backupJam !== undefined) setBackupJam(fullObj.backupJam);
    if (partialUpdates.driveFolderId !== undefined) setDriveFolderId(fullObj.driveFolderId);
    if (partialUpdates.lastBackupTime !== undefined) setLastBackupTime(fullObj.lastBackupTime);

    // Persist each key in LocalStorage
    localStorage.setItem(getStorageKey('cardSchoolName'), fullObj.cardSchoolName);
    localStorage.setItem(getStorageKey('cardSchoolAddress'), fullObj.cardSchoolAddress);
    localStorage.setItem(getStorageKey('cardPrincipalName'), fullObj.cardPrincipalName);
    localStorage.setItem(getStorageKey('cardSignatureUrl'), fullObj.cardSignatureUrl);
    localStorage.setItem(getStorageKey('cardLogoLeftUrl'), fullObj.cardLogoLeftUrl);
    localStorage.setItem(getStorageKey('cardLogoRightUrl'), fullObj.cardLogoRightUrl);
    localStorage.setItem(getStorageKey('MOCK_pengaturan_jam'), JSON.stringify(fullObj));
    localStorage.setItem(getStorageKey('pengaturan_jam'), JSON.stringify(fullObj));
    localStorage.setItem(getStorageKey('GAS_TOKEN'), fullObj.apiToken);
    localStorage.setItem(getStorageKey('lastBackupTime'), fullObj.lastBackupTime);

    try {
      setLoading(true);
      setLoadingAction("Sedang menyimpan konfigurasi ke database...");
      const res = await callGas("simpanPengaturanCustom", [fullObj]);
      await callGas("simpanPengaturanJam", [fullObj]);
      return res;
    } catch (err) {
      console.error("saveFullConfig Error:", err);
      return { success: false, message: String(err) };
    } finally {
      setLoading(false);
      setLoadingAction(null);
    }
  };

  // Load Config on Mount
  const loadConfig = async () => {
    try {
      setLoading(true);
      let res = await callGas("getPengaturanSemua");
      const data = res?.data || res || {};

      if (data && typeof data === "object") {
        if (data.cardSchoolName) setCardConfig(prev => ({ ...prev, schoolName: data.cardSchoolName }));
        if (data.cardSchoolAddress) setCardConfig(prev => ({ ...prev, schoolAddress: data.cardSchoolAddress }));
        if (data.cardPrincipalName) setCardConfig(prev => ({ ...prev, principalName: data.cardPrincipalName }));
        if (data.cardSignatureUrl) setCardConfig(prev => ({ ...prev, signatureUrl: data.cardSignatureUrl }));
        if (data.cardLogoLeftUrl) setCardConfig(prev => ({ ...prev, logoLeftUrl: data.cardLogoLeftUrl }));
        if (data.cardLogoRightUrl) setCardConfig(prev => ({ ...prev, logoRightUrl: data.cardLogoRightUrl }));

        if (data.jam_masuk_mulai) setConfigJam(prev => ({ ...prev, jam_masuk_mulai: cleanTimeHHMM(data.jam_masuk_mulai) || prev.jam_masuk_mulai }));
        if (data.jam_masuk_batas) setConfigJam(prev => ({ ...prev, jam_masuk_batas: cleanTimeHHMM(data.jam_masuk_batas) || prev.jam_masuk_batas }));
        if (data.jam_pulang_mulai) setConfigJam(prev => ({ ...prev, jam_pulang_mulai: cleanTimeHHMM(data.jam_pulang_mulai) || prev.jam_pulang_mulai }));

        if (data.apiToken) setApiToken(data.apiToken);
        if (data.backupMode) setBackupMode(data.backupMode);
        if (data.backupFrekuensi) setBackupFrekuensi(data.backupFrekuensi);
        if (data.backupJam) setBackupJam(data.backupJam);
        if (data.driveFolderId) setDriveFolderId(data.driveFolderId);
        if (data.lastBackupTime) setLastBackupTime(data.lastBackupTime);
      }

      // Load Holidays
      const liburRes = await callGas("getHariLiburSemua");
      const libList = Array.isArray(liburRes)
        ? liburRes
        : (liburRes?.data && Array.isArray(liburRes.data) ? liburRes.data : []);
      setLiburList(libList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Save Card & Profile Settings
  const handleSaveCardConfig = async (e: FormEvent) => {
    e.preventDefault();
    const res = await saveFullConfig();
    if (res && res.success !== false) {
      alert("Profil Sekolah & Kartu berhasil disimpan dan disinkronkan ke database!");
    } else {
      alert("Profil disimpan secara lokal, namun gagal disinkronkan ke cloud: " + (res?.message || ""));
    }
  };

  // Save Operational Hours
  const handleSaveHours = async (e: FormEvent) => {
    e.preventDefault();
    const res = await saveFullConfig({
      jam_masuk_mulai: configJam.jam_masuk_mulai,
      jam_masuk_batas: configJam.jam_masuk_batas,
      jam_pulang_mulai: configJam.jam_pulang_mulai
    });
    if (res && res.success !== false) {
      alert("Jam operasional presensi berhasil disimpan!");
    } else {
      alert("Jam operasional disimpan secara lokal.");
    }
  };

  // Save Token
  const handleSaveToken = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim()) {
      alert("Token API tidak boleh kosong!");
      return;
    }
    const res = await saveFullConfig({ apiToken: apiToken.trim() });
    alert("Token Keamanan Database berhasil disimpan!");
  };

  // Regenerate Token
  const handleRegenerateToken = () => {
    if (!confirm("Buat token keamanan baru? Aplikasi dan API client akan membutuhkan token baru ini.")) return;
    const newToken = "sias_token_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now().toString(36);
    setApiToken(newToken);
    saveFullConfig({ apiToken: newToken });
  };

  // Add Holiday
  const handleAddHoliday = async (e: FormEvent) => {
    e.preventDefault();
    if (!newLiburTgl || !newLiburKet.trim()) {
      alert("Lengkapi tanggal dan keterangan libur.");
      return;
    }
    try {
      setLoading(true);
      const res = await callGas("tambahHariLibur", [newLiburTgl, newLiburKet.trim()]);
      if (res && res.success) {
        setNewLiburTgl("");
        setNewLiburKet("");
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

  // Password Change Handler
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

  // Backup & Restore Handlers
  const handleSaveBackupConfig = async (e: FormEvent) => {
    e.preventDefault();
    const res = await saveFullConfig({
      backupMode,
      backupFrekuensi,
      backupJam,
      driveFolderId: driveFolderId.trim()
    });
    alert("Pengaturan mode backup berhasil disimpan!");
  };

  const handleExportDatabaseJSON = async () => {
    try {
      setLoading(true);
      const [resUsers, resSiswa, resGuru, resKelas, resJam, resJadwal, resLaporanSiswa, resLaporanGuru, resHariLibur, resPengaturan] = await Promise.all([
        callGas("getUsersSemua"),
        callGas("getDataMaster", ["Siswa"]),
        callGas("getDataMaster", ["Guru"]),
        callGas("getKelasSemua"),
        callGas("getJamPelajaranSemua"),
        callGas("getJadwalPelajaranSemua"),
        callGas("getLaporanAbsensiSiswaSemua"),
        callGas("getLaporanAbsensiGuruSemua"),
        callGas("getHariLiburSemua"),
        callGas("getPengaturanSemua")
      ]);

      const fullBundle = {
        timestamp: new Date().toISOString(),
        school: cardConfig.schoolName,
        users: extractArrayData(resUsers).length ? extractArrayData(resUsers) : getStorage("users"),
        data_siswa: extractArrayData(resSiswa).length ? extractArrayData(resSiswa) : getStorage("data_siswa"),
        data_guru: extractArrayData(resGuru).length ? extractArrayData(resGuru) : getStorage("data_guru"),
        data_kelas: extractArrayData(resKelas).length ? extractArrayData(resKelas) : getStorage("data_kelas"),
        jam_pelajaran: extractArrayData(resJam).length ? extractArrayData(resJam) : getStorage("jam_pelajaran"),
        jadwal_pelajaran: extractArrayData(resJadwal).length ? extractArrayData(resJadwal) : getStorage("jadwal_pelajaran"),
        laporan_siswa: extractArrayData(resLaporanSiswa).length ? extractArrayData(resLaporanSiswa) : getStorage("laporan_siswa"),
        laporan_guru: extractArrayData(resLaporanGuru).length ? extractArrayData(resLaporanGuru) : getStorage("laporan_guru"),
        hari_libur: extractArrayData(resHariLibur).length ? extractArrayData(resHariLibur) : getStorage("hari_libur"),
        pengaturan: resPengaturan?.data || resPengaturan || {}
      };

      const blob = new Blob([JSON.stringify(fullBundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `backup_database_sias_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const nowStr = new Date().toLocaleString("id-ID");
      setLastBackupTime(nowStr);
      await saveFullConfig({ lastBackupTime: nowStr });
      alert("File backup JSON database berhasil diunduh!");
    } catch (err: any) {
      alert("Gagal mengekspor backup: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleBackupToDrive = async () => {
    try {
      setLoading(true);
      const res = await callGas("backupDatabaseToDrive", [driveFolderId]);
      const nowStr = new Date().toLocaleString("id-ID");
      setLastBackupTime(nowStr);
      await saveFullConfig({ lastBackupTime: nowStr });
      alert(res?.message || "Backup database ke Google Drive berhasil!");
    } catch (err: any) {
      alert("Gagal melakukan backup ke Drive: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreJSONFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!confirm("PERINGATAN: Memulihkan database akan menimpa seluruh data sistem saat ini dengan isi file backup. Apakah Anda yakin?")) return;

        setLoading(true);
        const res = await callGas("restoreDatabaseJSON", [parsed]);
        if (res && res.success) {
          alert("Restore database berhasil diselesaikan! Halaman akan dimuat ulang.");
          window.location.reload();
        } else {
          alert(res?.message || "Restore database gagal.");
        }
      } catch (err: any) {
        alert("File JSON tidak valid: " + err.toString());
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2 backdrop-blur-sm border border-blue-400/30">
              <FolderLock className="w-3.5 h-3.5" />
              <span>Sistem Manajemen Sekolah SIAS v3.0</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Pengaturan & Konfigurasi</h1>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
              Kelola profil sekolah, jam operasional presensi, token keamanan database, serta backup otomatis ke Google Drive.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div className="text-left">
              <p className="text-[10px] text-slate-300 font-semibold uppercase">Status Database</p>
              <p className="text-xs font-bold text-emerald-300">Terhubung & Terproteksi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setActiveTab("profil")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "profil"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profil & Kartu</span>
        </button>

        <button
          onClick={() => setActiveTab("jam")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "jam"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Jam & Hari Libur</span>
        </button>

        <button
          onClick={() => setActiveTab("keamanan")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "keamanan"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Keamanan & Token</span>
        </button>

        <button
          onClick={() => setActiveTab("spreadsheet")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "spreadsheet"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Struktur Sheet & GAS</span>
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === "backup"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Backup Database (Drive)</span>
        </button>
      </div>

      {/* TAB 1: PROFIL & KARTU SEKOLAH */}
      {activeTab === "profil" && (
        <div className="space-y-6">
          <form onSubmit={handleSaveCardConfig} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Identitas Sekolah & Cetak Kartu</h2>
                <p className="text-xs text-gray-500">Konfigurasi nama instansi, logo, dan tanda tangan cetak kartu QR siswa/guru</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Nama Sekolah / Instansi</label>
                <input
                  type="text"
                  required
                  value={cardConfig.schoolName}
                  onChange={(e) => setCardConfig({ ...cardConfig, schoolName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  placeholder="Contoh: SMK AL-HIKAM KREJENGAN"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Nama Kepala Sekolah</label>
                <input
                  type="text"
                  required
                  value={cardConfig.principalName}
                  onChange={(e) => setCardConfig({ ...cardConfig, principalName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                  placeholder="Contoh: Fulan, S.Pd"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-700">Alamat Lengkap Sekolah</label>
                <input
                  type="text"
                  required
                  value={cardConfig.schoolAddress}
                  onChange={(e) => setCardConfig({ ...cardConfig, schoolAddress: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="Krejengan Kec. Krejengan Kab. Probolinggo"
                />
              </div>

              {/* Logo Left */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                  URL Logo Sekolah Kiri (Instansi)
                </label>
                <input
                  type="url"
                  value={cardConfig.logoLeftUrl}
                  onChange={(e) => setCardConfig({ ...cardConfig, logoLeftUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="https://... / logo_kiri.png"
                />
                {cardConfig.logoLeftUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <img src={getRawGithubUrl(cardConfig.logoLeftUrl)} alt="Logo Left Preview" className="h-10 w-10 object-contain rounded-lg bg-white p-1 border border-gray-200" />
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Pratinjau Logo Kiri Ok
                    </span>
                  </div>
                )}
              </div>

              {/* Logo Right */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  URL Logo Kanan (Tut Wuri / Kemendikbud)
                </label>
                <input
                  type="url"
                  value={cardConfig.logoRightUrl}
                  onChange={(e) => setCardConfig({ ...cardConfig, logoRightUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="https://... / logo_kanan.png"
                />
                {cardConfig.logoRightUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <img src={getRawGithubUrl(cardConfig.logoRightUrl)} alt="Logo Right Preview" className="h-10 w-10 object-contain rounded-lg bg-white p-1 border border-gray-200" />
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Pratinjau Logo Kanan Ok
                    </span>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                  URL Gambar Tanda Tangan & Stempel Digital
                </label>
                <input
                  type="url"
                  value={cardConfig.signatureUrl}
                  onChange={(e) => setCardConfig({ ...cardConfig, signatureUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="https://raw.githubusercontent.com/.../signature.png"
                />
                {cardConfig.signatureUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <img src={getRawGithubUrl(cardConfig.signatureUrl)} alt="Signature Preview" className="h-12 w-auto max-w-[150px] object-contain rounded-lg bg-white p-1 border border-gray-200" />
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Tanda Tangan Digital Siap Digunakan
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Profil & Pengaturan Kartu</span>
              </button>
            </div>
          </form>

          {/* Helper Card for Kelas & Wali Kelas Location */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-900">Manajemen Kelas & Wali Kelas</h3>
                <p className="text-[11px] text-emerald-700 mt-0.5">Pengelolaan data kelas dan penetapan wali kelas sekarang dipusatkan secara efisien di menu Data Master.</p>
              </div>
            </div>
            <a
              href="#/data-master"
              onClick={() => {
                window.location.hash = "#/data-master";
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap"
            >
              <span>Buka Data Master Kelas</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* TAB 2: JAM OPERASIONAL & HARI LIBUR */}
      {activeTab === "jam" && (
        <div className="space-y-6">
          {/* Form Jam Operasional */}
          <form onSubmit={handleSaveHours} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Jam Operasional Presensi</h2>
                <p className="text-xs text-gray-500">Tentukan batas toleransi waktu hadir dan jam pulang otomatis presensi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Jam Masuk Mulai</label>
                <input
                  type="time"
                  required
                  value={configJam.jam_masuk_mulai}
                  onChange={(e) => setConfigJam({ ...configJam, jam_masuk_mulai: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-gray-400">Scan sebelum jam ini dicatat sebagai jam awal masuk.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 text-rose-700">Batas Terlambat (Jam Masuk)</label>
                <input
                  type="time"
                  required
                  value={configJam.jam_masuk_batas}
                  onChange={(e) => setConfigJam({ ...configJam, jam_masuk_batas: e.target.value })}
                  className="w-full bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 font-mono font-bold focus:outline-none focus:border-rose-500"
                />
                <p className="text-[10px] text-rose-500">Scan melewati waktu ini otomatis berstatus "Terlambat".</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Jam Pulang Mulai</label>
                <input
                  type="time"
                  required
                  value={configJam.jam_pulang_mulai}
                  onChange={(e) => setConfigJam({ ...configJam, jam_pulang_mulai: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
                <p className="text-[10px] text-gray-400">Batas awal diperbolehkan melakukan scan pulang.</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Jam Operasional</span>
              </button>
            </div>
          </form>

          {/* Kelola Hari Libur */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Kelola Kalender Hari Libur Sekolah</h2>
                <p className="text-xs text-gray-500">Presensi tidak dihitung terlambat / alfa pada tanggal libur resmi</p>
              </div>
            </div>

            <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-purple-50/50 p-4 rounded-xl border border-purple-100">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-900">Tanggal Libur</label>
                <input
                  type="date"
                  required
                  value={newLiburTgl}
                  onChange={(e) => setNewLiburTgl(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs text-gray-900 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-900">Keterangan / Nama Libur</label>
                <input
                  type="text"
                  required
                  value={newLiburKet}
                  onChange={(e) => setNewLiburKet(e.target.value)}
                  className="w-full bg-white border border-purple-200 rounded-xl p-2.5 text-xs text-gray-900 font-medium"
                  placeholder="Misal: Idul Fitri / Libur Semester"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Hari Libur</span>
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Tanggal Libur</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {liburList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-400 font-medium">Belum ada daftar hari libur ditambahkan</td>
                    </tr>
                  ) : (
                    liburList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">{item.tanggal}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800">{item.keterangan}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteHoliday(item.tanggal)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Hapus Hari Libur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KEAMANAN & TOKEN API */}
      {activeTab === "keamanan" && (
        <div className="space-y-6">
          {/* Form Token API */}
          <form onSubmit={handleSaveToken} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Token Keamanan API & Database</h2>
                <p className="text-xs text-gray-500">Token autentikasi rahasia untuk memproteksi akses endpoint database SIAS</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Security Token Key</label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pr-28 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    placeholder="Masukkan token rahasia..."
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-all"
                      title={showToken ? "Sembunyikan Token" : "Tampilkan Token"}
                    >
                      {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(apiToken);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      title="Salin Token"
                    >
                      {copiedToken ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {copiedToken && <p className="text-[10px] text-emerald-600 font-bold">Token berhasil disalin ke clipboard!</p>}
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900">Token digunakan untuk memvalidasi permintaan API dari Google Sheets / Client App</span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateToken}
                  className="bg-white hover:bg-gray-50 text-emerald-700 font-bold text-xs px-3.5 py-2 rounded-lg border border-emerald-200 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Token Baru</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Token API</span>
              </button>
            </div>
          </form>

          {/* Form Ubah Password User */}
          <form onSubmit={handleUbahPassword} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <FolderLock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Ubah Password Akun ({currentUser?.username || "Admin"})</h2>
                <p className="text-xs text-gray-500">Perbarui kata sandi masuk untuk keamanan akun login Anda</p>
              </div>
            </div>

            {passStatus && (
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-emerald-100">
                <CheckCircle className="w-4 h-4" />
                <span>{passStatus}</span>
              </div>
            )}

            {passError && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-rose-100">
                <AlertTriangle className="w-4 h-4" />
                <span>{passError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Password Saat Ini</label>
                <input
                  type="password"
                  required
                  value={passLama}
                  onChange={(e) => setPassLama(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Password Baru</label>
                <input
                  type="password"
                  required
                  value={passBaru}
                  onChange={(e) => setPassBaru(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={passKonfirm}
                  onChange={(e) => setPassKonfirm(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Perbarui Password</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB: STRUKTUR SPREADSHEET & APPS SCRIPT */}
      {activeTab === "spreadsheet" && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-4">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Struktur Sheet Database Google Spreadsheet</h2>
                <p className="text-xs text-gray-500">Konfigurasi nama sheet dan pemetaan kolom untuk sinkronisasi otomatis presensi dan master data</p>
              </div>
            </div>

            {/* Core Database Sheets Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Sheet 1: JadwalGuru */}
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-teal-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                    Sheet: JadwalGuru
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                </div>
                <h3 className="text-xs font-extrabold text-teal-950">Master Jadwal Fleksibel Guru</h3>
                <p className="text-[11px] text-teal-800 leading-relaxed">
                  Menyimpan konfigurasi jadwal harian/fleksibel guru (hari aktif, jam masuk awal, batas terlambat, dan jam pulang).
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100 text-[10px] text-teal-900 font-mono space-y-0.5">
                  <p className="font-bold text-teal-950">Kolom Sheet:</p>
                  <p className="break-all text-slate-700">id_jadwal, id_guru, nama_guru, hari, jam_masuk_mulai, jam_masuk_batas, jam_pulang_mulai</p>
                </div>
              </div>

              {/* Sheet 2: JadwalPelajaran */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                    Sheet: JadwalPelajaran
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-xs font-extrabold text-amber-950">Master Jadwal Pelajaran Guru</h3>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Menyimpan plot jadwal mengajar guru per hari, jam ke, rentang waktu, kelas, mapel, dan ruangan.
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-amber-100 text-[10px] text-amber-900 font-mono space-y-0.5">
                  <p className="font-bold text-amber-950">Kolom Sheet:</p>
                  <p className="break-all text-slate-700">id_jadwal, hari, id_jam, jam_ke, jam_mulai, jam_selesai, kelas, mapel, id_guru, nama_guru, ruangan</p>
                </div>
              </div>

              {/* Sheet 3: PresensiGuru */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                    Sheet: PresensiGuru
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-xs font-extrabold text-indigo-950">Pencatatan Presensi Guru (Jadwal Fleksibel)</h3>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Menyimpan log kehadiran harian guru berdasarkan jam fleksibel / harian (Masuk & Pulang sekolah).
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-indigo-100 text-[10px] text-indigo-900 font-mono space-y-0.5">
                  <p className="font-bold text-indigo-950">Kolom Sheet:</p>
                  <p className="break-all text-slate-700">id_log_guru, tanggal, id_guru, nama_guru, jam_masuk, status_masuk, jam_pulang, status_pulang, ket</p>
                </div>
              </div>

              {/* Sheet 4: AbsensiMengajar */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-purple-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                    Sheet: AbsensiMengajar
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-xs font-extrabold text-purple-950">Pencatatan Absensi Guru (Jadwal Pelajaran)</h3>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Menyimpan jurnal & presensi mengajar guru per jam pelajaran di kelas sesuai jadwal pelajaran aktif.
                </p>
                <div className="bg-white/80 p-2.5 rounded-xl border border-purple-100 text-[10px] text-purple-900 font-mono space-y-0.5">
                  <p className="font-bold text-purple-950">Kolom Sheet:</p>
                  <p className="break-all text-slate-700">id_log_mengajar, tanggal, waktu_absen, hari, id_guru, nama_guru, kelas, mapel, jam_ke, jam_mulai_jadwal, jam_selesai_jadwal, status, catatan_materi</p>
                </div>
              </div>
            </div>

            {/* Additional Sheets Summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 mt-4">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Sheet Database Lainnya pada Google Spreadsheet:</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px]">
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">PresensiSiswa</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">DataSiswa</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">DataGuru</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">DataKelas</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">JamPelajaran</div>
                <div className="bg-white p-2 rounded-xl border border-slate-200 font-mono font-bold text-slate-700 text-center">Pengaturan</div>
              </div>
            </div>
          </div>

          {/* Apps Script Helper Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 space-y-4 shadow-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-extrabold text-white">Kode Google Apps Script (GAS) SIAS</h3>
                  <p className="text-xs text-slate-400">Salin skrip berikut ke menu <b>Ekstensi &gt; Apps Script</b> pada Google Spreadsheet Anda</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const gasCodeText = `/**
 * SIAS Google Apps Script Backend Web App
 * Target Database Sheets:
 * 1. JadwalGuru      -> Jadwal Fleksibel Guru [id_jadwal, id_guru, nama_guru, hari, jam_masuk_mulai, jam_masuk_batas, jam_pulang_mulai]
 * 2. JadwalPelajaran -> Jadwal Pelajaran Guru [id_jadwal, hari, id_jam, jam_ke, jam_mulai, jam_selesai, kelas, mapel, id_guru, nama_guru, ruangan]
 * 3. PresensiGuru    -> Pencatatan Presensi Guru Fleksibel [id_log_guru, tanggal, id_guru, nama_guru, jam_masuk, status_masuk, jam_pulang, status_pulang, ket]
 * 4. AbsensiMengajar -> Pencatatan Presensi Guru Jadwal Mengajar [id_log_mengajar, tanggal, waktu_absen, hari, id_guru, nama_guru, kelas, mapel, jam_ke, jam_mulai_jadwal, jam_selesai_jadwal, status, catatan_materi]
 * 5. PresensiSiswa   -> Presensi Harian Siswa [id_log_siswa, tanggal, id_siswa, nama_siswa, kelas_jurusan, jam_masuk, status_masuk, jam_pulang, status_pulang, ket]
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var rawData = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = rawData.action || "";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    function getOrMakeSheet(name, headers) {
      var s = ss.getSheetByName(name);
      if (!s) {
        s = ss.insertSheet(name);
        if (headers && headers.length > 0) s.appendRow(headers);
      }
      return s;
    }
    
    // 1. JadwalGuru (Jadwal Fleksibel Guru)
    if (action === "getJadwalGuruSemua" || action === "getJadwalGuru") {
      var s = getOrMakeSheet("JadwalGuru", ["id_jadwal", "id_guru", "nama_guru", "hari", "jam_masuk_mulai", "jam_masuk_batas", "jam_pulang_mulai"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, JadwalGuru: data });
    }

    // 2. JadwalPelajaran (Jadwal Pelajaran Guru)
    if (action === "getJadwalPelajaranSemua" || action === "getJadwalPelajaran" || action === "getJadwalSemua") {
      var s = getOrMakeSheet("JadwalPelajaran", ["id_jadwal", "hari", "id_jam", "jam_ke", "jam_mulai", "jam_selesai", "kelas", "mapel", "id_guru", "nama_guru", "ruangan"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, JadwalPelajaran: data });
    }

    // 3. PresensiGuru (Presensi Guru Fleksibel / Harian)
    if (action === "getPresensiGuru" || action === "getLaporanGuru") {
      var s = getOrMakeSheet("PresensiGuru", ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, PresensiGuru: data });
    }
    
    // 4. AbsensiMengajar (Presensi Guru Berdasarkan Jadwal Pelajaran)
    if (action === "getAbsensiMengajarGuru" || action === "getAbsensiMengajar") {
      var s = getOrMakeSheet("AbsensiMengajar", ["id_log_mengajar", "tanggal", "waktu_absen", "hari", "id_guru", "nama_guru", "kelas", "mapel", "jam_ke", "jam_mulai_jadwal", "jam_selesai_jadwal", "status", "catatan_materi"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, AbsensiMengajar: data });
    }

    // 5. PresensiSiswa (Presensi Siswa Harian)
    if (action === "getPresensiSiswa" || action === "getLaporanSiswa") {
      var s = getOrMakeSheet("PresensiSiswa", ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"]);
      var data = getSheetObjects(s);
      return jsonResponse({ success: true, data: data, PresensiSiswa: data });
    }
    
    return jsonResponse({ success: true, message: "OK" });
  } catch (err) {
    return jsonResponse({ success: false, message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getSheetObjects(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var result = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;
                  navigator.clipboard.writeText(gasCodeText);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2500);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedCode ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? "Skrip Disalin!" : "Salin Skrip Apps Script"}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 border border-slate-800">
              <pre>
{`// Target Database Sheets SIAS:
// 1. JadwalGuru      -> [id_jadwal, id_guru, nama_guru, hari, jam_masuk_mulai, jam_masuk_batas, jam_pulang_mulai]
// 2. JadwalPelajaran -> [id_jadwal, hari, id_jam, jam_ke, jam_mulai, jam_selesai, kelas, mapel, id_guru, nama_guru, ruangan]
// 3. PresensiGuru    -> [id_log_guru, tanggal, id_guru, nama_guru, jam_masuk, status_masuk, jam_pulang, status_pulang, ket]
// 4. AbsensiMengajar -> [id_log_mengajar, tanggal, waktu_absen, hari, id_guru, nama_guru, kelas, mapel, jam_ke, jam_mulai_jadwal, jam_selesai_jadwal, status, catatan_materi]
// 5. PresensiSiswa   -> [id_log_siswa, tanggal, id_siswa, nama_siswa, kelas_jurusan, jam_masuk, status_masuk, jam_pulang, status_pulang, ket]`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE DATABASE (DRIVE) */}
      {activeTab === "backup" && (
        <div className="space-y-6">
          {/* Google Drive Configuration & Mode */}
          <form onSubmit={handleSaveBackupConfig} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900">Konfigurasi Backup Google Drive</h2>
                <p className="text-xs text-gray-500">Atur mode cadangan otomatis dan folder penyimpanan cloud Google Drive</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Mode Backup Database</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBackupMode("manual")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      backupMode === "manual" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Manual (Sesuai Kebutuhan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBackupMode("otomatis")}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      backupMode === "otomatis" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Otomatis (Jadwal Teratur)
                  </button>
                </div>
              </div>

              {/* Drive Folder ID */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700">Google Drive Folder ID / Link</label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono focus:outline-none focus:border-blue-500"
                  placeholder="ID folder Drive (contoh: 1a2b3c4d5e...)"
                />
                <p className="text-[10px] text-gray-400">Kosongkan jika ingin menggunakan root folder Google Drive secara default.</p>
              </div>

              {/* Automatic Backup Options */}
              {backupMode === "otomatis" && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Frekuensi Backup</label>
                    <select
                      value={backupFrekuensi}
                      onChange={(e) => setBackupFrekuensi(e.target.value as any)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-bold focus:outline-none focus:border-blue-500"
                    >
                      <option value="harian">Setiap Hari (Harian)</option>
                      <option value="mingguan">Setiap Minggu (Mingguan)</option>
                      <option value="bulanan">Setiap Bulan (Bulanan)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700">Waktu Eksekusi Auto-Backup</label>
                    <input
                      type="time"
                      value={backupJam}
                      onChange={(e) => setBackupJam(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-5">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Konfigurasi Backup</span>
              </button>
            </div>
          </form>

          {/* Action Cards: Instant Backup & Restore */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card Backup Action */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Eksekusi Cadangan Database</h3>
                  <p className="text-[11px] text-gray-500">Terakhir dilakukan: <span className="font-bold text-emerald-600">{lastBackupTime}</span></p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Buat cadangan lengkap seluruh tabel master siswa, guru, kelas, jadwal, dan laporan absensi ke file JSON lokal atau langsung disinkronkan ke Google Drive.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleExportDatabaseJSON}
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleBackupToDrive}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Simpan ke Drive</span>
                </button>
              </div>
            </div>

            {/* Card Restore Action */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">Pulihkan / Restore Database</h3>
                  <p className="text-[11px] text-gray-500">Impor cadangan dari file JSON sebelumnya</p>
                </div>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Unggah file backup `.json` untuk mengembalikan seluruh struktur dan data database SIAS ke kondisi sebelumnya secara instan.
              </p>

              <div className="pt-2">
                <label className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Pilih File Backup JSON untuk Restore</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreJSONFile}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Global Loading Overlay */}
      {loadingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 flex flex-col items-center gap-3 max-w-sm w-full mx-4 text-center">
            <div className="relative flex items-center justify-center w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin relative z-10" />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">{loadingAction}</h4>
              <p className="text-xs text-gray-400 mt-1">Mohon tunggu sebentar, sedang menyimpan pengaturan...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
