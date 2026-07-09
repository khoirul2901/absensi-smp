/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, FormEvent } from "react";
import { 
  Users, 
  GraduationCap, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  QrCode, 
  Download, 
  Upload, 
  X, 
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle
} from "lucide-react";
import { callGas } from "../lib/gasApi";
import { Siswa, Guru } from "../types";

export default function DataMaster() {
  const [kategori, setKategori] = useState<"Siswa" | "Guru">("Siswa");
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("Semua");
  const [classList, setClassList] = useState<string[]>([]);

  // Modals state
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  
  // Form fields
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Excel paste import state
  const [pasteData, setPasteData] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Load Classes list
  useEffect(() => {
    async function loadClasses() {
      const res = await callGas("getKelasSemua");
      if (Array.isArray(res)) {
        setClassList(res);
      }
    }
    loadClasses();
  }, []);

  // Fetch Master Data list
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await callGas("getDataMaster", [kategori]);
      if (res && res.success) {
        setDataList(res.data);
      } else {
        setError(res?.message || "Gagal memuat data master");
      }
    } catch (err: any) {
      setError(err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [kategori]);

  // Form Submission
  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let res;
      if (editId) {
        // Edit record
        res = await callGas("editDataMaster", [kategori, editId, formData]);
      } else {
        // Add new record
        res = await callGas("tambahDataMaster", [kategori, formData]);
      }

      if (res && res.success) {
        setShowFormModal(false);
        setFormData({});
        setEditId(null);
        fetchData();
      } else {
        alert(res?.message || "Gagal menyimpan data master");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Delete Record
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus permanen data: ${name} (${id})?`)) return;
    try {
      setLoading(true);
      const res = await callGas("hapusDataMaster", [kategori, id]);
      if (res && res.success) {
        fetchData();
      } else {
        alert(res?.message || "Gagal menghapus data");
      }
    } catch (err: any) {
      alert("Error: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  // Open Form for editing
  const openEdit = (item: any) => {
    setEditId(kategori === "Siswa" ? item.id_siswa : item.id_guru);
    setFormData(item);
    setShowFormModal(true);
  };

  // Open Form for creating
  const openAdd = () => {
    setEditId(null);
    setFormData(kategori === "Siswa" ? {
      nisn: "",
      nama_siswa: "",
      jenis_kelamin: "Laki-laki",
      kelas: classList[0] || "XI",
      jurusan: "RPL 1",
      no_hp_ortu: ""
    } : {
      nip_nuptk: "",
      nama_guru: "",
      jenis_kelamin: "Laki-laki",
      jabatan_tugas: "Guru Mapel",
      no_hp: ""
    });
    setShowFormModal(true);
  };

  // Parse Excel / Tabular copied data
  const handleImportSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!pasteData.trim()) return;

    try {
      setImportStatus("Menganalisis baris...");
      const rows = pasteData.trim().split("\n");
      const listParsed: any[] = [];
      
      rows.forEach((row, i) => {
        const cols = row.split("\t"); // Excel copy paste is tab-separated
        if (cols.length < 3) return; // skip junk rows
        
        if (kategori === "Siswa") {
          listParsed.push({
            nisn: cols[0]?.trim() || "-",
            nama_siswa: cols[1]?.trim() || "-",
            jenis_kelamin: cols[2]?.trim() || "Laki-laki",
            kelas: cols[3]?.trim() || "XI",
            jurusan: cols[4]?.trim() || "RPL 1",
            no_hp_ortu: cols[5]?.trim() || "-"
          });
        } else {
          listParsed.push({
            nip_nuptk: cols[0]?.trim() || "-",
            nama_guru: cols[1]?.trim() || "-",
            jenis_kelamin: cols[2]?.trim() || "Laki-laki",
            jabatan_tugas: cols[3]?.trim() || "Guru",
            no_hp: cols[4]?.trim() || "-"
          });
        }
      });

      if (listParsed.length === 0) {
        setImportStatus("Tidak ada data valid yang terdeteksi!");
        return;
      }

      setImportStatus(`Mengunggah ${listParsed.length} data ke spreadsheet...`);
      const res = await callGas("importDataMassal", [kategori, listParsed]);
      if (res && res.success) {
        setImportStatus(null);
        setPasteData("");
        setShowImportModal(false);
        fetchData();
        alert(res.message);
      } else {
        setImportStatus("Gagal: " + (res?.message || "Terjadi kesalahan upload"));
      }
    } catch (err: any) {
      setImportStatus("Error: " + err.toString());
    }
  };

  // Export Data to CSV
  const handleExportCSV = () => {
    if (dataList.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    const headers = kategori === "Siswa" 
      ? ["ID", "NISN", "Nama Siswa", "Jenis Kelamin", "Kelas", "Jurusan", "HP Ortu", "QR Content"]
      : ["ID", "NIP/NUPTK", "Nama Guru", "Jenis Kelamin", "Jabatan", "No HP", "QR Content"];
      
    csvContent += headers.join(",") + "\n";
    
    dataList.forEach(item => {
      const row = kategori === "Siswa" ? [
        item.id_siswa,
        `"${item.nisn}"`,
        `"${item.nama_siswa}"`,
        item.jenis_kelamin,
        item.kelas,
        `"${item.jurusan}"`,
        `"${item.no_hp_ortu}"`,
        item.qr_content
      ] : [
        item.id_guru,
        `"${item.nip_nuptk}"`,
        `"${item.nama_guru}"`,
        item.jenis_kelamin,
        `"${item.jabatan_tugas}"`,
        `"${item.no_hp}"`,
        item.qr_content
      ];
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_master_${kategori.toLowerCase()}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter lists based on search & class
  const filteredData = dataList.filter(item => {
    const name = (item.nama_siswa || item.nama_guru || "").toLowerCase();
    const id = (item.id_siswa || item.id_guru || "").toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || id.includes(searchQuery.toLowerCase());
    
    if (kategori === "Siswa" && selectedKelas !== "Semua") {
      return matchesSearch && item.kelas === selectedKelas;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Data Master Sekolah</h1>
          <p className="text-xs text-gray-500">Kelola master data murid dan guru, serta ekspor/impor data masal</p>
        </div>

        {/* Categories toggler */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-gray-50 border border-gray-200 p-1 rounded-xl">
            <button 
              onClick={() => { setKategori("Siswa"); setSelectedKelas("Semua"); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${kategori === "Siswa" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <GraduationCap className="w-4 h-4" />
              Siswa
            </button>
            <button 
              onClick={() => setKategori("Guru")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-150 ${kategori === "Guru" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
            >
              <Users className="w-4 h-4" />
              Guru
            </button>
          </div>

          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
          >
            <Upload className="w-4 h-4" />
            Impor Masal
          </button>

          <button 
            onClick={handleExportCSV}
            disabled={filteredData.length === 0}
            className="bg-white border border-gray-200 text-gray-700 font-bold text-xs px-3.5 py-2.5 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>

          <button 
            onClick={openAdd}
            className="bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-all duration-150 shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Tambah {kategori}
          </button>
        </div>
      </div>

      {/* Search and class selection filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <input 
            type="text"
            placeholder={`Cari nama or ID ${kategori.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        {kategori === "Siswa" && (
          <select 
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-blue-500"
          >
            <option value="Semua">Semua Kelas</option>
            {classList.map((kls, idx) => (
              <option key={idx} value={kls}>{kls}</option>
            ))}
          </select>
        )}
      </div>

      {/* Main Table list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Memuat database...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-500 font-medium">{error}</div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">Tidak ada data ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">ID</th>
                  <th className="py-3.5 px-6">{kategori === "Siswa" ? "NISN" : "NIP / NUPTK"}</th>
                  <th className="py-3.5 px-6">Nama</th>
                  <th className="py-3.5 px-6">JK</th>
                  <th className="py-3.5 px-6">{kategori === "Siswa" ? "Kelas & Jurusan" : "Jabatan"}</th>
                  <th className="py-3.5 px-6">{kategori === "Siswa" ? "HP Wali" : "No HP"}</th>
                  <th className="py-3.5 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {filteredData.map((item) => {
                  const id = kategori === "Siswa" ? item.id_siswa : item.id_guru;
                  const primaryId = kategori === "Siswa" ? item.nisn : item.nip_nuptk;
                  const name = kategori === "Siswa" ? item.nama_siswa : item.nama_guru;
                  const position = kategori === "Siswa" ? `${item.kelas} ${item.jurusan}` : item.jabatan_tugas;
                  const phone = kategori === "Siswa" ? item.no_hp_ortu : item.no_hp;
                  
                  return (
                    <tr key={id} className="hover:bg-slate-50/80 transition-all duration-150">
                      <td className="py-3.5 px-6 font-mono font-bold text-gray-500">{id}</td>
                      <td className="py-3.5 px-6 text-gray-600 font-semibold">{primaryId}</td>
                      <td className="py-3.5 px-6 font-bold text-gray-900">{name}</td>
                      <td className="py-3.5 px-6 text-gray-500 font-medium">{item.jenis_kelamin}</td>
                      <td className="py-3.5 px-6 text-gray-600 font-semibold">{position}</td>
                      <td className="py-3.5 px-6 text-gray-500">{phone}</td>
                      <td className="py-3.5 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button 
                            onClick={() => setShowQrModal({ open: true, item })}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-150"
                            title="Tampilkan QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-150"
                            title="Edit Data"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(id, name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-150"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD/EDIT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-base">
                {editId ? `Edit Data ${kategori}` : `Tambah ${kategori} Baru`}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {kategori === "Siswa" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">NISN</label>
                    <input 
                      type="text"
                      required
                      value={formData.nisn || ""}
                      onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      placeholder="Masukkan 10 digit NISN"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Nama Siswa</label>
                    <input 
                      type="text"
                      required
                      value={formData.nama_siswa || ""}
                      onChange={(e) => setFormData({ ...formData, nama_siswa: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold"
                      placeholder="Nama lengkap murid"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Jenis Kelamin</label>
                      <select 
                        value={formData.jenis_kelamin || "Laki-laki"}
                        onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Kelas</label>
                      <select 
                        value={formData.kelas || "XI"}
                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      >
                        {classList.map((kls, idx) => (
                          <option key={idx} value={kls}>{kls}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Jurusan</label>
                      <input 
                        type="text"
                        required
                        value={formData.jurusan || ""}
                        onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                        placeholder="Contoh: RPL 1"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">No HP Orang Tua</label>
                      <input 
                        type="text"
                        required
                        value={formData.no_hp_ortu || ""}
                        onChange={(e) => setFormData({ ...formData, no_hp_ortu: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                        placeholder="Contoh: 0857xxx"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">NIP / NUPTK</label>
                    <input 
                      type="text"
                      required
                      value={formData.nip_nuptk || ""}
                      onChange={(e) => setFormData({ ...formData, nip_nuptk: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      placeholder="NIP PNS atau NUPTK Guru"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Nama Guru</label>
                    <input 
                      type="text"
                      required
                      value={formData.nama_guru || ""}
                      onChange={(e) => setFormData({ ...formData, nama_guru: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold"
                      placeholder="Nama lengkap & gelar"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">Jenis Kelamin</label>
                      <select 
                        value={formData.jenis_kelamin || "Laki-laki"}
                        onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500">No HP</label>
                      <input 
                        type="text"
                        required
                        value={formData.no_hp || ""}
                        onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                        placeholder="No HP aktif WA"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500">Jabatan / Tugas Tambahan</label>
                    <input 
                      type="text"
                      required
                      value={formData.jabatan_tugas || ""}
                      onChange={(e) => setFormData({ ...formData, jabatan_tugas: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800"
                      placeholder="Contoh: Waka Kurikulum, Ka. RPL"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL PASTING MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-gray-900 text-base">Impor Data Masal {kategori}</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
            </div>
            
            <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-2 text-xs text-blue-800">
                <h4 className="font-bold">Format Kolom Excel (Copy - Paste):</h4>
                {kategori === "Siswa" ? (
                  <p className="font-mono bg-blue-100/60 p-2 rounded">
                    NISN [tab] Nama Siswa [tab] Jenis Kelamin [tab] Kelas [tab] Jurusan [tab] HP Ortu
                  </p>
                ) : (
                  <p className="font-mono bg-blue-100/60 p-2 rounded">
                    NIP [tab] Nama Guru [tab] Jenis Kelamin [tab] Jabatan [tab] No HP
                  </p>
                )}
                <p className="text-[10px] opacity-80 leading-relaxed">
                  * Tips: Buat kolom di Excel sesuai urutan di atas, copy baris datanya, lalu paste-kan langsung ke kolom teks di bawah ini.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Paste Data Tabular Excel</label>
                <textarea 
                  required
                  rows={8}
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  placeholder="Paste baris data Excel di sini..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-800 font-mono focus:outline-none"
                />
              </div>

              {importStatus && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex gap-2 text-xs font-medium">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="bg-gray-100 text-gray-600 font-semibold text-xs px-4 py-2.5 rounded-xl hover:bg-gray-200"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={!pasteData.trim()}
                  className="bg-blue-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50"
                >
                  Unggah Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQrModal.open && showQrModal.item && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-xs w-full overflow-hidden text-center p-6 space-y-6">
            <div className="flex justify-between items-center">
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Kartu Digital {kategori}
              </span>
              <button 
                onClick={() => setShowQrModal({ open: false, item: null })}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-gray-900 text-base">
                {kategori === "Siswa" ? showQrModal.item.nama_siswa : showQrModal.item.nama_guru}
              </h4>
              <p className="text-xs text-gray-500 font-mono">
                {kategori === "Siswa" ? showQrModal.item.id_siswa : showQrModal.item.id_guru}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl inline-block border border-gray-100">
              {/* Google Chart QR generation API */}
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(showQrModal.item.qr_content)}`} 
                alt="QR Code" 
                className="w-40 h-40 mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-gray-400">Isi Sandi QR:</div>
              <div className="font-mono font-bold text-gray-800 bg-slate-100 py-1.5 px-3 rounded-lg inline-block">
                {showQrModal.item.qr_content}
              </div>
            </div>

            <button 
              onClick={() => {
                const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(showQrModal.item.qr_content)}`;
                const link = document.createElement("a");
                link.href = url;
                link.target = "_blank";
                link.download = `QR_${kategori}_${showQrModal.item.qr_content}.png`;
                link.click();
              }}
              className="bg-slate-900 text-white font-bold text-xs w-full py-2.5 rounded-xl hover:bg-slate-800 transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download Kartu QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
