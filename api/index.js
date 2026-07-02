import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const app = express();
app.use(express.json({ limit: "50mb" }));

// ===== IN-MEMORY DB =====
let userDatabase = [
  { uid: "bootstrapped_admin", email: "rivalgamingchannel@gmail.com", displayName: "Admin Utama", role: "Admin", tier: "Berbayar", billingCycle: "Tahunan", createdAt: new Date().toISOString(), password: process.env.ADMIN_PASSWORD || "" },
  { uid: "user_1", email: "ahmad.tafsir@gmail.com", displayName: "Ahmad Tafsir", role: "User", tier: "Reguler", createdAt: new Date().toISOString() },
  { uid: "user_2", email: "fatimah.zahra@yahoo.com", displayName: "Fatimah Az-Zahra", role: "User", tier: "Berbayar", billingCycle: "Bulanan", createdAt: new Date().toISOString() }
];
let preApprovedAdmins = new Set(["rivalgamingchannel@gmail.com"]);

// Load library data
let cungkringLibrary = [];
try {
  const data = require("../src/data/secondarySources");
  cungkringLibrary = [...data.secondarySources];
} catch(e2) {
  cungkringLibrary = [];
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
    userDatabase.push(user);
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

// ===== LIBRARY =====
app.get("/api/library", (req, res) => {
  const populated = cungkringLibrary.map(item => ({ ...item, externalLink: item.externalLink || "https://shamela.ws" }));
  res.json({ library: populated });
});

app.post("/api/library/ai-search", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query wajib" });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Gemini API key tidak dikonfigurasi" });

    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    let candidates = cungkringLibrary.map(item => {
      let score = 0;
      const t = item.title.toLowerCase(), c = (item.content || "").toLowerCase();
      if (t.includes(query.toLowerCase())) score += 60;
      words.forEach(w => { if (t.includes(w)) score += 20; if (c.includes(w)) score += 5; });
      return { ...item, externalLink: item.externalLink || "https://shamela.ws", score };
    }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0, 20);

    if (!candidates.length) candidates = cungkringLibrary.slice(0, 15).map(c => ({ ...c, externalLink: c.externalLink || "https://shamela.ws" }));

    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Anda Pustakawan AI. Rekomendasikan 3-7 referensi paling relevan dari database untuk query: "${query}". Data: ${JSON.stringify(candidates)}. Jawab dalam Bahasa Indonesia. Gunakan link eksternal langsung.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
    res.json({ result: response.text, matchedCandidates: candidates });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ===== CHAT =====
app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages wajib" });
    const apiKey = process.env.SUMOPOD_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Sumopod API key tidak dikonfigurasi" });

    const lastMsg = messages.slice().reverse().find(m => m.role === "user")?.content || "";
    const keywords = lastMsg.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const refs = cungkringLibrary.filter(item => keywords.some(kw => item.title.toLowerCase().includes(kw) || (item.content || "").toLowerCase().includes(kw)));

    let refCtx = "";
    if (refs.length) {
      refCtx = "\n=== RUJUKAN DATABASE ===\n" + refs.slice(0, 10).map((r, i) => `[#${i+1}] ${r.title} - ${r.author} - ${r.content}`).join("\n");
    }

    const sysMsg = "Anda Asisten AI Pakar Ulumul Qur'an, Tafsir, dan Hadits. Jawablah dengan mendalam, ilmiah, dalam Bahasa Indonesia. Sertakan dalil." + refCtx;

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
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    
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
    Deteksi huruf Hijaiyah yang salah lafal. Sebutkan dalam array hurufSalah, contoh: ["ت","ذ"].
    Klasifikasi: Lahn Jaly/Lahn Khafy/Mumtaz. Jelaskan makhraj & sifat yang benar.`;
    
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [{ inlineData: { mimeType, data: base64Audio } }, { text: prompt }] }
    });
    
    const evalData = JSON.parse(result.text || "{}");
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

// ===== SERVE STATIC FRONTEND =====
app.use(express.static(path.join(__dirname, "..", "dist")));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found" });
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

export default app;
