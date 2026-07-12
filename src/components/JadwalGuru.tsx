import { useState, useEffect, FormEvent } from "react";
import { 
  Calendar, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Clock, 
  AlertTriangle, 
  Users,
  ChevronDown
} from "lucide-react";
import { callGas } from "../lib/gasApi";

interface ScheduleItem {
  id_jadwal: string;
  id_guru: string;
  nama_guru: string;
  hari: string;
  jam_masuk_mulai: string;
  jam_masuk_batas: string;
  jam_pulang_mulai: string;
}

interface TeacherItem {
  id_guru: string;
  nama_guru: string;
  nip_nuptk: string;
}

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export default function JadwalGuru() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHariFilter, setSelectedHariFilter] = useState("Semua");

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id_guru: "",
    hari: "Senin",
    jam_masuk_mulai: "06:00",
    jam_masuk_batas: "07:15",
    jam_pulang_mulai: "15:30"
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all schedules
      const resSchedules = await callGas("getJadwalGuruSemua");
      if (resSchedules && resSchedules.success) {
        setSchedules(resSchedules.data || []);
      } else {
        setError(resSchedules?.message || "Gagal memuat jadwal guru.");
      }

      // 2. Fetch all teachers for selection
      const resTeachers = await callGas("getDataMaster", ["Guru"]);
      if (resTeachers && resTeachers.success) {
        setTeachers(resTeachers.data || []);
      }
    } catch (err: any) {
      setError("Kesalahan koneksi: " + err.toString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditId(null);
    setFormData({
      id_guru: teachers[0]?.id_guru || "",
      hari: "Senin",
      jam_masuk_mulai: "06:00",
      jam_masuk_batas: "07:15",
      jam_pulang_mulai: "15:30"
    });
    setShowFormModal(true);
  };

  const openEdit = (item: ScheduleItem) => {
    setEditId(item.id_jadwal);
    setFormData({
      id_guru: item.id_guru,
      hari: item.hari,
      jam_masuk_mulai: item.jam_masuk_mulai,
      jam_masuk_batas: item.jam_masuk_batas,
      jam_pulang_mulai: item.jam_pulang_mulai
    });
    setShowFormModal(true);
  };

  const handleDelete = async (idJadwal: string, namaGuru: string, hari: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus jadwal ${namaGuru} untuk hari ${hari}?`)) {
      try {
        const res = await callGas("hapusJadwalGuru", [idJadwal]);
        if (res && res.success) {
          alert(res.message || "Jadwal berhasil dihapus.");
          fetchData();
        } else {
          alert(res?.message || "Gagal menghapus jadwal.");
        }
      } catch (err: any) {
        alert("Gagal menghubungi server: " + err.toString());
      }
    }
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.id_guru) {
      alert("Silakan pilih guru terlebih dahulu!");
      return;
    }

    const selectedTeacher = teachers.find(t => t.id_guru === formData.id_guru);
    const namaGuru = selectedTeacher ? selectedTeacher.nama_guru : "";

    const payload = {
      id_guru: formData.id_guru,
      nama_guru: namaGuru,
      hari: formData.hari,
      jam_masuk_mulai: formData.jam_masuk_mulai,
      jam_masuk_batas: formData.jam_masuk_batas,
      jam_pulang_mulai: formData.jam_pulang_mulai
    };

    try {
      setLoading(true);
      let res;
      if (editId) {
        res = await callGas("editJadwalGuru", [editId, payload]);
      } else {
        res = await callGas("tambahJadwalGuru", [payload]);
      }

      if (res && res.success) {
        setShowFormModal(false);
        alert(res.message || "Jadwal berhasil disimpan!");
        fetchData();
      } else {
        alert(res?.message || "Gagal menyimpan jadwal.");
        setLoading(false);
      }
    } catch (err: any) {
      alert("Kesalahan koneksi: " + err.toString());
      setLoading(false);
    }
  };

  // Filter schedules list based on search and selected day
  const filteredSchedules = schedules.filter((item) => {
    const matchSearch = item.nama_guru.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.hari.toLowerCase().includes(searchQuery.toLowerCase());
    const matchHari = selectedHariFilter === "Semua" || item.hari === selectedHariFilter;
    return matchSearch && matchHari;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-amber-500" />
            Jadwal Khusus Guru
          </h2>
          <p className="text-xs text-gray-500 font-medium">Atur jam masuk dan pulang guru secara fleksibel berdasarkan hari</p>
        </div>

        <button 
          onClick={openAdd}
          disabled={teachers.length === 0}
          className="bg-amber-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-amber-700 disabled:opacity-50 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Jadwal Fleksibel
        </button>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <input 
            type="text"
            placeholder="Cari nama guru..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-9 pr-4 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <select 
          value={selectedHariFilter}
          onChange={(e) => setSelectedHariFilter(e.target.value)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-amber-500"
        >
          <option value="Semua">Semua Hari</option>
          {HARI_LIST.map((h, idx) => (
            <option key={idx} value={h}>{h}</option>
          ))}
        </select>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading && schedules.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">Memuat jadwal guru...</div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 font-medium">{error}</div>
        ) : filteredSchedules.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            <p className="font-bold text-gray-500 mb-1">Belum ada jadwal khusus guru</p>
            <p className="text-[11px] text-gray-400">Guru yang tidak terdaftar di sini akan otomatis mengikuti jam operasional default sekolah.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">ID Jadwal</th>
                  <th className="py-3.5 px-6">Nama Guru</th>
                  <th className="py-3.5 px-6">Hari</th>
                  <th className="py-3.5 px-6">Jam Masuk Mulai</th>
                  <th className="py-3.5 px-6">Batas Masuk</th>
                  <th className="py-3.5 px-6">Jam Pulang Mulai</th>
                  <th className="py-3.5 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs text-gray-700">
                {filteredSchedules.map((item) => (
                  <tr key={item.id_jadwal} className="hover:bg-amber-50/20 transition-all duration-150">
                    <td className="py-3.5 px-6 font-mono font-bold text-gray-400">{item.id_jadwal}</td>
                    <td className="py-3.5 px-6 font-bold text-gray-900">{item.nama_guru}</td>
                    <td className="py-3.5 px-6">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-100">
                        {item.hari}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-gray-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {item.jam_masuk_mulai}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-rose-600">{item.jam_masuk_batas}</td>
                    <td className="py-3.5 px-6 font-semibold text-emerald-600">{item.jam_pulang_mulai}</td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-150"
                          title="Edit Jadwal"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id_jadwal, item.nama_guru, item.hari)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-150"
                          title="Hapus Jadwal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FORM MODAL (Add/Edit) */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-extrabold text-gray-900 text-sm tracking-tight flex items-center gap-1.5">
                <Calendar className="w-4.5 h-4.5 text-amber-500" />
                {editId ? "Ubah Jadwal Khusus Guru" : "Tambah Jadwal Khusus Baru"}
              </h3>
              <button 
                onClick={() => setShowFormModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Pilih Guru</label>
                <div className="relative">
                  <select 
                    value={formData.id_guru}
                    onChange={(e) => setFormData({ ...formData, id_guru: e.target.value })}
                    required
                    disabled={!!editId}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold appearance-none pr-10 focus:outline-none focus:border-amber-500"
                  >
                    <option value="" disabled>-- Pilih Guru --</option>
                    {teachers.map((t) => (
                      <option key={t.id_guru} value={t.id_guru}>
                        {t.nama_guru} ({t.nip_nuptk || "NIP Kosong"})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Hari Berlaku</label>
                <div className="relative">
                  <select 
                    value={formData.hari}
                    onChange={(e) => setFormData({ ...formData, hari: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 font-bold appearance-none pr-10 focus:outline-none focus:border-amber-500"
                  >
                    {HARI_LIST.map((h, idx) => (
                      <option key={idx} value={h}>{h}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">Jam Masuk Mulai</label>
                  <input 
                    type="time"
                    value={formData.jam_masuk_mulai}
                    onChange={(e) => setFormData({ ...formData, jam_masuk_mulai: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500">Batas Absen Masuk</label>
                  <input 
                    type="time"
                    value={formData.jam_masuk_batas}
                    onChange={(e) => setFormData({ ...formData, jam_masuk_batas: e.target.value })}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500 font-mono text-rose-600 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500">Jam Pulang Mulai</label>
                <input 
                  type="time"
                  value={formData.jam_pulang_mulai}
                  onChange={(e) => setFormData({ ...formData, jam_pulang_mulai: e.target.value })}
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs text-gray-800 focus:outline-none focus:border-amber-500 font-mono text-emerald-600 font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button 
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
