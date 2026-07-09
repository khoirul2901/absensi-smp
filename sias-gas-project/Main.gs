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
