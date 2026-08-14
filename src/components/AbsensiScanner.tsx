/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, FormEvent } from "react";
import { 
  Scan, 
  UserCheck, 
  Clock, 
  Volume2, 
  VolumeX, 
  Camera, 
  CameraOff, 
  UserPlus, 
  Users, 
  AlertCircle,
  Search,
  Filter,
  CheckSquare,
  Square,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Usb,
  Keyboard,
  Zap,
  HelpCircle,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Info,
  Gauge,
  Timer,
  FastForward,
  Loader2,
  Calendar,
  Edit3,
  BookOpen,
  BookMarked,
  Award,
  Plus,
  Trash2,
  FileText,
  Check,
  Layers
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { callGas, getStorageKey, setStorage, getStorage, extractArrayData, isInvalidWali } from "../lib/gasApi";
import { LiveAbsen, ScheduleLessonItem, AbsensiMengajarItem, JamPelajaranItem } from "../types";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

const HARI_MAP_INDEX: Record<number, string> = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu"
};

export default function AbsensiScanner({ session }: { session?: any }) {
  // Main Attendance Mode: "harian" (Arrival/Departure) vs "mengajar" (Teaching Schedule Attendance)
  const [attendanceType, setAttendanceType] = useState<"harian" | "mengajar">("harian");

  const [kategori, setKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [mode, setMode] = useState<"Masuk" | "Pulang">("Masuk");
  
  // Loading & Processing Indicators
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Fast Scan Express / Speed Mode States
  const [fastMode, setFastMode] = useState<"normal" | "express" | "turbo">("express");
  const [autoTimeSwitch, setAutoTimeSwitch] = useState<boolean>(true);
  const [screenFlash, setScreenFlash] = useState<"success" | "error" | null>(null);
  const [scanQueue, setScanQueue] = useState<Array<{
    id: string;
    code: string;
    timestamp: string;
    status: "pending" | "success" | "error";
    message?: string;
  }>>([]);
  const [recentScanTimes, setRecentScanTimes] = useState<number[]>([]);

  // Scanner Type: "hardware" (Clabel USB/Bluetooth Scanner / HID) vs "camera" (External USB Camera / Clabel Video Scanner)
  const [scanMethod, setScanMethod] = useState<"hardware" | "camera">("hardware");

  // Hardware Scanner States
  const [barcodeInputHarian, setBarcodeInputHarian] = useState("");
  const [barcodeInputMengajar, setBarcodeInputMengajar] = useState("");
  const [autoFocusLock, setAutoFocusLock] = useState(true);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const barcodeInputRefHarian = useRef<HTMLInputElement | null>(null);
  const barcodeInputRefMengajar = useRef<HTMLInputElement | null>(null);

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // Sound & Speech Feedback States
  const [audioMuted, setAudioMuted] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Logs & Table States (Harian)
  const [recentLogs, setRecentLogs] = useState<LiveAbsen[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [classList, setClassList] = useState<string[]>([]);
  const [filterTanggal, setFilterTanggal] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Manual Dialog States (Harian)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTarget, setManualTarget] = useState<string>("");
  const [manualStatus, setManualStatus] = useState<string>("Hadir (Auto)");
  const [manualJam, setManualJam] = useState<string>("07:00");
  const [manualKet, setManualKet] = useState<string>("");
  const [manualEditOriginalDate, setManualEditOriginalDate] = useState<string | null>(null);
  const [entitiesList, setEntitiesList] = useState<any[]>([]);
  const [searchManualQuery, setSearchManualQuery] = useState("");

  // Presensi Mengajar Guru States
  const [lessonSchedules, setLessonSchedules] = useState<ScheduleLessonItem[]>([]);
  const [absensiMengajarLogs, setAbsensiMengajarLogs] = useState<AbsensiMengajarItem[]>([]);
  const [itemsPerPageMengajar, setItemsPerPageMengajar] = useState<number>(10);
  const [currentPageMengajar, setCurrentPageMengajar] = useState<number>(1);
  const [itemsPerPageJadwal, setItemsPerPageJadwal] = useState<number>(6);
  const [currentPageJadwal, setCurrentPageJadwal] = useState<number>(1);
  const [teachersList, setTeachersList] = useState<any[]>([]);
  const [jamSlots, setJamSlots] = useState<JamPelajaranItem[]>([]);
  const [batasiJamJadwal, setBatasiJamJadwal] = useState<boolean>(true);
  const [toleransiAwal, setToleransiAwal] = useState<number>(15);
  const [toleransiAkhir, setToleransiAkhir] = useState<number>(30);
  const [toleransiGuru, setToleransiGuru] = useState<number>(15);
  const [isLoadingMengajar, setIsLoadingMengajar] = useState(false);

  const getTodayHari = () => {
    const idx = new Date().getDay();
    return HARI_MAP_INDEX[idx] || "Senin";
  };

  const [selectedDay, setSelectedDay] = useState<string>(getTodayHari());
  const [filterMengajarKelas, setFilterMengajarKelas] = useState<string>("Semua");
  const [filterMengajarGuru, setFilterMengajarGuru] = useState<string>("Semua");
  const [filterMengajarSearch, setFilterMengajarSearch] = useState<string>("");

  // Mengajar Modal Dialog State
  const [showMengajarModal, setShowMengajarModal] = useState(false);
  const [selectedScheduleForAbsen, setSelectedScheduleForAbsen] = useState<ScheduleLessonItem | null>(null);
  const [mengajarForm, setMengajarForm] = useState({
    id_guru: "",
    nama_guru: "",
    kelas: "",
    mapel: "",
    jam_ke: 1,
    jam_mulai_jadwal: "-",
    jam_selesai_jadwal: "-",
    hari: "Senin",
    tanggal: new Date().toISOString().split("T")[0],
    waktu_absen: new Date().toTimeString().slice(0, 5),
    status: "Hadir Tepat Waktu",
    catatan_materi: ""
  });
  const [isSubmittingMengajar, setIsSubmittingMengajar] = useState(false);

  // Guide Toggle
  const [showGuide, setShowGuide] = useState(false);

  // Toast / Status overlay
  const [scanStatus, setScanStatus] = useState<{ 
    type: "success" | "error" | "info" | null; 
    msg: string | null;
    targetName?: string;
    details?: string;
  }>({ type: null, msg: null });

  // User session & roles
  const [currentUser, setCurrentUser] = useState<any>(null);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanTextRef = useRef<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const activeRole = session?.role || currentUser?.role;
  const isGuru = activeRole === "Guru";

  useEffect(() => {
    if (isGuru) {
      setKategori("Siswa");
      setScanMethod("hardware");
    }
  }, [isGuru]);

  useEffect(() => {
    if (filterTanggal) {
      const d = new Date(filterTanggal + "T00:00:00");
      if (!isNaN(d.getTime())) {
        const dayIdx = d.getDay();
        const dayName = HARI_MAP_INDEX[dayIdx] || "Senin";
        setSelectedDay(dayName);
      }
    }
  }, [filterTanggal]);

  // Audio Beep generator
  const playBeep = (isSuccess = true) => {
    if (audioMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = isSuccess ? "sine" : "sawtooth";
      osc.frequency.setValueAtTime(isSuccess ? 880 : 300, audioCtx.currentTime); // A5 or low warning tone
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + (isSuccess ? 0.2 : 0.4));

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + (isSuccess ? 0.2 : 0.4));
    } catch (e) {
      // Fallback html5 audio
      try {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch (err) {}
    }
  };

  // Text-To-Speech confirmation
  const speakText = (text: string) => {
    if (!speechEnabled || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel(); // cancel previous queued speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "id-ID";
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.log("TTS error", e);
    }
  };

  // Load Classes
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await callGas("getKelasSemua");
        const list = extractArrayData(res);
        let parsed = list.map((item: any) => typeof item === 'string' ? item : (item.nama_kelas || item.kelas || String(item))).filter(Boolean);
        if (!parsed || parsed.length === 0) {
          const stored = getStorage("data_kelas") || [];
          parsed = stored.map((item: any) => typeof item === 'string' ? item : (item.nama_kelas || item.kelas || String(item))).filter(Boolean);
        }
        if (!parsed || parsed.length === 0) {
          parsed = ["X RPL 1", "X RPL 2", "XI RPL 1", "XI RPL 2", "XII RPL 1"];
        }
        setClassList(parsed);

        // Auto select assigned class if logged in as Wali Kelas
        if (currentUser) {
          const uName = (currentUser.nama_guru || currentUser.username || currentUser.nama || "").toLowerCase();
          const uTargetId = (currentUser.target_id || currentUser.id_guru || "").toLowerCase();
          
          const storedKelas = getStorage("data_kelas") || [];
          const myClass = storedKelas.find((c: any) => {
            const w = (c.wali_kelas || c.wali || c.waliKelas || c.guru_wali || c.nama_guru || "").toLowerCase();
            if (!w || isInvalidWali(w)) return false;
            return (uName && w.includes(uName)) || (uTargetId && w.includes(uTargetId));
          });

          if (myClass && myClass.nama_kelas) {
            setFilterKelas(myClass.nama_kelas);
          } else if (currentUser.role === "Wali Kelas" && currentUser.target_id && currentUser.target_id !== "-") {
            const targetClass = parsed.find((c: string) => c.toLowerCase().replace(/[\s-]+/g, "") === currentUser.target_id.toLowerCase().replace(/[\s-]+/g, ""));
            if (targetClass) {
              setFilterKelas(targetClass);
            }
          }
        }
      } catch (e) {
        const stored = getStorage("data_kelas") || [];
        let parsed = stored.map((item: any) => typeof item === 'string' ? item : (item.nama_kelas || item.kelas || String(item))).filter(Boolean);
        if (!parsed || parsed.length === 0) {
          parsed = ["X RPL 1", "X RPL 2", "XI RPL 1", "XI RPL 2", "XII RPL 1"];
        }
        setClassList(parsed);
      }
    }
    fetchClasses();
  }, [currentUser]);

  // Load live logs based on selected date, category, and class filter
  const loadLiveLogs = async (targetDate = filterTanggal, currentKelas = filterKelas) => {
    setIsLoadingLogs(true);
    try {
      // 1. Fetch real master data from Google Sheets database
      let masterData: any[] = [];
      const masterRes = await callGas("getDataMaster", [kategori]);
      if (masterRes && masterRes.success && Array.isArray(masterRes.data)) {
        masterData = masterRes.data;
      } else if (Array.isArray(masterRes)) {
        masterData = masterRes;
      }

      if (masterData.length > 0) {
        const storageKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        setStorage(storageKey, masterData);
      }

      // 2. Call live attendance action
      const res = await callGas("getLiveAbsenHariIni", [kategori, targetDate, currentKelas]);
      let list = Array.isArray(res) 
        ? res 
        : (res && Array.isArray(res.data) ? res.data : (res?.data || []));

      // 3. Merge master data with attendance list so ALL students/teachers appear in the table
      if (masterData.length > 0) {
        const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
        const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";

        // Filter masterData by currentKelas if category is Siswa and currentKelas !== "Semua"
        let filteredMaster = masterData;
        if (kategori === "Siswa" && currentKelas && currentKelas !== "Semua") {
          const kFilter = String(currentKelas).toLowerCase().replace(/[\s-]+/g, "");
          filteredMaster = masterData.filter((m: any) => {
            const kVal = String(m.kelas || "").toLowerCase().replace(/[\s-]+/g, "");
            const jVal = String(m.jurusan || "").toLowerCase().replace(/[\s-]+/g, "");
            const kjVal = String(m.kelas_jurusan || "").toLowerCase().replace(/[\s-]+/g, "");
            const combined = `${kVal}${jVal}`;
            return kjVal.includes(kFilter) || kFilter.includes(kjVal) || kVal.includes(kFilter) || kFilter.includes(kVal) || combined.includes(kFilter) || kFilter.includes(combined);
          });
        }

        // Map live attendance records by id_target
        const logMap = new Map<string, any>();
        if (Array.isArray(list)) {
          for (const item of list) {
            const itemKey = String(item.id_target || item.id_siswa || item.id_guru || "").trim().toLowerCase();
            if (itemKey) logMap.set(itemKey, item);
          }
        }

        // Also check local storage reports as backup
        const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
        const localReports = getStorage(reportsKey) || [];
        if (Array.isArray(localReports)) {
          for (const r of localReports) {
            if (String(r.tanggal || "").split("T")[0] === targetDate) {
              const rId = String(r[idKey] || r.id_siswa || r.id_guru || r.id_target || "").trim().toLowerCase();
              if (rId && !logMap.has(rId)) {
                logMap.set(rId, r);
              }
            }
          }
        }

        // Generate full list combining master data + attendance logs
        const mergedList = filteredMaster.map((m: any) => {
          const idTarget = String(m[idKey] || m.id || m.nisn || m.nip_nuptk || "").trim();
          const namaTarget = m[nameKey] || m.nama || m.name || "Tanpa Nama";

          let kelasStr = "-";
          if (kategori === "Siswa") {
            const kVal = String(m.kelas || "").trim();
            const jVal = String(m.jurusan || "").trim();
            if (m.kelas_jurusan) {
              kelasStr = m.kelas_jurusan;
            } else if (kVal) {
              if (jVal && jVal !== "-" && !kVal.toLowerCase().includes(jVal.toLowerCase())) {
                kelasStr = `${kVal} ${jVal}`;
              } else {
                kelasStr = kVal;
              }
            } else if (jVal) {
              kelasStr = jVal;
            }
          }

          const existingLog = logMap.get(idTarget.toLowerCase());

          if (existingLog && ((existingLog.jam_masuk && existingLog.jam_masuk !== "-") || (existingLog.status_masuk && existingLog.status_masuk !== "-" && existingLog.status_masuk !== "Belum Absen") || (existingLog.jam_pulang && existingLog.jam_pulang !== "-"))) {
            return {
              ...existingLog,
              id_target: existingLog.id_target || idTarget,
              nama_target: existingLog.nama_target || namaTarget,
              kelas_jurusan: existingLog.kelas_jurusan || kelasStr,
              tanggal: targetDate,
              status_masuk: existingLog.status_masuk && existingLog.status_masuk !== "-" ? existingLog.status_masuk : "Belum Absen",
              status_pulang: existingLog.status_pulang && existingLog.status_pulang !== "-" ? existingLog.status_pulang : "-"
            };
          }

          return {
            id_target: idTarget,
            nama_target: namaTarget,
            kelas_jurusan: kelasStr,
            tanggal: targetDate,
            jam_masuk: "-",
            status_masuk: "Belum Absen",
            jam_pulang: "-",
            status_pulang: "-",
            no_hp_ortu: m.no_hp_ortu || m.no_hp || "-",
            kategori: kategori,
            ket: "-"
          };
        });

        // Include any scanned records that were not in filteredMaster
        if (Array.isArray(list)) {
          const matchedIds = new Set(filteredMaster.map((m: any) => String(m[idKey] || m.id || m.nisn || m.nip_nuptk || "").trim().toLowerCase()));
          for (const item of list) {
            const itemKey = String(item.id_target || item.id_siswa || item.id_guru || "").trim().toLowerCase();
            if (itemKey && !matchedIds.has(itemKey)) {
              mergedList.push({
                ...item,
                tanggal: targetDate,
                status_masuk: item.status_masuk && item.status_masuk !== "-" ? item.status_masuk : "Belum Absen"
              });
            }
          }
        }

        list = mergedList;
      }

      setRecentLogs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Helper to accurately get start & end times for a specific period (jam_ke)
  const getJamSlotTime = (jamKeNum: number, fallbackMulai?: string, fallbackSelesai?: string) => {
    const slot = jamSlots.find(j => Number(j.jam_ke) === Number(jamKeNum));
    const mulai = slot ? slot.jam_mulai : (fallbackMulai && fallbackMulai !== "-" ? fallbackMulai : "-");
    const selesai = slot ? slot.jam_selesai : (fallbackSelesai && fallbackSelesai !== "-" ? fallbackSelesai : "-");
    return { mulai, selesai };
  };

  // Load Presensi Mengajar Data (Schedules & Logs)
  const fetchMengajarData = async () => {
    setIsLoadingMengajar(true);
    try {
      const [resSchedules, resLogs, resTeachers, resJam] = await Promise.all([
        callGas("getJadwalPelajaranSemua"),
        callGas("getAbsensiMengajarGuru"),
        callGas("getDataMaster", ["Guru"]),
        callGas("getJamPelajaran")
      ]);

      const scheds = Array.isArray(resSchedules)
        ? resSchedules
        : (resSchedules && Array.isArray(resSchedules.data) ? resSchedules.data : (resSchedules?.data || []));
      setLessonSchedules(scheds);

      const logs = Array.isArray(resLogs)
        ? resLogs
        : (resLogs && Array.isArray(resLogs.data) ? resLogs.data : (resLogs?.data || []));
      setAbsensiMengajarLogs(logs);

      const teachers = Array.isArray(resTeachers)
        ? resTeachers
        : (resTeachers && Array.isArray(resTeachers.data) ? resTeachers.data : (resTeachers?.data || []));
      setTeachersList(teachers);

      const jams = Array.isArray(resJam)
        ? resJam
        : (resJam && Array.isArray(resJam.data) ? resJam.data : (resJam?.data || []));
      setJamSlots(jams);

      try {
        const resCfg = await callGas("getPengaturanSemua");
        const cfg = resCfg?.data || resCfg;
        if (cfg && typeof cfg === "object") {
          if (cfg.batasi_jam_jadwal !== undefined) setBatasiJamJadwal(Boolean(cfg.batasi_jam_jadwal));
          if (cfg.toleransi_awal_menit !== undefined) setToleransiAwal(Number(cfg.toleransi_awal_menit) || 15);
          if (cfg.toleransi_akhir_menit !== undefined) setToleransiAkhir(Number(cfg.toleransi_akhir_menit) || 30);
          const val = Number(cfg.toleransi_guru ?? cfg.toleransi_mengajar_guru);
          if (!isNaN(val) && val >= 0) setToleransiGuru(val);
        } else {
          const savedLocal = localStorage.getItem(getStorageKey("MOCK_pengaturan_jam"));
          if (savedLocal) {
            const parsed = JSON.parse(savedLocal);
            if (parsed.batasi_jam_jadwal !== undefined) setBatasiJamJadwal(Boolean(parsed.batasi_jam_jadwal));
            if (parsed.toleransi_awal_menit !== undefined) setToleransiAwal(Number(parsed.toleransi_awal_menit) || 15);
            if (parsed.toleransi_akhir_menit !== undefined) setToleransiAkhir(Number(parsed.toleransi_akhir_menit) || 30);
            if (parsed.toleransi_guru !== undefined) setToleransiGuru(Number(parsed.toleransi_guru) || 15);
          }
        }
      } catch (e) {}
    } catch (err) {
      console.error("Gagal memuat data presensi mengajar:", err);
    } finally {
      setIsLoadingMengajar(false);
    }
  };

  useEffect(() => {
    loadLiveLogs(filterTanggal, filterKelas);
  }, [kategori, filterTanggal, filterKelas]);

  useEffect(() => {
    fetchMengajarData();
  }, [filterTanggal, selectedDay]);

  const openModalForSchedule = (sched: ScheduleLessonItem, existingLog?: AbsensiMengajarItem) => {
    setSelectedScheduleForAbsen(sched);
    const nowTime = new Date().toTimeString().slice(0, 5);
    const todayStr = filterTanggal || new Date().toISOString().split("T")[0];
    const { mulai: slotMulai, selesai: slotSelesai } = getJamSlotTime(sched.jam_ke, sched.jam_mulai, sched.jam_selesai);

    if (existingLog) {
      setMengajarForm({
        id_guru: existingLog.id_guru || sched.id_guru || "",
        nama_guru: existingLog.nama_guru || sched.nama_guru || "",
        kelas: existingLog.kelas || sched.kelas || "",
        mapel: existingLog.mapel || sched.mapel || "",
        jam_ke: Number(existingLog.jam_ke || sched.jam_ke || 1),
        jam_mulai_jadwal: (existingLog.jam_mulai_jadwal && existingLog.jam_mulai_jadwal !== "-") ? existingLog.jam_mulai_jadwal : slotMulai,
        jam_selesai_jadwal: (existingLog.jam_selesai_jadwal && existingLog.jam_selesai_jadwal !== "-") ? existingLog.jam_selesai_jadwal : slotSelesai,
        hari: existingLog.hari || sched.hari || selectedDay,
        tanggal: existingLog.tanggal || todayStr,
        waktu_absen: existingLog.waktu_absen || nowTime,
        status: (existingLog.status as any) || "Hadir Tepat Waktu",
        catatan_materi: existingLog.catatan_materi || ""
      });
    } else {
      let autoStatus = "Hadir Tepat Waktu";
      if (slotMulai && slotMulai !== "-") {
        const [hM, mM] = slotMulai.split(":").map(Number);
        const [hN, mN] = nowTime.split(":").map(Number);
        if (!isNaN(hM) && !isNaN(mM) && !isNaN(hN) && !isNaN(mN)) {
          const startMin = hM * 60 + mM;
          const nowMin = hN * 60 + mN;
          // Toleransi keterlambatan presensi mengajar guru
          if (nowMin > startMin + toleransiGuru) {
            autoStatus = "Terlambat Masuk Kelas";
          }
        }
      }

      setMengajarForm({
        id_guru: sched.id_guru || "",
        nama_guru: sched.nama_guru || "",
        kelas: sched.kelas || "",
        mapel: sched.mapel || "",
        jam_ke: Number(sched.jam_ke || 1),
        jam_mulai_jadwal: slotMulai,
        jam_selesai_jadwal: slotSelesai,
        hari: sched.hari || selectedDay,
        tanggal: todayStr,
        waktu_absen: nowTime,
        status: autoStatus,
        catatan_materi: ""
      });
    }
    setShowMengajarModal(true);
  };

  const handleSaveMengajar = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!mengajarForm.nama_guru || !mengajarForm.kelas) {
      alert("Nama guru dan kelas harus terisi.");
      return;
    }

    // Check time range if restriction is enabled
    if (batasiJamJadwal && mengajarForm.jam_mulai_jadwal && mengajarForm.jam_mulai_jadwal !== "-" && mengajarForm.jam_selesai_jadwal && mengajarForm.jam_selesai_jadwal !== "-") {
      const [hM, mM] = mengajarForm.jam_mulai_jadwal.split(":").map(Number);
      const [hS, mS] = mengajarForm.jam_selesai_jadwal.split(":").map(Number);
      const [hN, mN] = mengajarForm.waktu_absen.split(":").map(Number);
      if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS) && !isNaN(hN) && !isNaN(mN)) {
        const startMin = hM * 60 + mM;
        const endMin = hS * 60 + mS;
        const nowMin = hN * 60 + mN;

        if (nowMin < startMin - toleransiAwal) {
          alert(`Gagal: Belum waktunya presensi untuk jadwal ini. Jam pelajaran ${mengajarForm.mapel} (${mengajarForm.kelas}) dimulai pukul ${mengajarForm.jam_mulai_jadwal}. Saat ini jam ${mengajarForm.waktu_absen}.`);
          return;
        }
        if (nowMin > endMin + toleransiAkhir) {
          alert(`Gagal: Presensi mengajar ditolak. Waktu absen (${mengajarForm.waktu_absen}) di luar jam jadwal pelajaran (${mengajarForm.jam_mulai_jadwal} - ${mengajarForm.jam_selesai_jadwal}).`);
          return;
        }
      }
    }

    setIsSubmittingMengajar(true);
    try {
      const activeDay = mengajarForm.hari || selectedDay;
      const matchingSchedules = lessonSchedules.filter(s =>
        (s.hari || "").toLowerCase() === activeDay.toLowerCase() &&
        (s.id_guru === mengajarForm.id_guru || (s.nama_guru && s.nama_guru.toLowerCase().includes(mengajarForm.nama_guru.toLowerCase()))) &&
        s.kelas.toLowerCase() === mengajarForm.kelas.toLowerCase() &&
        s.mapel.toLowerCase() === mengajarForm.mapel.toLowerCase()
      );

      let savedCount = 0;

      if (matchingSchedules.length > 1) {
        // Automatically save attendance for ALL hours in the multi-jam block (1x Scan) with precise period times
        for (const schedItem of matchingSchedules) {
          const { mulai: slotMulai, selesai: slotSelesai } = getJamSlotTime(schedItem.jam_ke, schedItem.jam_mulai, schedItem.jam_selesai);

          const itemPayload = {
            ...mengajarForm,
            jam_ke: Number(schedItem.jam_ke),
            jam_mulai_jadwal: slotMulai !== "-" ? slotMulai : mengajarForm.jam_mulai_jadwal,
            jam_selesai_jadwal: slotSelesai !== "-" ? slotSelesai : mengajarForm.jam_selesai_jadwal
          };
          const res = await callGas("simpanAbsensiMengajarGuru", [itemPayload]);
          if (res && res.success !== false) savedCount++;
        }
      } else {
        const { mulai: slotMulai, selesai: slotSelesai } = getJamSlotTime(mengajarForm.jam_ke, mengajarForm.jam_mulai_jadwal, mengajarForm.jam_selesai_jadwal);
        const payload = {
          ...mengajarForm,
          jam_mulai_jadwal: slotMulai !== "-" ? slotMulai : mengajarForm.jam_mulai_jadwal,
          jam_selesai_jadwal: slotSelesai !== "-" ? slotSelesai : mengajarForm.jam_selesai_jadwal
        };
        const res = await callGas("simpanAbsensiMengajarGuru", [payload]);
        if (res && res.success !== false) savedCount = 1;
      }

      const jamNumbers = matchingSchedules.map(s => Number(s.jam_ke)).sort((a, b) => a - b);
      const minJam = jamNumbers.length > 0 ? jamNumbers[0] : mengajarForm.jam_ke;
      const maxJam = jamNumbers.length > 0 ? jamNumbers[jamNumbers.length - 1] : mengajarForm.jam_ke;
      const jamLabel = savedCount > 1
        ? `Blok ${savedCount} Jam Pelajaran (Jam ke-${minJam} s/d Jam ke-${maxJam})`
        : `Jam Ke-${mengajarForm.jam_ke}`;

      setScanStatus({
        type: "success",
        msg: `Presensi Mengajar 1x Scan ${mengajarForm.nama_guru} Berhasil!`,
        targetName: mengajarForm.nama_guru,
        details: `Kelas ${mengajarForm.kelas} • ${mengajarForm.mapel} • ${jamLabel}`
      });
      playBeep(true);
      triggerFlash("success");
      if (speechEnabled) speakText("Presensi mengajar tersimpan.");

      setShowMengajarModal(false);
      setSelectedScheduleForAbsen(null);
      await fetchMengajarData();
    } catch (err: any) {
      alert("Terjadi kesalahan: " + err.toString());
    } finally {
      setIsSubmittingMengajar(false);
    }
  };

  const handleDeleteMengajar = async (idLog: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan presensi mengajar ini?")) return;
    try {
      const res = await callGas("hapusAbsensiMengajarGuru", [idLog]);
      if (res && res.success) {
        setScanStatus({ type: "success", msg: "Data presensi mengajar berhasil dihapus" });
        await fetchMengajarData();
      } else {
        alert(res?.message || "Gagal menghapus data");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    }
  };

  // Load Available Cameras (for external camera scanner mode)
  const detectCameras = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices
        .filter(device => device.kind === "videoinput")
        .map((device, index) => ({
          id: device.deviceId,
          label: device.label || `Kamera Eksternal ${index + 1}`
        }));
      setAvailableCameras(videoDevices);
      if (videoDevices.length > 0 && !selectedCameraId) {
        setSelectedCameraId(videoDevices[0].id);
      }
    } catch (e) {
      console.error("Gagal mendeteksi kamera:", e);
    }
  };

  useEffect(() => {
    detectCameras();
  }, []);

  // Auto Focus lock for Hardware Barcode Input
  useEffect(() => {
    if (scanMethod === "hardware" && autoFocusLock) {
      const timer = setTimeout(() => {
        if (attendanceType === "harian" && barcodeInputRefHarian.current) {
          barcodeInputRefHarian.current.focus();
        } else if (attendanceType === "mengajar" && barcodeInputRefMengajar.current) {
          barcodeInputRefMengajar.current.focus();
        }
      }, 100);

      const handleGlobalClick = (e: MouseEvent) => {
        // Keep focus inside scanner input if user didn't click inside an interactive element
        const target = e.target as HTMLElement;
        const currentRef = attendanceType === "harian" ? barcodeInputRefHarian.current : barcodeInputRefMengajar.current;
        if (
          currentRef &&
          !target.closest("button") &&
          !target.closest("input") &&
          !target.closest("select") &&
          !target.closest("textarea")
        ) {
          currentRef.focus();
        }
      };

      window.addEventListener("click", handleGlobalClick);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("click", handleGlobalClick);
      };
    }
  }, [scanMethod, autoFocusLock, attendanceType]);

  const triggerFlash = (type: "success" | "error") => {
    setScreenFlash(type);
    setTimeout(() => {
      setScreenFlash(null);
    }, 500);
  };

  // Calculate scans per minute (throughput speed)
  const scansPerMinute = recentScanTimes.filter(t => Date.now() - t < 60000).length;

  // Helper for Auto-Saving Presensi Mengajar Guru without manual confirmation modal
  const autoSaveAbsensiMengajar = async (
    targetSched: ScheduleLessonItem,
    guruNama: string,
    queueId?: string
  ) => {
    setIsProcessingScan(true);
    try {
      const nowTime = new Date().toTimeString().slice(0, 5);
      const todayStr = filterTanggal || new Date().toISOString().split("T")[0];
      const { mulai: slotMulai, selesai: slotSelesai } = getJamSlotTime(targetSched.jam_ke, targetSched.jam_mulai, targetSched.jam_selesai);

      let autoStatus = "Hadir Tepat Waktu";
      if (slotMulai && slotMulai !== "-") {
        const [hM, mM] = slotMulai.split(":").map(Number);
        const [hN, mN] = nowTime.split(":").map(Number);
        if (!isNaN(hM) && !isNaN(mM) && !isNaN(hN) && !isNaN(mN)) {
          const startMin = hM * 60 + mM;
          const nowMin = hN * 60 + mN;
          // Toleransi keterlambatan presensi mengajar guru
          if (nowMin > startMin + toleransiGuru) {
            autoStatus = "Terlambat Masuk Kelas";
          }
        }
      }

      // Check Schedule Time restriction if enabled
      if (batasiJamJadwal && slotMulai && slotMulai !== "-" && slotSelesai && slotSelesai !== "-") {
        const [hM, mM] = slotMulai.split(":").map(Number);
        const [hS, mS] = slotSelesai.split(":").map(Number);
        const [hN, mN] = nowTime.split(":").map(Number);
        if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS) && !isNaN(hN) && !isNaN(mN)) {
          const startMin = hM * 60 + mM;
          const endMin = hS * 60 + mS;
          const nowMin = hN * 60 + mN;

          if (nowMin < startMin - toleransiAwal) {
            setScanStatus({
              type: "error",
              msg: `Presensi Mengajar Ditolak (Belum Waktunya)`,
              details: `Jadwal ${targetSched.mapel} (${targetSched.kelas}) dimulai jam ${slotMulai}. Saat ini jam ${nowTime}`
            });
            playBeep(false);
            triggerFlash("error");
            if (speechEnabled) speakText("Absen ditolak. Belum waktunya.");
            if (queueId) {
              setScanQueue(prev => prev.map(item =>
                item.id === queueId ? { ...item, status: "error", message: "Belum waktunya" } : item
              ));
            }
            setIsProcessingScan(false);
            return;
          }

          if (nowMin > endMin + toleransiAkhir) {
            setScanStatus({
              type: "error",
              msg: `Presensi Mengajar Ditolak (Di Luar Jam Jadwal)`,
              details: `Jadwal ${targetSched.mapel} (${targetSched.kelas}) telah selesai jam ${slotSelesai}. Saat ini jam ${nowTime}`
            });
            playBeep(false);
            triggerFlash("error");
            if (speechEnabled) speakText("Absen ditolak. Di luar jam jadwal.");
            if (queueId) {
              setScanQueue(prev => prev.map(item =>
                item.id === queueId ? { ...item, status: "error", message: "Di luar jam jadwal" } : item
              ));
            }
            setIsProcessingScan(false);
            return;
          }
        }
      }

      const activeDay = targetSched.hari || selectedDay;

      // Find if there are multiple consecutive schedules for this teacher, class, and mapel on activeDay
      const matchingSchedules = lessonSchedules.filter(s =>
        (s.hari || "").toLowerCase() === activeDay.toLowerCase() &&
        (s.id_guru === targetSched.id_guru || (s.nama_guru && s.nama_guru.toLowerCase().includes(targetSched.nama_guru.toLowerCase()))) &&
        s.kelas.toLowerCase() === targetSched.kelas.toLowerCase() &&
        s.mapel.toLowerCase() === targetSched.mapel.toLowerCase()
      );

      let savedCount = 0;

      if (matchingSchedules.length > 1) {
        for (const schedItem of matchingSchedules) {
          const { mulai: sMulai, selesai: sSelesai } = getJamSlotTime(schedItem.jam_ke, schedItem.jam_mulai, schedItem.jam_selesai);

          const itemPayload = {
            id_guru: targetSched.id_guru || schedItem.id_guru || "",
            nama_guru: targetSched.nama_guru || schedItem.nama_guru || guruNama,
            kelas: schedItem.kelas || targetSched.kelas,
            mapel: schedItem.mapel || targetSched.mapel,
            jam_ke: Number(schedItem.jam_ke),
            jam_mulai_jadwal: sMulai !== "-" ? sMulai : slotMulai,
            jam_selesai_jadwal: sSelesai !== "-" ? sSelesai : slotSelesai,
            hari: activeDay,
            tanggal: todayStr,
            waktu_absen: nowTime,
            status: autoStatus,
            catatan_materi: "Presensi Otomatis Scan QR"
          };
          const res = await callGas("simpanAbsensiMengajarGuru", [itemPayload]);
          if (res && res.success !== false) savedCount++;
        }
      } else {
        const payload = {
          id_guru: targetSched.id_guru || "",
          nama_guru: targetSched.nama_guru || guruNama,
          kelas: targetSched.kelas || "",
          mapel: targetSched.mapel || "",
          jam_ke: Number(targetSched.jam_ke || 1),
          jam_mulai_jadwal: slotMulai,
          jam_selesai_jadwal: slotSelesai,
          hari: activeDay,
          tanggal: todayStr,
          waktu_absen: nowTime,
          status: autoStatus,
          catatan_materi: "Presensi Otomatis Scan QR"
        };
        const res = await callGas("simpanAbsensiMengajarGuru", [payload]);
        if (res && res.success !== false) savedCount = 1;
      }

      const jamNumbers = matchingSchedules.map(s => Number(s.jam_ke)).sort((a, b) => a - b);
      const minJam = jamNumbers.length > 0 ? jamNumbers[0] : targetSched.jam_ke;
      const maxJam = jamNumbers.length > 0 ? jamNumbers[jamNumbers.length - 1] : targetSched.jam_ke;
      const jamLabel = savedCount > 1
        ? `Blok ${savedCount} Jam Pelajaran (Jam ke-${minJam} s/d Jam ke-${maxJam})`
        : `Jam Ke-${targetSched.jam_ke}`;

      setScanStatus({
        type: "success",
        msg: `Presensi Mengajar ${targetSched.nama_guru || guruNama} Terekam Otomatis!`,
        targetName: targetSched.nama_guru || guruNama,
        details: `Kelas ${targetSched.kelas} • ${targetSched.mapel} • ${jamLabel} • Status: ${autoStatus}`
      });
      playBeep(true);
      triggerFlash("success");
      if (speechEnabled) speakText(`Presensi mengajar ${targetSched.nama_guru || guruNama} berhasil terekam.`);

      if (queueId) {
        setScanQueue(prev => prev.map(item =>
          item.id === queueId ? { ...item, status: "success", message: `Auto OK: Jam ${targetSched.jam_ke}` } : item
        ));
      }

      await fetchMengajarData();
    } catch (err: any) {
      setScanStatus({
        type: "error",
        msg: "Gagal menyimpan presensi mengajar otomatis",
        details: err.toString()
      });
      playBeep(false);
      triggerFlash("error");
    } finally {
      setIsProcessingScan(false);
      setBarcodeInputMengajar("");
      if (barcodeInputRefMengajar.current) barcodeInputRefMengajar.current.focus();
    }
  };

  // Process Scan Logic (Shared by Hardware & Camera)
  const processScanCode = async (rawCode: string, forcedType?: "harian" | "mengajar") => {
    const code = rawCode.trim();
    if (!code) return;

    // Determine active mode if Auto Time Switch is enabled
    let activeMode = mode;
    if (autoTimeSwitch) {
      const hour = new Date().getHours();
      activeMode = hour < 12 ? "Masuk" : "Pulang";
      if (activeMode !== mode) {
        setMode(activeMode);
      }
    }

    const now = Date.now();
    const debounceMs = fastMode === "turbo" ? 500 : fastMode === "express" ? 1000 : 2500;

    if (code === lastScanTextRef.current && (now - lastScanTimeRef.current) < debounceMs) {
      setScanStatus({ 
        type: "info", 
        msg: `Data "${code}" dibatasi (${debounceMs / 1000}s debounce)`,
        details: "Mencegah duplikasi scan beruntun." 
      });
      playBeep(false);
      triggerFlash("error");
      setTimeout(() => setScanStatus({ type: null, msg: null }), 1500);
      return;
    }

    lastScanTextRef.current = code;
    lastScanTimeRef.current = now;

    // Track throughput
    setRecentScanTimes(prev => [...prev.filter(t => now - t < 60000), now]);

    // Fast Mode: Instant input reset & focus for hardware reader so next barcode can be scanned right away
    if (fastMode !== "normal") {
      setBarcodeInputHarian("");
      setBarcodeInputMengajar("");
      if (attendanceType === "harian" && barcodeInputRefHarian.current) {
        barcodeInputRefHarian.current.focus();
      } else if (attendanceType === "mengajar" && barcodeInputRefMengajar.current) {
        barcodeInputRefMengajar.current.focus();
      }
    } else {
      setIsProcessingScan(true);
    }

    // Instant Feedback
    playBeep(true);
    triggerFlash("success");

    const queueId = Math.random().toString(36).substring(2, 9);
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Add item to queue feed
    setScanQueue(prev => [
      { id: queueId, code, timestamp: timeStr, status: "pending", message: "Memproses..." },
      ...prev.slice(0, 7) // keep 8 items
    ]);

    // Active attendance type strictly respects current tab or forcedType
    const activeAttendanceType = forcedType || attendanceType;

    setScanStatus({ 
      type: "info", 
      msg: `[Scan Cepat] Memproses ID: ${code}...`,
      details: activeAttendanceType === "mengajar" ? `Mode: Presensi Mengajar • Hari: ${selectedDay}` : `Mode: ${activeMode} • Speed: ${fastMode.toUpperCase()}`
    });

    // Check if handling Presensi Mengajar Guru
    if (activeAttendanceType === "mengajar") {
      try {
        const cleanCode = code.trim();
        const codeLower = cleanCode.toLowerCase();
        const codeWithoutPrefix = codeLower.replace(/^(guru|teacher|jadwal|id|nip)[_:\-\s]+/i, '').trim();

        const normalizeName = (str: string) => {
          return String(str || "")
            .toLowerCase()
            .replace(/[,.]/g, " ")
            .replace(/\b(s|m)\s*\.?\s*(pd|kom|ag|is|si|se|mm|hum|st|pt|tp|sos|ip|ed|pdi|mat|bio|fis)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
        };

        const isNameMatch = (n1: string, n2: string) => {
          if (!n1 || !n2) return false;
          const s1 = String(n1).trim().toLowerCase();
          const s2 = String(n2).trim().toLowerCase();
          if (!s1 || !s2) return false;
          if (s1 === s2) return true;
          if (s1.includes(s2) || s2.includes(s1)) return true;
          
          const norm1 = normalizeName(n1);
          const norm2 = normalizeName(n2);
          if (norm1 && norm2 && (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1))) return true;
          return false;
        };

        // 1. Direct Schedule ID match across ALL days
        const allDirectSchedMatches = lessonSchedules.filter(
          s => String(s.id_jadwal || "").trim().toLowerCase() === codeLower ||
               String(s.id_jadwal || "").trim().toLowerCase() === codeWithoutPrefix
        );

        if (allDirectSchedMatches.length > 0) {
          const matchedDirect = allDirectSchedMatches.find(s => (s.hari || "").trim().toLowerCase() === selectedDay.trim().toLowerCase()) || allDirectSchedMatches[0];
          if (matchedDirect.hari && matchedDirect.hari !== selectedDay) {
            setSelectedDay(matchedDirect.hari);
          }
          await autoSaveAbsensiMengajar(matchedDirect, matchedDirect.nama_guru, queueId);
          return;
        }

        // 2. Find teacher in teachersList
        const matchedTeacher = teachersList.find(t => {
          const tId = String(t.id_guru || t.id || "").trim().toLowerCase();
          const tNip = String(t.nip_nuptk || t.nip || "").trim().toLowerCase();
          const tQr = String(t.qr_content || t.qr_code || "").trim().toLowerCase();
          return (
            (tId && (tId === codeLower || tId === codeWithoutPrefix)) ||
            (tNip && (tNip === codeLower || tNip === codeWithoutPrefix)) ||
            (tQr && (tQr === codeLower || tQr === codeWithoutPrefix)) ||
            isNameMatch(t.nama_guru, cleanCode) ||
            isNameMatch(t.nama_guru, codeWithoutPrefix)
          );
        });

        const guruId = matchedTeacher ? (matchedTeacher.id_guru || matchedTeacher.id || cleanCode) : cleanCode;
        const guruNama = matchedTeacher ? matchedTeacher.nama_guru : cleanCode;

        // Schedules for target day
        const daySchedules = lessonSchedules.filter(
          s => (s.hari || "").trim().toLowerCase() === selectedDay.trim().toLowerCase()
        );

        // Teacher Schedule match on target day
        const teacherSchedMatch = daySchedules.filter(s => {
          const sGuruId = String(s.id_guru || "").trim().toLowerCase();
          const sGuruName = s.nama_guru;

          if (matchedTeacher) {
            const tId = String(matchedTeacher.id_guru || matchedTeacher.id || "").trim().toLowerCase();
            const tNip = String(matchedTeacher.nip_nuptk || matchedTeacher.nip || "").trim().toLowerCase();
            if (sGuruId && (sGuruId === tId || sGuruId === tNip)) return true;
            if (isNameMatch(sGuruName, matchedTeacher.nama_guru)) return true;
          }

          if (sGuruId && (sGuruId === codeLower || sGuruId === codeWithoutPrefix)) return true;
          if (isNameMatch(sGuruName, cleanCode) || isNameMatch(sGuruName, codeWithoutPrefix)) return true;

          return false;
        });

        if (teacherSchedMatch.length === 0) {
          // Check if teacher has schedules on OTHER days
          const otherDaySchedules = lessonSchedules.filter(s => {
            const sGuruId = String(s.id_guru || "").trim().toLowerCase();
            if (matchedTeacher) {
              const tId = String(matchedTeacher.id_guru || matchedTeacher.id || "").trim().toLowerCase();
              const tNip = String(matchedTeacher.nip_nuptk || matchedTeacher.nip || "").trim().toLowerCase();
              return (sGuruId && (sGuruId === tId || sGuruId === tNip)) || isNameMatch(s.nama_guru, matchedTeacher.nama_guru);
            }
            return (sGuruId && (sGuruId === codeLower || sGuruId === codeWithoutPrefix)) || isNameMatch(s.nama_guru, cleanCode) || isNameMatch(s.nama_guru, codeWithoutPrefix);
          });

          if (otherDaySchedules.length > 0) {
            const availableDays = Array.from(new Set(otherDaySchedules.map(s => s.hari))).join(", ");
            const errorMsg = `Jadwal mengajar '${guruNama}' tidak ada di hari ${selectedDay}. Ditemukan di hari: ${availableDays}`;
            setScanStatus({
              type: "error",
              msg: errorMsg,
              details: `Silakan klik tombol hari di atas untuk memilih hari: ${availableDays}`
            });
            playBeep(false);
            triggerFlash("error");
            if (speechEnabled) speakText(`Jadwal ada di hari ${availableDays}.`);

            setScanQueue(prev => prev.map(item => 
              item.id === queueId ? { ...item, status: "error", message: `Ada di hari ${availableDays}` } : item
            ));
            return;
          }

          const errorMsg = `Jadwal mengajar tidak ditemukan untuk '${guruNama}' di database.`;
          setScanStatus({
            type: "error",
            msg: errorMsg,
            details: "Pastikan jadwal pelajaran telah diinput pada menu Jadwal Pelajaran."
          });
          playBeep(false);
          triggerFlash("error");
          if (speechEnabled) speakText("Jadwal tidak ditemukan.");

          setScanQueue(prev => prev.map(item => 
            item.id === queueId ? { ...item, status: "error", message: "Tidak ada jadwal" } : item
          ));
          return;
        }

        // Find active schedules within current time window if restriction is enabled
        const nowTimeStr = new Date().toTimeString().slice(0, 5);
        const [hNow, mNow] = nowTimeStr.split(":").map(Number);
        const nowMin = hNow * 60 + mNow;

        const activeSchedMatches = teacherSchedMatch.filter(s => {
          const { mulai, selesai } = getJamSlotTime(s.jam_ke, s.jam_mulai, s.jam_selesai);
          if (!mulai || mulai === "-" || !selesai || selesai === "-") return true;
          const [hM, mM] = mulai.split(":").map(Number);
          const [hS, mS] = selesai.split(":").map(Number);
          if (isNaN(hM) || isNaN(mM) || isNaN(hS) || isNaN(mS)) return true;
          const startMin = hM * 60 + mM;
          const endMin = hS * 60 + mS;
          return nowMin >= startMin - toleransiAwal && nowMin <= endMin + toleransiAkhir;
        });

        if (batasiJamJadwal && activeSchedMatches.length === 0) {
          const schedListTimes = teacherSchedMatch.map(s => {
            const { mulai, selesai } = getJamSlotTime(s.jam_ke, s.jam_mulai, s.jam_selesai);
            return `Jam ${s.jam_ke} (${s.mapel} ${s.kelas}: ${mulai} - ${selesai})`;
          }).join("; ");

          const errorMsg = `Presensi Mengajar Ditolak: Di luar jam jadwal pelajaran.`;
          const detailMsg = `Guru '${guruNama}' (jam ${nowTimeStr}) tidak memiliki jadwal aktif saat ini. Jadwal hari ${selectedDay}: ${schedListTimes}`;

          setScanStatus({
            type: "error",
            msg: errorMsg,
            details: detailMsg
          });
          playBeep(false);
          triggerFlash("error");
          if (speechEnabled) speakText("Absen ditolak. Di luar jam jadwal.");

          setScanQueue(prev => prev.map(item => 
            item.id === queueId ? { ...item, status: "error", message: "Di luar jam jadwal" } : item
          ));
          return;
        }

        // Find first schedule not yet logged today
        const todayStr = filterTanggal || new Date().toISOString().split("T")[0];
        const loggedScheduleJamSet = new Set(
          absensiMengajarLogs
            .filter(l => String(l.tanggal || "").split("T")[0] === todayStr)
            .map(l => `${l.kelas}_${l.jam_ke}`)
        );

        const candidateSchedules = activeSchedMatches.length > 0 ? activeSchedMatches : teacherSchedMatch;
        const targetSched = candidateSchedules.find(s => !loggedScheduleJamSet.has(`${s.kelas}_${s.jam_ke}`)) || candidateSchedules[0];

        // Automatically record attendance without popup modal
        await autoSaveAbsensiMengajar(targetSched, guruNama, queueId);
        return;
      } catch (err: any) {
        setScanStatus({
          type: "error",
          msg: "Gagal memproses QR mengajar guru",
          details: err.toString()
        });
        playBeep(false);
        triggerFlash("error");
      } finally {
        setIsProcessingScan(false);
        setBarcodeInputMengajar("");
        if (barcodeInputRefMengajar.current) barcodeInputRefMengajar.current.focus();
      }

      setTimeout(() => setScanStatus({ type: null, msg: null }), 3500);
      return;
    }

    try {
      const scanTodayStr = new Date().toISOString().split("T")[0];
      const res = await callGas("prosesScanQR", [code, kategori, activeMode, scanTodayStr]);
      if (res && res.success) {
        // Extract real person name from response or local master data
        let personName = "";
        if (res.data) {
          personName = res.data.nama_siswa || res.data.nama_guru || res.data.nama || "";
        }
        if (!personName && res.message) {
          const matchColon = res.message.match(/:\s*([^(]+)/);
          if (matchColon && matchColon[1]) {
            personName = matchColon[1].trim();
          }
        }
        if (!personName) {
          const mList: any[] = kategori === "Siswa" ? (getStorage("data_siswa") || []) : (teachersList && teachersList.length > 0 ? teachersList : (getStorage("data_guru") || []));
          const cleanCode = code.toLowerCase();
          const cleanWithoutPrefix = cleanCode.replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          const matched = mList.find((x: any) => {
            const id = String(x.id_siswa || x.id_guru || x.id || "").trim().toLowerCase();
            const ident = String(x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase();
            const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase();
            return (id && id === cleanCode) || (ident && ident === cleanCode) || (qr && qr === cleanCode);
          }) || (cleanWithoutPrefix ? mList.find((x: any) => {
            const id = String(x.id_siswa || x.id_guru || x.id || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            const ident = String(x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            return (id && id === cleanWithoutPrefix) || (ident && ident === cleanWithoutPrefix) || (qr && qr === cleanWithoutPrefix);
          }) : null);

          if (matched) {
            personName = matched.nama_siswa || matched.nama_guru || matched.nama || "";
          }
        }
        const displayName = personName || code;

        setScanStatus({ 
          type: "success", 
          msg: res.message || `Presensi ${displayName} (${activeMode}) Berhasil!`,
          targetName: displayName,
          details: `Mode: ${activeMode} • Kategori: ${kategori}`
        });

        // Update queue item
        setScanQueue(prev => prev.map(item => 
          item.id === queueId ? { ...item, status: "success", message: res.message || `${displayName} Tersimpan` } : item
        ));

        // Voice announcement with actual person name
        if (speechEnabled) {
          speakText(fastMode === "turbo" ? `Hadir, ${displayName}!` : `${displayName}. Presensi ${activeMode} berhasil.`);
        }

        if (filterTanggal !== scanTodayStr) {
          setFilterTanggal(scanTodayStr);
        }
        loadLiveLogs(scanTodayStr);
      } else {
        const errorMsg = res?.message || "QR/Barcode tidak terdaftar dalam database";
        setScanStatus({ 
          type: "error", 
          msg: errorMsg,
          details: `Kode ID: ${code}`
        });
        playBeep(false);
        triggerFlash("error");

        setScanQueue(prev => prev.map(item => 
          item.id === queueId ? { ...item, status: "error", message: errorMsg } : item
        ));

        if (speechEnabled) speakText("Gagal.");
      }
    } catch (err: any) {
      setScanStatus({ 
        type: "error", 
        msg: "Gagal menghubungkan ke server", 
        details: err.toString() 
      });
      playBeep(false);
      triggerFlash("error");

      setScanQueue(prev => prev.map(item => 
        item.id === queueId ? { ...item, status: "error", message: "Error Koneksi" } : item
      ));
    } finally {
      setIsProcessingScan(false);
      setBarcodeInputHarian("");
      if (barcodeInputRefHarian.current) {
        barcodeInputRefHarian.current.focus();
      }
    }

    // Auto clear toast
    setTimeout(() => {
      setScanStatus({ type: null, msg: null });
    }, 3500);
  };

  // Hardware Scanner Form Submit Handlers
  const handleHardwareSubmitHarian = (e: FormEvent) => {
    e.preventDefault();
    if (barcodeInputHarian.trim() && !isProcessingScan) {
      processScanCode(barcodeInputHarian.trim(), "harian");
    }
  };

  const handleHardwareSubmitMengajar = (e: FormEvent) => {
    e.preventDefault();
    if (barcodeInputMengajar.trim() && !isProcessingScan) {
      processScanCode(barcodeInputMengajar.trim(), "mengajar");
    }
  };

  // Camera Scanner Lifecycle
  useEffect(() => {
    if (scanMethod === "camera" && cameraActive) {
      const html5Qrcode = new Html5Qrcode("qr-external-camera-frame", {
        verbose: false,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.ITF,
        ]
      });
      qrReaderRef.current = html5Qrcode;

      const cameraConfig = selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: "environment" };

      html5Qrcode.start(
        cameraConfig,
        { fps: 15 },
        (decodedText) => {
          processScanCode(decodedText);
        },
        () => {} // silent on scan error
      ).then(() => {
        setCameraError(null);
      }).catch(err => {
        console.error("External Camera Activation Error:", err);
        setCameraError("Kamera eksternal gagal dibuka. Pastikan izin browser diberikan & kabel USB/kamera terhubung.");
        setCameraActive(false);
      });
    }

    return () => {
      if (qrReaderRef.current && qrReaderRef.current.isScanning) {
        qrReaderRef.current.stop().catch(e => console.log("Stop camera scan err", e));
      }
    };
  }, [scanMethod, cameraActive, selectedCameraId, kategori, mode, attendanceType, selectedDay, filterTanggal]);

  // Load Entities for Manual Modal
  useEffect(() => {
    async function loadEntities() {
      if (!showManualModal) return;
      try {
        const res = await callGas("getDataMaster", [kategori]);
        if (res && res.success) {
          setEntitiesList(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadEntities();
  }, [showManualModal, kategori]);

  // Sync existing attendance record for selected manualTarget on filterTanggal
  useEffect(() => {
    if (!showManualModal || !manualTarget) return;

    const existing = recentLogs.find((l) => l.id_target === manualTarget);
    if (existing) {
      let defaultStatus = "Hadir (Auto)";
      let defaultJam = mode === "Masuk" ? "07:00" : "15:30";

      if (mode === "Masuk") {
        if (existing.status_masuk && existing.status_masuk !== "-") {
          defaultStatus = existing.status_masuk;
        } else if (existing.status_pulang && existing.status_pulang !== "-") {
          defaultStatus = existing.status_pulang;
        }
        if (existing.jam_masuk && existing.jam_masuk !== "-") {
          defaultJam = existing.jam_masuk;
        } else if (existing.jam_pulang && existing.jam_pulang !== "-") {
          defaultJam = existing.jam_pulang;
        }
      } else {
        if (existing.status_pulang && existing.status_pulang !== "-") {
          defaultStatus = existing.status_pulang;
        } else if (existing.status_masuk && existing.status_masuk !== "-") {
          defaultStatus = existing.status_masuk;
        }
        if (existing.jam_pulang && existing.jam_pulang !== "-") {
          defaultJam = existing.jam_pulang;
        } else if (existing.jam_masuk && existing.jam_masuk !== "-") {
          defaultJam = existing.jam_masuk;
        }
      }
      setManualStatus(defaultStatus);
      setManualJam(defaultJam);
      setManualKet(existing.ket && existing.ket !== "-" ? existing.ket : "");
    } else {
      setManualStatus("Hadir (Auto)");
      setManualJam(mode === "Masuk" ? "07:00" : "15:30");
      setManualKet("");
    }
  }, [manualTarget, filterTanggal, mode, showManualModal, recentLogs]);

  // Bulk Submit
  const handleBulkSubmit = async (status: string) => {
    if (selectedIds.length === 0 || isSubmittingBulk) return;
    setIsSubmittingBulk(true);
    try {
      setScanStatus({ type: "info", msg: `Memproses ${selectedIds.length} data absensi (${filterTanggal})...` });
      const res = await callGas("simpanBulkAbsenManual", [selectedIds, kategori, mode, filterTanggal, status, `Koreksi Bulk (${filterTanggal})`]);
      if (res && res.success) {
        setScanStatus({ type: "success", msg: res.message });
        speakText(`Koreksi massal ${selectedIds.length} data berhasil.`);
        setSelectedIds([]);
        loadLiveLogs(filterTanggal);
      } else {
        setScanStatus({ type: "error", msg: res?.message || "Gagal absen bulk" });
      }
    } catch (e: any) {
      setScanStatus({ type: "error", msg: e.toString() });
    } finally {
      setIsSubmittingBulk(false);
    }
    setTimeout(() => setScanStatus({ type: null, msg: null }), 3000);
  };

  // Handle Edit Single Row
  const handleEditRow = (log: LiveAbsen) => {
    setManualTarget(log.id_target);
    let defaultStatus = "Hadir (Auto)";
    if (log.status_masuk && log.status_masuk !== "-") {
      defaultStatus = log.status_masuk;
    } else if (log.status_pulang && log.status_pulang !== "-") {
      defaultStatus = log.status_pulang;
    }
    setManualStatus(defaultStatus);
    
    let defaultJam = mode === "Masuk" ? "07:00" : "15:30";
    if (mode === "Masuk") {
      if (log.jam_masuk && log.jam_masuk !== "-") defaultJam = log.jam_masuk;
      else if (log.jam_pulang && log.jam_pulang !== "-") defaultJam = log.jam_pulang;
    } else {
      if (log.jam_pulang && log.jam_pulang !== "-") defaultJam = log.jam_pulang;
      else if (log.jam_masuk && log.jam_masuk !== "-") defaultJam = log.jam_masuk;
    }
    setManualJam(defaultJam);

    setManualKet(log.ket && log.ket !== "-" ? log.ket : "");
    setManualEditOriginalDate(filterTanggal);
    setShowManualModal(true);
  };

  // Single Manual Submit
  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualTarget || isSubmittingManual) return;
    setIsSubmittingManual(true);

    try {
      setScanStatus({ type: "info", msg: `Menyimpan data absensi manual (${filterTanggal})...` });
      
      // If user changed the date while editing, clear the old date record first
      if (manualEditOriginalDate && manualEditOriginalDate !== filterTanggal) {
        await callGas("hapusKehadiran", [manualTarget, kategori, manualEditOriginalDate]);
      }

      const res = await callGas("simpanAbsenManual", [manualTarget, kategori, mode, filterTanggal, manualStatus, manualKet, manualJam]);
      if (res && res.success) {
        setScanStatus({ type: "success", msg: res.message });
        speakText("Absensi manual tersimpan.");
        setShowManualModal(false);
        setManualTarget("");
        setManualKet("");
        setSearchManualQuery("");
        setManualEditOriginalDate(null);
        loadLiveLogs(filterTanggal);
      } else {
        setScanStatus({ type: "error", msg: res?.message || "Gagal menyimpan absensi manual" });
      }
    } catch (err: any) {
      setScanStatus({ type: "error", msg: err.toString() });
    } finally {
      setIsSubmittingManual(false);
    }
    setTimeout(() => setScanStatus({ type: null, msg: null }), 3000);
  };

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelas, kategori, filterTanggal]);

  // Filter logs
  const filteredLogs = recentLogs.filter(log => {
    const matchesSearch = log.nama_target.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.id_target.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesKelas = true;
    if (kategori === "Siswa" && filterKelas !== "Semua") {
      matchesKelas = log.kelas_jurusan ? log.kelas_jurusan.includes(filterKelas) : false;
    }
    
    return matchesSearch && matchesKelas;
  });

  const totalPages = itemsPerPage === Infinity ? 1 : Math.ceil(filteredLogs.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = itemsPerPage === Infinity ? 0 : (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === Infinity ? filteredLogs.length : startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Statistics
  const totalRecords = filteredLogs.length;
  const countMasuk = filteredLogs.filter(l => l.jam_masuk && l.jam_masuk !== "-").length;
  const countBelum = filteredLogs.filter(l => !l.jam_masuk || l.jam_masuk === "-" || l.status_masuk === "Belum Absen").length;
  const countTepat = filteredLogs.filter(l => l.status_masuk && l.status_masuk.includes("Tepat")).length;
  const countPulang = filteredLogs.filter(l => l.jam_pulang && l.jam_pulang !== "-").length;

  const toggleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLogs.map(l => l.id_target));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" /> Clabel & Device Support
            </span>
            <span className="text-slate-400 text-xs font-mono">v2.5</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Absensi Scanner Eksternal
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Sistem penerimaan absensi kecepatan tinggi terintegrasi dengan alat barcode/QR scanner eksternal (Clabel Scanner, Zebra, USB/Bluetooth Barcode Reader, maupun Kamera USB).
          </p>
        </div>

        {/* Quick Action Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setAudioMuted(!audioMuted)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              audioMuted 
                ? "bg-rose-500/20 border-rose-500/40 text-rose-300" 
                : "bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-800"
            }`}
            title={audioMuted ? "Suara Bip Mati" : "Suara Bip Aktif"}
          >
            {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{audioMuted ? "Bip Off" : "Bip On"}</span>
          </button>

          <button 
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              speechEnabled 
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" 
                : "bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800"
            }`}
            title="Sura Pengisi Suara (TTS)"
          >
            <Volume2 className="w-4 h-4 text-indigo-400" />
            <span>{speechEnabled ? "Voice On" : "Voice Off"}</span>
          </button>

          <button 
            onClick={() => setShowGuide(!showGuide)}
            className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Petunjuk Clabel</span>
          </button>

          {!isGuru && (
            <button 
              onClick={() => setShowManualModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Absen Manual</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher: Presensi Harian vs Presensi Mengajar Guru */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setAttendanceType("harian")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            attendanceType === "harian"
              ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/20"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Presensi Kehadiran Harian (Siswa & Guru)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAttendanceType("mengajar");
            setScanMethod("hardware");
            setCameraActive(false);
            fetchMengajarData();
          }}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            attendanceType === "mengajar"
              ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Presensi Mengajar Guru (Jadwal Pelajaran)</span>
          {absensiMengajarLogs.length > 0 && (
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
              {absensiMengajarLogs.length} Log
            </span>
          )}
        </button>
      </div>

      {/* Clabel Scanner Troubleshooting & Setup Accordion */}
      {showGuide && (
        <div className="bg-amber-50/90 border border-amber-200 text-amber-900 rounded-2xl p-5 space-y-3 text-xs shadow-sm animate-fade-in">
          <div className="flex justify-between items-center border-b border-amber-200 pb-2">
            <h3 className="font-extrabold flex items-center gap-2 text-amber-950">
              <Usb className="w-4 h-4 text-amber-700" /> Panduan Integrasi CLABEL SCANNER & Barcode Eksternal
            </h3>
            <button onClick={() => setShowGuide(false)} className="text-amber-700 hover:text-amber-950 font-bold">Tutup ✕</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-1.5">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-5 h-5 bg-amber-600 text-white rounded-full inline-flex items-center justify-center text-[11px] font-black">1</span>
                Mode Barcode / HID (Keyboard)
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Hubungkan Clabel Scanner via USB / Dongle Wireless. Pilih tab <strong>"Hardware Scanner (Clabel)"</strong>. Scanner akan bertindak sebagai keyboard super cepat dengan auto-submit otomatis.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-1.5">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-5 h-5 bg-amber-600 text-white rounded-full inline-flex items-center justify-center text-[11px] font-black">2</span>
                Pengaturan Enter / Carriage Return
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Pastikan Clabel Scanner Anda dikonfigurasi untuk mengirimkan tombol <strong>ENTER</strong> setelah membaca QR/Barcode agar sistem dapat memproses secara otomatis tanpa menekan tombol kirim.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-1.5">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-5 h-5 bg-amber-600 text-white rounded-full inline-flex items-center justify-center text-[11px] font-black">3</span>
                Mode Kamera Eksternal (USB Webcam)
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Jika Clabel berupa scanner tipe kamera USB, pilih tab <strong>"Kamera Eksternal"</strong>, lalu pilih nama perangkat kamera Clabel pada dropdown menu kamera.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area: Conditional Rendering based on attendanceType */}
      {attendanceType === "harian" ? (
        /* Main Grid Layout for Harian Attendance */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column Scanner Controls */}
          {/* ... existing harian content ... */}

        <div className="lg:col-span-5 space-y-6">
          <div className={`bg-white rounded-2xl border p-6 shadow-sm space-y-5 transition-all duration-300 ${
            screenFlash === "success" 
              ? "border-emerald-500 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/10" 
              : screenFlash === "error" 
              ? "border-rose-500 ring-4 ring-rose-500/30 shadow-lg shadow-rose-500/10" 
              : "border-gray-100"
          }`}>
            
            {/* FAST SCAN EXPRESS CONFIGURATION BAR */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-3.5 rounded-xl border border-slate-800 text-white space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-xs font-black text-amber-300 tracking-wider uppercase flex items-center gap-1">
                    <FastForward className="w-3.5 h-3.5 text-amber-400" /> Mode Scan Cepat Express
                  </span>
                </div>
                
                {/* Speedometer Throughput Indicator */}
                <div className="bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 font-bold">
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{scansPerMinute} Scan/Mnt</span>
                </div>
              </div>

              {/* Speed Mode Pills */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => setFastMode("normal")}
                  className={`py-1.5 text-[10px] font-extrabold rounded-md transition-all flex items-center justify-center gap-1 ${
                    fastMode === "normal"
                      ? "bg-slate-800 text-white border border-slate-700 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Debounce 2.5s (Standar)"
                >
                  <span>🐢 Normal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFastMode("express")}
                  className={`py-1.5 text-[10px] font-extrabold rounded-md transition-all flex items-center justify-center gap-1 ${
                    fastMode === "express"
                      ? "bg-amber-500 text-slate-950 font-black shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Debounce 1.0s • Input Langsung Bersih"
                >
                  <Zap className="w-3 h-3" />
                  <span>⚡ Express</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFastMode("turbo")}
                  className={`py-1.5 text-[10px] font-extrabold rounded-md transition-all flex items-center justify-center gap-1 ${
                    fastMode === "turbo"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Debounce 0.5s • Super Fast Queue Buffer"
                >
                  <FastForward className="w-3 h-3" />
                  <span>🚀 Turbo</span>
                </button>
              </div>

              {/* Auto Time Switch Toggle */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Auto Jam Presensi:</span>
                  <span className="font-bold text-amber-300">
                    {new Date().getHours() < 12 ? "Pagi (Masuk)" : "Siang (Pulang)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoTimeSwitch(!autoTimeSwitch)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition-all ${
                    autoTimeSwitch 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {autoTimeSwitch ? "✓ Auto Active" : "Manual"}
                </button>
              </div>
            </div>

            {/* Input Mode Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Metode Scanner Eksternal</label>
              {!isGuru ? (
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200/80">
                  <button
                    type="button"
                    onClick={() => setScanMethod("hardware")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      scanMethod === "hardware" 
                        ? "bg-white text-indigo-700 shadow-sm border border-gray-200" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Keyboard className="w-4 h-4 text-indigo-600" />
                    <span>Hardware Scanner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setScanMethod("camera");
                      detectCameras();
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      scanMethod === "camera" 
                        ? "bg-white text-blue-700 shadow-sm border border-gray-200" 
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>Kamera Eksternal</span>
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hak Akses Guru: Aktif pemindaian absensi siswa via <strong>Hardware Scanner</strong>.</span>
                </div>
              )}
            </div>

            {/* Category & Mode Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {!isGuru && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">Kategori</label>
                  <div className="grid grid-cols-2 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => { setKategori("Siswa"); setSelectedIds([]); }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${kategori === "Siswa" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                    >
                      Siswa
                    </button>
                    <button 
                      onClick={() => { setKategori("Guru"); setSelectedIds([]); }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${kategori === "Guru" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
                    >
                      Guru
                    </button>
                  </div>
                </div>
              )}

              <div className={`space-y-1.5 ${isGuru ? "sm:col-span-2" : ""}`}>
                <label className="text-xs font-bold text-gray-500">Mode Presensi</label>
                <div className="grid grid-cols-2 gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button 
                    onClick={() => setMode("Masuk")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "Masuk" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500"}`}
                  >
                    Absen Masuk
                  </button>
                  <button 
                    onClick={() => setMode("Pulang")}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "Pulang" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500"}`}
                  >
                    Absen Pulang
                  </button>
                </div>
              </div>
            </div>

            {/* VIEW MODE 1: HARDWARE CLABEL / BARCODE SCANNER */}
            {scanMethod === "hardware" && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold text-gray-800 flex items-center gap-1.5">
                    <Usb className="w-4 h-4 text-indigo-600" /> Tangkapan Scanner Otomatis
                  </span>
                  <button
                    type="button"
                    onClick={() => setAutoFocusLock(!autoFocusLock)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                      autoFocusLock 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {autoFocusLock ? "🔒 Focus Lock Active" : "🔓 Focus Unlocked"}
                  </button>
                </div>

                <form onSubmit={handleHardwareSubmitHarian} className="space-y-3">
                  <div className="relative">
                    <input
                      ref={barcodeInputRefHarian}
                      type="text"
                      autoFocus
                      value={barcodeInputHarian}
                      onChange={(e) => setBarcodeInputHarian(e.target.value)}
                      placeholder="Arahkan Clabel Scanner / Ketik ID Siswa atau Guru..."
                      className="w-full bg-slate-900 border-2 border-indigo-500 text-white font-mono text-sm py-3.5 pl-10 pr-24 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner placeholder-slate-500"
                    />
                    <Scan className="w-5 h-5 text-indigo-400 absolute left-3 top-3.5 animate-pulse" />
                    
                    <button
                      type="submit"
                      disabled={!barcodeInputHarian.trim() || isProcessingScan}
                      className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold px-3 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isProcessingScan ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <span>Scan Harian</span>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Arahkan sinar scanner Clabel ke QR Code / Barcode kartu siswa. Data langsung terinput otomatis.</span>
                  </p>
                </form>
              </div>
            )}

            {/* VIEW MODE 2: CAMERA SCANNER WITH DEVICE SELECTOR */}
            {scanMethod === "camera" && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      Pilih Kamera Eksternal
                    </label>
                    <button
                      type="button"
                      onClick={detectCameras}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh Kamera
                    </button>
                  </div>

                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      setSelectedCameraId(e.target.value);
                      if (cameraActive) {
                        // restart camera with new device
                        setCameraActive(false);
                        setTimeout(() => setCameraActive(true), 200);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-blue-500"
                  >
                    {availableCameras.length === 0 ? (
                      <option value="">-- Tidak ada kamera terdeteksi --</option>
                    ) : (
                      availableCameras.map(cam => (
                        <option key={cam.id} value={cam.id}>{cam.label}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => setCameraActive(!cameraActive)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all ${
                      cameraActive ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                  >
                    {cameraActive ? (
                      <>
                        <CameraOff className="w-4 h-4" />
                        Matikan Kamera Eksternal
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        Aktifkan Kamera Live
                      </>
                    )}
                  </button>
                </div>

                {/* External Camera Video Frame */}
                <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-[4/5] sm:aspect-video min-h-[220px] max-h-[35vh] border border-slate-800 flex flex-col items-center justify-center">
                  {cameraActive ? (
                    <>
                      <div id="qr-external-camera-frame" className="w-full h-full object-cover"></div>
                      
                      <div className="absolute inset-0 border-2 border-blue-500/30 m-6 pointer-events-none rounded-lg">
                        <div className="w-full h-[2px] bg-blue-400 absolute top-0 left-0 animate-bounce-slow shadow-lg shadow-blue-500"></div>
                      </div>
                      
                      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] text-blue-400 font-mono tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                        EXTERNAL CAMERA LIVE • {kategori.toUpperCase()}
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-14 h-14 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                        <Camera className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-300 text-xs">Kamera Eksternal Nonaktif</h4>
                        <p className="text-slate-500 text-[11px] mt-1 max-w-[200px] mx-auto">Klik tombol aktifkan untuk memulai pemindaian lewat kamera USB</p>
                      </div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Result Feedback Card */}
          {scanStatus.type && (
            <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-md ${
              scanStatus.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
              scanStatus.type === "error" ? "bg-rose-50 border-rose-200 text-rose-900" :
              "bg-blue-50 border-blue-200 text-blue-900"
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">
                  {scanStatus.type === "success" ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : 
                   scanStatus.type === "error" ? <XCircle className="w-6 h-6 text-rose-600" /> : 
                   <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />}
                </span>
                <div className="space-y-1 flex-grow">
                  <h4 className="font-extrabold text-sm">
                    {scanStatus.type === "success" ? "Absensi Berhasil Terekam" : 
                     scanStatus.type === "error" ? "Gagal / Terjadi Masalah" : "Memproses Data..."}
                  </h4>
                  <p className="text-xs font-semibold">{scanStatus.msg}</p>
                  {scanStatus.details && (
                    <p className="text-[11px] opacity-80 font-mono mt-1 pt-1 border-t border-black/10">
                      {scanStatus.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Real-Time Rapid Scan Queue Feed */}
          {scanQueue.length > 0 && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-sm text-white space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Stream Antrean Scan Cepat ({scanQueue.length})
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Live Speed</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {scanQueue.map((item) => (
                  <div key={item.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        item.status === 'success' ? 'bg-emerald-500' :
                        item.status === 'error' ? 'bg-rose-500' : 'bg-amber-400 animate-ping'
                      }`}></span>
                      <span className="font-mono font-bold text-slate-200 truncate">{item.code}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] shrink-0">
                      <span className="text-slate-500 font-mono">{item.timestamp}</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold ${
                        item.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.status === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.status === 'success' ? '✓ Sukses' : item.status === 'error' ? '✕ Gagal' : '⏳ Diproses'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] text-gray-500 font-bold uppercase">Total {kategori}</span>
              <p className="text-2xl font-black text-gray-900">{totalRecords}</p>
              <p className="text-[10px] text-gray-400 font-semibold">{filterKelas !== "Semua" ? `Kelas ${filterKelas}` : "Semua Entitas"}</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm space-y-1">
              <span className="text-[11px] text-emerald-700 font-bold uppercase">Sudah Absen</span>
              <p className="text-2xl font-black text-emerald-600">{countMasuk}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{countTepat} tepat waktu</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-sm space-y-1">
              <span className="text-[11px] text-rose-700 font-bold uppercase">Belum Absen</span>
              <p className="text-2xl font-black text-rose-600">{countBelum}</p>
              <p className="text-[10px] text-rose-500 font-medium">Per {filterTanggal}</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE LOGS TABLE (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Data Presensi ({filterTanggal})
                <button
                  type="button"
                  onClick={() => loadLiveLogs(filterTanggal)}
                  disabled={isLoadingLogs}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
                  title="Refresh Data Log"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? "animate-spin text-blue-600" : ""}`} />
                </button>
              </h3>
              <p className="text-xs text-gray-500">
                Data presensi {kategori} tanggal {filterTanggal} (Scan / Koreksi Manual)
              </p>
            </div>
            
            {/* Table Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Limit Selector Top */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                <span className="text-xs font-semibold text-gray-500 shrink-0">Tampilkan:</span>
                <select 
                  value={itemsPerPage === Infinity ? "all" : itemsPerPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemsPerPage(val === "all" ? Infinity : Number(val));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">Semua</option>
                </select>
              </div>

              {/* Filter Tanggal */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <input 
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                />
                {filterTanggal !== new Date().toISOString().split("T")[0] && (
                  <button
                    type="button"
                    onClick={() => setFilterTanggal(new Date().toISOString().split("T")[0])}
                    className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-200 font-black px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0"
                    title="Kembali ke Tanggal Hari Ini"
                  >
                    Hari Ini
                  </button>
                )}
              </div>

              {kategori === "Siswa" && (
                <div className="relative">
                  <select 
                    value={filterKelas}
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="appearance-none bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-3 pr-8 text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Semua">Semua Kelas</option>
                    {classList.map((kls, idx) => (
                      <option key={idx} value={kls}>{kls}</option>
                    ))}
                  </select>
                  <Filter className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              )}

              <div className="relative flex-grow sm:flex-grow-0">
                <input 
                  type="text"
                  placeholder="Cari nama / ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-full"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Bulk Selection Actions Bar */}
          {!isGuru && selectedIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                {isSubmittingBulk && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                {selectedIds.length} entitas terpilih untuk koreksi manual bulk:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                <button 
                  onClick={() => handleBulkSubmit("Hadir (Auto)")}
                  disabled={isSubmittingBulk}
                  className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {isSubmittingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>Hadir</span>
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Terlambat")}
                  disabled={isSubmittingBulk}
                  className="bg-orange-100 text-orange-800 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-orange-200 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {isSubmittingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>Telat</span>
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Sakit")}
                  disabled={isSubmittingBulk}
                  className="bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {isSubmittingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>Sakit</span>
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Izin")}
                  disabled={isSubmittingBulk}
                  className="bg-indigo-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {isSubmittingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>Izin</span>
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Alfa")}
                  disabled={isSubmittingBulk}
                  className="bg-rose-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-rose-700 disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  {isSubmittingBulk ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  <span>Alfa</span>
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {!isGuru && (
                    <th className="py-3 px-4 w-10">
                      <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                        {selectedIds.length === filteredLogs.length && filteredLogs.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                  )}
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama</th>
                  {kategori === "Siswa" && <th className="py-3 px-4">Kelas</th>}
                  <th className="py-3 px-4">Jam Masuk</th>
                  <th className="py-3 px-4">Jam Pulang</th>
                  {!isGuru && <th className="py-3 px-4 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={kategori === "Siswa" ? (!isGuru ? 7 : 5) : (!isGuru ? 6 : 4)} className="py-10 text-center text-gray-400 font-medium">
                      Belum ada data presensi terekam tanggal {filterTanggal}
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const isSelected = selectedIds.includes(log.id_target);
                    
                    return (
                      <tr 
                        key={log.id_target}
                        onClick={() => !isGuru && toggleSelectId(log.id_target)}
                        className={`hover:bg-slate-50 transition-all duration-150 ${isSelected ? "bg-blue-50/40" : ""}`}
                      >
                        {!isGuru && (
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => toggleSelectId(log.id_target)} className="text-gray-400 hover:text-gray-600">
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        )}
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-gray-700 whitespace-nowrap">
                          {log.tanggal || filterTanggal}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{log.nama_target}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{log.id_target}</div>
                        </td>
                        {kategori === "Siswa" && (
                          <td className="py-3 px-4 text-gray-500 font-medium">{log.kelas_jurusan}</td>
                        )}
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800">{log.jam_masuk && log.jam_masuk !== "-" ? log.jam_masuk : "-"}</div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                            log.status_masuk.includes("Tepat") || log.status_masuk.includes("Hadir") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            log.status_masuk.includes("Terlambat") ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            log.status_masuk === "-" || log.status_masuk === "Belum Absen" ? "bg-gray-100 text-gray-500 border border-gray-200" : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {log.status_masuk === "-" ? "Belum Absen" : log.status_masuk}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-800">{log.jam_pulang && log.jam_pulang !== "-" ? log.jam_pulang : "-"}</div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                            log.status_pulang.includes("Tepat") || log.status_pulang.includes("Hadir") || log.status_pulang.includes("Pulang") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            log.status_pulang === "-" ? "text-gray-400" : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {log.status_pulang}
                          </span>
                        </td>
                        {!isGuru && (
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleEditRow(log)}
                              className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                              title={`Edit Presensi ${log.nama_target}`}
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredLogs.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <span>Tampilkan:</span>
                <select
                  value={itemsPerPage === Infinity ? "all" : itemsPerPage}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemsPerPage(val === "all" ? Infinity : Number(val));
                    setCurrentPage(1);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-lg py-1 px-2.5 text-xs font-bold text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="all">Semua</option>
                </select>
                <span className="text-gray-400">|</span>
                <span>
                  Menampilkan <span className="font-semibold text-gray-700">{Math.min(startIndex + 1, filteredLogs.length)}</span> -{" "}
                  <span className="font-semibold text-gray-700">{Math.min(endIndex, filteredLogs.length)}</span> dari{" "}
                  <span className="font-semibold text-gray-700">{filteredLogs.length}</span> data
                </span>
              </div>

              {itemsPerPage !== Infinity && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={safeCurrentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    if (
                      totalPages > 6 &&
                      pageNum !== 1 &&
                      pageNum !== totalPages &&
                      Math.abs(pageNum - safeCurrentPage) > 1
                    ) {
                      if (pageNum === 2 && safeCurrentPage > 3) {
                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                      }
                      if (pageNum === totalPages - 1 && safeCurrentPage < totalPages - 2) {
                        return <span key={pageNum} className="px-1 text-gray-400">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer ${
                          safeCurrentPage === pageNum
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                            : "hover:bg-gray-100 text-gray-600"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={safeCurrentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 disabled:opacity-40 disabled:hover:bg-white disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      ) : (
        /* Presensi Mengajar Guru View */
        <div className="space-y-6 animate-fade-in">
          {/* Top Filter & Day Selector Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  Presensi Mengajar Guru Berdasarkan Jadwal Pelajaran
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pilih hari dan jadwal pelajaran guru untuk mencatat presensi kelas dan jurnal materi pembelajaran.
                </p>
              </div>

              {/* Day Selector Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 bg-gray-100/80 p-1.5 rounded-xl">
                {HARI_LIST.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedDay(h)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      selectedDay === h
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/60"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Tanggal Absen</label>
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Filter Kelas</label>
                <select
                  value={filterMengajarKelas}
                  onChange={(e) => setFilterMengajarKelas(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none"
                >
                  <option value="Semua">Semua Kelas</option>
                  {classList.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Filter Guru</label>
                <select
                  value={filterMengajarGuru}
                  onChange={(e) => setFilterMengajarGuru(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none"
                >
                  <option value="Semua">Semua Guru</option>
                  {teachersList.map((g) => (
                    <option key={g.id_guru || g.nama_guru} value={g.id_guru || g.nama_guru}>
                      {g.nama_guru} ({g.id_guru || "Guru"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Cari Mapel / Guru</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={filterMengajarSearch}
                    onChange={(e) => setFilterMengajarSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Cards Grid & Logs List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Quick Scanner Input for Teacher QR */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Scan Presensi Mengajar</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {selectedDay}
                  </span>
                </div>

                {/* HARDWARE SCANNER INPUT FOR PRESENSI MENGAJAR */}
                <div className="space-y-3 pt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-extrabold text-gray-700 flex items-center gap-1">
                      <Usb className="w-3.5 h-3.5 text-emerald-600" /> Input Barcode Scanner Guru
                    </span>
                    <button
                      type="button"
                      onClick={() => setAutoFocusLock(!autoFocusLock)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        autoFocusLock 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {autoFocusLock ? "🔒 Focus Lock Active" : "🔓 Focus Unlocked"}
                    </button>
                  </div>

                  <form onSubmit={handleHardwareSubmitMengajar} className="space-y-2">
                    <div className="relative">
                      <input
                        ref={barcodeInputRefMengajar}
                        type="text"
                        autoFocus
                        placeholder="Scan Barcode Guru / Ketik ID Guru..."
                        value={barcodeInputMengajar}
                        onChange={(e) => setBarcodeInputMengajar(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && barcodeInputMengajar) {
                            e.preventDefault();
                            processScanCode(barcodeInputMengajar, "mengajar");
                          }
                        }}
                        className="w-full bg-slate-900 text-emerald-400 font-mono text-xs px-3.5 py-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                      />
                      <Scan className="w-4 h-4 text-emerald-500 absolute right-3 top-3.5 animate-pulse" />
                    </div>

                    <button
                      type="submit"
                      disabled={!barcodeInputMengajar.trim() || isProcessingScan}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isProcessingScan ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memproses Jadwal...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Proses Presensi Mengajar</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Quick Helper Badge */}
                <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl space-y-1 text-[11px] text-emerald-900">
                  <span className="font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Auto Match Schedule ({selectedDay})
                  </span>
                  <p className="text-[10px] text-emerald-800 leading-snug">
                    Sistem otomatis mencocokkan jadwal hari <strong>{selectedDay}</strong> berdasarkan ID Guru / Barcode Jadwal yang discan.
                  </p>
                </div>
              </div>

              {/* Dynamic Result Feedback Card for Presensi Mengajar */}
              {scanStatus.type && (
                <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-md ${
                  scanStatus.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
                  scanStatus.type === "error" ? "bg-rose-50 border-rose-200 text-rose-900" :
                  "bg-blue-50 border-blue-200 text-blue-900"
                }`}>
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">
                      {scanStatus.type === "success" ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : 
                       scanStatus.type === "error" ? <XCircle className="w-6 h-6 text-rose-600" /> : 
                       <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />}
                    </span>
                    <div className="space-y-1 flex-grow">
                      <h4 className="font-extrabold text-sm">
                        {scanStatus.type === "success" ? "Presensi Mengajar Terdeteksi" : 
                         scanStatus.type === "error" ? "Gagal / Informasi Jadwal" : "Memproses Data..."}
                      </h4>
                      <p className="text-xs font-semibold">{scanStatus.msg}</p>
                      {scanStatus.details && (
                        <p className="text-[11px] opacity-80 font-mono mt-1 pt-1 border-t border-black/10">
                          {scanStatus.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Real-Time Rapid Scan Queue Feed for Presensi Mengajar */}
              {scanQueue.length > 0 && (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-sm text-white space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Zap className="w-3.5 h-3.5 text-amber-400" /> Stream Scan Mengajar ({scanQueue.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Live Speed</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {scanQueue.map((item) => (
                      <div key={item.id} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            item.status === 'success' ? 'bg-emerald-500' :
                            item.status === 'error' ? 'bg-rose-500' : 'bg-amber-400'
                          }`} />
                          <span className="font-mono text-[11px] text-slate-300 truncate">{item.code}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-slate-400">{item.message}</span>
                          <span className="text-[9px] font-mono text-slate-500">{item.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Jadwal Grid & Log Table */}
            <div className="lg:col-span-8 space-y-6">
              {/* Cards Grid for Today's Schedules */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex flex-wrap justify-between items-center border-b border-gray-100 pb-3 gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-extrabold text-sm text-gray-900">
                      Jadwal Pelajaran ({selectedDay})
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2 py-0.5 rounded-full">
                      {lessonSchedules.filter(s => (s.hari || "").toLowerCase() === selectedDay.toLowerCase() && (filterMengajarKelas === "Semua" || s.kelas === filterMengajarKelas)).length} Sesi
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1">
                      <span className="text-[11px] font-semibold text-gray-500 shrink-0">Tampilkan:</span>
                      <select 
                        value={itemsPerPageJadwal === Infinity ? "all" : itemsPerPageJadwal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemsPerPageJadwal(val === "all" ? Infinity : Number(val));
                          setCurrentPageJadwal(1);
                        }}
                        className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                      >
                        <option value={6}>6</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value="all">Semua</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={fetchMengajarData}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMengajar ? "animate-spin" : ""}`} />
                      <span>Muat Ulang</span>
                    </button>
                  </div>
                </div>

                {isLoadingMengajar ? (
                  <div className="py-12 text-center space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                    <p className="text-xs text-gray-500 font-medium">Memuat jadwal pelajaran dari database...</p>
                  </div>
                ) : (() => {
                  const filteredSchedules = lessonSchedules.filter(s => {
                    const matchHari = (s.hari || "").toLowerCase() === selectedDay.toLowerCase();
                    const matchKelas = filterMengajarKelas === "Semua" || s.kelas === filterMengajarKelas;
                    const matchGuru = filterMengajarGuru === "Semua" || s.id_guru === filterMengajarGuru || s.nama_guru === filterMengajarGuru;
                    const matchQuery = !filterMengajarSearch ||
                      s.mapel.toLowerCase().includes(filterMengajarSearch.toLowerCase()) ||
                      s.nama_guru.toLowerCase().includes(filterMengajarSearch.toLowerCase()) ||
                      s.kelas.toLowerCase().includes(filterMengajarSearch.toLowerCase());
                    return matchHari && matchKelas && matchGuru && matchQuery;
                  });

                  if (filteredSchedules.length === 0) {
                    return (
                      <div className="py-12 text-center space-y-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                        <BookMarked className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs font-bold text-gray-600">Tidak ada jadwal pelajaran untuk hari {selectedDay}</p>
                        <p className="text-[11px] text-gray-400">Silakan tambahkan jadwal di menu Jadwal Pelajaran.</p>
                      </div>
                    );
                  }

                  const totalPagesJadwal = itemsPerPageJadwal === Infinity ? 1 : Math.ceil(filteredSchedules.length / itemsPerPageJadwal);
                  const safePageJadwal = Math.min(currentPageJadwal, totalPagesJadwal || 1);
                  const startIdxJadwal = itemsPerPageJadwal === Infinity ? 0 : (safePageJadwal - 1) * itemsPerPageJadwal;
                  const endIdxJadwal = itemsPerPageJadwal === Infinity ? filteredSchedules.length : startIdxJadwal + itemsPerPageJadwal;
                  const pageSchedules = filteredSchedules.slice(startIdxJadwal, endIdxJadwal);

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {pageSchedules.map((sched) => {
                          // Check if already logged for filterTanggal
                          const existingLog = absensiMengajarLogs.find((l) => {
                            const logDate = String(l.tanggal || "").split("T")[0];
                            return (
                              logDate === filterTanggal &&
                              l.kelas === sched.kelas &&
                              Number(l.jam_ke) === Number(sched.jam_ke)
                            );
                          });

                          const { mulai: schedMulai, selesai: schedSelesai } = getJamSlotTime(sched.jam_ke, sched.jam_mulai, sched.jam_selesai);

                          return (
                            <div
                              key={sched.id_jadwal || `${sched.kelas}_${sched.jam_ke}_${sched.hari}`}
                              className={`p-4 rounded-xl border transition-all space-y-3 ${
                                existingLog
                                  ? "bg-emerald-50/40 border-emerald-200/80 shadow-sm"
                                  : "bg-white border-gray-200 hover:border-emerald-300 hover:shadow-md"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                                    Jam Ke-{sched.jam_ke} • {schedMulai} - {schedSelesai}
                                  </span>
                                  <h4 className="font-black text-sm text-gray-900">{sched.mapel}</h4>
                                  <p className="text-xs font-bold text-emerald-700">{sched.kelas}</p>
                                </div>

                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                  {sched.ruangan || "R.Kelas"}
                                </span>
                              </div>

                              <div className="text-xs text-gray-600 font-medium flex items-center gap-1.5 pt-1 border-t border-gray-100">
                                <UserCheck className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="truncate">{sched.nama_guru}</span>
                              </div>

                              {/* Action Button & Status */}
                              {existingLog ? (
                                <div className="pt-2 border-t border-emerald-100/80 space-y-2">
                                  <div className="flex justify-between items-center text-[11px]">
                                    <span className="bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                      <Check className="w-3 h-3" /> {existingLog.status || "Hadir"}
                                    </span>
                                    <span className="font-mono text-emerald-800 font-bold">
                                      {existingLog.waktu_absen || "-"}
                                    </span>
                                  </div>
                                  {existingLog.catatan_materi && (
                                    <p className="text-[11px] text-gray-600 bg-white/80 p-2 rounded-lg border border-emerald-100 italic line-clamp-2">
                                      "{existingLog.catatan_materi}"
                                    </p>
                                  )}
                                  {!isGuru && (
                                    <button
                                      type="button"
                                      onClick={() => openModalForSchedule(sched, existingLog)}
                                      className="w-full text-center text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white border border-emerald-300 py-1.5 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <Edit3 className="w-3 h-3" /> Edit Presensi / Materi
                                    </button>
                                  )}
                                </div>
                              ) : (
                                !isGuru ? (
                                  <button
                                    type="button"
                                    onClick={() => openModalForSchedule(sched)}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-xl transition-all shadow-sm shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Presensi Mengajar</span>
                                  </button>
                                ) : (
                                  <div className="w-full text-center text-[11px] font-semibold text-slate-400 bg-slate-50 py-2 rounded-xl border border-slate-200/60 flex items-center justify-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Belum Presensi (Otomatis via Scan)</span>
                                  </div>
                                )
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls for Schedules */}
                      {itemsPerPageJadwal !== Infinity && totalPagesJadwal > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white pt-3">
                          <div className="flex flex-1 justify-between sm:hidden">
                            <button
                              disabled={safePageJadwal === 1}
                              onClick={() => setCurrentPageJadwal(p => Math.max(p - 1, 1))}
                              className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ${
                                safePageJadwal === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
                              }`}
                            >
                              Sebelumnya
                            </button>
                            <button
                              disabled={safePageJadwal === totalPagesJadwal}
                              onClick={() => setCurrentPageJadwal(p => Math.min(p + 1, totalPagesJadwal))}
                              className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ${
                                safePageJadwal === totalPagesJadwal ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
                              }`}
                            >
                              Selanjutnya
                            </button>
                          </div>
                          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs text-gray-500 font-semibold">
                                Menampilkan <span className="font-bold text-gray-900">{filteredSchedules.length > 0 ? startIdxJadwal + 1 : 0}</span> sampai{" "}
                                <span className="font-bold text-gray-900">
                                  {Math.min(endIdxJadwal, filteredSchedules.length)}
                                </span>{" "}
                                dari <span className="font-bold text-gray-900">{filteredSchedules.length}</span> sesi
                              </p>
                            </div>
                            <div>
                              <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                                <button
                                  onClick={() => setCurrentPageJadwal(p => Math.max(p - 1, 1))}
                                  disabled={safePageJadwal === 1}
                                  className={`relative inline-flex items-center rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-50 ${
                                    safePageJadwal === 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>
                                
                                {Array.from({ length: totalPagesJadwal }, (_, i) => i + 1).map((page) => (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPageJadwal(page)}
                                    className={`relative inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-150 cursor-pointer ${
                                      safePageJadwal === page
                                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                    }`}
                                  >
                                    {page}
                                  </button>
                                ))}

                                <button
                                  onClick={() => setCurrentPageJadwal(p => Math.min(p + 1, totalPagesJadwal))}
                                  disabled={safePageJadwal === totalPagesJadwal}
                                  className={`relative inline-flex items-center rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-50 ${
                                    safePageJadwal === totalPagesJadwal ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </nav>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-0">
                <div className="p-4 bg-gray-50/80 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-extrabold text-sm text-gray-900">
                      Riwayat Log Presensi Mengajar ({filterTanggal})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1">
                      <span className="text-[11px] font-semibold text-gray-500 shrink-0">Tampilkan:</span>
                      <select 
                        value={itemsPerPageMengajar === Infinity ? "all" : itemsPerPageMengajar}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemsPerPageMengajar(val === "all" ? Infinity : Number(val));
                          setCurrentPageMengajar(1);
                        }}
                        className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value="all">Semua</option>
                      </select>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {absensiMengajarLogs.filter(l => String(l.tanggal || "").split("T")[0] === filterTanggal).length} Records
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-extrabold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Waktu</th>
                        <th className="p-3">Nama Guru</th>
                        <th className="p-3">Kelas & Mapel</th>
                        <th className="p-3">Jam Ke</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Materi / Catatan</th>
                        {!isGuru && <th className="p-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                      {(() => {
                        const filteredMengajar = absensiMengajarLogs.filter(l => String(l.tanggal || "").split("T")[0] === filterTanggal);
                        const totalPagesMengajar = itemsPerPageMengajar === Infinity ? 1 : Math.ceil(filteredMengajar.length / itemsPerPageMengajar);
                        const safePage = Math.min(currentPageMengajar, totalPagesMengajar || 1);
                        const startIdx = itemsPerPageMengajar === Infinity ? 0 : (safePage - 1) * itemsPerPageMengajar;
                        const endIdx = itemsPerPageMengajar === Infinity ? filteredMengajar.length : startIdx + itemsPerPageMengajar;
                        const pageLogs = filteredMengajar.slice(startIdx, endIdx);

                        if (filteredMengajar.length === 0) {
                          return (
                            <tr>
                              <td colSpan={isGuru ? 6 : 7} className="p-8 text-center text-gray-400">
                                Belum ada riwayat presensi mengajar untuk tanggal {filterTanggal}.
                              </td>
                            </tr>
                          );
                        }

                        return pageLogs.map((log) => (
                          <tr key={log.id_log || `${log.kelas}_${log.jam_ke}_${log.waktu_absen}`} className="hover:bg-gray-50/80 transition-colors">
                            <td className="p-3 font-mono font-bold text-gray-900">{log.waktu_absen || "-"}</td>
                            <td className="p-3 font-bold text-gray-900">{log.nama_guru}</td>
                            <td className="p-3">
                              <span className="font-extrabold text-emerald-700 block">{log.kelas}</span>
                              <span className="text-gray-500 text-[11px]">{log.mapel}</span>
                            </td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                Jam ke-{log.jam_ke}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                                String(log.status).includes("Terlambat")
                                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                                  : String(log.status).includes("Tidak Hadir")
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : String(log.status).includes("Izin") || String(log.status).includes("Sakit") || String(log.status).includes("Tugas")
                                  ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              }`}>
                                {log.status || "Hadir"}
                              </span>
                            </td>
                            <td className="p-3 text-gray-600 max-w-xs truncate">{log.catatan_materi || "-"}</td>
                            {!isGuru && (
                              <td className="p-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => log.id_log && handleDeleteMengajar(log.id_log)}
                                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                  title="Hapus catatan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Mengajar Logs */}
                {(() => {
                  const filteredMengajar = absensiMengajarLogs.filter(l => String(l.tanggal || "").split("T")[0] === filterTanggal);
                  const totalPagesMengajar = itemsPerPageMengajar === Infinity ? 1 : Math.ceil(filteredMengajar.length / itemsPerPageMengajar);
                  const safePage = Math.min(currentPageMengajar, totalPagesMengajar || 1);
                  const startIdx = itemsPerPageMengajar === Infinity ? 0 : (safePage - 1) * itemsPerPageMengajar;
                  const endIdx = itemsPerPageMengajar === Infinity ? filteredMengajar.length : startIdx + itemsPerPageMengajar;

                  if (itemsPerPageMengajar === Infinity || totalPagesMengajar <= 1) return null;

                  return (
                    <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6">
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          disabled={safePage === 1}
                          onClick={() => setCurrentPageMengajar(p => Math.max(p - 1, 1))}
                          className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ${
                            safePage === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          Sebelumnya
                        </button>
                        <button
                          disabled={safePage === totalPagesMengajar}
                          onClick={() => setCurrentPageMengajar(p => Math.min(p + 1, totalPagesMengajar))}
                          className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 ${
                            safePage === totalPagesMengajar ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
                          }`}
                        >
                          Selanjutnya
                        </button>
                      </div>
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs text-gray-500 font-semibold">
                            Menampilkan <span className="font-bold text-gray-900">{filteredMengajar.length > 0 ? startIdx + 1 : 0}</span> sampai{" "}
                            <span className="font-bold text-gray-900">
                              {Math.min(endIdx, filteredMengajar.length)}
                            </span>{" "}
                            dari <span className="font-bold text-gray-900">{filteredMengajar.length}</span> data
                          </p>
                        </div>
                        <div>
                          <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPageMengajar(p => Math.max(p - 1, 1))}
                              disabled={safePage === 1}
                              className={`relative inline-flex items-center rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-50 ${
                                safePage === 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                              }`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            {Array.from({ length: totalPagesMengajar }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => setCurrentPageMengajar(page)}
                                className={`relative inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold transition-all duration-150 cursor-pointer ${
                                  safePage === page
                                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/10"
                                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                              >
                                {page}
                              </button>
                            ))}

                            <button
                              onClick={() => setCurrentPageMengajar(p => Math.min(p + 1, totalPagesMengajar))}
                              disabled={safePage === totalPagesMengajar}
                              className={`relative inline-flex items-center rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-50 ${
                                safePage === totalPagesMengajar ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                              }`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Presensi Mengajar Modal */}
      {showMengajarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 pt-4 sm:pt-10 overflow-y-auto z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl max-w-md w-full overflow-hidden my-auto sm:my-0">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Presensi Mengajar Guru
                </h3>
                <p className="text-xs text-slate-300">
                  {mengajarForm.kelas} • {mengajarForm.mapel} (Jam ke-{mengajarForm.jam_ke})
                </p>
              </div>
              <button
                onClick={() => setShowMengajarModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMengajar} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-gray-500">Nama Guru Pengajar</label>
                <input
                  type="text"
                  required
                  value={mengajarForm.nama_guru}
                  onChange={(e) => setMengajarForm({ ...mengajarForm, nama_guru: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-500">Kelas</label>
                  <input
                    type="text"
                    required
                    value={mengajarForm.kelas}
                    onChange={(e) => setMengajarForm({ ...mengajarForm, kelas: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-500">Mata Pelajaran</label>
                  <input
                    type="text"
                    required
                    value={mengajarForm.mapel}
                    onChange={(e) => setMengajarForm({ ...mengajarForm, mapel: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-500">Waktu Absen Masuk</label>
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      required
                      value={mengajarForm.waktu_absen}
                      onChange={(e) => setMengajarForm({ ...mengajarForm, waktu_absen: e.target.value })}
                      className="bg-transparent font-bold font-mono text-gray-800 focus:outline-none w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-gray-500">Status Kehadiran</label>
                  <select
                    value={mengajarForm.status}
                    onChange={(e) => setMengajarForm({ ...mengajarForm, status: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-800 focus:outline-none"
                  >
                    <option value="Hadir Tepat Waktu">Hadir Tepat Waktu</option>
                    <option value="Terlambat Masuk Kelas">Terlambat Masuk Kelas</option>
                    <option value="Izin">Izin</option>
                    <option value="Sakit">Sakit</option>
                    <option value="Tugas Luar">Tugas Luar</option>
                    <option value="Tidak Hadir">Tidak Hadir</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-gray-500">Materi Pembelajaran / Catatan Jurnal</label>
                <textarea
                  rows={3}
                  value={mengajarForm.catatan_materi}
                  onChange={(e) => setMengajarForm({ ...mengajarForm, catatan_materi: e.target.value })}
                  placeholder="Ringkasan bab/materi yang diajarkan hari ini di kelas..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMengajarModal(false)}
                  disabled={isSubmittingMengajar}
                  className="bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMengajar}
                  className="bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/20"
                >
                  {isSubmittingMengajar ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Presensi Mengajar</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 sm:p-6 pt-4 sm:pt-10 overflow-y-auto z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden my-auto sm:my-0">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-base">{manualEditOriginalDate ? "Edit / Koreksi Presensi" : "Koreksi Absensi Manual"} ({kategori})</h3>
              <button onClick={() => { setShowManualModal(false); setManualEditOriginalDate(null); }} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Tanggal Absensi</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                  <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                  <input 
                    type="date"
                    required
                    value={filterTanggal}
                    onChange={(e) => {
                      const d = e.target.value;
                      setFilterTanggal(d);
                      loadLiveLogs(d);
                    }}
                    className="bg-transparent text-xs text-gray-800 font-bold focus:outline-none w-full cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Pilih Entitas ({kategori})</label>
                
                <div className="relative mb-2">
                  <input 
                    type="text"
                    placeholder="Saring nama..."
                    value={searchManualQuery}
                    onChange={(e) => setSearchManualQuery(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-gray-700 w-full"
                  />
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                </div>

                <select 
                  required
                  value={manualTarget}
                  onChange={(e) => setManualTarget(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium focus:outline-none"
                >
                  <option value="">-- Pilih {kategori === "Siswa" ? "Siswa" : "Guru"} --</option>
                  {entitiesList
                    .filter(ent => {
                      const name = ent.nama_siswa || ent.nama_guru || "";
                      return name.toLowerCase().includes(searchManualQuery.toLowerCase());
                    })
                    .map((ent) => {
                      const id = ent.id_siswa || ent.id_guru;
                      const name = ent.nama_siswa || ent.nama_guru;
                      const detail = kategori === "Siswa" ? ` (${ent.kelas} ${ent.jurusan})` : "";
                      return (
                        <option key={id} value={id}>{id} - {name}{detail}</option>
                      );
                    })}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Status Kehadiran</label>
                <select 
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none"
                >
                  <option value="Hadir (Auto)">Hadir (Otomatis Sesuai Jadwal)</option>
                  <option value="Tepat Waktu">Hadir Tepat Waktu (Paksa)</option>
                  <option value="Terlambat">Hadir Terlambat (Paksa)</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                  <option value="Tidak Hadir">Tidak Hadir</option>
                  <option value="Alfa">Alfa (Tanpa Keterangan)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Waktu / Jam Presensi ({mode})</label>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2.5">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <input 
                    type="text"
                    required
                    placeholder={mode === "Masuk" ? "07:30" : "15:30"}
                    value={manualJam}
                    onChange={(e) => setManualJam(e.target.value)}
                    className="bg-transparent text-xs text-gray-800 font-bold font-mono focus:outline-none w-full"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Keterangan / Catatan</label>
                <textarea 
                  value={manualKet}
                  onChange={(e) => setManualKet(e.target.value)}
                  placeholder="Keterangan dispensasi / koreksi scanner..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  disabled={isSubmittingManual}
                  className="bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={!manualTarget || isSubmittingManual}
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all"
                >
                  {isSubmittingManual ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Absensi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
