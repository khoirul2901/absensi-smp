/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { 
  Users, 
  GraduationCap, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  LogOut, 
  TrendingUp,
  CalendarDays
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { callGas } from "../lib/gasApi";
import { DashboardMetrics } from "../types";

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMetrics() {
      try {
        setLoading(true);
        const res = await callGas("getDashboardMetrics");
        if (res && res.success) {
          setMetrics(res.data);
        } else {
          setError(res?.message || "Gagal memuat metrik dashboard");
        }
      } catch (err: any) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    }
    loadMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative w-12 h-12">
          <div className="absolute w-12 h-12 rounded-full border-4 border-blue-100 animate-pulse"></div>
          <div className="absolute w-12 h-12 rounded-full border-t-4 border-blue-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
        <div>
          <h4 className="font-semibold">Terjadi Kesalahan</h4>
          <p className="text-sm opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  // Transform chart data for Recharts
  const chartData = metrics.chartLabels.map((label, index) => ({
    name: label,
    "Hadir Masuk": metrics.chartData[index] || 0,
  }));

  const cardsSiswa = [
    {
      title: "Total Siswa",
      value: metrics.totalSiswa,
      icon: GraduationCap,
      color: "bg-blue-500 text-white",
      bgLight: "bg-blue-50/50 border-blue-100",
      textCol: "text-blue-900"
    },
    {
      title: "Siswa Hadir",
      value: metrics.siswaMasuk,
      subtitle: `${metrics.siswaMasuk} dari ${metrics.totalSiswa} siswa`,
      icon: CheckCircle,
      color: "bg-emerald-500 text-white",
      bgLight: "bg-emerald-50/50 border-emerald-100",
      textCol: "text-emerald-900"
    },
    {
      title: "Persentase Tepat Waktu",
      value: metrics.siswaTepat,
      subtitle: "Dari total siswa masuk",
      icon: Clock,
      color: "bg-amber-500 text-white",
      bgLight: "bg-amber-50/50 border-amber-100",
      textCol: "text-amber-900"
    },
    {
      title: "Siswa Absen/Alpha",
      value: metrics.totalSiswa - metrics.siswaMasuk,
      subtitle: `${metrics.siswaAlfaInt}% Tingkat Alfa hari ini`,
      icon: AlertTriangle,
      color: "bg-rose-500 text-white",
      bgLight: "bg-rose-50/50 border-rose-100",
      textCol: "text-rose-900"
    },
  ];

  const cardsGuru = [
    {
      title: "Total Guru",
      value: metrics.totalGuru,
      icon: Users,
      color: "bg-indigo-500 text-white",
      bgLight: "bg-indigo-50/50 border-indigo-100",
      textCol: "text-indigo-900"
    },
    {
      title: "Guru Hadir",
      value: metrics.guruMasuk,
      subtitle: `${metrics.guruMasuk} dari ${metrics.totalGuru} guru`,
      icon: CheckCircle,
      color: "bg-teal-500 text-white",
      bgLight: "bg-teal-50/50 border-teal-100",
      textCol: "text-teal-900"
    },
    {
      title: "Guru Tepat Waktu",
      value: metrics.guruTepat,
      subtitle: "Dari total guru masuk",
      icon: Clock,
      color: "bg-orange-500 text-white",
      bgLight: "bg-orange-50/50 border-orange-100",
      textCol: "text-orange-900"
    },
    {
      title: "Guru Absen",
      value: metrics.totalGuru - metrics.guruMasuk,
      subtitle: "Tidak melakukan scan masuk",
      icon: LogOut,
      color: "bg-purple-500 text-white",
      bgLight: "bg-purple-50/50 border-purple-100",
      textCol: "text-purple-900"
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 shadow-md border border-indigo-900">
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
          <GraduationCap className="w-80 h-80" />
        </div>
        <div className="relative z-10 space-y-2 max-w-xl">
          <span className="bg-indigo-800/60 text-indigo-200 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Monitoring Real-Time
          </span>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">SIAS SMK Al-Hikam</h1>
          <p className="text-blue-100/80 text-sm md:text-base leading-relaxed">
            Sistem Informasi Absensi Sekolah modern yang terintegrasi langsung dengan database Google Spreadsheet. Pantau kehadiran siswa dan guru hari ini.
          </p>
        </div>
      </div>

      {/* Grid Status Siswa */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Ringkasan Absensi Siswa</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardsSiswa.map((card, idx) => (
            <div key={idx} className={`bg-white rounded-xl border p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-all duration-200 ${card.bgLight}`}>
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</h3>
                {card.subtitle && (
                  <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                    {card.title.includes("Persentase") && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid Status Guru */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          <h2 className="text-lg font-bold text-gray-800 tracking-tight">Ringkasan Absensi Guru</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cardsGuru.map((card, idx) => (
            <div key={idx} className={`bg-white rounded-xl border p-5 flex items-start justify-between shadow-sm hover:shadow-md transition-all duration-200 ${card.bgLight}`}>
              <div className="space-y-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.title}</p>
                <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">{card.value}</h3>
                {card.subtitle && (
                  <p className="text-xs text-gray-600 font-medium flex items-center gap-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Chart & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Tren Kehadiran Siswa</h3>
              <p className="text-xs text-gray-500">Jumlah siswa hadir masuk dalam 6 hari terakhir</p>
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              6 Hari Terakhir
            </span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1e293b", borderColor: "#1e293b", borderRadius: "12px", color: "#fff" }}
                  labelStyle={{ fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="Hadir Masuk" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHadir)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info/Warning Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800 text-lg">Indikator Disiplin</h3>
            <p className="text-xs text-gray-500">Analisis disiplin waktu berdasarkan tingkat keterlambatan</p>
            
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>Kehadiran Tepat Waktu (Siswa)</span>
                  <span>{metrics.siswaTepat}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.siswaTepatInt}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>Kehadiran Tepat Waktu (Guru)</span>
                  <span>{metrics.guruTepat}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${metrics.guruTepatInt}%` }}></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>Rata-rata Tingkat Kehadiran</span>
                  <span>{Math.round(((metrics.siswaMasuk + metrics.guruMasuk) / Math.max(1, metrics.totalSiswa + metrics.totalGuru)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.round(((metrics.siswaMasuk + metrics.guruMasuk) / Math.max(1, metrics.totalSiswa + metrics.totalGuru)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-600 leading-relaxed">
            💡 <strong>Saran Disiplin:</strong> Dorong guru dan siswa untuk selalu melakukan scan masuk sebelum <strong>07:15 WIB</strong> untuk meningkatkan rasio kehadiran tepat waktu.
          </div>
        </div>
      </div>
    </div>
  );
}
