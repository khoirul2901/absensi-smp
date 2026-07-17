/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { 
  FileText, 
  Search, 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  Grid, 
  List, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { callGas } from "../lib/gasApi";
import { LaporanRow, RekapPersentase } from "../types";

export default function Laporan() {
  const [kategori, setKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [viewMode, setViewMode] = useState<"detail" | "rekap">("detail");
  const [jenisFilter, setJenisFilter] = useState<"rentang" | "bulan">("bulan");
  
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("SIAS_SESSION");
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
  
  // Filter Fields
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [bulanMinta, setBulanMinta] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [classList, setClassList] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Loaded Data States
  const [detailLogs, setDetailLogs] = useState<LaporanRow[]>([]);
  const [rekapRows, setRekapRows] = useState<RekapPersentase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination States
  const [currentPageDetail, setCurrentPageDetail] = useState(1);
  const [currentPageRekap, setCurrentPageRekap] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPageDetail(1);
    setCurrentPageRekap(1);
  }, [kategori, viewMode, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta, selectedKelas, searchQuery]);

  // Set default current month & dates
  useEffect(() => {
    const d = new Date();
    const curMonth = d.toISOString().substring(0, 7); // yyyy-MM
    setBulanMinta(curMonth);
    
    const todayStr = d.toISOString().split("T")[0];
    setTanggalMulai(todayStr);
    setTanggalSelesai(todayStr);
  }, []);

  // Load Classes List
  useEffect(() => {
    async function loadClasses() {
      const res = await callGas("getKelasSemua");
      if (Array.isArray(res)) {
        setClassList(res);
      }
    }
    loadClasses();
  }, []);

  // Execute query trigger
  const handleQuery = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (viewMode === "detail") {
        const res = await callGas("getLaporanFilter", [
          kategori, 
          selectedKelas, 
          jenisFilter, 
          tanggalMulai, 
          tanggalSelesai, 
          bulanMinta
        ]);
        if (res && res.success) {
          setDetailLogs(res.data);
        } else {
          setError(res?.message || "Gagal memuat rekap detail");
        }
      } else {
        const res = await callGas("hitungRekapPersentase", [
          kategori, 
          selectedKelas, 
          jenisFilter, 
          tanggalMulai, 
          tanggalSelesai, 
          bulanMinta
        ]);
        if (res && res.success) {
          setRekapRows(res.data);
        } else {
          setError(res?.message || "Gagal memuat rekap persentase");
        }
      }
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bulanMinta || (tanggalMulai && tanggalSelesai)) {
      handleQuery();
    }
  }, [kategori, viewMode, jenisFilter, selectedKelas, tanggalMulai, tanggalSelesai, bulanMinta]);

  // Export Filtered data to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (viewMode === "detail") {
      if (detailLogs.length === 0) return;
      const headers = ["ID Log", "Tanggal", "ID", "Nama", "Kelas/Jabatan", "Jam Masuk", "Status Masuk", "Jam Pulang", "Status Pulang", "Keterangan"];
      csvContent += headers.join(",") + "\n";
      
      detailLogs.forEach(row => {
        const id = row.id_siswa || row.id_guru || "-";
        const name = row.nama_siswa || row.nama_guru || "-";
        const position = row.kelas_jurusan || "-";
        const logId = row.id_log_siswa || row.id_log_guru || "-";
        
        const csvRow = [
          logId,
          row.tanggal,
          id,
          `"${name}"`,
          `"${position}"`,
          row.jam_masuk,
          row.status_masuk,
          row.jam_pulang,
          row.status_pulang,
          `"${row.ket || "-"}"`
        ];
        csvContent += csvRow.join(",") + "\n";
      });
    } else {
      if (rekapRows.length === 0) return;
      const headers = ["ID", "Nama", "Hadir", "Sakit", "Izin", "Alfa", "Persentase Kehadiran", "Jam Masuk", "Jam Pulang"];
      csvContent += headers.join(",") + "\n";
      
      rekapRows.forEach(row => {
        const csvRow = [
          row.id,
          `"${row.nama}"`,
          row.hadir,
          row.sakit,
          row.izin,
          row.alfa,
          row.persentase,
          `"${row.jam_masuk}"`,
          `"${row.jam_pulang}"`
        ];
        csvContent += csvRow.join(",") + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_${kategori.toLowerCase()}_${viewMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter local rows on search query
  const filteredDetailLogs = detailLogs.filter(row => {
    const name = (row.nama_siswa || row.nama_guru || "").toLowerCase();
    const id = (row.id_siswa || row.id_guru || "-").toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
  });

  const filteredRekapRows = rekapRows.filter(row => {
    const name = row.nama.toLowerCase();
    const id = row.id.toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
  });

  // Paginated data calculations
  const startIndexDetail = (currentPageDetail - 1) * itemsPerPage;
  const paginatedDetailLogs = filteredDetailLogs.slice(startIndexDetail, startIndexDetail + itemsPerPage);
  const totalPagesDetail = Math.ceil(filteredDetailLogs.length / itemsPerPage);

  const startIndexRekap = (currentPageRekap - 1) * itemsPerPage;
  const paginatedRekapRows = filteredRekapRows.slice(startIndexRekap, startIndexRekap + itemsPerPage);
  const totalPagesRekap = Math.ceil(filteredRekapRows.length / itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in print:bg-white print:p-0">
      
      {/* Page Header (Hidden on print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Laporan & Rekap Kehadiran</h1>
          <p className="text-xs text-gray-500">Ekstrak logs harian atau rekap persentase presensi untuk wali kelas/kepala sekolah</p>
        </div>

        {/* Categories Selector */}
        {!isGuru && (
          <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl">
            <button 
              onClick={() => setKategori("Siswa")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${kategori === "Siswa" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              Siswa
            </button>
            <button 
              onClick={() => setKategori("Guru")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${kategori === "Guru" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              Guru
            </button>
          </div>
        )}
      </div>

      {/* Navigation Filter Panel (Hidden on print) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 print:hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* View Mode Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Grid className="w-3.5 h-3.5" />
              Format Tampilan
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button 
                onClick={() => setViewMode("detail")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 ${viewMode === "detail" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                <List className="w-3.5 h-3.5" />
                Detail Log
              </button>
              <button 
                onClick={() => setViewMode("rekap")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1 ${viewMode === "rekap" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Rekap %
              </button>
            </div>
          </div>

          {/* Time Filter Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Saringan Waktu
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button 
                onClick={() => setJenisFilter("bulan")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${jenisFilter === "bulan" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                Bulan
              </button>
              <button 
                onClick={() => setJenisFilter("rentang")}
                className={`py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${jenisFilter === "rentang" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
              >
                Rentang Hari
              </button>
            </div>
          </div>

          {/* Time Inputs */}
          {jenisFilter === "bulan" ? (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500">Pilih Bulan</label>
              <input 
                type="month"
                value={bulanMinta}
                onChange={(e) => setBulanMinta(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-medium focus:outline-none"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Dari Tanggal</label>
                <input 
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Ke Tanggal</label>
                <input 
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Class Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Saringan Kelas
            </label>
            {kategori === "Siswa" ? (
              <select 
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-semibold focus:outline-none"
              >
                <option value="Semua">Semua Kelas</option>
                {classList.map((kls, idx) => (
                  <option key={idx} value={kls}>{kls}</option>
                ))}
              </select>
            ) : (
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-400 font-semibold text-center select-none">
                Tidak berlaku untuk Guru
              </div>
            )}
          </div>
        </div>

        {/* Search input in panel */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-gray-50 gap-3">
          <div className="relative w-full sm:max-w-xs">
            <input 
              type="text"
              placeholder="Saring nama / id target..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={() => window.print()}
              className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak PDF
            </button>
            <button 
              onClick={handleExportCSV}
              className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Unduh CSV
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY HEADERS */}
      <div className="hidden print:block space-y-4 mb-6 border-b-[3px] border-slate-900 pb-4 text-center">
        <h2 className="text-2xl font-black text-slate-950 uppercase tracking-wide">SMK AL-HIKAM KREJENGAN</h2>
        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-normal">LAPORAN REKAP ABSENSI {kategori.toUpperCase()}</h3>
        <p className="text-xs text-slate-500 font-semibold">
          {jenisFilter === "bulan" ? `Periode Bulan: ${bulanMinta}` : `Periode Tanggal: ${tanggalMulai} s.d ${tanggalSelesai}`}
          {kategori === "Siswa" && ` | Kelas: ${selectedKelas}`}
        </p>
      </div>

      {/* Main logs display container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Mengambil data dari server...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-medium">{error}</div>
        ) : (
          viewMode === "detail" ? (
            /* DETAIL LOG VIEW MODE */
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider print:bg-slate-100 print:text-black">
                      <th className="py-3.5 px-6">Tanggal</th>
                      <th className="py-3.5 px-6">ID</th>
                      <th className="py-3.5 px-6">Nama</th>
                      {kategori === "Siswa" && <th className="py-3.5 px-6">Kelas</th>}
                      <th className="py-3.5 px-6">Jam Masuk</th>
                      <th className="py-3.5 px-6">Status Masuk</th>
                      <th className="py-3.5 px-6">Jam Pulang</th>
                      <th className="py-3.5 px-6">Status Pulang</th>
                      <th className="py-3.5 px-6">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700 print:divide-slate-300">
                    {filteredDetailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={kategori === "Siswa" ? 9 : 8} className="py-8 text-center text-gray-400 font-medium">
                          Tidak ada log presensi terekam
                        </td>
                      </tr>
                    ) : (
                      paginatedDetailLogs.map((row, idx) => {
                        const id = row.id_siswa || row.id_guru || "-";
                        const name = row.nama_siswa || row.nama_guru || "-";
                        const classFull = row.kelas_jurusan || "-";
                        
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-all duration-150">
                            <td className="py-3.5 px-6 font-semibold text-gray-500">{row.tanggal}</td>
                            <td className="py-3.5 px-6 font-mono text-gray-400">{id}</td>
                            <td className="py-3.5 px-6 font-bold text-gray-900">{name}</td>
                            {kategori === "Siswa" && <td className="py-3.5 px-6 text-gray-600 font-medium">{classFull}</td>}
                            <td className="py-3.5 px-6 font-bold">{row.jam_masuk}</td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status_masuk.includes("Tepat") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                row.status_masuk.includes("Terlambat") ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                row.status_masuk.includes("Lupa") ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                row.status_masuk === "-" ? "text-gray-400" : "bg-rose-50 text-rose-700 border border-rose-100"
                              }`}>
                                {row.status_masuk}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 font-bold">{row.jam_pulang}</td>
                            <td className="py-3.5 px-6">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.status_pulang.includes("Tepat") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                row.status_pulang === "-" ? "text-gray-400" : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}>
                                {row.status_pulang}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-gray-500 font-medium">{row.ket || "-"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Detail Logs Pagination Controls (Hidden on Print) */}
              {totalPagesDetail > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 print:hidden">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      disabled={currentPageDetail === 1}
                      onClick={() => setCurrentPageDetail(p => Math.max(p - 1, 1))}
                      className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageDetail === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={currentPageDetail === totalPagesDetail}
                      onClick={() => setCurrentPageDetail(p => Math.min(p + 1, totalPagesDetail))}
                      className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageDetail === totalPagesDetail ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Selanjutnya
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Menampilkan <span className="font-bold text-gray-950">{startIndexDetail + 1}</span> sampai{" "}
                        <span className="font-bold text-gray-950">
                          {Math.min(startIndexDetail + itemsPerPage, filteredDetailLogs.length)}
                        </span>{" "}
                        dari <span className="font-bold text-gray-950">{filteredDetailLogs.length}</span> data
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageDetail(p => Math.max(p - 1, 1))}
                          disabled={currentPageDetail === 1}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageDetail === 1 ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPagesDetail }, (_, i) => i + 1).map((page) => {
                          if (
                            totalPagesDetail > 7 &&
                            page !== 1 &&
                            page !== totalPagesDetail &&
                            Math.abs(page - currentPageDetail) > 1
                          ) {
                            if (page === 2 || page === totalPagesDetail - 1) {
                              return <span key={page} className="relative inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-400">...</span>;
                            }
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPageDetail(page)}
                              className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                                currentPageDetail === page
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPageDetail(p => Math.min(p + 1, totalPagesDetail))}
                          disabled={currentPageDetail === totalPagesDetail}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageDetail === totalPagesDetail ? "opacity-40 cursor-not-allowed" : ""
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
          ) : (
            /* REKAP PERCENTAGE VIEW MODE */
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider print:bg-slate-100 print:text-black">
                      <th className="py-3.5 px-6">ID</th>
                      <th className="py-3.5 px-6">Nama</th>
                      <th className="py-3.5 px-6 text-center">Hadir</th>
                      <th className="py-3.5 px-6 text-center">Sakit</th>
                      <th className="py-3.5 px-6 text-center">Izin</th>
                      <th className="py-3.5 px-6 text-center">Alfa</th>
                      <th className="py-3.5 px-6 text-center">Sandi Masuk</th>
                      <th className="py-3.5 px-6 text-center">Sandi Pulang</th>
                      <th className="py-3.5 px-6 text-right">Rasio Hadir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700 print:divide-slate-300">
                    {filteredRekapRows.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-gray-400 font-medium">
                          Tidak ada data rekap persentase terekam
                        </td>
                      </tr>
                    ) : (
                      paginatedRekapRows.map((row) => {
                        const isHighRisk = parseFloat(row.persentase) < 75;
                        
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/50 transition-all duration-150">
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-500">{row.id}</td>
                            <td className="py-3.5 px-6 font-bold text-gray-900">{row.nama}</td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded-lg border border-emerald-100">{row.hadir}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-amber-50 text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-100">{row.sakit}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className="bg-indigo-50 text-indigo-800 font-bold px-2 py-1 rounded-lg border border-indigo-100">{row.izin}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <span className={`px-2 py-1 rounded-lg font-bold ${row.alfa > 0 ? "bg-rose-50 text-rose-800 border border-rose-100" : "bg-gray-50 text-gray-400"}`}>{row.alfa}</span>
                            </td>
                            <td className="py-3.5 px-6 text-center font-mono text-[10px] text-gray-400 max-w-[120px] truncate" title={row.jam_masuk}>{row.jam_masuk}</td>
                            <td className="py-3.5 px-6 text-center font-mono text-[10px] text-gray-400 max-w-[120px] truncate" title={row.jam_pulang}>{row.jam_pulang}</td>
                            <td className="py-3.5 px-6 text-right font-extrabold text-sm">
                              <div className="flex items-center justify-end gap-1.5">
                                {isHighRisk && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" title="Kehadiran di bawah 75%!" />}
                                <span className={isHighRisk ? "text-rose-600" : "text-emerald-600"}>
                                  {row.persentase}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Rekap Pagination Controls (Hidden on Print) */}
              {totalPagesRekap > 1 && (
                <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 print:hidden">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <button
                      disabled={currentPageRekap === 1}
                      onClick={() => setCurrentPageRekap(p => Math.max(p - 1, 1))}
                      className={`relative inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageRekap === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Sebelumnya
                    </button>
                    <button
                      disabled={currentPageRekap === totalPagesRekap}
                      onClick={() => setCurrentPageRekap(p => Math.min(p + 1, totalPagesRekap))}
                      className={`relative ml-3 inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 ${
                        currentPageRekap === totalPagesRekap ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                    >
                      Selanjutnya
                    </button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold">
                        Menampilkan <span className="font-bold text-gray-950">{startIndexRekap + 1}</span> sampai{" "}
                        <span className="font-bold text-gray-950">
                          {Math.min(startIndexRekap + itemsPerPage, filteredRekapRows.length)}
                        </span>{" "}
                        dari <span className="font-bold text-gray-950">{filteredRekapRows.length}</span> data
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-xl gap-1" aria-label="Pagination">
                        <button
                          onClick={() => setCurrentPageRekap(p => Math.max(p - 1, 1))}
                          disabled={currentPageRekap === 1}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageRekap === 1 ? "opacity-40 cursor-not-allowed" : ""
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        {Array.from({ length: totalPagesRekap }, (_, i) => i + 1).map((page) => {
                          if (
                            totalPagesRekap > 7 &&
                            page !== 1 &&
                            page !== totalPagesRekap &&
                            Math.abs(page - currentPageRekap) > 1
                          ) {
                            if (page === 2 || page === totalPagesRekap - 1) {
                              return <span key={page} className="relative inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-400">...</span>;
                            }
                            return null;
                          }

                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPageRekap(page)}
                              className={`relative inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                                currentPageRekap === page
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/10"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}

                        <button
                          onClick={() => setCurrentPageRekap(p => Math.min(p + 1, totalPagesRekap))}
                          disabled={currentPageRekap === totalPagesRekap}
                          className={`relative inline-flex items-center rounded-lg px-2.5 py-1.5 text-gray-400 hover:bg-gray-50 ${
                            currentPageRekap === totalPagesRekap ? "opacity-40 cursor-not-allowed" : ""
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
          )
        )}
      </div>
    </div>
  );
}
