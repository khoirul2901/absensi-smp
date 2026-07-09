/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  username: string;
  role: string;
  target_id: string;
  success?: boolean;
  message?: string;
}

export interface ConfigJam {
  jam_masuk_mulai: string;
  jam_masuk_batas: string;
  jam_pulang_mulai: string;
  error?: string;
}

export interface HariLibur {
  tanggal: string | Date;
  keterangan: string;
}

export interface Siswa {
  id_siswa: string;
  nisn: string;
  nama_siswa: string;
  jenis_kelamin: string;
  kelas: string;
  jurusan: string;
  no_hp_ortu: string;
  qr_content: string;
}

export interface Guru {
  id_guru: string;
  nip_nuptk: string;
  nama_guru: string;
  jenis_kelamin: string;
  jabatan_tugas: string;
  no_hp: string;
  qr_content: string;
}

export interface LiveAbsen {
  id_target: string;
  nama_target: string;
  kelas_jurusan: string;
  jam_masuk: string;
  status_masuk: string;
  jam_pulang: string;
  status_pulang: string;
}

export interface LaporanRow {
  id_log_siswa?: string;
  id_log_guru?: string;
  tanggal: string;
  id_siswa?: string;
  id_guru?: string;
  nama_siswa?: string;
  nama_guru?: string;
  kelas_jurusan?: string;
  jam_masuk: string;
  status_masuk: string;
  jam_pulang: string;
  status_pulang: string;
  ket?: string;
}

export interface RekapPersentase {
  id: string;
  nama: string;
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  persentase: string;
  jam_masuk: string;
  jam_pulang: string;
}

export interface DashboardMetrics {
  totalSiswa: number;
  siswaMasuk: number;
  siswaPulang: number;
  siswaTepat: string;
  siswaTepatInt: number;
  siswaPulangPersenInt: number;
  siswaAlfaInt: number;
  
  totalGuru: number;
  guruMasuk: number;
  guruPulang: number;
  guruTepat: string;
  guruTepatInt: number;
  guruPulangPersenInt: number;
  guruAlfaInt: number;
  
  chartLabels: string[];
  chartData: number[];
}
