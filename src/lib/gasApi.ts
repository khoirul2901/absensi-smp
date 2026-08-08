/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Key for storing the GAS URL
export const GAS_URL_STORAGE_KEY = "SIAS_GAS_URL";
export const GAS_TOKEN_STORAGE_KEY = "SIAS_GAS_TOKEN";

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
  if (res.jam_pelajaran && Array.isArray(res.jam_pelajaran)) return res.jam_pelajaran;
  if (res.jadwal_pelajaran && Array.isArray(res.jadwal_pelajaran)) return res.jadwal_pelajaran;
  if (res.jadwal_guru && Array.isArray(res.jadwal_guru)) return res.jadwal_guru;
  if (res.laporan && Array.isArray(res.laporan)) return res.laporan;
  if (res.presensi && Array.isArray(res.presensi)) return res.presensi;
  if (res.absensi && Array.isArray(res.absensi)) return res.absensi;
  if (res.presensiSiswa && Array.isArray(res.presensiSiswa)) return res.presensiSiswa;
  if (res.presensiGuru && Array.isArray(res.presensiGuru)) return res.presensiGuru;
  if (res.absensiMengajar && Array.isArray(res.absensiMengajar)) return res.absensiMengajar;
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
      { nama_kelas: "X RPL 1", wali_kelas: "Bahrul Ulum, S.Kom" },
      { nama_kelas: "X RPL 2", wali_kelas: "-" },
      { nama_kelas: "XI RPL 1", wali_kelas: "Eka Rahmawati, S.Pd" },
      { nama_kelas: "XI RPL 2", wali_kelas: "-" },
      { nama_kelas: "XII RPL 1", wali_kelas: "-" }
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

    case "simpanKonfigurasiJam":
    case "simpanPengaturanJam":
    case "simpanPengaturan": {
      const [jamMasukMulai, jamMasukBatas, jamPulangMulai] = args;
      const cfg = { jam_masuk_mulai: jamMasukMulai, jam_masuk_batas: jamMasukBatas, jam_pulang_mulai: jamPulangMulai };
      localStorage.setItem(getStorageKey("MOCK_pengaturan_jam"), JSON.stringify(cfg));
      return { success: true, message: "Pengaturan Jam Operasional disimpan!" };
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
          return { nama_kelas: item, wali_kelas: "-" };
        }
        const rawWali = item.wali_kelas || item.wali || item.waliKelas || item["Wali Kelas"] || item["wali_kelas"] || "-";
        const cleanWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
        return {
          nama_kelas: item.nama_kelas || item.kelas || String(item),
          wali_kelas: cleanWali
        };
      });
      return { success: true, data: normalized };
    }

    case "tambahKelas": {
      const [namaKelas, waliKelas, payloadObj] = args;
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const obj = (typeof payloadObj === "object" && payloadObj !== null) ? payloadObj : {};
      const rawWali = typeof waliKelas === "string" ? waliKelas : (obj.wali_kelas || obj.wali || obj.nama_guru || obj.waliKelas || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      if (idx === -1) {
        kelas.push({ nama_kelas: namaKelas, wali_kelas: chosenWali });
      } else {
        kelas[idx] = { nama_kelas: namaKelas, wali_kelas: chosenWali };
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
      const [kelasLama, kelasBaru, waliKelasBaru, payloadObj] = args;
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === kelasLama);
      const obj = (typeof payloadObj === "object" && payloadObj !== null) ? payloadObj : {};
      const rawWali = typeof waliKelasBaru === "string" ? waliKelasBaru : (obj.wali_kelas || obj.wali || obj.nama_guru || obj.waliKelas || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      if (idx !== -1) {
        kelas[idx] = {
          nama_kelas: kelasBaru,
          wali_kelas: chosenWali
        };
      } else {
        kelas.push({
          nama_kelas: kelasBaru,
          wali_kelas: chosenWali
        });
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: "Kelas diperbarui (SIMULASI)." };
    }

    case "simpanWaliKelas": {
      const [namaKelas, waliKelas, payloadObj] = args;
      let kelas = getStorage("data_kelas");
      if (!Array.isArray(kelas)) kelas = [];
      const idx = kelas.findIndex((k: any) => (typeof k === "string" ? k : (k.nama_kelas || k.kelas)) === namaKelas);
      const obj = (typeof payloadObj === "object" && payloadObj !== null) ? payloadObj : {};
      const rawWali = typeof waliKelas === "string" ? waliKelas : (obj.wali_kelas || obj.wali || obj.nama_guru || obj.waliKelas || "-");
      const chosenWali = isInvalidWali(rawWali) ? "-" : String(rawWali).trim();
      if (idx !== -1) {
        kelas[idx] = {
          nama_kelas: typeof kelas[idx] === "string" ? kelas[idx] : (kelas[idx].nama_kelas || namaKelas),
          wali_kelas: chosenWali
        };
      } else {
        kelas.push({ nama_kelas: namaKelas, wali_kelas: chosenWali });
      }
      setStorage("data_kelas", kelas);
      return { success: true, message: `Wali kelas untuk ${namaKelas} berhasil disimpan!` };
    }

    case "getDataMaster": {
      const [kategori] = args;
      const key = kategori === "Siswa" ? "data_siswa" : "data_guru";
      let data = getStorage(key);
      let changed = false;
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const identifierKey = kategori === "Siswa" ? "nisn" : "nip_nuptk";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      
      data = data.map((item: any) => {
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
      list = list.filter((x: any) => x[idKey] !== idTarget);
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
      const master = getStorage(masterKey);
      const user = master.find((x: any) => x.qr_content === qrContent);
      
      if (!user) return { success: false, message: "QR Code tidak valid atau tidak terdaftar!" };
      
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = new Date().toTimeString().slice(0, 5);
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const idTarget = user[idKey];
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const nama = user[nameKey];
      const classKey = kategori === "Siswa" ? `${user.kelas} - ${user.jurusan}` : "-";
      
      // Check for duplicate
      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r.id_siswa === idTarget || r.id_guru === idTarget || r.id_target === idTarget || r[idKey] === idTarget));
      const cfg = JSON.parse(localStorage.getItem(getStorageKey("MOCK_pengaturan_jam")) || "{}");
      
      if (mode === "Masuk") {
        if (index !== -1 && reports[index].jam_masuk !== "-") {
          return { success: false, message: "Pengguna sudah melakukan scan masuk hari ini!" };
        }
        if (jam < (cfg.jam_masuk_mulai || "06:00")) return { success: false, message: "Jam masuk belum dibuka." };
        
        const statusMasuk = (jam <= (cfg.jam_masuk_batas || "07:15")) ? "Tepat Waktu" : "Terlambat";
        const idLog = "LOG-" + new Date().getTime();
        
        const newRow = kategori === "Siswa" ? {
          id_log_siswa: idLog,
          tanggal: tgl,
          id_siswa: idTarget,
          nama_siswa: nama,
          kelas_jurusan: classKey,
          jam_masuk: jam,
          status_masuk: statusMasuk,
          jam_pulang: "-",
          status_pulang: "-",
          ket: "-"
        } : {
          id_log_guru: idLog,
          tanggal: tgl,
          id_guru: idTarget,
          nama_guru: nama,
          jam_masuk: jam,
          status_masuk: statusMasuk,
          jam_pulang: "-",
          status_pulang: "-",
          ket: "-"
        };
        
        reports.push(newRow);
        setStorage(reportsKey, reports);
        
        // Auto sync to absensi_mengajar_guru for Guru category based on schedule
        if (kategori === "Guru") {
          try {
            const hariList = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
            const hariIni = hariList[new Date().getDay()];
            const schedules = getStorage("jadwal_pelajaran") || [];
            const jamSlots = getStorage("jam_pelajaran") || [];
            const teacherSchedules = schedules.filter((s: any) => s.id_guru === idTarget && (s.hari === hariIni || hariIni === "Minggu"));
            if (teacherSchedules.length > 0) {
              const activeSlot = jamSlots.find((j: any) => jam >= j.jam_mulai && jam <= j.jam_selesai) || jamSlots[0];
              const matchSch = teacherSchedules.find((s: any) => s.jam_ke === (activeSlot?.jam_ke || 1)) || teacherSchedules[0];
              const jamMulai = matchSch.jam_mulai || activeSlot?.jam_mulai || "07:00";
              let statusMengajar = "Hadir Tepat Waktu";
              if (jamMulai && jamMulai !== "-") {
                const [hM, mM] = jamMulai.split(":").map(Number);
                const [hN, mN] = jam.split(":").map(Number);
                if (!isNaN(hM) && !isNaN(mM) && !isNaN(hN) && !isNaN(mN)) {
                  if (hN * 60 + mN > hM * 60 + mM + 15) {
                    statusMengajar = "Terlambat Masuk Kelas";
                  }
                }
              }
              const absLogs = getStorage("absensi_mengajar_guru") || [];
              const existingIdx = absLogs.findIndex((a: any) => a.tanggal === tgl && a.id_guru === idTarget && a.jam_ke === Number(matchSch.jam_ke));
              const logItem = {
                id_log_mengajar: existingIdx !== -1 ? absLogs[existingIdx].id_log_mengajar : "LOG-MENG-" + Date.now(),
                tanggal: tgl,
                waktu_absen: jam,
                hari: hariIni !== "Minggu" ? hariIni : "Senin",
                id_guru: idTarget,
                nama_guru: nama,
                kelas: matchSch.kelas || "X RPL 1",
                mapel: matchSch.mapel || "Pelajaran Umum",
                jam_ke: Number(matchSch.jam_ke || 1),
                jam_mulai_jadwal: jamMulai,
                jam_selesai_jadwal: matchSch.jam_selesai || activeSlot?.jam_selesai || "07:45",
                status: statusMengajar,
                catatan_materi: "Presensi Otomatis via Menu Absensi"
              };
              if (existingIdx !== -1) absLogs[existingIdx] = logItem;
              else absLogs.push(logItem);
              setStorage("absensi_mengajar_guru", absLogs);
            }
          } catch (e) { console.error("Auto sync guru schedule error", e); }
        }

        return { success: true, message: `Berhasil Absen Masuk (SIMULASI).\nStatus: ${statusMasuk}\nNama: ${nama}` };
      } else {
        // Mode Pulang
        if (jam < (cfg.jam_pulang_mulai || "15:30")) return { success: false, message: "Jam pulang belum dibuka." };
        
        if (index !== -1) {
          if (reports[index].jam_pulang !== "-") {
            return { success: false, message: "Pengguna sudah melakukan scan pulang hari ini!" };
          }
          reports[index].jam_pulang = jam;
          reports[index].status_pulang = "Tepat Waktu";
          setStorage(reportsKey, reports);
          return { success: true, message: `Berhasil Absen Pulang (SIMULASI).\nNama: ${nama}` };
        } else {
          // Lupa masuk
          const idLog = "LOG-" + new Date().getTime();
          const newRow = kategori === "Siswa" ? {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: "-",
            status_masuk: "Lupa Scan Masuk",
            jam_pulang: jam,
            status_pulang: "Tepat Waktu",
            ket: "-"
          } : {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: "-",
            status_masuk: "Lupa Scan Masuk",
            jam_pulang: jam,
            status_pulang: "Tepat Waktu",
            ket: "-"
          };
          reports.push(newRow);
          setStorage(reportsKey, reports);
          return { success: true, message: `Absen Pulang Berhasil (Peringatan: Lupa scan masuk, SIMULASI).\nNama: ${nama}` };
        }
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
    str === "wali" ||
    str === "wali kelas" ||
    str === "wali_kelas" ||
    str === "walikelas" ||
    str === "pilih wali" ||
    str.indexOf("pilih wali") !== -1 ||
    str.indexOf("-- pilih") !== -1
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
        if (typeof args[0] === "string") bodyObj.kelasLama = args[0];
        if (typeof args[1] === "string") {
          bodyObj.kelasBaru = args[1];
          bodyObj.nama_kelas = args[1];
          bodyObj.kelas = args[1];
        }
        if (typeof args[2] === "string") {
          const w = isInvalidWali(args[2]) ? "-" : args[2];
          bodyObj.wali_kelas = w;
          bodyObj.wali = w;
          bodyObj.waliKelas = w;
          bodyObj.nama_guru = w;
        }
      } else if (action === "simpanWaliKelas" || action === "tambahKelas") {
        if (typeof args[0] === "string") {
          bodyObj.nama_kelas = args[0];
          bodyObj.kelas = args[0];
        }
        if (typeof args[1] === "string") {
          const w = isInvalidWali(args[1]) ? "-" : args[1];
          bodyObj.wali_kelas = w;
          bodyObj.wali = w;
          bodyObj.waliKelas = w;
          bodyObj.nama_guru = w;
        }
      } else {
        if (typeof args[0] === "string") {
          bodyObj.nama_kelas = args[0];
          bodyObj.kelas = args[0];
        }
        if (typeof args[1] === "string") {
          bodyObj.wali_kelas = isInvalidWali(args[1]) ? "-" : args[1];
        }
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
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) setStorage(cat === "Siswa" ? "data_siswa" : "data_guru", list);
        } else if (action === "getKelasSemua") {
          const list = Array.isArray(result) ? result : (Array.isArray(result.data) ? result.data : null);
          if (list) {
            const existing = getStorage("data_kelas") || [];
            const mergedMap = new Map<string, string>();

            // 1. Add existing local entries
            for (const ex of existing) {
              if (typeof ex === "string") {
                if (!mergedMap.has(ex)) mergedMap.set(ex, "-");
              } else if (typeof ex === "object" && ex) {
                const name = String(ex.nama_kelas || ex.kelas || "").trim();
                const wali = String(ex.wali_kelas || ex.wali || ex.waliKelas || ex["Wali Kelas"] || "-").trim();
                if (name) {
                  if (!mergedMap.has(name) || (mergedMap.get(name) === "-" && wali !== "-")) {
                    mergedMap.set(name, wali);
                  }
                }
              }
            }

            // 2. Add/merge API list
            for (const item of list) {
              const name = String(typeof item === "string" ? item : (item.nama_kelas || item.kelas || "")).trim();
              const waliFromApi = String(typeof item === "object" && item ? (item.wali_kelas || item.wali || item.waliKelas || item.guru_wali || item["Wali Kelas"] || "-") : "-").trim();
              if (name) {
                const existingWali = mergedMap.get(name) || "-";
                const finalWali = (waliFromApi && waliFromApi !== "-") ? waliFromApi : existingWali;
                mergedMap.set(name, finalWali);
              }
            }

            const merged = Array.from(mergedMap.entries()).map(([nama_kelas, wali_kelas]) => ({
              nama_kelas,
              wali_kelas
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
