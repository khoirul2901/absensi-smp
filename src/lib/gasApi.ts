/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Key for storing the GAS URL
export const GAS_URL_STORAGE_KEY = "SIAS_GAS_URL";

export function getGasUrl(): string {
  const saved = localStorage.getItem(GAS_URL_STORAGE_KEY);
  if (saved) return saved.trim();
  return ((import.meta as any).env?.VITE_GAS_URL as string) || "";
}

export function setGasUrl(url: string): void {
  localStorage.setItem(GAS_URL_STORAGE_KEY, url.trim());
}

export function isUsingMock(): boolean {
  return !getGasUrl();
}

// Ensure mock database exists in localStorage
function initMockDb() {
  if (!localStorage.getItem("MOCK_users")) {
    localStorage.setItem("MOCK_users", JSON.stringify([
      { username: "admin", password: "admin123", role: "Admin", target_id: "-" }
    ]));
  }
  if (!localStorage.getItem("MOCK_data_siswa")) {
    localStorage.setItem("MOCK_data_siswa", JSON.stringify([
      { id_siswa: "S-001", nisn: "0081234567", nama_siswa: "Ahmad Dani", jenis_kelamin: "Laki-laki", kelas: "XI", jurusan: "RPL 1", no_hp_ortu: "08571234567", qr_content: "QR-S-001" },
      { id_siswa: "S-002", nisn: "0098765432", nama_siswa: "Siti Aminah", jenis_kelamin: "Perempuan", kelas: "XI", jurusan: "RPL 1", no_hp_ortu: "08129876543", qr_content: "QR-S-002" },
      { id_siswa: "S-003", nisn: "0076543210", nama_siswa: "Rizky Pratama", jenis_kelamin: "Laki-laki", kelas: "X", jurusan: "RPL 2", no_hp_ortu: "08132435465", qr_content: "QR-S-003" }
    ]));
  }
  if (!localStorage.getItem("MOCK_data_guru")) {
    localStorage.setItem("MOCK_data_guru", JSON.stringify([
      { id_guru: "G-001", nip_nuptk: "198706122015031002", nama_guru: "Bahrul Ulum, S.Kom", jenis_kelamin: "Laki-laki", jabatan_tugas: "Ka. Komli RPL", no_hp: "08123456789", qr_content: "QR-G-001" },
      { id_guru: "G-002", nip_nuptk: "199201042019082001", nama_guru: "Eka Rahmawati, S.Pd", jenis_kelamin: "Perempuan", jabatan_tugas: "Waka Kurikulum", no_hp: "08198765432", qr_content: "QR-G-002" }
    ]));
  }
  if (!localStorage.getItem("MOCK_laporan_siswa")) {
    localStorage.setItem("MOCK_laporan_siswa", JSON.stringify([]));
  }
  if (!localStorage.getItem("MOCK_laporan_guru")) {
    localStorage.setItem("MOCK_laporan_guru", JSON.stringify([]));
  }
  if (!localStorage.getItem("MOCK_pengaturan_jam")) {
    localStorage.setItem("MOCK_pengaturan_jam", JSON.stringify({
      jam_masuk_mulai: "06:00",
      jam_masuk_batas: "07:15",
      jam_pulang_mulai: "15:30"
    }));
  }
  if (!localStorage.getItem("MOCK_hari_libur")) {
    localStorage.setItem("MOCK_hari_libur", JSON.stringify([
      { tanggal: "2026-08-17", keterangan: "Hari Kemerdekaan RI" }
    ]));
  }
  if (!localStorage.getItem("MOCK_data_kelas")) {
    localStorage.setItem("MOCK_data_kelas", JSON.stringify(["X RPL 1", "X RPL 2", "XI RPL 1", "XI RPL 2", "XII RPL 1"]));
  }
}

// Call local mock APIs
function callMock(action: string, args: any[]): any {
  initMockDb();
  
  const getStorage = (key: string) => JSON.parse(localStorage.getItem("MOCK_" + key) || "[]");
  const setStorage = (key: string, val: any) => localStorage.setItem("MOCK_" + key, JSON.stringify(val));

  switch (action) {
    case "verifikasiLogin": {
      const [username, password] = args;
      const users = getStorage("users");
      const found = users.find((u: any) => u.username === username && u.password === password);
      if (found) {
        return { success: true, role: found.role, target_id: found.target_id, username: found.username, message: "Login Berhasil (SIMULASI)" };
      }
      return { success: false, message: "Kredensial Salah! (User default: admin / admin123)" };
    }
    
    case "ubahPasswordUser": {
      const [username, passwordLama, passwordBaru] = args;
      const users = getStorage("users");
      const index = users.findIndex((u: any) => u.username === username && u.password === passwordLama);
      if (index !== -1) {
        users[index].password = passwordBaru;
        setStorage("users", users);
        return { success: true, message: "Password berhasil diperbarui (SIMULASI)!" };
      }
      return { success: false, message: "Password lama tidak sesuai." };
    }

    case "getPengaturanSemua": {
      return JSON.parse(localStorage.getItem("MOCK_pengaturan_jam") || "{}");
    }

    case "simpanKonfigurasiJam": {
      const [jamMasukMulai, jamMasukBatas, jamPulangMulai] = args;
      const cfg = { jam_masuk_mulai: jamMasukMulai, jam_masuk_batas: jamMasukBatas, jam_pulang_mulai: jamPulangMulai };
      localStorage.setItem("MOCK_pengaturan_jam", JSON.stringify(cfg));
      return { success: true, message: "Pengaturan Jam Operasional disimpan (SIMULASI)." };
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
      return getStorage("data_kelas");
    }

    case "tambahKelas": {
      const [namaKelas] = args;
      const kelas = getStorage("data_kelas");
      if (!kelas.includes(namaKelas)) {
        kelas.push(namaKelas);
        setStorage("data_kelas", kelas);
      }
      return { success: true, message: "Kelas ditambahkan (SIMULASI)." };
    }

    case "hapusKelas": {
      const [namaKelas] = args;
      let kelas = getStorage("data_kelas");
      kelas = kelas.filter((k: any) => k !== namaKelas);
      setStorage("data_kelas", kelas);
      return { success: true, message: "Kelas dihapus (SIMULASI)." };
    }

    case "editKelas": {
      const [kelasLama, kelasBaru] = args;
      const kelas = getStorage("data_kelas");
      const idx = kelas.indexOf(kelasLama);
      if (idx !== -1) {
        kelas[idx] = kelasBaru;
        setStorage("data_kelas", kelas);
        return { success: true, message: "Kelas diperbarui (SIMULASI)." };
      }
      return { success: false, message: "Kelas lama tidak ditemukan." };
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
      const [qrContent, kategori, mode] = args;
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const master = getStorage(masterKey);
      const user = master.find((x: any) => x.qr_content === qrContent);
      
      if (!user) return { success: false, message: "QR Code tidak valid atau tidak terdaftar!" };
      
      const tgl = new Date().toISOString().split("T")[0];
      const jam = new Date().toTimeString().slice(0, 5);
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const idTarget = user[idKey];
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      const nama = user[nameKey];
      const classKey = kategori === "Siswa" ? `${user.kelas} - ${user.jurusan}` : "-";
      
      // Check for duplicate
      const index = reports.findIndex((r: any) => r.tanggal === tgl && (r.id_siswa === idTarget || r.id_guru === idTarget));
      const cfg = JSON.parse(localStorage.getItem("MOCK_pengaturan_jam") || "{}");
      
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
      const [idTarget, kategori, mode, tanggal, status, keterangan] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const jam = new Date().toTimeString().slice(0, 5);
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const index = reports.findIndex((r: any) => r.tanggal === tgl && r[idKey] === idTarget);
      
      if (index !== -1) {
        if (mode === "Masuk") {
          reports[index].jam_masuk = jam;
          reports[index].status_masuk = status;
        } else {
          reports[index].jam_pulang = jam;
          reports[index].status_pulang = status;
        }
        reports[index].ket = keterangan;
      } else {
        const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
        const mList = getStorage(masterKey);
        const user = mList.find((x: any) => x[idKey] === idTarget);
        if (user) {
          const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
          const nama = user[nameKey];
          const classKey = kategori === "Siswa" ? `${user.kelas} - ${user.jurusan}` : "-";
          const idLog = "LOG-" + new Date().getTime();
          
          const newRow = kategori === "Siswa" ? {
            id_log_siswa: idLog,
            tanggal: tgl,
            id_siswa: idTarget,
            nama_siswa: nama,
            kelas_jurusan: classKey,
            jam_masuk: mode === "Masuk" ? jam : "-",
            status_masuk: mode === "Masuk" ? status : "-",
            jam_pulang: mode === "Pulang" ? jam : "-",
            status_pulang: mode === "Pulang" ? status : "-",
            ket: keterangan
          } : {
            id_log_guru: idLog,
            tanggal: tgl,
            id_guru: idTarget,
            nama_guru: nama,
            jam_masuk: mode === "Masuk" ? jam : "-",
            status_masuk: mode === "Masuk" ? status : "-",
            jam_pulang: mode === "Pulang" ? jam : "-",
            status_pulang: mode === "Pulang" ? status : "-",
            ket: keterangan
          };
          reports.push(newRow);
        }
      }
      
      setStorage(reportsKey, reports);
      return { success: true, message: "Koreksi manual disimpan (SIMULASI)!" };
    }

    case "simpanBulkAbsenManual": {
      const [ids, kategori, mode, tanggal, status, keterangan] = args;
      ids.forEach((idTarget: string) => {
        callMock("simpanAbsenManual", [idTarget, kategori, mode, tanggal, status, keterangan]);
      });
      return { success: true, message: `Berhasil update ${ids.length} data absensi (SIMULASI).` };
    }

    case "getLiveAbsenHariIni": {
      const [kategori, tanggal, filterKelas] = args;
      const tgl = tanggal || new Date().toISOString().split("T")[0];
      const masterKey = kategori === "Siswa" ? "data_siswa" : "data_guru";
      const master = getStorage(masterKey);
      
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
      
      const result = master.map((m: any) => {
        const idTarget = m[idKey];
        const rep = reports.find((r: any) => r.tanggal === tgl && r[idKey] === idTarget) || {};
        
        return {
          id_target: idTarget,
          nama_target: m[nameKey],
          kelas_jurusan: kategori === "Siswa" ? `${m.kelas} ${m.jurusan}` : "-",
          jam_masuk: rep.jam_masuk || "-",
          status_masuk: rep.status_masuk || "-",
          jam_pulang: rep.jam_pulang || "-",
          status_pulang: rep.status_pulang || "-"
        };
      });
      
      const filtered = result.filter((item: any) => {
        if (kategori === "Siswa" && filterKelas && filterKelas !== "Semua") {
          return item.kelas_jurusan.includes(filterKelas);
        }
        return true;
      });
      
      return { success: true, data: filtered };
    }

    case "getLaporanFilter": {
      const [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta] = args;
      const reportsKey = kategori === "Siswa" ? "laporan_siswa" : "laporan_guru";
      const reports = getStorage(reportsKey);
      
      const filtered = reports.filter((row: any) => {
        // Date filter
        if (jenisFilter === "rentang" && tanggalMulai && tanggalSelesai) {
          if (row.tanggal < tanggalMulai || row.tanggal > tanggalSelesai) return false;
        } else if (jenisFilter === "bulan" && bulanMinta) {
          if (!row.tanggal.startsWith(bulanMinta)) return false;
        }
        
        // Class filter
        if (kategori === "Siswa" && kelas && kelas !== "Semua") {
          if (!row.kelas_jurusan || !row.kelas_jurusan.includes(kelas)) return false;
        }
        
        return true;
      });
      
      return { success: true, data: filtered };
    }

    case "hitungRekapPersentase": {
      const [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta] = args;
      const masterRes = callMock("getDataMaster", [kategori]);
      let masterData = masterRes.data;
      
      if (kategori === "Siswa" && kelas && kelas !== "Semua") {
        masterData = masterData.filter((m: any) => `${m.kelas} ${m.jurusan}`.includes(kelas));
      }
      
      const rptRes = callMock("getLaporanFilter", [kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta]);
      const rptData = rptRes.data;
      
      const idKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
      
      const rekap = masterData.map((m: any) => {
        const idTarget = m[idKey];
        const nameKey = kategori === "Siswa" ? "nama_siswa" : "nama_guru";
        const nama = m[nameKey];
        
        const userRpts = rptData.filter((r: any) => r[idKey] === idTarget);
        
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
          } else {
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
        d.setDate(d.setDate(d.getDate() - i));
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

    default:
      return { success: false, message: "Action not simulated: " + action };
  }
}

// Main bridge function to invoke Apps Script Web App actions
export async function callGas(action: string, args: any[] = []): Promise<any> {
  if (isUsingMock()) {
    // Artificial latency for authentic experience
    await new Promise((resolve) => setTimeout(resolve, 300));
    return callMock(action, args);
  }
  
  const url = getGasUrl();
  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain",
      },
      body: JSON.stringify({ action, args }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (err: any) {
    console.error("GAS API Call error:", err);
    return { success: false, message: "Gagal menghubungkan ke Google Apps Script: " + err.toString() };
  }
}
