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
  Check,
  CheckSquare,
  Square,
  LogOut
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { callGas, getStorageKey } from "../lib/gasApi";
import { LiveAbsen, Siswa, Guru } from "../types";

export default function AbsensiQR() {
  const [kategori, setKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [mode, setMode] = useState<"Masuk" | "Pulang">("Masuk");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(false);
  const [recentLogs, setRecentLogs] = useState<LiveAbsen[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const filterKelasRef = useRef(filterKelas);
  filterKelasRef.current = filterKelas;
  const [classList, setClassList] = useState<string[]>([]);
  
  const [currentUser, setCurrentUser] = useState<any>(null);

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
  
  // States for Manual Dialog
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTarget, setManualTarget] = useState<string>(""); // id_siswa or id_guru
  const [manualStatus, setManualStatus] = useState<string>("Hadir (Auto)");
  const [manualKet, setManualKet] = useState<string>("");
  const [entitiesList, setEntitiesList] = useState<any[]>([]); // To search for manual attendance
  const [searchManualQuery, setSearchManualQuery] = useState("");

  // States for Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Toast / Status overlay
  const [scanStatus, setScanStatus] = useState<{ type: "success" | "error" | "info" | null; msg: string | null }>({ type: null, msg: null });

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const lastScanTextRef = useRef<string>("");

  // Sound feedback
  const playBeep = () => {
    if (audioMuted) return;
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked by browser. Interaction required."));
    } catch (e) {
      console.log("Audio play error", e);
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
      // Always fetch all classes ("Semua") from backend, we will filter locally on the client
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

  // Handle Scan Outcome
  const handleScanSuccess = async (decodedText: string) => {
    const now = new Date().getTime();
    if (decodedText === lastScanTextRef.current && (now - lastScanTimeRef.current) < 3000) {
      // De-bounce scanning same item within 3s
      return;
    }
    
    lastScanTextRef.current = decodedText;
    lastScanTimeRef.current = now;

    playBeep();
    setScanStatus({ type: "info", msg: `Memproses: ${decodedText}...` });

    try {
      const res = await callGas("prosesScanQR", [decodedText, kategori, mode]);
      if (res && res.success) {
        setScanStatus({ type: "success", msg: res.message });
        loadLiveLogs();
      } else {
        setScanStatus({ type: "error", msg: res?.message || "QR Code tidak terdaftar" });
      }
    } catch (err: any) {
      setScanStatus({ type: "error", msg: "Error Sistem: " + err.toString() });
    }

    // Clear alert after 3.5s
    setTimeout(() => {
      setScanStatus({ type: null, msg: null });
    }, 3500);
  };

  // QR Scanning Lifecycles
  useEffect(() => {
    if (cameraActive) {
      const html5Qrcode = new Html5Qrcode("qr-scanner-frame", {
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

      html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10
        },
        handleScanSuccess,
        () => {} // silent on failure
      ).then(() => {
        setCameraError(null);
      }).catch(err => {
        console.error("Camera activation failed", err);
        setCameraError("Kamera gagal diakses. Pastikan izin kamera diberikan.");
        setCameraActive(false);
      });
    }

    return () => {
      if (qrReaderRef.current && qrReaderRef.current.isScanning) {
        qrReaderRef.current.stop().catch(err => console.log("Stop scan failure", err));
      }
    };
  }, [cameraActive, kategori, mode]);

  // Load Students or Teachers for Manual Modal
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

  // Bulk Manual Submit
  const handleBulkSubmit = async (status: string) => {
    if (selectedIds.length === 0) return;
    try {
      setScanStatus({ type: "info", msg: `Memproses ${selectedIds.length} data absensi...` });
      const today = new Date().toISOString().split("T")[0];
      const res = await callGas("simpanBulkAbsenManual", [selectedIds, kategori, mode, today, status, "Koreksi Bulk"]);
      if (res && res.success) {
        setScanStatus({ type: "success", msg: res.message });
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

  // Filter logs by search query and class
  const filteredLogs = recentLogs.filter(log => {
    const matchesSearch = log.nama_target.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.id_target.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesKelas = true;
    if (kategori === "Siswa" && filterKelas !== "Semua") {
      matchesKelas = log.kelas_jurusan ? log.kelas_jurusan.includes(filterKelas) : false;
    }
    
    return matchesSearch && matchesKelas;
  });

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Kamera Scan Absensi QR</h1>
          <p className="text-xs text-gray-500">Scan QR Code siswa/guru untuk rekap absen otomatis tanpa upload</p>
        </div>
        
        {/* Buttons and Settings */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={() => setAudioMuted(!audioMuted)}
            className={`p-2.5 rounded-xl border transition-all duration-200 ${audioMuted ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"}`}
            title={audioMuted ? "Aktifkan suara beep" : "Bisukan suara beep"}
          >
            {audioMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button 
            onClick={() => setShowManualModal(true)}
            className="bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-all duration-200 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Absen Manual
          </button>

          <button 
            onClick={() => setCameraActive(!cameraActive)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-all duration-300 ${cameraActive ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            {cameraActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                Matikan Kamera
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                Mulai Kamera Live
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Controls & Live Scanner */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <h3 className="font-bold text-gray-800 text-sm tracking-wide uppercase">Konfigurasi Kamera</h3>
            
            {/* Category selection */}
            {!isGuru && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500">Kategori Absensi</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <button 
                    onClick={() => { setKategori("Siswa"); setSelectedIds([]); }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all duration-200 ${kategori === "Siswa" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    <Users className="w-3.5 h-3.5 inline mr-1.5" />
                    Siswa
                  </button>
                  <button 
                    onClick={() => { setKategori("Guru"); setSelectedIds([]); }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all duration-200 ${kategori === "Guru" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    <UserCheck className="w-3.5 h-3.5 inline mr-1.5" />
                    Guru
                  </button>
                </div>
              </div>
            )}

            {/* Mode selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Mode Absensi</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button 
                  onClick={() => setMode("Masuk")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all duration-200 ${mode === "Masuk" ? "bg-emerald-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <Clock className="w-3.5 h-3.5 inline mr-1.5" />
                  Absen Masuk
                </button>
                <button 
                  onClick={() => setMode("Pulang")}
                  className={`py-2 rounded-lg text-xs font-bold transition-all duration-200 ${mode === "Pulang" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                >
                  <LogOut className="w-3.5 h-3.5 inline mr-1.5" />
                  Absen Pulang
                </button>
              </div>
            </div>

            {/* Live Camera Feed Frame */}
            <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-[4/5] sm:aspect-video min-h-[250px] max-h-[40vh] border border-slate-800 flex flex-col items-center justify-center">
              {cameraActive ? (
                <>
                  <div id="qr-scanner-frame" className="w-full h-full object-cover"></div>
                  
                  {/* Decorative Scan overlay */}
                  <div className="absolute inset-0 border-[3px] border-emerald-500/30 m-6 pointer-events-none rounded-lg animate-pulse">
                    {/* Running red/green laser animation */}
                    <div className="w-full h-[2px] bg-emerald-400 absolute top-0 left-0 animate-bounce-slow shadow-lg shadow-emerald-500"></div>
                  </div>
                  
                  <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] text-emerald-400 font-mono tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    CAMERA LIVE • {kategori.toUpperCase()} : {mode.toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-4">
                  <div className="w-16 h-16 bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                    <Scan className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-300 text-sm">Kamera tidak aktif</h4>
                    <p className="text-slate-500 text-xs mt-1 max-w-[200px] mx-auto">Mulai Kamera Live di kanan atas untuk mendeteksi QR Code secara real-time</p>
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

          {/* Dynamic feedback banner */}
          {scanStatus.type && (
            <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-md ${
              scanStatus.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
              scanStatus.type === "error" ? "bg-rose-50 border-rose-200 text-rose-800" :
              "bg-blue-50 border-blue-200 text-blue-800"
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-lg mt-0.5">
                  {scanStatus.type === "success" ? "✅" : scanStatus.type === "error" ? "⚠️" : "🔄"}
                </span>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">
                    {scanStatus.type === "success" ? "Proses Berhasil" : scanStatus.type === "error" ? "Proses Gagal" : "Sedang Berjalan"}
                  </h4>
                  <p className="text-xs font-medium whitespace-pre-wrap">{scanStatus.msg}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Today's live reports list */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-800 text-base">Presensi Hari Ini</h3>
              <p className="text-xs text-gray-500">Arsip live log siswa dan guru yang hadir hari ini</p>
            </div>
            
            {/* Filters */}
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
                  placeholder="Cari nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 w-full"
                />
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Bulk Presensi Actions */}
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
                  Hadir (Auto)
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Tepat Waktu")}
                  className="bg-emerald-100 text-emerald-800 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-200"
                >
                  Paksa Tepat
                </button>
                <button 
                  onClick={() => handleBulkSubmit("Terlambat")}
                  className="bg-orange-100 text-orange-800 font-semibold text-xs px-3 py-1.5 rounded-lg hover:bg-orange-200"
                >
                  Paksa Telat
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

          {/* Presensi Table */}
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
                  <th className="py-3 px-4">Masuk</th>
                  <th className="py-3 px-4">Pulang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={kategori === "Siswa" ? 5 : 4} className="py-8 text-center text-gray-400 font-medium">
                      Belum ada laporan presensi terekam hari ini
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
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
                          <div className="font-semibold text-gray-900">{log.nama_target}</div>
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
                            log.status_masuk.includes("Lupa") ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
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
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-base">Koreksi Absensi Manual ({kategori})</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Pilih Entitas ({kategori})</label>
                
                {/* Search in Modal */}
                <div className="relative mb-2">
                  <input 
                    type="text"
                    placeholder="Saring entitas..."
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
                <label className="text-xs font-bold text-gray-500">Keterangan / Alasan</label>
                <textarea 
                  value={manualKet}
                  onChange={(e) => setManualKet(e.target.value)}
                  placeholder="Contoh: Surat dokter terlampir, dispensasi lomba, dll."
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
