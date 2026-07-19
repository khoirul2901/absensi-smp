/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { 
  LayoutDashboard, 
  ScanQrCode, 
  Database, 
  FilePieChart, 
  Settings as SettingsIcon, 
  LogOut, 
  GraduationCap, 
  AlertTriangle, 
  Menu, 
  X,
  Lock,
  User,
  ExternalLink,
  Calendar
} from "lucide-react";
import { callGas, isUsingMock, getGasUrl, getStorageKey } from "./lib/gasApi";
import { User as UserType } from "./types";

// Component imports
import Dashboard from "./components/Dashboard";
import AbsensiQR from "./components/AbsensiQR";
import DataMaster from "./components/DataMaster";
import Laporan from "./components/Laporan";
import Settings from "./components/Settings";
import JadwalGuru from "./components/JadwalGuru";

type TabType = "dashboard" | "absensi" | "data_master" | "jadwal_guru" | "laporan" | "settings";

export default function App() {
  const [session, setSession] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usingMock, setUsingMock] = useState(isUsingMock());

  // Login Form States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Sync mock mode status when settings might have saved new GAS URL
  useEffect(() => {
    const handleUrlCheck = () => {
      setUsingMock(isUsingMock());
    };
    // Check every 2 seconds to make the sync seamless
    const interval = setInterval(handleUrlCheck, 2000);
    return () => clearInterval(interval);
  }, []);

  // Check saved session
  useEffect(() => {
    const saved = localStorage.getItem(getStorageKey("SIAS_SESSION"));
    if (saved) {
      try {
        setSession(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem(getStorageKey("SIAS_SESSION"));
      }
    }
  }, []);

  // Sync card settings from spreadsheet to localStorage when user is logged in
  useEffect(() => {
    if (session) {
      callGas("getPengaturanSemua")
        .then((res) => {
          if (res && res.success !== false) {
            const keys = [
              'cardSchoolName',
              'cardSchoolAddress',
              'cardPrincipalName',
              'cardSignatureUrl',
              'cardLogoLeftUrl',
              'cardLogoRightUrl'
            ];
            keys.forEach((key) => {
              if (res[key] !== undefined) {
                localStorage.setItem(getStorageKey(key), res[key]);
              }
            });
          }
        })
        .catch((err) => {
          console.error("Gagal sinkronisasi kartu pengaturan:", err);
        });
    }
  }, [session]);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoading(true);

    try {
      const res = await callGas("verifikasiLogin", [username, password]);
      if (res && res.success) {
        const userSession: UserType = {
          username: res.username || username,
          role: res.role || "Admin",
          target_id: res.target_id || "-"
        };
        setSession(userSession);
        localStorage.setItem(getStorageKey("SIAS_SESSION"), JSON.stringify(userSession));
      } else {
        setLoginError(res?.message || "Username atau password salah!");
      }
    } catch (err: any) {
      setLoginError("Error server: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin keluar dari sistem?")) {
      setSession(null);
      localStorage.removeItem(getStorageKey("SIAS_SESSION"));
      setActiveTab("dashboard");
    }
  };

  const isGuru = session?.role === "Guru";

  // Render sub-views dynamically
  const renderView = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "absensi":
        return <AbsensiQR />;
      case "data_master":
        if (isGuru) return <Dashboard />;
        return <DataMaster />;
      case "jadwal_guru":
        if (isGuru) return <Dashboard />;
        return <JadwalGuru />;
      case "laporan":
        return <Laporan />;
      case "settings":
        if (session?.role === "TU") return <Dashboard />;
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const allNavItems = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: LayoutDashboard, color: "text-blue-500 hover:bg-blue-50/50" },
    { id: "absensi" as TabType, label: "Absensi QR", icon: ScanQrCode, color: "text-emerald-500 hover:bg-emerald-50/50" },
    { id: "data_master" as TabType, label: "Data Master", icon: Database, color: "text-indigo-500 hover:bg-indigo-50/50" },
    { id: "jadwal_guru" as TabType, label: "Jadwal Guru", icon: Calendar, color: "text-amber-500 hover:bg-amber-50/50" },
    { id: "laporan" as TabType, label: "Laporan & Rekap", icon: FilePieChart, color: "text-purple-500 hover:bg-purple-50/50" },
    { id: "settings" as TabType, label: "Pengaturan", icon: SettingsIcon, color: "text-slate-500 hover:bg-slate-50/50" },
  ];

  const navItems = allNavItems.filter((item) => {
    if (isGuru) {
      return item.id === "dashboard" || item.id === "absensi" || item.id === "laporan" || item.id === "settings";
    }
    if (session?.role === "TU") {
      return item.id !== "settings";
    }
    return true;
  }).map((item) => {
    if (isGuru && item.id === "settings") {
      return { ...item, label: "Ubah Password" };
    }
    return item;
  });

  if (!session) {
    /* HIGH-FIDELITY LOGIN PANEL */
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 selection:bg-blue-500 selection:text-white">
        <div className="absolute top-4 right-4 bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          {usingMock ? "Database Simulasi Aktif" : "GAS Database Aktif"}
        </div>

        <div className="max-w-md w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Visual glow element */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-gradient-to-b from-blue-500/10 to-transparent blur-2xl"></div>

          <div className="text-center relative z-10 space-y-2">
            <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">SMP AL-HIKAM</h1>
            <p className="text-xs text-slate-400">Sistem Informasi Absensi Sekolah Modern</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4 relative z-10">
            {loginError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
                {(loginError.includes("Failed to fetch") || loginError.includes("Gagal menghubungkan") || !usingMock) && (
                  <div className="mt-1 p-2 bg-slate-900 rounded-lg text-[10px] text-slate-400 space-y-2">
                    <p className="font-semibold text-amber-400">Tips Hubungan Google Apps Script:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Pastikan URL Web App Anda berakhiran <code className="text-blue-300">/exec</code>, bukan <code className="text-blue-300">/edit</code>.</li>
                      <li>Di Google Apps Script, klik <b>Deploy &gt; Kelola penerapan (Manage deployments)</b>. Pastikan <b>Who has access</b> diatur ke <b>"Anyone"</b> (Siapa saja), dan <b>Execute as</b> diatur ke <b>"Me"</b>.</li>
                    </ol>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem("SIAS_GAS_URL");
                        setUsingMock(true);
                        setLoginError(null);
                        setUsername("");
                        setPassword("");
                        window.location.reload();
                      }}
                      className="w-full mt-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-1.5 px-2 rounded text-[10px] transition-all cursor-pointer text-center"
                    >
                      Beralih ke Mode Simulasi Offline (Bisa Langsung Login)
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Username</label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  placeholder="Masukkan username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-900"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Password</label>
              <div className="relative">
                <input 
                  type="password"
                  required
                  placeholder="Masukkan password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:bg-slate-900"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all duration-150 shadow-lg shadow-blue-600/10 flex items-center justify-center gap-2"
            >
              {loading ? "Memverifikasi..." : "Masuk ke Sistem"}
            </button>

            <a 
              href="https://khoirul2901.github.io/PORTAL-AL-HIKAM/"
              className="w-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-extrabold text-xs py-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-slate-400" />
              Kembali ke Portal Al-Hikam
            </a>
          </form>

          {usingMock && (
            <div className="bg-slate-900/50 border border-slate-800/80 p-3.5 rounded-xl text-center">
              <p className="text-[10px] text-slate-500">
                💡 Mode simulasi aktif. Gunakan akun default: <br />
                <span className="font-mono text-blue-400 font-bold">admin</span> / <span className="font-mono text-blue-400 font-bold">admin123</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen print:min-h-0 print:h-auto bg-slate-50/50 flex print:block">
      
      {/* SIDEBAR NAVIGATION (Desktop) */}
      <aside className="hidden md:flex print:hidden flex-col w-64 bg-slate-950 border-r border-slate-800 text-slate-400 p-5 shrink-0 justify-between">
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 border-b border-slate-800/60 pb-5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-600/10">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight uppercase leading-none">SMP Al-Hikam</h2>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">SIAS PANEL v2.0</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive 
                      ? "bg-slate-900 text-white border border-slate-800 shadow-sm" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Session Footer inside Sidebar */}
        <div className="border-t border-slate-800/60 pt-5 space-y-4">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 border border-slate-700">
              {session.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate leading-none mb-1">{session.username}</p>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">{session.role}</span>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all duration-150"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER & SIDEBAR BAR */}
      <div className="md:hidden print:hidden flex flex-col w-full min-h-screen">
        <header className="bg-slate-950 text-slate-400 p-4 border-b border-slate-800 flex justify-between items-center relative z-20">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            <h2 className="text-xs font-black text-white uppercase tracking-wider">SMP AL-HIKAM</h2>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Navigation Drawer Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="bg-slate-950 border-r border-slate-800 w-64 h-full p-5 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-800/60 pb-5">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h2 className="text-xs font-extrabold text-white uppercase tracking-tight">SMP AL-HIKAM</h2>
                  </div>
                </div>

                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-150 ${
                          isActive ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-slate-800/60 pt-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-xs">
                    {session.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-none mb-1">{session.username}</p>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">{session.role}</span>
                  </div>
                </div>
                <button 
                  onClick={() => { handleLogout(); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/25"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Keluar Sistem
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Page Content Area */}
        <main className="flex-grow p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* SIMULATOR BANNER */}
          {usingMock && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl mb-6 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-bounce" />
              <div className="space-y-1.5 flex-grow">
                <h4 className="font-extrabold text-xs">Database Hubungan Simulasi Aktif</h4>
                <p className="text-[11px] opacity-95 leading-relaxed font-semibold">
                  Sistem sedang berjalan dalam mode demo dengan local storage. Agar sinkron secara langsung dengan Google Sheets nyata Anda, masuk ke menu <strong>Pengaturan</strong> lalu masukkan URL Google Apps Script Web App Anda.
                </p>
              </div>
            </div>
          )}

          {renderView()}
        </main>
      </div>

      {/* DESKTOP CONTENT AREA */}
      <div className="hidden md:flex print:block flex-col flex-grow min-h-screen print:min-h-0 print:h-auto overflow-hidden print:overflow-visible">
        {/* Main top header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center print:hidden">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <span>Sistem Informasi Absensi Sekolah</span>
            <span>&bull;</span>
            <span className="text-slate-600">SMP AL-HIKAM SENDANG MULYO</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Display connection indicator */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
              usingMock ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${usingMock ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`}></span>
              {usingMock ? "Database Simulasi" : "GAS Web App Terkoneksi"}
            </span>
          </div>
        </header>

        {/* Desktop Page Content Area */}
        <main className="flex-grow p-8 print:p-0 print:w-full print:max-w-none overflow-y-auto print:overflow-visible max-w-7xl w-full mx-auto">
          {/* SIMULATOR BANNER */}
          {usingMock && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3.5 rounded-2xl mb-6 flex items-start gap-3 shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-bounce" />
              <div className="space-y-1 flex-grow">
                <h4 className="font-extrabold text-xs">Database Hubungan Simulasi Aktif</h4>
                <p className="text-[11px] opacity-95 leading-relaxed font-medium">
                  Sistem sedang berjalan dalam mode demo offline dengan local storage. Agar sinkron secara langsung dengan Google Sheets nyata Anda, masuk ke menu <strong>Pengaturan</strong> lalu masukkan URL Google Apps Script Web App Anda.
                </p>
              </div>
            </div>
          )}

          {renderView()}
        </main>
      </div>
    </div>
  );
}
