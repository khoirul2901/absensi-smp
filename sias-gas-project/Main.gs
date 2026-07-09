// ==========================================
// FILE: Main.gs 
// ==========================================

function doGet(e) {
  // Merender Index.html menggunakan template scriptlet evaluate
  const template = HtmlService.createTemplateFromFile('Index');
  const htmlOutput = template.evaluate();
  
  // Konfigurasi meta dan keamanan framing
  htmlOutput.setTitle('SIAS - SMK AL-HIKAM')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Mengizinkan embed XFrame
            .addMetaTag('viewport', 'width=device-width, initial-scale=1');
            
  return htmlOutput;
}

function include(filename) {
  // Fungsi penunjang arsitektur modular HTML/Script/CSS
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Endpoint POST untuk melayani request API dari aplikasi React (eksternal)
 * seperti yang dihosting di GitHub Pages atau di lingkungan AI Studio.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "No post data received"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const args = payload.args || [];

    // Daftar fungsi Apps Script yang diizinkan untuk dipanggil secara dinamis oleh frontend
    const allowedActions = [
      "verifikasiLogin",
      "ubahPasswordUser",
      "getPengaturanSemua",
      "simpanKonfigurasiJam",
      "getHariLiburSemua",
      "tambahHariLibur",
      "hapusHariLibur",
      "getKelasSemua",
      "tambahKelas",
      "hapusKelas",
      "editKelas",
      "prosesScanQR",
      "simpanAbsenManual",
      "simpanBulkAbsenManual",
      "getLiveAbsenHariIni",
      "getDataMaster",
      "tambahDataMaster",
      "editDataMaster",
      "hapusDataMaster",
      "importDataMassal",
      "getLaporanFilter",
      "hitungRekapPersentase",
      "getDashboardMetrics",
      "buatStrukturDatabaseOtomatis"
    ];

    if (!allowedActions.includes(action)) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Aksi '" + action + "' tidak diizinkan atau tidak dikenal."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Pastikan fungsi tersebut ada
    if (typeof this[action] !== "function") {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: "Fungsi '" + action + "' tidak terdefinisi di Google Apps Script."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Panggil fungsi secara dinamis
    const result = this[action].apply(null, args);

    // Kembalikan output dalam format JSON
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: "GAS Server Error: " + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
