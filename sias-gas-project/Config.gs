// ==========================================
// FILE: Config.gs 
// ==========================================

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function buatStrukturDatabaseOtomatis() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetsToCreate = [
      { name: "users", headers: ["username", "password", "role", "target_id"], data: [["admin", "admin123", "Admin", "-"]] },
      { name: "data_guru", headers: ["id_guru", "nip_nuptk", "nama_guru", "jenis_kelamin", "jabatan_tugas", "no_hp", "qr_content"], data: [["G-001", "198706122015031002", "Bahrul Ulum, S.Kom", "Laki-laki", "Ka. Komli RPL", "08123456789", "QR-G-001"]] },
      { name: "data_siswa", headers: ["id_siswa", "nisn", "nama_siswa", "jenis_kelamin", "kelas", "jurusan", "no_hp_ortu", "qr_content"], data: [["S-001", "0081234567", "Ahmad Dani", "Laki-laki", "XI", "RPL 1", "08571234567", "QR-S-001"]] },
      { name: "laporan_guru", headers: ["id_log_guru", "tanggal", "id_guru", "nama_guru", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"], data: [] },
      { name: "laporan_siswa", headers: ["id_log_siswa", "tanggal", "id_siswa", "nama_siswa", "kelas_jurusan", "jam_masuk", "status_masuk", "jam_pulang", "status_pulang", "ket"], data: [] },
      { name: "pengaturan_jam", headers: ["parameter", "nilai", "keterangan"], data: [["jam_masuk_mulai", "06:00", "Buka scan masuk"], ["jam_masuk_batas", "07:15", "Batas telat masuk"], ["jam_pulang_mulai", "15:30", "Buka scan pulang"]] },
      { name: "hari_libur", headers: ["tanggal", "keterangan"], data: [["2026-08-17", "Hari Kemerdekaan RI"]] }
    ];

    sheetsToCreate.forEach(sheetData => {
      let sheet = ss.getSheetByName(sheetData.name);
      if (sheet) {
        sheet.clear();
      } else {
        sheet = ss.insertSheet(sheetData.name);
      }
      
      // Setup Headers
      sheet.appendRow(sheetData.headers);
      const headerRange = sheet.getRange(1, 1, 1, sheetData.headers.length);
      headerRange.setBackground("#1e3a8a")
                 .setFontColor("white")
                 .setFontWeight("bold")
                 .setHorizontalAlignment("center");
      
      sheet.setFrozenRows(1);
      
      // Populate Data if any
      if (sheetData.data.length > 0) {
        sheet.getRange(2, 1, sheetData.data.length, sheetData.headers.length).setValues(sheetData.data);
      }
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, sheetData.headers.length);
    });

    return { success: true, message: "Struktur database berhasil dibuat ulang!" };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function getPengaturanSemua() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("pengaturan_jam");
    if (!sheet) {
      sheet = ss.insertSheet("pengaturan_jam");
      sheet.appendRow(["parameter", "nilai", "keterangan"]);
      sheet.appendRow(["jam_masuk_mulai", "06:00", "Buka scan masuk"]);
      sheet.appendRow(["jam_masuk_batas", "07:15", "Batas telat masuk"]);
      sheet.appendRow(["jam_pulang_mulai", "15:30", "Buka scan pulang"]);
    }
    const data = sheet.getDataRange().getValues();
    const displayData = sheet.getDataRange().getDisplayValues();
    let config = {
      jam_masuk_mulai: "06:00",
      jam_masuk_batas: "07:15",
      jam_pulang_mulai: "15:30"
    };
    for (let i = 1; i < data.length; i++) {
      let key = data[i][0];
      let rawVal = data[i][1];
      let displayVal = displayData[i][1];
      if (!key) continue;
      
      if (rawVal instanceof Date) {
        let hours = ("0" + rawVal.getHours()).slice(-2);
        let minutes = ("0" + rawVal.getMinutes()).slice(-2);
        config[key] = hours + ":" + minutes;
      } else {
        let str = String(displayVal || rawVal || "").trim();
        let match = str.match(/(\d{1,2})[:.](\d{2})/);
        if (match) {
          let hours = ("0" + match[1]).slice(-2);
          let minutes = ("0" + match[2]).slice(-2);
          config[key] = hours + ":" + minutes;
        } else if (str) {
          config[key] = str;
        }
      }
    }
    return config;
  } catch (err) {
    return {
      jam_masuk_mulai: "06:00",
      jam_masuk_batas: "07:15",
      jam_pulang_mulai: "15:30",
      error: err.toString()
    };
  }
}

function getHariLiburSemua() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("hari_libur");
  const data = sheet.getDataRange().getValues();
  let libur = [];
  for (let i = 1; i < data.length; i++) {
    libur.push({ tanggal: data[i][0], keterangan: data[i][1] });
  }
  return libur;
}

function simpanKonfigurasiJam(jamMasukMulai, jamMasukBatas, jamPulangMulai) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("pengaturan_jam");
    const data = sheet.getDataRange().getValues();
    
    for(let i=1; i<data.length; i++) {
      let param = data[i][0];
      if(param === "jam_masuk_mulai") sheet.getRange(i+1, 2).setValue(jamMasukMulai);
      if(param === "jam_masuk_batas") sheet.getRange(i+1, 2).setValue(jamMasukBatas);
      if(param === "jam_pulang_mulai") sheet.getRange(i+1, 2).setValue(jamPulangMulai);
    }
    return { success: true, message: "Pengaturan Jam Operasional berhasil disimpan." };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function tambahHariLibur(tanggal, ket) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("hari_libur");
    sheet.appendRow([tanggal, ket]);
    return { success: true, message: "Hari libur berhasil ditambahkan." };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function hapusHariLibur(tanggal) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("hari_libur");
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == tanggal) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "Hari libur berhasil dihapus." };
      }
    }
    return { success: false, message: "Data hari libur tidak ditemukan." };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function getKelasSemua() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("data_kelas");
  if (!sheet) {
      sheet = ss.insertSheet("data_kelas");
      sheet.appendRow(["nama_kelas"]);
      sheet.getRange(2, 1, 3, 1).setValues([["X RPL 1"], ["XI RPL 1"], ["XII RPL 1"]]);
  }
  const data = sheet.getDataRange().getValues();
  let kelas = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) kelas.push(data[i][0]);
  }
  return kelas;
}

function tambahKelas(namaKelas) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("data_kelas");
    if(!sheet) sheet = ss.insertSheet("data_kelas");
    sheet.appendRow([namaKelas]);
    return { success: true, message: "Kelas ditambahkan." };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function hapusKelas(namaKelas) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("data_kelas");
    if(!sheet) return { success: false, message: "Sheet data_kelas tidak ditemukan" };
    const data = sheet.getDataRange().getValues();
    for(let i=1; i<data.length; i++){
      if(data[i][0] == namaKelas){
        sheet.deleteRow(i+1);
        return { success: true, message: "Kelas dihapus." };
      }
    }
    return { success: false, message: "Kelas tidak ditemukan." };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

function editKelas(kelasLama, kelasBaru) {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("data_kelas");
    if(!sheet) return { success: false, message: "Sheet data_kelas tidak ditemukan" };
    const data = sheet.getDataRange().getValues();
    for(let i=1; i<data.length; i++){
      if(data[i][0] == kelasLama){
        sheet.getRange(i+1, 1).setValue(kelasBaru);
        return { success: true, message: "Kelas berhasil diperbarui." };
      }
    }
    return { success: false, message: "Kelas lama tidak ditemukan." };
  } catch(err) {
    return { success: false, message: err.toString() };
  }
}

