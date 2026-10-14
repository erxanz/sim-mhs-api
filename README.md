# SIM Mahasiswa API (Backend RESTful API)

Backend RESTful API untuk **Sistem Informasi Mahasiswa (SIM)** Universitas Muhammadiyah Bengkulu / Universitas Mercu Buana (UMB). Repositori ini melayani seluruh kebutuhan pertukaran data untuk modul akademik, data mahasiswa, hierarki struktural universitas (Fakultas & Program Studi), manajemen pengguna berbasis peran (*Role-Based Access Control* / RBAC), audit logging, serta sistem pelaporan dan rekapitulasi data mahasiswa dan dosen secara bertingkat.

---

## 📌 Daftar Isi
1. [Fungsi & Fitur Utama](#-fungsi--fitur-utama)
2. [Teknologi & Arsitektur](#-teknologi--arsitektur)
3. [Struktur Folder Proyek](#-struktur-folder-proyek)
4. [Daftar Role & Hak Akses (RBAC)](#-daftar-role--hak-akses-rbac)
5. [Daftar Akun Pengguna Bawaan (Seeder)](#-daftar-akun-pengguna-bawaan-seeder)
6. [Daftar Endpoint API Utama](#-daftar-endpoint-api-utama)
7. [Panduan Instalasi & Menjalankan Lokal](#-panduan-instalasi--menjalankan-lokal)
8. [Deployment ke Vercel](#-deployment-ke-vercel)

---

## 🚀 Fungsi & Fitur Utama

* **Autentikasi & Otorisasi:**
  * Login berbasis JSON Web Token (JWT) dengan *stateless authentication*.
  * Password terenkripsi dengan *salt hashing* menggunakan `bcrypt`.
  * Middleware otorisasi berbasis peran (RBAC) dan pembatasan lingkup akses otomatis (*scope guard*).
* **Hierarki Institusi & Master Data:**
  * Pengelolaan data Universitas, Fakultas, dan Program Studi (Jenjang D3/S1/S2).
* **Manajemen Pengguna (User Management):**
  * Pengelolaan akun pimpinan, staf, operator, dosen, dan mahasiswa dengan validasi ketat.
* **Manajemen Data Mahasiswa:**
  * CRUD data pokok mahasiswa (NPM, Nama, Jenis Kelamin, Tanggal Lahir, Tanggal Masuk, Status Akademik).
  * Dukungan pencarian, filter status, filter fakultas/prodi, serta pagination.
* **Sistem Pelaporan & Rekapitulasi Berjenjang (Multi-Tier Reporting):**
  * **Rektorat:** Melihat rekapitulasi mahasiswa dan daftar seluruh dosen se-universitas.
  * **Dekanat:** Rekapitulasi mahasiswa dan daftar dosen khusus di bawah naungan fakultasnya.
  * **Kaprodi:** Rekapitulasi mahasiswa dan daftar dosen khusus di bawah program studinya.
  * Terintegrasi dengan endpoint yang siap diekspor ke **CSV** dan dicetak ke **PDF**.
* **Keamanan & Audit Logging:**
  * Pencatatan riwayat setiap aksi manipulasi data (*create*, *update*, *delete*) ke dalam tabel `audit_log` lengkap dengan IP Address dan data lama/baru.
  * Proteksi HTTP Headers via `helmet`, pembatasan request per IP via `express-rate-limit`, dan proteksi `cors`.
* **Dokumentasi Interaktif:**
  * Dokumentasi OpenAPI 3.0 via Swagger UI yang dapat diakses langsung pada `/docs`.

---

## 🛠 Teknologi & Arsitektur

* **Runtime:** Node.js (ES Module / `type: "module"`)
* **Framework:** Express.js v5
* **ORM & Database:** Prisma ORM v7 dengan PostgreSQL (Neon Serverless / Supabase / Local PostgreSQL)
* **Validasi Skema:** Zod (`zod`)
* **Keamanan:** `jsonwebtoken`, `bcrypt`, `helmet`, `cors`, `express-rate-limit`
* **Dokumentasi:** `swagger-ui-express` (OpenAPI 3.0)
* **Testing:** Vitest & Supertest

---

## 📂 Struktur Folder Proyek

```text
sim-mhs-api/
├── api/                          # Entrypoint Serverless Vercel
│   └── index.js                  # Handler Vercel untuk me-redirect request ke Express app
├── prisma/                       # Konfigurasi & Skema Basis Data (Prisma)
│   ├── schema.prisma             # Pemodelan tabel & relasi database PostgreSQL
│   ├── seed.ts                   # Skrip seeder otomatis (data universitas, fakultas, prodi, akun role, dosen, mahasiswa)
│   └── migrations/               # Riwayat migrasi Prisma database
├── scripts/                      # Skrip bantu (utility scripts)
│   ├── apply-schema.mjs          # Penerapan skema SQL langsung
│   └── seed-new-roles.mjs        # Skrip seeder penambahan role baru
├── src/                          # Sumber Kode Utama Aplikasi (Express.js)
│   ├── config/                   # Konfigurasi Aplikasi & Library Eksternal
│   │   ├── env.js                # Parsing & validasi variabel lingkungan (.env)
│   │   ├── jwt.js                # Konfigurasi secret key, expiry token, & helper JWT
│   │   ├── prisma.js             # Inisialisasi Prisma Client & Neon Database Adapter
│   │   └── validate.js           # Middleware adapter validasi request menggunakan Zod
│   ├── controllers/              # Layer Pengendali HTTP (Request & Response)
│   │   ├── audit-log.controller.js # Handler log aktivitas sistem
│   │   ├── auth.controller.js      # Handler login, logout, refresh token, & profil aktif
│   │   ├── fakultas.controller.js  # Handler CRUD data fakultas
│   │   ├── mahasiswa.controller.js # Handler CRUD data mahasiswa
│   │   ├── pengguna.controller.js  # Handler CRUD akun pengguna
│   │   ├── program-studi.controller.js # Handler CRUD data program studi
│   │   ├── report.controller.js    # Handler statistik dan rekapitulasi data
│   │   ├── roles.controller.js     # Handler master role
│   │   └── universitas.controller.js # Handler informasi institusi universitas
│   ├── docs/                     # Dokumentasi API Swagger / OpenAPI
│   │   └── openapi.js            # Definisi spesifikasi OpenAPI 3.0 (endpoint, schemas, security)
│   ├── errors/                   # Penanganan Error Terpusat
│   │   ├── ApiError.js           # Custom class error dengan HTTP Status Code
│   │   └── index.js              # Export helper error
│   ├── middleware/               # Middleware Express
│   │   ├── audit-log.js          # Otomatisasi pencatatan audit log saat terjadi mutasi data
│   │   ├── auth.js               # Middleware verifikasi JWT (authenticate) & hak akses role (authorize)
│   │   ├── error.js              # Global error handling middleware (merapikan pesan error JSON)
│   │   └── rate-limit.js         # Pembatasan kuota request untuk pencegahan brute-force
│   ├── routes/                   # Definisi Rute API (URL Endpoints)
│   │   ├── audit-log.routes.js   # Rute /audit-log
│   │   ├── auth.routes.js        # Rute /auth
│   │   ├── fakultas.routes.js    # Rute /fakultas
│   │   ├── index.js              # Router agregator utama (/api/v1)
│   │   ├── mahasiswa.routes.js   # Rute /mahasiswa
│   │   ├── pengguna.routes.js    # Rute /pengguna
│   │   ├── program-studi.routes.js # Rute /program-studi
│   │   ├── report.routes.js      # Rute /reports (rekapitulasi & rekap dosen)
│   │   ├── roles.routes.js       # Rute /roles
│   │   └── universitas.routes.js # Rute /universitas
│   ├── services/                 # Layer Business Logic & Query Basis Data (Prisma)
│   │   ├── audit-log.service.js
│   │   ├── auth.service.js
│   │   ├── fakultas.service.js
│   │   ├── mahasiswa.service.js
│   │   ├── pengguna.service.js
│   │   ├── program-studi.service.js
│   │   ├── report.service.js     # Logika rekapitulasi bertingkat (Rektorat, Dekanat, Kaprodi)
│   │   ├── roles.service.js
│   │   └── universitas.service.js
│   ├── validators/               # Skema Validasi Input Data (Zod Schemas)
│   │   ├── auth.validator.js
│   │   ├── fakultas.validator.js
│   │   ├── mahasiswa.validator.js
│   │   ├── pengguna.validator.js
│   │   └── program-studi.validator.js
│   ├── app.js                    # Konfigurasi middleware Express & registrasi rute
│   └── server.js                 # Entrypoint server lokal (menjalankan port listen)
├── .env                          # File konfigurasi credential & database (jangan di-commit)
├── .env.example                  # Template variabel lingkungan
├── package.json                  # Dependensi library & skrip perintah NPM
├── prisma.config.ts              # Konfigurasi Prisma 7
├── tsconfig.json                 # Konfigurasi TypeScript
└── vercel.json                   # Konfigurasi build dan routing deployment Vercel
```

---

## 👥 Daftar Role & Hak Akses (RBAC)

Sistem ini menerapkan pembagian wewenang yang tegas (*Role-Based Access Control*) dengan rincian sebagai berikut:

| No | Kode Role | Nama Role | Lingkup Akses (*Scope*) | Fitur & Wewenang Utama |
|:--:|:---|:---|:---|:---|
| 1 | `ADMIN` | Administrator Sistem | Seluruh Universitas (Global) | Akses penuh CRUD ke semua modul: Pengguna, Master Role, Profil Kampus, Fakultas, Program Studi, Data Mahasiswa, Rekapitulasi, dan Audit Log. |
| 2 | `REKTORAT` | Rektorat / Pimpinan Universitas | Seluruh Universitas (Makro) | Monitoring statistik eksekutif tingkat universitas, melihat rekapitulasi seluruh mahasiswa semua fakultas (bisa diunduh CSV/PDF), dan melihat direktori seluruh dosen. |
| 3 | `DEKANAT` | Dekanat / Pimpinan Fakultas | Tingkat Fakultas Terkait (`idFakultas`) | Monitoring statistik fakultas, melihat rekapitulasi mahasiswa khusus di bawah fakultasnya (bisa diunduh CSV/PDF), dan melihat daftar dosen khusus fakultasnya (Export CSV & Cetak PDF). |
| 4 | `ADMIN_DEKANAT` | Staf Tata Usaha / Operator Dekanat | Tingkat Fakultas Terkait (`idFakultas`) | Membantu operasional administrasi fakultas dan pengelolaan laporan tingkat dekanat. |
| 5 | `KAPRODI` | Ketua Program Studi | Tingkat Program Studi Terkait (`idProgramStudi`) | Monitoring akademik program studi, mengelola data mahasiswa prodinya, rekapitulasi mahasiswa prodinya (Export CSV/PDF), dan melihat daftar dosen prodinya (Export CSV/PDF). |
| 6 | `ADMIN_PRODI` | Operator / Staf Administrasi Prodi | Tingkat Program Studi Terkait (`idProgramStudi`) | Membantu entry data mahasiswa dan laporan operasional tingkat program studi. |
| 7 | `BAAK` | Biro Administrasi Akademik & Kemahasiswaan | Seluruh Universitas (Akademik) | Pengelolaan data pokok mahasiswa, pembaruan status mahasiswa (Aktif/Cuti/Lulus/DO), serta rekapitulasi akademik universitas. |
| 8 | `DOSEN` | Tenaga Pengajar / Dosen | Program Studi / Fakultas Terkait | Melihat daftar mahasiswa di program studinya, melihat rekan dosen, dan data pengajaran. |
| 9 | `MAHASISWA` | Mahasiswa | Data Pribadi (*Self Only*) | Melihat data diri, profil mahasiswa, dan status akademik pribadi. |

---

## 🔑 Daftar Akun Pengguna Bawaan (Seeder)

Seluruh akun di bawah ini telah disuntikkan (*seeded*) ke dalam basis data dan dapat langsung digunakan untuk keperluan login maupun pengujian antar-peran:

| No | Role | Username | Password | Nama Lengkap | Lingkup Unit Kerja / Hak Akses |
|:--:|:---|:---|:---|:---|:---|
| 1 | **ADMIN** | `admin` | `Admin123!` | Administrator Sistem | Universitas Mercu Buana (Super Admin) |
| 2 | **REKTORAT** | `rektor` | `Rektor123!` | Prof. Dr. Ir. Herman Susilo, M.Sc. | Pimpinan Tingkat Universitas |
| 3 | **DEKANAT** | `dekan_fti` | `Dekan123!` | Dr. Hendra Gunawan, S.T., M.T. | Dekan Fakultas Teknik Informasi (FTI) |
| 4 | **ADMIN_DEKANAT** | `adm_dekanat` | `AdmDekan123!` | Staff Administrasi FTI | Tata Usaha Fakultas Teknik Informasi (FTI) |
| 5 | **KAPRODI** | `kaprodi_ti` | `Kaprodi123!` | Dr. Ratna Sari, M.Kom. | Kaprodi S1 Teknik Informatika (FTI) |
| 6 | **ADMIN_PRODI** | `adm_prodi_ti` | `AdmProdi123!` | Operator Prodi TI | Staf Prodi S1 Teknik Informatika (FTI) |
| 7 | **BAAK** | `baak` | `Baak123!` | Petugas BAAK | Biro Administrasi Akademik Universitas |
| 8 | **DOSEN** | `dosen01` | `Dosen123!` | Dr. Budi Santoso, M.Kom. | Dosen FTI — S1 Teknik Informatika |
| 9 | **DOSEN** | `dosen02` | `Dosen123!` | Dr. Ir. Siti Nurhaliza, M.T. | Dosen FTI — S1 Sistem Informasi |
| 10 | **DOSEN** | `dosen03` | `Dosen123!` | Ahmad Fauzi, S.Kom., M.Cs. | Dosen FTI — S1 Teknik Informatika |
| 11 | **DOSEN** | `dosen04` | `Dosen123!` | Dr. Maya Indah, S.E., M.M. | Dosen FEB — S1 Manajemen |
| 12 | **MAHASISWA** | `mhs001` | `Mhs12345!` | Andi Pratama | Mahasiswa S1 Teknik Informatika (NPM: 2021101001) |

> 💡 **Catatan Keamanan:** Semua password akun di atas di-hash menggunakan algoritma `bcrypt` dengan 10 salt rounds saat seeding berlangsung.

---

## 📡 Daftar Endpoint API Utama

Base URL Lokal: `http://localhost:3000/api/v1`  
Dokumentasi Swagger UI: `http://localhost:3000/docs`

### 1. Autentikasi (`/auth`)
* `POST /auth/login` — Login pengguna (mengembalikan Bearer JWT token & profil pengguna).
* `GET /auth/me` — Mengambil data akun yang sedang login (*Authorization: Bearer <token>*).
* `POST /auth/refresh` — Memperbarui token autentikasi.
* `POST /auth/logout` — Logout dan invalidasi sesi.

### 2. Pelaporan & Rekapitulasi Data (`/reports`)
* `GET /reports/rekapitulasi` — Rekapitulasi data mahasiswa (otomatis scoped: Rektorat = Se-Univ, Dekanat = Fakultas, Kaprodi = Prodi). Mendukung filter `status`, `id_prodi`, `tahun`, dan `q`.
* `GET /reports/dosen` — Daftar data dosen dan status aktifnya (otomatis scoped: Dekanat = Fakultas, Kaprodi = Prodi). Mendukung filter `id_prodi`, `status_aktif`, dan `q`.
* `GET /reports/statistik-mahasiswa` — Rekap jumlah mahasiswa per status akademik (Aktif, Cuti, Lulus, Drop Out).
* `GET /reports/mahasiswa-per-prodi` — Distribusi sebaran jumlah mahasiswa per program studi.

### 3. Data Mahasiswa (`/mahasiswa`)
* `GET /mahasiswa` — Mengambil daftar mahasiswa (pagination, search, filter prodi & status).
* `GET /mahasiswa/:id` — Detail lengkap seorang mahasiswa.
* `POST /mahasiswa` — Menambahkan mahasiswa baru.
* `PUT /mahasiswa/:id` — Memperbarui data mahasiswa.
* `DELETE /mahasiswa/:id` — Menghapus mahasiswa.

### 4. Data Pengguna (`/pengguna`)
* `GET /pengguna` — Daftar semua user akun sistem (khusus Admin).
* `POST /pengguna` — Membuat user baru beserta perannya.
* `PUT /pengguna/:id` — Update data akun / role.
* `DELETE /pengguna/:id` — Menghapus akun.

### 5. Struktur Kampus (`/universitas`, `/fakultas`, `/program-studi`)
* `GET /universitas` & `PUT /universitas/:id` — Data profil kampus.
* `GET /fakultas`, `POST /fakultas`, `PUT /fakultas/:id`, `DELETE /fakultas/:id` — Master Fakultas.
* `GET /program-studi`, `POST /program-studi`, `PUT /program-studi/:id`, `DELETE /program-studi/:id` — Master Program Studi.

### 6. Audit Logging (`/audit-log`)
* `GET /audit-log` — Melihat log histori aktivitas mutasi data oleh pengguna (Admin).

---

## 💻 Panduan Instalasi & Menjalankan Lokal

### 1. Prasyarat
* **Node.js** (versi 18 LTS atau 20 LTS disarankan).
* **NPM** (versi 9 ke atas).
* Koneksi internet untuk menjangkau database PostgreSQL Neon / Supabase, atau PostgreSQL lokal.

### 2. Kloning & Masuk ke Direktori
```powershell
cd d:\laragon\laragon\www\SIM_MAHASISWA\sim-mhs-api
```

### 3. Konfigurasi Variabel Lingkungan (`.env`)
Buat atau periksa berkas `.env` pada root direktori:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://username:password@ep-sample-pooler.region.neon.tech/sim_mahasiswa?sslmode=require"
JWT_SECRET="rahasia_super_aman_jwt_secret_key_umb_2026"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
```

### 4. Instalasi Dependensi
```powershell
npm install
```

### 5. Sinkronisasi Database & Generate Prisma Client
```powershell
# Generate Prisma Client TS
npm run db:generate

# Sinkronkan skema tabel ke database
npm run db:push
```

### 6. Jalankan Seeder Database
Untuk mengisikan semua role, akun user di tabel atas, fakultas, prodi, dan sampel mahasiswa:
```powershell
npm run db:seed
```

### 7. Jalankan Server API
```powershell
# Mode Development (auto-reload saat kode diedit)
npm run dev

# Atau mode Production
npm start
```
Server akan berjalan di: `http://localhost:3000`  
Dokumentasi interaktif dapat dibuka di: `http://localhost:3000/docs`

---

## 🌐 Deployment ke Vercel

Repositori ini telah dikonfigurasi dengan `vercel.json` dan folder `api/index.js` agar dapat dideploy tanpa kendala ke Vercel:

1. Pastikan Anda telah mengonfigurasi Environment Variables di Vercel Dashboard:
   * `DATABASE_URL` = URL koneksi PostgreSQL Neon/Supabase
   * `JWT_SECRET` = Secret key JWT produksi
   * `JWT_EXPIRES_IN` = `7d`
   * `NODE_ENV` = `production`
2. Push commit terbaru ke branch `main`:
   ```powershell
   git add .
   git commit -m "docs: add comprehensive README with architecture, roles, and seeder credentials"
   git push origin main
   ```
3. Vercel akan otomatis melakukan *Build & Deploy*, dan API siap diakses secara publik.

---
*Dikembangkan untuk Sistem Informasi Mahasiswa (SIM) — Universitas Muhammadiyah Bengkulu.*
