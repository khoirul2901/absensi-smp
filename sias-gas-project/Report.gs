// ==========================================
// FILE: Report.gs 
// ==========================================

function getLaporanFilter(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = kategori === 'Siswa' ? ss.getSheetByName('laporan_siswa') : ss.getSheetByName('laporan_guru');
    
    // Ambil data satu kali (lebih cepat dari db query individual)
    const data = sheet.getDataRange().getValues();
    if(data.length <= 1) return {success: true, data: []};
    
    let result = [];
    const headers = data[0];
    const tz = Session.getScriptTimeZone();
    
    let tS = tanggalMulai ? new Date(tanggalMulai) : null;
    let tE = tanggalSelesai ? new Date(tanggalSelesai) : null;
    
    // Cari index kolom filter utama
    const tanggalIdx = headers.indexOf('tanggal');
    const kelasJurusanIdx = headers.indexOf('kelas_jurusan');
    
    for (let i = 1; i < data.length; i++) {
        let rowData = data[i];
        
        // 1. Ekstrak dan format tanggal (hanya untuk index tanggal jika ada)
        let rowTanggalStr = "";
        if (tanggalIdx !== -1) {
            let v = rowData[tanggalIdx];
            if (v instanceof Date) {
               let y = v.getFullYear();
               let m = ('0' + (v.getMonth() + 1)).slice(-2);
               let d = ('0' + v.getDate()).slice(-2);
               rowTanggalStr = `${y}-${m}-${d}`;
            } else {
               rowTanggalStr = String(v);
            }
            
            // 2. Evaluasi Filter Waktu SEBELUM memproses objek lengkap (menghemat CPU dan antrian memory)
            if (jenisFilter === 'rentang' && tS && tE) {
                let rowDate = new Date(rowTanggalStr);
                rowDate.setHours(0,0,0,0);
                let start = new Date(tS); start.setHours(0,0,0,0);
                let end = new Date(tE); end.setHours(0,0,0,0);
                if(rowDate < start || rowDate > end) continue;
            } else if (jenisFilter === 'bulan' && bulanMinta) {
                let rowBulan = rowTanggalStr.substring(0, 7); // yyyy-MM
                if(rowBulan !== bulanMinta) continue;
            }
        }
        
        // 3. Evaluasi Filter Kelas
        if (kategori === 'Siswa' && kelas && kelas !== 'Semua' && kelasJurusanIdx !== -1) {
            let valKelas = String(rowData[kelasJurusanIdx]);
            if (!valKelas.includes(kelas)) continue;
        }
        
        // 4. Bangun Objek HANYA jika baris lolos filter (sangat optimal untuk ribuan data)
        let obj = {};
        for(let j = 0; j < headers.length; j++){ 
           let v = rowData[j];
           if (j === tanggalIdx) {
               obj[headers[j]] = rowTanggalStr;
           } else {
               if(headers[j] === 'jam_masuk' || headers[j] === 'jam_pulang') {
                   if (v instanceof Date) {
                       v = Utilities.formatDate(v, tz, "HH:mm");
                   } else if (typeof v === 'string' && (v.includes('1899') || v.includes('T'))) {
                       let tempDate = new Date(v);
                       if (!isNaN(tempDate.getTime())) {
                           v = Utilities.formatDate(tempDate, tz, "HH:mm");
                       }
                   }
               } else if(v instanceof Date) {
                   v = Utilities.formatDate(v, tz, "yyyy-MM-dd");
               }
               obj[headers[j]] = v;
           }
        }
        
        result.push(obj);
    }
    return JSON.parse(JSON.stringify({ success: true, data: result }));
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

function hitungRekapPersentase(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta) {
  try {
     let masterRes = getDataMaster(kategori);
     if(!masterRes.success) throw new Error(masterRes.message);
     
     let masterData = masterRes.data;
     if (kategori === 'Siswa' && kelas && kelas !== 'Semua') {
         masterData = masterData.filter(m => String(m.kelas_jurusan).includes(kelas));
     }
     
     let rawRes = getLaporanFilter(kategori, kelas, jenisFilter, tanggalMulai, tanggalSelesai, bulanMinta);
     if(!rawRes.success) throw new Error(rawRes.message);
     
     let rawData = rawRes.data;
     
     // Cari total hari unik dari seluruh laporan (sebagai hari aktif efektif)
     let datesSet = new Set();
     rawData.forEach(row => datesSet.add(row.tanggal));
     let totalHariEfektif = datesSet.size;
     
     let hashMap = {};
     
     // Inisialisasi dari master data
     masterData.forEach(m => {
         let idTarget = kategori === 'Siswa' ? m.id_siswa : m.id_guru;
         let namaTarget = kategori === 'Siswa' ? m.nama_siswa : m.nama_guru;
         hashMap[idTarget] = {
             nama: namaTarget,
             id: idTarget,
             hadir: 0, sakit: 0, izin: 0, alfa: 0,
             jam_masuk_arr: [],
             jam_pulang_arr: [],
             _daysPresent: new Set()
         };
     });
     
     rawData.forEach(row => {
        let idTarget = row[kategori==='Siswa' ? 'id_siswa' : 'id_guru'];
        let status = String(row.status_masuk).toLowerCase();
        
        if(!hashMap[idTarget]) {
           hashMap[idTarget] = {
               nama: row[kategori==='Siswa'?'nama_siswa':'nama_guru'],
               id: idTarget,
               hadir: 0, sakit: 0, izin: 0, alfa: 0,
               jam_masuk_arr: [],
               jam_pulang_arr: [],
               _daysPresent: new Set()
           };
        }
        
        if(status.includes("tepat") || status.includes("terlambat") || status.includes("lupa") || status.includes("hadir")) {
            hashMap[idTarget].hadir++;
        } else if(status.includes("sakit")) {
            hashMap[idTarget].sakit++;
        } else if(status.includes("izin")) {
            hashMap[idTarget].izin++;
        } else if(status.includes("alfa") || status.includes("alpha")) {
            hashMap[idTarget].alfa++;
        } else {
            hashMap[idTarget].hadir++; // failsafe fallback
        }
        
        if (row.jam_masuk && row.jam_masuk !== "-") hashMap[idTarget].jam_masuk_arr.push(row.jam_masuk);
        if (row.jam_pulang && row.jam_pulang !== "-") hashMap[idTarget].jam_pulang_arr.push(row.jam_pulang);
        
        hashMap[idTarget]._daysPresent.add(row.tanggal);
     });
     
     let arr = [];
     for(let key in hashMap) {
         let item = hashMap[key];
         
         // Tambahkan absen untuk hari aktif yang tidak ada datanya
         let countedDays = item._daysPresent.size;
         let missingDays = totalHariEfektif - countedDays;
         if (missingDays > 0) {
             item.alfa += missingDays;
         }
         
         let totalHari = item.hadir + item.sakit + item.alfa + item.izin;
         item.persentase = totalHari === 0 ? "0%" : ((item.hadir / totalHari) * 100).toFixed(1) + "%";
         
         item.jam_masuk = item.jam_masuk_arr.length > 0 ? item.jam_masuk_arr.join(", ") : "-";
         item.jam_pulang = item.jam_pulang_arr.length > 0 ? item.jam_pulang_arr.join(", ") : "-";
         
         delete item._daysPresent; // cleanup before returning
         delete item.jam_masuk_arr;
         delete item.jam_pulang_arr;
         arr.push(item);
     }
     
     return JSON.parse(JSON.stringify({ success: true, data: arr }));
  } catch (error) {
     return { success: false, message: error.toString() };
  }
}

function getDashboardMetrics() {
  try {
    let cacheKey = "DASHBOARD_METRICS";
    let cachedData = null;
    try {
      cachedData = CacheService.getScriptCache().get(cacheKey);
    } catch(e) {}
    
    if (cachedData) {
       return { success: true, data: JSON.parse(cachedData) };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const tz = Session.getScriptTimeZone();
    const tglHariIni = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd");
    
    let masterResSiswa = getDataMaster('Siswa');
    const totalSiswa = masterResSiswa.success ? masterResSiswa.data.length : 0;
    
    let masterResGuru = getDataMaster('Guru');
    const totalGuru = masterResGuru.success ? masterResGuru.data.length : 0;
    
    function parseDateCustom(d) {
        if (d instanceof Date) return Utilities.formatDate(d, tz, "yyyy-MM-dd");
        return String(d);
    }
    
    function hitungStat(sheetName) {
        const sheet = ss.getSheetByName(sheetName);
        if(!sheet) return { hadirMasuk: 0, hadirPulang: 0, alfa: 0, tepat: 0, totalTepat: 0, totalMasukValid: 0, persentaseTepat: "0%", persentaseAlfa: 0, rawAlfa: 0, totalHariIni: 0, chartData: [] };
        
        const data = sheet.getDataRange().getValues();
        let hadirMasuk = 0, hadirPulang = 0, alfa = 0;
        let totalTepat = 0, totalMasukValid = 0;
        let totalHariIni = 0;
        let rawAlfa = 0;
        
        if (data.length > 1) {
            const headers = data[0];
            const tglIdx = headers.indexOf('tanggal');
            const stMasukIdx = headers.indexOf('status_masuk');
            const stPulangIdx = headers.indexOf('status_pulang');
            
            for (let i = data.length - 1; i >= 1; i--) {
                let row = data[i];
                let rowTgl = parseDateCustom(row[tglIdx]);
                
                if (rowTgl === tglHariIni) {
                    totalHariIni++;
                    let stM = String(row[stMasukIdx] || "").toLowerCase();
                    let stP = String(row[stPulangIdx] || "").toLowerCase();
                    
                    if(stM.includes("tepat") || stM.includes("terlambat") || stM.includes("lupa") || stM.includes("hadir")) {
                        hadirMasuk++;
                        totalMasukValid++;
                        if(stM.includes("tepat")) totalTepat++;
                    } else if (stM.includes("alfa") || stM.includes("alpha") || stM.includes("sakit") || stM.includes("izin")) {
                        alfa++;
                        if (stM.includes("alfa") || stM.includes("alpha")) {
                            rawAlfa++;
                        }
                    }
                    
                    if(stP.includes("tepat") || stP.includes("terlambat") || stP.includes("lupa") || stP.includes("hadir") || stP.includes("pulang")) {
                        hadirPulang++;
                    }
                }
            }
        }
        
        let persentaseTepat = "0%";
        let persentaseTepatInt = 0;
        if (totalMasukValid > 0) {
            persentaseTepatInt = Math.round((totalTepat / totalMasukValid) * 100);
            persentaseTepat = persentaseTepatInt + "%";
        }
        
        // Chart Data (6 days)
        let chartData = [];
        for (let i = 5; i >= 0; i--) {
            let tempDate = new Date();
            tempDate.setDate(tempDate.getDate() - i);
            let strTgl = Utilities.formatDate(tempDate, tz, "yyyy-MM-dd");
            let hCount = 0;
            if (data.length > 1) {
                const headers = data[0];
                const tglIdx = headers.indexOf('tanggal');
                const stMasukIdx = headers.indexOf('status_masuk');
                for (let j = data.length - 1; j >= 1; j--) {
                    if (parseDateCustom(data[j][tglIdx]) === strTgl) {
                        let st = String(data[j][stMasukIdx] || "").toLowerCase();
                        if(st.includes("tepat") || st.includes("terlambat") || st.includes("lupa") || st.includes("hadir")) hCount++;
                    }
                }
            }
            chartData.push(hCount);
        }
        
        return { hadirMasuk, hadirPulang, alfa, totalTepat, totalMasukValid, persentaseTepat, persentaseTepatInt, rawAlfa, totalHariIni, chartData };
    }
    
    let statsSiswa = hitungStat('laporan_siswa');
    let statsGuru = hitungStat('laporan_guru');
    
    let chartLabels = [];
    for (let i = 5; i >= 0; i--) {
        let tempDate = new Date();
        tempDate.setDate(tempDate.getDate() - i);
        chartLabels.push(Utilities.formatDate(tempDate, tz, "MMM dd"));
    }
    
    // Calculate Alfa percentage based on total entity
    let pAlfaSiswa = totalSiswa > 0 ? Math.round((statsSiswa.rawAlfa / totalSiswa) * 100) : 0;
    let pAlfaGuru = totalGuru > 0 ? Math.round((statsGuru.rawAlfa / totalGuru) * 100) : 0;
    
    let pPulangSiswa = totalSiswa > 0 ? Math.round((statsSiswa.hadirPulang / totalSiswa) * 100) : 0;
    let pPulangGuru = totalGuru > 0 ? Math.round((statsGuru.hadirPulang / totalGuru) * 100) : 0;
    
    let resultData = {
        totalSiswa,
        siswaMasuk: statsSiswa.hadirMasuk,
        siswaPulang: statsSiswa.hadirPulang,
        siswaTepat: statsSiswa.persentaseTepat,
        siswaTepatInt: statsSiswa.persentaseTepatInt,
        siswaPulangPersenInt: pPulangSiswa,
        siswaAlfaInt: pAlfaSiswa,
        
        totalGuru,
        guruMasuk: statsGuru.hadirMasuk,
        guruPulang: statsGuru.hadirPulang,
        guruTepat: statsGuru.persentaseTepat,
        guruTepatInt: statsGuru.persentaseTepatInt,
        guruPulangPersenInt: pPulangGuru,
        guruAlfaInt: pAlfaGuru,
        
        chartLabels,
        chartData: statsSiswa.chartData // keep siswa chart as main representation
    };
    
    try { CacheService.getScriptCache().put(cacheKey, JSON.stringify(resultData), 600); } catch(e) {}
    
    return JSON.parse(JSON.stringify({
       success: true,
       data: resultData
    }));
  } catch (error) {
     return { success: false, message: error.toString() };
  }
}
