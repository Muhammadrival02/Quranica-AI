1|const express = require("express");
2|const path = require("path");
3|
4|const app = express();
5|app.use(express.json({ limit: "50mb" }));
6|
7|// ===== IN-MEMORY DB =====
8|let userDatabase = [
9|  { uid: "bootstrapped_admin", email: "rivalgamingchannel@gmail.com", displayName: "Admin Utama", role: "Admin", tier: "Berbayar", billingCycle: "Tahunan", createdAt: new Date().toISOString(), password: process.env.ADMIN_PASSWORD || "" },
10|  { uid: "user_1", email: "ahmad.tafsir@gmail.com", displayName: "Ahmad Tafsir", role: "User", tier: "Reguler", createdAt: new Date().toISOString() },
11|  { uid: "user_2", email: "fatimah.zahra@yahoo.com", displayName: "Fatimah Az-Zahra", role: "User", tier: "Berbayar", billingCycle: "Bulanan", createdAt: new Date().toISOString() }
12|];
13|let preApprovedAdmins = new Set(["rivalgamingchannel@gmail.com"]);
14|
15|// ===== PENDING PAYMENTS =====
16|let pendingPayments = [];
17|
18|// ===== TELEGRAM BOT =====
19|const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
20|const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
21|function isTelegramAdmin(chatId) { return ADMIN_IDS.includes(String(chatId)); }
22|async function tgSend(chatId, text) {
23|  if (!BOT_TOKEN) return;
24|  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
25|    method: "POST", headers: { "Content-Type": "application/json" },
26|    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
27|  });
28|}
29|
30|// Load library data
31|let cungkringLibrary = [];
32|let rujukanLibrary = [];
33|try {
34|  const data = require("../src/data/secondarySources");
35|  cungkringLibrary = [...data.secondarySources];
36|} catch(e2) {
37|  cungkringLibrary = [];
38|}
39|try {
40|  const rdata = require("../src/data/rujukanLinks");
41|  rujukanLibrary = [...(rdata.rujukanLinks || []), ...(rdata.portalJurnalLinks || [])];
42|} catch(e3) {
43|  rujukanLibrary = [];
44|}
45|
46|// ===== HEALTH =====
47|app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));
48|
49|// ===== USERS =====
50|app.post("/api/users/profile", (req, res) => {
51|  const { uid, email, displayName, tier, billingCycle, pekerjaan, phone, password } = req.body;
52|  if (!uid || !email) return res.status(400).json({ error: "UID dan email wajib" });
53|  let user = userDatabase.find(u => u.uid === uid || u.email.toLowerCase() === email.toLowerCase());
54|  const isAdmin = preApprovedAdmins.has(email.toLowerCase());
55|  if (user) {
56|    if (displayName) user.displayName = displayName;
57|    if (tier) user.tier = tier;
58|    if (billingCycle) user.billingCycle = billingCycle;
59|    if (isAdmin) user.role = "Admin";
60|    if (password) user.password = password;
61|  } else {
62|    user = { uid, email, displayName: displayName || email.split("@")[0], role: isAdmin ? "Admin" : "User", tier: tier || "Reguler", billingCycle: tier === "Berbayar" ? (billingCycle || "Bulanan") : null, createdAt: new Date().toISOString(), pekerjaan: pekerjaan || "", phone: phone || "", password: password || "" };
63|    userDatabase.push(user);
64|  }
65|  res.json(user);
66|});
67|
68|app.post("/api/users/login", (req, res) => {
69|  const { email, password } = req.body;
70|  if (!email || !password) return res.status(400).json({ error: "Email dan password wajib" });
71|  const user = userDatabase.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
72|  if (!user || (user.password && user.password !== password)) return res.status(401).json({ error: "Email atau password salah" });
73|  res.json(user);
74|});
75|
76|app.get("/api/users", (req, res) => {
77|  const { adminUid } = req.query;
78|  const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
79|  if (!admin) return res.status(403).json({ error: "Akses ditolak" });
80|  res.json({ users: userDatabase });
81|});
82|
83|// ===== ADMIN: ADD ADMIN =====
84|app.post("/api/users/add-admin", (req, res) => {
85|  try {
86|    const { email, adminUid } = req.body;
87|    if (!email || !adminUid) return res.status(400).json({ error: "Email dan adminUid wajib diisi." });
88|    const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
89|    if (!admin) return res.status(403).json({ error: "Akses ditolak. Anda bukan Admin." });
90|    const emailClean = email.trim().toLowerCase();
91|    preApprovedAdmins.add(emailClean);
92|    const existingUser = userDatabase.find(u => u.email.toLowerCase() === emailClean);
93|    if (existingUser) existingUser.role = "Admin";
94|    res.json({ success: true, message: `Email ${emailClean} berhasil didaftarkan sebagai Admin.` });
95|  } catch (err) { res.status(500).json({ error: err.message }); }
96|});
97|
98|// ===== ADMIN: DELETE USER =====
99|app.delete("/api/users/:uid", (req, res) => {
100|  try {
101|    const { uid } = req.params;
102|    const { adminUid } = req.body;
103|    if (!adminUid) return res.status(401).json({ error: "Autentikasi admin diperlukan." });
104|    const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
105|    if (!admin) return res.status(403).json({ error: "Akses ditolak." });
106|    if (uid === adminUid) return res.status(400).json({ error: "Tidak dapat menghapus akun sendiri." });
107|    const idx = userDatabase.findIndex(u => u.uid === uid);
108|    if (idx === -1) return res.status(404).json({ error: "User tidak ditemukan." });
109|    const deleted = userDatabase[idx];
110|    userDatabase.splice(idx, 1);
111|    res.json({ success: true, message: `User ${deleted.displayName} berhasil dihapus.` });
112|  } catch (err) { res.status(500).json({ error: err.message }); }
113|});
114|
115|// ===== ADMIN: UPDATE TIER =====
116|app.post("/api/users/update-tier", (req, res) => {
117|  try {
118|    const { uid, tier, billingCycle, adminUid } = req.body;
119|    if (!uid || !tier) return res.status(400).json({ error: "UID dan tier wajib diisi." });
120|    if (tier !== "Reguler" && tier !== "Berbayar") return res.status(400).json({ error: "Tier tidak valid." });
121|    if (adminUid) {
122|      const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
123|      if (!admin) return res.status(403).json({ error: "Akses ditolak." });
124|    }
125|    const user = userDatabase.find(u => u.uid === uid);
126|    if (!user) return res.status(404).json({ error: "User tidak ditemukan." });
127|    user.tier = tier;
128|    user.billingCycle = tier === "Berbayar" ? (billingCycle || "Bulanan") : null;
129|    res.json({ success: true, user });
130|  } catch (err) { res.status(500).json({ error: err.message }); }
131|});
132|
133|// ===== ADMIN: UPDATE ROLE =====
134|app.post("/api/users/update-role", (req, res) => {
135|  try {
136|    const { uid, role, adminUid } = req.body;
137|    if (!uid || !role) return res.status(400).json({ error: "UID dan peran wajib diisi." });
138|    if (role !== "Admin" && role !== "User") return res.status(400).json({ error: "Peran tidak valid." });
139|    if (!adminUid) return res.status(401).json({ error: "Autentikasi admin diperlukan." });
140|    const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
141|    if (!admin) return res.status(403).json({ error: "Akses ditolak." });
142|    const user = userDatabase.find(u => u.uid === uid);
143|    if (!user) return res.status(404).json({ error: "User tidak ditemukan." });
144|    if (uid === adminUid) return res.status(400).json({ error: "Tidak dapat mengubah peran sendiri." });
145|    user.role = role;
146|    res.json({ success: true, user });
147|  } catch (err) { res.status(500).json({ error: err.message }); }
148|});
149|
150|// ===== PAYMENT: CREATE PENDING =====
151|app.post("/api/payment/create", (req, res) => {
152|  try {
153|    const { email, displayName, tier, billingCycle, amount, method } = req.body;
154|    if (!email || !amount) return res.status(400).json({ error: "Data tidak lengkap" });
155|    const payment = {
156|      id: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
157|      email: email.toLowerCase(),
158|      displayName: displayName || email.split("@")[0],
159|      tier: "Berbayar",
160|      billingCycle: billingCycle || "Bulanan",
161|      amount, method: method || "QRIS",
162|      confirmed: false,
163|      createdAt: new Date().toISOString()
164|    };
165|    pendingPayments.push(payment);
166|    res.json({ ok: true, payment });
167|  } catch (err) { res.status(500).json({ error: err.message }); }
168|});
169|
170|app.get("/api/payment/pending", (req, res) => {
171|  const unconfirmed = pendingPayments.filter(p => !p.confirmed);
172|  res.json({ payments: unconfirmed });
173|});
174|
175|// ===== AI VERIFY PAYMENT PROOF =====
176|app.post("/api/payment/verify-proof", async (req, res) => {
177|  try {
178|    const { paymentId, imageBase64, userEmail } = req.body;
179|    if (!paymentId || !imageBase64) return res.status(400).json({ error: "paymentId dan imageBase64 wajib" });
180|
181|    const payment = pendingPayments.find(p => p.id === paymentId);
182|    if (!payment) return res.status(404).json({ error: "Pembayaran tidak ditemukan" });
183|    if (payment.confirmed) return res.status(400).json({ error: "Pembayaran sudah dikonfirmasi" });
184|
185|    const apiKey = process.env.GEMINI_API_KEY;
186|    if (!apiKey) return res.status(500).json({ error: "Gemini API key tidak dikonfigurasi" });
187|
188|    // Expected account details
189|    const expectedAccounts = {
190|      BCA: { bank: "BCA", number: "7753050282", name: "RINAL ZAMZAM ELHASBI" },
191|      DANA: { bank: "DANA", number: "085159552762", name: "RINAL ZAMZAM ELHASBI" },
192|      QRIS: { bank: "QRIS", number: "N/A", name: "Quranica AI / RINAL ZAMZAM ELHASBI" }
193|    };
194|
195|    const expected = expectedAccounts[payment.method] || expectedAccounts.QRIS;
196|
197|    const { GoogleGenAI } = require("@google/genai");
198|    const ai = new GoogleGenAI({ apiKey });
199|
200|    const prompt = `ANALISIS BUKTI TRANSFER / PEMBAYARAN
201|
202|Anda adalah AI verifikator pembayaran Quranica AI. Analisis gambar bukti transfer ini dan berikan hasil dalam JSON.
203|
204|DETAIL PEMBAYARAN YANG DIHARAPKAN:
205|- Metode: ${payment.method}
206|- Jumlah: Rp ${payment.amount.toLocaleString("id-ID")}
207|- Tujuan: ${expected.bank} ${expected.number} a.n. ${expected.name}
208|- Email pengguna: ${userEmail || payment.email}
209|
210|VERIFIKASI:
211|1. Apakah nominal transfer sesuai? (toleransi ±Rp 1.000)
212|2. Apakah nomor rekening/tujuan sesuai dengan ${expected.bank}: ${expected.number}?
213|3. Apakah bukti transfer terlihat asli (ada timestamp, nomor referensi, logo bank)?
214|4. Apakah ada indikasi manipulasi atau editan?
215|
216|OUTPUT HANYA JSON (tanpa backtick):
217|{
218|  "valid": true/false,
219|  "confidence": 0-100,
220|  "amount_match": true/false,
221|  "detected_amount": "jumlah yang terdeteksi",
222|  "account_match": true/false,
223|  "detected_account": "nomor rekening yang terdeteksi",
224|  "timestamp_detected": "timestamp jika ada",
225|  "summary": "ringkasan analisis dalam Bahasa Indonesia",
226|  "red_flags": ["daftar masalah jika ada"]
227|}`;
228|
229|    const imagePart = { inlineData: { mimeType: "image/jpeg", data: imageBase64 } };
230|    const result = await ai.models.generateContent({
231|      model: "gemini-2.5-flash",
232|      contents: { role: "user", parts: [{ text: prompt }, imagePart] }
233|    });
234|
235|    let analysis;
236|    try {
237|      const raw = result.text.replace(/```json|```/g, "").trim();
238|      analysis = JSON.parse(raw);
239|    } catch (e) {
240|      analysis = { valid: false, confidence: 0, summary: "Gagal parsing hasil AI: " + result.text.slice(0, 200) };
241|    }
242|
243|    // Auto-confirm if AI says valid with high confidence
244|    if (analysis.valid && analysis.confidence >= 70) {
245|      let user = userDatabase.find(u => u.email.toLowerCase() === (userEmail || payment.email).toLowerCase());
246|      if (!user) {
247|        user = {
248|          uid: `user_${Date.now()}`,
249|          email: (userEmail || payment.email).toLowerCase(),
250|          displayName: payment.displayName,
251|          role: "User",
252|          tier: "Berbayar",
253|          billingCycle: payment.billingCycle,
254|          createdAt: new Date().toISOString(),
255|          password: ""
256|        };
257|        userDatabase.push(user);
258|      } else {
259|        user.tier = "Berbayar";
260|        user.billingCycle = payment.billingCycle;
261|      }
262|      payment.confirmed = true;
263|      payment.confirmedAt = new Date().toISOString();
264|      payment.aiVerification = analysis;
265|      payment.proofImage = imageBase64.slice(0, 200); // only store prefix for audit
266|
267|      return res.json({
268|        ok: true,
269|        confirmed: true,
270|        analysis,
271|        user: { uid: user.uid, email: user.email, displayName: user.displayName, tier: user.tier, billingCycle: user.billingCycle }
272|      });
273|    }
274|
275|    // Not confirmed
276|    return res.json({
277|      ok: true,
278|      confirmed: false,
279|      analysis,
280|      message: "Bukti pembayaran tidak dapat diverifikasi otomatis. Mohon periksa kembali."
281|    });
282|
283|  } catch (err) {
284|    console.error("Verify proof error:", err);
285|    res.status(500).json({ error: err.message });
286|  }
287|});
288|
289|// ===== TELEGRAM BOT WEBHOOK =====
290|app.post("/api/telegram-webhook", async (req, res) => {
291|  try {
292|    const body = req.body;
293|    const msg = body.message || (body.callback_query && body.callback_query.message);
294|    if (!msg) return res.status(200).json({ ok: true });
295|    const chatId = msg.chat?.id;
296|    const text = (msg.text || "").trim();
297|    const fromName = msg.from?.first_name || "";
298|
299|    if (!chatId || !text) return res.status(200).json({ ok: true });
300|
301|    const parts = text.split(/\s+/);
302|    const cmd = parts[0].toLowerCase();
303|
304|    if (cmd === "/start") {
305|      const adminMsg = isTelegramAdmin(chatId);
306|      await tgSend(chatId, adminMsg
307|        ? `<b>Bot Konfirmasi Quranica AI</b>\n\nHalo ${fromName}!\n\n/confirm &lt;ID&gt; — Konfirmasi bayar\n/pending — Lihat pending\n/upgrade &lt;email&gt; &lt;bulanan|tahunan&gt; — Manual\n/help — Bantuan`
308|        : `Halo ${fromName}! Silakan lakukan pembayaran di aplikasi. Admin akan konfirmasi.`);
309|      return res.status(200).json({ ok: true });
310|    }
311|
312|    if (!isTelegramAdmin(chatId)) {
313|      await tgSend(chatId, "⚠️ Akses ditolak.");
314|      return res.status(200).json({ ok: true });
315|    }
316|
317|    if (cmd === "/pending") {
318|      const list = pendingPayments.filter(p => !p.confirmed);
319|      if (list.length === 0) {
320|        await tgSend(chatId, "✅ Tidak ada pembayaran pending.");
321|      } else {
322|        const txt = list.map((p, i) =>
323|          `${i+1}. <b>${p.displayName}</b>\n📧 ${p.email}\n💰 Rp ${p.amount.toLocaleString("id-ID")}\n🏦 ${p.method} (${p.billingCycle})\n🆔 <code>${p.id}</code>\n📅 ${new Date(p.createdAt).toLocaleString("id-ID")}`
324|        ).join("\n\n");
325|        await tgSend(chatId, `<b>📋 Pending (${list.length})</b>\n\n${txt}\n\n/confirm &lt;ID&gt; untuk konfirmasi.`);
326|      }
327|      return res.status(200).json({ ok: true });
328|    }
329|
330|    if (cmd === "/confirm" && parts[1]) {
331|      const id = parts[1];
332|      const payment = pendingPayments.find(p => p.id === id);
333|      if (!payment) { await tgSend(chatId, `❌ ID <code>${id}</code> tidak ditemukan.`); }
334|      else if (payment.confirmed) { await tgSend(chatId, `⚠️ Sudah dikonfirmasi.`); }
335|      else {
336|        let user = userDatabase.find(u => u.email.toLowerCase() === payment.email.toLowerCase());
337|        if (!user) {
338|          user = { uid: `user_${Date.now()}`, email: payment.email, displayName: payment.displayName, role: "User", tier: "Berbayar", billingCycle: payment.billingCycle, createdAt: new Date().toISOString(), password: "" };
339|          userDatabase.push(user);
340|        } else { user.tier = "Berbayar"; user.billingCycle = payment.billingCycle; }
341|        payment.confirmed = true;
342|        payment.confirmedAt = new Date().toISOString();
343|        await tgSend(chatId, `<b>✅ Dikonfirmasi!</b>\n👤 ${payment.displayName}\n📧 ${payment.email}\n⭐ Premium (${payment.billingCycle})\n💰 Rp ${payment.amount.toLocaleString("id-ID")}`);
344|      }
345|      return res.status(200).json({ ok: true });
346|    }
347|
348|    if (cmd === "/upgrade" && parts[1] && parts[2]) {
349|      const email = parts[1].toLowerCase();
350|      const cyc = parts[2].toLowerCase() === "tahunan" ? "Tahunan" : "Bulanan";
351|      let user = userDatabase.find(u => u.email.toLowerCase() === email);
352|      if (!user) {
353|        user = { uid: `user_${Date.now()}`, email, displayName: email.split("@")[0], role: "User", tier: "Berbayar", billingCycle: cyc, createdAt: new Date().toISOString(), password: "" };
354|        userDatabase.push(user);
355|      } else { user.tier = "Berbayar"; user.billingCycle = cyc; }
356|      await tgSend(chatId, `<b>✅ Upgrade Manual</b>\n📧 ${email}\n⭐ Premium (${cyc})`);
357|      return res.status(200).json({ ok: true });
358|    }
359|
360|    await tgSend(chatId, "❓ /help untuk bantuan");
361|    res.status(200).json({ ok: true });
362|  } catch (err) {
363|    console.error("TG webhook error:", err);
364|    res.status(200).json({ ok: true });
365|  }
366|});
367|
368|// ===== LIBRARY =====
369|app.get("/api/library", (req, res) => {
370|  const populated = cungkringLibrary.map(item => ({ ...item, externalLink: item.externalLink || "https://shamela.ws" }));
371|  const rujukanAsLibrary = rujukanLibrary.map(r => ({
372|    id: r.id,
373|    title: r.title,
374|    author: r.category,
375|    category: "DIR_" + r.category,
376|    content: r.description,
377|    uri: r.url,
378|    externalLink: r.url,
379|    locationDetail: `${r.category} — ${r.description}`
380|  }));
381|  res.json({ library: [...populated, ...rujukanAsLibrary] });
382|});
383|
384|app.post("/api/library/ai-search", async (req, res) => {
385|  try {
386|    const { query } = req.body;
387|    if (!query) return res.status(400).json({ error: "Query wajib" });
388|    const apiKey = process.env.GEMINI_API_KEY;
389|    if (!apiKey) return res.status(500).json({ error: "Gemini API key tidak dikonfigurasi" });
390|
391|    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
392|    let candidates = cungkringLibrary.map(item => {
393|      let score = 0;
394|      const t = item.title.toLowerCase(), c = (item.content || "").toLowerCase();
395|      if (t.includes(query.toLowerCase())) score += 60;
396|      words.forEach(w => { if (t.includes(w)) score += 20; if (c.includes(w)) score += 5; });
397|      return { ...item, externalLink: item.externalLink || "https://shamela.ws", score };
398|    }).filter(x => x.score > 0).sort((a,b) => b.score - a.score).slice(0, 20);
399|
400|    if (!candidates.length) candidates = cungkringLibrary.slice(0, 15).map(c => ({ ...c, externalLink: c.externalLink || "https://shamela.ws" }));
401|
402|    const { GoogleGenAI } = require("@google/genai");
403|    const ai = new GoogleGenAI({ apiKey });
404|    const prompt = `Anda Pustakawan AI. Rekomendasikan 3-7 referensi paling relevan dari database untuk query: "${query}". Data: ${JSON.stringify(candidates)}. Jawab dalam Bahasa Indonesia. Gunakan link eksternal langsung.`;
405|    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
406|    res.json({ result: response.text, matchedCandidates: candidates });
407|  } catch(e) {
408|    res.status(500).json({ error: e.message });
409|  }
410|});
411|
412|// ===== CHAT =====
413|app.post("/api/chat", async (req, res) => {
414|  try {
415|    const { messages, mode } = req.body;
416|    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Messages wajib" });
417|    const chatMode = mode === 'hadits' ? 'hadits' : mode === 'maqashid' ? 'maqashid' : mode === 'genz' ? 'genz' : 'tafsir';
418|    const apiKey = process.env.SUMOPOD_API_KEY;
419|    if (!apiKey) return res.status(500).json({ error: "Sumopod API key tidak dikonfigurasi" });
420|
421|    const lastMsg = messages.slice().reverse().find(m => m.role === "user")?.content || "";
422|    const keywords = lastMsg.toLowerCase().split(/\s+/).filter(w => w.length > 3);
423|    const refs = cungkringLibrary.filter(item => keywords.some(kw => item.title.toLowerCase().includes(kw) || (item.content || "").toLowerCase().includes(kw)));
424|
425|    let refCtx = "";
426|    if (refs.length) {
427|      refCtx = "\n=== RUJUKAN DATABASE ===\n" + refs.slice(0, 10).map((r, i) => `[#${i+1}] ${r.title} - ${r.author} - ${r.content}`).join("\n");
428|    }
429|
430|    const mandatoryRules = `PERSYARATAN MUTLAK: 1) AKSARA ARAB MELIMPAH — setiap ayat, hadits, istilah kunci, & kutipan kitab WAJIB teks Arab berharakat + terjemahan. JANGAN hanya transliterasi. 2) QAUL ULAMA minimal 7 kutipan LANGSUNG — format: "[Ulama] dalam [Kitab] menyatakan: '...kutipan...'" [Kitab, Jilid X, Hal. Y]. WAJIB tanda kutip, bukan parafrase. 3) ORIENTALIS dalam BAHASA ASLI — kutipan orientalis WAJIB bahasa aslinya (Inggris/Jerman/Prancis) dulu, baru terjemahan Indonesia. 4) DENSITAS — tiap argumen 2+ ref, total 10+ kitab berbeda + 2 orientalis, tiap paragraf 1+ rujukan [Kurung Siku].`;
431|
    const sysMsg = (chatMode === 'hadits'
      ? mandatoryRules + ' Anda adalah Asisten AI Pakar Hadits. FOKUS: dual-layer criticism (sanad Al-Bukhari + matan Abu Rayya). Setiap hadits: rantai sanad, status perawi, kritik matan, derajat final.'
      : chatMode === 'maqashid'
      ? mandatoryRules + ' Anda adalah Asisten AI Pakar Maqashid Syariah & Studi Kontekstual. FOKUS: maqashid, konteks kontemporer, orientalis+oksidentalis. Hadits & tafsir sebagai landasan.'
      : chatMode === 'genz'
      ? 'Anda adalah Asisten AI Gen Z — SEPENUHNYA pakai bahasa gaul Indonesia 2024 (Jaksel + TikTok): "bestie", "literally", "which is", "jujurly", "gas", "nggak", "banget", "btw", "fomo", "slay", "spill", "valid", "no cap", "vibes", "worth it", "receh", "gercep", "santuy", "mantul", "gemoy". Gaya: santai, lucu, relate, kadang roasting ringan. TAPI: tetap akurat secara Islam. Tetap cantumkan dalil & sumber. Output singkat, to the point. JANGAN formal. JANGAN kaku. Gunakan emoji mumer. Contoh: "Bestie, jadi gini literally... spill ya" | "Jujurly sih ini tuh..." | "Nabi tuh udah spill dari dulu bestie..."'
      : mandatoryRules + ' Anda adalah Asisten AI Pakar Tafsir Al-Quran. FOKUS: asbabun nuzul, munasabah, minimal 3 kitab tafsir per ayat.') + ` FORMAT RUJUKAN: [Nama Kitab, Jilid X, Hal. Y] — kurung siku langsung setelah klaim. Ayat: [Al-Qur'an, Surah: Ayat]. "Wallahu A'lam" jika tidak tahu. JANGAN berhalusinasi.` + refCtx;
437|
438|    const response = await fetch("https://ai.sumopod.com/v1/chat/completions", {
439|      method: "POST",
440|      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
441|      body: JSON.stringify({ model: "deepseek-v4-pro", messages: [{ role: "system", content: sysMsg }, ...messages.map(m => ({ role: m.role === "model" ? "assistant" : m.role, content: m.content }))] })
442|    });
443|    if (!response.ok) {
444|      const ct = response.headers.get("content-type") || "";
445|      const errText = ct.includes("json") ? (await response.json()).error : await response.text().then(t => t.slice(0, 200));
446|      return res.status(502).json({ error: `Sumopod error (${response.status}): ${errText}` });
447|    }
448|    const data = await response.json();
449|    res.json({ reply: data.choices?.[0]?.message?.content || "Tidak ada respon" });
450|  } catch(e) {
451|    res.status(500).json({ error: e.message });
452|  }
453|});
454|
455|// ===== EVALUATE (TAHSIN) — DETEKSI HURUF + KOREKSI VN =====
456|app.post("/api/evaluate", async (req, res) => {
457|  try {
458|    const { base64Audio, mimeType, confirmedSurah, confirmedAyah, mcpText, mcpTajwid } = req.body;
459|    const apiKey = process.env.GEMINI_API_KEY;
460|    if (!apiKey) return res.status(500).json({ error: "Gemini API key tidak dikonfigurasi" });
461|    const { GoogleGenAI } = require("@google/genai");
462|    const ai = new GoogleGenAI({ apiKey });
463|    
464|    // 28 huruf Hijaiyah mapping
465|    const HIJAIYAH = {
466|      "ا":{n:"Alif",v:"001"},"ب":{n:"Ba",v:"002"},"ت":{n:"Ta",v:"003"},"ث":{n:"Tsa",v:"004"},
467|      "ج":{n:"Jim",v:"005"},"ح":{n:"Ha",v:"006"},"خ":{n:"Kha",v:"007"},"د":{n:"Dal",v:"008"},
468|      "ذ":{n:"Dzal",v:"009"},"ر":{n:"Ra",v:"010"},"ز":{n:"Za",v:"011"},"س":{n:"Sin",v:"012"},
469|      "ش":{n:"Syin",v:"013"},"ص":{n:"Shad",v:"014"},"ض":{n:"Dhad",v:"015"},"ط":{n:"Tha",v:"016"},
470|      "ظ":{n:"Zha",v:"017"},"ع":{n:"Ain",v:"018"},"غ":{n:"Ghain",v:"019"},"ف":{n:"Fa",v:"020"},
471|      "ق":{n:"Qaf",v:"021"},"ك":{n:"Kaf",v:"022"},"ل":{n:"Lam",v:"023"},"م":{n:"Mim",v:"024"},
472|      "ن":{n:"Nun",v:"025"},"و":{n:"Waw",v:"026"},"ه":{n:"Ha",v:"027"},"ي":{n:"Ya",v:"028"},
473|    };
474|    
475|    const prompt = `Evaluasi rekaman Surah ${confirmedSurah}:${confirmedAyah}. Teks: ${mcpText}. Tajwid: ${mcpTajwid}.
476|    
477|OUTPUT WAJIB dalam JSON format ini:
478|{
479|  "status": "Mumtaz/Lahn Khafy/Lahn Jaly",
480|  "detail": "penjelasan detail kesalahan",
481|  "makhraj": "posisi makhraj yang benar",
482|  "sifat": "sifat huruf yang benar",
483|  "hurufSalah": ["ت","ذ"],
484|  "matan": "teks Arab Matan Jazariyah",
485|  "terjemahMatan": "terjemahan matan"
486|}
487|
488|Hanya return JSON, tanpa teks lain.`;
489|
490|    const result = await ai.models.generateContent({
491|      model: 'gemini-2.5-flash',
492|      contents: { parts: [{ inlineData: { mimeType, data: base64Audio } }, { text: prompt }] }
493|    });
494|
495|    // Parse response — handle non-JSON gracefully
496|    let rawText = (result.text || "").trim();
497|    // Remove markdown code blocks if present
498|    rawText = rawText.replace(/^```(?:json)?\s*|\s*```$/g, '');
499|    
500|    let evalData = {};
501|    try {
502|      evalData = JSON.parse(rawText);
503|    } catch {
504|      // Fallback: extract from text
505|      const hurufMatch = rawText.match(/hurufSalah["\s:\[\]]*\[(.*?)\]/);
506|      const statusMatch = rawText.match(/(Mumtaz|Lahn\s*(Jaly|Khafy))/i);
507|      evalData = {
508|        status: statusMatch?.[0] || 'Lahn Khafy',
509|        detail: rawText.slice(0, 500),
510|        makhraj: '',
511|        sifat: '',
512|        hurufSalah: hurufMatch ? hurufMatch[1].replace(/["']/g, '').split(/[,\s]+/).filter(Boolean) : [],
513|        matan: '',
514|        terjemahMatan: '',
515|      };
516|    }
517|    const koreksiVn = [];
518|    if (evalData.hurufSalah && Array.isArray(evalData.hurufSalah)) {
519|      for (const h of evalData.hurufSalah) {
520|        if (HIJAIYAH[h]) koreksiVn.push({ huruf: h, nama: HIJAIYAH[h].n, vn: HIJAIYAH[h].v });
521|      }
522|    }
523|    res.json({ ...evalData, koreksiVn });
524|  } catch(e) {
525|    res.status(500).json({ error: e.message });
526|  }
527|});
528|
529|// ===== DEEP RESEARCH =====
530|const researchTasks = {};
531|app.post("/api/research/start", async (req, res) => {
532|  try {
533|    const { topic, userEmail, userTier } = req.body;
534|    if (!topic) return res.status(400).json({ error: "Topik wajib" });
535|    
536|    // Premium only
537|    if (userTier !== "Berbayar") {
538|      return res.status(403).json({ error: "Deep Research hanya untuk pengguna Premium" });
539|    }
540|    
541|    const id = "res_" + Date.now();
542|    const now = () => new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
543|    const task = {
544|      id, topic, status: "running", progress: 0, currentStage: "Menginisialisasi agen riset...",
545|      logs: [`[${now()}] 🚀 Agen Deep Research diaktifkan`],
546|      steps: [
547|        { name: "Analisis Topik", status: "pending", detail: "Menunggu..." },
548|        { name: "Pencarian Referensi", status: "pending", detail: "Menunggu..." },
549|        { name: "Penyusunan Prompt", status: "pending", detail: "Menunggu..." },
550|        { name: "Koneksi ke Sumopod AI", status: "pending", detail: "Menunggu..." },
551|        { name: "Generasi Konten", status: "pending", detail: "Menunggu..." }
552|      ],
553|      result: ""
554|    };
555|    researchTasks[id] = task;
556|    
557|    // Run async
558|    (async () => {
559|      try {
560|        // STEP 1: Analisis topik
561|        task.steps[0].status = "running"; task.steps[0].detail = "Memecah kata kunci...";
562|        task.currentStage = "Menganalisis topik..."; task.progress = 5;
563|        task.logs.push(`[${now()}] 📝 Topik: "${topic}"`);
564|        const keywords = topic.toLowerCase().split(/\s+/).filter(w => w.length > 2);
565|        await new Promise(r => setTimeout(r, 400));
566|        task.steps[0].status = "completed"; task.steps[0].detail = `${keywords.length} kata kunci teridentifikasi`;
567|        task.logs.push(`[${now()}] ✅ Analisis topik selesai — ${keywords.length} kata kunci`);
568|
569|        // STEP 2: Cari referensi
570|        task.steps[1].status = "running"; task.steps[1].detail = "Mencocokkan dengan database...";
571|        task.currentStage = "Mencari referensi..."; task.progress = 15;
572|        const kitabRefs = cungkringLibrary.filter(item => {
573|          const t = (item.title || "").toLowerCase();
574|          const c = (item.content || "").toLowerCase();
575|          return keywords.some(kw => t.includes(kw) || c.includes(kw));
576|        }).slice(0, 5);
577|        const portalRefs = rujukanLibrary.filter(r => {
578|          const t = (r.title || "").toLowerCase();
579|          const d = (r.description || "").toLowerCase();
580|          const cat = (r.category || "").toLowerCase();
581|          return keywords.some(kw => t.includes(kw) || d.includes(kw) || cat.includes(kw));
582|        }).slice(0, 5);
583|        await new Promise(r => setTimeout(r, 300));
584|        task.steps[1].status = "completed";
585|        task.steps[1].detail = `${kitabRefs.length} kitab + ${portalRefs.length} portal ditemukan`;
586|        task.logs.push(`[${now()}] 📚 ${kitabRefs.length} kitab relevan ditemukan`);
587|        if (portalRefs.length > 0) task.logs.push(`[${now()}] 🌐 ${portalRefs.length} portal/jurnal relevan ditemukan`);
588|        
589|        // STEP 3: Susun prompt
590|        task.steps[2].status = "running"; task.steps[2].detail = "Merangkai prompt akademik...";
591|        task.currentStage = "Menyusun prompt..."; task.progress = 25;
592|        let refContext = "";
593|        if (kitabRefs.length > 0) {
594|          refContext += "\nREFERENSI KITAB DARI PERPUSTAKAAN:\n" + kitabRefs.map(r => `- ${r.title} (${r.author}) [Sumber: ${r.externalLink || r.uri}]`).join("\n");
595|        }
596|        if (portalRefs.length > 0) {
597|          refContext += "\nREFERENSI PORTAL/JURNAL:\n" + portalRefs.map(r => `- ${r.title} [Akses: ${r.url || r.uri}]`).join("\n");
598|        }
599|        const prompt = `Riset singkat tentang: "${topic}" dalam konteks Islam, Al-Quran, Hadits, dan Tafsir.\n${refContext}\n\nTULIS SINGKAT & PADAT (maks 3-4 paragraf per bagian):\n\n## Ringkasan\n- Inti permasalahan (2-3 kalimat)\n\n## Dalil & Landasan\n- 1-2 ayat Al-Quran relevan (teks Arab + terjemah)\n- 1-2 hadits shahih (teks + perawi)\n- Ringkasan pendapat ulama (cukup 2 mazhab)\n${kitabRefs.length > 0 ? '- GUNAKAN referensi kitab di atas sebagai sumber.\n' : ''}\n## Analisis\n- Poin kunci (3-5 bullet points)\n- Relevansi kontemporer (1 paragraf)\n\n## Kesimpulan\n- Jawaban ringkas (2-3 kalimat)\n\n## Referensi\n- 3 sumber utama dari perpustakaan Quranica AI\n${portalRefs.length > 0 ? '- Cantumkan minimal 1 portal/jurnal dari daftar.\n' : ''}\nFORMAT: Markdown, Bahasa Indonesia ringkas. Langsung ke inti.`;
600|        await new Promise(r => setTimeout(r, 200));
601|        task.steps[2].status = "completed"; task.steps[2].detail = `Prompt ${prompt.length} karakter`;
602|        task.logs.push(`[${now()}] ✍️ Prompt tersusun — ${prompt.length} karakter`);
603|
604|        // STEP 4: Koneksi Sumopod
605|        task.steps[3].status = "running"; task.steps[3].detail = "Menghubungi server AI...";
606|        task.currentStage = "Mengirim ke Sumopod..."; task.progress = 40;
607|        const sumopodKey = process.env.SUMOPOD_API_KEY;
608|        if (!sumopodKey) throw new Error("SUMOPOD_API_KEY tidak dikonfigurasi");
609|        const t0 = Date.now();
610|        const resp = await fetch("https://ai.sumopod.com/v1/chat/completions", {
611|          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sumopodKey}` },
612|          body: JSON.stringify({ model: "deepseek-v4-pro", messages: [{ role: "user", content: prompt }] })
613|        });
614|        if (!resp.ok) throw new Error(`Sumopod HTTP ${resp.status}`);
615|        task.steps[3].status = "completed";
616|        task.steps[3].detail = `Terhubung (${Date.now() - t0}ms)`;
617|        task.logs.push(`[${now()}] 🔗 Terhubung ke Sumopod Deepseek — ${Date.now() - t0}ms`);
618|
619|        // STEP 5: Generasi konten
620|        task.steps[4].status = "running"; task.steps[4].detail = "AI sedang menulis...";
621|        task.currentStage = "AI menulis..."; task.progress = 55;
622|        const data = await resp.json();
623|        const result = data.choices?.[0]?.message?.content || "";
624|        if (!result) throw new Error("Sumopod mengembalikan respons kosong");
625|        task.steps[4].status = "completed";
626|        task.steps[4].detail = `${result.length} karakter dihasilkan`;
627|        task.logs.push(`[${now()}] 🎯 Konten dihasilkan — ${result.length} karakter`);
628|        
629|        task.result = result; task.status = "completed"; task.progress = 100;
630|        task.currentStage = "✅ Riset selesai";
631|        task.logs.push(`[${now()}] 🏁 Deep Research selesai dalam ${Date.now() - parseInt(id.replace('res_',''))}ms`);
632|      } catch(e) {
633|        task.status = "error"; task.result = e.message;
634|      }
635|    })();
636|    
637|    res.json({ id });
638|  } catch(e) { res.status(500).json({ error: e.message }); }
639|});
640|
641|app.get("/api/research/status/:id", (req, res) => {
642|  const task = researchTasks[req.params.id];
643|  if (!task) return res.status(404).json({ error: "Sesi tidak ditemukan" });
644|  res.json(task);
645|});
646|
647|// ===== SERVE STATIC FRONTEND =====
648|app.use(express.static(path.join(__dirname, "..", "dist")));
649|app.get("*", (req, res) => {
650|  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "API route not found" });
651|  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
652|});
653|
654|module.exports = app;
655|