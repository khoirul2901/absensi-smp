/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, FormEvent } from "react";
import { 
  ScanQrCode, 
  UserCheck, 
  Clock, 
  Volume2, 
  VolumeX, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Search, 
  Zap, 
  Usb, 
  Calendar,
  Check,
  Building2,
  RefreshCw,
  Info
} from "lucide-react";
import { callGas, getStorageKey, setStorage, getStorage, extractArrayData, getSchoolProfile } from "../lib/gasApi";

interface AutoScanResult {
  id: string;
  name: string;
  role: "Siswa" | "Guru";
  subDetail: string; // e.g. Kelas or NIP
  mode: "Masuk" | "Pulang";
  status: string; // e.g. "Hadir Tepat Waktu"
  timestamp: string;
  dateStr: string;
  scheduleDetail?: string; // e.g. "Terdaftar Mengajar: Jam ke-2 | XI RPL 1 | Pemrograman Web"
  success: boolean;
  message: string;
}

export default function AutoScannerBoard({ session }: { session?: any }) {
  // Scanner Hardware listener states
  const [barcodeInput, setBarcodeInput] = useState("");
  const [autoFocusLock, setAutoFocusLock] = useState(true);
  const barcodeRef = useRef<HTMLInputElement | null>(null);

  // Processing & Audio states
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Master Data Cache
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [allJadwalList, setAllJadwalList] = useState<any[]>([]);
  const [jadwalToday, setJadwalToday] = useState<any[]>([]);
  const [jamSlotsList, setJamSlotsList] = useState<any[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // Result Banner Board State (Kotak status diatas scanner)
  const [lastResult, setLastResult] = useState<AutoScanResult | null>(null);
  const [recentLogs, setRecentLogs] = useState<AutoScanResult[]>([]);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const [showNotificationToast, setShowNotificationToast] = useState<boolean>(false);
  const toastTimeoutRef = useRef<any>(null);

  // Statistics Today
  const [stats, setStats] = useState({
    siswaMasuk: 0,
    guruMasuk: 0,
    mengajarRecord: 0
  });

  // Calculate today stats from storage
  const refreshTodayStats = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const sReports = getStorage("laporan_siswa") || [];
    const gReports = getStorage("laporan_guru") || [];
    const mReports = getStorage("absensi_mengajar_guru") || [];

    const sTodayCount = sReports.filter((r: any) => r.tanggal === todayStr && r.jam_masuk && r.jam_masuk !== "-").length;
    const gTodayCount = gReports.filter((r: any) => r.tanggal === todayStr && r.jam_masuk && r.jam_masuk !== "-").length;
    const mTodayCount = mReports.filter((r: any) => r.tanggal === todayStr).length;

    setStats({
      siswaMasuk: sTodayCount,
      guruMasuk: gTodayCount,
      mengajarRecord: mTodayCount
    });
  };

  // Clock Ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " WIB");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Name Normalizer & Fuzzy Matcher
  const normalizeName = (str: string) => {
    return String(str || "")
      .toLowerCase()
      .replace(/[,.]/g, " ")
      .replace(/\b(s|m|dr|drs|dra|prof|ir|h|hj)\s*\.?\s*(pd|kom|ag|is|si|se|mm|hum|st|pt|tp|sos|ip|ed|pdi|mat|bio|fis|med)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isNameMatch = (n1: string, n2: string) => {
    if (!n1 || !n2) return false;
    const s1 = String(n1).trim().toLowerCase();
    const s2 = String(n2).trim().toLowerCase();
    if (s1 === s2) return true;
    if (s1.includes(s2) || s2.includes(s1)) return true;
    const norm1 = normalizeName(n1);
    const norm2 = normalizeName(n2);
    if (norm1 && norm2 && (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1))) return true;
    return false;
  };

  // Load Master Data & Schedules
  const loadMasterData = async () => {
    setLoadingMaster(true);
    try {
      // 1. Load Siswa
      const resSiswa = await callGas("getDataMaster", ["Siswa"]);
      const sData = extractArrayData(resSiswa);
      if (sData && sData.length > 0) {
        setSiswaList(sData);
        setStorage("data_siswa", sData);
      } else {
        setSiswaList(getStorage("data_siswa") || []);
      }

      // 2. Load Guru
      const resGuru = await callGas("getDataMaster", ["Guru"]);
      const gData = extractArrayData(resGuru);
      if (gData && gData.length > 0) {
        setGuruList(gData);
        setStorage("data_guru", gData);
      } else {
        setGuruList(getStorage("data_guru") || []);
      }

      // 3. Load All Lesson Schedules
      const resJadwal = await callGas("getJadwalPelajaranSemua");
      const jData = extractArrayData(resJadwal);
      if (jData && jData.length > 0) {
        setAllJadwalList(jData);
        setStorage("jadwal_pelajaran", jData);
      } else {
        const storedJadwal = getStorage("jadwal_pelajaran") || [];
        setAllJadwalList(storedJadwal);
      }

      // 4. Load Jam Pelajaran
      const resJam = await callGas("getJamPelajaran");
      const jamData = extractArrayData(resJam);
      if (jamData && jamData.length > 0) {
        setJamSlotsList(jamData);
        setStorage("jam_pelajaran", jamData);
      } else {
        setJamSlotsList(getStorage("jam_pelajaran") || []);
      }

      // 5. Load Flexible Schedules
      const resFlex = await callGas("getJadwalGuruSemua");
      const flexData = extractArrayData(resFlex);
      if (flexData && flexData.length > 0) {
        setStorage("jadwal_guru", flexData);
      }

      // 6. Filter Today's Schedules
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const todayName = days[new Date().getDay()];
      const currentJadwal = (jData && jData.length > 0) ? jData : (getStorage("jadwal_pelajaran") || []);
      const filteredToday = currentJadwal.filter((j: any) => {
        const h = (j.hari || "").trim().toLowerCase();
        return h === todayName.toLowerCase();
      });
      setJadwalToday(filteredToday);

      refreshTodayStats();

    } catch (e) {
      console.error("Gagal load master data auto scanner:", e);
      setSiswaList(getStorage("data_siswa") || []);
      setGuruList(getStorage("data_guru") || []);
      setAllJadwalList(getStorage("jadwal_pelajaran") || []);
    } finally {
      setLoadingMaster(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Auto-focus lock for USB/Bluetooth Hardware Scanner
  useEffect(() => {
    if (autoFocusLock) {
      const focusInput = () => {
        if (barcodeRef.current && document.activeElement !== barcodeRef.current) {
          barcodeRef.current.focus();
        }
      };
      focusInput();
      const interval = setInterval(focusInput, 1500);
      return () => clearInterval(interval);
    }
  }, [autoFocusLock]);

  // Audio & Speech Feedback
  const speakText = (text: string) => {
    if (!speechEnabled || audioMuted) return;
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // clear queue
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "id-ID";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error("Speech Synthesis error:", e);
    }
  };

  const playBeep = (type: "success" | "error" | "info") => {
    if (audioMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "info") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  // CORE AUTO DETECT & SCAN PROCESSOR
  const processAutoScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || isProcessing) return;

    setIsProcessing(true);
    const now = new Date();
    const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const dateString = now.toISOString().split("T")[0];

    try {
      const cleanCode = code.toLowerCase();
      const cleanWithoutPrefix = cleanCode.replace(/^(qr|id|s|g|nisn|nip|siswa|guru|jad|jadwal)[_:\-\s]+/i, '').trim();

      // 1. Direct Schedule ID match across all lesson schedules
      const matchedDirectSched = allJadwalList.find((s: any) => {
        const idJ = String(s.id_jadwal || "").trim().toLowerCase();
        return idJ && (idJ === cleanCode || idJ === cleanWithoutPrefix);
      });

      // 2. Look up in Siswa list by exact ID, NISN, QR Content, or Name
      let matchedSiswa = !matchedDirectSched ? siswaList.find((s: any) => {
        const idS = String(s.id_siswa || "").trim().toLowerCase();
        const nisS = String(s.nisn || s.nis || "").trim().toLowerCase();
        const qrS = String(s.qr_content || s.qr_code || "").trim().toLowerCase();
        return (idS && (idS === cleanCode || idS === cleanWithoutPrefix)) ||
               (nisS && (nisS === cleanCode || nisS === cleanWithoutPrefix)) ||
               (qrS && (qrS === cleanCode || qrS === cleanWithoutPrefix)) ||
               isNameMatch(s.nama_siswa, cleanCode);
      }) : null;

      // 3. Look up in Guru list by exact ID, NIP, QR Content, or Name
      let matchedGuru = guruList.find((g: any) => {
        const idG = String(g.id_guru || "").trim().toLowerCase();
        const nipG = String(g.nip_nuptk || g.nip || "").trim().toLowerCase();
        const qrG = String(g.qr_content || g.qr_code || "").trim().toLowerCase();
        return (idG && (idG === cleanCode || idG === cleanWithoutPrefix)) ||
               (nipG && (nipG === cleanCode || nipG === cleanWithoutPrefix)) ||
               (qrG && (qrG === cleanCode || qrG === cleanWithoutPrefix)) ||
               isNameMatch(g.nama_guru, cleanCode) ||
               isNameMatch(g.nama_guru, cleanWithoutPrefix);
      });

      // If matched by direct schedule QR, resolve teacher from schedule
      if (matchedDirectSched) {
        matchedGuru = guruList.find((g: any) => 
          isNameMatch(g.nama_guru, matchedDirectSched.nama_guru) || 
          String(g.id_guru || "").toLowerCase() === String(matchedDirectSched.id_guru || "").toLowerCase()
        ) || {
          id_guru: matchedDirectSched.id_guru || code,
          nama_guru: matchedDirectSched.nama_guru || "Guru Pengampu"
        };
      }

      // Check if scanned code matches teacher in lesson schedules list
      if (!matchedGuru && !matchedSiswa) {
        const matchedSchedItem = allJadwalList.find((s: any) => {
          const sId = String(s.id_guru || "").trim().toLowerCase();
          return (sId && (sId === cleanCode || sId === cleanWithoutPrefix)) ||
                 isNameMatch(s.nama_guru, cleanCode) ||
                 isNameMatch(s.nama_guru, cleanWithoutPrefix);
        });
        if (matchedSchedItem) {
          matchedGuru = guruList.find((g: any) => 
            isNameMatch(g.nama_guru, matchedSchedItem.nama_guru) || 
            String(g.id_guru || "").toLowerCase() === String(matchedSchedItem.id_guru || "").toLowerCase()
          ) || {
            id_guru: matchedSchedItem.id_guru || code,
            nama_guru: matchedSchedItem.nama_guru || code
          };
        }
      }

      let role: "Guru" | "Siswa" = "Siswa";
      let personObj: any = null;

      if (matchedGuru && !matchedSiswa) {
        role = "Guru";
        personObj = matchedGuru;
      } else if (matchedSiswa) {
        role = "Siswa";
        personObj = matchedSiswa;
      } else if (matchedGuru) {
        role = "Guru";
        personObj = matchedGuru;
      } else {
        // Fallback Heuristics by Prefix
        if (cleanCode.startsWith("g-") || cleanCode.startsWith("guru") || cleanCode.startsWith("nip") || cleanCode.startsWith("g_") || cleanCode.startsWith("jad")) {
          role = "Guru";
        } else {
          role = "Siswa";
        }
      }

      // Auto Mode (Masuk vs Pulang)
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const autoMode: "Masuk" | "Pulang" = currentHour >= 12 ? "Pulang" : "Masuk";
      const isLate = autoMode === "Masuk" && (currentHour > 7 || (currentHour === 7 && currentMinutes > 15));
      const fallbackStatus = autoMode === "Masuk" ? (isLate ? "Terlambat" : "Tepat Waktu") : "Tepat Waktu";

      // Effective code to send
      const effectiveCode = personObj ? (personObj.id_guru || personObj.id_siswa || personObj.nip_nuptk || personObj.nisn || code) : code;

      // 1. PANGGIL BACKEND DATABASE prosesScanQR
      const scanRes = await callGas("prosesScanQR", [effectiveCode, role, autoMode, dateString]);
      
      let realName = "";
      let realRole = role;
      let realStatus = fallbackStatus;
      let realClassOrNip = "-";
      let scheduleNote = "";
      let activeScanType: "masuk" | "pulang" | "mengajar" | "info" = autoMode === "Masuk" ? "masuk" : "pulang";

      if (scanRes && scanRes.success) {
        if (scanRes.type) {
          activeScanType = scanRes.type;
        }

        const rowData = scanRes.data;
        if (rowData) {
          if (rowData.nama_siswa || rowData.id_siswa || rowData.kelas_jurusan) {
            realRole = "Siswa";
            realName = rowData.nama_siswa || personObj?.nama_siswa || personObj?.nama || "";
            realClassOrNip = rowData.kelas_jurusan || (personObj?.kelas ? `${personObj.kelas} ${personObj.jurusan || ""}`.trim() : "Siswa");
            realStatus = activeScanType === "masuk" ? (rowData.status_masuk || fallbackStatus) : (rowData.status_pulang || "Tepat Waktu");
          } else if (rowData.nama_guru || rowData.id_guru) {
            realRole = "Guru";
            realName = rowData.nama_guru || personObj?.nama_guru || personObj?.nama || "";
            realClassOrNip = personObj?.nip_nuptk || personObj?.nip || rowData.id_guru || code;
            if (activeScanType === "mengajar") {
              realStatus = rowData.status || "Hadir Tepat Waktu";
              const jamLabel = rowData.jam_ke_label || `Jam Ke-${rowData.jam_ke}`;
              const mapelStr = rowData.mapel || "Mata Pelajaran";
              const kelasStr = rowData.kelas ? ` (${rowData.kelas})` : "";
              scheduleNote = `Mengajar: ${mapelStr}${kelasStr} • ${jamLabel}`;
            } else if (activeScanType === "masuk") {
              realStatus = rowData.status_masuk || fallbackStatus;
              if (rowData.ket && (rowData.ket.includes("Jadwal") || rowData.ket.includes("Mengajar"))) {
                scheduleNote = rowData.ket;
              }
            } else if (activeScanType === "pulang") {
              realStatus = rowData.status_pulang || "Tepat Waktu";
              if (rowData.ket) scheduleNote = rowData.ket;
            } else {
              realStatus = rowData.status_masuk || "Sudah Masuk";
            }
          }
        }
        if (!realName && scanRes.message) {
          const matchColon = scanRes.message.match(/:\s*([^(]+)/);
          if (matchColon && matchColon[1]) {
            realName = matchColon[1].trim();
          }
        }
      } else if (scanRes && scanRes.success === false) {
        const errorResult: AutoScanResult = {
          id: code,
          name: personObj?.nama_siswa || personObj?.nama_guru || personObj?.nama || code,
          role: role,
          subDetail: "-",
          mode: autoMode,
          status: "Gagal",
          timestamp: timeString,
          dateStr: dateString,
          success: false,
          message: scanRes.message || "Data tidak ditemukan atau belum terdaftar"
        };
        setLastResult(errorResult);
        setRecentLogs(prev => [errorResult, ...prev.slice(0, 19)]);
        setShowNotificationToast(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 5000);
        playBeep("error");
        speakText("Presensi tidak terdaftar atau gagal.");
        return;
      }

      if (!realName) {
        if (realRole === "Siswa") {
          realName = personObj?.nama_siswa || personObj?.nama || `Siswa (${code})`;
          realClassOrNip = personObj?.kelas_jurusan || (personObj?.kelas ? `${personObj.kelas} ${personObj.jurusan || ""}`.trim() : "Siswa");
        } else {
          realName = personObj?.nama_guru || personObj?.nama || `Bapak/Ibu Guru (${code})`;
          realClassOrNip = personObj?.nip_nuptk || personObj?.nip || personObj?.id_guru || code;
        }
      }

      const idTarget = personObj?.id_siswa || personObj?.id_guru || personObj?.nisn || personObj?.nip_nuptk || code;
      const isSuccessful = Boolean(scanRes && scanRes.success !== false);

      const resultObj: AutoScanResult = {
        id: idTarget,
        name: realName,
        role: realRole,
        subDetail: realRole === "Siswa" ? `Kelas: ${realClassOrNip}` : `NIP/ID: ${realClassOrNip}`,
        mode: activeScanType === "mengajar" ? "Masuk" : (activeScanType === "pulang" ? "Pulang" : "Masuk"),
        status: realStatus,
        timestamp: timeString,
        dateStr: dateString,
        scheduleDetail: scheduleNote,
        success: isSuccessful,
        message: scanRes?.message || `Presensi ${realName} Berhasil`
      };

      // Update State & Banner Board
      setLastResult(resultObj);
      setRecentLogs(prev => [resultObj, ...prev.slice(0, 19)]);
      refreshTodayStats();

      // Show floating real-time notification with Person Name
      setShowNotificationToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setShowNotificationToast(false);
      }, 6000);

      // Play Beep & Voice Announcement with Contextual Info
      if (activeScanType === "info") {
        playBeep("info");
        const infoMsg = scanRes?.message || `${realName} sudah presensi.`;
        speakText(infoMsg);
      } else if (activeScanType === "mengajar") {
        playBeep("success");
        const matchData = scanRes?.data;
        const mapelKelasStr = matchData?.mapel ? `${matchData.mapel} ${matchData.kelas ? 'kelas ' + matchData.kelas : ''}` : "jam mengajar";
        speakText(`Presensi mengajar ${realName} berhasil, ${mapelKelasStr}`);
      } else if (activeScanType === "pulang") {
        playBeep("success");
        speakText(`Presensi pulang ${realName} berhasil.`);
      } else {
        playBeep("success");
        speakText(`Presensi masuk ${realName} berhasil.`);
      }

    } catch (err: any) {
      console.error("Error auto scan:", err);
      const errorResult: AutoScanResult = {
        id: code,
        name: code,
        role: "Siswa",
        subDetail: "-",
        mode: "Masuk",
        status: "Gagal",
        timestamp: timeString,
        dateStr: dateString,
        success: false,
        message: `Presensi gagal untuk ${code}: ` + (err?.message || "ID tidak ditemukan")
      };
      setLastResult(errorResult);
      setRecentLogs(prev => [errorResult, ...prev.slice(0, 19)]);
      setShowNotificationToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 5000);
      playBeep("error");
      speakText("Presensi gagal.");
    } finally {
      setIsProcessing(false);
      setBarcodeInput("");
      if (barcodeRef.current) {
        barcodeRef.current.value = "";
        barcodeRef.current.focus();
      }
    }
  };

  const handleBarcodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processAutoScan(barcodeInput.trim());
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12 relative">
      
      {/* REAL-TIME SCAN NOTIFICATION TOAST (MENAMPILKAN NAMA SISWA / GURU) */}
      {showNotificationToast && lastResult && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-md w-full animate-bounce-short">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start gap-3.5 backdrop-blur-md ${
            lastResult.success
              ? "bg-slate-900/95 border-emerald-500/80 text-white"
              : "bg-slate-900/95 border-rose-500/80 text-white"
          }`}>
            <div className={`p-2.5 rounded-xl shrink-0 ${
              lastResult.success ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
            }`}>
              {lastResult.success ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  lastResult.role === "Guru" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                }`}>
                  {lastResult.role} • {lastResult.mode}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{lastResult.timestamp} WIB</span>
              </div>

              {/* NAMA SISWA / GURU TEBAL & JELAS */}
              <div className="text-base font-extrabold text-white tracking-tight">
                {lastResult.name}
              </div>

              <div className="text-xs text-slate-300 flex items-center justify-between gap-2">
                <span>{lastResult.subDetail}</span>
                <span className={`font-bold ${lastResult.status.includes("Terlambat") ? "text-rose-400" : "text-emerald-400"}`}>
                  {lastResult.status}
                </span>
              </div>

              {lastResult.scheduleDetail && (
                <div className="text-[11px] text-amber-300 bg-amber-950/60 border border-amber-500/30 p-1.5 rounded-lg mt-1">
                  {lastResult.scheduleDetail}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowNotificationToast(false)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* HEADER TITLE BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl shadow-md shadow-rose-500/20">
            <ScanQrCode className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              Papan Informasi & Auto Scanner
              <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Live Auto-Detect
              </span>
            </h1>
            <p className="text-xs text-gray-500">
              Mendeteksi otomatis ID Siswa / Guru & mengisi presensi + jadwal mengajar langsung
            </p>
          </div>
        </div>

        {/* Audio & Clock Toolbar */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-sm border border-slate-800 font-mono text-xs font-bold">
            <Clock className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>{currentTimeStr || "00:00:00 WIB"}</span>
          </div>

          <button
            onClick={() => setAudioMuted(!audioMuted)}
            className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              audioMuted 
                ? "bg-rose-50 border-rose-200 text-rose-600" 
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
            title={audioMuted ? "Suara Dimatikan" : "Suara Aktif"}
          >
            {audioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>
      </div>

      {/* 1. HERO STATUS BOARD (1 KOTAK STATUS BERHASIL / BOARD INFORMASI DIATAS FITUR SCANNER) */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-6 sm:p-8 text-white shadow-2xl">
        
        {/* Subtle Background Glow Elements */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          
          {/* Top Banner Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-rose-400" />
              <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                {getSchoolProfile().namaSekolah} — PAPAN INFORMASI PRESENSI LOBI
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Siswa Today: <strong className="text-white">{stats.siswaMasuk}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                <span>Guru Today: <strong className="text-white">{stats.guruMasuk}</strong></span>
              </div>
            </div>
          </div>

          {/* DYNAMIC HERO BOARD CONTENT */}
          {lastResult ? (
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${
              lastResult.success 
                ? "bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 border-emerald-500/40 text-white shadow-lg shadow-emerald-500/10 animate-fade-in" 
                : "bg-gradient-to-r from-rose-950/80 via-rose-900/40 to-slate-900 border-rose-500/40 text-white shadow-lg shadow-rose-500/10"
            }`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                {/* Left Section: Avatar & Details */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border shadow-inner ${
                    lastResult.role === "Guru" 
                      ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300" 
                      : "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                  }`}>
                    {lastResult.role === "Guru" ? <GraduationCap className="w-8 h-8" /> : <UserCheck className="w-8 h-8" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        lastResult.role === "Guru" 
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" 
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}>
                        {lastResult.role}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">{lastResult.subDetail}</span>
                    </div>

                    <h2 className="text-2xl font-black text-white tracking-tight">{lastResult.name}</h2>
                    
                    <p className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lastResult.mode} Jam: <strong className="text-white">{lastResult.timestamp} WIB</strong></span>
                    </p>
                  </div>
                </div>

                {/* Right Section: Badges & Schedule Note */}
                <div className="flex flex-col items-start md:items-end gap-2.5 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      {lastResult.status}
                    </span>
                  </div>

                  {/* Auto Schedule Match Badge for Guru */}
                  {lastResult.scheduleDetail && (
                    <div className="bg-amber-500/20 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 max-w-md">
                      <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{lastResult.scheduleDetail}</span>
                    </div>
                  )}

                  <span className="text-[11px] text-slate-400 italic">
                    {lastResult.message}
                  </span>
                </div>

              </div>
            </div>
          ) : (
            /* STANDBY IDLE BANNER BOARD */
            <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
              <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 animate-bounce" />
              </div>
              <h3 className="text-lg font-extrabold text-white">Papan Informasi Presensi Siap</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Silakan lakukan scan kartu (Siswa / Guru) menggunakan Barcode / QR / RFID Hardware Scanner USB. Sistem akan otomatis mendeteksi ID dan mencatat presensi + jadwal mengajar.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 2. SCANNER INPUT CONTROLS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SCANNER INPUT CARD (DEDICATED HARDWARE SCANNER) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Input Auto Scanner (Hardware USB / Barcode / RFID)
              </h2>
              <p className="text-xs text-gray-500">
                Penerimaan instan dari alat scanner hardware / barcode gun / RFID reader
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Scanner Siap
              </span>
            </div>
          </div>

          {/* HARDWARE USB SCANNER INPUT */}
          <div className="space-y-4">
            <form onSubmit={handleBarcodeSubmit} className="space-y-3">
              <label className="text-xs font-bold text-gray-600 block">
                Scan Barcode / Tempel Kartu ID di Alat Scanner:
              </label>
              
              <div className="relative">
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Standby menunggu scan kartu... (Contoh: S-1001 / G-001)"
                  className="w-full bg-slate-900 text-white font-mono text-base font-bold rounded-xl py-3.5 pl-11 pr-24 border border-slate-800 focus:outline-none focus:border-rose-500 shadow-inner"
                  disabled={isProcessing}
                />
                <Usb className="w-5 h-5 text-rose-400 absolute left-3.5 top-3.5" />
                
                <button
                  type="submit"
                  disabled={isProcessing || !barcodeInput.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-rose-600 text-white font-bold text-xs px-4 rounded-lg hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? "Proses..." : "Scan"}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-xs">
              <span className="text-rose-900 font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-rose-500 shrink-0" />
                Auto Focus aktif untuk memproses hasil scan alat secara langsung
              </span>

              <button
                onClick={() => setAutoFocusLock(!autoFocusLock)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${
                  autoFocusLock ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {autoFocusLock ? "Lock Focus ON" : "Lock Focus OFF"}
              </button>
            </div>
          </div>

        </div>

        {/* QUICK MANUAL SEARCH & RECENT LOGS SIDEBAR */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Log Presensi Terakhir
            </h3>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-8">
                Belum ada log presensi pada sesi ini
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {recentLogs.map((log, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-gray-900">{log.name}</div>
                      <div className="text-[10px] text-gray-500">{log.role} — {log.subDetail}</div>
                    </div>

                    <div className="text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {log.timestamp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={loadMasterData}
            disabled={loadingMaster}
            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMaster ? "animate-spin" : ""}`} />
            Refresh Data Master ({siswaList.length} Siswa / {guruList.length} Guru)
          </button>
        </div>

      </div>

    </div>
  );
}
