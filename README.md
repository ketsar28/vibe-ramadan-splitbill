# 🌙 Sahabat Ramadan — AI-Powered Ramadan Companion

**Sahabat Ramadan** adalah aplikasi pendamping ibadah yang cerdas dan estetik, dirancang khusus untuk mempermudah umat Muslim dalam menjalani bulan suci Ramadan. Aplikasi ini menggabungkan kekuatan **AI (Gemini Vision)** untuk otomasi patungan bukber dan integrasi **Mayar Headless API** untuk pembayaran zakat serta tagihan secara instan.

**Link Production:** [https://sahabat-ramadan.netlify.app/](https://sahabat-ramadan.netlify.app/)

---

## ✨ Fitur Unggulan

### 📸 AI Split Bill (Scan Struk)

- **Problem:** Ribet hitung patungan bukber manual.
- **Solution:** Cukup foto struk, Gemini AI Vision akan mendeteksi setiap item, harga, pajak, dan servis secara otomatis. User tinggal bagi tagihan dan generate link bayar Mayar.

### 💰 Kalkulator Zakat Pintar

- **Zakat Mal:** Hitung kewajiban berdasarkan nisab emas terkini.
- **Zakat Fitrah:** Pilihan perhitungan menggunakan **Kg (2.5)** atau **Liter (3.5)** sesuai kebiasaan masing-masing, lengkap dengan integrasi pembayaran Mayar.

### 🕋 Islamic Toolbox Lengkap

- **Jadwal Sholat:** Data akurat KEMENAG RI berdasarkan lokasi kota.
- **Al-Quran & Hadits:** Bacaan digital yang ringan dan responsif.
- **Tasbih Digital:** Target dzikir yang bisa disesuaikan.
- **Mutaba'ah Yaumiyah:** Checklist ibadah harian untuk menjaga konsistensi.
- **Kalender Hijriyah & Arah Kiblat:** Penunjang ibadah harian.

---

## 🎨 Premium Experience

Aplikasi ini dibangun dengan fokus pada **Vibes & Aesthetics**:

- **Instant Splash Screen:** Animasi pembuka yang halus untuk kesan premium.
- **Aurora Glassmorphism UI:** Desain modern yang memanjakan mata dengan dukungan Mode Gelap (Dark Mode).
- **Privacy First:** Semua riwayat transaksi dan data ibadah disimpan di `localStorage` perangkat user. Privasi 100% terjaga.
- **PWA Ready:** Bisa di-install di Android/iOS layaknya aplikasi native.

---

## 🛠️ Stack Teknologi

- **Core:** Node.js, Express.js.
- **AI Engine:** Google Gemini AI (Vision & Flash).
- **Payment Gateway:** Mayar Headless Commerce API.
- **Cloud Hosting:** Netlify (Production).
- **Styling:** Vanilla CSS (Modern Custom Properties & Animations).

---

## 🚀 Instalasi Lokal

1. **Clone Repo**

   ```bash
   git clone https://github.com/ketsar28/vibe-ramadan-splitbill.git
   cd vibe-ramadan-splitbill
   ```

2. **Install Deps**

   ```bash
   npm install
   ```

3. **Setup .env**

   ```env
   GEMINI_API_KEY=your_key
   MAYAR_API_KEY=your_production_key
   MAYAR_API_URL=https://api.mayar.id/hl/v1/payment/create
   ```

4. **Run**
   ```bash
   npm start
   ```

---

**Dibuat oleh:**
**Muhammad Ketsar Ali Abi Wahid**
_Crafted for Mayar Vibecoding Competition — Ramadan 2026_
