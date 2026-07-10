import React from 'react';
import { Siswa, Guru } from '../types';
import { GraduationCap, BookOpen } from 'lucide-react';

interface IdCardProps {
  item: Siswa | Guru;
  kategori: "Siswa" | "Guru";
}

export const IdCard: React.FC<IdCardProps> = ({ item, kategori }) => {
  const isSiswa = kategori === "Siswa";
  const name = isSiswa ? (item as Siswa).nama_siswa : (item as Guru).nama_guru;
  const id = isSiswa ? (item as Siswa).id_siswa : (item as Guru).id_guru;
  const qrContent = item.qr_content;
  
  const kelas = isSiswa ? (item as Siswa).kelas : "-";
  const identifierLabel = isSiswa ? "NISN" : "NIP/NUPTK";
  const identifierValue = isSiswa ? (item as Siswa).nisn : (item as Guru).nip_nuptk;
  const jabatanLabel = isSiswa ? "Jurusan" : "Jabatan";
  const jabatanValue = isSiswa ? (item as Siswa).jurusan : (item as Guru).jabatan_tugas;
  const address = "-"; // Default if no address provided in data

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 shrink-0" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      
      {/* FRONT CARD */}
      <div className="w-[325px] h-[204px] bg-[#e6e6e6] rounded-xl overflow-hidden relative flex flex-col shadow-md border border-gray-300 shrink-0">
        
        {/* Background Decorative Elements */}
        {/* Bottom Left Slashes */}
        <div className="absolute -bottom-8 -left-8 w-24 h-48 bg-[#1e3a8a] rotate-[35deg] z-0"></div>
        <div className="absolute -bottom-10 left-4 w-12 h-48 bg-[#d97706] rotate-[35deg] z-0"></div>
        
        {/* Top Header Section */}
        <div className="absolute top-0 left-0 w-full h-[50px] bg-[#1e3a8a] z-10 flex items-center px-2">
          {/* Decorative swoosh on top right */}
          <div className="absolute top-0 right-0 w-[60%] h-full bg-[#3b82f6] rounded-bl-full opacity-60 z-0"></div>
          
          <div className="relative z-10 w-full flex justify-between items-center">
            <div className="w-9 h-9 rounded-full border border-[#d97706] bg-[#1e3a8a] flex items-center justify-center p-1 shadow-sm">
              <GraduationCap className="w-5 h-5 text-[#d97706]" />
            </div>
            <div className="text-center flex-grow">
              <h2 className="text-[#d97706] font-black text-[14px] leading-none tracking-wide">KARTU IDENTITAS</h2>
              <h3 className="text-white font-bold text-[10px] uppercase leading-tight tracking-wider mt-0.5">SMK AL-HIKAM KREJENGAN</h3>
            </div>
            <div className="w-9 h-9 rounded-full border border-[#d97706] bg-[#1e3a8a] flex items-center justify-center p-1 shadow-sm">
              <BookOpen className="w-5 h-5 text-[#3b82f6]" />
            </div>
          </div>
        </div>

        {/* Address Ribbon */}
        <div className="absolute top-[50px] left-0 w-full h-[14px] bg-[#d97706] z-10 flex items-center justify-center shadow-sm">
          <span className="text-[7px] text-white font-bold uppercase tracking-widest">Krejengan Kec. Krejengan Kab. Probolinggo</span>
        </div>

        {/* Bottom Right Slash */}
        <div className="absolute -bottom-6 -right-6 w-32 h-16 bg-[#1e3a8a] -rotate-12 z-0"></div>
        <div className="absolute bottom-2 -right-6 w-32 h-4 bg-[#d97706] -rotate-12 z-0"></div>

        {/* Content Area */}
        <div className="absolute top-[72px] left-0 w-full px-3 flex gap-3 z-20">
          
          {/* QR Code Box */}
          <div className="w-[85px] h-[100px] bg-[#d97706] p-1 shadow-sm shrink-0 flex flex-col justify-center mt-1">
            <div className="w-full h-full bg-white flex flex-col items-center justify-center relative">
               <img 
                 src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrContent)}`} 
                 alt="QR Code" 
                 className="w-[65px] h-[65px] object-contain"
                 referrerPolicy="no-referrer"
               />
               <span className="text-[7px] font-bold text-gray-500 mt-1 uppercase text-center leading-none">QR Absensi</span>
            </div>
          </div>

          {/* Biodata & Signature */}
          <div className="flex-grow flex flex-col justify-between h-[115px]">
            <table className="text-[9px] text-gray-800 font-semibold leading-[1.25]">
              <tbody>
                <tr>
                  <td className="w-11 align-top">Nama</td>
                  <td className="px-1 align-top">:</td>
                  <td className="font-bold text-[10px] leading-tight align-top">{name}</td>
                </tr>
                {isSiswa && (
                  <tr>
                    <td className="align-top">Kelas</td>
                    <td className="px-1 align-top">:</td>
                    <td className="align-top">{kelas}</td>
                  </tr>
                )}
                <tr>
                  <td className="align-top">{jabatanLabel}</td>
                  <td className="px-1 align-top">:</td>
                  <td className="align-top leading-tight">{jabatanValue || "-"}</td>
                </tr>
                <tr>
                  <td className="align-top">{identifierLabel}</td>
                  <td className="px-1 align-top">:</td>
                  <td className="align-top">{identifierValue || "-"}</td>
                </tr>
                <tr>
                  <td className="align-top">ID / PIN</td>
                  <td className="px-1 align-top">:</td>
                  <td className="align-top">{id}</td>
                </tr>
              </tbody>
            </table>

            {/* Signature Area */}
            <div className="self-end text-center text-[7px] text-gray-800 font-medium mr-2">
              <p>Probolinggo, {today}</p>
              <p>Kepala Sekolah</p>
              <div className="mt-[28px] border-t border-gray-800 border-dotted pt-[2px] w-[80px] mx-auto text-[6px]">
                Ttd. Kepala Sekolah
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* BACK CARD */}
      <div className="w-[325px] h-[204px] bg-[#e6e6e6] rounded-xl overflow-hidden relative flex flex-col shadow-md border border-gray-300 shrink-0">
        
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-[12px] bg-[#d97706] z-10"></div>
        <div className="absolute top-[8px] left-0 w-full h-[18px] bg-[#3b82f6] rounded-b-[100%] z-20"></div>
        <div className="absolute top-0 left-0 w-full h-[12px] bg-[#1e3a8a] rounded-b-[100%] z-30"></div>

        {/* Footer Decor */}
        <div className="absolute bottom-0 left-0 w-full h-[12px] bg-[#d97706] z-10"></div>
        <div className="absolute bottom-[8px] left-0 w-full h-[18px] bg-[#3b82f6] rounded-t-[100%] z-20"></div>
        <div className="absolute bottom-0 left-0 w-full h-[12px] bg-[#1e3a8a] rounded-t-[100%] z-30"></div>

        {/* Watermark Icon */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none z-0">
          <GraduationCap className="w-40 h-40 text-black" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-5 py-4 mt-1">
          <h2 className="text-[14px] font-black text-gray-800 tracking-widest mb-3 uppercase">Ketentuan</h2>
          
          <div className="text-[10px] text-gray-800 leading-relaxed font-semibold w-full">
            <ol className="list-decimal pl-4 space-y-1">
              <li>Kartu ini berlaku selama pemilik masih menjadi {isSiswa ? 'siswa' : 'guru'} SMK AL-HIKAM Krejengan Probolinggo.</li>
              <li>Kartu ini tidak dapat dipindahtangankan atau digunakan oleh orang lain.</li>
              <li>Apabila Anda kehilangan atau menemukan kartu ini, harap segera menghubungi pihak Tata Usaha Sekolah.</li>
            </ol>
          </div>
        </div>

      </div>

    </div>
  );
};
