/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Key for storing the GAS URL
export const GAS_URL_STORAGE_KEY = "SIAS_GAS_URL";
export const GAS_TOKEN_STORAGE_KEY = "SIAS_GAS_TOKEN";

export interface SchoolProfile {
  namaSekolah: string;
  alamatSekolah: string;
  npsn?: string;
  telepon?: string;
}

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: "AL-HIKAM SCHOOL",
  alamatSekolah: "SENDANG AGUNG",
  npsn: "20512345",
  telepon: "(031) 8901234"
};

export function getSchoolProfile(): SchoolProfile {
  try {
    const saved = localStorage.getItem("SIAS_SCHOOL_PROFILE");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.namaSekolah) {
        return {
          ...DEFAULT_SCHOOL_PROFILE,
          ...parsed
        };
      }
    }
  } catch (e) {}
  return DEFAULT_SCHOOL_PROFILE;
}

export function setSchoolProfile(profile: SchoolProfile): void {
  try {
    localStorage.setItem("SIAS_SCHOOL_PROFILE", JSON.stringify(profile));
  } catch (e) {}
}

export function getGasUrl(): string {
  try {
    const saved = localStorage.getItem(GAS_URL_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return "https://script.google.com/macros/s/AKfycbzCjuiKC99_2xw6E8KY7wOOHLMrqWo3O6LjsU7LX0XZWMCie9_qXtTB-IyhRXxvUKkz9Q/exec";
}

export function setGasUrl(url: string): void {
  try {
    localStorage.setItem(GAS_URL_STORAGE_KEY, url);
  } catch (e) {}
}

export function getGasToken(): string {
  try {
    const saved = localStorage.getItem(GAS_TOKEN_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return "sias_token_smkalhikam";
}

export function getStorageKey(baseKey: string): string {
  const url = getGasUrl() || "default_gas_url";
  const token = getGasToken() || "default_gas_token";
  const combined = url + "_" + token;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const cleanHash = Math.abs(hash).toString(36);
  return `${baseKey}_${cleanHash}`;
}

export function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.result && Array.isArray(res.result)) return res.result;
  if (res.list && Array.isArray(res.list)) return res.list;
  if (res.items && Array.isArray(res.items)) return res.items;
  if (res.rows && Array.isArray(res.rows)) return res.rows;
  if (res.PresensiSiswa && Array.isArray(res.PresensiSiswa)) return res.PresensiSiswa;
  if (res.PresensiGuru && Array.isArray(res.PresensiGuru)) return res.PresensiGuru;
  if (res.AbsensiMengajar && Array.isArray(res.AbsensiMengajar)) return res.AbsensiMengajar;
  if (res.presensi_siswa && Array.isArray(res.presensi_siswa)) return res.presensi_siswa;
  if (res.presensi_guru && Array.isArray(res.presensi_guru)) return res.presensi_guru;
  if (res.absensi_mengajar && Array.isArray(res.absensi_mengajar)) return res.absensi_mengajar;
  if (res.absensi_mengajar_guru && Array.isArray(res.absensi_mengajar_guru)) return res.absensi_mengajar_guru;
  if (res.jam_pelajaran && Array.isArray(res.jam_pelajaran)) return res.jam_pelajaran;
  if (res.jadwal_pelajaran && Array.isArray(res.jadwal_pelajaran)) return res.jadwal_pelajaran;
  if (res.jadwal_guru && Array.isArray(res.jadwal_guru)) return res.jadwal_guru;
  if (res.laporan && Array.isArray(res.laporan)) return res.laporan;
  if (res.presensi && Array.isArray(res.presensi)) return res.presensi;
  if (res.absensi && Array.isArray(res.absensi)) return res.absensi;
  if (res.presensiSiswa && Array.isArray(res.presensiSiswa)) return res.presensiSiswa;
  if (res.presensiGuru && Array.isArray(res.presensiGuru)) return res.presensiGuru;
  if (res.absensiMengajar && Array.isArray(res.absensiMengajar)) return res.absensiMengajar;
  if (res.laporan_siswa && Array.isArray(res.laporan_siswa)) return res.laporan_siswa;
  if (res.laporan_guru && Array.isArray(res.laporan_guru)) return res.laporan_guru;
  if (res.laporanSiswa && Array.isArray(res.laporanSiswa)) return res.laporanSiswa;
  if (res.laporanGuru && Array.isArray(res.laporanGuru)) return res.laporanGuru;
  return [];
}

export function formatToIsoDate(dStr: any): string {
  if (!dStr) return "";
  const s = String(dStr).trim();
  if (s.includes("T")) return s.split("T")[0];
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
  if (s.includes("/") || s.includes("-")) {
    const parts = s.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  const dateObj = new Date(dStr);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split("T")[0];
  }
  return s;
}

export function setGasToken(token: string): void {
  // Nonaktif: pengaturan sekarang di-hardcode di getGasToken()
}

export function isUsingMock(): boolean {
  const url = getGasUrl();
  return !url || url.includes("AKfycbzQ4b8j2R3mXz0YV4X_O");
}

// Ensure mock database exists in localStorage
function initMockDb() {
  const getKey = (k: string) => getStorageKey("MOCK_" + k);

  if (!localStorage.getItem(getKey("users"))) {
    localStorage.setItem(getKey("users"), JSON.stringify([
      { username: "admin", password: "admin123", role: "Admin", target_id: "-" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_siswa"))) {
    localStorage.setItem(getKey("data_siswa"), JSON.stringify([
      { id_siswa: "S-001", nisn: "0081234567", nama_siswa: "Ahmad Dani", jenis_kelamin: "Laki-laki", kelas: "XI", jurusan: "RPL 1", no_hp_ortu: "08571234567", qr_content: "QR-S-001" },
      { id_siswa: "S-002", nisn: "0098765432", nama_siswa: "Siti Aminah", jenis_kelamin: "Perempuan", kelas: "XI", jurusan: "RPL 1", no_hp_ortu: "08129876543", qr_content: "QR-S-002" },
      { id_siswa: "S-003", nisn: "0076543210", nama_siswa: "Rizky Pratama", jenis_kelamin: "Laki-laki", kelas: "X", jurusan: "RPL 2", no_hp_ortu: "08132435465", qr_content: "QR-S-003" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_guru"))) {
    localStorage.setItem(getKey("data_guru"), JSON.stringify([
      { id_guru: "G-001", nip_nuptk: "198706122015031002", nama_guru: "Bahrul Ulum, S.Kom", jenis_kelamin: "Laki-laki", jabatan_tugas: "Ka. Komli RPL", no_hp: "08123456789", qr_content: "QR-G-001" },
      { id_guru: "G-002", nip_nuptk: "199201042019082001", nama_guru: "Eka Rahmawati, S.Pd", jenis_kelamin: "Perempuan", jabatan_tugas: "Waka Kurikulum", no_hp: "08198765432", qr_content: "QR-G-002" }
    ]));
  }
  if (!localStorage.getItem(getKey("laporan_siswa"))) {
    localStorage.setItem(getKey("laporan_siswa"), JSON.stringify([]));
  }
  if (!localStorage.getItem(getKey("laporan_guru"))) {
    localStorage.setItem(getKey("laporan_guru"), JSON.stringify([]));
  }
  if (!localStorage.getItem(getKey("pengaturan_jam"))) {
    localStorage.setItem(getKey("pengaturan_jam"), JSON.stringify({
      jam_masuk_mulai: "06:00",
      jam_masuk_batas: "07:15",
      jam_pulang_mulai: "15:30"
    }));
  }
  if (!localStorage.getItem(getKey("hari_libur"))) {
    localStorage.setItem(getKey("hari_libur"), JSON.stringify([
      { tanggal: "2026-08-17", keterangan: "Hari Kemerdekaan RI" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_kelas"))) {
    localStorage.setItem(getKey("data_kelas"), JSON.stringify([
      { nama_kelas: "X RPL 1", id_guru: "G-001", wali_kelas: "Bahrul Ulum, S.Kom" },
      { nama_kelas: "X RPL 2", id_guru: "-", wali_kelas: "-" },
      { nama_kelas: "XI RPL 1", id_guru: "G-002", wali_kelas: "Eka Rahmawati, S.Pd" },
      { nama_kelas: "XI RPL 2", id_guru: "-", wali_kelas: "-" },
      { nama_kelas: "XII RPL 1", id_guru: "-", wali_kelas: "-" }
    ]));
  }
  if (!localStorage.getItem(getKey("jam_pelajaran"))) {
    localStorage.setItem(getKey("jam_pelajaran"), JSON.stringify([
      { id_jam: "JP-1", jam_ke: 1, nama_jam: "Jam ke-1", jam_mulai: "07:00", jam_selesai: "07:45", tipe: "Pelajaran" },
      { id_jam: "JP-2", jam_ke: 2, nama_jam: "Jam ke-2", jam_mulai: "07:45", jam_selesai: "08:30", tipe: "Pelajaran" },
      { id_jam: "JP-3", jam_ke: 3, nama_jam: "Jam ke-3", jam_mulai: "08:30", jam_selesai: "09:15", tipe: "Pelajaran" },
      { id_jam: "JP-IST1", jam_ke: 0, nama_jam: "Istirahat Pertama", jam_mulai: "09:15", jam_selesai: "09:45", tipe: "Istirahat" },
      { id_jam: "JP-4", jam_ke: 4, nama_jam: "Jam ke-4", jam_mulai: "09:45", jam_selesai: "10:30", tipe: "Pelajaran" },
      { id_jam: "JP-5", jam_ke: 5, nama_jam: "Jam ke-5", jam_mulai: "10:30", jam_selesai: "11:15", tipe: "Pelajaran" },
      { id_jam: "JP-6", jam_ke: 6, nama_jam: "Jam ke-6", jam_mulai: "11:15", jam_selesai: "12:00", tipe: "Pelajaran" },
      { id_jam: "JP-IST2", jam_ke: 0, nama_jam: "ISOMA (Istirahat & Sholat)", jam_mulai: "12:00", jam_selesai: "13:00", tipe: "Istirahat" },
      { id_jam: "JP-7", jam_ke: 7, nama_jam: "Jam ke-7", jam_mulai: "13:00", jam_selesai: "13:45", tipe: "Pelajaran" },
      { id_jam: "JP-8", jam_ke: 8, nama_jam: "Jam ke-8", jam_mulai: "13:45", jam_selesai: "14:30", tipe: "Pelajaran" }
    ]));
  }
  if (!localStorage.getItem(getKey("jadwal_pelajaran"))) {
    localStorage.setItem(getKey("jadwal_pelajaran"), JSON.stringify([
      { id_jadwal: "JPEL-101", hari: "Senin", id_jam: "JP-1", jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45", kelas: "XI RPL 1", mapel: "Pemrograman Web", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 1" },
      { id_jadwal: "JPEL-102", hari: "Senin", id_jam: "JP-2", jam_ke: 2, jam_mulai: "07:45", jam_selesai: "08:30", kelas: "XI RPL 1", mapel: "Pemrograman Web", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 1" },
      { id_jadwal: "JPEL-103", hari: "Senin", id_jam: "JP-3", jam_ke: 3, jam_mulai: "08:30", jam_selesai: "09:15", kelas: "XI RPL 1", mapel: "Matematika", id_guru: "G-002", nama_guru: "Eka Rahmawati, S.Pd", ruangan: "R. XI RPL 1" },
      { id_jadwal: "JPEL-104", hari: "Selasa", id_jam: "JP-1", jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45", kelas: "X RPL 1", mapel: "Informatika", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 2" }
    ]));
  }
  if (!localStorage.getItem(getKey("absensi_mengajar_guru"))) {
    localStorage.setItem(getKey("absensi_mengajar_guru"), JSON.stringify([]));
  }
}

export function getStorage(key: string): any {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey("MOCK_" + key)) || "[]");
  } catch (e) {
    return [];
  }
}

export function setStorage(key: string, val: any): void {
  try {
    localStorage.setItem(getStorageKey("MOCK_" + key), JSON.stringify(val));
  } catch (e) {}
}

// Call local mock APIs
export function callMock(action: string, args: any[] = []): any {
  initMockDb();

  switch (action) {
    case "verifikasiLogin": {
      const [username, password] = args;
      
      // 1. Check mock users first (admin)
      const users = getStorage("users");
      const found = users.find((u: any) => u.username === username && u.password === password);
      if (found) {
        return { success: true, role: found.role, target_id: found.target_id, username: found.username, message: "Login Berhasil (SIMULASI)" };
      }
      
      // 2. Check mock teachers
      const teachers = getStorage("data_guru");
      const foundTeacher = teachers.find((t: any) => {
        const namaGuru = String(t.nama_guru || "").trim();
        const teacherUsername = namaGuru.replace(/\s+/g, "").toLowerCase();
        const inputUserLower = String(username).replace(/\s+/g, "").toLowerCase();
        
        // Match user by teacher's lowercase name without spaces
        const matchUser = (inputUserLower === teacherUsername);
        
        if (matchUser) {
          const inputPass = String(password).trim();
          const dbPass = String(t.password || "guru123").trim();
          return inputPass === dbPass;
        }
        return false;
      });
      
      if (foundTeacher) {
        return {
          success: true,
          role: "Guru",
          target_id: foundTeacher.id_guru,
          username: foundTeacher.nama_guru,
          message: "Login Berhasil (SIMULASI - Otomatis Guru)!"
        };
      }
      
      return { success: false, message: "Kredensial Salah! (Admin: admin / admin123, Guru: Nama tanpa spasi & huruf kecil, password default 'guru123')" };
    }
    
    case "ubahPasswordUser": {
      const [username, passwordLama, passwordBaru] = args;
      
      // Try admin users
      const users = getStorage("users");
      const index = users.findIndex((u: any) => u.username === username && u.password === passwordLama);
      if (index !== -1) {
        users[index].password = passwordBaru;
        setStorage("users", users);
        return { success: true, message: "Password berhasil diperbarui (SIMULASI)!" };
      }
      
      // Try teachers
      const teachers = getStorage("data_guru");
      const idxT = teachers.findIndex((t: any) => {
        const namaGuru = String(t.nama_guru || "").trim();
        const teacherUsername = namaGuru.replace(/\s+/g, "").toLowerCase();
        const inputUserLower = String(username).replace(/\s+/g, "").toLowerCase();
        
        if (inputUserLower === teacherUsername || String(username).toLowerCase().trim() === namaGuru.toLowerCase()) {
          const dbPass = String(t.password || "guru123").trim();
          return passwordLama === dbPass;
        }
        return false;
      });
      
      if (idxT !== -1) {
        teachers[idxT].password = passwordBaru;
        setStorage("data_guru", teachers);
        return { success: true, message: "Password Guru berhasil diperbarui (SIMULASI)!" };
      }
      
      return { success: false, message: "Password lama tidak sesuai / User tidak dikenali." };
    }

    case "getPengaturanSemua":
    case "getPengaturanJam":
    case "getPengaturan":
    case "getKonfigurasiJam": {
      const cfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      return { success: true, data: cfg, ...cfg };
    }

    case "simpanPengaturanCustom": {
      const [customObj] = args;
      const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const merged = { ...current, ...(typeof customObj === "object" ? customObj : {}) };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(merged));
      return { success: true, message: "Pengaturan berhasil diperbarui!", data: merged };
    }

    case "simpanKonfigurasiJam":
    case "simpanPengaturanJam":
    case "simpanPengaturan": {
      const [jamMasukMulai, jamMasukBatas, jamPulangMulai] = args;
      const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const merged = {
        ...current,
        jam_masuk_mulai: jamMasukMulai || current.jam_masuk_mulai || "06:00",
        jam_masuk_batas: jamMasukBatas || current.jam_masuk_batas || "07:15",
        jam_pulang_mulai: jamPulangMulai || current.jam_pulang_mulai || "15:30"
      };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(merged));
      return { success: true, message: "Pengaturan Jam Operasional disimpan!", data: merged };
    }

    case "backupDatabaseToDrive": {
      const [folderId] = args;
      const currentConfig = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const now = new Date().toISOString();
      const updated = {
        ...currentConfig,
        lastBackupTime: now,
        driveFolderId: folderId || currentConfig.driveFolderId || ""
      };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(updated));
      return { 
        success: true, 
        message: `Backup database berhasil diunggah ke Google Drive (Folder ID: ${folderId || "Utama"})!`,
        lastBackupTime: now
      };
    }

    case "restoreDatabaseJSON": {
      const [jsonData] = args;
      if (!jsonData || typeof jsonData !== "object") {
        return { success: false, message: "Format file JSON backup tidak valid!" };
      }
      try {
        if (jsonData.users && Array.isArray(jsonData.users)) setStorage("users", jsonData.users);
        if (jsonData.data_siswa && Array.isArray(jsonData.data_siswa)) setStorage("data_siswa", jsonData.data_siswa);
        if (jsonData.data_guru && Array.isArray(jsonData.data_guru)) setStorage("data_guru", jsonData.data_guru);
        if (jsonData.data_kelas && Array.isArray(jsonData.data_kelas)) setStorage("data_kelas", jsonData.data_kelas);
        if (jsonData.jam_pelajaran && Array.isArray(jsonData.jam_pelajaran)) setStorage("jam_pelajaran", jsonData.jam_pelajaran);
        if (jsonData.jadwal_pelajaran && Array.isArray(jsonData.jadwal_pelajaran)) setStorage("jadwal_pelajaran", jsonData.jadwal_pelajaran);
        if (jsonData.absensi_mengajar_guru && Array.isArray(jsonData.absensi_mengajar_guru)) setStorage("absensi_mengajar_guru", jsonData.absensi_mengajar_guru);
        if (jsonData.hari_libur && Array.isArray(jsonData.hari_libur)) setStorage("hari_libur", jsonData.hari_libur);
        if (jsonData.pengaturan && typeof jsonData.pengaturan === "object") {
          const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
          localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify({ ...current, ...jsonData.pengaturan }));
        }
        return { success: true, message: "Restore database dari backup berhasil diselesaikan!" };
      } catch (e: any) {
        return { success: false, message: "Gagal memproses restore: " + e.toString() };
      }
    }

    case "getHariLiburSemua": {
      return getStorage("hari_libur");
    }

    case "tambahHariLibur": {
      const [tanggal, ket] = args;
      const libur = getStorage("hari_libur");
      libur.push({ tanggal, keterangan: ket });
      setStorage("hari_libur", libur);
      return { success: true, message: "Hari libur ditambahkan (SIMULASI)." };
    }

    case "hapusHariLibur": {
      const [tanggal] = args;
      let libur = getStorage("hari_libur");
      libur = libur.filter((l: any) => l.tanggal !== tanggal);
      setStorage("hari_libur", libur);
      return { success: true, message: "Hari libur dihapus (SIMULASI)." };
    }

    case "getKelasSemua": {
      let data = getStorage("data_kelas");
      if (!Array.isArray(data)) data = [];
      const normalized = data.map((item: any) => {
        if (typeof item === "string") {
          return { nama_kelas: item, id_guru: "-", wali_kelas: "-" };
        }
        const rawWali = item.wali_kelas || item.wali || item.waliKelas || item["Wali Kelas"] || item["wali_kelas"] || "-";
        const cleanWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
        const rawId = item.id_guru || item.id_wali || item.idGuru || "-";
        const cleanId = String(rawId || "-").trim();
        return {
          nama_kelas: item.nama_kelas || item.kelas || String(item),
          id_guru: cleanId,
          wali_kelas: cleanWali
        };
      });
      return { success: true, data: normalized };
    }

    case "tambahKelas": {
      const [namaKelas, waliKelas, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      
      const rawWali = typeof waliKelas === "string" ? waliKelas : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      if (idx === -1) {
        kelas.push({ nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali });
      } else {
        kelas[idx] = { nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali };
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: "Kelas ditambahkan (SIMULASI)." };
    }

    case "hapusKelas": {
      const [namaKelas, payloadObj] = args;
      const nameClean = typeof payloadObj === "object" && payloadObj !== null && payloadObj.nama_kelas ? payloadObj.nama_kelas : (typeof namaKelas === "string" ? namaKelas : "");
      let kelas = getStorage("data_kelas");
      if (Array.isArray(kelas)) {
        kelas = kelas.filter((k: any) => {
          const kName = typeof k === "string" ? k : (k.nama_kelas || k.kelas || "");
          return String(kName).trim() !== String(nameClean).trim();
        });
        setStorage("data_kelas", kelas);
      }
      return { success: true, message: "Kelas berhasil dihapus!" };
    }

    case "editKelas": {
      const [kelasLama, kelasBaru, waliKelasBaru, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kelasLama);
      
      const rawWali = typeof waliKelasBaru === "string" ? waliKelasBaru : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      if (idx !== -1) {
        kelas[idx] = {
          nama_kelas: kelasBaru,
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        };
      } else {
        kelas.push({
          nama_kelas: kelasBaru,
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        });
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: "Kelas diperbarui (SIMULASI)." };
    }

    case "simpanWaliKelas": {
      const [namaKelas, waliKelas, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      
      const rawWali = typeof waliKelas === "string" ? waliKelas : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      if (idx !== -1) {
        kelas[idx] = {
          nama_kelas: typeof kelas[idx] === "string" ? kelas[idx] : (kelas[idx].nama_kelas || namaKelas),
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        };
      } else {
        kelas.push({ nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali });
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: `Wali kelas untuk ${namaKelas} berhasil disimpan!` };
    }

    case "getDataMaster": {
      const [kategori] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let rawData = getStorage(key);
      let changed = false;
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";

      // Clean out empty/blank records
      const cleanData = (Array.isArray(rawData) ? rawData : []).filter((item: any) => {
        if (!item || typeof item !== "object") return false;
        const name = String(item[nameKey] || item.nama || item.name || "").trim();
        const identifier = String(item[identifierKey] || "").trim();
        return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
      });

      if (cleanData.length !== rawData.length) {
        changed = true;
      }
      
      const data = cleanData.map((item: any) => {
        let needsSave = false;
        if (!item[idKey]) {
          const prefix = kategori === "Siswa" ? "S-" : "G-";
          item[idKey] = prefix + new Date().getTime().toString() + Math.floor(Math.random() * 1000).toString();
          needsSave = true;
        }
        if (!item.qr_content) {
          const identifier = item[identifierKey] || "";
          const name = item[nameKey] || "";
          item.qr_content = item[idKey] + "_" + identifier + "_" + name.replace(/\s+/g, '-');
          needsSave = true;
        }
        if (needsSave) changed = true;
        return item;
      });
      
      if (changed) {
        setStorage(key, data);
      }
      
      return { success: true, data };
    }

    case "getDataGuru": {
      return { success: true, data: getStorage("data_guru") };
    }

    case "getDataSiswa": {
      return { success: true, data: getStorage("data_siswa") };
    }

    case "tambahDataMaster": {
      const [kategori, dataObj] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      const prefix = kategori === "Siswa" ? "S-" : "G-";
      const idBaru = prefix + Math.floor(Math.random() * 10000);
      const qrContent = "QR-" + idBaru;
      
      const newRecord = kategori === "Siswa" ? {
        id_siswa: idBaru,
        nisn: dataObj.nisn,
        nama_siswa: dataObj.nama_siswa,
        jenis_kelamin: dataObj.jenis_kelamin,
        kelas: dataObj.kelas,
        jurusan: dataObj.jurusan,
        no_hp_ortu: dataObj.no_hp_ortu,
        qr_content: qrContent
      } : {
        id_guru: idBaru,
        nip_nuptk: dataObj.nip_nuptk,
        nama_guru: dataObj.nama_guru,
        jenis_kelamin: dataObj.jenis_kelamin,
        jabatan_tugas: dataObj.jabatan_tugas,
        no_hp: dataObj.no_hp,
        qr_content: qrContent
      };
      
      list.push(newRecord);
      setStorage(key, list);
      return { success: true, message: `Berhasil menambah ${kategori} baru (SIMULASI)` };
    }

    case "editDataMaster": {
      const [kategori, idTarget, dataObj] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const index = list.findIndex((x: any) => x[idKey] === idTarget);
      if (index !== -1) {
        list[index] = { ...list[index], ...dataObj };
        setStorage(key, list);
        return { success: true, message: "Data berhasil diubah (SIMULASI)." };
      }
      return { success: false, message: "ID tidak ditemukan." };
    }

    case "hapusDataMaster": {
      const [kategori, idTarget] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let list = getStorage(key);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";

      list = list.filter((x: any) => {
        if (!x || typeof x !== "object") return false;
        if (x[idKey] === idTarget) return false;
        const name = String(x[nameKey] || x.nama || x.name || "").trim();
        const identifier = String(x[identifierKey] || "").trim();
        return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
      });
      setStorage(key, list);
      return { success: true, message: "Data terhapus permanen (SIMULASI)." };
    }

    case "importDataMassal": {
      const [kategori, arrayData] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      
      arrayData.forEach((dataObj: any, index: number) => {
        const prefix = kategori === "Siswa" ? "S-" : "G-";
        const idBaru = prefix + (new Date().getTime().toString().slice(-4)) + index;
        const qrContent = "QR-" + idBaru;
        
        const rec = kategori === "Siswa" ? {
          id_siswa: idBaru,
          nisn: dataObj.nisn || "-",
          nama_siswa: dataObj.nama_siswa || "-",
          jenis_kelamin: dataObj.jenis_kelamin || "-",
          kelas: dataObj.kelas || "-",
          jurusan: dataObj.jurusan || "-",
          no_hp_ortu: dataObj.no_hp_ortu || "-",
          qr_content: qrContent
        } : {
          id_guru: idBaru,
          nip_nuptk: dataObj.nip_nuptk || "-",
          nama_guru: dataObj.nama_guru || "-",
          jenis_kelamin: dataObj.jenis_kelamin || "-",
          jabatan_tugas: dataObj.jabatan_tugas || "-",
          no_hp: dataObj.no_hp || "-",
          qr_content: qrContent
        };
        list.push(rec);
      });
      setStorage(key, list);
      return { success: true, message: `Migrasi sukses. ${arrayData.length} baris dimasukkan (SIMULASI).` };
    }

    case "prosesScanQR": {
      const [qrContent, kategori, mode, tanggal] = args;
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let master = getStorage(masterKey);
      if (!Array.isArray(master) || master.length === 0) {
        initMockDb();
        master = getStorage(masterKey);
      }
      
      const cleanQr = String(qrContent || "").trim().toLowerCase();
      const cleanWithoutPrefix = cleanQr.replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";

      // Precise hierarchical lookup:
      // 1. Exact Match on ID, NISN/NIP, or QR Content
      let user = master.find((x: any) => {
        const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase();
        const id = String(x[idKey] || "").trim().toLowerCase();
        const ident = String(x[identifierKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase();
        return (qr && qr === cleanQr) || (id && id === cleanQr) || (ident && ident === cleanQr);
      });

      // 2. Exact Match without common prefix (e.g. "S-001" vs "001" or "QR-S-001" vs "S-001")
      if (!user && cleanWithoutPrefix && cleanWithoutPrefix.length >= 2) {
        user = master.find((x: any) => {
          const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          const id = String(x[idKey] || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          const ident = String(x[identifierKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          return (qr && qr === cleanWithoutPrefix) || (id && id === cleanWithoutPrefix) || (ident && ident === cleanWithoutPrefix);
        });
      }

      // 3. Exact Full Name Match
      if (!user) {
        user = master.find((x: any) => {
          const nama = String(x[nameKey] || x.nama || "").trim().toLowerCase();
          return nama && nama === cleanQr;
        });
      }

      // 4. Normalized Full Name Match (only for alphabetic text queries with length >= 4)
      if (!user && /^[a-zA-Z\s.,']+$/.test(cleanQr) && cleanQr.length >= 4) {
        const normalize = (s: string) => s.toLowerCase().replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
        const targetNorm = normalize(cleanQr);
        user = master.find((x: any) => {
          const n = normalize(String(x[nameKey] || x.nama || ""));
          return n && (n === targetNorm || n.startsWith(targetNorm + " ") || targetNorm.startsWith(n + " "));
        });
      }
      
      if (!user) {
        // Try opposite category if not found
        const altKey = kategori === "Siswa" ? "data_guru" : "data_siswa";
        const altMaster = getStorage(altKey);
        const altIdKey = kategori === "Siswa" ? "id_guru" : "id_siswa";
        const altNameKey = kategori === "Siswa" ? "nama_guru" : "nama_siswa";
        const altIdentKey = kategori === "Siswa" ? "nip_nuptk" : "nisn";
        
        let altUser = altMaster.find((x: any) => {
          const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase();
          const id = String(x[altIdKey] || "").trim().toLowerCase();
          const ident = String(x[altIdentKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase();
          return (qr && qr === cleanQr) || (id && id === cleanQr) || (ident && ident === cleanQr);
        });

        if (!altUser && cleanWithoutPrefix && cleanWithoutPrefix.length >= 2) {
          altUser = altMaster.find((x: any) => {
            const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            const id = String(x[altIdKey] || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            const ident = String(x[altIdentKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            return (qr && qr === cleanWithoutPrefix) || (id && id === cleanWithoutPrefix) || (ident && ident === cleanWithoutPrefix);
          });
        }

        if (!altUser) {
          altUser = altMaster.find((x: any) => {
            const nama = String(x[altNameKey] || x.nama || "").trim().toLowerCase();
            return nama && nama === cleanQr;
          });
        }

        if (altUser) {
          user = altUser;
        }
      }

      if (!user) return { success: false, message: `ID / Kartu "${qrContent}" tidak valid atau belum terdaftar!` };
      
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = new Date().toTimeString().slice(0, 5);
      const isGuruUser = Boolean(user.id_guru || user.nama_guru || user.nip_nuptk);
      const activeKategori = isGuruUser ? "Guru" : "Siswa";
      const reportsKey = activeKategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey) || [];
      
      const activeIdKey = activeKategori === "Siswa" ? "id_siswa" : "id_guru";
      const idTarget = user[activeIdKey] || user.id_siswa || user.id_guru || qrContent;
      const activeNameKey = activeKategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const nama = user[activeNameKey] || user.nama || qrContent;
      const classKey = activeKategori === "Siswa" ? `${user.kelas || "-"} ${user.jurusan || ""}`.trim() : "-";
      
      // Index in daily attendance report
      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[activeIdKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      const cfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const defaultJamMasukBatas = cfg.jam_masuk_batas || "07:15";
      const defaultJamPulangMulai = cfg.jam_pulang_mulai || "15:30";

      const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const hariIni = hariList[new Date().getDay()];

      // ==========================================
      // 1. MODEL SISWA (Presensi Masuk & Pulang)
      // ==========================================
      if (activeKategori === "Siswa") {
        const jamPulangSiswa = cfg.jam_pulang_mulai || "14:00";
        const isTimeForPulang = jam >= jamPulangSiswa || (mode === "Pulang" && jam >= "12:00");

        if (!isTimeForPulang) {
          // Masuk Period for Siswa
          if (index !== -1 && reports[index].jam_masuk && reports[index].jam_masuk !== "-") {
            return { 
              success: true, 
              type: "info",
              message: `${nama} sudah melakukan presensi masuk hari ini (${reports[index].jam_masuk} WIB)! Belum jam pulang sekolah (Pk ${jamPulangSiswa} WIB).`, 
              data: reports[index] 
            };
          }

          const statusMasuk = (jam <= defaultJamMasukBatas) ? "Tepat Waktu" : "Terlambat";
          const idLog = "LOG-S-" + new Date().getTime();

          if (index !== -1) {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = statusMasuk;
            setStorage(reportsKey, reports);
            return { success: true, type: "masuk", message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, data: reports[index] };
          }

          const newRow = {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: jam,
            status_masuk: statusMasuk,
            jam_pulang: "-",
            status_pulang: "-",
            ket: "Scan Otomatis"
          };
          reports.push(newRow);
          setStorage(reportsKey, reports);
          return { success: true, type: "masuk", message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, data: newRow };
        } else {
          // Pulang Period for Siswa
          if (index !== -1) {
            reports[index].jam_pulang = jam;
            reports[index].status_pulang = "Tepat Waktu";
            setStorage(reportsKey, reports);
            return { success: true, type: "pulang", message: `Presensi Pulang Berhasil: ${nama}`, data: reports[index] };
          } else {
            const idLog = "LOG-S-" + new Date().getTime();
            const newRow = {
              id_log_siswa: idLog,
              tanggal: tgl,
              id_siswa: idTarget,
              nama_siswa: nama,
              kelas_jurusan: classKey,
              jam_masuk: "-",
              status_masuk: "Lupa Scan Masuk",
              jam_pulang: jam,
              status_pulang: "Tepat Waktu",
              ket: "Lupa Scan Masuk"
            };
            reports.push(newRow);
            setStorage(reportsKey, reports);
            return { success: true, type: "pulang", message: `Presensi Pulang Berhasil: ${nama} (Lupa Scan Masuk)`, data: newRow };
          }
        }
      }

      // ==========================================
      // 2. MODEL GURU (Fleksibel & Jadwal Mengajar)
      // ==========================================
      const flexList = getStorage("jadwal_guru") || [];
      const flexSchedule = flexList.find((j: any) => 
        (String(j.id_guru || "").toLowerCase() === String(idTarget).toLowerCase() || 
         String(j.nama_guru || "").toLowerCase() === String(nama).toLowerCase() ||
         isTeacherScheduleMatch(j)) &&
        ((j.hari || "").trim().toLowerCase() === hariIni.toLowerCase() || hariIni === "Minggu")
      );

      const guruJamMasukBatas = flexSchedule?.jam_masuk_batas || defaultJamMasukBatas;
      const guruJamPulangMulai = flexSchedule?.jam_pulang_mulai || defaultJamPulangMulai;

      // Helper for fuzzy & title-agnostic teacher name matching
      const normalizeName = (str: string) => {
        return String(str || "")
          .toLowerCase()
          .replace(/[,.]/g, " ")
          .replace(/\b(s|m|dr|drs|dra|prof|ir|h|hj)\s*\.?\s*(pd|kom|ag|is|si|se|mm|hum|st|pt|tp|sos|ip|ed|pdi|mat|bio|fis|med)\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      const isTeacherScheduleMatch = (scheduleItem: any) => {
        if (!scheduleItem) return false;
        const sGuruId = String(scheduleItem.id_guru || "").trim().toLowerCase();
        const sGuruName = String(scheduleItem.nama_guru || "").trim();
        const targetIdStr = String(idTarget || "").trim().toLowerCase();
        const targetNipStr = String(user?.nip_nuptk || user?.nip || "").trim().toLowerCase();
        const targetQrStr = String(user?.qr_content || user?.qr_code || "").trim().toLowerCase();
        const targetCleanCode = String(qrContent || "").trim().toLowerCase();

        if (sGuruId) {
          if (sGuruId === targetIdStr || sGuruId === targetNipStr || sGuruId === targetQrStr || sGuruId === targetCleanCode) return true;
          const sWithout = sGuruId.replace(/^(guru|id|nip|g)[_:\-\s]+/i, '');
          const tWithout = targetIdStr.replace(/^(guru|id|nip|g)[_:\-\s]+/i, '');
          if (sWithout && tWithout && sWithout === tWithout) return true;
        }

        if (sGuruName && nama) {
          const n1 = sGuruName.toLowerCase();
          const n2 = String(nama).toLowerCase();
          if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true;

          const norm1 = normalizeName(sGuruName);
          const norm2 = normalizeName(nama);
          if (norm1 && norm2 && (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1))) return true;
        }
        return false;
      };

      // Load teaching schedules and jam slots
      const allSchedules = getStorage("jadwal_pelajaran") || [];
      const jamSlots = getStorage("jam_pelajaran") || [
        { jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45" },
        { jam_ke: 2, jam_mulai: "07:45", jam_selesai: "08:30" },
        { jam_ke: 3, jam_mulai: "08:30", jam_selesai: "09:15" },
        { jam_ke: 4, jam_mulai: "09:45", jam_selesai: "10:30" },
        { jam_ke: 5, jam_mulai: "10:30", jam_selesai: "11:15" },
        { jam_ke: 6, jam_mulai: "11:15", jam_selesai: "12:00" },
        { jam_ke: 7, jam_mulai: "13:00", jam_selesai: "13:45" },
        { jam_ke: 8, jam_mulai: "13:45", jam_selesai: "14:30" }
      ];

      // Filter teaching schedules for this teacher today
      let teacherDaySchedules = allSchedules.filter((s: any) => 
        isTeacherScheduleMatch(s) && ((s.hari || "").trim().toLowerCase() === hariIni.toLowerCase() || hariIni === "Minggu" || !s.hari)
      ).map((s: any) => {
        const slot = jamSlots.find((j: any) => Number(j.jam_ke) === Number(s.jam_ke));
        const slotMulai = s.jam_mulai || slot?.jam_mulai || "07:00";
        const slotSelesai = s.jam_selesai || slot?.jam_selesai || "07:45";
        return { ...s, slotMulai, slotSelesai };
      }).sort((a: any, b: any) => Number(a.jam_ke || 0) - Number(b.jam_ke || 0));

      // Fallback: if no schedule on Sunday/testing day, check if teacher has any schedule in system
      if (teacherDaySchedules.length === 0 && (hariIni === "Minggu" || allSchedules.length > 0)) {
        const anySched = allSchedules.filter((s: any) => isTeacherScheduleMatch(s));
        if (anySched.length > 0) {
          teacherDaySchedules = anySched.map((s: any) => {
            const slot = jamSlots.find((j: any) => Number(j.jam_ke) === Number(s.jam_ke));
            const slotMulai = s.jam_mulai || slot?.jam_mulai || "07:00";
            const slotSelesai = s.jam_selesai || slot?.jam_selesai || "07:45";
            return { ...s, slotMulai, slotSelesai };
          }).sort((a: any, b: any) => Number(a.jam_ke || 0) - Number(b.jam_ke || 0));
        }
      }

      const absLogs = getStorage("absensi_mengajar_guru") || [];
      const makeKey = (jKe: any, k: any, m: any) => `${Number(jKe)}_${String(k || "").trim().toLowerCase()}_${String(m || "").trim().toLowerCase()}`;

      const alreadyAttendedTeachingKeys = new Set(
        absLogs.filter((a: any) => a.tanggal === tgl && isTeacherScheduleMatch(a))
               .map((a: any) => makeKey(a.jam_ke, a.kelas, a.mapel))
      );

      const [hN, mN] = jam.split(":").map(Number);
      const nowMin = hN * 60 + mN;
      const [hP, mP] = guruJamPulangMulai.split(":").map(Number);
      const pulangMulaiMin = (!isNaN(hP) && !isNaN(mP)) ? (hP * 60 + mP) : (15 * 60 + 30);

      const toleransiGuruVal = Number(cfg.toleransi_guru ?? cfg.toleransi_mengajar_guru ?? 15);

      // Find the end time of teacher's last class today
      let lastClassEndMin = 0;
      if (teacherDaySchedules.length > 0) {
        const lastSched = teacherDaySchedules[teacherDaySchedules.length - 1];
        if (lastSched.slotSelesai && lastSched.slotSelesai !== "-") {
          const [hE, mE] = lastSched.slotSelesai.split(":").map(Number);
          if (!isNaN(hE) && !isNaN(mE)) lastClassEndMin = hE * 60 + mE;
        }
      }

      // Check if all teaching classes for today have been attended
      const totalTeachingClasses = teacherDaySchedules.length;
      const completedTeachingClasses = teacherDaySchedules.filter((s: any) => 
        alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
      ).length;
      const allTeachingClassesDone = totalTeachingClasses > 0 && completedTeachingClasses >= totalTeachingClasses;

      // Allow clocking out if:
      // 1. Current time >= guruJamPulangMulai
      // 2. OR all classes completed AND current time >= lastClassEndMin AND past 12:00
      const isTeacherPulangTime = (nowMin >= pulangMulaiMin) || 
                                  (allTeachingClassesDone && lastClassEndMin > 0 && nowMin >= lastClassEndMin && nowMin >= (12 * 60));

      // -------------------------------------------------------------
      // CASE A: TEACHER CLOCK OUT (PULANG)
      // -------------------------------------------------------------
      if (isTeacherPulangTime && (mode === "Pulang" || allTeachingClassesDone)) {
        if (index !== -1) {
          reports[index].jam_pulang = jam;
          reports[index].status_pulang = "Tepat Waktu";
          setStorage(reportsKey, reports);
          return { 
            success: true, 
            type: "pulang", 
            message: `Presensi Pulang Berhasil: ${nama} (${allTeachingClassesDone ? "Seluruh Jam Mengajar Selesai" : "Tepat Waktu"})`, 
            data: reports[index] 
          };
        } else {
          const idLog = "LOG-G-" + new Date().getTime();
          const newRow = {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: "-",
            status_masuk: "Lupa Scan Masuk",
            jam_pulang: jam,
            status_pulang: "Tepat Waktu",
            ket: "Lupa Scan Masuk"
          };
          reports.push(newRow);
          setStorage(reportsKey, reports);
          return { success: true, type: "pulang", message: `Presensi Pulang Berhasil: ${nama} (Lupa Scan Masuk)`, data: newRow };
        }
      }

      // -------------------------------------------------------------
      // CASE B: TEACHER HAS TEACHING SCHEDULES TODAY
      // -------------------------------------------------------------
      if (teacherDaySchedules.length > 0) {
        // 1. Check if current time matches an active teaching slot window (from 15 min before start until end + 25 min)
        let activeSlotMatch: any = null;
        let multiJamBlock: any[] = [];

        for (const sched of teacherDaySchedules) {
          if (sched.slotMulai && sched.slotMulai !== "-" && sched.slotSelesai && sched.slotSelesai !== "-") {
            const [hM, mM] = sched.slotMulai.split(":").map(Number);
            const [hS, mS] = sched.slotSelesai.split(":").map(Number);
            if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS)) {
              const startMin = hM * 60 + mM;
              const endMin = hS * 60 + mS;
              // Active window: from 15 min before lesson begins up to 25 min after lesson ends
              if (nowMin >= startMin - 15 && nowMin <= endMin + 25) {
                activeSlotMatch = sched;
                break;
              }
            }
          }
        }

        // 2. If not strictly within an active window, find the next unrecorded class schedule today
        if (!activeSlotMatch) {
          const firstUnrecorded = teacherDaySchedules.find((s: any) => 
            !alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
          );
          if (firstUnrecorded) {
            activeSlotMatch = firstUnrecorded;
          }
        }

        // 3. If an active or pending class is found that is NOT yet fully logged:
        if (activeSlotMatch && !alreadyAttendedTeachingKeys.has(makeKey(activeSlotMatch.jam_ke, activeSlotMatch.kelas, activeSlotMatch.mapel))) {
          // Find all consecutive hours for the same class and mapel today (1x Scan for multi-jam block)
          multiJamBlock = teacherDaySchedules.filter((s: any) => 
            String(s.kelas).trim().toLowerCase() === String(activeSlotMatch.kelas).trim().toLowerCase() &&
            String(s.mapel).trim().toLowerCase() === String(activeSlotMatch.mapel).trim().toLowerCase()
          );

          if (multiJamBlock.length === 0) multiJamBlock = [activeSlotMatch];

          // Determine attendance status based on schedule start time + tolerance
          const firstSlot = multiJamBlock[0];
          const [hM, mM] = (firstSlot.slotMulai || "07:00").split(":").map(Number);
          const firstStartMin = (!isNaN(hM) && !isNaN(mM)) ? (hM * 60 + mM) : (7 * 60);
          
          const statusMengajar = (nowMin <= firstStartMin + toleransiGuruVal) ? "Hadir Tepat Waktu" : "Terlambat Masuk Kelas";

          // Save ALL hours in the multi-jam block into absensi_mengajar_guru
          for (const schedItem of multiJamBlock) {
            const existingIdx = absLogs.findIndex((a: any) => 
              a.tanggal === tgl && 
              isTeacherScheduleMatch(a) &&
              Number(a.jam_ke) === Number(schedItem.jam_ke) &&
              String(a.kelas).trim().toLowerCase() === String(schedItem.kelas).trim().toLowerCase()
            );

            const logItem = {
              id_log_mengajar: existingIdx !== -1 ? absLogs[existingIdx].id_log_mengajar : "LOG-MENG-" + Date.now() + "-" + schedItem.jam_ke,
              tanggal: tgl,
              waktu_absen: jam,
              hari: hariIni !== "Minggu" ? hariIni : (schedItem.hari || "Senin"),
              id_guru: idTarget,
              nama_guru: nama,
              kelas: schedItem.kelas || "-",
              mapel: schedItem.mapel || "-",
              jam_ke: Number(schedItem.jam_ke || 1),
              jam_mulai_jadwal: schedItem.slotMulai || "07:00",
              jam_selesai_jadwal: schedItem.slotSelesai || "07:45",
              status: statusMengajar,
              catatan_materi: "Presensi Otomatis Barcode/QR"
            };

            if (existingIdx !== -1) absLogs[existingIdx] = logItem;
            else absLogs.push(logItem);
          }

          setStorage("absensi_mengajar_guru", absLogs);

          // ALSO ensure daily school attendance (laporan_guru) is recorded as Masuk
          const statusMasuk = (jam <= guruJamMasukBatas) ? "Tepat Waktu" : "Terlambat";
          if (index === -1) {
            const idLog = "LOG-G-" + new Date().getTime();
            reports.push({
              id_log_guru: idLog,
              tanggal: tgl,
              id_guru: idTarget,
              nama_guru: nama,
              jam_masuk: jam,
              status_masuk: statusMasuk,
              jam_pulang: "-",
              status_pulang: "-",
              ket: `Hadir Mengajar (${activeSlotMatch.mapel})`
            });
            setStorage(reportsKey, reports);
          } else if (!reports[index].jam_masuk || reports[index].jam_masuk === "-") {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = statusMasuk;
            reports[index].ket = `Hadir Mengajar (${activeSlotMatch.mapel})`;
            setStorage(reportsKey, reports);
          }

          const jamNumbers = multiJamBlock.map((s: any) => Number(s.jam_ke)).sort((a: number, b: number) => a - b);
          const jamLabel = jamNumbers.length > 1
            ? `Jam Ke-${jamNumbers[0]} s/d ${jamNumbers[jamNumbers.length - 1]}`
            : `Jam Ke-${jamNumbers[0] || activeSlotMatch.jam_ke}`;

          return {
            success: true,
            type: "mengajar",
            message: `Presensi Mengajar Berhasil: ${nama} (${activeSlotMatch.mapel} - ${activeSlotMatch.kelas}, ${jamLabel})`,
            data: {
              ...activeSlotMatch,
              nama_guru: nama,
              id_guru: idTarget,
              status: statusMengajar,
              jam_ke_label: jamLabel
            }
          };
        }

        // 4. If all classes for today are already recorded, or morning arrival before first class
        if (index === -1 || !reports[index].jam_masuk || reports[index].jam_masuk === "-") {
          // Record morning daily check-in
          const statusMasuk = (jam <= guruJamMasukBatas) ? "Tepat Waktu" : "Terlambat";
          const idLog = "LOG-G-" + new Date().getTime();
          const firstClass = teacherDaySchedules[0];

          const newRow = {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: jam,
            status_masuk: statusMasuk,
            jam_pulang: "-",
            status_pulang: "-",
            ket: `Jadwal: ${firstClass.mapel} (${firstClass.kelas})`
          };
          if (index !== -1) {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = statusMasuk;
            reports[index].ket = newRow.ket;
          } else {
            reports.push(newRow);
          }
          setStorage(reportsKey, reports);

          return { 
            success: true, 
            type: "masuk", 
            message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk}). Jadwal pertama: ${firstClass.mapel} (${firstClass.kelas}) Jam ke-${firstClass.jam_ke} (${firstClass.slotMulai} WIB)`, 
            data: newRow 
          };
        }

        // 5. Already recorded daily masuk & already recorded active class
        if (allTeachingClassesDone) {
          return {
            success: true,
            type: "info",
            message: `${nama} sudah menyelesaikan seluruh jadwal mengajar hari ini (${totalTeachingClasses} jam pelajaran). Jam pulang dibuka pk ${guruJamPulangMulai} WIB.`,
            data: reports[index]
          };
        }

        const nextPending = teacherDaySchedules.find((s: any) => 
          !alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
        );

        return {
          success: true,
          type: "info",
          message: `${nama} sudah presensi masuk. Jadwal mengajar berikutnya: ${nextPending?.mapel || "Pelajaran"} (${nextPending?.kelas || "-"}) Jam Ke-${nextPending?.jam_ke || "-"} (${nextPending?.slotMulai || ""} WIB).`,
          data: reports[index]
        };
      }

      // -------------------------------------------------------------
      // CASE C: TEACHER WITH NO TEACHING SCHEDULE TODAY (HANYA HARIAN / FLEKSIBEL)
      // -------------------------------------------------------------
      if (index === -1 || !reports[index].jam_masuk || reports[index].jam_masuk === "-") {
        const statusMasuk = (jam <= guruJamMasukBatas) ? "Tepat Waktu" : "Terlambat";
        const idLog = "LOG-G-" + new Date().getTime();

        if (index !== -1) {
          reports[index].jam_masuk = jam;
          reports[index].status_masuk = statusMasuk;
          setStorage(reportsKey, reports);
          return { success: true, type: "masuk", message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, data: reports[index] };
        }

        const newRow = {
          id_log_guru: idLog,
          tanggal: tgl,
          id_guru: idTarget,
          nama_guru: nama,
          jam_masuk: jam,
          status_masuk: statusMasuk,
          jam_pulang: "-",
          status_pulang: "-",
          ket: flexSchedule ? "Guru Fleksibel" : "Harian"
        };
        reports.push(newRow);
        setStorage(reportsKey, reports);
        return { success: true, type: "masuk", message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, data: newRow };
      }

      // Teacher already clocked in, no teaching schedule, not yet clock-out time
      return {
        success: true,
        type: "info",
        message: `${nama} sudah presensi masuk (${reports[index].jam_masuk} WIB). Tidak ada jadwal mengajar hari ini. Jam pulang dibuka pk ${guruJamPulangMulai} WIB.`,
        data: reports[index]
      };
    }

    case "catatAbsensiSiswa": {
      const [idTarget, mode, status, keterangan, tanggal, jamCustom, namaSiswa, kelasJurusan] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = jamCustom || new Date().toTimeString().slice(0, 5);
      const reports = getStorage("laporan_siswa") || [];
      const master = getStorage("data_siswa") || [];
      
      const sObj = master.find((s: any) => 
        String(s.id_siswa || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(s.nisn || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(s.nama_siswa || "").toLowerCase() === String(namaSiswa || idTarget || "").toLowerCase()
      );
      
      const nama = namaSiswa || sObj?.nama_siswa || sObj?.nama || idTarget;
      const kelas = kelasJurusan || (sObj ? `${sObj.kelas || ""} ${sObj.jurusan || ""}`.trim() : "Siswa");
      const targetId = sObj?.id_siswa || idTarget;

      const idx = reports.findIndex((r: any) => r.tanggal === tgl && (r.id_siswa === targetId || r.id_target === targetId || String(r.nama_siswa || "").toLowerCase() === String(nama).toLowerCase()));
      const statusText = status || (mode === "Masuk" ? "Tepat Waktu" : "Sudah Pulang");

      if (idx !== -1) {
        if (mode === "Masuk") {
          reports[idx].jam_masuk = jam;
          reports[idx].status_masuk = statusText;
        } else {
          reports[idx].jam_pulang = jam;
          reports[idx].status_pulang = statusText;
        }
        if (keterangan) reports[idx].ket = keterangan;
        setStorage("laporan_siswa", reports);
        return { success: true, message: `Presensi Siswa Berhasil: ${nama}`, data: reports[idx] };
      } else {
        const idLog = "LOG-S-" + Date.now();
        const newRow = {
          id_log_siswa: idLog,
          tanggal: tgl,
          id_siswa: targetId,
          nama_siswa: nama,
          kelas_jurusan: kelas,
          jam_masuk: mode === "Masuk" ? jam : "-",
          status_masuk: mode === "Masuk" ? statusText : "Belum Absen",
          jam_pulang: mode === "Pulang" ? jam : "-",
          status_pulang: mode === "Pulang" ? statusText : "-",
          ket: keterangan || "Scan Auto Board"
        };
        reports.push(newRow);
        setStorage("laporan_siswa", reports);
        return { success: true, message: `Presensi Siswa Berhasil: ${nama}`, data: newRow };
      }
    }

    case "catatAbsensiGuru": {
      const [idTarget, mode, status, keterangan, tanggal, jamCustom, namaGuru, nip] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = jamCustom || new Date().toTimeString().slice(0, 5);
      const reports = getStorage("laporan_guru") || [];
      const master = getStorage("data_guru") || [];
      
      const gObj = master.find((g: any) => 
        String(g.id_guru || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(g.nip_nuptk || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(g.nama_guru || "").toLowerCase() === String(namaGuru || idTarget || "").toLowerCase()
      );
      
      const nama = namaGuru || gObj?.nama_guru || gObj?.nama || idTarget;
      const targetId = gObj?.id_guru || idTarget;

      const idx = reports.findIndex((r: any) => r.tanggal === tgl && (r.id_guru === targetId || r.id_target === targetId || String(r.nama_guru || "").toLowerCase() === String(nama).toLowerCase()));
      const statusText = status || (mode === "Masuk" ? "Tepat Waktu" : "Sudah Pulang");

      if (idx !== -1) {
        if (mode === "Masuk") {
          reports[idx].jam_masuk = jam;
          reports[idx].status_masuk = statusText;
        } else {
          reports[idx].jam_pulang = jam;
          reports[idx].status_pulang = statusText;
        }
        if (keterangan) reports[idx].ket = keterangan;
        setStorage("laporan_guru", reports);
        return { success: true, message: `Presensi Guru Berhasil: ${nama}`, data: reports[idx] };
      } else {
        const idLog = "LOG-G-" + Date.now();
        const newRow = {
          id_log_guru: idLog,
          tanggal: tgl,
          id_guru: targetId,
          nama_guru: nama,
          jam_masuk: mode === "Masuk" ? jam : "-",
          status_masuk: mode === "Masuk" ? statusText : "Belum Absen",
          jam_pulang: mode === "Pulang" ? jam : "-",
          status_pulang: mode === "Pulang" ? statusText : "-",
          ket: keterangan || "Scan Auto Board"
        };
        reports.push(newRow);
        setStorage("laporan_guru", reports);
        return { success: true, message: `Presensi Guru Berhasil: ${nama}`, data: newRow };
      }
    }

    case "simpanAbsenManual": {
      const [idTarget, kategori, mode, tanggal, status, keterangan, jamCustom] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jamDefault = mode === "Masuk" ? "07:00" : "15:30";
      const isAbsentStatus = status === "Sakit" || status === "Izin" || status === "Alfa" || status === "-";
      const jam = isAbsentStatus ? "-" : (jamCustom && jamCustom !== "-" ? jamCustom : jamDefault);
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      
      if (index !== -1) {
        reports[index].tanggal = tgl;
        if (isAbsentStatus) {
          reports[index].status_masuk = status;
          reports[index].status_pulang = status;
          reports[index].jam_masuk = "-";
          reports[index].jam_pulang = "-";
        } else {
          if (mode === "Masuk") {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = status;
          } else {
            reports[index].jam_pulang = jam;
            reports[index].status_pulang = status;
          }
        }
        reports[index].ket = keterangan;
      } else {
        const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        const mList = getStorage(masterKey);
        const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
        if (user) {
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
          const nama = user[nameKey];
          const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
          const idLog = "LOG-" + new Date().getTime();
          
          const statusMasuk = isAbsentStatus ? status : (mode === "Masuk" ? status : "-");
          const statusPulang = isAbsentStatus ? status : (mode === "Pulang" ? status : "-");
          const jamMasuk = isAbsentStatus ? "-" : (mode === "Masuk" ? jam : "-");
          const jamPulang = isAbsentStatus ? "-" : (mode === "Pulang" ? jam : "-");

          const newRow = kategori === "Siswa" ? {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: jamMasuk,
            status_masuk: statusMasuk,
            jam_pulang: jamPulang,
            status_pulang: statusPulang,
            ket: keterangan
          } : {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: jamMasuk,
            status_masuk: statusMasuk,
            jam_pulang: jamPulang,
            status_pulang: statusPulang,
            ket: keterangan
          };
          reports.push(newRow);
        }
      }
      
      setStorage(reportsKey, reports);
      return { success: true, message: `Koreksi manual tanggal ${tgl} disimpan!` };
    }

    case "simpanKoreksiManual":
    case "editKehadiran":
    case "editKehadiranFull": {
      const [idTarget, kategori, tanggal, arg3, arg4, arg5, arg6, arg7] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";

      const dataObj = typeof arg3 === "object" && arg3 !== null ? arg3 : {
        jam_masuk: arg3 || "-",
        status_masuk: arg4 || "-",
        jam_pulang: arg5 || "-",
        status_pulang: arg6 || "-",
        ket: arg7 || "-"
      };
      
      const isAllEmpty = (dataObj.jam_masuk === "-" || !dataObj.jam_masuk) &&
                         (dataObj.status_masuk === "-" || !dataObj.status_masuk) &&
                         (dataObj.jam_pulang === "-" || !dataObj.jam_pulang) &&
                         (dataObj.status_pulang === "-" || !dataObj.status_pulang) &&
                         (dataObj.ket === "-" || !dataObj.ket || dataObj.ket === "");

      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      
      if (index !== -1) {
        if (isAllEmpty) {
          reports.splice(index, 1);
        } else {
          reports[index].tanggal = tgl;
          if (dataObj.jam_masuk !== undefined) reports[index].jam_masuk = dataObj.jam_masuk;
          if (dataObj.status_masuk !== undefined) reports[index].status_masuk = dataObj.status_masuk;
          if (dataObj.jam_pulang !== undefined) reports[index].jam_pulang = dataObj.jam_pulang;
          if (dataObj.status_pulang !== undefined) reports[index].status_pulang = dataObj.status_pulang;
          if (dataObj.ket !== undefined) reports[index].ket = dataObj.ket;
        }
      } else if (!isAllEmpty) {
        const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        const mList = getStorage(masterKey);
        const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
        if (user) {
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
          const nama = user[nameKey];
          const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
          const idLog = "LOG-" + new Date().getTime();
          
          const newRow = kategori === "Siswa" ? {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: dataObj.jam_masuk || "-",
            status_masuk: dataObj.status_masuk || "-",
            jam_pulang: dataObj.jam_pulang || "-",
            status_pulang: dataObj.status_pulang || "-",
            ket: dataObj.ket || "-"
          } : {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: dataObj.jam_masuk || "-",
            status_masuk: dataObj.status_masuk || "-",
            jam_pulang: dataObj.jam_pulang || "-",
            status_pulang: dataObj.status_pulang || "-",
            ket: dataObj.ket || "-"
          };
          reports.push(newRow);
        }
      }
      
      setStorage(reportsKey, reports);
      return { success: true, message: `Kehadiran ${kategori} tanggal ${tgl} berhasil diperbarui!` };
    }

    case "editKehadiranBulk": {
      const [rows, kategori, tanggal] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      let reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const mList = getStorage(masterKey);

      rows.forEach((item: any) => {
        const idTarget = item.id_target;
        if (!idTarget) return;

        const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
        
        const hasData = (item.jam_masuk && item.jam_masuk !== "-") || 
                        (item.status_masuk && item.status_masuk !== "-") ||
                        (item.jam_pulang && item.jam_pulang !== "-") ||
                        (item.status_pulang && item.status_pulang !== "-") ||
                        (item.ket && item.ket !== "-");

        if (index !== -1) {
          if (hasData) {
            reports[index].jam_masuk = item.jam_masuk || "-";
            reports[index].status_masuk = item.status_masuk || "-";
            reports[index].jam_pulang = item.jam_pulang || "-";
            reports[index].status_pulang = item.status_pulang || "-";
            reports[index].ket = item.ket || "-";
          } else {
            // Remove from reports if all fields set to empty (-)
            reports = reports.filter((_: any, idx: number) => idx !== index);
          }
        } else {
          if (hasData) {
            const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
            if (user) {
              const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
              const nama = user[nameKey];
              const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
              const idLog = "LOG-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);

              const newRow = kategori === "Siswa" ? {
                id_log_siswa: idLog,
                tanggal: tgl,
                id_siswa: idTarget,
                nama_siswa: nama,
                kelas_jurusan: classKey,
                jam_masuk: item.jam_masuk || "-",
                status_masuk: item.status_masuk || "-",
                jam_pulang: item.jam_pulang || "-",
                status_pulang: item.status_pulang || "-",
                ket: item.ket || "-"
              } : {
                id_log_guru: idLog,
                tanggal: tgl,
                id_guru: idTarget,
                nama_guru: nama,
                jam_masuk: item.jam_masuk || "-",
                status_masuk: item.status_masuk || "-",
                jam_pulang: item.jam_pulang || "-",
                status_pulang: item.status_pulang || "-",
                ket: item.ket || "-"
              };
              reports.push(newRow);
            }
          }
        }
      });

      setStorage(reportsKey, reports);
      return { success: true, message: `Berhasil memperbarui ${rows.length} data kehadiran tanggal ${tgl}!` };
    }

    case "hapusKehadiran":
    case "hapusLogKehadiran":
    case "hapusAbsensi":
    case "hapusAbsen":
    case "deleteKehadiran": {
      const [idTarget, kategori, tanggal] = args;
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      let reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      
      reports = reports.filter((r: any) => !(r.tanggal === tanggal && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget)));
      setStorage(reportsKey, reports);
      return { success: true, message: `Data presensi ${kategori} pada tanggal ${tanggal} berhasil dihapus.` };
    }

    case "simpanBulkAbsenManual": {
      const [ids, kategori, mode, tanggal, status, keterangan] = args;
      ids.forEach((idTarget: string) => {
        callMock("simpanAbsenManual", [idTarget, kategori, mode, tanggal, status, keterangan]);
      });
      return { success: true, message: `Berhasil update ${ids.length} data absensi.` };
    }

    case "getLiveAbsenHariIni": {
      const [kategori, tanggal, filterKelas] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let master = getStorage(masterKey);
      if (!Array.isArray(master) || master.length === 0) {
        initMockDb();
        master = getStorage(masterKey);
      }
      
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      
      // O(1) Lookup Map for reports
      const reportMap = new Map<string, any>();
      if (Array.isArray(reports)) {
        for (const r of reports) {
          if (r.tanggal === tgl) {
            const rId = r[idKey] || r.id_siswa || r.id_guru || r.id_target;
            if (rId) reportMap.set(String(rId), r);
          }
        }
      }
      
      const result = master.map((m: any) => {
        const idTarget = m[idKey] || m.id || m.nisn || m.nip_nuptk || "";
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

        const rep = reportMap.get(String(idTarget)) || {};
        
        return {
          id_target: idTarget,
          nama_target: namaTarget,
          kelas_jurusan: kelasStr,
          tanggal: tgl,
          jam_masuk: rep.jam_masuk || "-",
          status_masuk: rep.status_masuk || "-",
          jam_pulang: rep.jam_pulang || "-",
          status_pulang: rep.status_pulang || "-",
          no_hp_ortu: m.no_hp_ortu || m.no_hp || "-",
          kategori: kategori,
          ket: rep.ket || "-"
        };
      });
      
      const filtered = result.filter((item: any) => {
        if (kategori === "Siswa" && filterKelas && filterKelas !== "Semua") {
          const kTarget = String(item.kelas_jurusan || "").toLowerCase().replace(/\s+/g, "");
          const kFilter = String(filterKelas).toLowerCase().replace(/\s+/g, "");
          return kTarget.includes(kFilter) || kFilter.includes(kTarget);
        }
        return true;
      });
      
      return { success: true, data: filtered };
    }

    case "getPresensiSiswa":
    case "getLaporanSiswa": {
      return { success: true, data: getStorage("laporan_siswa") };
    }

    case "getPresensiGuru":
    case "getLaporanGuru": {
      return { success: true, data: getStorage("laporan_guru") };
    }

    case "getLaporanPresensi":
    case "getLaporanFilter": {
      const [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta] = args;
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey) || [];
      
      const filtered = reports.filter((row: any) => {
        const rowTgl = formatToIsoDate(row.tanggal);
        if (!rowTgl) return false;

        // Date filter
        if (jenisFilter === "rentang" && tanggalMulai && tanggalSelesai) {
          if (rowTgl < tanggalMulai || rowTgl > tanggalSelesai) return false;
        } else if (jenisFilter === "bulan" && bulanMinta) {
          if (!rowTgl.startsWith(bulanMinta)) return false;
        }
        
        // Class filter
        if (kategori === "Siswa" && kelas && kelas !== "Semua") {
          const kJur = String(row.kelas_jurusan || row.kelas || "").replace(/[\s-]+/g, "").toLowerCase();
          const cleanKelas = String(kelas).replace(/[\s-]+/g, "").toLowerCase();
          if (!kJur.includes(cleanKelas) && !cleanKelas.includes(kJur)) return false;
        }
        
        return true;
      });
      
      return { success: true, data: filtered };
    }

    case "hitungRekapPersentase": {
      const [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta] = args;
      let masterData = getStorage(kategori === "Siswa" ? "data_siswa" : "data_guru") || [];
      
      if (kategori === "Siswa" && kelas && kelas !== "Semua") {
        const cleanKelas = String(kelas).replace(/[\s-]+/g, "").toLowerCase();
        masterData = masterData.filter((m: any) => {
          const kJur = `${m.kelas || ""} ${m.jurusan || ""}`.replace(/[\s-]+/g, "").toLowerCase();
          return kJur.includes(cleanKelas) || cleanKelas.includes(kJur);
        });
      }
      
      const rptRes = callMock("getLaporanFilter", [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta]);
      const rptData = extractArrayData(rptRes);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      
      const rekap = masterData.map((m: any) => {
        const idTarget = String(m[idKey] || m.id || "").trim();
        const nama = String(m[nameKey] || m.nama || "").trim();
        
        const userRpts = rptData.filter((r: any) => {
          const rId = String(r[idKey] || r.id_target || r.id_siswa || r.id_guru || "").trim();
          const rNama = String(r.nama_siswa || r.nama_guru || r.nama || "").trim();
          if (idTarget && rId && rId === idTarget) return true;
          if (nama && rNama && rNama.toLowerCase() === nama.toLowerCase()) return true;
          return false;
        });
        
        let hadir = 0;
        let sakit = 0;
        let izin = 0;
        let alfa = 0;
        const jamMasuks: string[] = [];
        const jamPulangs: string[] = [];
        
        userRpts.forEach((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          if (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir")) {
            hadir++;
          } else if (sm.includes("sakit")) {
            sakit++;
          } else if (sm.includes("izin")) {
            izin++;
          } else if (sm.includes("alfa") || sm.includes("alpha")) {
            alfa++;
          } else if (r.status_masuk && r.status_masuk !== "-") {
            hadir++;
          }
          
          if (r.jam_masuk && r.jam_masuk !== "-") jamMasuks.push(r.jam_masuk);
          if (r.jam_pulang && r.jam_pulang !== "-") jamPulangs.push(r.jam_pulang);
        });
        
        const totalDays = hadir + sakit + izin + alfa;
        const persentase = totalDays === 0 ? "0%" : ((hadir / totalDays) * 100).toFixed(1) + "%";
        
        return {
          id: idTarget,
          nama: nama,
          hadir,
          sakit,
          izin,
          alfa,
          persentase,
          jam_masuk: jamMasuks.length > 0 ? jamMasuks.join(", ") : "-",
          jam_pulang: jamPulangs.length > 0 ? jamPulangs.join(", ") : "-"
        };
      });
      
      return { success: true, data: rekap };
    }

    case "getDashboardMetrics": {
      const siswaList = getStorage("data_siswa");
      const guruList = getStorage("data_guru");
      const siswaLaporan = getStorage("laporan_siswa");
      const guruLaporan = getStorage("laporan_guru");
      
      const tgl = new Date().toISOString().split("T")[0];
      
      const countStat = (list: any[], reports: any[], idKey: string) => {
        let hadirMasuk = 0;
        let hadirPulang = 0;
        let totalTepat = 0;
        let rawAlfa = 0;
        
        const todayRpts = reports.filter((r: any) => r.tanggal === tgl);
        
        todayRpts.forEach((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          const sp = String(r.status_pulang || "").toLowerCase();
          
          if (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir")) {
            hadirMasuk++;
            if (sm.includes("tepat")) {
              totalTepat++;
            }
          } else if (sm.includes("alfa") || sm.includes("alpha")) {
            rawAlfa++;
          }
          
          if (sp.includes("tepat") || sp.includes("terlambat") || sp.includes("lupa") || sp.includes("hadir") || sp.includes("pulang")) {
            hadirPulang++;
          }
        });
        
        const persentaseTepatInt = hadirMasuk > 0 ? Math.round((totalTepat / hadirMasuk) * 100) : 0;
        const persentaseTepat = persentaseTepatInt + "%";
        
        const pAlfa = list.length > 0 ? Math.round((rawAlfa / list.length) * 100) : 0;
        const pPulang = list.length > 0 ? Math.round((hadirPulang / list.length) * 100) : 0;
        
        return { hadirMasuk, hadirPulang, persentaseTepat, persentaseTepatInt, pAlfa, pPulang };
      };
      
      const statsSiswa = countStat(siswaList, siswaLaporan, "id_siswa");
      const statsGuru = countStat(guruList, guruLaporan, "id_guru");
      
      const chartLabels: string[] = [];
      const chartData: number[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
        chartLabels.push(dayLabel);
        
        const count = siswaLaporan.filter((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          return r.tanggal === dateStr && (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir"));
        }).length;
        chartData.push(count);
      }
      
      return {
        success: true,
        data: {
          totalSiswa: siswaList.length,
          siswaMasuk: statsSiswa.hadirMasuk,
          siswaPulang: statsSiswa.hadirPulang,
          siswaTepat: statsSiswa.persentaseTepat,
          siswaTepatInt: statsSiswa.persentaseTepatInt,
          siswaPulangPersenInt: statsSiswa.pPulang,
          siswaAlfaInt: statsSiswa.pAlfa,
          
          totalGuru: guruList.length,
          guruMasuk: statsGuru.hadirMasuk,
          guruPulang: statsGuru.hadirPulang,
          guruTepat: statsGuru.persentaseTepat,
          guruTepatInt: statsGuru.persentaseTepatInt,
          guruPulangPersenInt: statsGuru.pPulang,
          guruAlfaInt: statsGuru.pAlfa,
          
          chartLabels,
          chartData
        }
      };
    }

    case "getUsersSemua": {
      return { success: true, data: getStorage("users") };
    }

    case "tambahUserData": {
      const [userObj] = args;
      const users = getStorage("users");
      if (users.some((u: any) => u.username.toLowerCase() === userObj.username.toLowerCase())) {
        return { success: false, message: "Username sudah terdaftar!" };
      }
      users.push({
        username: userObj.username,
        password: userObj.password || "123456",
        role: userObj.role || "TU",
        target_id: userObj.target_id || "-"
      });
      setStorage("users", users);
      return { success: true, message: "Berhasil menambahkan akun user baru (SIMULASI)." };
    }

    case "editUserData": {
      const [oldUsername, userObj] = args;
      const users = getStorage("users");
      const idx = users.findIndex((u: any) => u.username.toLowerCase() === oldUsername.toLowerCase());
      if (idx !== -1) {
        users[idx] = {
          username: userObj.username,
          password: userObj.password,
          role: userObj.role,
          target_id: userObj.target_id || "-"
        };
        setStorage("users", users);
        return { success: true, message: "Berhasil memperbarui data user (SIMULASI)." };
      }
      return { success: false, message: "User tidak ditemukan." };
    }

    case "hapusUserData": {
      const [username] = args;
      let users = getStorage("users");
      if (username.toLowerCase() === "admin") {
        return { success: false, message: "Akun admin utama tidak boleh dihapus!" };
      }
      users = users.filter((u: any) => u.username.toLowerCase() !== username.toLowerCase());
      setStorage("users", users);
      return { success: true, message: "User berhasil dihapus secara permanen (SIMULASI)." };
    }

    case "getJadwalGuruSemua": {
      if (!localStorage.getItem("MOCK_jadwal_guru")) {
        localStorage.setItem("MOCK_jadwal_guru", JSON.stringify([]));
      }
      return { success: true, data: getStorage("jadwal_guru") };
    }

    case "tambahJadwalGuru": {
      const [jadwalObj] = args;
      if (!localStorage.getItem("MOCK_jadwal_guru")) {
        localStorage.setItem("MOCK_jadwal_guru", JSON.stringify([]));
      }
      const list = getStorage("jadwal_guru");
      if (list.some((j: any) => j.id_guru === jadwalObj.id_guru && j.hari === jadwalObj.hari)) {
        return { success: false, message: `Jadwal untuk guru tersebut di hari ${jadwalObj.hari} sudah ada!` };
      }
      const idJadwal = "J-" + Math.floor(Math.random() * 10000);
      list.push({
        id_jadwal: idJadwal,
        id_guru: jadwalObj.id_guru,
        nama_guru: jadwalObj.nama_guru,
        hari: jadwalObj.hari,
        jam_masuk_mulai: jadwalObj.jam_masuk_mulai,
        jam_masuk_batas: jadwalObj.jam_masuk_batas,
        jam_pulang_mulai: jadwalObj.jam_pulang_mulai
      });
      setStorage("jadwal_guru", list);
      return { success: true, message: "Jadwal guru berhasil disimpan (SIMULASI)." };
    }

    case "editJadwalGuru": {
      const [idJadwal, jadwalObj] = args;
      const list = getStorage("jadwal_guru");
      const idx = list.findIndex((j: any) => j.id_jadwal === idJadwal);
      if (idx !== -1) {
        list[idx] = {
          id_jadwal: idJadwal,
          id_guru: jadwalObj.id_guru,
          nama_guru: jadwalObj.nama_guru,
          hari: jadwalObj.hari,
          jam_masuk_mulai: jadwalObj.jam_masuk_mulai,
          jam_masuk_batas: jadwalObj.jam_masuk_batas,
          jam_pulang_mulai: jadwalObj.jam_pulang_mulai
        };
        setStorage("jadwal_guru", list);
        return { success: true, message: "Jadwal guru berhasil diperbarui (SIMULASI)." };
      }
      return { success: false, message: "Jadwal tidak ditemukan." };
    }

    case "hapusJadwalGuru": {
      const [idJadwal] = args;
      let list = getStorage("jadwal_guru");
      list = list.filter((j: any) => j.id_jadwal !== idJadwal);
      setStorage("jadwal_guru", list);
      return { success: true, message: "Jadwal guru berhasil dihapus (SIMULASI)." };
    }

    // Jam Pelajaran (Lesson Period Slots)
    case "getJamPelajaran":
    case "getJamPelajaranSemua":
    case "getJamPelajaranList": {
      return { success: true, data: getStorage("jam_pelajaran") };
    }

    case "simpanJamPelajaran":
    case "tambahJamPelajaran":
    case "editJamPelajaran": {
      const [jamObj, optionalPayload] = args;
      const actualObj = (typeof jamObj === "object" && jamObj !== null) ? jamObj : optionalPayload;
      if (!actualObj) return { success: false, message: "Data slot jam pelajaran tidak valid." };

      const list = getStorage("jam_pelajaran");
      const idJam = actualObj.id_jam || "JP-" + Date.now();
      
      const existingIdx = list.findIndex((j: any) => j.id_jam === idJam);
      const newObj = {
        id_jam: idJam,
        jam_ke: Number(actualObj.jam_ke || 0),
        nama_jam: actualObj.nama_jam || `Jam ke-${actualObj.jam_ke}`,
        jam_mulai: actualObj.jam_mulai || "07:00",
        jam_selesai: actualObj.jam_selesai || "07:45",
        tipe: actualObj.tipe || "Pelajaran"
      };

      if (existingIdx !== -1) {
        list[existingIdx] = newObj;
      } else {
        list.push(newObj);
      }
      list.sort((a: any, b: any) => (a.jam_mulai || "").localeCompare(b.jam_mulai || ""));
      setStorage("jam_pelajaran", list);
      return { success: true, message: "Slot jam pelajaran berhasil disimpan!" };
    }

    case "hapusJamPelajaran": {
      const [idJam] = args;
      let list = getStorage("jam_pelajaran");
      list = list.filter((j: any) => j.id_jam !== idJam);
      setStorage("jam_pelajaran", list);
      return { success: true, message: "Slot jam pelajaran berhasil dihapus." };
    }

    // Jadwal Pelajaran (Subject Schedule Matrix)
    case "getJadwalPelajaranSemua":
    case "getJadwalPelajaran":
    case "getJadwalSemua": {
      return { success: true, data: getStorage("jadwal_pelajaran") };
    }

    case "tambahJadwalPelajaran": {
      const [payload] = args;
      const list = getStorage("jadwal_pelajaran");
      const idJadwal = "JPEL-" + Math.floor(Math.random() * 100000);
      const newSchedule = {
        id_jadwal: idJadwal,
        hari: payload.hari,
        id_jam: payload.id_jam || "JP-" + payload.jam_ke,
        jam_ke: Number(payload.jam_ke || 1),
        jam_mulai: payload.jam_mulai || "-",
        jam_selesai: payload.jam_selesai || "-",
        kelas: payload.kelas,
        mapel: payload.mapel,
        id_guru: payload.id_guru,
        nama_guru: payload.nama_guru,
        ruangan: payload.ruangan || "-"
      };
      list.push(newSchedule);
      setStorage("jadwal_pelajaran", list);
      return { success: true, message: "Jadwal pelajaran berhasil ditambahkan (SIMULASI)." };
    }

    case "editJadwalPelajaran": {
      const [idJadwal, payload] = args;
      const list = getStorage("jadwal_pelajaran");
      const idx = list.findIndex((j: any) => j.id_jadwal === idJadwal);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          hari: payload.hari,
          id_jam: payload.id_jam || list[idx].id_jam,
          jam_ke: Number(payload.jam_ke || list[idx].jam_ke),
          jam_mulai: payload.jam_mulai || list[idx].jam_mulai,
          jam_selesai: payload.jam_selesai || list[idx].jam_selesai,
          kelas: payload.kelas,
          mapel: payload.mapel,
          id_guru: payload.id_guru,
          nama_guru: payload.nama_guru,
          ruangan: payload.ruangan || list[idx].ruangan || "-"
        };
        setStorage("jadwal_pelajaran", list);
        return { success: true, message: "Jadwal pelajaran berhasil diperbarui (SIMULASI)." };
      }
      return { success: false, message: "Jadwal pelajaran tidak ditemukan." };
    }

    case "hapusJadwalPelajaran": {
      const [idJadwal] = args;
      let list = getStorage("jadwal_pelajaran");
      list = list.filter((j: any) => j.id_jadwal !== idJadwal);
      setStorage("jadwal_pelajaran", list);
      return { success: true, message: "Jadwal pelajaran berhasil dihapus (SIMULASI)." };
    }

    // Absensi Mengajar Guru (Teacher Class Attendance per Lesson Period)
    case "getAbsensiMengajarGuru": {
      return { success: true, data: getStorage("absensi_mengajar_guru") };
    }

    case "simpanAbsensiMengajarGuru": {
      const [payload] = args;
      const list = getStorage("absensi_mengajar_guru");
      const jamList = getStorage("jam_pelajaran") || [];
      const idLog = "LOG-MENG-" + Date.now();
      const tgl = payload.tanggal || new Date().toISOString().split("T")[0];
      const timeStr = payload.waktu_absen || new Date().toTimeString().slice(0, 5);
      const jamNum = Number(payload.jam_ke || 1);
      const slot = jamList.find((j: any) => Number(j.jam_ke) === jamNum);

      let startJadwal = payload.jam_mulai_jadwal;
      let endJadwal = payload.jam_selesai_jadwal;
      if ((!startJadwal || startJadwal === "-") && slot) {
        startJadwal = slot.jam_mulai;
      }
      if ((!endJadwal || endJadwal === "-") && slot) {
        endJadwal = slot.jam_selesai;
      }

      // Check Schedule Time Window restriction if enabled
      const savedCfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const batasiJam = savedCfg.batasi_jam_jadwal !== undefined ? Boolean(savedCfg.batasi_jam_jadwal) : true;
      const tolAwal = Number(savedCfg.toleransi_awal_menit ?? 15);
      const tolAkhir = Number(savedCfg.toleransi_akhir_menit ?? 30);

      if (batasiJam && startJadwal && startJadwal !== "-" && endJadwal && endJadwal !== "-") {
        const [hM, mM] = startJadwal.split(":").map(Number);
        const [hS, mS] = endJadwal.split(":").map(Number);
        const [hN, mN] = timeStr.split(":").map(Number);
        if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS) && !isNaN(hN) && !isNaN(mN)) {
          const startMin = hM * 60 + mM;
          const endMin = hS * 60 + mS;
          const nowMin = hN * 60 + mN;

          if (nowMin < startMin - tolAwal) {
            return {
              success: false,
              message: `Presensi mengajar ditolak: Belum masuk jam jadwal pelajaran (${payload.mapel || "Pelajaran"} ${payload.kelas || ""}). Jam pelajaran dimulai pukul ${startJadwal}. Saat ini jam ${timeStr}.`
            };
          }
          if (nowMin > endMin + tolAkhir) {
            return {
              success: false,
              message: `Presensi mengajar ditolak: Waktu absen (${timeStr}) berada di luar jam jadwal pelajaran (${startJadwal} - ${endJadwal}).`
            };
          }
        }
      }

      // Check if already logged for same guru, date, kelas, jam_ke
      const existingIdx = list.findIndex(
        (item: any) =>
          item.tanggal === tgl &&
          item.id_guru === payload.id_guru &&
          item.kelas === payload.kelas &&
          Number(item.jam_ke) === jamNum
      );

      const logItem = {
        id_log_mengajar: existingIdx !== -1 ? list[existingIdx].id_log_mengajar : idLog,
        tanggal: tgl,
        waktu_absen: timeStr,
        hari: payload.hari || "Senin",
        id_guru: payload.id_guru,
        nama_guru: payload.nama_guru,
        kelas: payload.kelas,
        mapel: payload.mapel,
        jam_ke: jamNum,
        jam_mulai_jadwal: startJadwal || "-",
        jam_selesai_jadwal: endJadwal || "-",
        status: payload.status || "Hadir Tepat Waktu",
        catatan_materi: payload.catatan_materi || "-"
      };

      if (existingIdx !== -1) {
        list[existingIdx] = logItem;
      } else {
        list.push(logItem);
      }

      setStorage("absensi_mengajar_guru", list);
      return { success: true, message: `Presensi mengajar ${payload.nama_guru} kelas ${payload.kelas} jam ke-${payload.jam_ke} berhasil dicatat!` };
    }

    case "hapusAbsensiMengajarGuru": {
      const [idLog] = args;
      let list = getStorage("absensi_mengajar_guru");
      list = list.filter((item: any) => item.id_log_mengajar !== idLog);
      setStorage("absensi_mengajar_guru", list);
      return { success: true, message: "Riwayat presensi mengajar berhasil dihapus (SIMULASI)." };
    }

    case "buatStrukturDatabaseOtomatis": {
      localStorage.removeItem(getStorageKey("MOCK_users"));
      localStorage.removeItem(getStorageKey("MOCK_data_siswa"));
      localStorage.removeItem(getStorageKey("MOCK_data_guru"));
      localStorage.removeItem(getStorageKey("MOCK_laporan_siswa"));
      localStorage.removeItem(getStorageKey("MOCK_laporan_guru"));
      localStorage.removeItem(getStorageKey("MOCK_pengaturan_jam"));
      localStorage.removeItem(getStorageKey("MOCK_hari_libur"));
      localStorage.removeItem(getStorageKey("MOCK_data_kelas"));
      localStorage.removeItem(getStorageKey("MOCK_jadwal_guru"));
      initMockDb();
      localStorage.setItem(getStorageKey("MOCK_jadwal_guru"), JSON.stringify([]));
      return { success: true, message: "Struktur database berhasil dibuat ulang (SIMULASI)!" };
    }

    default:
      return { success: false, message: "Action not simulated: " + action };
  }
}

export function isInvalidWali(s: any): boolean {
  if (!s) return true;
  const str = String(s).trim().toLowerCase();
  return (
    str === "" ||
    str === "-" ||
    str === "null" ||
    str === "undefined" ||
    str === "wali" ||
    str === "wali kelas" ||
    str === "wali_kelas" ||
    str === "walikelas" ||
    str === "pilih wali" ||
    str.includes("pilih wali") ||
    str.includes("-- pilih") ||
    str.includes("belum sesuai") ||
    str.includes("belum ada") ||
    str.includes("belum ditentukan")
  );
}

export function cleanTimeHHMM(val: any): string {
  if (!val || val === "-") return "";
  let str = String(val).trim();
  if (str.indexOf("T") !== -1) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      }
    } catch (e) {}
    const timePart = str.split("T")[1];
    if (timePart) str = timePart.substring(0, 5);
  }
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, "0");
    const m = match[2];
    return `${h}:${m}`;
  }
  return str;
}

// Main bridge function to invoke Apps Script Web App actions
export async function callGas(action: string, args: any[] = []): Promise<any> {
  if (isUsingMock()) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return callMock(action, args);
  }
  
  const url = getGasUrl();
  const token = getGasToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const bodyObj: any = { action, args, token };
    if (args && args.length > 0) {
      if (action === "editKelas") {
        const kLama = typeof args[0] === "string" ? args[0] : (args[0]?.nama_kelas || args[0]?.kelas || "");
        const kBaru = typeof args[1] === "string" ? args[1] : (args[1]?.nama_kelas || args[1]?.kelas || kLama);
        const wRaw = typeof args[2] === "string" ? args[2] : (args[2]?.wali_kelas || args[2]?.wali || args[2]?.waliKelas || args[2]?.nama_guru || args[2]?.guru_wali || "-");
        const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
        const idG = typeof args[3] === "string" ? args[3] : (args[2]?.id_guru || args[4]?.id_guru || "-");

        bodyObj.kelasLama = kLama;
        bodyObj.kelasBaru = kBaru;
        bodyObj.nama_kelas = kBaru;
        bodyObj.kelas = kBaru;
        bodyObj.namaKelas = kBaru;
        bodyObj.id_guru = idG;
        bodyObj.idGuru = idG;
        bodyObj.id_wali = idG;
        bodyObj.wali_kelas = wVal;
        bodyObj.wali = wVal;
        bodyObj.waliKelas = wVal;
        bodyObj.nama_guru = wVal;
        bodyObj.guru_wali = wVal;
        bodyObj.walikelas = wVal;
        bodyObj.guruWali = wVal;
        bodyObj.wali_kelas_nama = wVal;

        // Synchronize local storage immediately
        let currentK = getStorage("data_kelas") || [];
        if (!Array.isArray(currentK)) currentK = [];
        const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kLama);
        if (idx !== -1) {
          currentK[idx] = { nama_kelas: kBaru, id_guru: idG, wali_kelas: wVal };
        } else {
          currentK.push({ nama_kelas: kBaru, id_guru: idG, wali_kelas: wVal });
        }
        setStorage("data_kelas", currentK);
      } else if (action === "simpanWaliKelas" || action === "tambahKelas") {
        const kNama = typeof args[0] === "string" ? args[0] : (args[0]?.nama_kelas || args[0]?.kelas || "");
        const wRaw = typeof args[1] === "string" ? args[1] : (args[1]?.wali_kelas || args[1]?.wali || args[1]?.waliKelas || args[1]?.nama_guru || args[1]?.guru_wali || "-");
        const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
        const idG = typeof args[2] === "string" ? args[2] : (args[1]?.id_guru || args[3]?.id_guru || "-");

        bodyObj.nama_kelas = kNama;
        bodyObj.kelas = kNama;
        bodyObj.namaKelas = kNama;
        bodyObj.id_guru = idG;
        bodyObj.idGuru = idG;
        bodyObj.id_wali = idG;
        bodyObj.wali_kelas = wVal;
        bodyObj.wali = wVal;
        bodyObj.waliKelas = wVal;
        bodyObj.nama_guru = wVal;
        bodyObj.guru_wali = wVal;
        bodyObj.walikelas = wVal;
        bodyObj.guruWali = wVal;
        bodyObj.wali_kelas_nama = wVal;

        // Synchronize local storage immediately
        let currentK = getStorage("data_kelas") || [];
        if (!Array.isArray(currentK)) currentK = [];
        const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kNama);
        if (idx !== -1) {
          currentK[idx] = { nama_kelas: kNama, id_guru: idG, wali_kelas: wVal };
        } else {
          currentK.push({ nama_kelas: kNama, id_guru: idG, wali_kelas: wVal });
        }
        setStorage("data_kelas", currentK);
      } else if (action === "editDataMaster" || action === "tambahDataMaster") {
        const cat = args[0];
        if (cat === "Kelas") {
          const itemObj = typeof args[1] === "object" ? args[1] : (typeof args[2] === "object" ? args[2] : {});
          const kNama = itemObj.nama_kelas || itemObj.kelas || (typeof args[1] === "string" ? args[1] : "");
          const wRaw = itemObj.wali_kelas || itemObj.wali || itemObj.waliKelas || itemObj.nama_guru || itemObj.guru_wali || "-";
          const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
          const idG = itemObj.id_guru || itemObj.idGuru || itemObj.id_wali || "-";

          bodyObj.nama_kelas = kNama;
          bodyObj.kelas = kNama;
          bodyObj.namaKelas = kNama;
          bodyObj.id_guru = idG;
          bodyObj.idGuru = idG;
          bodyObj.id_wali = idG;
          bodyObj.wali_kelas = wVal;
          bodyObj.wali = wVal;
          bodyObj.waliKelas = wVal;
          bodyObj.nama_guru = wVal;
          bodyObj.guru_wali = wVal;
          bodyObj.walikelas = wVal;
          bodyObj.guruWali = wVal;
          bodyObj.wali_kelas_nama = wVal;

          let currentK = getStorage("data_kelas") || [];
          if (!Array.isArray(currentK)) currentK = [];
          const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kNama);
          if (idx !== -1) {
            currentK[idx] = { nama_kelas: kNama, id_guru: idG, wali_kelas: wVal };
          } else {
            currentK.push({ nama_kelas: kNama, id_guru: idG, wali_kelas: wVal });
          }
          setStorage("data_kelas", currentK);
        }
      }

      // Explicit sheet destination mapping according to system architecture
      const actLower = String(action || "").toLowerCase();
      const firstArg = typeof args[0] === "string" ? args[0] : "";
      const secondArg = typeof args[1] === "string" ? args[1] : "";

      if (
        action === "getPresensiSiswa" ||
        action === "catatAbsensiSiswa" ||
        (actLower.includes("laporan") && (firstArg === "Siswa" || secondArg === "Siswa")) ||
        (action === "prosesScanQR" && (secondArg === "Siswa" || firstArg === "Siswa")) ||
        (action === "simpanAbsenManual" && secondArg === "Siswa")
      ) {
        bodyObj.sheet_name = "PresensiSiswa";
        bodyObj.sheetName = "PresensiSiswa";
        bodyObj.target_sheet = "PresensiSiswa";
        bodyObj.targetSheet = "PresensiSiswa";
      } else if (
        action === "getPresensiGuru" ||
        action === "catatAbsensiGuru" ||
        (actLower.includes("laporan") && (firstArg === "Guru" || secondArg === "Guru")) ||
        (action === "prosesScanQR" && (secondArg === "Guru" || firstArg === "Guru")) ||
        (action === "simpanAbsenManual" && secondArg === "Guru")
      ) {
        bodyObj.sheet_name = "PresensiGuru";
        bodyObj.sheetName = "PresensiGuru";
        bodyObj.target_sheet = "PresensiGuru";
        bodyObj.targetSheet = "PresensiGuru";
      } else if (
        actLower.includes("absensimengajar") ||
        actLower.includes("jadwalmengajar")
      ) {
        bodyObj.sheet_name = "AbsensiMengajar";
        bodyObj.sheetName = "AbsensiMengajar";
        bodyObj.target_sheet = "AbsensiMengajar";
        bodyObj.targetSheet = "AbsensiMengajar";
      }

      for (const a of args) {
        if (typeof a === "object" && a !== null && !Array.isArray(a)) {
          Object.assign(bodyObj, a);
        }
      }
    }

    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(bodyObj),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    if (result && result.success === false && result.message && (
      result.message.includes("tidak diizinkan") || 
      result.message.includes("tidak dikenal") ||
      result.message.includes("tidak ditemukan") ||
      result.message.includes("not recognized")
    )) {
      console.warn(`GAS Action '${action}' not recognized by remote Web App endpoint. Falling back to local storage execution.`);
      return callMock(action, args);
    }

    // Auto-sync valid cloud data to local storage for offline & fallback consistency
    if (result && result.success !== false) {
      try {
        if (action.includes("JamPelajaran")) {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jam_pelajaran", list);
        } else if (action.includes("JadwalPelajaran") || action === "getJadwalSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jadwal_pelajaran", list);
        } else if (action === "getJadwalGuruSemua" || action === "getJadwalGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jadwal_guru", list);
        } else if (action.includes("Pengaturan") || action.includes("KonfigurasiJam")) {
          let rawObj = result && typeof result === "object" ? (result.data || result) : null;
          let jMulai = "";
          let jBatas = "";
          let jPulang = "";

          if (Array.isArray(rawObj)) {
            for (const item of rawObj) {
              if (typeof item === "object" && item) {
                const k = String(item.kunci || item.key || item.parameter || item.nama || item.kategori || "").toLowerCase();
                const rawV = item.nilai || item.value || item.isi || "";
                const v = cleanTimeHHMM(rawV);
                if (v) {
                  if (k.includes("masuk_mulai") || k.includes("masuk_awal")) jMulai = v;
                  if (k.includes("masuk_batas") || k.includes("terlambat")) jBatas = v;
                  if (k.includes("pulang_mulai") || k.includes("pulang_awal")) jPulang = v;
                }
              }
            }
          } else if (rawObj && typeof rawObj === "object") {
            jMulai = cleanTimeHHMM(rawObj.jam_masuk_mulai || rawObj.jam_masuk);
            jBatas = cleanTimeHHMM(rawObj.jam_masuk_batas || rawObj.jam_batas);
            jPulang = cleanTimeHHMM(rawObj.jam_pulang_mulai || rawObj.jam_pulang);
          }
          if (jMulai || jBatas || jPulang) {
            const savedCfg = {
              jam_masuk_mulai: jMulai || "06:00",
              jam_masuk_batas: jBatas || "07:15",
              jam_pulang_mulai: jPulang || "15:30"
            };
            localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(savedCfg));
            localStorage.setItem(getStorageKey("pengaturan_jam"), JSON.stringify(savedCfg));
          }
        } else if (action === "getDataMaster") {
          const cat = args[0];
          const rawList = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (rawList) {
            const nameKey = cat === "Siswa" ? "nama_siswa" : "nama_guru";
            const identifierKey = cat === "Siswa" ? "nisn" : "nip_nuptk";
            const cleanList = rawList.filter((item: any) => {
              if (!item || typeof item !== "object") return false;
              const name = String(item[nameKey] || item.nama || item.name || "").trim();
              const identifier = String(item[identifierKey] || "").trim();
              return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
            });
            setStorage(cat === "Siswa" ? "data_siswa" : "data_guru", cleanList);
          }
        } else if (action === "getKelasSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) {
            const existing = getStorage("data_kelas") || [];
            const mergedMap = new Map<string, { id_guru: string; wali_kelas: string }>();

            // 1. Add existing local entries
            for (const ex of existing) {
              if (typeof ex === "string") {
                if (!mergedMap.has(ex)) mergedMap.set(ex, { id_guru: "-", wali_kelas: "-" });
              } else if (typeof ex === "object" && ex) {
                const name = String(ex.nama_kelas || ex.kelas || "").trim();
                const wali = String(ex.wali_kelas || ex.wali || ex.waliKelas || ex["Wali Kelas"] || "-").trim();
                const idG = String(ex.id_guru || ex.id_wali || ex.idGuru || "-").trim();
                if (name) {
                  if (!mergedMap.has(name) || (mergedMap.get(name)?.wali_kelas === "-" && wali !== "-")) {
                    mergedMap.set(name, { id_guru: idG, wali_kelas: wali });
                  }
                }
              }
            }

            // 2. Add/merge API list
            for (const item of list) {
              const name = String(typeof item === "string" ? item : (item.nama_kelas || item.kelas || "")).trim();
              const waliFromApi = String(typeof item === "object" && item ? (item.wali_kelas || item.wali || item.waliKelas || item.guru_wali || item.nama_guru || item.wali_kelas_nama || item["Wali Kelas"] || "-") : "-").trim();
              const idGFromApi = String(typeof item === "object" && item ? (item.id_guru || item.id_wali || item.idGuru || "-") : "-").trim();
              if (name) {
                const existingObj = mergedMap.get(name) || { id_guru: "-", wali_kelas: "-" };
                const cleanWaliFromApi = isInvalidWali(waliFromApi) ? "-" : waliFromApi;
                const finalWali = (cleanWaliFromApi && cleanWaliFromApi !== "-") ? cleanWaliFromApi : existingObj.wali_kelas;
                const finalIdG = (idGFromApi && idGFromApi !== "-") ? idGFromApi : existingObj.id_guru;
                mergedMap.set(name, { id_guru: finalIdG, wali_kelas: finalWali });
              }
            }

            const merged = Array.from(mergedMap.entries()).map(([nama_kelas, val]) => ({
              nama_kelas,
              id_guru: val.id_guru,
              wali_kelas: val.wali_kelas
            }));

            setStorage("data_kelas", merged);
          }
        } else if (action === "getHariLiburSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("hari_libur", list);
        } else if (action === "getAbsensiMengajarGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("absensi_mengajar_guru", list);
        } else if (action === "getLaporanFilter" || action === "getLaporanPresensi" || action === "getPresensiSiswa" || action === "getPresensiGuru" || action === "getLaporanSiswa" || action === "getLaporanGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : null);
          if (list && Array.isArray(list)) {
            const isSiswa = args[0] === "Siswa" || action.includes("Siswa");
            setStorage(isSiswa ? "laporan_siswa" : "laporan_guru", list);
          }
        }
      } catch (e) {
        console.warn("Auto storage sync error:", e);
      }
    }

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("GAS API Call error/timeout, falling back to local simulation:", err);
    return callMock(action, args);
  }
}
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Key for storing the GAS URL
export const GAS_URL_STORAGE_KEY = "SIAS_GAS_URL";
export const GAS_TOKEN_STORAGE_KEY = "SIAS_GAS_TOKEN";

export interface SchoolProfile {
  namaSekolah: string;
  alamatSekolah: string;
  npsn?: string;
  telepon?: string;
}

export const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  namaSekolah: "AL-HIKAM SCHOOL",
  alamatSekolah: "SENDANG AGUNG",
  npsn: "20512345",
  telepon: "(031) 8901234"
};

export function getSchoolProfile(): SchoolProfile {
  try {
    const saved = localStorage.getItem("SIAS_SCHOOL_PROFILE");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.namaSekolah) {
        return {
          ...DEFAULT_SCHOOL_PROFILE,
          ...parsed
        };
      }
    }
  } catch (e) {}
  return DEFAULT_SCHOOL_PROFILE;
}

export function setSchoolProfile(profile: SchoolProfile): void {
  try {
    localStorage.setItem("SIAS_SCHOOL_PROFILE", JSON.stringify(profile));
  } catch (e) {}
}

export function getGasUrl(): string {
  try {
    const saved = localStorage.getItem(GAS_URL_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return "https://script.google.com/macros/s/AKfycbzQ4b8j2R3mXz0YV4X_O/exec";
}

export function setGasUrl(url: string): void {
  try {
    localStorage.setItem(GAS_URL_STORAGE_KEY, url);
  } catch (e) {}
}

export function getGasToken(): string {
  try {
    const saved = localStorage.getItem(GAS_TOKEN_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {}
  return "sias_token_smkalhikam";
}

export function getStorageKey(baseKey: string): string {
  const url = getGasUrl() || "default_gas_url";
  const token = getGasToken() || "default_gas_token";
  const combined = url + "_" + token;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const cleanHash = Math.abs(hash).toString(36);
  return `${baseKey}_${cleanHash}`;
}

export function extractArrayData(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.result && Array.isArray(res.result)) return res.result;
  if (res.list && Array.isArray(res.list)) return res.list;
  if (res.items && Array.isArray(res.items)) return res.items;
  if (res.rows && Array.isArray(res.rows)) return res.rows;
  if (res.PresensiSiswa && Array.isArray(res.PresensiSiswa)) return res.PresensiSiswa;
  if (res.PresensiGuru && Array.isArray(res.PresensiGuru)) return res.PresensiGuru;
  if (res.AbsensiMengajar && Array.isArray(res.AbsensiMengajar)) return res.AbsensiMengajar;
  if (res.presensi_siswa && Array.isArray(res.presensi_siswa)) return res.presensi_siswa;
  if (res.presensi_guru && Array.isArray(res.presensi_guru)) return res.presensi_guru;
  if (res.absensi_mengajar && Array.isArray(res.absensi_mengajar)) return res.absensi_mengajar;
  if (res.absensi_mengajar_guru && Array.isArray(res.absensi_mengajar_guru)) return res.absensi_mengajar_guru;
  if (res.jam_pelajaran && Array.isArray(res.jam_pelajaran)) return res.jam_pelajaran;
  if (res.jadwal_pelajaran && Array.isArray(res.jadwal_pelajaran)) return res.jadwal_pelajaran;
  if (res.jadwal_guru && Array.isArray(res.jadwal_guru)) return res.jadwal_guru;
  if (res.laporan && Array.isArray(res.laporan)) return res.laporan;
  if (res.presensi && Array.isArray(res.presensi)) return res.presensi;
  if (res.absensi && Array.isArray(res.absensi)) return res.absensi;
  if (res.presensiSiswa && Array.isArray(res.presensiSiswa)) return res.presensiSiswa;
  if (res.presensiGuru && Array.isArray(res.presensiGuru)) return res.presensiGuru;
  if (res.absensiMengajar && Array.isArray(res.absensiMengajar)) return res.absensiMengajar;
  if (res.laporan_siswa && Array.isArray(res.laporan_siswa)) return res.laporan_siswa;
  if (res.laporan_guru && Array.isArray(res.laporan_guru)) return res.laporan_guru;
  if (res.laporanSiswa && Array.isArray(res.laporanSiswa)) return res.laporanSiswa;
  if (res.laporanGuru && Array.isArray(res.laporanGuru)) return res.laporanGuru;
  return [];
}

export function formatToIsoDate(dStr: any): string {
  if (!dStr) return "";
  const s = String(dStr).trim();
  if (s.includes("T")) return s.split("T")[0];
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) return s;
  if (s.includes("/") || s.includes("-")) {
    const parts = s.split(/[\/\-]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else if (parts[2].length === 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  const dateObj = new Date(dStr);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split("T")[0];
  }
  return s;
}

export function setGasToken(token: string): void {
  // Nonaktif: pengaturan sekarang di-hardcode di getGasToken()
}

export function isUsingMock(): boolean {
  const url = getGasUrl();
  return !url || url.includes("AKfycbzQ4b8j2R3mXz0YV4X_O");
}

// Ensure mock database exists in localStorage
function initMockDb() {
  const getKey = (k: string) => getStorageKey("MOCK_" + k);

  if (!localStorage.getItem(getKey("users"))) {
    localStorage.setItem(getKey("users"), JSON.stringify([
      { username: "admin", password: "admin123", role: "Admin", target_id: "-" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_siswa"))) {
    localStorage.setItem(getKey("data_siswa"), JSON.stringify([
      { id_siswa: "S-001", nisn: "0081234567", nama_siswa: "Ahmad Dani", jenis_kelamin: "Laki-laki", kelas: "XI", jurusan: "RPL 1", no_hp_ortu: "08571234567", qr_content: "QR-S-001" },
      { id_siswa: "S-002", nisn: "0098765432", nama_siswa: "Siti Aminah", jenis_kelamin: "Perempuan", kelas: "XI", jurusan: "RPL 1", no_hp_ortu: "08129876543", qr_content: "QR-S-002" },
      { id_siswa: "S-003", nisn: "0076543210", nama_siswa: "Rizky Pratama", jenis_kelamin: "Laki-laki", kelas: "X", jurusan: "RPL 2", no_hp_ortu: "08132435465", qr_content: "QR-S-003" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_guru"))) {
    localStorage.setItem(getKey("data_guru"), JSON.stringify([
      { id_guru: "G-001", nip_nuptk: "198706122015031002", nama_guru: "Bahrul Ulum, S.Kom", jenis_kelamin: "Laki-laki", jabatan_tugas: "Ka. Komli RPL", no_hp: "08123456789", qr_content: "QR-G-001" },
      { id_guru: "G-002", nip_nuptk: "199201042019082001", nama_guru: "Eka Rahmawati, S.Pd", jenis_kelamin: "Perempuan", jabatan_tugas: "Waka Kurikulum", no_hp: "08198765432", qr_content: "QR-G-002" }
    ]));
  }
  if (!localStorage.getItem(getKey("laporan_siswa"))) {
    localStorage.setItem(getKey("laporan_siswa"), JSON.stringify([]));
  }
  if (!localStorage.getItem(getKey("laporan_guru"))) {
    localStorage.setItem(getKey("laporan_guru"), JSON.stringify([]));
  }
  if (!localStorage.getItem(getKey("pengaturan_jam"))) {
    localStorage.setItem(getKey("pengaturan_jam"), JSON.stringify({
      jam_masuk_mulai: "06:00",
      jam_masuk_batas: "07:15",
      jam_pulang_mulai: "15:30"
    }));
  }
  if (!localStorage.getItem(getKey("hari_libur"))) {
    localStorage.setItem(getKey("hari_libur"), JSON.stringify([
      { tanggal: "2026-08-17", keterangan: "Hari Kemerdekaan RI" }
    ]));
  }
  if (!localStorage.getItem(getKey("data_kelas"))) {
    localStorage.setItem(getKey("data_kelas"), JSON.stringify([
      { nama_kelas: "X RPL 1", id_guru: "G-001", wali_kelas: "Bahrul Ulum, S.Kom" },
      { nama_kelas: "X RPL 2", id_guru: "-", wali_kelas: "-" },
      { nama_kelas: "XI RPL 1", id_guru: "G-002", wali_kelas: "Eka Rahmawati, S.Pd" },
      { nama_kelas: "XI RPL 2", id_guru: "-", wali_kelas: "-" },
      { nama_kelas: "XII RPL 1", id_guru: "-", wali_kelas: "-" }
    ]));
  }
  if (!localStorage.getItem(getKey("jam_pelajaran"))) {
    localStorage.setItem(getKey("jam_pelajaran"), JSON.stringify([
      { id_jam: "JP-1", jam_ke: 1, nama_jam: "Jam ke-1", jam_mulai: "07:00", jam_selesai: "07:45", tipe: "Pelajaran" },
      { id_jam: "JP-2", jam_ke: 2, nama_jam: "Jam ke-2", jam_mulai: "07:45", jam_selesai: "08:30", tipe: "Pelajaran" },
      { id_jam: "JP-3", jam_ke: 3, nama_jam: "Jam ke-3", jam_mulai: "08:30", jam_selesai: "09:15", tipe: "Pelajaran" },
      { id_jam: "JP-IST1", jam_ke: 0, nama_jam: "Istirahat Pertama", jam_mulai: "09:15", jam_selesai: "09:45", tipe: "Istirahat" },
      { id_jam: "JP-4", jam_ke: 4, nama_jam: "Jam ke-4", jam_mulai: "09:45", jam_selesai: "10:30", tipe: "Pelajaran" },
      { id_jam: "JP-5", jam_ke: 5, nama_jam: "Jam ke-5", jam_mulai: "10:30", jam_selesai: "11:15", tipe: "Pelajaran" },
      { id_jam: "JP-6", jam_ke: 6, nama_jam: "Jam ke-6", jam_mulai: "11:15", jam_selesai: "12:00", tipe: "Pelajaran" },
      { id_jam: "JP-IST2", jam_ke: 0, nama_jam: "ISOMA (Istirahat & Sholat)", jam_mulai: "12:00", jam_selesai: "13:00", tipe: "Istirahat" },
      { id_jam: "JP-7", jam_ke: 7, nama_jam: "Jam ke-7", jam_mulai: "13:00", jam_selesai: "13:45", tipe: "Pelajaran" },
      { id_jam: "JP-8", jam_ke: 8, nama_jam: "Jam ke-8", jam_mulai: "13:45", jam_selesai: "14:30", tipe: "Pelajaran" }
    ]));
  }
  if (!localStorage.getItem(getKey("jadwal_pelajaran"))) {
    localStorage.setItem(getKey("jadwal_pelajaran"), JSON.stringify([
      { id_jadwal: "JPEL-101", hari: "Senin", id_jam: "JP-1", jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45", kelas: "XI RPL 1", mapel: "Pemrograman Web", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 1" },
      { id_jadwal: "JPEL-102", hari: "Senin", id_jam: "JP-2", jam_ke: 2, jam_mulai: "07:45", jam_selesai: "08:30", kelas: "XI RPL 1", mapel: "Pemrograman Web", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 1" },
      { id_jadwal: "JPEL-103", hari: "Senin", id_jam: "JP-3", jam_ke: 3, jam_mulai: "08:30", jam_selesai: "09:15", kelas: "XI RPL 1", mapel: "Matematika", id_guru: "G-002", nama_guru: "Eka Rahmawati, S.Pd", ruangan: "R. XI RPL 1" },
      { id_jadwal: "JPEL-104", hari: "Selasa", id_jam: "JP-1", jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45", kelas: "X RPL 1", mapel: "Informatika", id_guru: "G-001", nama_guru: "Bahrul Ulum, S.Kom", ruangan: "Lab Komputer 2" }
    ]));
  }
  if (!localStorage.getItem(getKey("absensi_mengajar_guru"))) {
    localStorage.setItem(getKey("absensi_mengajar_guru"), JSON.stringify([]));
  }
}

export function getStorage(key: string): any {
  try {
    return JSON.parse(localStorage.getItem(getStorageKey("MOCK_" + key)) || "[]");
  } catch (e) {
    return [];
  }
}

export function setStorage(key: string, val: any): void {
  try {
    localStorage.setItem(getStorageKey("MOCK_" + key), JSON.stringify(val));
  } catch (e) {}
}

// Call local mock APIs
export function callMock(action: string, args: any[] = []): any {
  initMockDb();

  switch (action) {
    case "verifikasiLogin": {
      const [username, password] = args;
      
      // 1. Check mock users first (admin)
      const users = getStorage("users");
      const found = users.find((u: any) => u.username === username && u.password === password);
      if (found) {
        return { success: true, role: found.role, target_id: found.target_id, username: found.username, message: "Login Berhasil (SIMULASI)" };
      }
      
      // 2. Check mock teachers
      const teachers = getStorage("data_guru");
      const foundTeacher = teachers.find((t: any) => {
        const namaGuru = String(t.nama_guru || "").trim();
        const teacherUsername = namaGuru.replace(/\s+/g, "").toLowerCase();
        const inputUserLower = String(username).replace(/\s+/g, "").toLowerCase();
        
        // Match user by teacher's lowercase name without spaces
        const matchUser = (inputUserLower === teacherUsername);
        
        if (matchUser) {
          const inputPass = String(password).trim();
          const dbPass = String(t.password || "guru123").trim();
          return inputPass === dbPass;
        }
        return false;
      });
      
      if (foundTeacher) {
        return {
          success: true,
          role: "Guru",
          target_id: foundTeacher.id_guru,
          username: foundTeacher.nama_guru,
          message: "Login Berhasil (SIMULASI - Otomatis Guru)!"
        };
      }
      
      return { success: false, message: "Kredensial Salah! (Admin: admin / admin123, Guru: Nama tanpa spasi & huruf kecil, password default 'guru123')" };
    }
    
    case "ubahPasswordUser": {
      const [username, passwordLama, passwordBaru] = args;
      
      // Try admin users
      const users = getStorage("users");
      const index = users.findIndex((u: any) => u.username === username && u.password === passwordLama);
      if (index !== -1) {
        users[index].password = passwordBaru;
        setStorage("users", users);
        return { success: true, message: "Password berhasil diperbarui (SIMULASI)!" };
      }
      
      // Try teachers
      const teachers = getStorage("data_guru");
      const idxT = teachers.findIndex((t: any) => {
        const namaGuru = String(t.nama_guru || "").trim();
        const teacherUsername = namaGuru.replace(/\s+/g, "").toLowerCase();
        const inputUserLower = String(username).replace(/\s+/g, "").toLowerCase();
        
        if (inputUserLower === teacherUsername || String(username).toLowerCase().trim() === namaGuru.toLowerCase()) {
          const dbPass = String(t.password || "guru123").trim();
          return passwordLama === dbPass;
        }
        return false;
      });
      
      if (idxT !== -1) {
        teachers[idxT].password = passwordBaru;
        setStorage("data_guru", teachers);
        return { success: true, message: "Password Guru berhasil diperbarui (SIMULASI)!" };
      }
      
      return { success: false, message: "Password lama tidak sesuai / User tidak dikenali." };
    }

    case "getPengaturanSemua":
    case "getPengaturanJam":
    case "getPengaturan":
    case "getKonfigurasiJam": {
      const cfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      return { success: true, data: cfg, ...cfg };
    }

    case "simpanPengaturanCustom": {
      const [customObj] = args;
      const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const merged = { ...current, ...(typeof customObj === "object" ? customObj : {}) };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(merged));
      return { success: true, message: "Pengaturan berhasil diperbarui!", data: merged };
    }

    case "simpanKonfigurasiJam":
    case "simpanPengaturanJam":
    case "simpanPengaturan": {
      const [jamMasukMulai, jamMasukBatas, jamPulangMulai] = args;
      const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const merged = {
        ...current,
        jam_masuk_mulai: jamMasukMulai || current.jam_masuk_mulai || "06:00",
        jam_masuk_batas: jamMasukBatas || current.jam_masuk_batas || "07:15",
        jam_pulang_mulai: jamPulangMulai || current.jam_pulang_mulai || "15:30"
      };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(merged));
      return { success: true, message: "Pengaturan Jam Operasional disimpan!", data: merged };
    }

    case "backupDatabaseToDrive": {
      const [folderId] = args;
      const currentConfig = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const now = new Date().toISOString();
      const updated = {
        ...currentConfig,
        lastBackupTime: now,
        driveFolderId: folderId || currentConfig.driveFolderId || ""
      };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(updated));
      return { 
        success: true, 
        message: `Backup database berhasil diunggah ke Google Drive (Folder ID: ${folderId || "Utama"})!`,
        lastBackupTime: now
      };
    }

    case "restoreDatabaseJSON": {
      const [jsonData] = args;
      if (!jsonData || typeof jsonData !== "object") {
        return { success: false, message: "Format file JSON backup tidak valid!" };
      }
      try {
        if (jsonData.users && Array.isArray(jsonData.users)) setStorage("users", jsonData.users);
        if (jsonData.data_siswa && Array.isArray(jsonData.data_siswa)) setStorage("data_siswa", jsonData.data_siswa);
        if (jsonData.data_guru && Array.isArray(jsonData.data_guru)) setStorage("data_guru", jsonData.data_guru);
        if (jsonData.data_kelas && Array.isArray(jsonData.data_kelas)) setStorage("data_kelas", jsonData.data_kelas);
        if (jsonData.jam_pelajaran && Array.isArray(jsonData.jam_pelajaran)) setStorage("jam_pelajaran", jsonData.jam_pelajaran);
        if (jsonData.jadwal_pelajaran && Array.isArray(jsonData.jadwal_pelajaran)) setStorage("jadwal_pelajaran", jsonData.jadwal_pelajaran);
        if (jsonData.absensi_mengajar_guru && Array.isArray(jsonData.absensi_mengajar_guru)) setStorage("absensi_mengajar_guru", jsonData.absensi_mengajar_guru);
        if (jsonData.hari_libur && Array.isArray(jsonData.hari_libur)) setStorage("hari_libur", jsonData.hari_libur);
        if (jsonData.pengaturan && typeof jsonData.pengaturan === "object") {
          const current = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
          localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify({ ...current, ...jsonData.pengaturan }));
        }
        return { success: true, message: "Restore database dari backup berhasil diselesaikan!" };
      } catch (e: any) {
        return { success: false, message: "Gagal memproses restore: " + e.toString() };
      }
    }

    case "getHariLiburSemua": {
      return getStorage("hari_libur");
    }

    case "tambahHariLibur": {
      const [tanggal, ket] = args;
      const libur = getStorage("hari_libur");
      libur.push({ tanggal, keterangan: ket });
      setStorage("hari_libur", libur);
      return { success: true, message: "Hari libur ditambahkan (SIMULASI)." };
    }

    case "hapusHariLibur": {
      const [tanggal] = args;
      let libur = getStorage("hari_libur");
      libur = libur.filter((l: any) => l.tanggal !== tanggal);
      setStorage("hari_libur", libur);
      return { success: true, message: "Hari libur dihapus (SIMULASI)." };
    }

    case "getKelasSemua": {
      let data = getStorage("data_kelas");
      if (!Array.isArray(data)) data = [];
      const normalized = data.map((item: any) => {
        if (typeof item === "string") {
          return { nama_kelas: item, id_guru: "-", wali_kelas: "-" };
        }
        const rawWali = item.wali_kelas || item.wali || item.waliKelas || item["Wali Kelas"] || item["wali_kelas"] || "-";
        const cleanWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
        const rawId = item.id_guru || item.id_wali || item.idGuru || "-";
        const cleanId = String(rawId || "-").trim();
        return {
          nama_kelas: item.nama_kelas || item.kelas || String(item),
          id_guru: cleanId,
          wali_kelas: cleanWali
        };
      });
      return { success: true, data: normalized };
    }

    case "tambahKelas": {
      const [namaKelas, waliKelas, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      
      const rawWali = typeof waliKelas === "string" ? waliKelas : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      if (idx === -1) {
        kelas.push({ nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali });
      } else {
        kelas[idx] = { nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali };
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: "Kelas ditambahkan (SIMULASI)." };
    }

    case "hapusKelas": {
      const [namaKelas, payloadObj] = args;
      const nameClean = typeof payloadObj === "object" && payloadObj !== null && payloadObj.nama_kelas ? payloadObj.nama_kelas : (typeof namaKelas === "string" ? namaKelas : "");
      let kelas = getStorage("data_kelas");
      if (Array.isArray(kelas)) {
        kelas = kelas.filter((k: any) => {
          const kName = typeof k === "string" ? k : (k.nama_kelas || k.kelas || "");
          return String(kName).trim() !== String(nameClean).trim();
        });
        setStorage("data_kelas", kelas);
      }
      return { success: true, message: "Kelas berhasil dihapus!" };
    }

    case "editKelas": {
      const [kelasLama, kelasBaru, waliKelasBaru, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kelasLama);
      
      const rawWali = typeof waliKelasBaru === "string" ? waliKelasBaru : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      if (idx !== -1) {
        kelas[idx] = {
          nama_kelas: kelasBaru,
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        };
      } else {
        kelas.push({
          nama_kelas: kelasBaru,
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        });
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: "Kelas diperbarui (SIMULASI)." };
    }

    case "simpanWaliKelas": {
      const [namaKelas, waliKelas, idGuruParam, payloadObjParam] = args;
      let payloadObj = typeof payloadObjParam === "object" ? payloadObjParam : (typeof idGuruParam === "object" ? idGuruParam : {});
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      
      const rawWali = typeof waliKelas === "string" ? waliKelas : (payloadObj.wali_kelas || payloadObj.wali || payloadObj.nama_guru || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const chosenIdGuru = payloadObj.id_guru || payloadObj.id_wali || (typeof idGuruParam === "string" ? idGuruParam : "-");

      if (idx !== -1) {
        kelas[idx] = {
          nama_kelas: typeof kelas[idx] === "string" ? kelas[idx] : (kelas[idx].nama_kelas || namaKelas),
          id_guru: chosenIdGuru,
          wali_kelas: chosenWali
        };
      } else {
        kelas.push({ nama_kelas: namaKelas, id_guru: chosenIdGuru, wali_kelas: chosenWali });
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: `Wali kelas untuk ${namaKelas} berhasil disimpan!` };
    }

    case "getDataMaster": {
      const [kategori] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let rawData = getStorage(key);
      let changed = false;
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";

      // Clean out empty/blank records
      const cleanData = (Array.isArray(rawData) ? rawData : []).filter((item: any) => {
        if (!item || typeof item !== "object") return false;
        const name = String(item[nameKey] || item.nama || item.name || "").trim();
        const identifier = String(item[identifierKey] || "").trim();
        return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
      });

      if (cleanData.length !== rawData.length) {
        changed = true;
      }
      
      const data = cleanData.map((item: any) => {
        let needsSave = false;
        if (!item[idKey]) {
          const prefix = kategori === "Siswa" ? "S-" : "G-";
          item[idKey] = prefix + new Date().getTime().toString() + Math.floor(Math.random() * 1000).toString();
          needsSave = true;
        }
        if (!item.qr_content) {
          const identifier = item[identifierKey] || "";
          const name = item[nameKey] || "";
          item.qr_content = item[idKey] + "_" + identifier + "_" + name.replace(/\s+/g, '-');
          needsSave = true;
        }
        if (needsSave) changed = true;
        return item;
      });
      
      if (changed) {
        setStorage(key, data);
      }
      
      return { success: true, data };
    }

    case "getDataGuru": {
      return { success: true, data: getStorage("data_guru") };
    }

    case "getDataSiswa": {
      return { success: true, data: getStorage("data_siswa") };
    }

    case "tambahDataMaster": {
      const [kategori, dataObj] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      const prefix = kategori === "Siswa" ? "S-" : "G-";
      const idBaru = prefix + Math.floor(Math.random() * 10000);
      const qrContent = "QR-" + idBaru;
      
      const newRecord = kategori === "Siswa" ? {
        id_siswa: idBaru,
        nisn: dataObj.nisn,
        nama_siswa: dataObj.nama_siswa,
        jenis_kelamin: dataObj.jenis_kelamin,
        kelas: dataObj.kelas,
        jurusan: dataObj.jurusan,
        no_hp_ortu: dataObj.no_hp_ortu,
        qr_content: qrContent
      } : {
        id_guru: idBaru,
        nip_nuptk: dataObj.nip_nuptk,
        nama_guru: dataObj.nama_guru,
        jenis_kelamin: dataObj.jenis_kelamin,
        jabatan_tugas: dataObj.jabatan_tugas,
        no_hp: dataObj.no_hp,
        qr_content: qrContent
      };
      
      list.push(newRecord);
      setStorage(key, list);
      return { success: true, message: `Berhasil menambah ${kategori} baru (SIMULASI)` };
    }

    case "editDataMaster": {
      const [kategori, idTarget, dataObj] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const index = list.findIndex((x: any) => x[idKey] === idTarget);
      if (index !== -1) {
        list[index] = { ...list[index], ...dataObj };
        setStorage(key, list);
        return { success: true, message: "Data berhasil diubah (SIMULASI)." };
      }
      return { success: false, message: "ID tidak ditemukan." };
    }

    case "hapusDataMaster": {
      const [kategori, idTarget] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let list = getStorage(key);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";

      list = list.filter((x: any) => {
        if (!x || typeof x !== "object") return false;
        if (x[idKey] === idTarget) return false;
        const name = String(x[nameKey] || x.nama || x.name || "").trim();
        const identifier = String(x[identifierKey] || "").trim();
        return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
      });
      setStorage(key, list);
      return { success: true, message: "Data terhapus permanen (SIMULASI)." };
    }

    case "importDataMassal": {
      const [kategori, arrayData] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const list = getStorage(key);
      
      arrayData.forEach((dataObj: any, index: number) => {
        const prefix = kategori === "Siswa" ? "S-" : "G-";
        const idBaru = prefix + (new Date().getTime().toString().slice(-4)) + index;
        const qrContent = "QR-" + idBaru;
        
        const rec = kategori === "Siswa" ? {
          id_siswa: idBaru,
          nisn: dataObj.nisn || "-",
          nama_siswa: dataObj.nama_siswa || "-",
          jenis_kelamin: dataObj.jenis_kelamin || "-",
          kelas: dataObj.kelas || "-",
          jurusan: dataObj.jurusan || "-",
          no_hp_ortu: dataObj.no_hp_ortu || "-",
          qr_content: qrContent
        } : {
          id_guru: idBaru,
          nip_nuptk: dataObj.nip_nuptk || "-",
          nama_guru: dataObj.nama_guru || "-",
          jenis_kelamin: dataObj.jenis_kelamin || "-",
          jabatan_tugas: dataObj.jabatan_tugas || "-",
          no_hp: dataObj.no_hp || "-",
          qr_content: qrContent
        };
        list.push(rec);
      });
      setStorage(key, list);
      return { success: true, message: `Migrasi sukses. ${arrayData.length} baris dimasukkan (SIMULASI).` };
    }

    case "prosesScanQR": {
      const [qrContent, kategori, mode, tanggal] = args;
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let master = getStorage(masterKey);
      if (!Array.isArray(master) || master.length === 0) {
        initMockDb();
        master = getStorage(masterKey);
      }
      
      const cleanQr = String(qrContent || "").trim().toLowerCase();
      const cleanWithoutPrefix = cleanQr.replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";

      // Precise hierarchical lookup:
      // 1. Exact Match on ID, NISN/NIP, or QR Content
      let user = master.find((x: any) => {
        const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase();
        const id = String(x[idKey] || "").trim().toLowerCase();
        const ident = String(x[identifierKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase();
        return (qr && qr === cleanQr) || (id && id === cleanQr) || (ident && ident === cleanQr);
      });

      // 2. Exact Match without common prefix (e.g. "S-001" vs "001" or "QR-S-001" vs "S-001")
      if (!user && cleanWithoutPrefix && cleanWithoutPrefix.length >= 2) {
        user = master.find((x: any) => {
          const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          const id = String(x[idKey] || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          const ident = String(x[identifierKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
          return (qr && qr === cleanWithoutPrefix) || (id && id === cleanWithoutPrefix) || (ident && ident === cleanWithoutPrefix);
        });
      }

      // 3. Exact Full Name Match
      if (!user) {
        user = master.find((x: any) => {
          const nama = String(x[nameKey] || x.nama || "").trim().toLowerCase();
          return nama && nama === cleanQr;
        });
      }

      // 4. Normalized Full Name Match (only for alphabetic text queries with length >= 4)
      if (!user && /^[a-zA-Z\s.,']+$/.test(cleanQr) && cleanQr.length >= 4) {
        const normalize = (s: string) => s.toLowerCase().replace(/[,.]/g, " ").replace(/\s+/g, " ").trim();
        const targetNorm = normalize(cleanQr);
        user = master.find((x: any) => {
          const n = normalize(String(x[nameKey] || x.nama || ""));
          return n && (n === targetNorm || n.startsWith(targetNorm + " ") || targetNorm.startsWith(n + " "));
        });
      }
      
      if (!user) {
        // Try opposite category if not found
        const altKey = kategori === "Siswa" ? "data_guru" : "data_siswa";
        const altMaster = getStorage(altKey);
        const altIdKey = kategori === "Siswa" ? "id_guru" : "id_siswa";
        const altNameKey = kategori === "Siswa" ? "nama_guru" : "nama_siswa";
        const altIdentKey = kategori === "Siswa" ? "nip_nuptk" : "nisn";
        
        let altUser = altMaster.find((x: any) => {
          const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase();
          const id = String(x[altIdKey] || "").trim().toLowerCase();
          const ident = String(x[altIdentKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase();
          return (qr && qr === cleanQr) || (id && id === cleanQr) || (ident && ident === cleanQr);
        });

        if (!altUser && cleanWithoutPrefix && cleanWithoutPrefix.length >= 2) {
          altUser = altMaster.find((x: any) => {
            const qr = String(x.qr_content || x.qr_code || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            const id = String(x[altIdKey] || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            const ident = String(x[altIdentKey] || x.nisn || x.nip || x.nip_nuptk || "").trim().toLowerCase().replace(/^(qr|id|s|g|nisn|nip|siswa|guru)[_:\-\s]+/i, '').trim();
            return (qr && qr === cleanWithoutPrefix) || (id && id === cleanWithoutPrefix) || (ident && ident === cleanWithoutPrefix);
          });
        }

        if (!altUser) {
          altUser = altMaster.find((x: any) => {
            const nama = String(x[altNameKey] || x.nama || "").trim().toLowerCase();
            return nama && nama === cleanQr;
          });
        }

        if (altUser) {
          user = altUser;
        }
      }

      if (!user) return { success: false, message: `ID / Kartu "${qrContent}" tidak valid atau belum terdaftar!` };
      
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = new Date().toTimeString().slice(0, 5);
      const isGuruUser = Boolean(user.id_guru || user.nama_guru || user.nip_nuptk);
      const activeKategori = isGuruUser ? "Guru" : "Siswa";
      const reportsKey = activeKategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey) || [];
      
      const activeIdKey = activeKategori === "Siswa" ? "id_siswa" : "id_guru";
      const idTarget = user[activeIdKey] || user.id_siswa || user.id_guru || qrContent;
      const activeNameKey = activeKategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const nama = user[activeNameKey] || user.nama || qrContent;
      const classKey = activeKategori === "Siswa" ? `${user.kelas || "-"} ${user.jurusan || ""}`.trim() : "-";
      
      // Index in daily attendance report
      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[activeIdKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      const cfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const defaultJamMasukBatas = cfg.jam_masuk_batas || "07:15";
      const defaultJamPulangMulai = cfg.jam_pulang_mulai || "15:30";

      const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const hariIni = hariList[new Date().getDay()];

      // ==========================================
      // 1. MODEL SISWA (Presensi Masuk & Pulang)
      // ==========================================
      if (activeKategori === "Siswa") {
        const jamPulangSiswa = cfg.jam_pulang_mulai || "14:00";
        const isTimeForPulang = jam >= jamPulangSiswa || (mode === "Pulang" && jam >= "12:00");

        if (!isTimeForPulang) {
          // Masuk Period for Siswa
          if (index !== -1 && reports[index].jam_masuk && reports[index].jam_masuk !== "-") {
            return { 
              success: true, 
              type: "info",
              message: `${nama} sudah melakukan presensi masuk hari ini (${reports[index].jam_masuk} WIB)! Belum jam pulang sekolah (Pk ${jamPulangSiswa} WIB).`, 
              data: reports[index] 
            };
          }

          const statusMasuk = (jam <= defaultJamMasukBatas) ? "Tepat Waktu" : "Terlambat";
          const idLog = "LOG-S-" + new Date().getTime();

          if (index !== -1) {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = statusMasuk;
            setStorage(reportsKey, reports);
            return { success: true, type: "masuk", message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, data: reports[index] };
          }

          const newRow = {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: jam,
            status_masuk: statusMasuk,
            jam_pulang: "-",
            status_pulang: "-",
            ket: "Scan Otomatis"
          };
          reports.push(newRow);
          setStorage(reportsKey, reports);
          return { success: true, type: "masuk", message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, data: newRow };
        } else {
          // Pulang Period for Siswa
          if (index !== -1) {
            reports[index].jam_pulang = jam;
            reports[index].status_pulang = "Tepat Waktu";
            setStorage(reportsKey, reports);
            return { success: true, type: "pulang", message: `Presensi Pulang Berhasil: ${nama}`, data: reports[index] };
          } else {
            const idLog = "LOG-S-" + new Date().getTime();
            const newRow = {
              id_log_siswa: idLog,
              tanggal: tgl,
              id_siswa: idTarget,
              nama_siswa: nama,
              kelas_jurusan: classKey,
              jam_masuk: "-",
              status_masuk: "Lupa Scan Masuk",
              jam_pulang: jam,
              status_pulang: "Tepat Waktu",
              ket: "Lupa Scan Masuk"
            };
            reports.push(newRow);
            setStorage(reportsKey, reports);
            return { success: true, type: "pulang", message: `Presensi Pulang Berhasil: ${nama} (Lupa Scan Masuk)`, data: newRow };
          }
        }
      }

      // ==========================================
      // 2. MODEL GURU (Fleksibel & Jadwal Mengajar)
      // ==========================================
      const flexList = getStorage("jadwal_guru") || [];
      const flexSchedule = flexList.find((j: any) => 
        (String(j.id_guru || "").toLowerCase() === String(idTarget).toLowerCase() || 
         String(j.nama_guru || "").toLowerCase() === String(nama).toLowerCase() ||
         isTeacherScheduleMatch(j)) &&
        ((j.hari || "").trim().toLowerCase() === hariIni.toLowerCase() || hariIni === "Minggu")
      );

      const guruJamMasukBatas = flexSchedule?.jam_masuk_batas || defaultJamMasukBatas;
      const guruJamPulangMulai = flexSchedule?.jam_pulang_mulai || defaultJamPulangMulai;

      // Helper for fuzzy & title-agnostic teacher name matching
      const normalizeName = (str: string) => {
        return String(str || "")
          .toLowerCase()
          .replace(/[,.]/g, " ")
          .replace(/\b(s|m|dr|drs|dra|prof|ir|h|hj)\s*\.?\s*(pd|kom|ag|is|si|se|mm|hum|st|pt|tp|sos|ip|ed|pdi|mat|bio|fis|med)\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      const isTeacherScheduleMatch = (scheduleItem: any) => {
        if (!scheduleItem) return false;
        const sGuruId = String(scheduleItem.id_guru || "").trim().toLowerCase();
        const sGuruName = String(scheduleItem.nama_guru || "").trim();
        const targetIdStr = String(idTarget || "").trim().toLowerCase();
        const targetNipStr = String(user?.nip_nuptk || user?.nip || "").trim().toLowerCase();
        const targetQrStr = String(user?.qr_content || user?.qr_code || "").trim().toLowerCase();
        const targetCleanCode = String(qrContent || "").trim().toLowerCase();

        if (sGuruId) {
          if (sGuruId === targetIdStr || sGuruId === targetNipStr || sGuruId === targetQrStr || sGuruId === targetCleanCode) return true;
          const sWithout = sGuruId.replace(/^(guru|id|nip|g)[_:\-\s]+/i, '');
          const tWithout = targetIdStr.replace(/^(guru|id|nip|g)[_:\-\s]+/i, '');
          if (sWithout && tWithout && sWithout === tWithout) return true;
        }

        if (sGuruName && nama) {
          const n1 = sGuruName.toLowerCase();
          const n2 = String(nama).toLowerCase();
          if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true;

          const norm1 = normalizeName(sGuruName);
          const norm2 = normalizeName(nama);
          if (norm1 && norm2 && (norm1 === norm2 || norm1.includes(norm2) || norm2.includes(norm1))) return true;
        }
        return false;
      };

      // Load teaching schedules and jam slots
      const allSchedules = getStorage("jadwal_pelajaran") || [];
      const jamSlots = getStorage("jam_pelajaran") || [
        { jam_ke: 1, jam_mulai: "07:00", jam_selesai: "07:45" },
        { jam_ke: 2, jam_mulai: "07:45", jam_selesai: "08:30" },
        { jam_ke: 3, jam_mulai: "08:30", jam_selesai: "09:15" },
        { jam_ke: 4, jam_mulai: "09:45", jam_selesai: "10:30" },
        { jam_ke: 5, jam_mulai: "10:30", jam_selesai: "11:15" },
        { jam_ke: 6, jam_mulai: "11:15", jam_selesai: "12:00" },
        { jam_ke: 7, jam_mulai: "13:00", jam_selesai: "13:45" },
        { jam_ke: 8, jam_mulai: "13:45", jam_selesai: "14:30" }
      ];

      // Filter teaching schedules for this teacher today
      let teacherDaySchedules = allSchedules.filter((s: any) => 
        isTeacherScheduleMatch(s) && ((s.hari || "").trim().toLowerCase() === hariIni.toLowerCase() || hariIni === "Minggu" || !s.hari)
      ).map((s: any) => {
        const slot = jamSlots.find((j: any) => Number(j.jam_ke) === Number(s.jam_ke));
        const slotMulai = s.jam_mulai || slot?.jam_mulai || "07:00";
        const slotSelesai = s.jam_selesai || slot?.jam_selesai || "07:45";
        return { ...s, slotMulai, slotSelesai };
      }).sort((a: any, b: any) => Number(a.jam_ke || 0) - Number(b.jam_ke || 0));

      // Fallback: if no schedule on Sunday/testing day, check if teacher has any schedule in system
      if (teacherDaySchedules.length === 0 && (hariIni === "Minggu" || allSchedules.length > 0)) {
        const anySched = allSchedules.filter((s: any) => isTeacherScheduleMatch(s));
        if (anySched.length > 0) {
          teacherDaySchedules = anySched.map((s: any) => {
            const slot = jamSlots.find((j: any) => Number(j.jam_ke) === Number(s.jam_ke));
            const slotMulai = s.jam_mulai || slot?.jam_mulai || "07:00";
            const slotSelesai = s.jam_selesai || slot?.jam_selesai || "07:45";
            return { ...s, slotMulai, slotSelesai };
          }).sort((a: any, b: any) => Number(a.jam_ke || 0) - Number(b.jam_ke || 0));
        }
      }

      const absLogs = getStorage("absensi_mengajar_guru") || [];
      const makeKey = (jKe: any, k: any, m: any) => `${Number(jKe)}_${String(k || "").trim().toLowerCase()}_${String(m || "").trim().toLowerCase()}`;

      const alreadyAttendedTeachingKeys = new Set(
        absLogs.filter((a: any) => a.tanggal === tgl && isTeacherScheduleMatch(a))
               .map((a: any) => makeKey(a.jam_ke, a.kelas, a.mapel))
      );

      const [hN, mN] = jam.split(":").map(Number);
      const nowMin = hN * 60 + mN;
      const [hP, mP] = guruJamPulangMulai.split(":").map(Number);
      const pulangMulaiMin = (!isNaN(hP) && !isNaN(mP)) ? (hP * 60 + mP) : (15 * 60 + 30);

      const toleransiGuruVal = Number(cfg.toleransi_guru ?? cfg.toleransi_mengajar_guru ?? 15);

      // Find the end time of teacher's last class today
      let lastClassEndMin = 0;
      if (teacherDaySchedules.length > 0) {
        const lastSched = teacherDaySchedules[teacherDaySchedules.length - 1];
        if (lastSched.slotSelesai && lastSched.slotSelesai !== "-") {
          const [hE, mE] = lastSched.slotSelesai.split(":").map(Number);
          if (!isNaN(hE) && !isNaN(mE)) lastClassEndMin = hE * 60 + mE;
        }
      }

      // Check if all teaching classes for today have been attended
      const totalTeachingClasses = teacherDaySchedules.length;
      const completedTeachingClasses = teacherDaySchedules.filter((s: any) => 
        alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
      ).length;
      const allTeachingClassesDone = totalTeachingClasses > 0 && completedTeachingClasses >= totalTeachingClasses;

      // Allow clocking out if:
      // 1. Current time >= guruJamPulangMulai
      // 2. OR all classes completed AND current time >= lastClassEndMin AND past 12:00
      const isTeacherPulangTime = (nowMin >= pulangMulaiMin) || 
                                  (allTeachingClassesDone && lastClassEndMin > 0 && nowMin >= lastClassEndMin && nowMin >= (12 * 60));

      // -------------------------------------------------------------
      // CASE A: TEACHER CLOCK OUT (PULANG)
      // -------------------------------------------------------------
      if (isTeacherPulangTime && (mode === "Pulang" || allTeachingClassesDone)) {
        if (index !== -1) {
          reports[index].jam_pulang = jam;
          reports[index].status_pulang = "Tepat Waktu";
          setStorage(reportsKey, reports);
          return { 
            success: true, 
            type: "pulang", 
            message: `Presensi Pulang Berhasil: ${nama} (${allTeachingClassesDone ? "Seluruh Jam Mengajar Selesai" : "Tepat Waktu"})`, 
            data: reports[index] 
          };
        } else {
          const idLog = "LOG-G-" + new Date().getTime();
          const newRow = {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: "-",
            status_masuk: "Lupa Scan Masuk",
            jam_pulang: jam,
            status_pulang: "Tepat Waktu",
            ket: "Lupa Scan Masuk"
          };
          reports.push(newRow);
          setStorage(reportsKey, reports);
          return { success: true, type: "pulang", message: `Presensi Pulang Berhasil: ${nama} (Lupa Scan Masuk)`, data: newRow };
        }
      }

      // -------------------------------------------------------------
      // CASE B: TEACHER HAS TEACHING SCHEDULES TODAY
      // -------------------------------------------------------------
      if (teacherDaySchedules.length > 0) {
        // 1. Check if current time matches an active teaching slot window (from 15 min before start until end + 25 min)
        let activeSlotMatch: any = null;
        let multiJamBlock: any[] = [];

        for (const sched of teacherDaySchedules) {
          if (sched.slotMulai && sched.slotMulai !== "-" && sched.slotSelesai && sched.slotSelesai !== "-") {
            const [hM, mM] = sched.slotMulai.split(":").map(Number);
            const [hS, mS] = sched.slotSelesai.split(":").map(Number);
            if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS)) {
              const startMin = hM * 60 + mM;
              const endMin = hS * 60 + mS;
              // Active window: from 15 min before lesson begins up to 25 min after lesson ends
              if (nowMin >= startMin - 15 && nowMin <= endMin + 25) {
                activeSlotMatch = sched;
                break;
              }
            }
          }
        }

        // 2. If not strictly within an active window, find the next unrecorded class schedule today
        if (!activeSlotMatch) {
          const firstUnrecorded = teacherDaySchedules.find((s: any) => 
            !alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
          );
          if (firstUnrecorded) {
            activeSlotMatch = firstUnrecorded;
          }
        }

        // 3. If an active or pending class is found that is NOT yet fully logged:
        if (activeSlotMatch && !alreadyAttendedTeachingKeys.has(makeKey(activeSlotMatch.jam_ke, activeSlotMatch.kelas, activeSlotMatch.mapel))) {
          // Find all consecutive hours for the same class and mapel today (1x Scan for multi-jam block)
          multiJamBlock = teacherDaySchedules.filter((s: any) => 
            String(s.kelas).trim().toLowerCase() === String(activeSlotMatch.kelas).trim().toLowerCase() &&
            String(s.mapel).trim().toLowerCase() === String(activeSlotMatch.mapel).trim().toLowerCase()
          );

          if (multiJamBlock.length === 0) multiJamBlock = [activeSlotMatch];

          // Determine attendance status based on schedule start time + tolerance
          const firstSlot = multiJamBlock[0];
          const [hM, mM] = (firstSlot.slotMulai || "07:00").split(":").map(Number);
          const firstStartMin = (!isNaN(hM) && !isNaN(mM)) ? (hM * 60 + mM) : (7 * 60);
          
          const statusMengajar = (nowMin <= firstStartMin + toleransiGuruVal) ? "Hadir Tepat Waktu" : "Terlambat Masuk Kelas";

          // Save ALL hours in the multi-jam block into absensi_mengajar_guru
          for (const schedItem of multiJamBlock) {
            const existingIdx = absLogs.findIndex((a: any) => 
              a.tanggal === tgl && 
              isTeacherScheduleMatch(a) &&
              Number(a.jam_ke) === Number(schedItem.jam_ke) &&
              String(a.kelas).trim().toLowerCase() === String(schedItem.kelas).trim().toLowerCase()
            );

            const logItem = {
              id_log_mengajar: existingIdx !== -1 ? absLogs[existingIdx].id_log_mengajar : "LOG-MENG-" + Date.now() + "-" + schedItem.jam_ke,
              tanggal: tgl,
              waktu_absen: jam,
              hari: hariIni !== "Minggu" ? hariIni : (schedItem.hari || "Senin"),
              id_guru: idTarget,
              nama_guru: nama,
              kelas: schedItem.kelas || "-",
              mapel: schedItem.mapel || "-",
              jam_ke: Number(schedItem.jam_ke || 1),
              jam_mulai_jadwal: schedItem.slotMulai || "07:00",
              jam_selesai_jadwal: schedItem.slotSelesai || "07:45",
              status: statusMengajar,
              catatan_materi: "Presensi Otomatis Barcode/QR"
            };

            if (existingIdx !== -1) absLogs[existingIdx] = logItem;
            else absLogs.push(logItem);
          }

          setStorage("absensi_mengajar_guru", absLogs);

          // ALSO ensure daily school attendance (laporan_guru) is recorded as Masuk
          const statusMasuk = (jam <= guruJamMasukBatas) ? "Tepat Waktu" : "Terlambat";
          if (index === -1) {
            const idLog = "LOG-G-" + new Date().getTime();
            reports.push({
              id_log_guru: idLog,
              tanggal: tgl,
              id_guru: idTarget,
              nama_guru: nama,
              jam_masuk: jam,
              status_masuk: statusMasuk,
              jam_pulang: "-",
              status_pulang: "-",
              ket: `Hadir Mengajar (${activeSlotMatch.mapel})`
            });
            setStorage(reportsKey, reports);
          } else if (!reports[index].jam_masuk || reports[index].jam_masuk === "-") {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = statusMasuk;
            reports[index].ket = `Hadir Mengajar (${activeSlotMatch.mapel})`;
            setStorage(reportsKey, reports);
          }

          const jamNumbers = multiJamBlock.map((s: any) => Number(s.jam_ke)).sort((a: number, b: number) => a - b);
          const jamLabel = jamNumbers.length > 1
            ? `Jam Ke-${jamNumbers[0]} s/d ${jamNumbers[jamNumbers.length - 1]}`
            : `Jam Ke-${jamNumbers[0] || activeSlotMatch.jam_ke}`;

          return {
            success: true,
            type: "mengajar",
            message: `Presensi Mengajar Berhasil: ${nama} (${activeSlotMatch.mapel} - ${activeSlotMatch.kelas}, ${jamLabel})`,
            data: {
              ...activeSlotMatch,
              nama_guru: nama,
              id_guru: idTarget,
              status: statusMengajar,
              jam_ke_label: jamLabel
            }
          };
        }

        // 4. If all classes for today are already recorded, or morning arrival before first class
        if (index === -1 || !reports[index].jam_masuk || reports[index].jam_masuk === "-") {
          // Record morning daily check-in
          const statusMasuk = (jam <= guruJamMasukBatas) ? "Tepat Waktu" : "Terlambat";
          const idLog = "LOG-G-" + new Date().getTime();
          const firstClass = teacherDaySchedules[0];

          const newRow = {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: jam,
            status_masuk: statusMasuk,
            jam_pulang: "-",
            status_pulang: "-",
            ket: `Jadwal: ${firstClass.mapel} (${firstClass.kelas})`
          };
          if (index !== -1) {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = statusMasuk;
            reports[index].ket = newRow.ket;
          } else {
            reports.push(newRow);
          }
          setStorage(reportsKey, reports);

          return { 
            success: true, 
            type: "masuk", 
            message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk}). Jadwal pertama: ${firstClass.mapel} (${firstClass.kelas}) Jam ke-${firstClass.jam_ke} (${firstClass.slotMulai} WIB)`, 
            data: newRow 
          };
        }

        // 5. Already recorded daily masuk & already recorded active class
        if (allTeachingClassesDone) {
          return {
            success: true,
            type: "info",
            message: `${nama} sudah menyelesaikan seluruh jadwal mengajar hari ini (${totalTeachingClasses} jam pelajaran). Jam pulang dibuka pk ${guruJamPulangMulai} WIB.`,
            data: reports[index]
          };
        }

        const nextPending = teacherDaySchedules.find((s: any) => 
          !alreadyAttendedTeachingKeys.has(makeKey(s.jam_ke, s.kelas, s.mapel))
        );

        return {
          success: true,
          type: "info",
          message: `${nama} sudah presensi masuk. Jadwal mengajar berikutnya: ${nextPending?.mapel || "Pelajaran"} (${nextPending?.kelas || "-"}) Jam Ke-${nextPending?.jam_ke || "-"} (${nextPending?.slotMulai || ""} WIB).`,
          data: reports[index]
        };
      }

      // -------------------------------------------------------------
      // CASE C: TEACHER WITH NO TEACHING SCHEDULE TODAY (HANYA HARIAN / FLEKSIBEL)
      // -------------------------------------------------------------
      if (index === -1 || !reports[index].jam_masuk || reports[index].jam_masuk === "-") {
        const statusMasuk = (jam <= guruJamMasukBatas) ? "Tepat Waktu" : "Terlambat";
        const idLog = "LOG-G-" + new Date().getTime();

        if (index !== -1) {
          reports[index].jam_masuk = jam;
          reports[index].status_masuk = statusMasuk;
          setStorage(reportsKey, reports);
          return { success: true, type: "masuk", message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, data: reports[index] };
        }

        const newRow = {
          id_log_guru: idLog,
          tanggal: tgl,
          id_guru: idTarget,
          nama_guru: nama,
          jam_masuk: jam,
          status_masuk: statusMasuk,
          jam_pulang: "-",
          status_pulang: "-",
          ket: flexSchedule ? "Guru Fleksibel" : "Harian"
        };
        reports.push(newRow);
        setStorage(reportsKey, reports);
        return { success: true, type: "masuk", message: `Presensi Masuk Berhasil: ${nama} (${statusMasuk})`, data: newRow };
      }

      // Teacher already clocked in, no teaching schedule, not yet clock-out time
      return {
        success: true,
        type: "info",
        message: `${nama} sudah presensi masuk (${reports[index].jam_masuk} WIB). Tidak ada jadwal mengajar hari ini. Jam pulang dibuka pk ${guruJamPulangMulai} WIB.`,
        data: reports[index]
      };
    }

    case "catatAbsensiSiswa": {
      const [idTarget, mode, status, keterangan, tanggal, jamCustom, namaSiswa, kelasJurusan] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = jamCustom || new Date().toTimeString().slice(0, 5);
      const reports = getStorage("laporan_siswa") || [];
      const master = getStorage("data_siswa") || [];
      
      const sObj = master.find((s: any) => 
        String(s.id_siswa || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(s.nisn || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(s.nama_siswa || "").toLowerCase() === String(namaSiswa || idTarget || "").toLowerCase()
      );
      
      const nama = namaSiswa || sObj?.nama_siswa || sObj?.nama || idTarget;
      const kelas = kelasJurusan || (sObj ? `${sObj.kelas || ""} ${sObj.jurusan || ""}`.trim() : "Siswa");
      const targetId = sObj?.id_siswa || idTarget;

      const idx = reports.findIndex((r: any) => r.tanggal === tgl && (r.id_siswa === targetId || r.id_target === targetId || String(r.nama_siswa || "").toLowerCase() === String(nama).toLowerCase()));
      const statusText = status || (mode === "Masuk" ? "Tepat Waktu" : "Sudah Pulang");

      if (idx !== -1) {
        if (mode === "Masuk") {
          reports[idx].jam_masuk = jam;
          reports[idx].status_masuk = statusText;
        } else {
          reports[idx].jam_pulang = jam;
          reports[idx].status_pulang = statusText;
        }
        if (keterangan) reports[idx].ket = keterangan;
        setStorage("laporan_siswa", reports);
        return { success: true, message: `Presensi Siswa Berhasil: ${nama}`, data: reports[idx] };
      } else {
        const idLog = "LOG-S-" + Date.now();
        const newRow = {
          id_log_siswa: idLog,
          tanggal: tgl,
          id_siswa: targetId,
          nama_siswa: nama,
          kelas_jurusan: kelas,
          jam_masuk: mode === "Masuk" ? jam : "-",
          status_masuk: mode === "Masuk" ? statusText : "Belum Absen",
          jam_pulang: mode === "Pulang" ? jam : "-",
          status_pulang: mode === "Pulang" ? statusText : "-",
          ket: keterangan || "Scan Auto Board"
        };
        reports.push(newRow);
        setStorage("laporan_siswa", reports);
        return { success: true, message: `Presensi Siswa Berhasil: ${nama}`, data: newRow };
      }
    }

    case "catatAbsensiGuru": {
      const [idTarget, mode, status, keterangan, tanggal, jamCustom, namaGuru, nip] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = jamCustom || new Date().toTimeString().slice(0, 5);
      const reports = getStorage("laporan_guru") || [];
      const master = getStorage("data_guru") || [];
      
      const gObj = master.find((g: any) => 
        String(g.id_guru || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(g.nip_nuptk || "").toLowerCase() === String(idTarget || "").toLowerCase() ||
        String(g.nama_guru || "").toLowerCase() === String(namaGuru || idTarget || "").toLowerCase()
      );
      
      const nama = namaGuru || gObj?.nama_guru || gObj?.nama || idTarget;
      const targetId = gObj?.id_guru || idTarget;

      const idx = reports.findIndex((r: any) => r.tanggal === tgl && (r.id_guru === targetId || r.id_target === targetId || String(r.nama_guru || "").toLowerCase() === String(nama).toLowerCase()));
      const statusText = status || (mode === "Masuk" ? "Tepat Waktu" : "Sudah Pulang");

      if (idx !== -1) {
        if (mode === "Masuk") {
          reports[idx].jam_masuk = jam;
          reports[idx].status_masuk = statusText;
        } else {
          reports[idx].jam_pulang = jam;
          reports[idx].status_pulang = statusText;
        }
        if (keterangan) reports[idx].ket = keterangan;
        setStorage("laporan_guru", reports);
        return { success: true, message: `Presensi Guru Berhasil: ${nama}`, data: reports[idx] };
      } else {
        const idLog = "LOG-G-" + Date.now();
        const newRow = {
          id_log_guru: idLog,
          tanggal: tgl,
          id_guru: targetId,
          nama_guru: nama,
          jam_masuk: mode === "Masuk" ? jam : "-",
          status_masuk: mode === "Masuk" ? statusText : "Belum Absen",
          jam_pulang: mode === "Pulang" ? jam : "-",
          status_pulang: mode === "Pulang" ? statusText : "-",
          ket: keterangan || "Scan Auto Board"
        };
        reports.push(newRow);
        setStorage("laporan_guru", reports);
        return { success: true, message: `Presensi Guru Berhasil: ${nama}`, data: newRow };
      }
    }

    case "simpanAbsenManual": {
      const [idTarget, kategori, mode, tanggal, status, keterangan, jamCustom] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jamDefault = mode === "Masuk" ? "07:00" : "15:30";
      const isAbsentStatus = status === "Sakit" || status === "Izin" || status === "Alfa" || status === "-";
      const jam = isAbsentStatus ? "-" : (jamCustom && jamCustom !== "-" ? jamCustom : jamDefault);
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      
      if (index !== -1) {
        reports[index].tanggal = tgl;
        if (isAbsentStatus) {
          reports[index].status_masuk = status;
          reports[index].status_pulang = status;
          reports[index].jam_masuk = "-";
          reports[index].jam_pulang = "-";
        } else {
          if (mode === "Masuk") {
            reports[index].jam_masuk = jam;
            reports[index].status_masuk = status;
          } else {
            reports[index].jam_pulang = jam;
            reports[index].status_pulang = status;
          }
        }
        reports[index].ket = keterangan;
      } else {
        const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        const mList = getStorage(masterKey);
        const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
        if (user) {
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
          const nama = user[nameKey];
          const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
          const idLog = "LOG-" + new Date().getTime();
          
          const statusMasuk = isAbsentStatus ? status : (mode === "Masuk" ? status : "-");
          const statusPulang = isAbsentStatus ? status : (mode === "Pulang" ? status : "-");
          const jamMasuk = isAbsentStatus ? "-" : (mode === "Masuk" ? jam : "-");
          const jamPulang = isAbsentStatus ? "-" : (mode === "Pulang" ? jam : "-");

          const newRow = kategori === "Siswa" ? {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: jamMasuk,
            status_masuk: statusMasuk,
            jam_pulang: jamPulang,
            status_pulang: statusPulang,
            ket: keterangan
          } : {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: jamMasuk,
            status_masuk: statusMasuk,
            jam_pulang: jamPulang,
            status_pulang: statusPulang,
            ket: keterangan
          };
          reports.push(newRow);
        }
      }
      
      setStorage(reportsKey, reports);
      return { success: true, message: `Koreksi manual tanggal ${tgl} disimpan!` };
    }

    case "simpanKoreksiManual":
    case "editKehadiran":
    case "editKehadiranFull": {
      const [idTarget, kategori, tanggal, arg3, arg4, arg5, arg6, arg7] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";

      const dataObj = typeof arg3 === "object" && arg3 !== null ? arg3 : {
        jam_masuk: arg3 || "-",
        status_masuk: arg4 || "-",
        jam_pulang: arg5 || "-",
        status_pulang: arg6 || "-",
        ket: arg7 || "-"
      };
      
      const isAllEmpty = (dataObj.jam_masuk === "-" || !dataObj.jam_masuk) &&
                         (dataObj.status_masuk === "-" || !dataObj.status_masuk) &&
                         (dataObj.jam_pulang === "-" || !dataObj.jam_pulang) &&
                         (dataObj.status_pulang === "-" || !dataObj.status_pulang) &&
                         (dataObj.ket === "-" || !dataObj.ket || dataObj.ket === "");

      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
      
      if (index !== -1) {
        if (isAllEmpty) {
          reports.splice(index, 1);
        } else {
          reports[index].tanggal = tgl;
          if (dataObj.jam_masuk !== undefined) reports[index].jam_masuk = dataObj.jam_masuk;
          if (dataObj.status_masuk !== undefined) reports[index].status_masuk = dataObj.status_masuk;
          if (dataObj.jam_pulang !== undefined) reports[index].jam_pulang = dataObj.jam_pulang;
          if (dataObj.status_pulang !== undefined) reports[index].status_pulang = dataObj.status_pulang;
          if (dataObj.ket !== undefined) reports[index].ket = dataObj.ket;
        }
      } else if (!isAllEmpty) {
        const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        const mList = getStorage(masterKey);
        const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
        if (user) {
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
          const nama = user[nameKey];
          const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
          const idLog = "LOG-" + new Date().getTime();
          
          const newRow = kategori === "Siswa" ? {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: dataObj.jam_masuk || "-",
            status_masuk: dataObj.status_masuk || "-",
            jam_pulang: dataObj.jam_pulang || "-",
            status_pulang: dataObj.status_pulang || "-",
            ket: dataObj.ket || "-"
          } : {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: dataObj.jam_masuk || "-",
            status_masuk: dataObj.status_masuk || "-",
            jam_pulang: dataObj.jam_pulang || "-",
            status_pulang: dataObj.status_pulang || "-",
            ket: dataObj.ket || "-"
          };
          reports.push(newRow);
        }
      }
      
      setStorage(reportsKey, reports);
      return { success: true, message: `Kehadiran ${kategori} tanggal ${tgl} berhasil diperbarui!` };
    }

    case "editKehadiranBulk": {
      const [rows, kategori, tanggal] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      let reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const mList = getStorage(masterKey);

      rows.forEach((item: any) => {
        const idTarget = item.id_target;
        if (!idTarget) return;

        const index = reports.findIndex((r: any) => r.tanggal === tgl && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget));
        
        const hasData = (item.jam_masuk && item.jam_masuk !== "-") || 
                        (item.status_masuk && item.status_masuk !== "-") ||
                        (item.jam_pulang && item.jam_pulang !== "-") ||
                        (item.status_pulang && item.status_pulang !== "-") ||
                        (item.ket && item.ket !== "-");

        if (index !== -1) {
          if (hasData) {
            reports[index].jam_masuk = item.jam_masuk || "-";
            reports[index].status_masuk = item.status_masuk || "-";
            reports[index].jam_pulang = item.jam_pulang || "-";
            reports[index].status_pulang = item.status_pulang || "-";
            reports[index].ket = item.ket || "-";
          } else {
            // Remove from reports if all fields set to empty (-)
            reports = reports.filter((_: any, idx: number) => idx !== index);
          }
        } else {
          if (hasData) {
            const user = mList.find((x: any) => x[idKey] === idTarget || x.id_siswa === idTarget || x.id_guru === idTarget);
            if (user) {
              const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
              const nama = user[nameKey];
              const classKey = kategori === "Siswa" ? `${user.kelas} ${user.jurusan}` : "-";
              const idLog = "LOG-" + new Date().getTime() + "-" + Math.floor(Math.random() * 1000);

              const newRow = kategori === "Siswa" ? {
                id_log_siswa: idLog,
                tanggal: tgl,
                id_siswa: idTarget,
                nama_siswa: nama,
                kelas_jurusan: classKey,
                jam_masuk: item.jam_masuk || "-",
                status_masuk: item.status_masuk || "-",
                jam_pulang: item.jam_pulang || "-",
                status_pulang: item.status_pulang || "-",
                ket: item.ket || "-"
              } : {
                id_log_guru: idLog,
                tanggal: tgl,
                id_guru: idTarget,
                nama_guru: nama,
                jam_masuk: item.jam_masuk || "-",
                status_masuk: item.status_masuk || "-",
                jam_pulang: item.jam_pulang || "-",
                status_pulang: item.status_pulang || "-",
                ket: item.ket || "-"
              };
              reports.push(newRow);
            }
          }
        }
      });

      setStorage(reportsKey, reports);
      return { success: true, message: `Berhasil memperbarui ${rows.length} data kehadiran tanggal ${tgl}!` };
    }

    case "hapusKehadiran":
    case "hapusLogKehadiran":
    case "hapusAbsensi":
    case "hapusAbsen":
    case "deleteKehadiran": {
      const [idTarget, kategori, tanggal] = args;
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      let reports = getStorage(reportsKey);
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      
      reports = reports.filter((r: any) => !(r.tanggal === tanggal && (r[idKey] === idTarget || r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget)));
      setStorage(reportsKey, reports);
      return { success: true, message: `Data presensi ${kategori} pada tanggal ${tanggal} berhasil dihapus.` };
    }

    case "simpanBulkAbsenManual": {
      const [ids, kategori, mode, tanggal, status, keterangan] = args;
      ids.forEach((idTarget: string) => {
        callMock("simpanAbsenManual", [idTarget, kategori, mode, tanggal, status, keterangan]);
      });
      return { success: true, message: `Berhasil update ${ids.length} data absensi.` };
    }

    case "getLiveAbsenHariIni": {
      const [kategori, tanggal, filterKelas] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let master = getStorage(masterKey);
      if (!Array.isArray(master) || master.length === 0) {
        initMockDb();
        master = getStorage(masterKey);
      }
      
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      
      // O(1) Lookup Map for reports
      const reportMap = new Map<string, any>();
      if (Array.isArray(reports)) {
        for (const r of reports) {
          if (r.tanggal === tgl) {
            const rId = r[idKey] || r.id_siswa || r.id_guru || r.id_target;
            if (rId) reportMap.set(String(rId), r);
          }
        }
      }
      
      const result = master.map((m: any) => {
        const idTarget = m[idKey] || m.id || m.nisn || m.nip_nuptk || "";
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

        const rep = reportMap.get(String(idTarget)) || {};
        
        return {
          id_target: idTarget,
          nama_target: namaTarget,
          kelas_jurusan: kelasStr,
          tanggal: tgl,
          jam_masuk: rep.jam_masuk || "-",
          status_masuk: rep.status_masuk || "-",
          jam_pulang: rep.jam_pulang || "-",
          status_pulang: rep.status_pulang || "-",
          no_hp_ortu: m.no_hp_ortu || m.no_hp || "-",
          kategori: kategori,
          ket: rep.ket || "-"
        };
      });
      
      const filtered = result.filter((item: any) => {
        if (kategori === "Siswa" && filterKelas && filterKelas !== "Semua") {
          const kTarget = String(item.kelas_jurusan || "").toLowerCase().replace(/\s+/g, "");
          const kFilter = String(filterKelas).toLowerCase().replace(/\s+/g, "");
          return kTarget.includes(kFilter) || kFilter.includes(kTarget);
        }
        return true;
      });
      
      return { success: true, data: filtered };
    }

    case "getPresensiSiswa":
    case "getLaporanSiswa": {
      return { success: true, data: getStorage("laporan_siswa") };
    }

    case "getPresensiGuru":
    case "getLaporanGuru": {
      return { success: true, data: getStorage("laporan_guru") };
    }

    case "getLaporanPresensi":
    case "getLaporanFilter": {
      const [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta] = args;
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey) || [];
      
      const filtered = reports.filter((row: any) => {
        const rowTgl = formatToIsoDate(row.tanggal);
        if (!rowTgl) return false;

        // Date filter
        if (jenisFilter === "rentang" && tanggalMulai && tanggalSelesai) {
          if (rowTgl < tanggalMulai || rowTgl > tanggalSelesai) return false;
        } else if (jenisFilter === "bulan" && bulanMinta) {
          if (!rowTgl.startsWith(bulanMinta)) return false;
        }
        
        // Class filter
        if (kategori === "Siswa" && kelas && kelas !== "Semua") {
          const kJur = String(row.kelas_jurusan || row.kelas || "").replace(/[\s-]+/g, "").toLowerCase();
          const cleanKelas = String(kelas).replace(/[\s-]+/g, "").toLowerCase();
          if (!kJur.includes(cleanKelas) && !cleanKelas.includes(kJur)) return false;
        }
        
        return true;
      });
      
      return { success: true, data: filtered };
    }

    case "hitungRekapPersentase": {
      const [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta] = args;
      let masterData = getStorage(kategori === "Siswa" ? "data_siswa" : "data_guru") || [];
      
      if (kategori === "Siswa" && kelas && kelas !== "Semua") {
        const cleanKelas = String(kelas).replace(/[\s-]+/g, "").toLowerCase();
        masterData = masterData.filter((m: any) => {
          const kJur = `${m.kelas || ""} ${m.jurusan || ""}`.replace(/[\s-]+/g, "").toLowerCase();
          return kJur.includes(cleanKelas) || cleanKelas.includes(kJur);
        });
      }
      
      const rptRes = callMock("getLaporanFilter", [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta]);
      const rptData = extractArrayData(rptRes);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      
      const rekap = masterData.map((m: any) => {
        const idTarget = String(m[idKey] || m.id || "").trim();
        const nama = String(m[nameKey] || m.nama || "").trim();
        
        const userRpts = rptData.filter((r: any) => {
          const rId = String(r[idKey] || r.id_target || r.id_siswa || r.id_guru || "").trim();
          const rNama = String(r.nama_siswa || r.nama_guru || r.nama || "").trim();
          if (idTarget && rId && rId === idTarget) return true;
          if (nama && rNama && rNama.toLowerCase() === nama.toLowerCase()) return true;
          return false;
        });
        
        let hadir = 0;
        let sakit = 0;
        let izin = 0;
        let alfa = 0;
        const jamMasuks: string[] = [];
        const jamPulangs: string[] = [];
        
        userRpts.forEach((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          if (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir")) {
            hadir++;
          } else if (sm.includes("sakit")) {
            sakit++;
          } else if (sm.includes("izin")) {
            izin++;
          } else if (sm.includes("alfa") || sm.includes("alpha")) {
            alfa++;
          } else if (r.status_masuk && r.status_masuk !== "-") {
            hadir++;
          }
          
          if (r.jam_masuk && r.jam_masuk !== "-") jamMasuks.push(r.jam_masuk);
          if (r.jam_pulang && r.jam_pulang !== "-") jamPulangs.push(r.jam_pulang);
        });
        
        const totalDays = hadir + sakit + izin + alfa;
        const persentase = totalDays === 0 ? "0%" : ((hadir / totalDays) * 100).toFixed(1) + "%";
        
        return {
          id: idTarget,
          nama: nama,
          hadir,
          sakit,
          izin,
          alfa,
          persentase,
          jam_masuk: jamMasuks.length > 0 ? jamMasuks.join(", ") : "-",
          jam_pulang: jamPulangs.length > 0 ? jamPulangs.join(", ") : "-"
        };
      });
      
      return { success: true, data: rekap };
    }

    case "getDashboardMetrics": {
      const siswaList = getStorage("data_siswa");
      const guruList = getStorage("data_guru");
      const siswaLaporan = getStorage("laporan_siswa");
      const guruLaporan = getStorage("laporan_guru");
      
      const tgl = new Date().toISOString().split("T")[0];
      
      const countStat = (list: any[], reports: any[], idKey: string) => {
        let hadirMasuk = 0;
        let hadirPulang = 0;
        let totalTepat = 0;
        let rawAlfa = 0;
        
        const todayRpts = reports.filter((r: any) => r.tanggal === tgl);
        
        todayRpts.forEach((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          const sp = String(r.status_pulang || "").toLowerCase();
          
          if (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir")) {
            hadirMasuk++;
            if (sm.includes("tepat")) {
              totalTepat++;
            }
          } else if (sm.includes("alfa") || sm.includes("alpha")) {
            rawAlfa++;
          }
          
          if (sp.includes("tepat") || sp.includes("terlambat") || sp.includes("lupa") || sp.includes("hadir") || sp.includes("pulang")) {
            hadirPulang++;
          }
        });
        
        const persentaseTepatInt = hadirMasuk > 0 ? Math.round((totalTepat / hadirMasuk) * 100) : 0;
        const persentaseTepat = persentaseTepatInt + "%";
        
        const pAlfa = list.length > 0 ? Math.round((rawAlfa / list.length) * 100) : 0;
        const pPulang = list.length > 0 ? Math.round((hadirPulang / list.length) * 100) : 0;
        
        return { hadirMasuk, hadirPulang, persentaseTepat, persentaseTepatInt, pAlfa, pPulang };
      };
      
      const statsSiswa = countStat(siswaList, siswaLaporan, "id_siswa");
      const statsGuru = countStat(guruList, guruLaporan, "id_guru");
      
      const chartLabels: string[] = [];
      const chartData: number[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayLabel = d.toLocaleDateString("id-ID", { month: "short", day: "numeric" });
        chartLabels.push(dayLabel);
        
        const count = siswaLaporan.filter((r: any) => {
          const sm = String(r.status_masuk || "").toLowerCase();
          return r.tanggal === dateStr && (sm.includes("tepat") || sm.includes("terlambat") || sm.includes("lupa") || sm.includes("hadir"));
        }).length;
        chartData.push(count);
      }
      
      return {
        success: true,
        data: {
          totalSiswa: siswaList.length,
          siswaMasuk: statsSiswa.hadirMasuk,
          siswaPulang: statsSiswa.hadirPulang,
          siswaTepat: statsSiswa.persentaseTepat,
          siswaTepatInt: statsSiswa.persentaseTepatInt,
          siswaPulangPersenInt: statsSiswa.pPulang,
          siswaAlfaInt: statsSiswa.pAlfa,
          
          totalGuru: guruList.length,
          guruMasuk: statsGuru.hadirMasuk,
          guruPulang: statsGuru.hadirPulang,
          guruTepat: statsGuru.persentaseTepat,
          guruTepatInt: statsGuru.persentaseTepatInt,
          guruPulangPersenInt: statsGuru.pPulang,
          guruAlfaInt: statsGuru.pAlfa,
          
          chartLabels,
          chartData
        }
      };
    }

    case "getUsersSemua": {
      return { success: true, data: getStorage("users") };
    }

    case "tambahUserData": {
      const [userObj] = args;
      const users = getStorage("users");
      if (users.some((u: any) => u.username.toLowerCase() === userObj.username.toLowerCase())) {
        return { success: false, message: "Username sudah terdaftar!" };
      }
      users.push({
        username: userObj.username,
        password: userObj.password || "123456",
        role: userObj.role || "TU",
        target_id: userObj.target_id || "-"
      });
      setStorage("users", users);
      return { success: true, message: "Berhasil menambahkan akun user baru (SIMULASI)." };
    }

    case "editUserData": {
      const [oldUsername, userObj] = args;
      const users = getStorage("users");
      const idx = users.findIndex((u: any) => u.username.toLowerCase() === oldUsername.toLowerCase());
      if (idx !== -1) {
        users[idx] = {
          username: userObj.username,
          password: userObj.password,
          role: userObj.role,
          target_id: userObj.target_id || "-"
        };
        setStorage("users", users);
        return { success: true, message: "Berhasil memperbarui data user (SIMULASI)." };
      }
      return { success: false, message: "User tidak ditemukan." };
    }

    case "hapusUserData": {
      const [username] = args;
      let users = getStorage("users");
      if (username.toLowerCase() === "admin") {
        return { success: false, message: "Akun admin utama tidak boleh dihapus!" };
      }
      users = users.filter((u: any) => u.username.toLowerCase() !== username.toLowerCase());
      setStorage("users", users);
      return { success: true, message: "User berhasil dihapus secara permanen (SIMULASI)." };
    }

    case "getJadwalGuruSemua": {
      if (!localStorage.getItem("MOCK_jadwal_guru")) {
        localStorage.setItem("MOCK_jadwal_guru", JSON.stringify([]));
      }
      return { success: true, data: getStorage("jadwal_guru") };
    }

    case "tambahJadwalGuru": {
      const [jadwalObj] = args;
      if (!localStorage.getItem("MOCK_jadwal_guru")) {
        localStorage.setItem("MOCK_jadwal_guru", JSON.stringify([]));
      }
      const list = getStorage("jadwal_guru");
      if (list.some((j: any) => j.id_guru === jadwalObj.id_guru && j.hari === jadwalObj.hari)) {
        return { success: false, message: `Jadwal untuk guru tersebut di hari ${jadwalObj.hari} sudah ada!` };
      }
      const idJadwal = "J-" + Math.floor(Math.random() * 10000);
      list.push({
        id_jadwal: idJadwal,
        id_guru: jadwalObj.id_guru,
        nama_guru: jadwalObj.nama_guru,
        hari: jadwalObj.hari,
        jam_masuk_mulai: jadwalObj.jam_masuk_mulai,
        jam_masuk_batas: jadwalObj.jam_masuk_batas,
        jam_pulang_mulai: jadwalObj.jam_pulang_mulai
      });
      setStorage("jadwal_guru", list);
      return { success: true, message: "Jadwal guru berhasil disimpan (SIMULASI)." };
    }

    case "editJadwalGuru": {
      const [idJadwal, jadwalObj] = args;
      const list = getStorage("jadwal_guru");
      const idx = list.findIndex((j: any) => j.id_jadwal === idJadwal);
      if (idx !== -1) {
        list[idx] = {
          id_jadwal: idJadwal,
          id_guru: jadwalObj.id_guru,
          nama_guru: jadwalObj.nama_guru,
          hari: jadwalObj.hari,
          jam_masuk_mulai: jadwalObj.jam_masuk_mulai,
          jam_masuk_batas: jadwalObj.jam_masuk_batas,
          jam_pulang_mulai: jadwalObj.jam_pulang_mulai
        };
        setStorage("jadwal_guru", list);
        return { success: true, message: "Jadwal guru berhasil diperbarui (SIMULASI)." };
      }
      return { success: false, message: "Jadwal tidak ditemukan." };
    }

    case "hapusJadwalGuru": {
      const [idJadwal] = args;
      let list = getStorage("jadwal_guru");
      list = list.filter((j: any) => j.id_jadwal !== idJadwal);
      setStorage("jadwal_guru", list);
      return { success: true, message: "Jadwal guru berhasil dihapus (SIMULASI)." };
    }

    // Jam Pelajaran (Lesson Period Slots)
    case "getJamPelajaran":
    case "getJamPelajaranSemua":
    case "getJamPelajaranList": {
      return { success: true, data: getStorage("jam_pelajaran") };
    }

    case "simpanJamPelajaran":
    case "tambahJamPelajaran":
    case "editJamPelajaran": {
      const [jamObj, optionalPayload] = args;
      const actualObj = (typeof jamObj === "object" && jamObj !== null) ? jamObj : optionalPayload;
      if (!actualObj) return { success: false, message: "Data slot jam pelajaran tidak valid." };

      const list = getStorage("jam_pelajaran");
      const idJam = actualObj.id_jam || "JP-" + Date.now();
      
      const existingIdx = list.findIndex((j: any) => j.id_jam === idJam);
      const newObj = {
        id_jam: idJam,
        jam_ke: Number(actualObj.jam_ke || 0),
        nama_jam: actualObj.nama_jam || `Jam ke-${actualObj.jam_ke}`,
        jam_mulai: actualObj.jam_mulai || "07:00",
        jam_selesai: actualObj.jam_selesai || "07:45",
        tipe: actualObj.tipe || "Pelajaran"
      };

      if (existingIdx !== -1) {
        list[existingIdx] = newObj;
      } else {
        list.push(newObj);
      }
      list.sort((a: any, b: any) => (a.jam_mulai || "").localeCompare(b.jam_mulai || ""));
      setStorage("jam_pelajaran", list);
      return { success: true, message: "Slot jam pelajaran berhasil disimpan!" };
    }

    case "hapusJamPelajaran": {
      const [idJam] = args;
      let list = getStorage("jam_pelajaran");
      list = list.filter((j: any) => j.id_jam !== idJam);
      setStorage("jam_pelajaran", list);
      return { success: true, message: "Slot jam pelajaran berhasil dihapus." };
    }

    // Jadwal Pelajaran (Subject Schedule Matrix)
    case "getJadwalPelajaranSemua":
    case "getJadwalPelajaran":
    case "getJadwalSemua": {
      return { success: true, data: getStorage("jadwal_pelajaran") };
    }

    case "tambahJadwalPelajaran": {
      const [payload] = args;
      const list = getStorage("jadwal_pelajaran");
      const idJadwal = "JPEL-" + Math.floor(Math.random() * 100000);
      const newSchedule = {
        id_jadwal: idJadwal,
        hari: payload.hari,
        id_jam: payload.id_jam || "JP-" + payload.jam_ke,
        jam_ke: Number(payload.jam_ke || 1),
        jam_mulai: payload.jam_mulai || "-",
        jam_selesai: payload.jam_selesai || "-",
        kelas: payload.kelas,
        mapel: payload.mapel,
        id_guru: payload.id_guru,
        nama_guru: payload.nama_guru,
        ruangan: payload.ruangan || "-"
      };
      list.push(newSchedule);
      setStorage("jadwal_pelajaran", list);
      return { success: true, message: "Jadwal pelajaran berhasil ditambahkan (SIMULASI)." };
    }

    case "editJadwalPelajaran": {
      const [idJadwal, payload] = args;
      const list = getStorage("jadwal_pelajaran");
      const idx = list.findIndex((j: any) => j.id_jadwal === idJadwal);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          hari: payload.hari,
          id_jam: payload.id_jam || list[idx].id_jam,
          jam_ke: Number(payload.jam_ke || list[idx].jam_ke),
          jam_mulai: payload.jam_mulai || list[idx].jam_mulai,
          jam_selesai: payload.jam_selesai || list[idx].jam_selesai,
          kelas: payload.kelas,
          mapel: payload.mapel,
          id_guru: payload.id_guru,
          nama_guru: payload.nama_guru,
          ruangan: payload.ruangan || list[idx].ruangan || "-"
        };
        setStorage("jadwal_pelajaran", list);
        return { success: true, message: "Jadwal pelajaran berhasil diperbarui (SIMULASI)." };
      }
      return { success: false, message: "Jadwal pelajaran tidak ditemukan." };
    }

    case "hapusJadwalPelajaran": {
      const [idJadwal] = args;
      let list = getStorage("jadwal_pelajaran");
      list = list.filter((j: any) => j.id_jadwal !== idJadwal);
      setStorage("jadwal_pelajaran", list);
      return { success: true, message: "Jadwal pelajaran berhasil dihapus (SIMULASI)." };
    }

    // Absensi Mengajar Guru (Teacher Class Attendance per Lesson Period)
    case "getAbsensiMengajarGuru": {
      return { success: true, data: getStorage("absensi_mengajar_guru") };
    }

    case "simpanAbsensiMengajarGuru": {
      const [payload] = args;
      const list = getStorage("absensi_mengajar_guru");
      const jamList = getStorage("jam_pelajaran") || [];
      const idLog = "LOG-MENG-" + Date.now();
      const tgl = payload.tanggal || new Date().toISOString().split("T")[0];
      const timeStr = payload.waktu_absen || new Date().toTimeString().slice(0, 5);
      const jamNum = Number(payload.jam_ke || 1);
      const slot = jamList.find((j: any) => Number(j.jam_ke) === jamNum);

      let startJadwal = payload.jam_mulai_jadwal;
      let endJadwal = payload.jam_selesai_jadwal;
      if ((!startJadwal || startJadwal === "-") && slot) {
        startJadwal = slot.jam_mulai;
      }
      if ((!endJadwal || endJadwal === "-") && slot) {
        endJadwal = slot.jam_selesai;
      }

      // Check Schedule Time Window restriction if enabled
      const savedCfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      const batasiJam = savedCfg.batasi_jam_jadwal !== undefined ? Boolean(savedCfg.batasi_jam_jadwal) : true;
      const tolAwal = Number(savedCfg.toleransi_awal_menit ?? 15);
      const tolAkhir = Number(savedCfg.toleransi_akhir_menit ?? 30);

      if (batasiJam && startJadwal && startJadwal !== "-" && endJadwal && endJadwal !== "-") {
        const [hM, mM] = startJadwal.split(":").map(Number);
        const [hS, mS] = endJadwal.split(":").map(Number);
        const [hN, mN] = timeStr.split(":").map(Number);
        if (!isNaN(hM) && !isNaN(mM) && !isNaN(hS) && !isNaN(mS) && !isNaN(hN) && !isNaN(mN)) {
          const startMin = hM * 60 + mM;
          const endMin = hS * 60 + mS;
          const nowMin = hN * 60 + mN;

          if (nowMin < startMin - tolAwal) {
            return {
              success: false,
              message: `Presensi mengajar ditolak: Belum masuk jam jadwal pelajaran (${payload.mapel || "Pelajaran"} ${payload.kelas || ""}). Jam pelajaran dimulai pukul ${startJadwal}. Saat ini jam ${timeStr}.`
            };
          }
          if (nowMin > endMin + tolAkhir) {
            return {
              success: false,
              message: `Presensi mengajar ditolak: Waktu absen (${timeStr}) berada di luar jam jadwal pelajaran (${startJadwal} - ${endJadwal}).`
            };
          }
        }
      }

      // Check if already logged for same guru, date, kelas, jam_ke
      const existingIdx = list.findIndex(
        (item: any) =>
          item.tanggal === tgl &&
          item.id_guru === payload.id_guru &&
          item.kelas === payload.kelas &&
          Number(item.jam_ke) === jamNum
      );

      const logItem = {
        id_log_mengajar: existingIdx !== -1 ? list[existingIdx].id_log_mengajar : idLog,
        tanggal: tgl,
        waktu_absen: timeStr,
        hari: payload.hari || "Senin",
        id_guru: payload.id_guru,
        nama_guru: payload.nama_guru,
        kelas: payload.kelas,
        mapel: payload.mapel,
        jam_ke: jamNum,
        jam_mulai_jadwal: startJadwal || "-",
        jam_selesai_jadwal: endJadwal || "-",
        status: payload.status || "Hadir Tepat Waktu",
        catatan_materi: payload.catatan_materi || "-"
      };

      if (existingIdx !== -1) {
        list[existingIdx] = logItem;
      } else {
        list.push(logItem);
      }

      setStorage("absensi_mengajar_guru", list);
      return { success: true, message: `Presensi mengajar ${payload.nama_guru} kelas ${payload.kelas} jam ke-${payload.jam_ke} berhasil dicatat!` };
    }

    case "hapusAbsensiMengajarGuru": {
      const [idLog] = args;
      let list = getStorage("absensi_mengajar_guru");
      list = list.filter((item: any) => item.id_log_mengajar !== idLog);
      setStorage("absensi_mengajar_guru", list);
      return { success: true, message: "Riwayat presensi mengajar berhasil dihapus (SIMULASI)." };
    }

    case "buatStrukturDatabaseOtomatis": {
      localStorage.removeItem(getStorageKey("MOCK_users"));
      localStorage.removeItem(getStorageKey("MOCK_data_siswa"));
      localStorage.removeItem(getStorageKey("MOCK_data_guru"));
      localStorage.removeItem(getStorageKey("MOCK_laporan_siswa"));
      localStorage.removeItem(getStorageKey("MOCK_laporan_guru"));
      localStorage.removeItem(getStorageKey("MOCK_pengaturan_jam"));
      localStorage.removeItem(getStorageKey("MOCK_hari_libur"));
      localStorage.removeItem(getStorageKey("MOCK_data_kelas"));
      localStorage.removeItem(getStorageKey("MOCK_jadwal_guru"));
      initMockDb();
      localStorage.setItem(getStorageKey("MOCK_jadwal_guru"), JSON.stringify([]));
      return { success: true, message: "Struktur database berhasil dibuat ulang (SIMULASI)!" };
    }

    default:
      return { success: false, message: "Action not simulated: " + action };
  }
}

export function isInvalidWali(s: any): boolean {
  if (!s) return true;
  const str = String(s).trim().toLowerCase();
  return (
    str === "" ||
    str === "-" ||
    str === "null" ||
    str === "undefined" ||
    str === "wali" ||
    str === "wali kelas" ||
    str === "wali_kelas" ||
    str === "walikelas" ||
    str === "pilih wali" ||
    str.includes("pilih wali") ||
    str.includes("-- pilih") ||
    str.includes("belum sesuai") ||
    str.includes("belum ada") ||
    str.includes("belum ditentukan")
  );
}

export function cleanTimeHHMM(val: any): string {
  if (!val || val === "-") return "";
  let str = String(val).trim();
  if (str.indexOf("T") !== -1) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
      }
    } catch (e) {}
    const timePart = str.split("T")[1];
    if (timePart) str = timePart.substring(0, 5);
  }
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, "0");
    const m = match[2];
    return `${h}:${m}`;
  }
  return str;
}

// Main bridge function to invoke Apps Script Web App actions
export async function callGas(action: string, args: any[] = []): Promise<any> {
  if (isUsingMock()) {
    await new Promise((resolve) => setTimeout(resolve, 80));
    return callMock(action, args);
  }
  
  const url = getGasUrl();
  const token = getGasToken();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const bodyObj: any = { action, args, token };
    if (args && args.length > 0) {
      if (action === "editKelas") {
        const kLama = typeof args[0] === "string" ? args[0] : (args[0]?.nama_kelas || args[0]?.kelas || "");
        const kBaru = typeof args[1] === "string" ? args[1] : (args[1]?.nama_kelas || args[1]?.kelas || kLama);
        const wRaw = typeof args[2] === "string" ? args[2] : (args[2]?.wali_kelas || args[2]?.wali || args[2]?.waliKelas || args[2]?.nama_guru || args[2]?.guru_wali || "-");
        const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
        const idG = typeof args[3] === "string" ? args[3] : (args[2]?.id_guru || args[4]?.id_guru || "-");

        bodyObj.kelasLama = kLama;
        bodyObj.kelasBaru = kBaru;
        bodyObj.nama_kelas = kBaru;
        bodyObj.kelas = kBaru;
        bodyObj.namaKelas = kBaru;
        bodyObj.id_guru = idG;
        bodyObj.idGuru = idG;
        bodyObj.id_wali = idG;
        bodyObj.wali_kelas = wVal;
        bodyObj.wali = wVal;
        bodyObj.waliKelas = wVal;
        bodyObj.nama_guru = wVal;
        bodyObj.guru_wali = wVal;
        bodyObj.walikelas = wVal;
        bodyObj.guruWali = wVal;
        bodyObj.wali_kelas_nama = wVal;

        // Synchronize local storage immediately
        let currentK = getStorage("data_kelas") || [];
        if (!Array.isArray(currentK)) currentK = [];
        const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kLama);
        if (idx !== -1) {
          currentK[idx] = { nama_kelas: kBaru, id_guru: idG, wali_kelas: wVal };
        } else {
          currentK.push({ nama_kelas: kBaru, id_guru: idG, wali_kelas: wVal });
        }
        setStorage("data_kelas", currentK);
      } else if (action === "simpanWaliKelas" || action === "tambahKelas") {
        const kNama = typeof args[0] === "string" ? args[0] : (args[0]?.nama_kelas || args[0]?.kelas || "");
        const wRaw = typeof args[1] === "string" ? args[1] : (args[1]?.wali_kelas || args[1]?.wali || args[1]?.waliKelas || args[1]?.nama_guru || args[1]?.guru_wali || "-");
        const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
        const idG = typeof args[2] === "string" ? args[2] : (args[1]?.id_guru || args[3]?.id_guru || "-");

        bodyObj.nama_kelas = kNama;
        bodyObj.kelas = kNama;
        bodyObj.namaKelas = kNama;
        bodyObj.id_guru = idG;
        bodyObj.idGuru = idG;
        bodyObj.id_wali = idG;
        bodyObj.wali_kelas = wVal;
        bodyObj.wali = wVal;
        bodyObj.waliKelas = wVal;
        bodyObj.nama_guru = wVal;
        bodyObj.guru_wali = wVal;
        bodyObj.walikelas = wVal;
        bodyObj.guruWali = wVal;
        bodyObj.wali_kelas_nama = wVal;

        // Synchronize local storage immediately
        let currentK = getStorage("data_kelas") || [];
        if (!Array.isArray(currentK)) currentK = [];
        const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kNama);
        if (idx !== -1) {
          currentK[idx] = { nama_kelas: kNama, id_guru: idG, wali_kelas: wVal };
        } else {
          currentK.push({ nama_kelas: kNama, id_guru: idG, wali_kelas: wVal });
        }
        setStorage("data_kelas", currentK);
      } else if (action === "editDataMaster" || action === "tambahDataMaster") {
        const cat = args[0];
        if (cat === "Kelas") {
          const itemObj = typeof args[1] === "object" ? args[1] : (typeof args[2] === "object" ? args[2] : {});
          const kNama = itemObj.nama_kelas || itemObj.kelas || (typeof args[1] === "string" ? args[1] : "");
          const wRaw = itemObj.wali_kelas || itemObj.wali || itemObj.waliKelas || itemObj.nama_guru || itemObj.guru_wali || "-";
          const wVal = isInvalidWali(wRaw) ? "-" : String(wRaw).trim();
          const idG = itemObj.id_guru || itemObj.idGuru || itemObj.id_wali || "-";

          bodyObj.nama_kelas = kNama;
          bodyObj.kelas = kNama;
          bodyObj.namaKelas = kNama;
          bodyObj.id_guru = idG;
          bodyObj.idGuru = idG;
          bodyObj.id_wali = idG;
          bodyObj.wali_kelas = wVal;
          bodyObj.wali = wVal;
          bodyObj.waliKelas = wVal;
          bodyObj.nama_guru = wVal;
          bodyObj.guru_wali = wVal;
          bodyObj.walikelas = wVal;
          bodyObj.guruWali = wVal;
          bodyObj.wali_kelas_nama = wVal;

          let currentK = getStorage("data_kelas") || [];
          if (!Array.isArray(currentK)) currentK = [];
          const idx = currentK.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kNama);
          if (idx !== -1) {
            currentK[idx] = { nama_kelas: kNama, id_guru: idG, wali_kelas: wVal };
          } else {
            currentK.push({ nama_kelas: kNama, id_guru: idG, wali_kelas: wVal });
          }
          setStorage("data_kelas", currentK);
        }
      }

      // Explicit sheet destination mapping according to system architecture
      const actLower = String(action || "").toLowerCase();
      const firstArg = typeof args[0] === "string" ? args[0] : "";
      const secondArg = typeof args[1] === "string" ? args[1] : "";

      if (
        action === "getPresensiSiswa" ||
        action === "catatAbsensiSiswa" ||
        (actLower.includes("laporan") && (firstArg === "Siswa" || secondArg === "Siswa")) ||
        (action === "prosesScanQR" && (secondArg === "Siswa" || firstArg === "Siswa")) ||
        (action === "simpanAbsenManual" && secondArg === "Siswa")
      ) {
        bodyObj.sheet_name = "PresensiSiswa";
        bodyObj.sheetName = "PresensiSiswa";
        bodyObj.target_sheet = "PresensiSiswa";
        bodyObj.targetSheet = "PresensiSiswa";
      } else if (
        action === "getPresensiGuru" ||
        action === "catatAbsensiGuru" ||
        (actLower.includes("laporan") && (firstArg === "Guru" || secondArg === "Guru")) ||
        (action === "prosesScanQR" && (secondArg === "Guru" || firstArg === "Guru")) ||
        (action === "simpanAbsenManual" && secondArg === "Guru")
      ) {
        bodyObj.sheet_name = "PresensiGuru";
        bodyObj.sheetName = "PresensiGuru";
        bodyObj.target_sheet = "PresensiGuru";
        bodyObj.targetSheet = "PresensiGuru";
      } else if (
        actLower.includes("absensimengajar") ||
        actLower.includes("jadwalmengajar")
      ) {
        bodyObj.sheet_name = "AbsensiMengajar";
        bodyObj.sheetName = "AbsensiMengajar";
        bodyObj.target_sheet = "AbsensiMengajar";
        bodyObj.targetSheet = "AbsensiMengajar";
      }

      for (const a of args) {
        if (typeof a === "object" && a !== null && !Array.isArray(a)) {
          Object.assign(bodyObj, a);
        }
      }
    }

    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify(bodyObj),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    if (result && result.success === false && result.message && (
      result.message.includes("tidak diizinkan") || 
      result.message.includes("tidak dikenal") ||
      result.message.includes("tidak ditemukan") ||
      result.message.includes("not recognized")
    )) {
      console.warn(`GAS Action '${action}' not recognized by remote Web App endpoint. Falling back to local storage execution.`);
      return callMock(action, args);
    }

    // Auto-sync valid cloud data to local storage for offline & fallback consistency
    if (result && result.success !== false) {
      try {
        if (action.includes("JamPelajaran")) {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jam_pelajaran", list);
        } else if (action.includes("JadwalPelajaran") || action === "getJadwalSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jadwal_pelajaran", list);
        } else if (action === "getJadwalGuruSemua" || action === "getJadwalGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("jadwal_guru", list);
        } else if (action.includes("Pengaturan") || action.includes("KonfigurasiJam")) {
          let rawObj = result && typeof result === "object" ? (result.data || result) : null;
          let jMulai = "";
          let jBatas = "";
          let jPulang = "";

          if (Array.isArray(rawObj)) {
            for (const item of rawObj) {
              if (typeof item === "object" && item) {
                const k = String(item.kunci || item.key || item.parameter || item.nama || item.kategori || "").toLowerCase();
                const rawV = item.nilai || item.value || item.isi || "";
                const v = cleanTimeHHMM(rawV);
                if (v) {
                  if (k.includes("masuk_mulai") || k.includes("masuk_awal")) jMulai = v;
                  if (k.includes("masuk_batas") || k.includes("terlambat")) jBatas = v;
                  if (k.includes("pulang_mulai") || k.includes("pulang_awal")) jPulang = v;
                }
              }
            }
          } else if (rawObj && typeof rawObj === "object") {
            jMulai = cleanTimeHHMM(rawObj.jam_masuk_mulai || rawObj.jam_masuk);
            jBatas = cleanTimeHHMM(rawObj.jam_masuk_batas || rawObj.jam_batas);
            jPulang = cleanTimeHHMM(rawObj.jam_pulang_mulai || rawObj.jam_pulang);
          }
          if (jMulai || jBatas || jPulang) {
            const savedCfg = {
              jam_masuk_mulai: jMulai || "06:00",
              jam_masuk_batas: jBatas || "07:15",
              jam_pulang_mulai: jPulang || "15:30"
            };
            localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(savedCfg));
            localStorage.setItem(getStorageKey("pengaturan_jam"), JSON.stringify(savedCfg));
          }
        } else if (action === "getDataMaster") {
          const cat = args[0];
          const rawList = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (rawList) {
            const nameKey = cat === "Siswa" ? "nama_siswa" : "nama_guru";
            const identifierKey = cat === "Siswa" ? "nisn" : "nip_nuptk";
            const cleanList = rawList.filter((item: any) => {
              if (!item || typeof item !== "object") return false;
              const name = String(item[nameKey] || item.nama || item.name || "").trim();
              const identifier = String(item[identifierKey] || "").trim();
              return Boolean((name && name !== "-") || (identifier && identifier !== "-"));
            });
            setStorage(cat === "Siswa" ? "data_siswa" : "data_guru", cleanList);
          }
        } else if (action === "getKelasSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) {
            const existing = getStorage("data_kelas") || [];
            const mergedMap = new Map<string, { id_guru: string; wali_kelas: string }>();

            // 1. Add existing local entries
            for (const ex of existing) {
              if (typeof ex === "string") {
                if (!mergedMap.has(ex)) mergedMap.set(ex, { id_guru: "-", wali_kelas: "-" });
              } else if (typeof ex === "object" && ex) {
                const name = String(ex.nama_kelas || ex.kelas || "").trim();
                const wali = String(ex.wali_kelas || ex.wali || ex.waliKelas || ex["Wali Kelas"] || "-").trim();
                const idG = String(ex.id_guru || ex.id_wali || ex.idGuru || "-").trim();
                if (name) {
                  if (!mergedMap.has(name) || (mergedMap.get(name)?.wali_kelas === "-" && wali !== "-")) {
                    mergedMap.set(name, { id_guru: idG, wali_kelas: wali });
                  }
                }
              }
            }

            // 2. Add/merge API list
            for (const item of list) {
              const name = String(typeof item === "string" ? item : (item.nama_kelas || item.kelas || "")).trim();
              const waliFromApi = String(typeof item === "object" && item ? (item.wali_kelas || item.wali || item.waliKelas || item.guru_wali || item.nama_guru || item.wali_kelas_nama || item["Wali Kelas"] || "-") : "-").trim();
              const idGFromApi = String(typeof item === "object" && item ? (item.id_guru || item.id_wali || item.idGuru || "-") : "-").trim();
              if (name) {
                const existingObj = mergedMap.get(name) || { id_guru: "-", wali_kelas: "-" };
                const cleanWaliFromApi = isInvalidWali(waliFromApi) ? "-" : waliFromApi;
                const finalWali = (cleanWaliFromApi && cleanWaliFromApi !== "-") ? cleanWaliFromApi : existingObj.wali_kelas;
                const finalIdG = (idGFromApi && idGFromApi !== "-") ? idGFromApi : existingObj.id_guru;
                mergedMap.set(name, { id_guru: finalIdG, wali_kelas: finalWali });
              }
            }

            const merged = Array.from(mergedMap.entries()).map(([nama_kelas, val]) => ({
              nama_kelas,
              id_guru: val.id_guru,
              wali_kelas: val.wali_kelas
            }));

            setStorage("data_kelas", merged);
          }
        } else if (action === "getHariLiburSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("hari_libur", list);
        } else if (action === "getAbsensiMengajarGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage("absensi_mengajar_guru", list);
        } else if (action === "getLaporanFilter" || action === "getLaporanPresensi" || action === "getPresensiSiswa" || action === "getPresensiGuru" || action === "getLaporanSiswa" || action === "getLaporanGuru") {
          const list = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : null);
          if (list && Array.isArray(list)) {
            const isSiswa = args[0] === "Siswa" || action.includes("Siswa");
            setStorage(isSiswa ? "laporan_siswa" : "laporan_guru", list);
          }
        }
      } catch (e) {
        console.warn("Auto storage sync error:", e);
      }
    }

    return result;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("GAS API Call error/timeout, falling back to local simulation:", err);
    return callMock(action, args);
  }
}
