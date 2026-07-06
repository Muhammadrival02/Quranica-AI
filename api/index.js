const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "50mb" }));

// ===== PERSISTENT DB (file-based — tahan update/deploy) =====
const fs = require("fs");
const DB_FILE = path.join(__dirname, "..", "data", "userDatabase.json");
const PREAPPROVED_FILE = path.join(__dirname, "..", "data", "preApprovedAdmins.json");
const PAYMENTS_FILE = path.join(__dirname, "..", "data", "pendingPayments.json");

// Ensure data dir
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function loadJSON(file, fallback) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8")); }
  catch(e) { console.error("Gagal load " + file + ":", e.message); }
  return fallback;
}
function saveJSON(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8"); }
  catch(e) { console.error("Gagal save " + file + ":", e.message); }
}

let userDatabase = loadJSON(DB_FILE, [
  { uid: "bootstrapped_admin", email: "rivalgamingchannel@gmail.com", displayName: "Admin Utama", role: "Admin", tier: "Berbayar", billingCycle: "Tahunan", createdAt: new Date().toISOString(), password: process.env.ADMIN_PASSWORD || "" },
  { uid: "user_1", email: "ahmad.tafsir@gmail.com", displayName: "Ahmad Tafsir", role: "User", tier: "Reguler", createdAt: new Date().toISOString() },
  { uid: "user_2", email: "fatimah.zahra@yahoo.com", displayName: "Fatimah Az-Zahra", role: "User", tier: "Berbayar", billingCycle: "Bulanan", createdAt: new Date().toISOString() }
]);

let preApprovedSet = loadJSON(PREAPPROVED_FILE, ["rivalgamingchannel@gmail.com"]);
let preApprovedAdmins = new Set(preApprovedSet);

let pendingPayments = loadJSON(PAYMENTS_FILE, []);

// Auto-save after modifications
function saveAll() {
  saveJSON(DB_FILE, userDatabase);
  saveJSON(PREAPPROVED_FILE, [...preApprovedAdmins]);
  saveJSON(PAYMENTS_FILE, pendingPayments);
}

// ===== TELEGRAM BOT =====
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
function isTelegramAdmin(chatId) { return ADMIN_IDS.includes(String(chatId)); }
async function tgSend(chatId, text) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
  });
}

// Load library data
let quranicaLibrary = [];
let rujukanLibrary = [];
try {
  const data = require("../src/data/secondarySources");
  quranicaLibrary = [...data.secondarySources];
} catch(e2) {
  quranicaLibrary = [];
}
try {
  const rdata = require("../src/data/rujukanLinks");
  rujukanLibrary = [...(rdata.rujukanLinks || []), ...(rdata.portalJurnalLinks || [])];
} catch(e3) {
  rujukanLibrary = [];
}

// Load Meta-Ushul methodology (Rival Zamzam Elhasbi, Safwa University 2025)
let metaUshulMethodology = null;
try {
  metaUshulMethodology = require("../src/data/metaUshulMethodology.json");
} catch(e4) {
  metaUshulMethodology = null;
}

// Load Ulumul Qur'an Dauroh reference (Markaz Ad-Dirasat, Ma'had Imam Syathibi)
let ulumulQuranDauroh = null;
try {
  ulumulQuranDauroh = require("../src/data/ulumulQuranDauroh.json");
} catch(e5) {
  ulumulQuranDauroh = null;
}

// Load YouTube reference channels
let youtubeReferences = null;
try {
  youtubeReferences = require("../src/data/youtubeReferences.json");
} catch(e6) {
  youtubeReferences = null;
}

// ===== HEALTH =====
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// ===== USERS =====
app.post("/api/users/profile", (req, res) => {
  const { uid, email, displayName, tier, billingCycle, pekerjaan, phone, password } = req.body;
  if (!uid || !email) return res.status(400).json({ error: "UID dan email wajib" });
  let user = userDatabase.find(u => u.uid === uid || u.email.toLowerCase() === email.toLowerCase());
  const isAdmin = preApprovedAdmins.has(email.toLowerCase());
  if (user) {
    if (displayName) user.displayName = displayName;
    if (tier) user.tier = tier;
    if (billingCycle) user.billingCycle = billingCycle;
    if (isAdmin) user.role = "Admin";
    if (password) user.password = password;
  } else {
    user = { uid, email, displayName: displayName || email.split("@")[0], role: isAdmin ? "Admin" : "User", tier: tier || "Reguler", billingCycle: tier === "Berbayar" ? (billingCycle || "Bulanan") : null, createdAt: new Date().toISOString(), pekerjaan: pekerjaan || "", phone: phone || "", password: password || "" };
    userDatabase.push(user); saveAll();
  }
  res.json(user);
});

app.post("/api/users/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email dan password wajib" });
  const user = userDatabase.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user || (user.password && user.password !== password)) return res.status(401).json({ error: "Email atau password salah" });
  res.json(user);
});

app.get("/api/users", (req, res) => {
  const { adminUid } = req.query;
  const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
  if (!admin) return res.status(403).json({ error: "Akses ditolak" });
  res.json({ users: userDatabase });
});

// ===== ADMIN: ADD ADMIN =====
app.post("/api/users/add-admin", (req, res) => {
  try {
    const { email, adminUid } = req.body;
    if (!email || !adminUid) return res.status(400).json({ error: "Email dan adminUid wajib diisi." });
    const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
    if (!admin) return res.status(403).json({ error: "Akses ditolak. Anda bukan Admin." });
    const emailClean = email.trim().toLowerCase();
    preApprovedAdmins.add(emailClean); saveAll();
    const existingUser = userDatabase.find(u => u.email.toLowerCase() === emailClean);
    if (existingUser) existingUser.role = "Admin";
    res.json({ success: true, message: `Email ${emailClean} berhasil didaftarkan sebagai Admin.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== ADMIN: DELETE USER =====
app.delete("/api/users/:uid", (req, res) => {
  try {
    const { uid } = req.params;
    const { adminUid } = req.body;
    if (!adminUid) return res.status(401).json({ error: "Autentikasi admin diperlukan." });
    const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
    if (!admin) return res.status(403).json({ error: "Akses ditolak." });
    if (uid === adminUid) return res.status(400).json({ error: "Tidak dapat menghapus akun sendiri." });
    const idx = userDatabase.findIndex(u => u.uid === uid);
    if (idx === -1) return res.status(404).json({ error: "User tidak ditemukan." });
    const deleted = userDatabase[idx];
    userDatabase.splice(idx, 1); saveAll();
    res.json({ success: true, message: `User ${deleted.displayName} berhasil dihapus.` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== ADMIN: UPDATE TIER =====
app.post("/api/users/update-tier", (req, res) => {
  try {
    const { uid, tier, billingCycle, adminUid } = req.body;
    if (!uid || !tier) return res.status(400).json({ error: "UID dan tier wajib diisi." });
    if (tier !== "Reguler" && tier !== "Berbayar") return res.status(400).json({ error: "Tier tidak valid." });
    if (adminUid) {
      const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
      if (!admin) return res.status(403).json({ error: "Akses ditolak." });
    }
    const user = userDatabase.find(u => u.uid === uid);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan." });
    user.tier = tier; saveAll();
    user.billingCycle = tier === "Berbayar" ? (billingCycle || "Bulanan") : null;
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== ADMIN: UPDATE ROLE =====
app.post("/api/users/update-role", (req, res) => {
  try {
    const { uid, role, adminUid } = req.body;
    if (!uid || !role) return res.status(400).json({ error: "UID dan peran wajib diisi." });
    if (role !== "Admin" && role !== "User") return res.status(400).json({ error: "Peran tidak valid." });
    if (!adminUid) return res.status(401).json({ error: "Autentikasi admin diperlukan." });
    const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
    if (!admin) return res.status(403).json({ error: "Akses ditolak." });
    const user = userDatabase.find(u => u.uid === uid);
    if (!user) return res.status(404).json({ error: "User tidak ditemukan." });
    if (uid === adminUid) return res.status(400).json({ error: "Tidak dapat mengubah peran sendiri." });
    user.role = role; saveAll();
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== PAYMENT: CREATE PENDING =====
app.post("/api/payment/create", (req, res) => {
  try {
    const { email, displayName, tier, billingCycle, amount, method } = req.body;
    if (!email || !amount) return res.status(400).json({ error: "Data tidak lengkap" });
    const payment = {
      id: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      email: email.toLowerCase(),
      displayName: displayName || email.split("@")[0],
      tier: "Berbayar",
      billingCycle: billingCycle || "Bulanan",
      amount, method: method || "QRIS",
      confirmed: false,
      createdAt: new Date().toISOString()
    };
    pendingPayments.push(payment); saveAll();
    res.json({ ok: true, payment });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/payment/pending", (req, res) => {
  const unconfirmed = pendingPayments.filter(p => !p.confirmed);
  res.json({ payments: unconfirmed });
});

// ===== AI VERIFY PAYMENT PROOF =====
app.post("/api/payment/verify-proof", async (req, res) => {
  try {
    const { paymentId, imageBase64, userEmail } = req.body;
    if (!paymentId || !imageBase64) return res.status(400).json({ error: "paymentId dan imageBase64 wajib" });

    const payment = pendingPayments.find(p => p.id === paymentId);
    if (!payment) return res.status(404).json({ error: "Pembayaran tidak ditemukan" });
    if (payment.confirmed) return res.status(400).json({ error: "Pembayaran sudah dikonfirmasi" });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key tidak dikonfigurasi" });

    // Expected account details
    const expectedAccounts = {
      BCA: { bank: "BCA", number: "7753050282", name: "RINAL ZAMZAM ELHASBI" },
      DANA: { bank: "DANA", number: "085159552762", name: "RINAL ZAMZAM ELHASBI" },
      QRIS: { bank: "QRIS", number: "N/A", name: "Quranica AI / RINAL ZAMZAM ELHASBI" }
    };

    const expected = expectedAccounts[payment.method] || expectedAccounts.QRIS;

    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `ANALISIS BUKTI TRANSFER / PEMBAYARAN

Anda adalah AI verifikator pembayaran Quranica AI. Analisis gambar bukti transfer ini dan berikan hasil dalam JSON.

DETAIL PEMBAYARAN YANG DIHARAPKAN:
- Metode: ${payment.method}
- Jumlah: Rp ${payment.amount.toLocaleString("id-ID")}
- Tujuan: ${expected.bank} ${expected.number} a.n. ${expected.name}
- Email pengguna: ${userEmail || payment.email}

VERIFIKASI:
1. Apakah nominal transfer sesuai? (toleransi ±Rp 1.000)
2. Apakah nomor rekening/tujuan sesuai dengan ${expected.bank}: ${expected.number}?
3. Apakah bukti transfer terlihat asli (ada timestamp, nomor referensi, logo bank)?
4. Apakah ada indikasi manipulasi atau editan?

OUTPUT HANYA JSON (tanpa backtick):
{
  "valid": true/false,
  "confidence": 0-100,
  "amount_match": true/false,
  "detected_amount": "jumlah yang terdeteksi",
  "account_match": true/false,
  "detected_account": "nomor rekening yang terdeteksi",
  "timestamp_detected": "timestamp jika ada",
  "summary": "ringkasan analisis dalam Bahasa Indonesia",
  "red_flags": ["daftar masalah jika ada"]
}`;

    const imagePart = { inlineData: { mimeType: "image/jpeg", data: imageBase64 } };
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { role: "user", parts: [{ text: prompt }, imagePart] }
    });

    let analysis;
    try {
      const raw = result.text.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(raw);
    } catch (e) {
      analysis = { valid: false, confidence: 0, summary: "Gagal parsing hasil AI: " + result.text.slice(0, 200) };
    }

    // Auto-confirm if AI says valid with high confidence
    if (analysis.valid && analysis.confidence >= 70) {
      let user = userDatabase.find(u => u.email.toLowerCase() === (userEmail || payment.email).toLowerCase());
      if (!user) {
        user = {
          uid: `user_${Date.now()}`,
          email: (userEmail || payment.email).toLowerCase(),
          displayName: payment.displayName,
          role: "User",
          tier: "Berbayar",
          billingCycle: payment.billingCycle,
          createdAt: new Date().toISOString(),
          password: ""
        };
        userDatabase.push(user); saveAll();
      } else {
        user.tier = "Berbayar"; saveAll();
        user.billingCycle = payment.billingCycle;
      }
      payment.confirmed = true;
      payment.confirmedAt = new Date().toISOString();
      payment.aiVerification = analysis;
      payment.proofImage = imageBase64.slice(0, 200); // only store prefix for audit

      return res.json({
        ok: true,
        confirmed: true,
        analysis,
        user: { uid: user.uid, email: user.email, displayName: user.displayName, tier: user.tier, billingCycle: user.billingCycle }
      });
    }

    // Not confirmed
    return res.json({
      ok: true,
      confirmed: false,
      analysis,
      message: "Bukti pembayaran tidak dapat diverifikasi otomatis. Mohon periksa kembali."
    });

  } catch (err) {
    console.error("Verify proof error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== TELEGRAM BOT WEBHOOK =====
app.post("/api/telegram-webhook", async (req, res) => {
  try {
    const body = req.body;
    const msg = body.message || (body.callback_query && body.callback_query.message);
    if (!msg) return res.status(200).json({ ok: true });
    const chatId = msg.chat?.id;
    const text = (msg.text || "").trim();
    const fromName = msg.from?.first_name || "";

    if (!chatId || !text) return res.status(200).json({ ok: true });

    const parts = text.split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "/start") {
      const adminMsg = isTelegramAdmin(chatId);
      await tgSend(chatId, adminMsg
        ? `<b>Bot Konfirmasi Quranica AI</b>\n\nHalo ${fromName}!\n\n/confirm &lt;ID&gt; — Konfirmasi bayar\n/pending — Lihat pending\n/upgrade &lt;email&gt; &lt;bulanan|tahunan&gt; — Manual\n/help — Bantuan`
        : `Halo ${fromName}! Silakan lakukan pembayaran di aplikasi. Admin akan konfirmasi.`);
      return res.status(200).json({ ok: true });
    }

    if (!isTelegramAdmin(chatId)) {
      await tgSend(chatId, "⚠️ Akses ditolak.");
      return res.status(200).json({ ok: true });
    }

    if (cmd === "/pending") {
      const list = pendingPayments.filter(p => !p.confirmed);
      if (list.length === 0) {
        await tgSend(chatId, "✅ Tidak ada pembayaran pending.");
      } else {
        const txt = list.map((p, i) =>
          `${i+1}. <b>${p.displayName}</b>\n📧 ${p.email}\n💰 Rp ${p.amount.toLocaleString("id-ID")}\n🏦 ${p.method} (${p.billingCycle})\n🆔 <code>${p.id}</code>\n📅 ${new Date(p.createdAt).toLocaleString("id-ID")}`
        ).join("\n\n");
        await tgSend(chatId, `<b>📋 Pending (${list.length})</b>\n\n${txt}\n\n/confirm &lt;ID&gt; untuk konfirmasi.`);
      }
      return res.status(200).json({ ok: true });
    }

    if (cmd === "/confirm" && parts[1]) {
      const id = parts[1];
      const payment = pendingPayments.find(p => p.id === id);
      if (!payment) { await tgSend(chatId, `❌ ID <code>${id}</code> tidak ditemukan.`); }
      else if (payment.confirmed) { await tgSend(chatId, `⚠️ Sudah dikonfirmasi.`); }
      else {
        let user = userDatabase.find(u => u.email.toLowerCase() === payment.email.toLowerCase());
        if (!user) {
          user = { uid: `user_${Date.now()}`, email: payment.email, displayName: payment.displayName, role: "User", tier: "Berbayar", billingCycle: payment.billingCycle, createdAt: new Date().toISOString(), password: "" };
          userDatabase.push(user); saveAll();
        } else { user.tier = "Berbayar"; user.billingCycle = payment.billingCycle; }
        payment.confirmed = true; saveAll();
        payment.confirmedAt = new Date().toISOString();
        await tgSend(chatId, `<b>✅ Dikonfirmasi!</b>\n👤 ${payment.displayName}\n📧 ${payment.email}\n⭐ Premium (${payment.billingCycle})\n💰 Rp ${payment.amount.toLocaleString("id-ID")}`);
      }
      return res.status(200).json({ ok: true });
    }

    if (cmd === "/upgrade" && parts[1] && parts[2]) {
      const email = parts[1].toLowerCase();
      const cyc = parts[2].toLowerCase() === "tahunan" ? "Tahunan" : "Bulanan";
      let user = userDatabase.find(u => u.email.toLowerCase() === email);
      if (!user) {
        user = { uid: `user_${Date.now()}`, email, displayName: email.split("@")[0], role: "User", tier: "Berbayar", billingCycle: cyc, createdAt: new Date().toISOString(), password: "" };
        userDatabase.push(user); saveAll();
      } else { user.tier = "Berbayar"; user.billingCycle = cyc; saveAll(); }
      await tgSend(chatId, `<b>✅ Upgrade Manual</b>\n📧 ${email}\n⭐ Premium (${cyc})`);
      return res.status(200).json({ ok: true });
    }

    await tgSend(chatId, "❓ /help untuk bantuan");
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("TG webhook error:", err);
    res.status(200).json({ ok: true });
  }
});

// ===== LIBRARY =====
app.get("/api/library", (req, res) => {
  const populated = quranicaLibrary.map(item => ({ ...item, externalLink: item.externalLink || "https://shamela.ws" }));
  const rujukanAsLibrary = rujukanLibrary.map(r => ({
    id: r.id,
    title: r.title,
    author: r.category,
    category: "DIR_" + r.category,
    content: r.description,
    uri: r.url,
    externalLink: r.url,
    locationDetail: `${r.category} — ${r.description}`
  }));
  res.json({ library: [...populated, ...rujukanAsLibrary] });
});

app.post("/api/library/ai-search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query wajib" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key tidak dikonfigurasi" });

    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let candidates = quranicaLibrary.map(item => {
      let score = 0;
      const t = item.title.toLowerCase(), c = (item.content || "").toLowerCase();
      if (t.includes(query.toLowerCase())) score += 60;
      words.forEach(w => { if (t.includes(w)) score += 20; if (c.includes(w)) score += 5; });
      return { ...item, externalLink: item.externalLink || "https://shamela.ws", score };
    }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0, 20);

    if (!candidates.length) candidates = quranicaLibrary.slice(0, 15).map(c => ({ ...c, externalLink: c.externalLink || "https://shamela.ws" }));

    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Anda Pustakawan AI. Rekomendasikan 3-7 referensi paling relevan dari database untuk query: "${query}". Data: ${JSON.stringify(candidates)}. Jawab dalam Bahasa Indonesia. Gunakan link eksternal langsung.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    res.json({ result: response.text, matchedCandidates: candidates });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== DAUROH ULUMUL QUR'AN =====
app.get("/api/dauroh", (req, res) => {
  if (!ulumulQuranDauroh) return res.status(404).json({ error: "Data dauroh belum dimuat" });
  res.json(ulumulQuranDauroh);
});

// ===== CHAT (4 mode: Tafsir | Master | Maqashid | Gen Z) =====
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, mode } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages wajib" });
    const chatMode = mode === 'master' ? 'master' : mode === 'maqashid' ? 'maqashid' : mode === 'genz' ? 'genz' : 'tafsir';
    const apiKey = process.env.SUMOPOD_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Sumopod API key tidak dikonfigurasi" });

    const lastMsg = messages.slice().reverse().find(m => m.role === "user")?.content || "";
    const keywords = lastMsg.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const refs = quranicaLibrary.filter(item => keywords.some(kw => item.title.toLowerCase().includes(kw) || (item.content || "").toLowerCase().includes(kw)));

    let refCtx = "";
    if (refs.length) {
      refCtx = "\n=== RUJUKAN DATABASE ===\n" + refs.slice(0, 10).map((r, i) => `[#${i+1}] ${r.title} - ${r.author} - ${r.content}`).join("\n");
    }

    const mandatoryRules = `PERSYARATAN MUTLAK: 1) AKSARA ARAB MELIMPAH — setiap ayat, hadits, istilah kunci, & kutipan kitab WAJIB teks Arab berharakat + terjemahan. JANGAN hanya transliterasi. 2) QAUL ULAMA minimal 7 kutipan LANGSUNG — format: "[Ulama] dalam [Kitab] menyatakan: '...kutipan...'" [Kitab, Jilid X, Hal. Y]. WAJIB tanda kutip, bukan parafrase. 3) ORIENTALIS dalam BAHASA ASLI — kutipan orientalis WAJIB bahasa aslinya (Inggris/Jerman/Prancis) dulu, baru terjemahan Indonesia. 4) DENSITAS — tiap argumen 2+ ref, total 10+ kitab berbeda + 2 orientalis, tiap paragraf 1+ rujukan [Kurung Siku].`;

    // Build Meta-Ushul + Dauroh context for ALL modes
    let globalCtx = "";
    if (metaUshulMethodology) {
      var m = metaUshulMethodology;
      globalCtx += "\n\n=== METODOLOGI: USHUL FIQH KONTEMPORER (META-USHUL) ===" +
        "\nSumber: " + m.author + ", " + m.institution + " (" + m.year + ")" +
        "\n" + m.description +
        "\n\n7 Prinsip: " + Object.keys(m.principles).map(function(k) { return m.principles[k].name; }).join(" | ") +
        "\n\n8 Tahap Inferensi: " + m.inference_architecture.steps.join(" → ") +
        "\nGUNAKAN sebagai kerangka istinbath hukum untuk SEMUA mode.";
    }
    if (ulumulQuranDauroh) {
      var d = ulumulQuranDauroh;
      globalCtx += "\n\n=== REFERENSI: DAUROH ULUMUL QUR'AN ===" +
        "\nSumber: " + d.title + " — " + d.institution +
        "\n29 Sesi: " + d.sessions.map(function(s) { return s.topic; }).join(" | ") +
        "\nGUNAKAN sebagai referensi otoritatif untuk pertanyaan Ulumul Qur'an.";
    }
    globalCtx += "\n=== AKHIR KONTEKS TAMBAHAN ===\n";

    // Build YouTube reference context for ALL modes
    let youtubeCtx = "";
    if (youtubeReferences) {
      var yt = youtubeReferences;
      youtubeCtx += "\\n\\n=== 23 CHANNEL YOUTUBE REFERENSI (berlaku untuk SEMUA mode) ===";
      yt.channels.forEach(function(ch) {
        youtubeCtx += "\n• " + ch.name + " [" + ch.focus + "] — " + ch.domains.slice(0, 3).join(", ") + " — " + ch.url;
      });
      youtubeCtx += "\n\nPANDUAN: " + yt.guidelines.priority;
      youtubeCtx += "\nWAJIB: Setiap kali mengutip dari channel di atas, CANTUMKAN link channel-nya. Format: [Channel: Nama Channel, Topik: Judul Video](URL Channel).";
      youtubeCtx += "\\n=== AKHIR REFERENSI YOUTUBE ===\\n";
    }

    const sysMsg = (chatMode === 'master'
      ? 'Anda adalah Asisten AI Pakar Islam level Magister (S2) — setara lulusan S2 Kajian Islam. ANDA MAMPU menjawab SEMUA pertanyaan keislaman: 📖 Ulumul Quran & Tafsir (asbabun nuzul, munasabah, bil ma\'tsur, bir ra\'yi), 🕌 Hadits & Ulumul Hadits (takhrij 3+ kitab, kritik sanad+matan, jarh wa ta\'dil, derajat hadits), ⚖️ Fiqh Muqaran (8 mazhab: Hanafi, Maliki, Syafi\'i, Hanbali, Zhahiri, Ja\'fari, Zaydi, Ibadi), 📐 Ushul Fiqh (dalil, qiyas, istihsan, maslahah, \'urf), 🧠 Aqidah & Kalam, 🕯️ Tasawuf & Akhlak, 📜 Sejarah Islam & Sirah, 🌍 Perbandingan Agama. GAYA: akademik-sistematis, rujukan eksplisit [Kitab, Jilid X, Hal. Y], aksara Arab berharakat untuk ayat/hadits. BAHASA: Indonesia ilmiah-populer — dalam tapi enak dibaca. STRUKTUR: 1) Jawaban inti, 2) Dalil (Quran + Hadits dgn takhrij singkat), 3) Analisis (multi-mazhab bila relevan), 4) Kesimpulan. Maksimal 8 paragraf. Sumber: kitab mu\'tabar, bukan Wikipedia.'
      : chatMode === 'maqashid'
      ? mandatoryRules + ' Anda adalah Asisten AI Pakar Maqashid Syariah & Studi Kontekstual. FOKUS: maqashid, konteks kontemporer, orientalis+oksidentalis. Hadits & tafsir sebagai landasan. OUTPUT: minimal 4 paragraf, maksimal 10 paragraf. Padat, langsung ke inti, jangan bertele-tele.'
      : chatMode === 'genz'
      ? 'Anda adalah Asisten AI Gen Z — SEPENUHNYA pakai bahasa gaul Indonesia 2024 (Jaksel + TikTok): "bestie", "literally", "which is", "jujurly", "gas", "nggak", "banget", "btw", "fomo", "slay", "spill", "valid", "no cap", "vibes", "worth it", "receh", "gercep", "santuy", "mantul", "gemoy". Gaya: santai, lucu, relate, kadang roasting ringan. TAPI: tetap akurat secara Islam. Tetap cantumkan dalil & sumber. Output singkat, to the point. JANGAN formal. JANGAN kaku. Gunakan emoji mumer. Contoh: "Bestie, jadi gini literally... spill ya" | "Jujurly sih ini tuh..." | "Nabi tuh udah spill dari dulu bestie..."'
      : 'Anda adalah Asisten AI Tafsir Al-Quran untuk pemula. GAYA: sederhana, mudah dipahami, seperti menjelaskan ke teman. STRUKTUR: 1) Penjelasan singkat (1-2 paragraf), 2) 1-2 ayat terkait (teks Arab + terjemahan), 3) Hikmah/pelajaran (2-3 poin), 4) Kesimpulan 1 kalimat. JANGAN pakai istilah teknis berat. JANGAN sebut banyak kitab. Cukup 1-2 rujukan saja. Output maksimal 5 paragraf. Gunakan Bahasa Indonesia yang hangat dan bersahabat.') + ` FORMAT: Akhiri dengan "Wallahu A'lam". JANGAN berhalusinasi.` + globalCtx + youtubeCtx + refCtx;

    const response = await fetch("https://ai.sumopod.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-v4-pro", messages: [{ role: "system", content: sysMsg }, ...messages.map(m => ({ role: m.role === "model" ? "assistant" : m.role, content: m.content }))] })
    });
    if (!response.ok) {
      const ct = response.headers.get("content-type") || "";
      const errText = ct.includes("json") ? (await response.json()).error : await response.text().then(t => t.slice(0, 200));
      return res.status(502).json({ error: `Sumopod error (${response.status}): ${errText}` });
    }
    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || "Tidak ada respon" });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== EVALUATE (TAHSIN) — DETEKSI HURUF + KOREKSI VN =====
app.post("/api/evaluate", async (req, res) => {
  try {
    const { base64Audio, mimeType, confirmedSurah, confirmedAyah, mcpText, mcpTajwid } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key tidak dikonfigurasi" });
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    
    // 28 huruf Hijaiyah mapping
    const HIJAIYAH = {
      "ا":{n:"Alif",v:"001"},"ب":{n:"Ba",v:"002"},"ت":{n:"Ta",v:"003"},"ث":{n:"Tsa",v:"004"},
      "ج":{n:"Jim",v:"005"},"ح":{n:"Ha",v:"006"},"خ":{n:"Kha",v:"007"},"د":{n:"Dal",v:"008"},
      "ذ":{n:"Dzal",v:"009"},"ر":{n:"Ra",v:"010"},"ز":{n:"Za",v:"011"},"س":{n:"Sin",v:"012"},
      "ش":{n:"Syin",v:"013"},"ص":{n:"Shad",v:"014"},"ض":{n:"Dhad",v:"015"},"ط":{n:"Tha",v:"016"},
      "ظ":{n:"Zha",v:"017"},"ع":{n:"Ain",v:"018"},"غ":{n:"Ghain",v:"019"},"ف":{n:"Fa",v:"020"},
      "ق":{n:"Qaf",v:"021"},"ك":{n:"Kaf",v:"022"},"ل":{n:"Lam",v:"023"},"م":{n:"Mim",v:"024"},
      "ن":{n:"Nun",v:"025"},"و":{n:"Waw",v:"026"},"ه":{n:"Ha",v:"027"},"ي":{n:"Ya",v:"028"},
    };
    
    const prompt = `Evaluasi rekaman Surah ${confirmedSurah}:${confirmedAyah}. Teks: ${mcpText}. Tajwid: ${mcpTajwid}.
    
OUTPUT WAJIB dalam JSON format ini:
{
  "status": "Mumtaz/Lahn Khafy/Lahn Jaly",
  "detail": "penjelasan detail kesalahan",
  "makhraj": "posisi makhraj yang benar",
  "sifat": "sifat huruf yang benar",
  "hurufSalah": ["ت","ذ"],
  "matan": "teks Arab Matan Jazariyah",
  "terjemahMatan": "terjemahan matan"
}

Hanya return JSON, tanpa teks lain.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ inlineData: { mimeType, data: base64Audio } }, { text: prompt }] }
    });

    // Parse response — handle non-JSON gracefully
    let rawText = (result.text || "").trim();
    // Remove markdown code blocks if present
    rawText = rawText.replace(/^```(?:json)?\s*|\s*```$/g, '');
    
    let evalData = {};
    try {
      evalData = JSON.parse(rawText);
    } catch {
      // Fallback: extract from text
      const hurufMatch = rawText.match(/hurufSalah["\s:\[\]]*\[(.*?)\]/);
      const statusMatch = rawText.match(/(Mumtaz|Lahn\s*(Jaly|Khafy))/i);
      evalData = {
        status: statusMatch?.[0] || 'Lahn Khafy',
        detail: rawText.slice(0, 500),
        makhraj: '',
        sifat: '',
        hurufSalah: hurufMatch ? hurufMatch[1].replace(/["']/g, '').split(/[,\s]+/).filter(Boolean) : [],
        matan: '',
        terjemahMatan: '',
      };
    }
    const koreksiVn = [];
    if (evalData.hurufSalah && Array.isArray(evalData.hurufSalah)) {
      for (const h of evalData.hurufSalah) {
        if (HIJAIYAH[h]) koreksiVn.push({ huruf: h, nama: HIJAIYAH[h].n, vn: HIJAIYAH[h].v });
      }
    }
    res.json({ ...evalData, koreksiVn });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== DEEP RESEARCH =====
const researchTasks = {};
app.post("/api/research/start", async (req, res) => {
  try {
    const { topic, userEmail, userTier } = req.body;
    if (!topic) return res.status(400).json({ error: "Topik wajib" });
    
    // Premium only
    if (userTier !== "Berbayar") {
      return res.status(403).json({ error: "Deep Research hanya untuk pengguna Premium" });
    }
    
    const id = "res_" + Date.now();
    const now = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const task = {
      id, topic, status: "running", progress: 0, currentStage: "Menginisialisasi agen riset...",
      logs: [`[${now()}] 🚀 Agen Deep Research diaktifkan`],
      steps: [
        { name: "Analisis Topik", status: "pending", detail: "Menunggu..." },
        { name: "Pencarian Referensi", status: "pending", detail: "Menunggu..." },
        { name: "Penyusunan Prompt", status: "pending", detail: "Menunggu..." },
        { name: "Koneksi ke Sumopod AI", status: "pending", detail: "Menunggu..." },
        { name: "Generasi Konten", status: "pending", detail: "Menunggu..." }
      ],
      result: ""
    };
    researchTasks[id] = task;
    
    // Run async
    (async () => {
      try {
        // STEP 1: Analisis topik
        task.steps[0].status = "running"; task.steps[0].detail = "Memecah kata kunci...";
        task.currentStage = "Menganalisis topik..."; task.progress = 5;
        task.logs.push(`[${now()}] 📝 Topik: "${topic}"`);
        const keywords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        await new Promise(r => setTimeout(r, 400));
        task.steps[0].status = "completed"; task.steps[0].detail = `${keywords.length} kata kunci teridentifikasi`;
        task.logs.push(`[${now()}] ✅ Analisis topik selesai — ${keywords.length} kata kunci`);

        // STEP 2: Cari referensi
        task.steps[1].status = "running"; task.steps[1].detail = "Mencocokkan dengan database...";
        task.currentStage = "Mencari referensi..."; task.progress = 15;
        const kitabRefs = quranicaLibrary.filter(item => {
          const t = (item.title || "").toLowerCase();
          const c = (item.content || "").toLowerCase();
          return keywords.some(kw => t.includes(kw) || c.includes(kw));
        }).slice(0, 5);
        const portalRefs = rujukanLibrary.filter(r => {
          const t = (r.title || "").toLowerCase();
          const d = (r.description || "").toLowerCase();
          const cat = (r.category || "").toLowerCase();
          return keywords.some(kw => t.includes(kw) || d.includes(kw) || cat.includes(kw));
        }).slice(0, 5);
        await new Promise(r => setTimeout(r, 300));
        task.steps[1].status = "completed";
        task.steps[1].detail = `${kitabRefs.length} kitab + ${portalRefs.length} portal ditemukan`;
        task.logs.push(`[${now()}] 📚 ${kitabRefs.length} kitab relevan ditemukan`);
        if (portalRefs.length > 0) task.logs.push(`[${now()}] 🌐 ${portalRefs.length} portal/jurnal relevan ditemukan`);
        
        // STEP 3: Susun prompt
        task.steps[2].status = "running"; task.steps[2].detail = "Merangkai prompt akademik...";
        task.currentStage = "Menyusun prompt..."; task.progress = 25;
        let refContext = "";
        if (kitabRefs.length > 0) {
          refContext += "\nREFERENSI KITAB DARI PERPUSTAKAAN:\n" + kitabRefs.map(r => `- ${r.title} (${r.author}) [Sumber: ${r.externalLink || r.uri}]`).join("\n");
        }
        if (portalRefs.length > 0) {
          refContext += "\nREFERENSI PORTAL/JURNAL:\n" + portalRefs.map(r => `- ${r.title} [Akses: ${r.url || r.uri}]`).join("\n");
        }
        const prompt = `Riset singkat tentang: "${topic}" dalam konteks Islam, Al-Quran, Hadits, dan Tafsir.\n${refContext}\n\nTULIS SINGKAT & PADAT (maks 3-4 paragraf per bagian):\n\n## Ringkasan\n- Inti permasalahan (2-3 kalimat)\n\n## Dalil & Landasan\n- 1-2 ayat Al-Quran relevan (teks Arab + terjemah)\n- 1-2 hadits shahih (teks + perawi)\n- Ringkasan pendapat ulama (cukup 2 mazhab)\n${kitabRefs.length > 0 ? '- GUNAKAN referensi kitab di atas sebagai sumber.\n' : ''}\n## Analisis\n- Poin kunci (3-5 bullet points)\n- Relevansi kontemporer (1 paragraf)\n\n## Kesimpulan\n- Jawaban ringkas (2-3 kalimat)\n\n## Referensi\n- 3 sumber utama dari perpustakaan Quranica AI\n${portalRefs.length > 0 ? '- Cantumkan minimal 1 portal/jurnal dari daftar.\n' : ''}\nFORMAT: Markdown, Bahasa Indonesia ringkas. Langsung ke inti.`;
        await new Promise(r => setTimeout(r, 200));
        task.steps[2].status = "completed"; task.steps[2].detail = `Prompt ${prompt.length} karakter`;
        task.logs.push(`[${now()}] ✍️ Prompt tersusun — ${prompt.length} karakter`);

        // STEP 4: Koneksi Sumopod
        task.steps[3].status = "running"; task.steps[3].detail = "Menghubungi server AI...";
        task.currentStage = "Mengirim ke Sumopod..."; task.progress = 40;
        const sumopodKey = process.env.SUMOPOD_API_KEY;
        if (!sumopodKey) throw new Error("SUMOPOD_API_KEY tidak dikonfigurasi");
        const t0 = Date.now();
        const resp = await fetch("https://ai.sumopod.com/v1/chat/completions", {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sumopodKey}` },
          body: JSON.stringify({ model: "deepseek-v4-pro", messages: [{ role: "user", content: prompt }] })
        });
        if (!resp.ok) throw new Error(`Sumopod HTTP ${resp.status}`);
        task.steps[3].status = "completed";
        task.steps[3].detail = `Terhubung (${Date.now() - t0}ms)`;
        task.logs.push(`[${now()}] 🔗 Terhubung ke Sumopod Deepseek — ${Date.now() - t0}ms`);

        // STEP 5: Generasi konten
        task.steps[4].status = "running"; task.steps[4].detail = "AI sedang menulis...";
        task.currentStage = "AI menulis..."; task.progress = 55;
        const data = await resp.json();
        const result = data.choices?.[0]?.message?.content || "";
        if (!result) throw new Error("Sumopod mengembalikan respons kosong");
        task.steps[4].status = "completed";
        task.steps[4].detail = `${result.length} karakter dihasilkan`;
        task.logs.push(`[${now()}] 🎯 Konten dihasilkan — ${result.length} karakter`);
        
        task.result = result; task.status = "completed"; task.progress = 100;
        task.currentStage = "✅ Riset selesai";
        task.logs.push(`[${now()}] 🏁 Deep Research selesai dalam ${Date.now() - parseInt(id.replace('res_',''))}ms`);
      } catch(e) {
        task.status = "error"; task.result = e.message;
      }
    })();
    
    res.json({ id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/research/status/:id", (req, res) => {
  const task = researchTasks[req.params.id];
  if (!task) return res.status(404).json({ error: "Sesi tidak ditemukan" });
  res.json(task);
});

// ===== SERVE STATIC FRONTEND =====
app.use(express.static(path.join(__dirname, "..", "dist")));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found" });
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

module.exports = app;
