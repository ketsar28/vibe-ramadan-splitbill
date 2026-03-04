# Ramadan Companion App — Buka Bersama & Zakat Made Easy

Seringkali, momen hangat buka bersama (bukber) berakhir dengan kebingungan saat harus menghitung patungan yang adil, apalagi jika struk makanannya panjang dan rumit. Di sisi lain, menjaga ritme ibadah selama bulan suci Ramadan—seperti memantau jadwal sholat yang akurat, membaca doa harian, hingga menunaikan kewajiban zakat—terkadang membutuhkan beberapa aplikasi yang terpisah.

**Ramadan Companion App** hadir sebagai solusi _all-in-one_ yang menggabungkan kemudahan teknologi AI dengan kebutuhan spiritual di bulan Ramadan. Aplikasi ini dirancang khusus untuk **Mayar Vibecoding Competition 2026**.

## Akar Masalah & Solusi

### 1. Masalah: Ribetnya Hitung Patungan (Split Bill)

Menghitung manual struk makanan setelah bukber seringkali memakan waktu dan rentan salah hitung, terutama saat ada pajak, biaya layanan, atau diskon yang harus dibagi secara proporsional.

- **Solusi:** Integrasi **Gemini AI Vision** untuk memindai struk fisik secara otomatis dan mengonversinya menjadi data digital dalam hitungan detik.

### 2. Masalah: Fragmentasi Fitur Ibadah

User seringkali harus berpindah-pindah aplikasi untuk melihat jadwal sholat, mencari doa harian, atau menghitung zakat mal.

- **Solusi:** Sebuah platform terpadu dengan navigasi intuitif yang mencakup jadwal sholat akurat, kumpulan doa harian Ramadan, hingga kalkulator zakat yang cerdas.

### 3. Masalah: Proses Pembayaran yang Terpisah

Setelah menghitung zakat atau patungan, user masih harus membuka aplikasi perbankan secara manual untuk transfer.

- **Solusi:** Integrasi _deep-link_ dengan **Mayar Headless Commerce API**, memungkinkan pembayaran tagihan atau zakat dilakukan langsung melalui link yang terintegrasi secara seamless.

---

## Fitur Utama

- **AI Split Bill:** Unggah atau foto struk, biarkan AI yang membaca item dan harganya.
- **Jadwal Sholat Akurat:** Sinkronisasi waktu sholat menggunakan metode Kemenag RI (via Aladhan API).
- **Doa Harian Ramadan:** Kumpulan doa penting dengan teks Arab, Latin, dan terjemahan.
- **Kalkulator Zakat Mal:** Hitung kewajiban zakat berdasarkan nisab emas terkini dan bayar langsung via Mayar.
- **PWA Ready:** Dapat diinstal di perangkat mobile maupun desktop untuk akses offline yang lebih cepat.
- **Multi-Theme Support:** Pilihan tema Gelap, Terang, dan tema khusus Ramadan yang elegan.

---

## Teknologi yang Digunakan

Aplikasi ini dibangun dengan fokus pada performa ringan dan estetika modern (_Aurora Glassmorphism_):

- **Backend:** Node.js & Express.js.
- **Frontend:** HTML5, Vanilla CSS3, & Modern JavaScript.
- **Intelligence:** Google Gemini AI (Vision) untuk OCR struk.
- **Payments:** Mayar Headless Commerce API (Headless Payment Link).
- **Data Sources:** Aladhan API (Prayer Times Proxy).
- **Capability:** Service Workers & Web App Manifest (PWA).

---

## Cara Instalasi

Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) di perangkat Anda.

1.  **Clone Repository**

    ```bash
    git clone https://github.com/username/ramadan-companion-mayar.git
    cd ramadan-companion-mayar
    ```

2.  **Instal Dependensi**

    ```bash
    npm install
    ```

3.  **Konfigurasi Environment**
    Buat file `.env` di direktori akar dan isi dengan API Key Anda:

    ```env
    PORT=3000
    GEMINI_API_KEY=your_gemini_api_key
    MAYAR_API_KEY=your_mayar_api_key
    MAYAR_API_URL=https://api.mayar.club/hl/v1/payment/create
    ```

4.  **Jalankan Aplikasi**
    ```bash
    npm start
    ```
    Buka `http://localhost:3000` di browser favorit Anda.

---

## Integrasi & Ekosistem

Aplikasi ini sangat bergantung pada ekosistem **Mayar** untuk menangani alur transaksi keuangan. Setiap kali user mengonfirmasi tagihan atau zakat, sistem akan berkomunikasi dengan API Mayar untuk membuat link pembayaran unik yang aman dan mendukung berbagai metode pembayaran (VA, E-Wallet, QRIS).

---

Aplikasi ini dikembangkan dengan dedikasi penuh untuk memberikan manfaat nyata bagi masyarakat muslim di Indonesia, sekaligus menunjukkan potensi luar biasa dari integrasi AI dan _Fintech_ dalam menyederhanakan kehidupan sehari-hari.

**Dibuat oleh:**
**Muhammad Ketsar Ali Abi Wahid**
_Crafted for Mayar Vibecoding Competition — Ramadan 2026_
