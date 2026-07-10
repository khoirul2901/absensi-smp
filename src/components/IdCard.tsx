import React from 'react';
import { Siswa, Guru } from '../types';

interface IdCardProps {
  item: Siswa | Guru;
  kategori: "Siswa" | "Guru";
}

export const IdCard: React.FC<IdCardProps> = ({ item, kategori }) => {
  const isSiswa = kategori === "Siswa";
  const name = isSiswa ? (item as Siswa).nama_siswa : (item as Guru).nama_guru;
  const id = isSiswa ? (item as Siswa).id_siswa : (item as Guru).id_guru;
  const qrContent = item.qr_content;
  const subDetail = isSiswa 
    ? `${(item as Siswa).kelas || ''} - ${(item as Siswa).jurusan || ''}`
    : ((item as Guru).jabatan_tugas || "Staf Pengajar");
  const identifier = isSiswa 
    ? ((item as Siswa).nisn ? `NISN: ${(item as Siswa).nisn}` : "")
    : ((item as Guru).nip_nuptk ? `NIP/NUPTK: ${(item as Guru).nip_nuptk}` : "");

  return (
    <div className={`w-[260px] h-[400px] bg-white rounded-2xl border-4 overflow-hidden relative flex flex-col items-center justify-between shadow-sm p-4 ${isSiswa ? 'border-blue-600' : 'border-indigo-600'}`} style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      {/* Background decoration */}
      <div className={`absolute top-0 left-0 w-full h-[140px] ${isSiswa ? 'bg-blue-600' : 'bg-indigo-600'} rounded-b-[40%] z-0`}></div>
      
      <div className="z-10 w-full text-center mt-2 space-y-1">
        <h2 className="text-white font-extrabold text-lg tracking-wider">SMK AL-HIKAM</h2>
        <p className="text-white/90 text-[10px] uppercase font-bold tracking-widest">{isSiswa ? 'KARTU PELAJAR' : 'KARTU PEGAWAI'}</p>
      </div>

      <div className="z-10 bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mt-4">
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrContent)}`} 
          alt="QR Code" 
          className="w-32 h-32 object-contain"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="z-10 text-center w-full mt-2 mb-2 space-y-1">
        <h3 className="font-extrabold text-gray-900 text-[15px] leading-tight truncate px-2">{name}</h3>
        <p className="text-xs font-bold text-gray-500 uppercase">{subDetail}</p>
        <p className="text-[10px] text-gray-400 font-mono mt-1">{identifier}</p>
        <p className="text-[10px] text-gray-400 font-mono">{id}</p>
      </div>
      
      <div className={`absolute bottom-0 left-0 w-full h-3 ${isSiswa ? 'bg-blue-600' : 'bg-indigo-600'}`}></div>
    </div>
  );
};
