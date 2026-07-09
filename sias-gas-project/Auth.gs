// ==========================================
// FILE: Auth.gs 
// ==========================================

function verifikasiLogin(username, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetUsers = ss.getSheetByName("users");
    
    // Keamanan dasar: cegah eksekusi jika sheet belum diinisialisasi
    if (!sheetUsers) throw new Error("Database users belum diinisialisasi. Hubungi Admin.");
    
    const data = sheetUsers.getDataRange().getValues();
    
    // Looping pengecekan baris
    for (let i = 1; i < data.length; i++) {
      let dbUsername = data[i][0];
      let dbPassword = data[i][1];
      
      if (dbUsername === username && dbPassword === password) {
        let role = data[i][2];
        let targetId = data[i][3];
        return {
          success: true,
          role: role,
          target_id: targetId,
          username: dbUsername,
          message: "Login Berhasil!"
        };
      }
    }
    return { success: false, message: "Kredensial Salah! Periksa username dan password Anda." };
  } catch (error) {
    return { success: false, message: "Terjadi kesalahan server: " + error.toString() };
  }
}

function ubahPasswordUser(username, passwordLama, passwordBaru) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("users");
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username && data[i][1] === passwordLama) {
        // Update di kolom password (kolom indeks 2)
        sheet.getRange(i + 1, 2).setValue(passwordBaru);
        return { success: true, message: "Password berhasil diperbarui!" };
      }
    }
    return { success: false, message: "Password lama tidak sesuai / User tidak dikenali." };
  } catch (error) {
    return { success: false, message: "Gagal memproses sandi: " + error.toString() };
  }
}
