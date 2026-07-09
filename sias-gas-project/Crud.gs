// ==========================================
// FILE: Crud.gs 
// ==========================================

function getDataMaster(kategori) {
  try {
    let cacheKey = "MASTER_DATA_" + kategori;
    let cachedData = null;
    try {
      cachedData = CacheService.getScriptCache().get(cacheKey);
    } catch(e) {}
    
    if (cachedData) {
      return { success: true, data: JSON.parse(cachedData) };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = kategori === 'Siswa' ? ss.getSheetByName('data_siswa') : ss.getSheetByName('data_guru');
    if (!sheet) return { success: false, data: [] };
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return { success: true, data: [] };
    
    let result = [];
    const headers = data[0];
    
    for (let i = 1; i < data.length; i++) {
      let obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = data[i][j];
      }
      result.push(obj);
    }
    
    // Simpan ke cache selama 2 jam (7200 detik) untuk load instan di request berikutnya
    try {
      CacheService.getScriptCache().put(cacheKey, JSON.stringify(result), 7200); 
    } catch(e) {}
    
    return JSON.parse(JSON.stringify({ success: true, data: result }));
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function tambahDataMaster(kategori, dataObj) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = kategori === 'Siswa' ? ss.getSheetByName('data_siswa') : ss.getSheetByName('data_guru');
    
    let prefix = kategori === 'Siswa' ? 'S-' : 'G-';
    let timeStamp = new Date().getTime().toString().slice(-4);
    let randomNum = Math.floor(Math.random() * 1000);
    let idBaru = prefix + timeStamp + randomNum;
    let qrContent = "QR-" + idBaru;
    
    let rowData = [];
    if (kategori === 'Siswa') {
       rowData = [idBaru, dataObj.nisn, dataObj.nama_siswa, dataObj.jenis_kelamin, dataObj.kelas, dataObj.jurusan, dataObj.no_hp_ortu, qrContent];
    } else {
       rowData = [idBaru, dataObj.nip_nuptk, dataObj.nama_guru, dataObj.jenis_kelamin, dataObj.jabatan_tugas, dataObj.no_hp, qrContent];
    }
    sheet.appendRow(rowData);
    
    // Invalidate Cache
    try { CacheService.getScriptCache().remove("MASTER_DATA_" + kategori); } catch(e) {}
    
    return { success: true, message: `Berhasil menambahkan data ${kategori} baru` };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function editDataMaster(kategori, idTarget, dataObj) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = kategori === 'Siswa' ? ss.getSheetByName('data_siswa') : ss.getSheetByName('data_guru');
    const data = sheet.getDataRange().getValues();
    
    for(let i=1; i<data.length; i++){
      if(data[i][0] == idTarget){
         if (kategori === 'Siswa') {
           sheet.getRange(i+1, 2, 1, 6).setValues([[dataObj.nisn, dataObj.nama_siswa, dataObj.jenis_kelamin, dataObj.kelas, dataObj.jurusan, dataObj.no_hp_ortu]]);
         } else {
           sheet.getRange(i+1, 2, 1, 5).setValues([[dataObj.nip_nuptk, dataObj.nama_guru, dataObj.jenis_kelamin, dataObj.jabatan_tugas, dataObj.no_hp]]);
         }
         
         // Invalidate Cache
         try { CacheService.getScriptCache().remove("MASTER_DATA_" + kategori); } catch(e) {}
         return { success: true, message: "Data berhasil diubah secara permanen." };
      }
    }
    return { success: false, message: "ID Target tidak ditemukan di database." };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function hapusDataMaster(kategori, idTarget) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = kategori === 'Siswa' ? ss.getSheetByName('data_siswa') : ss.getSheetByName('data_guru');
    const data = sheet.getDataRange().getValues();
    for(let i=1; i<data.length; i++){
      if(data[i][0] == idTarget){
         sheet.deleteRow(i+1);
         // Invalidate Cache
         try { CacheService.getScriptCache().remove("MASTER_DATA_" + kategori); } catch(e) {}
         return { success: true, message: "Data terhapus permanen dari sistem." };
      }
    }
    return { success: false, message: "Data gagal dihapus: ID tidak dikenal." };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}

function importDataMassal(kategori, arrayData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = kategori === 'Siswa' ? ss.getSheetByName('data_siswa') : ss.getSheetByName('data_guru');
    let writeData = [];
    
    arrayData.forEach((dataObj, index) => {
      let prefix = kategori === 'Siswa' ? 'S-' : 'G-';
      let timeStamp = new Date().getTime().toString().slice(-4);
      let idBaru = prefix + timeStamp + index;
      let qrContent = "QR-" + idBaru;
      
      if (kategori === 'Siswa') {
         writeData.push([idBaru, dataObj.nisn||'-', dataObj.nama_siswa||'-', dataObj.jenis_kelamin||'-', dataObj.kelas||'-', dataObj.jurusan||'-', dataObj.no_hp_ortu||'-', qrContent]);
      } else {
         writeData.push([idBaru, dataObj.nip_nuptk||'-', dataObj.nama_guru||'-', dataObj.jenis_kelamin||'-', dataObj.jabatan_tugas||'-', dataObj.no_hp||'-', qrContent]);
      }
    });
    
    if(writeData.length > 0) {
      sheet.getRange(sheet.getLastRow() + 1, 1, writeData.length, writeData[0].length).setValues(writeData);
      // Invalidate Cache
      try { CacheService.getScriptCache().remove("MASTER_DATA_" + kategori); } catch(e) {}
    }
    return { success: true, message: `Migrasi file Excel sukses. ${writeData.length} baris telah dimasukkan ke Database.` };
  } catch(e) {
    return { success: false, message: e.toString() };
  }
}
