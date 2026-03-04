require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

// Setup Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // Serve frontend files

// Setup Multer for handling file uploads (in memory for efficiency)
const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * 1. SCAN ENDPOINT: Receives an image, uses Gemini Vision to parse it
 */
app.post("/api/scan", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: 'You are an AI assistant helping to parse food receipts. Extract all items and their prices from this receipt. Return ONLY a valid JSON array of objects, where each object has "name" (string) and "price" (number). Do not include any other text, markdown formatting, or explanations. Just the JSON array. Example: [{"name": "Nasi Goreng", "price": 25000}]',
            },
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
    });

    let rawJson = response.text;
    rawJson = rawJson.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(rawJson);
    res.json({ success: true, data: parsedData });
  } catch (error) {
    console.error("Error in /api/scan:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to process receipt image" });
  }
});

/**
 * 2. PAY ENDPOINT: Calls Mayar API to generate payment link
 */
app.post("/api/pay", async (req, res) => {
  try {
    const { payerName, amount, description } = req.body;

    if (!payerName || !amount) {
      return res.status(400).json({ error: "Missing required payer fields" });
    }

    const MAYAR_API_URL =
      process.env.MAYAR_API_URL ||
      "https://api.mayar.club/hl/v1/payment/create";

    // Payload — only fields supported by Mayar Headless Commerce API
    const payload = {
      name: `Patungan Bukber - ${payerName}`,
      amount: parseInt(amount),
      description: description || "Pembayaran patungan bukber SplitBill",
      email: `${payerName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'guest'}@splitbill-bukber.local`,
      mobile: "081111111111"
    };

    console.log("[Mayar] Creating payment:", payload.name, "Rp", payload.amount);

    const mayarResponse = await axios.post(MAYAR_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${process.env.MAYAR_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const checkoutLink = mayarResponse.data.data?.link;
    console.log("[Mayar] Payment link:", checkoutLink);

    res.json({ success: true, link: checkoutLink, raw: mayarResponse.data });
  } catch (error) {
    console.error("Error in /api/pay:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to generate Mayar payment link",
      details: error.response?.data,
    });
  }
});

/**
 * 3. PRAYER TIMES ENDPOINT: Proxy to Aladhan API for accurate prayer times
 *    Uses Kemenag method (method=20) for Indonesia
 */
app.get("/api/prayer-times", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const latitude = lat || "-6.2088";
    const longitude = lng || "106.8456";

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();

    const aladhanUrl = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=20&shafaq=general`;

    const response = await axios.get(aladhanUrl, { timeout: 8000 });
    const timings = response.data.data.timings;
    const date = response.data.data.date;

    res.json({
      success: true,
      timings: {
        Subuh: timings.Fajr,
        Terbit: timings.Sunrise,
        Dzuhur: timings.Dhuhr,
        Ashar: timings.Asr,
        Maghrib: timings.Maghrib,
        Isya: timings.Isha,
      },
      date: date,
    });
  } catch (error) {
    console.error("Error fetching prayer times:", error.message);
    res.status(500).json({ error: "Failed to fetch prayer times" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
