// ==========================================
// FILE: Attendance.gs 
// ==========================================

function getTanggalHariIniYMD() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function getJamSaatIni() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "HH:mm");
}

function prosesScanQR(qrContent, kategori, mode) {
  try {
    const tglHariIni = getTanggalHariIniYMD();
    const jamSaatIni = getJamSaatIni();
    const liburData = getHariLiburSemua();
    
    // Langkah 1: Cek apakah hari ini libur
    let isLibur = liburData.find(lbl => lbl.tanggal == tglHariIni);
    if (isLibur) {
      return { success: false, message: "Hari ini diliburkan: " + isLibur.keterangan };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let targetDataSheet = kategori === 'Siswa' ? ss.getSheetByName('data_siswa') : ss.getSheetByName('data_guru');
    let targetLaporanSheet = kategori === 'Siswa' ? ss.getSheetByName('laporan_siswa') : ss.getSheetByName('laporan_guru');
    
    // Langkah 2: Cari informasi dari master data lewat qr_content
    const masterData = targetDataSheet.getDataRange().getValues();
    let userInfo = null;
    let qrColIndex = kategori === 'Siswa' ? 7 : 6;
    
    for (let i = 1; i < masterData.length; i++) {
      if (masterData[i][qrColIndex] === qrContent) {
        userInfo = masterData[i];
        break;
      }
    }
    
    if (!userInfo) return { success: false, message: "QR Code tidak valid atau tidak terdaftar!" };
    
    let idTarget = userInfo[0];
    let namaTarget = userInfo[2];
    let kelasAtauGuru = kategori === 'Siswa' ? `${userInfo[4]} - ${userInfo[5]}` : "-";
    
    const configJam = getPengaturanSemua();
    const laporanData = targetLaporanSheet.getDataRange().getValues();
    
    // Cari apakah sudah absen hari ini
    let rowIndex = -1;
    for (let i = 1; i < laporanData.length; i++) {
      // Index 1 = tanggal, Index 2 = idTarget
      let recDate = "";
      if(laporanData[i][1] instanceof Date) {
         recDate = Utilities.formatDate(laporanData[i][1], Session.getScriptTimeZone(), "yyyy-MM-dd");
      } else {
         recDate = laporanData[i][1];
      }
      
      if (recDate === tglHariIni && laporanData[i][2] === idTarget) {
        rowIndex = i + 1; // getRange berbasis 1-index
        break;
      }
    }
    
    if (mode === 'Masuk') {
      // Langkah 3: Mode Masuk
      if (rowIndex !== -1) return { success: false, message: "Pengguna sudah melakukan scan masuk hari ini!" };
      if (jamSaatIni < configJam.jam_masuk_mulai) return { success: false, message: "Jam masuk belum dibuka." };
      
      let statusMasuk = (jamSaatIni <= configJam.jam_masuk_batas) ? "Tepat Waktu" : "Terlambat";
      let idLog = "LOG-" + new Date().getTime();
      let newRow = kategori === 'Siswa' ? 
        [idLog, tglHariIni, idTarget, namaTarget, kelasAtauGuru, jamSaatIni, statusMasuk, "-", "-", "-"] :
        [idLog, tglHariIni, idTarget, namaTarget, jamSaatIni, statusMasuk, "-", "-", "-"];
        
      targetLaporanSheet.appendRow(newRow);
      try { 
        CacheService.getScriptCache().remove("DASHBOARD_METRICS"); 
        CacheService.getScriptCache().remove("LIVE_ABSEN_" + kategori + "_" + tglHariIni);
      } catch(e) {}
      return { success: true, message: `Berhasil Absen Masuk.\nStatus: ${statusMasuk}\nNama: ${namaTarget}`, data: newRow };
      
    } else if (mode === 'Pulang') {
      // Langkah 4: Mode Pulang
      if (jamSaatIni < configJam.jam_pulang_mulai) return { success: false, message: "Jam pulang belum dibuka." };

      if (rowIndex !== -1) {
        // Update row lama
        let colOffset = kategori === 'Siswa' ? 8 : 7;
        let p_jam = targetLaporanSheet.getRange(rowIndex, colOffset).getValue();
        if (p_jam !== "-" && p_jam !== "") {
          return { success: false, message: "Pengguna sudah melakukan scan pulang hari ini!" };
        }
        
        targetLaporanSheet.getRange(rowIndex, colOffset, 1, 2).setValues([[jamSaatIni, "Tepat Waktu"]]);
        try { 
          CacheService.getScriptCache().remove("DASHBOARD_METRICS"); 
          CacheService.getScriptCache().remove("LIVE_ABSEN_" + kategori + "_" + tglHariIni);
        } catch(e) {}
        return { success: true, message: `Berhasil Absen Pulang.\nNama: ${namaTarget}` };
      } else {
        // Insert Row baru tapi status masuknya Alpha / Lupa Scan
        let idLog = "LOG-" + new Date().getTime();
        let newRow = kategori === 'Siswa' ? 
          [idLog, tglHariIni, idTarget, namaTarget, kelasAtauGuru, "-", "Lupa Scan Masuk", jamSaatIni, "Tepat Waktu", "-"] :
          [idLog, tglHariIni, idTarget, namaTarget, "-", "Lupa Scan Masuk", jamSaatIni, "Tepat Waktu", "-"];
          
        targetLaporanSheet.appendRow(newRow);
        try { 
          CacheService.getScriptCache().remove("DASHBOARD_METRICS"); 
          CacheService.getScriptCache().remove("LIVE_ABSEN_" + kategori + "_" + tglHariIni);
        } catch(e) {}
        return { success: true, message: `Absen Pulang Berhasil (Peringatan: Lupa scan masuk).\nNama: ${namaTarget}`, data: newRow };
      }
    }
    
  } catch (error) {
    return { success: false, message: "Error sistem: " + error.toString() };
  }
}

function simpanAbsenManual(idTarget, kategori, mode, tanggal, status, keterangan) {
  try {
    const tz = Session.getScriptTimeZone();
    tanggal = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let targetLaporanSheet = kategori === 'Siswa' ? ss.getSheetByName('laporan_siswa') : ss.getSheetByName('laporan_guru');
    const laporanData = targetLaporanSheet.getDataRange().getValues();
    const jamSaatIni = getJamSaatIni();
    
    let rowIndex = -1;
    for (let i = 1; i < laporanData.length; i++) {
      let recDate = laporanData[i][1] instanceof Date ? Utilities.formatDate(laporanData[i][1], Session.getScriptTimeZone(), "yyyy-MM-dd") : laporanData[i][1];
      if (recDate === tanggal && laporanData[i][2] === idTarget) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex !== -1) {
      if (mode === 'Masuk') {
        targetLaporanSheet.getRange(rowIndex, kategori==='Siswa' ? 6 : 5, 1, 2).setValues([[jamSaatIni, status]]);
        targetLaporanSheet.getRange(rowIndex, kategori==='Siswa' ? 10: 9).setValue(keterangan);
      } else {
        targetLaporanSheet.getRange(rowIndex, kategori==='Siswa' ? 8 : 7, 1, 2).setValues([[jamSaatIni, status]]);
        targetLaporanSheet.getRange(rowIndex, kategori==='Siswa' ? 10: 9).setValue(keterangan);
      }
    } else {
      let targetDataSheet = kategori === 'Siswa' ? ss.getSheetByName('data_siswa') : ss.getSheetByName('data_guru');
      let masterData = targetDataSheet.getDataRange().getValues();
      let namaTarget = "", kelasAtauGuru = "-";
      for(let i=1; i<masterData.length; i++){
        if(masterData[i][0] == idTarget){
           namaTarget = masterData[i][2];
           if(kategori==='Siswa') kelasAtauGuru = `${masterData[i][4]} - ${masterData[i][5]}`;
           break;
        }
      }
      
      let idLog = "LOG-" + new Date().getTime();
      let newRow = kategori === 'Siswa' ? 
           (mode === 'Masuk' ? [idLog, tanggal, idTarget, namaTarget, kelasAtauGuru, jamSaatIni, status, "-", "-", keterangan] 
                             : [idLog, tanggal, idTarget, namaTarget, kelasAtauGuru, "-", "-", jamSaatIni, status, keterangan]) :
           (mode === 'Masuk' ? [idLog, tanggal, idTarget, namaTarget, jamSaatIni, status, "-", "-", keterangan] 
                             : [idLog, tanggal, idTarget, namaTarget, "-", "-", jamSaatIni, status, keterangan]);
                             
      targetLaporanSheet.appendRow(newRow);
    }
    
    try { 
      CacheService.getScriptCache().remove("DASHBOARD_METRICS"); 
      CacheService.getScriptCache().remove("LIVE_ABSEN_" + kategori + "_" + tanggal);
    } catch(e) {}
    return { success: true, message: "Koreksi manual berhasil disimpan di database!" };
  } catch (e) {
    return { success: false, message: e.toString() };
  }
}

function simpanBulkAbsenManual(ids, kategori, mode, tanggal, status, keterangan) {
  try {
    const tz = Session.getScriptTimeZone();
    tanggal = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let targetLaporanSheet = kategori === 'Siswa' ? ss.getSheetByName('laporan_siswa') : ss.getSheetByName('laporan_guru');
    const laporanData = targetLaporanSheet.getDataRange().getValues();
    const jamSaatIni = getJamSaatIni();
    
    let targetDataSheet = kategori === 'Siswa' ? ss.getSheetByName('data_siswa') : ss.getSheetByName('data_guru');
    let masterData = targetDataSheet.getDataRange().getValues();
    
    let masterMap = {};
    for (let i = 1; i < masterData.length; i++) {
        masterMap[masterData[i][0]] = masterData[i];
    }
    
    let laporanRowMap = {};
    for (let i = 1; i < laporanData.length; i++) {
      let recDate = laporanData[i][1] instanceof Date ? Utilities.formatDate(laporanData[i][1], tz, "yyyy-MM-dd") : laporanData[i][1];
      if (recDate === tanggal) {
        laporanRowMap[laporanData[i][2]] = i + 1;
      }
    }
    
    let rowsToAppend = [];
    
    ids.forEach(idTarget => {
        let rowIndex = laporanRowMap[idTarget];
        
        if (rowIndex) {
            if (mode === 'Masuk') {
              targetLaporanSheet.getRange(rowIndex, kategori==='Siswa' ? 6 : 5, 1, 2).setValues([[jamSaatIni, status]]);
              targetLaporanSheet.getRange(rowIndex, kategori==='Siswa' ? 10: 9).setValue(keterangan);
            } else {
              targetLaporanSheet.getRange(rowIndex, kategori==='Siswa' ? 8 : 7, 1, 2).setValues([[jamSaatIni, status]]);
              targetLaporanSheet.getRange(rowIndex, kategori==='Siswa' ? 10: 9).setValue(keterangan);
            }
        } else {
            let md = masterMap[idTarget];
            if (md) {
                let namaTarget = md[2];
                let kelasAtauGuru = kategori === 'Siswa' ? `${md[4]} - ${md[5]}` : "-";
                let idLog = "LOG-" + new Date().getTime() + "-" + idTarget;
                
                let newRow = kategori === 'Siswa' ? 
                   (mode === 'Masuk' ? [idLog, tanggal, idTarget, namaTarget, kelasAtauGuru, jamSaatIni, status, "-", "-", keterangan] 
                                     : [idLog, tanggal, idTarget, namaTarget, kelasAtauGuru, "-", "-", jamSaatIni, status, keterangan]) :
                   (mode === 'Masuk' ? [idLog, tanggal, idTarget, namaTarget, jamSaatIni, status, "-", "-", keterangan] 
                                     : [idLog, tanggal, idTarget, namaTarget, "-", "-", jamSaatIni, status, keterangan]);
                   
                rowsToAppend.push(newRow);
            }
        }
    });
    
    if (rowsToAppend.length > 0) {
        let lastRow = targetLaporanSheet.getLastRow();
        // Since getRange needs a valid starting row (lastRow + 1) and exact dimensions
        // If lastRow is 0, we start at 1 (though headers usually take row 1, so lastRow >= 1)
        targetLaporanSheet.getRange(Math.max(lastRow + 1, 2), 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
    }
    
    try { 
      CacheService.getScriptCache().remove("DASHBOARD_METRICS"); 
      CacheService.getScriptCache().remove("LIVE_ABSEN_" + kategori + "_" + tanggal);
    } catch(e) {}
    
    return { success: true, message: `Berhasil update ${ids.length} data absensi.` };
  } catch (error) {
    return { success: false, message: "Gagal bulk update: " + error.toString() };
  }
}

function getLiveAbsenHariIni(kategori, tanggal, filterKelas) {
  try {
    const tz = Session.getScriptTimeZone();
    tanggal = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    
    let masterRes = getDataMaster(kategori);
    if (!masterRes.success || masterRes.data.length === 0) return { success: true, data: [] };
    const masterData = masterRes.data;
    
    let reportMap = {};
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetLaporan = kategori === 'Siswa' ? ss.getSheetByName('laporan_siswa') : ss.getSheetByName('laporan_guru');
    
    if (!sheetLaporan) return { success: false, message: `Sheet laporan_${kategori.toLowerCase()} tidak ditemukan` };
    
    const lastRow = sheetLaporan.getLastRow();
    
    if (lastRow > 1) {
          // Ambil header
          const headersLaporan = sheetLaporan.getRange(1, 1, 1, sheetLaporan.getLastColumn()).getValues()[0];
          const tglIdx = headersLaporan.indexOf('tanggal');
          const idIdx = headersLaporan.indexOf(kategori === 'Siswa' ? 'id_siswa' : 'id_guru');
          const jamMasukIdx = headersLaporan.indexOf('jam_masuk');
          const statusMasukIdx = headersLaporan.indexOf('status_masuk');
          const jamPulangIdx = headersLaporan.indexOf('jam_pulang');
          const statusPulangIdx = headersLaporan.indexOf('status_pulang');
          
          let batchSize = 500;
          let startRow = Math.max(2, lastRow - batchSize + 1);
          let numRows = lastRow - startRow + 1;
          let dataLaporan = sheetLaporan.getRange(startRow, 1, numRows, sheetLaporan.getLastColumn()).getValues();
          
          for (let i = dataLaporan.length - 1; i >= 0; i--) {
            let row = dataLaporan[i];
            let rowTgl = row[tglIdx];
            
            let recDate = "";
            if (rowTgl instanceof Date) {
               recDate = Utilities.formatDate(rowTgl, tz, "yyyy-MM-dd");
            } else {
               recDate = String(rowTgl);
            }
            
            if (recDate.includes(tanggal)) {
               let targetId = String(row[idIdx]);
               if (!reportMap[targetId]) {
                 let jm = row[jamMasukIdx];
                 if (jm instanceof Date) jm = Utilities.formatDate(jm, tz, "HH:mm");
                 let jp = row[jamPulangIdx];
                 if (jp instanceof Date) jp = Utilities.formatDate(jp, tz, "HH:mm");

                 reportMap[targetId] = {
                    jam_masuk: jm || "-",
                    status_masuk: row[statusMasukIdx] || "-",
                    jam_pulang: jp || "-",
                    status_pulang: row[statusPulangIdx] || "-"
                 };
               }
            }
          }
       }
    
    // Pasangkan dengan Master Data
    let result = [];
    
    for (let i = 0; i < masterData.length; i++) {
      let mRow = masterData[i];
      let idTarget = kategori === 'Siswa' ? mRow.id_siswa : mRow.id_guru;
      let nama = kategori === 'Siswa' ? mRow.nama_siswa : mRow.nama_guru;
      let kelasFull = "-";
      
      if (kategori === 'Siswa') {
         let kls = mRow.kelas;
         if(filterKelas && filterKelas !== 'Semua' && kls !== filterKelas) continue;
         kelasFull = `${kls} ${mRow.jurusan}`;
      }
      
      let rpt = reportMap[idTarget] || {
         jam_masuk: "-", status_masuk: "-", jam_pulang: "-", status_pulang: "-"
      };
      
      result.push({
         id_target: idTarget,
         nama_target: nama,
         kelas_jurusan: kelasFull,
         jam_masuk: rpt.jam_masuk,
         status_masuk: rpt.status_masuk,
         jam_pulang: rpt.jam_pulang,
         status_pulang: rpt.status_pulang
      });
    }
    
    return JSON.parse(JSON.stringify({ success: true, data: result }));
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}
