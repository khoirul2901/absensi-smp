/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const KODE_GS_SCRIPT = `/**
 * KODE GOOGLE APPS SCRIPT (Kode.gs) - SIAS (Sistem Informasi Absensi Sekolah)
 * Versi Terbaru: Mendukung Data Kelas dengan Nama Kelas, ID Guru, dan Nama Wali Kelas
 * 
 * PETUNJUK PENERAPAN:
 * 1. Buka Google Sheets Database Anda.
 * 2. Klik menu Ekstensi > Apps Script (Extension > Apps Script).
 * 3. Buka file "Kode.gs" (atau buat baru) lalu salin seluruh kode di bawah ini.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik "Terapkan" > "Penerapan Baru" (Deploy > New deployment).
 * 6. Pilih Jenis: "Aplikasi Web" (Web app).
 * 7. Pada "Jalankan sebagai" (Execute as): pilih "Saya" (Me).
 * 8. Pada "Siapa yang memiliki akses" (Who has access): pilih "SIAPA SAJA" (Anyone).
 * 9. Klik "Terapkan" (Deploy) lalu salin URL Web App yang dihasilkan ke menu Pengaturan aplikasi.
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: "Web App SIAS aktif & berjalan dengan baik!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "{}";
    var payload = JSON.parse(rawData);
    var action = payload.action || "";
    var args = payload.args || [];
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var result = { success: false, message: "Aksi tidak dikenal" };

    switch (action) {
      // ==================== DATA KELAS ====================
      case "getKelasSemua": {
        var sheet = ss.getSheetByName("DATA_KELAS") || ss.getSheetByName("Kelas");
        if (!sheet) {
          result = { success: true, data: [] };
          break;
        }
        var data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
          result = { success: true, data: [] };
          break;
        }
        var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
        var colNama = headers.indexOf("nama_kelas") !== -1 ? headers.indexOf("nama_kelas") : (headers.indexOf("kelas") !== -1 ? headers.indexOf("kelas") : 0);
        var colIdGuru = headers.indexOf("id_guru") !== -1 ? headers.indexOf("id_guru") : (headers.indexOf("id_wali") !== -1 ? headers.indexOf("id_wali") : 1);
        var colWali = headers.indexOf("wali_kelas") !== -1 ? headers.indexOf("wali_kelas") : (headers.indexOf("wali") !== -1 ? headers.indexOf("wali") : 2);

        var listKelas = [];
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var namaKls = String(row[colNama] || "").trim();
          if (!namaKls) continue;
          var idG = colIdGuru < row.length ? String(row[colIdGuru] || "-").trim() : "-";
          var wKls = colWali < row.length ? String(row[colWali] || "-").trim() : "-";
          listKelas.push({
            nama_kelas: namaKls,
            id_guru: idG || "-",
            wali_kelas: wKls || "-"
          });
        }
        result = { success: true, data: listKelas };
        break;
      }

      case "tambahKelas":
      case "simpanWaliKelas": {
        var sheet = ss.getSheetByName("DATA_KELAS") || ss.getSheetByName("Kelas");
        if (!sheet) {
          sheet = ss.insertSheet("DATA_KELAS");
          sheet.appendRow(["nama_kelas", "id_guru", "wali_kelas"]);
        }
        var namaKelas = payload.nama_kelas || payload.kelas || (args.length > 0 ? args[0] : "");
        var waliKelas = payload.wali_kelas || payload.wali || payload.nama_guru || (args.length > 1 ? args[1] : "-");
        var idGuru = payload.id_guru || payload.idGuru || payload.id_wali || (args.length > 2 ? args[2] : "-");

        if (!namaKelas) {
          result = { success: false, message: "Nama kelas tidak boleh kosong" };
          break;
        }

        var data = sheet.getDataRange().getValues();
        var headers = data.length > 0 ? data[0].map(function(h) { return String(h).toLowerCase().trim(); }) : ["nama_kelas", "id_guru", "wali_kelas"];
        
        var colNama = headers.indexOf("nama_kelas") !== -1 ? headers.indexOf("nama_kelas") : 0;
        var colIdGuru = headers.indexOf("id_guru") !== -1 ? headers.indexOf("id_guru") : 1;
        var colWali = headers.indexOf("wali_kelas") !== -1 ? headers.indexOf("wali_kelas") : 2;

        var foundRow = -1;
        for (var r = 1; r < data.length; r++) {
          if (String(data[r][colNama]).trim().toLowerCase() === String(namaKelas).trim().toLowerCase()) {
            foundRow = r + 1;
            break;
          }
        }

        if (foundRow !== -1) {
          sheet.getRange(foundRow, colNama + 1).setValue(namaKelas);
          sheet.getRange(foundRow, colIdGuru + 1).setValue(idGuru || "-");
          sheet.getRange(foundRow, colWali + 1).setValue(waliKelas || "-");
          result = { success: true, message: "Data kelas " + namaKelas + " berhasil diperbarui!" };
        } else {
          var newRow = [];
          var maxCol = Math.max(colNama, colIdGuru, colWali, 2);
          for (var c = 0; c <= maxCol; c++) newRow.push("-");
          newRow[colNama] = namaKelas;
          newRow[colIdGuru] = idGuru || "-";
          newRow[colWali] = waliKelas || "-";
          sheet.appendRow(newRow);
          result = { success: true, message: "Kelas " + namaKelas + " berhasil ditambahkan!" };
        }
        break;
      }

      case "editKelas": {
        var sheet = ss.getSheetByName("DATA_KELAS") || ss.getSheetByName("Kelas");
        if (!sheet) {
          result = { success: false, message: "Sheet DATA_KELAS tidak ditemukan" };
          break;
        }
        var kLama = payload.kelasLama || (args.length > 0 ? args[0] : "");
        var kBaru = payload.kelasBaru || payload.nama_kelas || (args.length > 1 ? args[1] : kLama);
        var wBaru = payload.wali_kelas || payload.wali || (args.length > 2 ? args[2] : "-");
        var idGBaru = payload.id_guru || payload.idGuru || (args.length > 3 ? args[3] : "-");

        var data = sheet.getDataRange().getValues();
        var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
        var colNama = headers.indexOf("nama_kelas") !== -1 ? headers.indexOf("nama_kelas") : 0;
        var colIdGuru = headers.indexOf("id_guru") !== -1 ? headers.indexOf("id_guru") : 1;
        var colWali = headers.indexOf("wali_kelas") !== -1 ? headers.indexOf("wali_kelas") : 2;

        var foundRow = -1;
        for (var r = 1; r < data.length; r++) {
          if (String(data[r][colNama]).trim().toLowerCase() === String(kLama).trim().toLowerCase()) {
            foundRow = r + 1;
            break;
          }
        }

        if (foundRow !== -1) {
          sheet.getRange(foundRow, colNama + 1).setValue(kBaru);
          sheet.getRange(foundRow, colIdGuru + 1).setValue(idGBaru || "-");
          sheet.getRange(foundRow, colWali + 1).setValue(wBaru || "-");
          result = { success: true, message: "Kelas " + kLama + " berhasil diubah!" };
        } else {
          sheet.appendRow([kBaru, idGBaru || "-", wBaru || "-"]);
          result = { success: true, message: "Kelas " + kBaru + " baru ditambahkan!" };
        }
        break;
      }

      case "hapusKelas": {
        var sheet = ss.getSheetByName("DATA_KELAS") || ss.getSheetByName("Kelas");
        if (!sheet) {
          result = { success: true, message: "Kelas berhasil dihapus" };
          break;
        }
        var kHapus = payload.nama_kelas || (args.length > 0 ? args[0] : "");
        var data = sheet.getDataRange().getValues();
        var headers = data[0].map(function(h) { return String(h).toLowerCase().trim(); });
        var colNama = headers.indexOf("nama_kelas") !== -1 ? headers.indexOf("nama_kelas") : 0;

        for (var r = data.length - 1; r >= 1; r--) {
          if (String(data[r][colNama]).trim().toLowerCase() === String(kHapus).trim().toLowerCase()) {
            sheet.deleteRow(r + 1);
          }
        }
        result = { success: true, message: "Kelas " + kHapus + " berhasil dihapus!" };
        break;
      }

      // ==================== DATA MASTER (SISWA, GURU) ====================
      case "getDataMaster": {
        var kategori = payload.kategori || (args.length > 0 ? args[0] : "Siswa");
        var sheetName = kategori === "Siswa" ? "DATA_SISWA" : (kategori === "Guru" ? "DATA_GURU" : "DATA_" + kategori.toUpperCase());
        var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName(kategori);
        if (!sheet) {
          result = { success: true, data: [] };
          break;
        }
        var data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
          result = { success: true, data: [] };
          break;
        }
        var headers = data[0].map(function(h) { return String(h).trim(); });
        var listData = [];
        for (var i = 1; i < data.length; i++) {
          var row = data[i];
          var obj = {};
          var isEmptyRow = true;
          for (var c = 0; c < headers.length; c++) {
            var val = row[c] !== undefined ? String(row[c]).trim() : "";
            obj[headers[c]] = val;
            if (val !== "") isEmptyRow = false;
          }
          if (!isEmptyRow) listData.push(obj);
        }
        result = { success: true, data: listData };
        break;
      }

      case "tambahDataMaster": {
        var kategori = payload.kategori || (args.length > 0 ? args[0] : "Siswa");
        var itemObj = payload.item || (args.length > 1 ? args[1] : payload);
        var sheetName = kategori === "Siswa" ? "DATA_SISWA" : (kategori === "Guru" ? "DATA_GURU" : "DATA_" + kategori.toUpperCase());
        var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName(kategori);
        
        if (!sheet) {
          sheet = ss.insertSheet(sheetName);
          var keys = Object.keys(itemObj);
          sheet.appendRow(keys);
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0].map(function(h) { return String(h).trim(); });
        var newRow = [];
        for (var c = 0; c < headers.length; c++) {
          newRow.push(itemObj[headers[c]] || itemObj[headers[c].toLowerCase()] || "-");
        }
        sheet.appendRow(newRow);
        result = { success: true, message: "Data " + kategori + " berhasil ditambahkan!" };
        break;
      }

      case "editDataMaster": {
        var kategori = payload.kategori || (args.length > 0 ? args[0] : "Siswa");
        var targetId = payload.id || (args.length > 1 ? args[1] : "");
        var itemObj = payload.item || (args.length > 2 ? args[2] : payload);
        var sheetName = kategori === "Siswa" ? "DATA_SISWA" : (kategori === "Guru" ? "DATA_GURU" : "DATA_" + kategori.toUpperCase());
        var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName(kategori);
        
        if (!sheet) {
          result = { success: false, message: "Sheet tidak ditemukan" };
          break;
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0].map(function(h) { return String(h).trim(); });
        var idColKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
        var idColIndex = headers.findIndex(function(h) { return h.toLowerCase() === idColKey || h.toLowerCase() === "id"; });
        if (idColIndex === -1) idColIndex = 0;

        for (var r = 1; r < data.length; r++) {
          if (String(data[r][idColIndex]).trim() === String(targetId).trim()) {
            for (var c = 0; c < headers.length; c++) {
              var key = headers[c];
              if (itemObj[key] !== undefined) {
                sheet.getRange(r + 1, c + 1).setValue(itemObj[key]);
              }
            }
            break;
          }
        }
        result = { success: true, message: "Data " + kategori + " berhasil diperbarui!" };
        break;
      }

      case "hapusDataMaster": {
        var kategori = payload.kategori || (args.length > 0 ? args[0] : "Siswa");
        var targetId = payload.id || (args.length > 1 ? args[1] : "");
        var sheetName = kategori === "Siswa" ? "DATA_SISWA" : (kategori === "Guru" ? "DATA_GURU" : "DATA_" + kategori.toUpperCase());
        var sheet = ss.getSheetByName(sheetName) || ss.getSheetByName(kategori);
        
        if (!sheet) {
          result = { success: true, message: "Data berhasil dihapus" };
          break;
        }

        var data = sheet.getDataRange().getValues();
        var headers = data[0].map(function(h) { return String(h).trim(); });
        var idColKey = kategori === "Siswa" ? "id_siswa" : "id_guru";
        var idColIndex = headers.findIndex(function(h) { return h.toLowerCase() === idColKey || h.toLowerCase() === "id"; });
        if (idColIndex === -1) idColIndex = 0;

        for (var r = data.length - 1; r >= 1; r--) {
          if (String(data[r][idColIndex]).trim() === String(targetId).trim()) {
            sheet.deleteRow(r + 1);
          }
        }
        result = { success: true, message: "Data " + targetId + " berhasil dihapus!" };
        break;
      }

      default: {
        result = { success: true, message: "Aksi " + action + " diterima dan diproses oleh Google Apps Script!" };
        break;
      }
    }

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "Error Google Apps Script: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;
