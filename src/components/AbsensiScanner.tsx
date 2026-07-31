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
  Info
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { callGas, getStorageKey } from "../lib/gasApi";
import { LiveAbsen } from "../types";

export default function AbsensiScanner() {
  const [kategori, setKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [mode, setMode] = useState<"Masuk" | "Pulang">("Masuk");
  
  // Scanner Type: "hardware" (Clabel USB/Bluetooth Scanner / HID) vs "camera" (External USB Camera / Clabel Video Scanner)
  const [scanMethod, setScanMethod] = useState<"hardware" | "camera">("hardware");

  // Hardware Scanner States
  const [barcodeInput, setBarcodeInput] = useState("");
  const [autoFocusLock, setAutoFocusLock] = useState(true);
  const [isProcessingScan, setIsProcessingScan] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);

  // Camera Scanner States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  // Sound & Speech Feedback States
  const [audioMuted, setAudioMuted] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  // Logs & Table States
  const [recentLogs, setRecentLogs] = useState<LiveAbsen[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [classList, setClassList] = useState<string[]>([]);
  
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Manual Dialog States
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTarget, setManualTarget] = useState<string>("");
  const [manualStatus, setManualStatus] = useState<string>("Hadir (Auto)");
  const [manualKet, setManualKet] = useState<string>("");
  const [entitiesList, setEntitiesList] = useState<any[]>([]);
  const [searchManualQuery, setSearchManualQuery] = useState("");

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

  const isGuru = currentUser?.role === "Guru";

  useEffect(() => {
    if (isGuru) {
      setKategori("Siswa");
    }
  }, [isGuru]);

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
      const res = await callGas("getKelasSemua");
      if (Array.isArray(res)) {
        setClassList(res);
      }
    }
    fetchClasses();
  }, []);

  // Load live logs of today
  const loadLiveLogs = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await callGas("getLiveAbsenHariIni", [kategori, today, "Semua"]);
      if (res && res.success) {
        setRecentLogs(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadLiveLogs();
  }, [kategori]);

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
        if (barcodeInputRef.current) {
          barcodeInputRef.current.focus();
        }
      }, 100);

      const handleGlobalClick = (e: MouseEvent) => {
        // Keep focus inside scanner input if user didn't click inside an interactive element
        const target = e.target as HTMLElement;
        if (
          barcodeInputRef.current &&
          !target.closest("button") &&
          !target.closest("input") &&
          !target.closest("select") &&
          !target.closest("textarea")
        ) {
          barcodeInputRef.current.focus();
        }
      };

      window.addEventListener("click", handleGlobalClick);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("click", handleGlobalClick);
      };
    }
  }, [scanMethod, autoFocusLock]);

  // Process Scan Logic (Shared by Hardware & Camera)
  const processScanCode = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || isProcessingScan) return;

    const now = new Date().getTime();
    if (code === lastScanTextRef.current && (now - lastScanTimeRef.current) < 2500) {
      setScanStatus({ 
        type: "info", 
        msg: `Data "${code}" baru saja discan`,
        details: "Mencegah duplikasi scan beruntun (debounced)." 
      });
      playBeep(false);
      setTimeout(() => setScanStatus({ type: null, msg: null }), 2000);
      return;
    }

    lastScanTextRef.current = code;
    lastScanTimeRef.current = now;
    setIsProcessingScan(true);

    playBeep(true);
    setScanStatus({ type: "info", msg: `Memproses Scan Clabel: ${code}...` });

    try {
      const res = await callGas("prosesScanQR", [code, kategori, mode]);
      if (res && res.success) {
        setScanStatus({ 
          type: "success", 
          msg: res.message || `Absensi ${kategori} Berhasil!`,
          targetName: code,
          details: `Mode: ${mode} • Kategori: ${kategori}`
        });

        // Voice announcement
        speakText(`${code}. Absen ${mode} berhasil.`);

        loadLiveLogs();
      } else {
        const errorMsg = res?.message || "QR/Barcode tidak terdaftar dalam database";
        setScanStatus({ 
          type: "error", 
          msg: errorMsg,
          details: `Kode ID: ${code}`
        });
        playBeep(false);
        speakText("Gagal. Kode tidak terdaftar.");
      }
    } catch (err: any) {
      setScanStatus({ 
        type: "error", 
        msg: "Gagal menghubungkan ke server", 
        details: err.toString() 
      });
      playBeep(false);
    } finally {
      setIsProcessingScan(false);
      setBarcodeInput("");
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
    }

    // Auto clear toast
    setTimeout(() => {
      setScanStatus({ type: null, msg: null });
    }, 4000);
  };

  // Hardware Scanner Form Submit (triggers when Clabel sends Enter key)
  const handleHardwareSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      processScanCode(barcodeInput);
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
  }, [scanMethod, cameraActive, selectedCameraId, kategori, mode]);

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

  // Bulk Submit
  const handleBulkSubmit = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      setScanStatus({ type: "info", msg: `Memproses ${selectedIds.length} data absensi...` });
      const today = new Date().toISOString().split("T")[0];
      const res = await callGas("simpanBulkAbsenManual", [selectedIds, kategori, mode, today, status, "Koreksi Bulk Scanner"]);
      if (res && res.success) {
        setScanStatus({ type: "success", msg: res.message });
        speakText(`Koreksi massal ${selectedIds.length} data berhasil.`);
        setSelectedIds([]);
        loadLiveLogs();
      } else {
        setScanStatus({ type: "error", msg: res?.message || "Gagal absen bulk" });
      }
    } catch (e: any) {
      setScanStatus({ type: "error", msg: e.toString() });
    }
    setTimeout(() => setScanStatus({ type: null, msg: null }), 3000);
  };

  // Single Manual Submit
  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!manualTarget) return;

    try {
      setScanStatus({ type: "info", msg: "Menyimpan data absensi manual..." });
      const today = new Date().toISOString().split("T")[0];
      const res = await callGas("simpanAbsenManual", [manualTarget, kategori, mode, today, manualStatus, manualKet]);
      if (res && res.success) {
        setScanStatus({ type: "success", msg: res.message });
        speakText("Absensi manual tersimpan.");
        setShowManualModal(false);
        setManualTarget("");
        setManualKet("");
        loadLiveLogs();
      } else {
        setScanStatus({ type: "error", msg: res?.message || "Gagal menyimpan absensi manual" });
      }
    } catch (err: any) {
      setScanStatus({ type: "error", msg: err.toString() });
    }
    setTimeout(() => setScanStatus({ type: null, msg: null }), 3000);
  };

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelas, kategori]);

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
  const countTepat = filteredLogs.filter(l => l.status_masuk.includes("Tepat")).length;
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

          <button 
            onClick={() => setShowManualModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Absen Manual</span>
          </button>
        </div>
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

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: SCANNER INPUT & CONFIGURATION (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            
            {/* Input Mode Selector Tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Metode Scanner Eksternal</label>
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

                <form onSubmit={handleHardwareSubmit} className="space-y-3">
                  <div className="relative">
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      autoFocus
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="Arahkan Clabel Scanner / Ketik ID..."
                      className="w-full bg-slate-900 border-2 border-indigo-500 text-white font-mono text-sm py-3.5 pl-10 pr-24 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner placeholder-slate-500"
                    />
                    <Scan className="w-5 h-5 text-indigo-400 absolute left-3 top-3.5 animate-pulse" />
                    
                    <button
                      type="submit"
                      disabled={!barcodeInput.trim() || isProcessingScan}
                      className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold px-3 rounded-lg transition-all flex items-center gap-1"
                    >
                      {isProcessingScan ? "Memproses..." : "Scan"}
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

          {/* Today's Metrics Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] text-gray-500 font-bold uppercase">Total Terekam</span>
              <p className="text-2xl font-black text-gray-900">{totalRecords}</p>
              <p className="text-[10px] text-emerald-600 font-semibold">{countTepat} tepat waktu</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] text-gray-500 font-bold uppercase">Absen Masuk / Pulang</span>
              <p className="text-2xl font-black text-blue-600">{countMasuk} / {countPulang}</p>
              <p className="text-[10px] text-gray-400 font-medium">Rekap Hari Ini ({kategori})</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE LOGS TABLE (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> Presensi Scanner Hari Ini
              </h3>
              <p className="text-xs text-gray-500">Live feed rekap hasil scan Clabel / Scanner eksternal hari ini</p>
            </div>
            
            {/* Table Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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
          {selectedIds.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-xs font-bold text-blue-800">
                {selectedIds.length} entitas terpilih untuk koreksi manual bulk:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                <button 
                  onClick={() => handleBulkSubmit("Hadir (Auto)")}
                  className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700"
                >
                  Hadir
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Terlambat")}
                  className="bg-orange-100 text-orange-800 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-orange-200"
                >
                  Telat
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Sakit")}
                  className="bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-700"
                >
                  Sakit
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Izin")}
                  className="bg-indigo-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700"
                >
                  Izin
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Alfa")}
                  className="bg-rose-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-rose-700"
                >
                  Alfa
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                      {selectedIds.length === filteredLogs.length && filteredLogs.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Nama</th>
                  {kategori === "Siswa" && <th className="py-3 px-4">Kelas</th>}
                  <th className="py-3 px-4">Jam Masuk</th>
                  <th className="py-3 px-4">Jam Pulang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={kategori === "Siswa" ? 5 : 4} className="py-10 text-center text-gray-400 font-medium">
                      Belum ada data presensi terekam scanner hari ini
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log) => {
                    const isSelected = selectedIds.includes(log.id_target);
                    
                    return (
                      <tr 
                        key={log.id_target}
                        onClick={() => toggleSelectId(log.id_target)}
                        className={`hover:bg-slate-50 cursor-pointer transition-all duration-150 ${isSelected ? "bg-blue-50/40" : ""}`}
                      >
                        <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => toggleSelectId(log.id_target)} className="text-gray-400 hover:text-gray-600">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900">{log.nama_target}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{log.id_target}</div>
                        </td>
                        {kategori === "Siswa" && (
                          <td className="py-3 px-4 text-gray-500 font-medium">{log.kelas_jurusan}</td>
                        )}
                        <td className="py-3 px-4">
                          <div className="font-bold">{log.jam_masuk}</div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                            log.status_masuk.includes("Tepat") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            log.status_masuk.includes("Terlambat") ? "bg-amber-50 text-amber-700 border border-amber-100" :
                            log.status_masuk === "-" ? "text-gray-400" : "bg-rose-50 text-rose-700 border border-rose-100"
                          }`}>
                            {log.status_masuk}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold">{log.jam_pulang}</div>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                            log.status_pulang.includes("Tepat") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                            log.status_pulang === "-" ? "text-gray-400" : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {log.status_pulang}
                          </span>
                        </td>
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

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-base">Koreksi Absensi Manual ({kategori})</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600 text-lg font-bold">✕</button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
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
                  <option value="Alfa">Alfa (Tanpa Keterangan)</option>
                </select>
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
                  className="bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={!manualTarget}
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  Simpan Absensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
