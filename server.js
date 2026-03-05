require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ storage: multer.memoryStorage() });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ============================================================
// 1. SCAN — Gemini Vision OCR
// ============================================================
app.post("/api/scan", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    const base64Image = req.file.buffer.toString("base64");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { text: 'You are an AI assistant helping to parse food receipts. Extract all items and their prices from this receipt. Return ONLY a valid JSON array of objects, where each object has "name" (string) and "price" (number). Do not include any other text, markdown formatting, or explanations. Just the JSON array. Example: [{"name": "Nasi Goreng", "price": 25000}]' },
          { inlineData: { data: base64Image, mimeType: req.file.mimetype } }
        ]
      }]
    });
    let rawJson = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    res.json({ success: true, data: JSON.parse(rawJson) });
  } catch (error) {
    console.error("[Scan] Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to process receipt image" });
  }
});

// ============================================================
// 2. PAY — Mayar Headless Commerce
// ============================================================
app.post("/api/pay", async (req, res) => {
  try {
    const { payerName, amount, description } = req.body;
    if (!payerName || !amount) return res.status(400).json({ error: "Missing required fields" });

    const MAYAR_API_URL = process.env.MAYAR_API_URL || "https://api.mayar.club/hl/v1/payment/create";
    const payload = {
      name: `Patungan Bukber - ${payerName}`,
      amount: parseInt(amount),
      description: description || "Pembayaran patungan bukber SplitBill",
      email: `${payerName.toLowerCase().replace(/[^a-z0-9]/g, "") || "guest"}@splitbill.local`,
      mobile: "081111111111"
    };

    console.log("[Mayar] Creating:", payload.name, "Rp", payload.amount);
    const mayarRes = await axios.post(MAYAR_API_URL, payload, {
      headers: { Authorization: `Bearer ${process.env.MAYAR_API_KEY}`, "Content-Type": "application/json" }
    });
    const link = mayarRes.data.data?.link;
    console.log("[Mayar] Link:", link);
    res.json({ success: true, link, raw: mayarRes.data });
  } catch (error) {
    console.error("[Mayar] Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate payment link", details: error.response?.data });
  }
});

// ============================================================
// 3. PRAYER TIMES — MyQuran v3 (Kemenag RI)
// ============================================================

// Search cities
app.get("/api/cities", async (req, res) => {
  try {
    const keyword = req.query.q || "jakarta";
    const url = `https://api.myquran.com/v3/sholat/kota/cari/${encodeURIComponent(keyword)}`;
    const response = await axios.get(url, { timeout: 8000 });
    res.json({ success: true, data: response.data.data || [] });
  } catch (error) {
    console.error("[Cities] Error:", error.message);
    res.status(500).json({ error: "Failed to search cities" });
  }
});

// Get prayer schedule by city ID and date
app.get("/api/prayer-times", async (req, res) => {
  try {
    const cityId = req.query.cityId || "58a2fc6ed39fd083f55d4182bf88826d"; // Default: Jakarta
    const today = new Date();
    const dateStr = req.query.date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const url = `https://api.myquran.com/v3/sholat/jadwal/${cityId}/${dateStr}`;
    const response = await axios.get(url, { timeout: 8000 });
    const d = response.data.data;

    if (!d || !d.jadwal) throw new Error("Invalid response from MyQuran API");

    // v3 returns jadwal keyed by date
    const jadwal = d.jadwal[dateStr] || Object.values(d.jadwal)[0];

    res.json({
      success: true,
      lokasi: d.kabko || "Unknown",
      provinsi: d.prov || "",
      jadwal: {
        imsak: jadwal.imsak,
        subuh: jadwal.subuh,
        terbit: jadwal.terbit,
        dhuha: jadwal.dhuha,
        dzuhur: jadwal.dzuhur,
        ashar: jadwal.ashar,
        maghrib: jadwal.maghrib,
        isya: jadwal.isya,
        tanggal: jadwal.tanggal
      }
    });
  } catch (error) {
    console.error("[Prayer] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch prayer times" });
  }
});
// ============================================================
// 4. AL-QURAN — equran.id v2 proxy
// ============================================================

// List all surahs
app.get("/api/quran/surat", async (req, res) => {
  try {
    const response = await axios.get("https://equran.id/api/v2/surat", { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error("[Quran] Error listing surahs:", error.message);
    res.status(500).json({ error: "Failed to fetch surah list" });
  }
});

// Get surah detail with all ayats
app.get("/api/quran/surat/:nomor", async (req, res) => {
  try {
    const url = `https://equran.id/api/v2/surat/${req.params.nomor}`;
    const response = await axios.get(url, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error("[Quran] Error fetching surah:", error.message);
    res.status(500).json({ error: "Failed to fetch surah" });
  }
});

// ============================================================
// 5. HADITS — hadith API proxy  
// ============================================================

// List available books (perawi)
app.get("/api/hadith/books", async (req, res) => {
  try {
    const books = [
      { id: "bukhari", name: "Shahih Bukhari", total: 6638 },
      { id: "muslim", name: "Shahih Muslim", total: 4930 },
      { id: "abu-daud", name: "Sunan Abu Daud", total: 4419 },
      { id: "tirmidzi", name: "Sunan Tirmidzi", total: 3625 },
      { id: "nasai", name: "Sunan Nasa'i", total: 5364 },
      { id: "ibnu-majah", name: "Sunan Ibnu Majah", total: 4285 },
      { id: "ahmad", name: "Musnad Ahmad", total: 4305 },
      { id: "malik", name: "Muwatta Malik", total: 1587 },
      { id: "darimi", name: "Sunan Darimi", total: 2949 }
    ];
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ error: "Failed" });
  }
});

// Get hadith by book and number
app.get("/api/hadith/:book/:number", async (req, res) => {
  try {
    const url = `https://api.hadith.gading.dev/books/${req.params.book}/${req.params.number}`;
    const response = await axios.get(url, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error("[Hadith] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch hadith" });
  }
});

// Get hadith range by book
app.get("/api/hadith/:book", async (req, res) => {
  try {
    const range = req.query.range || "1-10";
    const url = `https://api.hadith.gading.dev/books/${req.params.book}?range=${range}`;
    const response = await axios.get(url, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error("[Hadith] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch hadiths" });
  }
});

// ============================================================
// 6. KALENDER — myquran API proxy
// ============================================================
app.get("/api/kalender/:tahun/:bulan", async (req, res) => {
  try {
    const url = `https://api.myquran.com/v3/sholat/kalender/${req.params.tahun}/${req.params.bulan}`;
    const response = await axios.get(url, { timeout: 10000 });
    res.json(response.data);
  } catch (error) {
    console.error("[Kalender] Error:", error.message);
    res.status(500).json({ error: "Failed to fetch kalender" });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
