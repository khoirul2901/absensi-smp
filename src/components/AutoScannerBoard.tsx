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
  Info,
  ListOrdered,
  Layers,
  Loader2,
  ArrowRight
} from "lucide-react";
import { callGas, getStorageKey, setStorage, getStorage, extractArrayData, getSchoolProfile, parseTimeToMinutes } from "../lib/gasApi";

export interface QueueItem {
  queueId: string;
  rawCode: string;
  enqueuedAt: string;
  previewName?: string;
  previewRole?: "Siswa" | "Guru";
  previewSubDetail?: string;
  status: "pending" | "processing" | "completed" | "error";
  result?: AutoScanResult;
}

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

  // Queue Architecture States for Rapid Consecutive Scanning
  const [scanQueue, setScanQueue] = useState<QueueItem[]>([]);
  const scanQueueRef = useRef<QueueItem[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const recentScannedCodesRef = useRef<{ [code: string]: number }>({});

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
  const [flexSchedulesList, setFlexSchedulesList] = useState<any[]>([]);
  const [absensiMengajarLogs, setAbsensiMengajarLogs] = useState<any[]>([]);
  const [batasiJamJadwal, setBatasiJamJadwal] = useState<boolean>(true);
  const [toleransiAwal, setToleransiAwal] = useState<number>(15);
  const [toleransiAkhir, setToleransiAkhir] = useState<number>(30);
  const [toleransiGuru, setToleransiGuru] = useState<number>(15);
  const [configJam, setConfigJam] = useState<any>(() => getStorage("pengaturan_jam") || {});
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "jadwalToday">("logs");

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
      // 1. Fetch Parallel Data
      const [resSiswa, resGuru, resJadwal, resJam, resFlex, resLogsMengajar, resCfg] = await Promise.all([
        callGas("getDataMaster", ["Siswa"]),
        callGas("getDataMaster", ["Guru"]),
        callGas("getJadwalPelajaranSemua"),
        callGas("getJamPelajaran"),
        callGas("getJadwalGuruSemua"),
        callGas("getAbsensiMengajarGuru"),
        callGas("getPengaturanSemua")
      ]);

      // Process Siswa
      const sData = extractArrayData(resSiswa);
      if (sData && sData.length > 0) {
        setSiswaList(sData);
        setStorage("data_siswa", sData);
      } else {
        setSiswaList(getStorage("data_siswa") || []);
      }

      // Process Guru
      const gData = extractArrayData(resGuru);
      if (gData && gData.length > 0) {
        setGuruList(gData);
        setStorage("data_guru", gData);
      } else {
        setGuruList(getStorage("data_guru") || []);
      }

      // Process Lesson Schedules
      const jData = extractArrayData(resJadwal);
      if (jData && jData.length > 0) {
        setAllJadwalList(jData);
        setStorage("jadwal_pelajaran", jData);
      } else {
        const storedJadwal = getStorage("jadwal_pelajaran") || [];
        setAllJadwalList(storedJadwal);
      }

      // Process Jam Pelajaran
      const jamData = extractArrayData(resJam);
      if (jamData && jamData.length > 0) {
        setJamSlotsList(jamData);
        setStorage("jam_pelajaran", jamData);
      } else {
        setJamSlotsList(getStorage("jam_pelajaran") || []);
      }

      // Process Flexible Schedules
      const flexData = extractArrayData(resFlex);
      if (flexData && flexData.length > 0) {
        setFlexSchedulesList(flexData);
        setStorage("jadwal_guru", flexData);
      } else {
        setFlexSchedulesList(getStorage("jadwal_guru") || []);
      }

      // Process Absensi Mengajar Logs
      const logsMengajar = extractArrayData(resLogsMengajar);
      if (logsMengajar && logsMengajar.length > 0) {
        setAbsensiMengajarLogs(logsMengajar);
        setStorage("absensi_mengajar_guru", logsMengajar);
      } else {
        setAbsensiMengajarLogs(getStorage("absensi_mengajar_guru") || []);
      }

      // Process Settings
      const cfg = resCfg?.data || resCfg;
      if (cfg && typeof cfg === "object") {
        setConfigJam(cfg);
        if (cfg.batasi_jam_jadwal !== undefined) setBatasiJamJadwal(Boolean(cfg.batasi_jam_jadwal));
        if (cfg.toleransi_awal_menit !== undefined) setToleransiAwal(Number(cfg.toleransi_awal_menit) || 15);
        if (cfg.toleransi_akhir_menit !== undefined) setToleransiAkhir(Number(cfg.toleransi_akhir_menit) || 30);
        const val = Number(cfg.toleransi_guru ?? cfg.toleransi_mengajar_guru);
        if (!isNaN(val) && val >= 0) setToleransiGuru(val);
      }

      // Filter Today's Schedules
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
      setFlexSchedulesList(getStorage("jadwal_guru") || []);
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

  // Helper to accurately get start & end times for a specific lesson hour (jam_ke)
  const getJamSlotTime = (jamKeNum: number | string, fallbackMulai?: string, fallbackSelesai?: string) => {
    const slot = jamSlotsList.find((j: any) => Number(j.jam_ke) === Number(jamKeNum));
    const mulai = slot ? slot.jam_mulai : (fallbackMulai && fallbackMulai !== "-" ? fallbackMulai : "-");
    const selesai = slot ? slot.jam_selesai : (fallbackSelesai && fallbackSelesai !== "-" ? fallbackSelesai : "-");
    return { mulai, selesai };
  };

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

  const playBeep = (type: "success" | "error" | "info" | "capture") => {
    if (audioMuted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "capture") {
        // Instant soft high-pitch chirp for rapid card capture into queue
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.07);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.07);
      } else if (type === "success") {
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

  // Instant Quick Match for Queue Visualizer
  const peekPersonPreview = (code: string) => {
    const cleanCode = code.toLowerCase().trim();
    const cleanWithoutPrefix = cleanCode.replace(/^(qr|id|s|g|nisn|nip|siswa|guru|jad|jadwal)[_:\-\s]+/i, '').trim();

    // 1. Direct match in schedules
    const matchedDirectSched = allJadwalList.find((s: any) => {
      const idJ = String(s.id_jadwal || "").trim().toLowerCase();
      return idJ && (idJ === cleanCode || idJ === cleanWithoutPrefix);
    });
    if (matchedDirectSched) {
      return {
        name: matchedDirectSched.nama_guru || "Guru Pengampu",
        role: "Guru" as const,
        subDetail: `${matchedDirectSched.mapel || "Pelajaran"} (${matchedDirectSched.kelas || "-"})`
      };
    }

    // 2. Siswa
    const matchedSiswa = siswaList.find((s: any) => {
      const idS = String(s.id_siswa || "").trim().toLowerCase();
      const nisS = String(s.nisn || s.nis || "").trim().toLowerCase();
      const qrS = String(s.qr_content || s.qr_code || "").trim().toLowerCase();
      return (idS && (idS === cleanCode || idS === cleanWithoutPrefix)) ||
             (nisS && (nisS === cleanCode || nisS === cleanWithoutPrefix)) ||
             (qrS && (qrS === cleanCode || qrS === cleanWithoutPrefix)) ||
             isNameMatch(s.nama_siswa, cleanCode) ||
             isNameMatch(s.nama_siswa, cleanWithoutPrefix);
    });
    if (matchedSiswa) {
      return {
        name: matchedSiswa.nama_siswa || matchedSiswa.nama || "Siswa",
        role: "Siswa" as const,
        subDetail: matchedSiswa.kelas ? `Kelas ${matchedSiswa.kelas}` : "Siswa"
      };
    }

    // 3. Guru
    const matchedGuru = guruList.find((g: any) => {
      const idG = String(g.id_guru || "").trim().toLowerCase();
      const nipG = String(g.nip_nuptk || g.nip || "").trim().toLowerCase();
      const qrG = String(g.qr_content || g.qr_code || "").trim().toLowerCase();
      return (idG && (idG === cleanCode || idG === cleanWithoutPrefix)) ||
             (nipG && (nipG === cleanCode || nipG === cleanWithoutPrefix)) ||
             (qrG && (qrG === cleanCode || qrG === cleanWithoutPrefix)) ||
             isNameMatch(g.nama_guru, cleanCode) ||
             isNameMatch(g.nama_guru, cleanWithoutPrefix);
    });
    if (matchedGuru) {
      return {
        name: matchedGuru.nama_guru || matchedGuru.nama || "Guru",
        role: "Guru" as const,
        subDetail: matchedGuru.nip_nuptk ? `NIP: ${matchedGuru.nip_nuptk}` : "Guru"
      };
    }

    // Default fallback
    const isGuruPrefix = cleanCode.startsWith("g-") || cleanCode.startsWith("guru") || cleanCode.startsWith("nip") || cleanCode.startsWith("g_") || cleanCode.startsWith("jpel") || cleanCode.startsWith("jad");
    return {
      name: code,
      role: isGuruPrefix ? ("Guru" as const) : ("Siswa" as const),
      subDetail: "ID: " + code
    };
  };

  // CORE AUTO DETECT & SCAN PROCESSOR (PRESERVING ALL 3 ACUAN RULES)
  const processAutoScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const dateString = now.toISOString().split("T")[0];
    const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const todayName = daysMap[now.getDay()] || "Senin";
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const nowMin = currentHour * 60 + currentMinutes;

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
               isNameMatch(s.nama_siswa, cleanCode) ||
               isNameMatch(s.nama_siswa, cleanWithoutPrefix);
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

      // Check if scanned code matches teacher in flexible schedules list
      if (!matchedGuru && !matchedSiswa) {
        const matchedFlexItem = flexSchedulesList.find((f: any) => {
          const fId = String(f.id_guru || "").trim().toLowerCase();
          return (fId && (fId === cleanCode || fId === cleanWithoutPrefix)) ||
                 isNameMatch(f.nama_guru, cleanCode) ||
                 isNameMatch(f.nama_guru, cleanWithoutPrefix);
        });
        if (matchedFlexItem) {
          matchedGuru = guruList.find((g: any) => 
            isNameMatch(g.nama_guru, matchedFlexItem.nama_guru) || 
            String(g.id_guru || "").toLowerCase() === String(matchedFlexItem.id_guru || "").toLowerCase()
          ) || {
            id_guru: matchedFlexItem.id_guru || code,
            nama_guru: matchedFlexItem.nama_guru || code
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
        if (cleanCode.startsWith("g-") || cleanCode.startsWith("guru") || cleanCode.startsWith("nip") || cleanCode.startsWith("g_") || cleanCode.startsWith("jpel") || cleanCode.startsWith("jad")) {
          role = "Guru";
        } else {
          role = "Siswa";
        }
      }

      // =========================================================================
      // 3 ACUAN UTAMA PRESENSI OTOMATIS:
      // 1. SISWA (Jam Masuk & Pulang Sekolah) -> PresensiSiswa
      // 2. GURU JADWAL PELAJARAN (Jam Mengajar per Jam/Blok) -> AbsensiMengajar (TIDAK BUTUH JADWAL FLEKSIBEL)
      // 3. GURU JADWAL FLEKSIBEL (Jadwal Piket Terdaftar di JadwalGuru) -> PresensiGuru
      // 4. GURU REGULER (Presensi Guru Harian Standar) -> PresensiGuru
      // =========================================================================

      // -------------------------------------------------------------------------
      // ACUAN 1: SISWA (MURID)
      // -------------------------------------------------------------------------
      if (role === "Siswa") {
        const effectiveCode = personObj ? (personObj.id_siswa || personObj.nisn || personObj.nis || code) : code;
        const autoModeSiswa: "Masuk" | "Pulang" = currentHour >= 12 ? "Pulang" : "Masuk";
        const scanRes = await callGas("prosesScanQR", [effectiveCode, "Siswa", autoModeSiswa, dateString]);

        if (scanRes && scanRes.success !== false) {
          const rowData = scanRes.data || {};
          const realName = rowData.nama_siswa || personObj?.nama_siswa || personObj?.nama || code;
          const realClass = rowData.kelas_jurusan || (personObj?.kelas ? `${personObj.kelas} ${personObj.jurusan || ""}`.trim() : "Siswa");
          
          const batasMasukMin = parseTimeToMinutes(configJam.jam_masuk_batas || "07:15");
          const toleransiSiswa = Number(configJam.toleransi_keterlambatan || configJam.toleransi_siswa || 0);
          const isLateSiswa = nowMin > ((batasMasukMin >= 0 ? batasMasukMin : (7 * 60 + 15)) + toleransiSiswa);
          const fallbackStatusSiswa = isLateSiswa ? "Terlambat" : "Tepat Waktu";
          const realStatus = autoModeSiswa === "Masuk" ? (rowData.status_masuk || fallbackStatusSiswa) : (rowData.status_pulang || "Tepat Waktu");

          const successResult: AutoScanResult = {
            id: effectiveCode,
            name: realName,
            role: "Siswa",
            subDetail: `Kelas: ${realClass}`,
            mode: autoModeSiswa,
            status: realStatus,
            timestamp: timeString,
            dateStr: dateString,
            success: true,
            message: scanRes.message || `Presensi ${autoModeSiswa} Siswa Berhasil: ${realName}`
          };

          setLastResult(successResult);
          setRecentLogs(prev => [successResult, ...prev.slice(0, 19)]);
          refreshTodayStats();

          setShowNotificationToast(true);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);

          playBeep("success");
          speakText(`Presensi ${autoModeSiswa.toLowerCase()} ${realName} berhasil.`);
          return;
        } else {
          const errorMsg = scanRes?.message || `Presensi siswa gagal untuk ${code}`;
          const errorResult: AutoScanResult = {
            id: effectiveCode,
            name: personObj?.nama_siswa || personObj?.nama || code,
            role: "Siswa",
            subDetail: personObj?.kelas ? `Kelas: ${personObj.kelas}` : "-",
            mode: autoModeSiswa,
            status: "Ditolak",
            timestamp: timeString,
            dateStr: dateString,
            success: false,
            message: errorMsg
          };
          setLastResult(errorResult);
          setRecentLogs(prev => [errorResult, ...prev.slice(0, 19)]);
          setShowNotificationToast(true);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);
          playBeep("error");
          speakText(errorMsg);
          return;
        }
      }

      // =========================================================================
      // JIKA ROLE GURU -> PROSES BERDASARKAN ACUAN JADWAL PELAJARAN / JADWAL FLEKSIBEL (PIKET)
      // =========================================================================
      const guruId = personObj?.id_guru || personObj?.id || code;
      const guruNama = personObj?.nama_guru || personObj?.nama || code;
      const guruNip = personObj?.nip_nuptk || personObj?.nip || guruId;

      // 1. Ambil daftar seluruh jadwal mengajar guru di JadwalPelajaran
      const allTeacherTeachingSchedules = allJadwalList.filter((s: any) => 
        (s.id_guru && String(s.id_guru).trim().toLowerCase() === String(guruId).trim().toLowerCase()) ||
        isNameMatch(s.nama_guru, guruNama) ||
        (matchedDirectSched && String(s.id_jadwal) === String(matchedDirectSched.id_jadwal))
      );

      const todayTeachingSchedules = allTeacherTeachingSchedules.filter((s: any) => 
        (s.hari || "").trim().toLowerCase() === todayName.toLowerCase()
      );

      // 2. Ambil daftar jadwal fleksibel/piket guru di JadwalGuru
      const guruFlexEntries = flexSchedulesList.filter((f: any) => 
        String(f.id_guru || "").trim().toLowerCase() === String(guruId).trim().toLowerCase() ||
        isNameMatch(f.nama_guru, guruNama)
      );

      const todayFlex = guruFlexEntries.find((f: any) => 
        (f.hari || "").trim().toLowerCase() === todayName.toLowerCase()
      );

      // -------------------------------------------------------------------------
      // ACUAN 3: GURU JADWAL PELAJARAN (MENGAJAR)
      // Guru pengampu jadwal pelajaran TIDAK PERLU memiliki jadwal fleksibel/piket!
      // Acuan: Jadwal Pelajaran (hari, jam_ke, slot waktu mulai & selesai)
      // Target: Sheet AbsensiMengajar
      // -------------------------------------------------------------------------
      if (todayTeachingSchedules.length > 0) {
        // Cek jam aktif jadwal mengajar saat ini
        const activeSchedMatches = todayTeachingSchedules.filter((s: any) => {
          const { mulai, selesai } = getJamSlotTime(s.jam_ke, s.jam_mulai, s.jam_selesai);
          if (!mulai || mulai === "-" || !selesai || selesai === "-") return true;
          const [hM, mM] = mulai.split(":").map(Number);
          const [hS, mS] = selesai.split(":").map(Number);
          if (isNaN(hM) || isNaN(mM) || isNaN(hS) || isNaN(mS)) return true;
          const startMin = hM * 60 + mM;
          const endMin = hS * 60 + mS;
          return nowMin >= startMin - toleransiAwal && nowMin <= endMin + toleransiAkhir;
        });

        // Jika waktu scan cocok dengan jam pelajaran aktif ATAU batasi jam dimatikan ATAU scan spesifik QR jadwal
        if (!batasiJamJadwal || activeSchedMatches.length > 0 || matchedDirectSched) {
          // Cari jadwal mengajar yang belum diabsen
          const loggedScheduleJamSet = new Set(
            absensiMengajarLogs
              .filter((l: any) => 
                String(l.tanggal || "").split("T")[0] === dateString &&
                (String(l.id_guru) === String(guruId) || isNameMatch(l.nama_guru, guruNama))
              )
              .map((l: any) => `${l.kelas}_${l.jam_ke}`)
          );

          const candidateSchedules = activeSchedMatches.length > 0 ? activeSchedMatches : todayTeachingSchedules;
          const targetSched = candidateSchedules.find((s: any) => !loggedScheduleJamSet.has(`${s.kelas}_${s.jam_ke}`)) || candidateSchedules[0];

          // Ambil seluruh blok multi-jam pelajaran berurutan untuk kelas & mapel yang sama (1x Scan)
          const matchingSchedules = todayTeachingSchedules.filter((s: any) => 
            String(s.kelas).trim().toLowerCase() === String(targetSched.kelas).trim().toLowerCase() &&
            String(s.mapel).trim().toLowerCase() === String(targetSched.mapel).trim().toLowerCase()
          );

          const targetList = matchingSchedules.length > 0 ? matchingSchedules : [targetSched];

          // Hitung status ketepatan waktu berdasarkan jam mulai slot pertama + toleransi guru
          const firstSlot = targetList[0];
          const { mulai: firstMulai } = getJamSlotTime(firstSlot.jam_ke, firstSlot.jam_mulai, firstSlot.jam_selesai);
          let statusMengajar = "Hadir Tepat Waktu";
          const firstStartMin = parseTimeToMinutes(firstMulai);
          if (firstStartMin >= 0) {
            if (nowMin > firstStartMin + toleransiGuru) {
              statusMengajar = "Terlambat Masuk Kelas";
            }
          }

          // Simpan seluruh jam pelajaran ke database AbsensiMengajar
          const savedLogs: any[] = [];
          for (const schedItem of targetList) {
            const { mulai: sMulai, selesai: sSelesai } = getJamSlotTime(schedItem.jam_ke, schedItem.jam_mulai, schedItem.jam_selesai);
            const itemPayload = {
              id_log_mengajar: `LOG-MENG-${Date.now()}-${schedItem.jam_ke}-${Math.floor(Math.random() * 1000)}`,
              tanggal: dateString,
              waktu_absen: timeString,
              hari: todayName,
              id_guru: targetSched.id_guru || schedItem.id_guru || guruId,
              nama_guru: targetSched.nama_guru || schedItem.nama_guru || guruNama,
              kelas: schedItem.kelas || targetSched.kelas,
              mapel: schedItem.mapel || targetSched.mapel,
              jam_ke: Number(schedItem.jam_ke),
              jam_mulai_jadwal: sMulai !== "-" ? sMulai : (schedItem.jam_mulai || "07:00"),
              jam_selesai_jadwal: sSelesai !== "-" ? sSelesai : (schedItem.jam_selesai || "07:45"),
              status: statusMengajar,
              catatan_materi: "Presensi Otomatis Scan QR"
            };

            await callGas("simpanAbsensiMengajarGuru", [itemPayload]);
            savedLogs.push(itemPayload);
          }

          // Perbarui state log presensi mengajar lokal
          setAbsensiMengajarLogs(prev => [...savedLogs, ...prev]);

          // JIKA GURU JUGA MEMILIKI JADWAL FLEKSIBEL (PIKET) DI HARI INI, CATAT JUGA KE SHEET PresensiGuru
          let flexStatusNote = "";
          if (todayFlex) {
            const autoModePiket: "Masuk" | "Pulang" = currentHour >= 12 ? "Pulang" : "Masuk";
            const effectiveCode = personObj ? (personObj.id_guru || personObj.nip_nuptk || code) : code;
            await callGas("prosesScanQR", [effectiveCode, "Guru", autoModePiket, dateString]);
            flexStatusNote = " • Piket & Mengajar (Tercatat di AbsensiMengajar & PresensiGuru)";
          }

          const jamNumbers = targetList.map((s: any) => Number(s.jam_ke)).sort((a: number, b: number) => a - b);
          const minJam = jamNumbers[0] || targetSched.jam_ke;
          const maxJam = jamNumbers[jamNumbers.length - 1] || targetSched.jam_ke;
          const jamLabel = targetList.length > 1
            ? `Blok ${targetList.length} Jam (Jam ke-${minJam} s/d Jam ke-${maxJam})`
            : `Jam Ke-${targetSched.jam_ke}`;

          const successResult: AutoScanResult = {
            id: guruId,
            name: guruNama,
            role: "Guru",
            subDetail: `NIP: ${guruNip}${todayFlex ? ' • Guru Piket & Mengajar' : ''}`,
            mode: "Masuk",
            status: statusMengajar,
            timestamp: timeString,
            dateStr: dateString,
            scheduleDetail: `Mengajar: ${targetSched.mapel} (${targetSched.kelas}) • ${jamLabel}${flexStatusNote ? ' (Tercatat di 2 Sheet: AbsensiMengajar & PresensiGuru)' : ''}`,
            success: true,
            message: `Presensi Berhasil: ${guruNama} (${targetSched.mapel} ${targetSched.kelas}, ${jamLabel}) - ${statusMengajar}${flexStatusNote}`
          };

          setLastResult(successResult);
          setRecentLogs(prev => [successResult, ...prev.slice(0, 19)]);
          refreshTodayStats();

          setShowNotificationToast(true);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);

          playBeep("success");
          speakText(`Presensi mengajar ${guruNama} berhasil. ${targetSched.mapel} kelas ${targetSched.kelas}.`);
          return;
        } else if (batasiJamJadwal && activeSchedMatches.length === 0 && !todayFlex) {
          // Guru punya jadwal hari ini tetapi scan di luar jam pelajaran aktif dan tidak sedang piket hari ini
          const schedListTimes = todayTeachingSchedules.map((s: any) => {
            const { mulai, selesai } = getJamSlotTime(s.jam_ke, s.jam_mulai, s.jam_selesai);
            return `Jam ${s.jam_ke} (${s.mapel} ${s.kelas}: ${mulai} - ${selesai})`;
          }).join("; ");

          const errorMsg = `Presensi Mengajar Ditolak: Di luar jam jadwal pelajaran. Guru '${guruNama}' (jam ${timeString} WIB) tidak memiliki jadwal aktif saat ini. Jadwal hari ${todayName}: ${schedListTimes}`;
          
          const errorResult: AutoScanResult = {
            id: guruId,
            name: guruNama,
            role: "Guru",
            subDetail: `NIP: ${guruNip}`,
            mode: "Masuk",
            status: "Ditolak",
            timestamp: timeString,
            dateStr: dateString,
            success: false,
            message: errorMsg
          };
          setLastResult(errorResult);
          setRecentLogs(prev => [errorResult, ...prev.slice(0, 19)]);
          setShowNotificationToast(true);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);
          playBeep("error");
          speakText("Presensi mengajar ditolak. Di luar jam jadwal pelajaran.");
          return;
        }
      }

      // Jika guru memiliki jadwal mengajar di hari lain tetapi TIDAK ADA jadwal mengajar di hari ini (dan tidak ada jadwal piket hari ini)
      if (allTeacherTeachingSchedules.length > 0 && todayTeachingSchedules.length === 0 && guruFlexEntries.length === 0) {
        const availableDays = Array.from(new Set(allTeacherTeachingSchedules.map((s: any) => s.hari))).join(", ");
        const errorMsg = `Presensi Mengajar Ditolak: Guru '${guruNama}' tidak memiliki jadwal mengajar di hari ${todayName}. Jadwal mengajar terdaftar pada hari: ${availableDays}`;
        
        const errorResult: AutoScanResult = {
          id: guruId,
          name: guruNama,
          role: "Guru",
          subDetail: `NIP: ${guruNip}`,
          mode: currentHour >= 12 ? "Pulang" : "Masuk",
          status: "Ditolak",
          timestamp: timeString,
          dateStr: dateString,
          success: false,
          message: errorMsg
        };
        setLastResult(errorResult);
        setRecentLogs(prev => [errorResult, ...prev.slice(0, 19)]);
        setShowNotificationToast(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);
        playBeep("error");
        speakText(`Presensi ditolak. Jadwal mengajar ${guruNama} ada di hari ${availableDays}.`);
        return;
      }

      // -------------------------------------------------------------------------
      // ACUAN 2: GURU JADWAL FLEKSIBEL (GURU PIKET / HARIAN TERJADWAL)
      // Digunakan khusus untuk guru yang bertugas piket / memiliki jadwal hadir di JadwalGuru
      // Target: Sheet PresensiGuru
      // -------------------------------------------------------------------------
      if (guruFlexEntries.length > 0) {
        if (!todayFlex && todayTeachingSchedules.length === 0) {
          // Guru terdaftar di jadwal fleksibel/piket tapi BUKAN hari ini
          const activeFlexDays = Array.from(new Set(guruFlexEntries.map((f: any) => f.hari))).join(", ");
          const errorMsg = `Presensi Piket Ditolak: Guru '${guruNama}' tidak memiliki jadwal piket di hari ${todayName}. Jadwal piket terdaftar pada hari: ${activeFlexDays}`;
          
          const errorResult: AutoScanResult = {
            id: guruId,
            name: guruNama,
            role: "Guru",
            subDetail: `NIP: ${guruNip}`,
            mode: currentHour >= 12 ? "Pulang" : "Masuk",
            status: "Ditolak",
            timestamp: timeString,
            dateStr: dateString,
            success: false,
            message: errorMsg
          };
          setLastResult(errorResult);
          setRecentLogs(prev => [errorResult, ...prev.slice(0, 19)]);
          setShowNotificationToast(true);
          if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
          toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);
          playBeep("error");
          speakText(`Presensi piket ditolak. ${guruNama} tidak memiliki jadwal di hari ${todayName}.`);
          return;
        }

        if (todayFlex) {
          // Guru memiliki jadwal piket hari ini
          const autoModePiket: "Masuk" | "Pulang" = currentHour >= 12 ? "Pulang" : "Masuk";
          const effectiveCode = personObj ? (personObj.id_guru || personObj.nip_nuptk || code) : code;
          const scanRes = await callGas("prosesScanQR", [effectiveCode, "Guru", autoModePiket, dateString]);

          if (scanRes && scanRes.success !== false) {
            const rowData = scanRes.data || {};
            const isPiketMasuk = autoModePiket === "Masuk";
            const piketStatus = isPiketMasuk ? (rowData.status_masuk || "Tepat Waktu") : (rowData.status_pulang || "Tepat Waktu");
            const piketNote = `Guru Piket: ${todayFlex.hari} (Masuk ${todayFlex.jam_masuk_mulai || "06:30"} - Pulang ${todayFlex.jam_pulang_mulai || "14:00"})`;

            const successResult: AutoScanResult = {
              id: guruId,
              name: guruNama,
              role: "Guru",
              subDetail: `NIP: ${guruNip} • Guru Piket`,
              mode: autoModePiket,
              status: piketStatus,
              timestamp: timeString,
              dateStr: dateString,
              scheduleDetail: piketNote,
              success: true,
              message: `Presensi Piket ${autoModePiket} Berhasil: ${guruNama} (${piketStatus})`
            };

            setLastResult(successResult);
            setRecentLogs(prev => [successResult, ...prev.slice(0, 19)]);
            refreshTodayStats();

            setShowNotificationToast(true);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);

            playBeep("success");
            speakText(`Presensi piket ${autoModePiket.toLowerCase()} ${guruNama} berhasil.`);
            return;
          } else {
            const errorMsg = scanRes?.message || `Presensi piket gagal untuk ${guruNama}`;
            const errorResult: AutoScanResult = {
              id: guruId,
              name: guruNama,
              role: "Guru",
              subDetail: `NIP: ${guruNip}`,
              mode: autoModePiket,
              status: "Ditolak",
              timestamp: timeString,
              dateStr: dateString,
              success: false,
              message: errorMsg
            };
            setLastResult(errorResult);
            setRecentLogs(prev => [errorResult, ...prev.slice(0, 19)]);
            setShowNotificationToast(true);
            if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
            toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);
            playBeep("error");
            speakText(errorMsg);
            return;
          }
        }
      }

      // -------------------------------------------------------------
      // ACUAN 4: GURU REGULER (HARIAN UMUM)
      // Guru yang tidak memiliki jadwal pelajaran dan bukan piket fleksibel
      // Target: Sheet PresensiGuru
      // -------------------------------------------------------------
      const autoMode: "Masuk" | "Pulang" = currentHour >= 12 ? "Pulang" : "Masuk";
      const guruBatasMasukMin = parseTimeToMinutes(configJam.jam_masuk_batas || "07:15");
      const isLate = autoMode === "Masuk" && (nowMin > ((guruBatasMasukMin >= 0 ? guruBatasMasukMin : (7 * 60 + 15)) + toleransiGuru));
      const fallbackStatus = autoMode === "Masuk" ? (isLate ? "Terlambat" : "Tepat Waktu") : "Tepat Waktu";

      // =========================================================================
      // REGULAR ATTENDANCE FLOW (GURU HARIAN UMUM)
      // =========================================================================
      const effectiveCode = personObj ? (personObj.id_guru || personObj.nip_nuptk || code) : code;

      // PANGGIL BACKEND DATABASE prosesScanQR
      const scanRes = await callGas("prosesScanQR", [effectiveCode, "Guru", autoMode, dateString]);
      
      let realName = "";
      let realRole: "Guru" | "Siswa" = "Guru";
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
              if (rowData.ket && (rowData.ket.includes("Jadwal") || rowData.ket.includes("Mengajar") || rowData.ket.includes("Fleksibel"))) {
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
          role: "Guru",
          subDetail: "-",
          mode: autoMode,
          status: "Ditolak",
          timestamp: timeString,
          dateStr: dateString,
          success: false,
          message: scanRes.message || "Data tidak ditemukan atau jadwal tidak sesuai"
        };
        setLastResult(errorResult);
        setRecentLogs(prev => [errorResult, ...prev.slice(0, 19)]);
        setShowNotificationToast(true);
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 6000);
        playBeep("error");
        speakText(scanRes.message || "Presensi ditolak.");
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
      if (barcodeRef.current && autoFocusLock && document.activeElement !== barcodeRef.current) {
        barcodeRef.current.focus();
      }
    }
  };

  // BACKGROUND FIFO QUEUE WORKER
  const triggerQueueWorker = async () => {
    if (isProcessingQueueRef.current) return;
    isProcessingQueueRef.current = true;
    setIsProcessing(true);

    while (scanQueueRef.current.length > 0) {
      const currentItem = scanQueueRef.current[0];
      currentItem.status = "processing";
      setScanQueue([...scanQueueRef.current]);

      try {
        await processAutoScan(currentItem.rawCode);
      } catch (err) {
        console.error("Queue execution error:", err);
      }

      // Pop processed item from FIFO queue
      scanQueueRef.current.shift();
      setScanQueue([...scanQueueRef.current]);
    }

    isProcessingQueueRef.current = false;
    setIsProcessing(false);
  };

  // RAPID SCAN ENQUEUE HANDLER
  const enqueueScan = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    const nowMs = Date.now();
    const lastScanTime = recentScannedCodesRef.current[code.toLowerCase()] || 0;
    
    // Cooldown only for exact duplicate code within 2.5 seconds (prevent barcode beam repeat bounce)
    if (nowMs - lastScanTime < 2500) {
      playBeep("info");
      return;
    }
    recentScannedCodesRef.current[code.toLowerCase()] = nowMs;

    const preview = peekPersonPreview(code);

    const newItem: QueueItem = {
      queueId: `Q-${nowMs}-${Math.floor(Math.random() * 1000)}`,
      rawCode: code,
      enqueuedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      previewName: preview.name,
      previewRole: preview.role,
      previewSubDetail: preview.subDetail,
      status: "pending"
    };

    // Immediate acoustic & optical feedback for instant card capture
    playBeep("capture");

    scanQueueRef.current.push(newItem);
    setScanQueue([...scanQueueRef.current]);

    // Trigger queue processor seamlessly
    triggerQueueWorker();
  };

  const handleBarcodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      const code = barcodeInput.trim();
      // Instantly clear input so next person can scan in 0 milliseconds
      setBarcodeInput("");
      enqueueScan(code);
      if (barcodeRef.current) {
        barcodeRef.current.value = "";
        barcodeRef.current.focus();
      }
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
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Input Auto Scanner (Hardware USB / Barcode / RFID)
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <ListOrdered className="w-3 h-3" />
                  Model Antrian Aktif
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Bisa scan kartu berturut-turut tanpa jeda. Sistem memproses antrian secara otomatis di latar belakang.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {scanQueue.length > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  Memproses {scanQueue.length} Antrian
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Siap Scan Cepat
                </span>
              )}
            </div>
          </div>

          {/* HARDWARE USB SCANNER INPUT */}
          <div className="space-y-4">
            <form onSubmit={handleBarcodeSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 block">
                  Scan Barcode / Tempel Kartu ID di Alat Scanner:
                </label>
                {scanQueue.length > 0 && (
                  <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    {scanQueue.length} kartu sedang dalam jalur pemrosesan
                  </span>
                )}
              </div>
              
              <div className="relative">
                <input
                  ref={barcodeRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan cepat tanpa jeda... (Contoh: S-1001 / G-001)"
                  className="w-full bg-slate-900 text-white font-mono text-base font-bold rounded-xl py-3.5 pl-11 pr-28 border border-slate-800 focus:outline-none focus:border-rose-500 shadow-inner"
                  autoComplete="off"
                />
                <Usb className="w-5 h-5 text-rose-400 absolute left-3.5 top-3.5" />
                
                <button
                  type="submit"
                  disabled={!barcodeInput.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-rose-600 text-white font-bold text-xs px-4 rounded-lg hover:bg-rose-700 transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {scanQueue.length > 0 ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Antrian ({scanQueue.length})
                    </>
                  ) : (
                    "Scan"
                  )}
                </button>
              </div>
            </form>

            {/* LIVE QUEUE PIPELINE DRAWER (JIKA ADA ANTRIAN) */}
            {scanQueue.length > 0 && (
              <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2 animate-fade-in shadow-md">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Jalur Antrian Berjalan (FIFO)
                  </span>
                  <span className="font-mono text-[11px] text-amber-300">
                    Total: {scanQueue.length} scan
                  </span>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 text-xs">
                  {scanQueue.map((qItem, idx) => (
                    <div 
                      key={qItem.queueId}
                      className={`p-2 rounded-lg flex items-center justify-between gap-2 border transition ${
                        idx === 0 
                          ? "bg-amber-500/15 border-amber-500/40 text-amber-200 font-bold" 
                          : "bg-slate-800/60 border-slate-700/50 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black ${
                          idx === 0 ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-300"
                        }`}>
                          #{idx + 1}
                        </span>
                        
                        <div className="truncate">
                          <span className="font-extrabold text-white text-xs mr-1.5">
                            {qItem.previewName || qItem.rawCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            ({qItem.previewRole || "ID"} • {qItem.previewSubDetail || qItem.rawCode})
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-mono">
                        {idx === 0 ? (
                          <span className="text-amber-400 flex items-center gap-1 font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Memproses...
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            Antri ({qItem.enqueuedAt})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

        {/* QUICK MANUAL SEARCH, LOGS & JADWAL SIDEBAR */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 flex flex-col justify-between">
          <div>
            {/* Tab Header */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mb-3">
              <button
                type="button"
                onClick={() => setActiveTab("logs")}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "logs" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                Log Scan ({recentLogs.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("jadwalToday")}
                className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === "jadwalToday" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                Jadwal Hari Ini ({jadwalToday.length})
              </button>
            </div>

            {/* TAB CONTENT 1: LOGS */}
            {activeTab === "logs" && (
              <>
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">
                    Belum ada log presensi pada sesi ini
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {recentLogs.map((log, idx) => (
                      <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                        log.success ? "bg-gray-50 border-gray-100" : "bg-rose-50/50 border-rose-200 text-rose-900"
                      }`}>
                        <div>
                          <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                            <span>{log.name}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                              log.role === "Guru" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {log.role}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {log.subDetail}
                            {log.scheduleDetail ? ` • ${log.scheduleDetail}` : ""}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            !log.success 
                              ? "bg-rose-100 text-rose-700"
                              : log.status.includes("Terlambat") 
                              ? "bg-amber-100 text-amber-800" 
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {log.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* TAB CONTENT 2: JADWAL HARI INI */}
            {activeTab === "jadwalToday" && (
              <>
                {jadwalToday.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-8">
                    Tidak ada jadwal mengajar di database untuk hari ini
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {jadwalToday.map((j: any, idx: number) => {
                      const todayStr = new Date().toISOString().split("T")[0];
                      const isAttended = absensiMengajarLogs.some((a: any) => 
                        a.tanggal === todayStr &&
                        Number(a.jam_ke) === Number(j.jam_ke) &&
                        String(a.kelas || "").trim().toLowerCase() === String(j.kelas || "").trim().toLowerCase() &&
                        (isNameMatch(a.nama_guru, j.nama_guru) || String(a.id_guru) === String(j.id_guru))
                      );

                      return (
                        <div key={idx} className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                              <span>{j.mapel} ({j.kelas})</span>
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 rounded">
                                Jam {j.jam_ke}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500">{j.nama_guru}</div>
                          </div>

                          <div className="text-right">
                            {isAttended ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                Sudah Absen
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded-md">
                                Belum
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <button
            onClick={loadMasterData}
            disabled={loadingMaster}
            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingMaster ? "animate-spin" : ""}`} />
            Refresh Data Master & Jadwal ({siswaList.length} Siswa / {guruList.length} Guru)
          </button>
        </div>

      </div>

    </div>
  );
}
