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
  Camera, 
  CameraOff, 
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
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
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
  // Scanner Mode & Hardware listener states
  const [scanMethod, setScanMethod] = useState<"hardware" | "camera">("hardware");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [autoFocusLock, setAutoFocusLock] = useState(true);
  const barcodeRef = useRef<HTMLInputElement | null>(null);

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // Processing & Audio states
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Master Data Cache
  const [siswaList, setSiswaList] = useState<any[]>([]);
  const [guruList, setGuruList] = useState<any[]>([]);
  const [jadwalToday, setJadwalToday] = useState<any[]>([]);
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

      // 3. Load Lesson Schedule Today
      const resJadwal = await callGas("getJadwalPelajaranSemua");
      const jData = extractArrayData(resJadwal);
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const todayName = days[new Date().getDay()];
      
      const filteredToday = (jData || []).filter((j: any) => {
        const h = (j.hari || "").trim().toLowerCase();
        return h === todayName.toLowerCase();
      });
      setJadwalToday(filteredToday);

      refreshTodayStats();

    } catch (e) {
      console.error("Gagal load master data auto scanner:", e);
      setSiswaList(getStorage("data_siswa") || []);
      setGuruList(getStorage("data_guru") || []);
    } finally {
      setLoadingMaster(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  // Auto-focus lock for USB/Bluetooth Scanner
  useEffect(() => {
    if (scanMethod === "hardware" && autoFocusLock) {
      const focusInput = () => {
        if (barcodeRef.current && document.activeElement !== barcodeRef.current) {
          barcodeRef.current.focus();
        }
      };
      focusInput();
      const interval = setInterval(focusInput, 1500);
      return () => clearInterval(interval);
    }
  }, [scanMethod, autoFocusLock]);

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

  const playBeep = (type: "success" | "error") => {
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
      
      // Look up in Guru list (ID, NIP, QR Content, Name, custom codes)
      let matchedGuru = guruList.find((g: any) => {
        const idG = String(g.id_guru || "").toLowerCase();
        const nipG = String(g.nip_nuptk || g.nip || "").toLowerCase();
        const qrG = String(g.qr_content || "").toLowerCase();
        const namaG = String(g.nama_guru || g.nama || "").toLowerCase();
        return (
          (idG && (idG === cleanCode || cleanCode.includes(idG))) ||
          (nipG && (nipG === cleanCode || cleanCode.includes(nipG))) ||
          (qrG && (qrG === cleanCode || cleanCode.includes(qrG) || qrG.includes(cleanCode))) ||
          (namaG && (namaG === cleanCode || cleanCode.includes(namaG) || namaG.includes(cleanCode)))
        );
      });

      // Look up in Siswa list (ID, NISN, QR Content, Name, custom codes)
      let matchedSiswa = siswaList.find((s: any) => {
        const idS = String(s.id_siswa || "").toLowerCase();
        const nisS = String(s.nisn || s.nis || "").toLowerCase();
        const qrS = String(s.qr_content || "").toLowerCase();
        const namaS = String(s.nama_siswa || s.nama || "").toLowerCase();
        return (
          (idS && (idS === cleanCode || cleanCode.includes(idS))) ||
          (nisS && (nisS === cleanCode || cleanCode.includes(nisS))) ||
          (qrS && (qrS === cleanCode || cleanCode.includes(qrS) || qrS.includes(cleanCode))) ||
          (namaS && (namaS === cleanCode || cleanCode.includes(namaS) || namaS.includes(cleanCode)))
        );
      });

      let role: "Guru" | "Siswa" = "Siswa";
      let personObj: any = null;

      if (matchedGuru) {
        role = "Guru";
        personObj = matchedGuru;
      } else if (matchedSiswa) {
        role = "Siswa";
        personObj = matchedSiswa;
      } else {
        // Fallback Heuristics by Prefix
        if (cleanCode.startsWith("g-") || cleanCode.startsWith("guru") || cleanCode.startsWith("nip") || cleanCode.startsWith("g_")) {
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
      const statusText = autoMode === "Masuk" ? (isLate ? "Terlambat" : "Hadir Tepat Waktu") : "Sudah Pulang";

      let resultObj: AutoScanResult;

      if (role === "Siswa") {
        // PROCESS SISWA ABSENSI
        const personName = personObj?.nama_siswa || personObj?.nama || (code.length > 4 ? `Siswa (${code})` : "Siswa");
        const kelasStr = personObj?.kelas_jurusan || (personObj?.kelas ? `${personObj.kelas} ${personObj.jurusan || ""}`.trim() : "Siswa");
        const idTarget = personObj?.id_siswa || personObj?.nisn || code;

        // 1. Save to Backend Database (Google Apps Script & Mock Storage)
        await callGas("catatAbsensiSiswa", [
          idTarget,
          autoMode,
          statusText,
          "Scan Auto Board",
          dateString,
          timeString,
          personName,
          kelasStr
        ]);

        // 2. Direct Sync Local Storage Laporan Siswa to ensure instantaneous UI updates across all tabs
        const curReports = getStorage("laporan_siswa") || [];
        const existingIdx = curReports.findIndex((r: any) => r.tanggal === dateString && (r.id_siswa === idTarget || r.id_target === idTarget || String(r.nama_siswa || "").toLowerCase() === personName.toLowerCase()));
        if (existingIdx !== -1) {
          if (autoMode === "Masuk") {
            curReports[existingIdx].jam_masuk = timeString;
            curReports[existingIdx].status_masuk = statusText;
          } else {
            curReports[existingIdx].jam_pulang = timeString;
            curReports[existingIdx].status_pulang = statusText;
          }
          curReports[existingIdx].ket = "Scan Auto Board";
        } else {
          curReports.push({
            id_log_siswa: "LOG-S-" + Date.now(),
            tanggal: dateString,
            id_siswa: idTarget,
            nama_siswa: personName,
            kelas_jurusan: kelasStr,
            jam_masuk: autoMode === "Masuk" ? timeString : "-",
            status_masuk: autoMode === "Masuk" ? statusText : "Belum Absen",
            jam_pulang: autoMode === "Pulang" ? timeString : "-",
            status_pulang: autoMode === "Pulang" ? statusText : "-",
            ket: "Scan Auto Board"
          });
        }
        setStorage("laporan_siswa", curReports);

        resultObj = {
          id: idTarget,
          name: personName,
          role: "Siswa",
          subDetail: `Kelas: ${kelasStr}`,
          mode: autoMode,
          status: statusText,
          timestamp: timeString,
          dateStr: dateString,
          success: true,
          message: `Presensi ${personName} (${autoMode}) Berhasil Dicatat ke Database`
        };

      } else {
        // PROCESS GURU ABSENSI & AUTO LESSON SCHEDULE
        const personName = personObj?.nama_guru || personObj?.nama || (code.length > 4 ? `Guru (${code})` : "Bapak/Ibu Guru");
        const nipStr = personObj?.nip_nuptk || personObj?.nip || personObj?.id_guru || code;
        const idTarget = personObj?.id_guru || nipStr || code;

        // 1. Record Harian Guru to Backend Database
        await callGas("catatAbsensiGuru", [
          idTarget,
          autoMode,
          statusText,
          "Scan Auto Board",
          dateString,
          timeString,
          personName,
          nipStr
        ]);

        // 2. Direct Sync Local Storage Laporan Guru
        const curReports = getStorage("laporan_guru") || [];
        const existingIdx = curReports.findIndex((r: any) => r.tanggal === dateString && (r.id_guru === idTarget || r.id_target === idTarget || String(r.nama_guru || "").toLowerCase() === personName.toLowerCase()));
        if (existingIdx !== -1) {
          if (autoMode === "Masuk") {
            curReports[existingIdx].jam_masuk = timeString;
            curReports[existingIdx].status_masuk = statusText;
          } else {
            curReports[existingIdx].jam_pulang = timeString;
            curReports[existingIdx].status_pulang = statusText;
          }
          curReports[existingIdx].ket = "Scan Auto Board";
        } else {
          curReports.push({
            id_log_guru: "LOG-G-" + Date.now(),
            tanggal: dateString,
            id_guru: idTarget,
            nama_guru: personName,
            jam_masuk: autoMode === "Masuk" ? timeString : "-",
            status_masuk: autoMode === "Masuk" ? statusText : "Belum Absen",
            jam_pulang: autoMode === "Pulang" ? timeString : "-",
            status_pulang: autoMode === "Pulang" ? statusText : "-",
            ket: "Scan Auto Board"
          });
        }
        setStorage("laporan_guru", curReports);

        // 3. AUTO LESSON SCHEDULE MATCHING FOR GURU
        let scheduleNote = "";
        const matchedSchedule = jadwalToday.find((j: any) => {
          const idG = String(j.id_guru || "").toLowerCase();
          const nameG = String(j.nama_guru || "").toLowerCase();
          return (idG && idG === idTarget.toLowerCase()) || (nameG && nameG.includes(personName.toLowerCase()));
        });

        if (matchedSchedule) {
          scheduleNote = `Jadwal Mengajar: Jam Ke-${matchedSchedule.jam_ke || 1} • Kelas ${matchedSchedule.kelas || "-"} • ${matchedSchedule.mapel || "-"}`;
          
          try {
            await callGas("simpanAbsensiMengajarGuru", [{
              id_log_mengajar: "LOG-AUTOGURU-" + Date.now(),
              tanggal: dateString,
              waktu_absen: timeString,
              hari: matchedSchedule.hari || "Hari Ini",
              id_guru: idTarget,
              nama_guru: personName,
              kelas: matchedSchedule.kelas || "Kelas Utama",
              mapel: matchedSchedule.mapel || "Pelajaran",
              jam_ke: matchedSchedule.jam_ke || 1,
              jam_mulai_jadwal: matchedSchedule.jam_mulai || "-",
              jam_selesai_jadwal: matchedSchedule.jam_selesai || "-",
              status: "Hadir Tepat Waktu",
              catatan_materi: "Presensi Otomatis Papan Scanner"
            }]);
          } catch (err) {
            console.error("Gagal auto-record absensi mengajar guru:", err);
          }
        }

        resultObj = {
          id: idTarget,
          name: personName,
          role: "Guru",
          subDetail: `NIP/ID: ${nipStr}`,
          mode: autoMode,
          status: statusText,
          timestamp: timeString,
          dateStr: dateString,
          scheduleDetail: scheduleNote,
          success: true,
          message: `Presensi ${personName} (${autoMode}) Berhasil Dicatat ke Database`
        };
      }

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

      // Play Beep & Voice Announcement with Person Name
      playBeep("success");
      speakText(`Presensi ${resultObj.role} berhasil, ${resultObj.name}`);

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
      setShowNotificationToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowNotificationToast(false), 5000);
      playBeep("error");
      speakText("Presensi gagal, silakan coba lagi");
    } finally {
      setIsProcessing(false);
      setBarcodeInput("");
      if (barcodeRef.current) barcodeRef.current.focus();
    }
  };

  const handleBarcodeSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processAutoScan(barcodeInput.trim());
    }
  };

  // CAMERA SCANNER INITIALIZATION
  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;

    if (scanMethod === "camera" && cameraActive) {
      Html5Qrcode.getCameras()
        .then((devices) => {
          if (devices && devices.length > 0) {
            const formatted = devices.map(d => ({ id: d.id, label: d.label || `Kamera ${d.id}` }));
            setAvailableCameras(formatted);
            const camId = selectedCameraId || formatted[0].id;
            if (!selectedCameraId) setSelectedCameraId(camId);

            html5Qrcode = new Html5Qrcode("auto-reader", {
              formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.CODE_39
              ],
              verbose: false
            });

            html5Qrcode.start(
              camId,
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText) => {
                if (decodedText && !isProcessing) {
                  processAutoScan(decodedText);
                }
              },
              () => {}
            ).catch((err) => {
              setCameraError("Kamera gagal diakses: " + err.toString());
              setCameraActive(false);
            });
          } else {
            setCameraError("Tidak ada kamera terdeteksi.");
            setCameraActive(false);
          }
        })
        .catch((err) => {
          setCameraError("Izin kamera ditolak: " + err.toString());
          setCameraActive(false);
        });
    }

    return () => {
      if (html5Qrcode && html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(() => {});
      }
    };
  }, [scanMethod, cameraActive, selectedCameraId]);

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
                Silakan lakukan scan kartu (Siswa / Guru) menggunakan Barcode Scanner USB atau Kamera. Sistem akan otomatis mendeteksi ID dan mencatat data.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* 2. SCANNER INPUT CONTROLS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SCANNER INPUT CARD */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Input Auto Scanner
              </h2>
              <p className="text-xs text-gray-500">
                Mendukung Scanner Kartu RFID/Barcode HID USB & Kamera QR Code
              </p>
            </div>

            {/* Scan Method Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
              <button
                onClick={() => {
                  setScanMethod("hardware");
                  setCameraActive(false);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  scanMethod === "hardware" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Usb className="w-3.5 h-3.5 text-rose-500" />
                Hardware / USB
              </button>

              <button
                onClick={() => {
                  setScanMethod("camera");
                  setCameraActive(true);
                }}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  scanMethod === "camera" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-blue-500" />
                Kamera QR
              </button>
            </div>
          </div>

          {/* HARDWARE USB SCANNER INPUT */}
          {scanMethod === "hardware" && (
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
                  Auto Focus aktif untuk memproses hasil cetak scanner otomatis
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
          )}

          {/* CAMERA QR SCANNER VIEW */}
          {scanMethod === "camera" && (
            <div className="space-y-4">
              {availableCameras.length > 1 && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-600">Pilih Kamera:</label>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl p-2"
                  >
                    {availableCameras.map(cam => (
                      <option key={cam.id} value={cam.id}>{cam.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {cameraError ? (
                <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold">
                  {cameraError}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-[250px] flex items-center justify-center">
                  <div id="auto-reader" className="w-full"></div>
                </div>
              )}
            </div>
          )}

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
