const fs = require('fs');

function getFile(filename) {
    return fs.readFileSync('sias-gas-project/' + filename + '.html', 'utf8');
}

let index = getFile('Index');

index = index.replace(/<\?!= include\('Styles'\); \?>/, `<style>\n${getFile('Styles')}\n</style>`);
index = index.replace(/<\?!= include\('PageLogin'\); \?>/, getFile('PageLogin'));
index = index.replace(/<\?!= include\('PageDashboard'\); \?>/, getFile('PageDashboard'));
index = index.replace(/<\?!= include\('PageAbsensi'\); \?>/, getFile('PageAbsensi'));
index = index.replace(/<\?!= include\('PageCrud'\); \?>/, getFile('PageCrud'));
index = index.replace(/<\?!= include\('PageLaporan'\); \?>/, getFile('PageLaporan'));
index = index.replace(/<\?!= include\('PageSettings'\); \?>/, getFile('PageSettings'));
index = index.replace(/<\?!= include\('Scripts'\); \?>/, `<script>\n${getFile('Scripts')}\n</script>`);

fs.writeFileSync('sias-gas-project/Frontend_Blogger.html', index);
console.log('Done');
