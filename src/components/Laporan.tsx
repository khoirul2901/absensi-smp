/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, FormEvent } from "react";
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
  ChevronRight,
  Pencil,
  Trash2,
  Clock,
  Edit3,
  Table,
  Save,
  RefreshCw,
  Sparkles,
  Users
} from "lucide-react";
import { callGas, getStorageKey } from "../lib/gasApi";
import { LaporanRow, RekapPersentase } from "../types";

export default function Laporan() {
  const [kategori, setKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [viewMode, setViewMode] = useState<"detail" | "rekap">("detail");
  const [jenisFilter, setJenisFilter] = useState<"rentang" | "bulan">("bulan");
  
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

  // EDIT KEHADIRAN MODAL STATES
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModeType, setEditModeType] = useState<"bulk" | "single">("bulk");
  const [editKategori, setEditKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [editTanggal, setEditTanggal] = useState<string>(new Date().toISOString().split("T")[0]);
  const [originalTanggal, setOriginalTanggal] = useState<string>("");
  
  // Single edit states
  const [editTargetId, setEditTargetId] = useState<string>("");
  const [editJamMasuk, setEditJamMasuk] = useState<string>("07:00");
  const [editStatusMasuk, setEditStatusMasuk] = useState<string>("Tepat Waktu");
  const [editJamPulang, setEditJamPulang] = useState<string>("15:30");
  const [editStatusPulang, setEditStatusPulang] = useState<string>("Tepat Waktu");
  const [editKet, setEditKet] = useState<string>("");
  const [editSearchQuery, setEditSearchQuery] = useState<string>("");
  const [editEntitiesList, setEditEntitiesList] = useState<any[]>([]);

  // Bulk edit states
  const [bulkFilterKelas, setBulkFilterKelas] = useState<string>("Semua");
  const [bulkSearchQuery, setBulkSearchQuery] = useState<string>("");
  const [bulkTableData, setBulkTableData] = useState<any[]>([]);
  const [loadingBulk, setLoadingBulk] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

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

  // Load master entities for edit dropdown
  const loadMasterForEdit = async (cat: "Siswa" | "Guru") => {
    try {
      const res = await callGas("getDataMaster", [cat]);
      if (res && res.success && Array.isArray(res.data)) {
        setEditEntitiesList(res.data);
      }
    } catch (e) {
      console.error("Gagal memuat master entitas:", e);
    }
  };

  // Load attendance data for bulk edit modal based on selected date
  const loadBulkAttendanceData = async (cat: "Siswa" | "Guru", tgl: string, cls: string) => {
    try {
      setLoadingBulk(true);
      const todayStr = new Date().toISOString().split("T")[0];
      const isToday = tgl === todayStr;

      // 1. Query existing attendance records for exact date from database
      const reportsRes = await callGas("getLaporanFilter", [cat, "Semua", "rentang", tgl, tgl, ""]);
      const existingLogs = (reportsRes && reportsRes.success && Array.isArray(reportsRes.data)) ? reportsRes.data : [];

      // 2. Fetch master entity list
      const masterRes = await callGas("getDataMaster", [cat]);
      const masterList = (masterRes && masterRes.success && Array.isArray(masterRes.data)) ? masterRes.data : [];

      // 3. Fetch live today scans ONLY if selected date is today
      let liveMap: Record<string, any> = {};
      if (isToday) {
        const liveRes = await callGas("getLiveAbsenHariIni", [cat, tgl, "Semua"]);
        if (liveRes && liveRes.success && Array.isArray(liveRes.data)) {
          liveRes.data.forEach((item: any) => {
            if (item.id_target) {
              liveMap[item.id_target] = item;
            }
          });
        }
      }

      const idKey = cat === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = cat === "Siswa" ? "nama_siswa" : "nama_guru";

      const filteredMaster = masterList.filter((m: any) => {
        if (cat === "Siswa" && cls && cls !== "Semua") {
          const k = `${m.kelas} ${m.jurusan}`;
          return k.toLowerCase().includes(cls.toLowerCase());
        }
        return true;
      });

      const mapped = filteredMaster.map((m: any) => {
        const targetId = m[idKey];
        const log = existingLogs.find((r: any) => (r[idKey] === targetId || r.id_siswa === targetId || r.id_guru === targetId));
        const live = liveMap[targetId];

        return {
          id_target: targetId,
          nama_target: m[nameKey],
          kelas_jurusan: cat === "Siswa" ? `${m.kelas} ${m.jurusan}` : "-",
          jam_masuk: log?.jam_masuk || (isToday && live?.jam_masuk ? live.jam_masuk : "-"),
          status_masuk: log?.status_masuk || (isToday && live?.status_masuk ? live.status_masuk : "-"),
          jam_pulang: log?.jam_pulang || (isToday && live?.jam_pulang ? live.jam_pulang : "-"),
          status_pulang: log?.status_pulang || (isToday && live?.status_pulang ? live.status_pulang : "-"),
          ket: log?.ket && log.ket !== "-" ? log.ket : (isToday && live?.ket && live.ket !== "-" ? live.ket : "-")
        };
      });

      setBulkTableData(mapped);
    } catch (err) {
      console.error("Gagal memuat data presensi massal:", err);
    } finally {
      setLoadingBulk(false);
    }
  };

  const handleOpenEditModal = (row?: LaporanRow, defaultMode?: "bulk" | "single") => {
    const currentCat = isGuru ? "Siswa" : (row ? (row.id_siswa ? "Siswa" : "Guru") : kategori);
    setEditKategori(currentCat);
    loadMasterForEdit(currentCat);

    let defaultDate = new Date().toISOString().split("T")[0];
    if (tanggalMulai) {
      defaultDate = tanggalMulai;
    } else if (jenisFilter === "bulan" && bulanMinta) {
      const todayStr = new Date().toISOString().split("T")[0];
      defaultDate = todayStr.startsWith(bulanMinta) ? todayStr : `${bulanMinta}-01`;
    }

    const initialDate = row ? (row.tanggal || defaultDate) : defaultDate;
    setEditTanggal(initialDate);
    setOriginalTanggal(row?.tanggal || "");

    if (row) {
      setEditModeType("single");
      const targetId = row.id_siswa || row.id_guru || "";
      setEditTargetId(targetId);
      setEditJamMasuk(row.jam_masuk && row.jam_masuk !== "-" ? row.jam_masuk : "07:00");
      setEditStatusMasuk(row.status_masuk && row.status_masuk !== "-" ? row.status_masuk : "Tepat Waktu");
      setEditJamPulang(row.jam_pulang && row.jam_pulang !== "-" ? row.jam_pulang : "15:30");
      setEditStatusPulang(row.status_pulang && row.status_pulang !== "-" ? row.status_pulang : "Tepat Waktu");
      setEditKet(row.ket && row.ket !== "-" ? row.ket : "");
    } else {
      setEditModeType(defaultMode || "bulk");
      setEditTargetId("");
      setEditJamMasuk("07:00");
      setEditStatusMasuk("Tepat Waktu");
      setEditJamPulang("15:30");
      setEditStatusPulang("Tepat Waktu");
      setEditKet("");
      setBulkFilterKelas(selectedKelas || "Semua");
      setBulkSearchQuery("");
      loadBulkAttendanceData(currentCat, initialDate, selectedKelas || "Semua");
    }
    setEditSearchQuery("");
    setShowEditModal(true);
  };

  const handleDeleteKehadiran = async (row?: LaporanRow) => {
    const targetId = row ? (row.id_siswa || row.id_guru || "") : editTargetId;
    const cat = row ? (isGuru ? "Siswa" : (row.id_siswa ? "Siswa" : "Guru")) : editKategori;
    const tgl = row ? row.tanggal : editTanggal;
    const name = row ? (row.nama_siswa || row.nama_guru || "pengguna ini") : "pengguna ini";

    if (!targetId || !tgl) {
      alert("Data presensi tidak valid untuk dihapus.");
      return;
    }

    const confirm = window.confirm(`Apakah Anda yakin ingin menghapus data presensi ${name} pada tanggal ${tgl}?`);
    if (!confirm) return;

    try {
      setLoading(true);

      let res = await callGas("hapusLogKehadiran", [targetId, cat, tgl]);

      if (!res || !res.success) {
        res = await callGas("hapusKehadiran", [targetId, cat, tgl]);
      }
      if (!res || !res.success) {
        res = await callGas("hapusAbsensi", [targetId, cat, tgl]);
      }
      if (!res || !res.success) {
        res = await callGas("hapusAbsen", [targetId, cat, tgl]);
      }
      if (!res || !res.success) {
        res = await callGas("deleteKehadiran", [targetId, cat, tgl]);
      }
      if (!res || !res.success) {
        res = await callGas("simpanKoreksiManual", [targetId, cat, tgl, "-", "-", "-", "-", "-"]);
      }
      if (!res || !res.success) {
        res = await callGas("editKehadiran", [targetId, cat, tgl, "-", "-", "-", "-", "-"]);
      }

      // Cleanup local mock if present
      try {
        const reportsKey = cat === "Siswa" ? "laporan_siswa" : "laporan_guru";
        const key = getStorageKey("MOCK_" + reportsKey);
        const stored = localStorage.getItem(key);
        if (stored) {
          let list = JSON.parse(stored);
          const idKey = cat === "Siswa" ? "id_siswa" : "id_guru";
          list = list.filter((r: any) => !(r.tanggal === tgl && (r[idKey] === targetId || r.id_siswa === targetId || r.id_guru === targetId || r.id_target === targetId)));
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch (e) {
        // ignore
      }

      alert(`Data presensi ${name} tanggal ${tgl} berhasil dihapus.`);
      setShowEditModal(false);
      handleQuery();
    } catch (err: any) {
      alert("Error menghapus presensi: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  const handleBulkParamChange = (cat: "Siswa" | "Guru", tgl: string, cls: string) => {
    setEditKategori(cat);
    setEditTanggal(tgl);
    setBulkFilterKelas(cls);
    loadBulkAttendanceData(cat, tgl, cls);
  };

  const handleUpdateBulkCell = (idTarget: string, field: string, value: string) => {
    setBulkTableData((prev) =>
      prev.map((item) => {
        if (item.id_target === idTarget) {
          const updated = { ...item, [field]: value };
          if (field === "status_masuk") {
            if ((value === "Tepat Waktu" || value === "Terlambat") && (item.jam_masuk === "-" || !item.jam_masuk)) {
              updated.jam_masuk = "07:00";
            } else if (value === "Sakit" || value === "Izin" || value === "Alfa" || value === "-") {
              updated.jam_masuk = "-";
            }
          }
          if (field === "status_pulang") {
            if (value === "Tepat Waktu" && (item.jam_pulang === "-" || !item.jam_pulang)) {
              updated.jam_pulang = "15:30";
            } else if (value === "-") {
              updated.jam_pulang = "-";
            }
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleBatchSetStatusMasuk = (val: string) => {
    if (!val) return;
    setBulkTableData((prev) =>
      prev.map((item) => {
        const matchesQuery = !bulkSearchQuery || 
          item.nama_target.toLowerCase().includes(bulkSearchQuery.toLowerCase()) || 
          item.id_target.toLowerCase().includes(bulkSearchQuery.toLowerCase());
        
        if (matchesQuery) {
          let newJam = item.jam_masuk;
          if ((val === "Tepat Waktu" || val === "Terlambat") && (item.jam_masuk === "-" || !item.jam_masuk)) {
            newJam = "07:00";
          } else if (val === "Sakit" || val === "Izin" || val === "Alfa" || val === "-") {
            newJam = "-";
          }
          return { ...item, status_masuk: val, jam_masuk: newJam };
        }
        return item;
      })
    );
  };

  const handleBatchSetStatusPulang = (val: string) => {
    if (!val) return;
    setBulkTableData((prev) =>
      prev.map((item) => {
        const matchesQuery = !bulkSearchQuery || 
          item.nama_target.toLowerCase().includes(bulkSearchQuery.toLowerCase()) || 
          item.id_target.toLowerCase().includes(bulkSearchQuery.toLowerCase());
        
        if (matchesQuery) {
          let newJam = item.jam_pulang;
          if (val === "Tepat Waktu" && (item.jam_pulang === "-" || !item.jam_pulang)) {
            newJam = "15:30";
          } else if (val === "-") {
            newJam = "-";
          }
          return { ...item, status_pulang: val, jam_pulang: newJam };
        }
        return item;
      })
    );
  };

  const handleSaveBulkKehadiran = async () => {
    if (bulkTableData.length === 0) return;
    try {
      setSavingEdit(true);
      let res = await callGas("editKehadiranBulk", [bulkTableData, editKategori, editTanggal]);

      if (res && !res.success && typeof res.message === "string" && res.message.toLowerCase().includes("tidak dikenal")) {
        let successCount = 0;
        for (const item of bulkTableData) {
          if (!item.id_target) continue;
          let itemRes = await callGas("simpanKoreksiManual", [
            item.id_target,
            editKategori,
            editTanggal,
            item.jam_masuk || "-",
            item.status_masuk || "-",
            item.jam_pulang || "-",
            item.status_pulang || "-",
            item.ket || "-"
          ]);

          if (itemRes && !itemRes.success && typeof itemRes.message === "string" && itemRes.message.toLowerCase().includes("tidak dikenal")) {
            itemRes = await callGas("editKehadiran", [
              item.id_target,
              editKategori,
              editTanggal,
              item.jam_masuk || "-",
              item.status_masuk || "-",
              item.jam_pulang || "-",
              item.status_pulang || "-",
              item.ket || "-"
            ]);
          }

          if (itemRes && !itemRes.success && typeof itemRes.message === "string" && itemRes.message.toLowerCase().includes("tidak dikenal")) {
            if (item.status_masuk && item.status_masuk !== "-") {
              itemRes = await callGas("simpanAbsenManual", [item.id_target, editKategori, "Masuk", editTanggal, item.status_masuk, item.ket || "-"]);
            }
            if (item.status_pulang && item.status_pulang !== "-") {
              itemRes = await callGas("simpanAbsenManual", [item.id_target, editKategori, "Pulang", editTanggal, item.status_pulang, item.ket || "-"]);
            }
          }

          if (itemRes && itemRes.success) {
            successCount++;
          }
        }
        res = { success: true, message: `Berhasil memperbarui ${successCount} data presensi tanggal ${editTanggal}!` };
      }

      if (res && res.success) {
        alert(res.message || `Data kehadiran tanggal ${editTanggal} berhasil diperbarui!`);
        if (jenisFilter === "rentang") {
          if (!tanggalMulai || !tanggalSelesai || editTanggal < tanggalMulai || editTanggal > tanggalSelesai) {
            setTanggalMulai(editTanggal);
            setTanggalSelesai(editTanggal);
          }
        } else if (jenisFilter === "bulan") {
          const monthOfEdit = editTanggal.slice(0, 7);
          if (bulanMinta !== monthOfEdit) {
            setBulanMinta(monthOfEdit);
          }
        }
        setShowEditModal(false);
        handleQuery();
      } else {
        alert(res?.message || "Gagal menyimpan perubahan massal.");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTargetOrDateChange = async (targetId: string, tanggalStr: string, cat: "Siswa" | "Guru") => {
    setEditTargetId(targetId);
    setEditTanggal(tanggalStr);

    if (targetId && tanggalStr) {
      try {
        const res = await callGas("getLaporanFilter", [cat, "Semua", "rentang", tanggalStr, tanggalStr, ""]);
        const idKey = cat === "Siswa" ? "id_siswa" : "id_guru";
        const existing = (res && res.success && Array.isArray(res.data))
          ? res.data.find((r: any) => r.tanggal === tanggalStr && (r[idKey] === targetId || r.id_siswa === targetId || r.id_guru === targetId))
          : null;

        if (existing) {
          setEditJamMasuk(existing.jam_masuk && existing.jam_masuk !== "-" ? existing.jam_masuk : "07:00");
          setEditStatusMasuk(existing.status_masuk && existing.status_masuk !== "-" ? existing.status_masuk : "Tepat Waktu");
          setEditJamPulang(existing.jam_pulang && existing.jam_pulang !== "-" ? existing.jam_pulang : "15:30");
          setEditStatusPulang(existing.status_pulang && existing.status_pulang !== "-" ? existing.status_pulang : "Tepat Waktu");
          setEditKet(existing.ket && existing.ket !== "-" ? existing.ket : "");
        } else {
          // If no log recorded on tanggalStr for targetId
          setEditJamMasuk("07:00");
          setEditStatusMasuk("-");
          setEditJamPulang("15:30");
          setEditStatusPulang("-");
          setEditKet("");
        }
      } catch (e) {
        console.error("Gagal memuat data presensi entitas:", e);
      }
    }
  };

  const handleSaveEditKehadiran = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTargetId) {
      alert("Pilih nama / ID entitas terlebih dahulu!");
      return;
    }
    if (!editTanggal) {
      alert("Pilih tanggal absensi!");
      return;
    }

    try {
      setSavingEdit(true);

      // If user changed the date from originalTanggal to editTanggal, delete the old log at originalTanggal first
      if (originalTanggal && originalTanggal !== editTanggal) {
        await callGas("hapusLogKehadiran", [editTargetId, editKategori, originalTanggal]);
      }

      let res = await callGas("simpanKoreksiManual", [
        editTargetId,
        editKategori,
        editTanggal,
        editJamMasuk || "-",
        editStatusMasuk || "-",
        editJamPulang || "-",
        editStatusPulang || "-",
        editKet || "-"
      ]);

      if (res && !res.success && typeof res.message === "string" && res.message.toLowerCase().includes("tidak dikenal")) {
        res = await callGas("editKehadiran", [
          editTargetId,
          editKategori,
          editTanggal,
          editJamMasuk || "-",
          editStatusMasuk || "-",
          editJamPulang || "-",
          editStatusPulang || "-",
          editKet || "-"
        ]);
      }

      if (res && !res.success && typeof res.message === "string" && res.message.toLowerCase().includes("tidak dikenal")) {
        res = await callGas("editKehadiranFull", [
          editTargetId,
          editKategori,
          editTanggal,
          {
            jam_masuk: editJamMasuk || "-",
            status_masuk: editStatusMasuk || "-",
            jam_pulang: editJamPulang || "-",
            status_pulang: editStatusPulang || "-",
            ket: editKet || "-"
          }
        ]);
      }

      if (res && !res.success && typeof res.message === "string" && res.message.toLowerCase().includes("tidak dikenal")) {
        let resMasuk: any = { success: true };
        if (editStatusMasuk && editStatusMasuk !== "-") {
          resMasuk = await callGas("simpanAbsenManual", [
            editTargetId,
            editKategori,
            "Masuk",
            editTanggal,
            editStatusMasuk,
            editKet || "-",
            editJamMasuk || "-"
          ]);
        }
        let resPulang: any = { success: true };
        if (editStatusPulang && editStatusPulang !== "-") {
          resPulang = await callGas("simpanAbsenManual", [
            editTargetId,
            editKategori,
            "Pulang",
            editTanggal,
            editStatusPulang,
            editKet || "-",
            editJamPulang || "-"
          ]);
        }
        res = (resMasuk && resMasuk.success) || (resPulang && resPulang.success)
          ? { success: true, message: `Kehadiran tanggal ${editTanggal} berhasil diperbarui!` }
          : (resMasuk || resPulang);
      }

      if (res && res.success) {
        alert(res.message || `Kehadiran tanggal ${editTanggal} berhasil diperbarui!`);
        if (jenisFilter === "rentang") {
          if (!tanggalMulai || !tanggalSelesai || editTanggal < tanggalMulai || editTanggal > tanggalSelesai) {
            setTanggalMulai(editTanggal);
            setTanggalSelesai(editTanggal);
          }
        } else if (jenisFilter === "bulan") {
          const monthOfEdit = editTanggal.slice(0, 7);
          if (bulanMinta !== monthOfEdit) {
            setBulanMinta(monthOfEdit);
          }
        }
        setShowEditModal(false);
        handleQuery();
      } else {
        alert(res?.message || "Gagal memperbarui kehadiran.");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setSavingEdit(false);
    }
  };

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
              onClick={() => handleOpenEditModal()}
              className="bg-amber-500 text-white font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-amber-600 transition-all duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Pencil className="w-4 h-4" />
              Edit Kehadiran
            </button>
            <button 
              onClick={() => window.print()}
              className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak PDF
            </button>
            <button 
              onClick={handleExportCSV}
              className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl hover:bg-blue-700 transition-all duration-150 flex items-center gap-1.5 shadow-sm cursor-pointer"
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
                      <th className="py-3.5 px-6 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs text-gray-700 print:divide-slate-300">
                    {filteredDetailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={kategori === "Siswa" ? 10 : 9} className="py-8 text-center text-gray-400 font-medium">
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
                            <td className="py-3.5 px-6 text-center print:hidden">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenEditModal(row)}
                                  className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                                  title="Edit Kehadiran"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteKehadiran(row)}
                                  className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-[11px] transition-colors cursor-pointer"
                                  title="Hapus Absensi"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Hapus
                                </button>
                              </div>
                            </td>
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

      {/* EDIT KEHADIRAN MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in print:hidden">
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-2xl w-full overflow-hidden transition-all duration-200 ${editModeType === "bulk" ? "max-w-5xl" : "max-w-lg"}`}>
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Pencil className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">Edit / Koreksi Kehadiran</h3>
                  <p className="text-[11px] text-amber-100 font-medium">Perbaiki log presensi langsung banyak atau per siswa</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mode Switcher Tabs */}
                <div className="bg-amber-700/40 p-1 rounded-xl flex items-center gap-1 border border-amber-400/30">
                  <button
                    type="button"
                    onClick={() => {
                      setEditModeType("bulk");
                      loadBulkAttendanceData(editKategori, editTanggal, bulkFilterKelas);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      editModeType === "bulk" ? "bg-white text-amber-800 shadow-sm" : "text-amber-100 hover:text-white"
                    }`}
                  >
                    <Table className="w-3.5 h-3.5" />
                    Edit Banyak (Tabel)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditModeType("single")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                      editModeType === "single" ? "bg-white text-amber-800 shadow-sm" : "text-amber-100 hover:text-white"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Edit 1 Orang
                  </button>
                </div>

                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-amber-100 hover:text-white text-2xl font-bold leading-none cursor-pointer pl-2"
                >
                  ×
                </button>
              </div>
            </div>

            {/* MODAL BODY */}
            {editModeType === "bulk" ? (
              /* BULK EDIT TABLE MODE */
              <div className="p-4 sm:p-6 space-y-4 max-h-[82vh] overflow-y-auto">
                {/* Filters Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1 block">Kategori</label>
                    <select
                      value={editKategori}
                      onChange={(e) => handleBulkParamChange(e.target.value as "Siswa" | "Guru", editTanggal, bulkFilterKelas)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru / Staf</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1 block">Tanggal Absensi</label>
                    <input
                      type="date"
                      value={editTanggal}
                      onChange={(e) => handleBulkParamChange(editKategori, e.target.value, bulkFilterKelas)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    />
                  </div>

                  {editKategori === "Siswa" ? (
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 mb-1 block">Filter Kelas</label>
                      <select
                        value={bulkFilterKelas}
                        onChange={(e) => handleBulkParamChange(editKategori, editTanggal, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        <option value="Semua">Semua Kelas</option>
                        {classList.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 mb-1 block">Filter Kelas</label>
                      <div className="bg-gray-100 border border-gray-200 rounded-xl p-2 text-xs text-gray-400 font-medium text-center">
                        Semua Staf / Guru
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 mb-1 block">Cari Nama / ID</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Filter nama..."
                        value={bulkSearchQuery}
                        onChange={(e) => setBulkSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-2 pl-7 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
                      />
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Batch Tools / Quick Actions Bar */}
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5 shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Atur Massal Semua yang Tampil:
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-amber-800">Masuk:</span>
                      <select
                        onChange={(e) => {
                          handleBatchSetStatusMasuk(e.target.value);
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="bg-white border border-amber-300 rounded-lg py-1 px-2 text-[11px] font-bold text-amber-900 cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>-- Set Status Masuk --</option>
                        <option value="Tepat Waktu">Tepat Waktu (07:00)</option>
                        <option value="Terlambat">Terlambat (07:00)</option>
                        <option value="Sakit">Sakit (-)</option>
                        <option value="Izin">Izin (-)</option>
                        <option value="Alfa">Alfa (-)</option>
                        <option value="Lupa Scan Masuk">Lupa Scan Masuk</option>
                        <option value="-">- (Kosongkan)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-amber-800">Pulang:</span>
                      <select
                        onChange={(e) => {
                          handleBatchSetStatusPulang(e.target.value);
                          e.target.value = "";
                        }}
                        defaultValue=""
                        className="bg-white border border-amber-300 rounded-lg py-1 px-2 text-[11px] font-bold text-amber-900 cursor-pointer shadow-sm"
                      >
                        <option value="" disabled>-- Set Status Pulang --</option>
                        <option value="Tepat Waktu">Tepat Waktu (15:30)</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Lupa Scan Pulang">Lupa Scan Pulang</option>
                        <option value="-">- (Kosongkan)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => loadBulkAttendanceData(editKategori, editTanggal, bulkFilterKelas)}
                      className="bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                      title="Reset dari server"
                    >
                      <RefreshCw className="w-3 h-3 text-amber-700" />
                      Reset
                    </button>
                  </div>
                </div>

                {/* Editable Table */}
                {loadingBulk ? (
                  <div className="py-12 text-center text-gray-400 font-medium space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500" />
                    <p className="text-xs font-semibold text-gray-500">Memuat daftar {editKategori} & presensi...</p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div className="max-h-[380px] overflow-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100 text-slate-700 uppercase font-extrabold sticky top-0 z-10 border-b border-gray-200 text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                            <th className="py-2.5 px-3 min-w-[160px]">NIS / Nama {editKategori}</th>
                            {editKategori === "Siswa" && <th className="py-2.5 px-3 min-w-[110px]">Kelas</th>}
                            <th className="py-2.5 px-2 w-24 text-center">Jam Masuk</th>
                            <th className="py-2.5 px-2 min-w-[140px]">Status Masuk</th>
                            <th className="py-2.5 px-2 w-24 text-center">Jam Pulang</th>
                            <th className="py-2.5 px-2 min-w-[140px]">Status Pulang</th>
                            <th className="py-2.5 px-3 min-w-[140px]">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                          {bulkTableData
                            .filter((item) => {
                              if (!bulkSearchQuery) return true;
                              return (
                                item.nama_target.toLowerCase().includes(bulkSearchQuery.toLowerCase()) ||
                                item.id_target.toLowerCase().includes(bulkSearchQuery.toLowerCase())
                              );
                            })
                            .map((item, idx) => (
                              <tr key={item.id_target} className="hover:bg-amber-50/40 transition-colors">
                                <td className="py-2 px-3 text-center text-gray-400 font-mono text-[11px]">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  <div className="font-bold text-gray-900 leading-tight">{item.nama_target}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">{item.id_target}</div>
                                </td>
                                {editKategori === "Siswa" && (
                                  <td className="py-2 px-3 font-semibold text-gray-600 text-[11px]">
                                    {item.kelas_jurusan}
                                  </td>
                                )}
                                <td className="py-2 px-1">
                                  <input
                                    type="text"
                                    value={item.jam_masuk}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "jam_masuk", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-center text-xs font-mono font-bold focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 px-1">
                                  <select
                                    value={item.status_masuk}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "status_masuk", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                                  >
                                    <option value="Tepat Waktu">Tepat Waktu</option>
                                    <option value="Terlambat">Terlambat</option>
                                    <option value="Sakit">Sakit</option>
                                    <option value="Izin">Izin</option>
                                    <option value="Alfa">Alfa</option>
                                    <option value="Lupa Scan Masuk">Lupa Scan Masuk</option>
                                    <option value="-">- (Belum Absen)</option>
                                  </select>
                                </td>
                                <td className="py-2 px-1">
                                  <input
                                    type="text"
                                    value={item.jam_pulang}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "jam_pulang", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-center text-xs font-mono font-bold focus:outline-none"
                                  />
                                </td>
                                <td className="py-2 px-1">
                                  <select
                                    value={item.status_pulang}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "status_pulang", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
                                  >
                                    <option value="Tepat Waktu">Tepat Waktu</option>
                                    <option value="Terlambat">Terlambat</option>
                                    <option value="Lupa Scan Pulang">Lupa Scan Pulang</option>
                                    <option value="-">- (Belum Pulang)</option>
                                  </select>
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    placeholder="Opsional..."
                                    value={item.ket}
                                    onChange={(e) => handleUpdateBulkCell(item.id_target, "ket", e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 focus:border-amber-500 rounded-lg p-1.5 text-xs focus:outline-none"
                                  />
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 font-medium">
                    Total <strong>{bulkTableData.length}</strong> {editKategori} pada tanggal <strong>{editTanggal}</strong>
                    {bulkFilterKelas !== "Semua" && ` (Kelas: ${bulkFilterKelas})`}
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="bg-gray-100 text-gray-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      disabled={savingEdit || bulkTableData.length === 0}
                      onClick={handleSaveBulkKehadiran}
                      className="bg-amber-500 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      {savingEdit ? "Menyimpan..." : "Simpan Semua Perubahan"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE EDIT MODE (EXISTING FORM) */
              <form onSubmit={handleSaveEditKehadiran} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                {/* Category & Date Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Kategori Entitas</label>
                    <select
                      value={editKategori}
                      onChange={(e) => {
                        const cat = e.target.value as "Siswa" | "Guru";
                        setEditKategori(cat);
                        loadMasterForEdit(cat);
                        setEditTargetId("");
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="Siswa">Siswa</option>
                      <option value="Guru">Guru / Staf</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Tanggal Presensi</label>
                    <input
                      type="date"
                      required
                      value={editTanggal}
                      onChange={(e) => handleTargetOrDateChange(editTargetId, e.target.value, editKategori)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Entity Search & Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 flex justify-between items-center">
                    <span>Pilih {editKategori}</span>
                    {editTargetId && (
                      <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        ID: {editTargetId}
                      </span>
                    )}
                  </label>
                  
                  <div className="relative mb-1">
                    <input 
                      type="text"
                      placeholder={`Cari nama / NIS ${editKategori}...`}
                      value={editSearchQuery}
                      onChange={(e) => setEditSearchQuery(e.target.value)}
                      className="bg-gray-50 border border-gray-200 rounded-xl py-1.5 pl-8 pr-3 text-xs text-gray-700 w-full focus:outline-none focus:border-amber-500"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                  </div>

                  <select 
                    required
                    value={editTargetId}
                    onChange={(e) => handleTargetOrDateChange(e.target.value, editTanggal, editKategori)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Pilih {editKategori === "Siswa" ? "Siswa" : "Guru"} --</option>
                    {editEntitiesList
                      .filter(ent => {
                        const name = ent.nama_siswa || ent.nama_guru || "";
                        const id = ent.id_siswa || ent.id_guru || "";
                        return (
                          name.toLowerCase().includes(editSearchQuery.toLowerCase()) ||
                          id.toLowerCase().includes(editSearchQuery.toLowerCase())
                        );
                      })
                      .map((ent) => {
                        const id = ent.id_siswa || ent.id_guru;
                        const name = ent.nama_siswa || ent.nama_guru;
                        const detail = editKategori === "Siswa" ? ` (${ent.kelas} ${ent.jurusan})` : "";
                        return (
                          <option key={id} value={id}>{id} - {name}{detail}</option>
                        );
                      })}
                  </select>
                </div>

                {/* Attendance Details Grid */}
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Rincian Kehadiran Masuk & Pulang
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">Jam Masuk</label>
                      <input
                        type="text"
                        placeholder="07:00 atau -"
                        value={editJamMasuk}
                        onChange={(e) => setEditJamMasuk(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">Status Masuk</label>
                      <select
                        value={editStatusMasuk}
                        onChange={(e) => setEditStatusMasuk(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Tepat Waktu">Tepat Waktu</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Sakit">Sakit</option>
                        <option value="Izin">Izin</option>
                        <option value="Alfa">Alfa</option>
                        <option value="Lupa Scan Masuk">Lupa Scan Masuk</option>
                        <option value="-">- (Belum Absen)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/50">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">Jam Pulang</label>
                      <input
                        type="text"
                        placeholder="15:30 atau -"
                        value={editJamPulang}
                        onChange={(e) => setEditJamPulang(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">Status Pulang</label>
                      <select
                        value={editStatusPulang}
                        onChange={(e) => setEditStatusPulang(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-1.5 px-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Tepat Waktu">Tepat Waktu</option>
                        <option value="Terlambat">Terlambat</option>
                        <option value="Lupa Scan Pulang">Lupa Scan Pulang</option>
                        <option value="-">- (Belum Pulang)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Keterangan */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">Catatan / Keterangan Koreksi</label>
                  <textarea 
                    value={editKet}
                    onChange={(e) => setEditKet(e.target.value)}
                    placeholder="Contoh: Koreksi jam masuk karena gangguan scanner, Izin lomba, dll."
                    rows={2}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 gap-2">
                  <div>
                    {editTargetId && (
                      <button 
                        type="button"
                        disabled={savingEdit}
                        onClick={handleDeleteKehadiran}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        title="Hapus record presensi tanggal ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus Presensi
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="bg-gray-100 text-gray-600 font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      disabled={savingEdit || !editTargetId}
                      className="bg-amber-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-500/10 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
