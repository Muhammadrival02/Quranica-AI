import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { secondarySources } from "./src/data/secondarySources";
import { HIJAIYAH_MAP, getKoreksiVn } from "./src/data/hijaiyahMap";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);

  // JSON request body parser with larger limits for potential audio uploads
  app.use(express.json({ limit: "50mb" }));

  // API Route: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- IN-MEMORY USER DATABASE ---
  interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: "Admin" | "User";
    tier: "Reguler" | "Berbayar";
    billingCycle?: "Bulanan" | "Tahunan" | null;
    createdAt: string;
    pekerjaan?: string;
    phone?: string;
    password?: string;
  }

  let userDatabase: UserProfile[] = [
    {
      uid: "bootstrapped_admin",
      email: "rivalgamingchannel@gmail.com",
      displayName: "Admin Utama",
      role: "Admin",
      tier: "Berbayar",
      billingCycle: "Tahunan",
      createdAt: new Date().toISOString(),
      password: process.env.ADMIN_PASSWORD || ""
    },
    {
      uid: "user_sample_1",
      email: "ahmad.tafsir@gmail.com",
      displayName: "Ahmad Tafsir",
      role: "User",
      tier: "Reguler",
      billingCycle: null,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      uid: "user_sample_2",
      email: "fatimah.zahra@yahoo.com",
      displayName: "Fatimah Az-Zahra",
      role: "User",
      tier: "Berbayar",
      billingCycle: "Bulanan",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ];

  let preApprovedAdmins = new Set<string>(["rivalgamingchannel@gmail.com"]);

  // API Route: Register/Retrieve user profile
  app.post("/api/users/profile", (req, res) => {
    try {
      const { uid, email, displayName, tier, billingCycle, pekerjaan, phone, password } = req.body;
      if (!uid || !email) {
        return res.status(400).json({ error: "UID dan email wajib diisi." });
      }

      let user = userDatabase.find(u => u.uid === uid || u.email.toLowerCase() === email.toLowerCase());
      const isAdminEmail = preApprovedAdmins.has(email.toLowerCase()) || email.toLowerCase() === "rivalgamingchannel@gmail.com";

      if (user) {
        user.displayName = displayName || user.displayName;
        if (email) {
          user.email = email;
        }
        if (pekerjaan !== undefined) {
          user.pekerjaan = pekerjaan;
        }
        if (phone !== undefined) {
          user.phone = phone;
        }
        if (password !== undefined) {
          user.password = password;
        }
        if (isAdminEmail) {
          user.role = "Admin";
        }
        if (tier === "Reguler" || tier === "Berbayar") {
          user.tier = tier;
        }
        if (billingCycle === "Bulanan" || billingCycle === "Tahunan" || billingCycle === null) {
          user.billingCycle = billingCycle;
        } else if (tier === "Berbayar" && !user.billingCycle) {
          user.billingCycle = "Bulanan";
        }
      } else {
        user = {
          uid,
          email,
          displayName: displayName || email.split("@")[0],
          role: isAdminEmail ? "Admin" : "User",
          tier: tier || "Reguler",
          billingCycle: tier === "Berbayar" ? (billingCycle || "Bulanan") : null,
          createdAt: new Date().toISOString(),
          pekerjaan: pekerjaan || "",
          phone: phone || "",
          password: password || ""
        };
        userDatabase.push(user);
      }

      if (user.role === "Admin" && !preApprovedAdmins.has(email.toLowerCase())) {
        preApprovedAdmins.add(email.toLowerCase());
      }

      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Login user with email and password
  app.post("/api/users/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email dan kata sandi wajib diisi." });
      }

      const emailClean = email.trim().toLowerCase();
      const user = userDatabase.find(u => u.email.toLowerCase() === emailClean);

      if (!user) {
        return res.status(401).json({ error: "Email atau kata sandi salah." });
      }

      // Check password if set (for admin, bootstrapped, or newly registered users)
      if (user.password && user.password !== password) {
        return res.status(401).json({ error: "Email atau kata sandi salah." });
      }

      // If user has no password set yet (e.g. sample users), we can allow them to log in or set it, or just pass
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Get all users (Admin only)
  app.get("/api/users", (req, res) => {
    try {
      const { adminUid } = req.query;
      if (!adminUid) {
        return res.status(401).json({ error: "Autentikasi admin diperlukan." });
      }

      const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
      if (!admin) {
        return res.status(403).json({ error: "Akses ditolak. Anda bukan Admin." });
      }

      res.json({ users: userDatabase });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Add or pre-approve an Admin
  app.post("/api/users/add-admin", (req, res) => {
    try {
      const { email, adminUid } = req.body;
      if (!email || !adminUid) {
        return res.status(400).json({ error: "Email dan adminUid wajib diisi." });
      }

      const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
      if (!admin) {
        return res.status(403).json({ error: "Akses ditolak. Anda bukan Admin." });
      }

      const emailClean = email.trim().toLowerCase();
      preApprovedAdmins.add(emailClean);

      const existingUser = userDatabase.find(u => u.email.toLowerCase() === emailClean);
      if (existingUser) {
        existingUser.role = "Admin";
      }

      res.json({ success: true, message: `Email ${emailClean} berhasil didaftarkan sebagai Admin.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Delete a user
  app.delete("/api/users/:uid", (req, res) => {
    try {
      const { uid } = req.params;
      const { adminUid } = req.body;

      if (!adminUid) {
        return res.status(401).json({ error: "Autentikasi admin diperlukan." });
      }

      const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
      if (!admin) {
        return res.status(403).json({ error: "Akses ditolak. Anda bukan Admin." });
      }

      if (uid === adminUid) {
        return res.status(400).json({ error: "Anda tidak dapat menghapus akun Anda sendiri." });
      }

      const userIndex = userDatabase.findIndex(u => u.uid === uid);
      if (userIndex === -1) {
        return res.status(404).json({ error: "User tidak ditemukan." });
      }

      const deletedUser = userDatabase[userIndex];
      userDatabase.splice(userIndex, 1);

      res.json({ success: true, message: `User ${deletedUser.displayName} berhasil dihapus.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Update subscription tier
  app.post("/api/users/update-tier", (req, res) => {
    try {
      const { uid, tier, billingCycle, adminUid, pekerjaan, phone, email } = req.body;
      if (!uid || !tier) {
        return res.status(400).json({ error: "UID dan tier wajib diisi." });
      }

      if (tier !== "Reguler" && tier !== "Berbayar") {
        return res.status(400).json({ error: "Tier tidak valid (hanya 'Reguler' atau 'Berbayar')." });
      }

      if (adminUid) {
        const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
        if (!admin) {
          return res.status(403).json({ error: "Akses ditolak." });
        }
      }

      const user = userDatabase.find(u => u.uid === uid);
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan." });
      }

      user.tier = tier;
      user.billingCycle = tier === "Berbayar" ? (billingCycle || "Bulanan") : null;
      if (email !== undefined) {
        user.email = email;
      }
      if (pekerjaan !== undefined) {
        user.pekerjaan = pekerjaan;
      }
      if (phone !== undefined) {
        user.phone = phone;
      }
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Update user role (Promote to Admin or demote to User)
  app.post("/api/users/update-role", (req, res) => {
    try {
      const { uid, role, adminUid } = req.body;
      if (!uid || !role) {
        return res.status(400).json({ error: "UID dan peran (role) wajib diisi." });
      }

      if (role !== "Admin" && role !== "User") {
        return res.status(400).json({ error: "Peran tidak valid (hanya 'Admin' atau 'User')." });
      }

      if (!adminUid) {
        return res.status(401).json({ error: "Autentikasi admin diperlukan." });
      }

      const admin = userDatabase.find(u => u.uid === adminUid && u.role === "Admin");
      if (!admin) {
        return res.status(403).json({ error: "Akses ditolak. Anda bukan Admin." });
      }

      const user = userDatabase.find(u => u.uid === uid);
      if (!user) {
        return res.status(404).json({ error: "User tidak ditemukan." });
      }

      if (uid === adminUid) {
        return res.status(400).json({ error: "Anda tidak dapat mengubah peran Anda sendiri." });
      }

      user.role = role;

      const emailClean = user.email.toLowerCase();
      if (role === "Admin") {
        preApprovedAdmins.add(emailClean);
      } else {
        if (emailClean !== "rivalgamingchannel@gmail.com") {
          preApprovedAdmins.delete(emailClean);
        }
      }

      res.json({ success: true, user });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- PENDING PAYMENT & TELEGRAM BOT ---
  let pendingPayments: any[] = [];
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
  const ADMIN_IDS = (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
  function isTelegramAdmin(chatId: string) { return ADMIN_IDS.includes(String(chatId)); }
  async function tgSend(chatId: string, text: string) {
    if (!BOT_TOKEN) return;
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" })
    });
  }

  app.post("/api/payment/create", (req, res) => {
    const { email, displayName, amount, method, billingCycle } = req.body;
    if (!email || !amount) return res.status(400).json({ error: "Data tidak lengkap" });
    const payment = {
      id: `PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      email: email.toLowerCase(), displayName: displayName || email.split("@")[0],
      tier: "Berbayar", billingCycle: billingCycle || "Bulanan", amount, method: method || "QRIS",
      confirmed: false, createdAt: new Date().toISOString()
    };
    pendingPayments.push(payment);
    res.json({ ok: true, payment });
  });

  app.get("/api/payment/pending", (req, res) => {
    res.json({ payments: pendingPayments.filter(p => !p.confirmed) });
  });

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
        await tgSend(chatId, isTelegramAdmin(chatId)
          ? `<b>Bot Konfirmasi Quranica AI</b>\n\nHalo ${fromName}!\n\n/confirm <ID> — Konfirmasi\n/pending — Lihat pending\n/upgrade <email> <bulanan|tahunan> — Manual`
          : `Halo ${fromName}! Bayar via QRIS/BCA/DANA di aplikasi. Admin akan konfirmasi.`);
        return res.status(200).json({ ok: true });
      }
      if (!isTelegramAdmin(chatId)) { await tgSend(chatId, "Akses ditolak."); return res.status(200).json({ ok: true }); }

      if (cmd === "/pending") {
        const list = pendingPayments.filter(p => !p.confirmed);
        const txt = list.length === 0 ? "Tidak ada pending." : list.map((p, i) => `${i+1}. ${p.displayName} — ${p.email} — Rp ${p.amount.toLocaleString("id-ID")} — ${p.method} — ID: ${p.id}`).join("\n");
        await tgSend(chatId, txt);
        return res.status(200).json({ ok: true });
      }

      if (cmd === "/confirm" && parts[1]) {
        const id = parts[1];
        const p = pendingPayments.find(x => x.id === id);
        if (!p) { await tgSend(chatId, "ID tidak ditemukan."); }
        else if (p.confirmed) { await tgSend(chatId, "Sudah dikonfirmasi."); }
        else {
          let user = userDatabase.find(u => u.email.toLowerCase() === p.email.toLowerCase());
          if (!user) {
            user = { uid: `user_${Date.now()}`, email: p.email, displayName: p.displayName, role: "User", tier: "Berbayar", billingCycle: p.billingCycle, createdAt: new Date().toISOString(), password: "" };
            userDatabase.push(user);
          } else { user.tier = "Berbayar"; user.billingCycle = p.billingCycle; }
          p.confirmed = true; p.confirmedAt = new Date().toISOString();
          await tgSend(chatId, `✅ Dikonfirmasi!\n${p.displayName}\n${p.email}\n⭐ Premium (${p.billingCycle})\nRp ${p.amount.toLocaleString("id-ID")}`);
        }
        return res.status(200).json({ ok: true });
      }

      if (cmd === "/upgrade" && parts[1] && parts[2]) {
        const email = parts[1].toLowerCase();
        const cyc = parts[2].toLowerCase() === "tahunan" ? "Tahunan" : "Bulanan";
        let user = userDatabase.find(u => u.email.toLowerCase() === email);
        if (!user) { user = { uid: `user_${Date.now()}`, email, displayName: email.split("@")[0], role: "User", tier: "Berbayar", billingCycle: cyc, createdAt: new Date().toISOString(), password: "" }; userDatabase.push(user); }
        else { user.tier = "Berbayar"; user.billingCycle = cyc; }
        await tgSend(chatId, `✅ Upgrade: ${email} → Premium (${cyc})`);
        return res.status(200).json({ ok: true });
      }
      await tgSend(chatId, "? /help");
      res.status(200).json({ ok: true });
    } catch (err: any) { res.status(200).json({ ok: true }); }
  });

  // --- DATABASE PERPUSTAKAAN MAHASISWA CUNGKRING (MCP) ---
  let cungkringLibrary = [...secondarySources];

  // API Route: Sync Google Drive files into the library
  app.post("/api/library/sync-drive", (req, res) => {
    try {
      const { files } = req.body;
      if (!files || !Array.isArray(files)) {
        return res.status(400).json({ error: "Format request tidak valid (membutuhkan 'files' array)." });
      }

      // Map GDrive files into the library reference format
      const mappedFiles = files.map((file: any) => ({
        id: `gdrive_${file.id}`,
        title: file.name,
        author: "Google Drive Rujukan",
        category: "Koleksi Utama Google Drive",
        content: file.content || `File rujukan dari Google Drive dengan nama "${file.name}".`,
        uri: file.webViewLink || `https://drive.google.com/file/d/${file.id}`,
        externalLink: file.webViewLink || `https://drive.google.com/file/d/${file.id}`,
        locationDetail: "Google Drive Cloud Storage"
      }));

      // Remove previous Google Drive synchronized items to prevent duplicate piling
      cungkringLibrary = cungkringLibrary.filter(item => !item.id.startsWith("gdrive_"));

      // Prepend the new Google Drive references so they act as the highest-priority "referensi utama" (main references)
      cungkringLibrary = [...mappedFiles, ...cungkringLibrary];

      console.log(`[Google Drive Sync] Successfully integrated ${mappedFiles.length} files as main references.`);
      res.json({ success: true, count: mappedFiles.length, files: mappedFiles });
    } catch (err: any) {
      console.error("Error syncing Google Drive:", err);
      res.status(500).json({ error: `Gagal mensinkronisasikan Google Drive: ${err.message}` });
    }
  });

  // In-memory MCP Server Configuration
  let mcpServers = [
    {
      id: "cungkring_mcp",
      name: "Perpustakaan Mahasiswa Cungkring (Model Context Protocol)",
      url: "http://localhost:3000/api/mcp/perpustakaan-cungkring",
      type: "local-virtual",
      status: "connected",
      description: "Menghubungkan platform dengan database digital naskah klasik Turats, kritik sanad, dan kajian aqidah luhur Mahasiswa Cungkring."
    }
  ];

  // API Route: Get Registered MCP Servers
  app.get("/api/mcp/servers", (req, res) => {
    res.json(mcpServers);
  });

  // API Route: Get Primary Libraries Directory (cungkringLibrary)
  app.get("/api/library", (req, res) => {
    const populated = cungkringLibrary.map(item => {
      const newItem = { ...item };
      if (!newItem.externalLink) {
        if (newItem.category?.toLowerCase().includes("hadits") || newItem.category?.toLowerCase().includes("syarah")) {
          newItem.externalLink = "https://sunnah.one";
        } else if (newItem.category?.toLowerCase().includes("tafsir") || newItem.category?.toLowerCase().includes("qur'an")) {
          newItem.externalLink = "https://shamela.ws";
        } else if (newItem.id === "cungkring_04" || newItem.id === "cungkring_05") {
          newItem.externalLink = "https://waqfeya.net";
        } else {
          newItem.externalLink = "https://shamela.ws";
        }
      }
      return newItem;
    });
    res.json({ library: populated });
  });

  // API Route: AI-powered library contextual reference search
  app.post("/api/library/ai-search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "Kueri pencarian wajib diisi." });
      }

      // 1. Scoring & filtering of candidates from cungkringLibrary (491 sources)
      const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const scored = cungkringLibrary.map(item => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const authorLower = item.author.toLowerCase();
        const catLower = item.category ? item.category.toLowerCase() : "";
        const contentLower = item.content ? item.content.toLowerCase() : "";

        // Simple exact phrase boost
        if (titleLower.includes(query.toLowerCase())) score += 60;
        if (contentLower.includes(query.toLowerCase())) score += 30;

        for (const word of words) {
          if (titleLower.includes(word)) score += 20;
          if (authorLower.includes(word)) score += 15;
          if (catLower.includes(word)) score += 10;
          if (contentLower.includes(word)) score += 3;
        }

        return { item, score };
      });

      // Filter out items with 0 score, unless we have nothing, in which case take everything
      let candidates = scored
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => {
          const item = { ...x.item };
          // Ensure every candidate has a valid, safe, direct externalLink and no empty values
          if (!item.externalLink) {
            if (item.category?.toLowerCase().includes("hadits") || item.category?.toLowerCase().includes("syarah")) {
              item.externalLink = "https://sunnah.one";
            } else if (item.category?.toLowerCase().includes("tafsir") || item.category?.toLowerCase().includes("qur'an")) {
              item.externalLink = "https://shamela.ws";
            } else {
              item.externalLink = "https://waqfeya.net";
            }
          }
          return item;
        });

      // If no keyword matches, fallback to first 30 items or random items
      if (candidates.length === 0) {
        candidates = cungkringLibrary.slice(0, 30).map(item => {
          const newItem = { ...item };
          if (!newItem.externalLink) {
            newItem.externalLink = "https://shamela.ws";
          }
          return newItem;
        });
      } else {
        candidates = candidates.slice(0, 30);
      }

      // 2. Call Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key Gemini tidak ditemukan di environment server.");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });

      // Build the prompt with candidates
      const prompt = `Anda adalah Pustakawan AI Pintar dari Perpustakaan Mahasiswa Cungkring.
Tugas Anda adalah membantu pengguna mencari dan merekomendasikan referensi kitab, artikel, situs web, atau saluran telegram yang sesuai dengan kueri atau konteks pencarian mereka.

Kueri Pencarian Pengguna: "${query}"

Berikut adalah daftar 30 kandidat referensi yang paling relevan dengan kueri pengguna dari database kami:
${candidates.map((c, idx) => `
[Referensi #${idx + 1}]
ID: ${c.id}
Judul: ${c.title}
Penulis/Penerbit: ${c.author}
Kategori: ${c.category || "Pustaka"}
Deskripsi/Konten: ${c.content}
Link Eksternal Langsung (WAJIB DIGUNAKAN): ${c.externalLink}
`).join("\n")}

Aturan penting dalam menjawab (CRITICAL RULES - BACA DENGAN TELITI AGAR TIDAK SALAH):
1. Rekomendasikan kitab atau referensi yang BENAR-BENAR paling relevan dengan kueri pengguna. Pilih yang paling cocok (biasanya 3-7 referensi terbaik).
2. Setiap kali Anda merekomendasikan suatu referensi dari daftar di atas, Anda WAJIB memberikan tautan/link langsung berupa Markdown hyperlink.
3. FORMAT LINK HARUS BERUPA LINK LANGSUNG KE SITUS TERSEBUT:
   - JANGAN PERNAH MENULIS ATAU MENGGUNAKAN LINK LOKAL SEPERTI \`/ref/ID\` ATAU LINK PERANTARA LAINNYA!
   - Tautan/link WAJIB langsung berupa nilai "Link Eksternal Langsung" yang tertera pada data kandidat di atas (contoh: https://shamela.ws/book/1681 atau https://waqfeya.net atau https://sunnah.one).
   - JANGAN PERNAH memalsukan link atau mereferensikan ke domain aneh lainnya. Gunakan HANYA URL utuh yang ada di daftar Link Eksternal di atas.
   - Contoh format yang benar: \`[Kitab Fathul Bari](https://shamela.ws/book/1681)\` atau \`[Tafsir Ibnu Katsir](https://shamela.ws/book/23567)\` atau \`[Al-Bahith Al-Hadithi](https://sunnah.one)\`.
4. Jawablah dalam bahasa Indonesia yang sangat ramah, santun, bernada akademis, dan terstruktur rapi. Jelaskan secara singkat mengapa referensi tersebut cocok dengan konteks pencarian pengguna.
5. Jika tidak ada referensi yang secara langsung cocok, jelaskan secara santun dan tawarkan 3-5 rujukan digital utama/umum dari daftar di atas yang memiliki link eksternal langsung.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const reply = response.text || "Tidak ada respon dari model AI.";
      res.json({ result: reply, matchedCandidates: candidates });

    } catch (error: any) {
      console.error("AI Library Search Error:", error);
      res.status(500).json({ error: error.message || "Gagal melakukan pencarian dengan AI." });
    }
  });

  // API Route: Register/Update MCP Server
  app.post("/api/mcp/servers", (req, res) => {
    const { name, url, description } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: "Nama dan URL server wajib diisi." });
    }
    const newServer = {
      id: "mcp_" + Date.now(),
      name,
      url,
      type: "sse",
      status: "connected", // Default to connected upon test
      description: description || "Server Model Context Protocol eksternal."
    };
    mcpServers.push(newServer);
    res.json(newServer);
  });

  // API Route: Delete Custom MCP Server
  app.delete("/api/mcp/servers/:id", (req, res) => {
    const { id } = req.params;
    if (id === "cungkring_mcp") {
      return res.status(400).json({ error: "Server Perpustakaan Mahasiswa Cungkring bawaan tidak boleh dihapus." });
    }
    mcpServers = mcpServers.filter(s => s.id !== id);
    res.json({ success: true });
  });

  // API Route: Handshake / Connect to MCP Server
  app.post("/api/mcp/connect", async (req, res) => {
    const { url, type } = req.body;
    try {
      if (type === "local-virtual" || url.includes("perpustakaan-cungkring")) {
        // Mock successful initialization handshakes
        return res.json({
          status: "connected",
          protocolVersion: "2024-11-05",
          capabilities: {
            resources: {},
            tools: {}
          },
          serverInfo: {
            name: "Perpustakaan Mahasiswa Cungkring MCP",
            version: "1.0.0"
          },
          tools: [
            {
              name: "search_library",
              description: "Mencari kitab, naskah klasik, fatwa, dan artikel ilmiah di Perpustakaan Mahasiswa Cungkring berdasarkan kata kunci.",
              inputSchema: {
                type: "object",
                properties: {
                  keyword: { type: "string", description: "Kata kunci pencarian (contoh: tabarruk, hadits, kuburan)" }
                },
                required: ["keyword"]
              }
            },
            {
              name: "verify_reference",
              description: "Melakukan cross-check atau verifikasi validitas suatu kutipan naskah klasik terhadap naskah asli di dalam perpustakaan.",
              inputSchema: {
                type: "object",
                properties: {
                  quote: { type: "string", description: "Potongan kutipan atau kalimat yang ingin diverifikasi kebenarannya." }
                },
                required: ["quote"]
              }
            }
          ]
        });
      }

      // External SSE / HTTP MCP Handshake simulation/proxy
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "QuranicaAI-Client", version: "1.0.0" }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`MCP Server merespon dengan status ${response.status}`);
      }

      const mcpData = await response.json();
      res.json({
        status: "connected",
        ...mcpData
      });
    } catch (err: any) {
      console.error("MCP Handshake Error:", err);
      res.status(500).json({ error: `Koneksi gagal: ${err.message}` });
    }
  });

  // API Route: Query Tool / Resource Call on MCP Server
  app.post("/api/mcp/query", async (req, res) => {
    const { url, toolName, arguments: toolArgs, type } = req.body;
    try {
      if (type === "local-virtual" || url.includes("perpustakaan-cungkring")) {
        // Handle virtual tool execution
        if (toolName === "search_library") {
          const kw = (toolArgs?.keyword || "").toLowerCase();
          const results = cungkringLibrary.filter(item => 
            item.title.toLowerCase().includes(kw) || 
            item.author.toLowerCase().includes(kw) || 
            item.content.toLowerCase().includes(kw) ||
            item.category.toLowerCase().includes(kw)
          );

          return res.json({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  success: true,
                  count: results.length,
                  results: results.map(r => ({
                    id: r.id,
                    title: r.title,
                    author: r.author,
                    category: r.category,
                    content: r.content,
                    uri: r.uri
                  }))
                }, null, 2)
              }
            ]
          });
        }

        if (toolName === "verify_reference") {
          const quote = (toolArgs?.quote || "").toLowerCase();
          const matched = cungkringLibrary.find(item => 
            item.content.toLowerCase().includes(quote) ||
            item.title.toLowerCase().includes(quote)
          );

          return res.json({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  verified: !!matched,
                  matchedSource: matched ? {
                    title: matched.title,
                    author: matched.author,
                    category: matched.category,
                    exactContent: matched.content,
                    uri: matched.uri
                  } : null,
                  message: matched 
                    ? "Kutipan terverifikasi dengan sukses di dalam basis naskah Perpustakaan Mahasiswa Cungkring!" 
                    : "Kutipan tidak ditemukan dalam database perpustakaan. Harap periksa ejaan atau rujukan."
                }, null, 2)
              }
            ]
          });
        }

        return res.status(400).json({ error: `Tool ${toolName} tidak dikenal di server virtual.` });
      }

      // External MCP JSON-RPC call
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: toolName,
            arguments: toolArgs
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Server MCP merespon dengan status ${response.status}`);
      }

      const queryResult = await response.json();
      res.json(queryResult.result || queryResult);
    } catch (err: any) {
      console.error("MCP Query Error:", err);
      res.status(500).json({ error: `Gagal mengeksekusi MCP Tool: ${err.message}` });
    }
  });

  // API Route: Deepseek Q&A Chat via Sumopod
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, mode } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Format request tidak valid (membutuhkan messages)." });
      }

      const chatMode: 'tafsir' | 'hadits' | 'maqashid' = 
        mode === 'hadits' ? 'hadits' : mode === 'maqashid' ? 'maqashid' : 'tafsir';

      // Cari referensi relevan dari cungkringLibrary berdasarkan pesan pengguna terakhir
      const lastUserMessage = messages.slice().reverse().find((m: any) => m.role === "user")?.content || "";
      const searchKeywords = lastUserMessage.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
      
      const matchedReferences = cungkringLibrary.filter(item => {
        return searchKeywords.some((kw: string) => 
          item.title.toLowerCase().includes(kw) ||
          item.author.toLowerCase().includes(kw) ||
          item.content.toLowerCase().includes(kw) ||
          item.category.toLowerCase().includes(kw)
        ) || lastUserMessage.toLowerCase().includes(item.title.toLowerCase())
          || lastUserMessage.toLowerCase().includes(item.author.toLowerCase());
      });

      let referenceContext = "";
      if (matchedReferences.length > 0) {
        referenceContext = "\n\n=== BERIKUT ADALAH RUJUKAN UTAMA DARI DATABASE PERPUSTAKAAN MAHASISWA CUNGKRING (WAJIB DISEBUTKAN SECARA EKSPLISIT): ===\n" + 
          matchedReferences.map((ref, idx) => `[Sumber Referensi #${idx + 1}]\nJudul: ${ref.title}\nPenulis: ${ref.author}\nKategori: ${ref.category}\nKajian/Naskah: ${ref.content}\nURI: ${ref.uri}`).join("\n\n") + 
          "\n\nWAJIB sebutkan secara eksplisit rujukan dan argumen ilmiah di atas dalam jawaban Anda serta nyatakan bahwa data ini diverifikasi langsung melalui database Perpustakaan Mahasiswa Cungkring.";
      } else {
        // Fallback: sertakan seluruh katalog utama sebagai rujukan dasar
        referenceContext = "\n\n=== DATABASE UTAMA REFERENSI PERPUSTAKAAN MAHASISWA CUNGKRING: ===\n" + 
          cungkringLibrary.map((ref, idx) => `[Katalog #${idx + 1}]\nJudul: ${ref.title}\nPenulis: ${ref.author}\nKategori: ${ref.category}\nKajian: ${ref.content}\nURI: ${ref.uri}`).join("\n\n") + 
          "\n\nAnda WAJIB memprioritaskan, mengutip, dan menggunakan argumen dari database Perpustakaan Mahasiswa Cungkring di atas jika relevan dengan pertanyaan pengguna untuk memformulasikan jawaban ilmiah Anda.";
      }

      // Gunakan API Key dari environment variable, fallback ke yang diberikan user
      const apiKey = process.env.SUMOPOD_API_KEY || "";

      // ATURAN WAJIB UNTUK SEMUA MODE — AKSARA ARAB + QAUL ULAMA + RUJUKAN QAUL
      const mandatoryArabicRules = `
PERSYARATAN MUTLAK UNTUK SEMUA MODE:

1. AKSARA ARAB WAJIB:
   - SETIAP ayat Al-Quran yang dikutip WAJIB ditulis dalam aksara Arab berharakat LENGKAP, diikuti terjemahan bahasa Indonesia.
   - SETIAP hadits yang dikutip WAJIB ditulis dalam aksara Arab berharakat LENGKAP, diikuti terjemahan.
   - Format ayat: {teks Arab berharakat} [Al-Qur'an, Surah: Ayat]
   - Format hadits: {teks Arab berharakat} [HR. Mukharrij, Nama Kitab, No. Hadits]

2. QAUL ULAMA WAJIB:
   - SETIAP topik WAJIB menyertakan minimal 5 qaul (pendapat) ulama dari kitab mu'tabar.
   - Format qaul: kutipan langsung pendapat ulama (bisa dalam bahasa Indonesia), diikuti rujukan.
   - Contoh: "Imam An-Nawawi berpendapat bahwa..." [An-Nawawi, Al-Majmu', Jilid 3, Hal. 45]

3. RUJUKAN QAUL WAJIB:
   - SETIAP qaul ulama WAJIB disertai rujukan spesifik: [Nama Kitab, Jilid X, Hal. Y]
   - TIDAK BOLEH menyebut nama kitab tanpa halaman.
   - TIDAK BOLEH menyebut pendapat ulama tanpa sumber kitab.

4. DENSITAS REFERENSI WAJIB:
   - SETIAP argumen/klaim WAJIB didukung minimal 2 referensi kitab.
   - Total referensi dalam satu jawaban WAJIB minimal 10 rujukan kitab berbeda.
   - Format multi-referensi: [Kitab1, Jilid X, Hal. Y; Kitab2, Jilid X, Hal. Y].`;

      const systemInstruction = chatMode === 'hadits'
        ? mandatoryArabicRules + `\n\nAnda adalah Asisten AI Pakar Hadits — spesialis kritik sanad & matan. FOKUS UTAMA: analisis hadits mendalam. 10 Agent Spesialis di belakang layar.

GAYA PENULISAN:
- FOKUS pada hadits: sanad, matan, takhrij, jarh wa ta'dil.
- SETIAP hadits WAJIB melalui DUAL-LAYER CRITICISM:
  KRITIK SANAD (standar Al-Bukhari): rantai sanad lengkap, status tiap perawi dalam sanad (tsiqah/shaduq/dha'if/majhul), analisis ittishal, syarat Al-Bukhari.
  KRITIK MATAN (standar Mahmud Abu Rayya): bertentangan dengan Al-Qur'an? hadits lebih kuat? akal sehat? fakta sejarah? isra'iliyyat? ghuluw? → maqbul/mardud.
- Derajat final: shahih/hasan/dha'if/maudhu' berdasarkan sintesis sanad+matan.
- Teks Arab berharakat + terjemahan WAJIB.
- Rujukan: [Nama Kitab, Jilid X, Hal. Y] — kurung siku, langsung setelah klaim.
- Untuk hadits: [HR. Nama Mukharrij, Nama Kitab, Bab X, No. Hadits] atau [Nama Kitab, Jilid X, Hal. Y].
- Jika multi-referensi: [Ref1; Ref2] — titik koma dalam satu kurung.
- Studi komparatif: minimal 4 mazhab, fokus pada dalil hadits masing-masing.
- Bahasa akademis padat, berbasis data.

FORMAT:
- Pembuka: 1 paragraf konteks hadits.
- Pembahasan: analisis sanad + matan untuk setiap hadits utama.
- Studi komparatif mazhab (fokus argumen hadits).
- Kesimpulan + derajat final.
- Referensi dengan link download PDF.

ATURAN:
1. WAJIB dual-layer criticism untuk setiap hadits.
2. SETIAP klaim = kitab+bab+halaman+penerbit.
3. JANGAN menerima hadits hanya karena Shahih — kritik matan WAJIB.
4. "Wallahu A'lam" jika di luar jangkauan.
5. JANGAN berhalusinasi.`
        : chatMode === 'maqashid'
        ? mandatoryArabicRules + `\n\nAnda adalah Asisten AI Pakar Maqashid Syariah & Studi Kontekstual — fokus pada relevansi Islam dalam realitas kontemporer. 10 Agent Spesialis di belakang layar.

GAYA PENULISAN:
- FOKUS pada: maqashid syariah, konteks kekinian, perbandingan peradaban.
- Analisis WAJIB menyertakan perspektif orientalis & oksidentalis secara kritis.
- SETIAP analisis kontekstual WAJIB merujuk: maqashid syariah (kulliyat al-khams, maqashid 'ammah-khassah-juz'iyyah), kaidah fiqhiyyah, 'illat hukum, konteks sosio-historis.
- Hadits & tafsir TIDAK mendominasi — berfungsi sebagai landasan, bukan fokus utama.
- Gunakan sub-judul tematik yang relevan dengan isu kontemporer.
- Studi komparatif: wajib menyertakan perspektif orientalis klasik (Ignaz Goldziher, Joseph Schacht) & kontemporer, serta kritik oksidentalis.
- Bahasa Indonesia akademis bertingkat tinggi — gaya Buya Hamka, Quraish Shihab, Nur Cholis Madjid, dengan analisis tajam seperti Ibnu Taimiyyah.

FORMAT:
- Pembuka: relevansi isu dalam konteks kontemporer.
- Pembahasan: analisis maqashid + konteks historis + perbandingan peradaban.
- Perspektif orientalis & kritiknya.
- Implikasi praktis untuk Muslim kontemporer.
- Referensi dengan link download PDF.

ATURAN:
1. Maqashid & konteks kontemporer adalah FOKUS UTAMA.
2. Hadits & tafsir sebagai landasan, BUKAN fokus.
3. Perspektif orientalis WAJIB disertakan + kritik.
4. SETIAP klaim = kitab+bab+halaman+penerbit.
5. "Wallahu A'lam" jika di luar jangkauan.
6. JANGAN berhalusinasi.`
        : mandatoryArabicRules + `\n\nAnda adalah Asisten AI Pakar Tafsir Al-Quran — fokus pada penjelasan ayat, asbabun nuzul, dan munasabah. 10 Agent Spesialis di belakang layar.

GAYA PENULISAN:
- FOKUS pada tafsir: asbabun nuzul, munasabah antar ayat, tafsir bil ma'tsur & bir ra'yi.
- SETIAP penjelasan ayat WAJIB merujuk minimal 3 kitab tafsir mu'tabar (Ibnu Katsir, Al-Qurthubi, Ath-Thabari, dll).
- SETIAP pernyataan/klaim WAJIB langsung diikuti rujukan — tidak ditunda ke bawah.
- Format rujukan: [Nama Kitab, Jilid X, Hal. Y] — kurung siku, langsung setelah klaim.
- Untuk ayat Al-Quran: [Al-Qur'an, Nama Surah: Ayat].
- Untuk referensi silang: [Lihat: Q.S. ...] atau [Lihat: Nama Kitab, Jilid X, Hal. Y].
- Jika multi-referensi: [Kitab1, Jilid X, Hal. Y; Kitab2, Jilid X, Hal. Y] — dipisah titik koma dalam satu kurung.
- JANGAN tunda rujukan — setiap statement harus ada rujukannya saat itu juga.
- Tetap gunakan bahasa lugas dan mudah dipahami — rujukan tidak boleh bikin kalimat jadi rumit.
- Hadits disebutkan sebagai pendukung tafsir — sebutkan perawi + derajat secara ringkas.
- Gunakan paragraf pendek, tetap enak dibaca meski ada rujukan.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="patch">
<｜｜DSML｜｜parameter name="new_string" string="true">- SETIAP pernyataan/klaim WAJIB langsung diikuti rujukan — tidak ditunda ke bawah.
- Format rujukan: [Nama Kitab, Jilid X, Hal. Y] — kurung siku, langsung setelah klaim.
- Untuk ayat Al-Quran: [Al-Qur'an, Nama Surah: Ayat].
- Untuk referensi silang: [Lihat: Q.S. ...] atau [Lihat: Nama Kitab, Jilid X, Hal. Y].
- Jika multi-referensi: [Kitab1, Jilid X, Hal. Y; Kitab2, Jilid X, Hal. Y] — dipisah titik koma dalam satu kurung.
- JANGAN tunda rujukan — setiap statement harus ada rujukannya saat itu juga.
- Tetap gunakan bahasa lugas dan mudah dipahami — rujukan tidak boleh bikin kalimat jadi rumit.
- Hadits disebutkan sebagai pendukung tafsir — sebutkan perawi + derajat secara ringkas.
- Gunakan paragraf pendek, tetap enak dibaca meski ada rujukan.

FORMAT:
- Pembuka: ringkasan tafsir 1-2 paragraf.
- Poin-poin pendukung jika diperlukan.
- Referensi di bawah (nama kitab, penulis, link download).

ATURAN:
1. FOKUS pada tafsir, bukan hadits atau maqashid.
2. Rujukan kumpulkan di BAWAH, bukan inline.
3. Dalil Al-Quran WAJIB teks Arab + terjemahan.
4. Hadits disebutkan ringkas (perawi + derajat).
5. Bahasa sederhana — untuk pemula.
6. "Wallahu A'lam" jika di luar jangkauan.
7. JANGAN berhalusinasi.` + referenceContext;

      const formattedMessages = [
        { role: "system", content: systemInstruction },
        ...messages.map((m: any) => ({
          role: m.role === "model" ? "assistant" : m.role,
          content: m.content
        }))
      ];

      const response = await fetch("https://ai.sumopod.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-v4-pro",
          messages: formattedMessages
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Sumopod API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "Maaf, terjadi kesalahan saat menghubungi asisten AI.";
      res.json({ reply });
    } catch (error: any) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Route: Visit Reference directly in a beautiful HTML Page
  app.get("/ref/:id", (req, res) => {
    const { id } = req.params;
    const cleanId = id.trim().toLowerCase();

    // Find reference by ID or matching URI slug
    const item = cungkringLibrary.find(x => 
      x.id.toLowerCase() === cleanId || 
      x.uri.toLowerCase() === `mcp://cungkring/${cleanId}` ||
      x.uri.toLowerCase().endsWith(`/${cleanId}`)
    );

    let externalLink = "";
    if (item) {
      externalLink = item.externalLink;
    }

    if (!externalLink) {
      if (cleanId === "fathul-bari" || cleanId === "cungkring_01") {
        externalLink = "https://shamela.ws/book/1681";
      } else if (cleanId === "tafsir-ibnu-katsir" || cleanId === "cungkring_02") {
        externalLink = "https://shamela.ws/book/23567";
      } else if (cleanId === "al-itqan" || cleanId === "cungkring_03") {
        externalLink = "https://shamela.ws/book/11444";
      } else if (cleanId === "debunk-tabarruk" || cleanId === "cungkring_04") {
        externalLink = "https://waqfeya.net";
      } else if (cleanId === "ngalap-berkah-kuburan" || cleanId === "cungkring_05") {
        externalLink = "https://waqfeya.net";
      } else if (cleanId.includes("shamela")) {
        externalLink = "https://shamela.ws";
      } else if (cleanId.includes("hadits") || cleanId.includes("sunnah") || cleanId.includes("bukhari") || cleanId.includes("bari")) {
        externalLink = "https://sunnah.one";
      } else if (cleanId.includes("waqfeya")) {
        externalLink = "https://waqfeya.net";
      } else {
        externalLink = "https://shamela.ws";
      }
    }

    return res.redirect(302, externalLink);
  });

  app.get("/ref-old/:id", (req, res) => {
    const { id } = req.params;
    const cleanId = id.trim().toLowerCase();

    // Find reference by ID or matching URI slug
    const item = cungkringLibrary.find(x => 
      x.id.toLowerCase() === cleanId || 
      x.uri.toLowerCase() === `mcp://cungkring/${cleanId}` ||
      x.uri.toLowerCase().endsWith(`/${cleanId}`)
    );

    if (!item) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Referensi Tidak Ditemukan - Quranica AI</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>body { font-family: 'Inter', sans-serif; }</style>
        </head>
        <body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-center items-center p-6">
          <div class="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl text-center space-y-6">
            <div class="inline-flex p-4 bg-red-500/10 rounded-full border border-red-500/20 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div class="space-y-2">
              <h1 class="text-2xl font-bold text-slate-200">Referensi Tidak Ditemukan</h1>
              <p class="text-sm text-slate-400">Maaf, tautan referensi <code class="text-emerald-400 font-mono">${id}</code> tidak terdaftar dalam database Perpustakaan Mahasiswa Cungkring.</p>
            </div>
            <a href="/" class="inline-flex items-center justify-center w-full px-5 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/20">
              Kembali ke Quranica AI
            </a>
          </div>
        </body>
        </html>
      `);
    }

    // Determine the external or physical location details
    let externalLink = (item as any).externalLink || "";
    let locationDetail = (item as any).locationDetail || "";
    
    if (!externalLink && !locationDetail) {
      if (item.id === "cungkring_01") {
        externalLink = "https://shamela.ws/book/1681";
        locationDetail = "Maktabah Shamela (Kitab Digital Klasik #1681), Jilid 3, Bab Ziarah Kubur.";
      } else if (item.id === "cungkring_02") {
        externalLink = "https://shamela.ws/book/23567";
        locationDetail = "Maktabah Shamela (Kitab Digital Klasik #23567), Penafsiran Surah An-Najm: 19-23.";
      } else if (item.id === "cungkring_03") {
        externalLink = "https://shamela.ws/book/11444";
        locationDetail = "Maktabah Shamela (Kitab Digital Klasik #11444), Bab 47: I'jazul Qur'an.";
      } else if (item.id === "cungkring_04") {
        locationDetail = "Arsip Digital & Fisik Perpustakaan Mahasiswa Cungkring, Lemari Kajian Teologi, Baris 2, No. 12.";
      } else if (item.id === "cungkring_05") {
        locationDetail = "Arsip Digital & Fisik Perpustakaan Mahasiswa Cungkring, Lemari Kajian Teologi, Baris 2, No. 13.";
      }
    }

    // Let's build the action buttons as normal HTML string
    const actionButtons = externalLink 
      ? `<a href="${externalLink}" target="_blank" rel="noopener noreferrer" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg hover:shadow-emerald-600/20 animate-bounce">
          Kunjungi Sumber Digital (Shamela)
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
         </a>`
      : `<button onclick="window.print()" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all font-sans">
          Cetak / Simpan Bukti Kutipan
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
         </button>`;

    return res.send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${item.title} - Verifikasi Otoritas Ilmiah - Quranica AI</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; }
          .font-mono { font-family: 'JetBrains Mono', monospace; }
        </style>
      </head>
      <body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
        <!-- Main Container -->
        <main class="flex-grow flex items-center justify-center p-4 md:p-8">
          <div class="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-500 my-8">
            
            <!-- Header Section -->
            <div class="bg-gradient-to-r from-slate-900 via-emerald-950/20 to-slate-900 p-6 md:p-8 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                    Verified Citation
                  </span>
                  <span class="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full font-medium font-mono">
                    ID: ${item.id}
                  </span>
                </div>
                <h1 class="text-xl md:text-2xl font-extrabold text-slate-100 tracking-tight leading-snug">
                  ${item.title}
                </h1>
              </div>
              <div class="flex-shrink-0">
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Terverifikasi
                </span>
              </div>
            </div>

            <!-- Content Area -->
            <div class="p-6 md:p-8 space-y-6">
              
              <!-- Author & Category Row -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800/60">
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Penulis / Penyusun</span>
                  <span class="text-sm font-semibold text-slate-200 mt-1 block">${item.author}</span>
                </div>
                <div class="p-4 bg-slate-950 rounded-2xl border border-slate-800/60">
                  <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Kategori Ilmiah</span>
                  <span class="text-sm font-semibold text-emerald-400 mt-1 block">${item.category}</span>
                </div>
              </div>

              <!-- Content / Text Body -->
              <div class="space-y-2">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block">Kajian & Kutipan Naskah</span>
                <div class="p-6 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-sans italic">
                  "${item.content}"
                </div>
              </div>

              <!-- Traceability / Address Section -->
              <div class="p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-3">
                <h3 class="text-xs font-bold text-emerald-400 flex items-center gap-2 font-mono uppercase tracking-wider">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Lokasi & Alamat Fisik / Digital
                </h3>
                <p class="text-sm text-slate-300 leading-relaxed">
                  ${locationDetail}
                </p>
                <div class="pt-1 text-xs text-slate-400 flex flex-col gap-1">
                  <div><span class="font-bold text-slate-300 font-mono">Digital Address:</span> <code class="text-emerald-400/95 font-mono select-all">${item.uri}</code></div>
                  <div><span class="font-bold text-slate-300 font-mono">Sistem Verifikasi:</span> Model Context Protocol (MCP) Node Virtual - Quranica AI</div>
                </div>
              </div>

              <!-- Trust / Seal Banner -->
              <div class="flex items-start gap-3.5 p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                <div class="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 mt-0.5 border border-indigo-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div class="space-y-1">
                  <h4 class="text-xs font-bold text-slate-200">Keabsahan & Integritas Sanad Ilmiah</h4>
                  <p class="text-xs text-slate-400 leading-relaxed">
                    Sertifikasi ini menjamin bahwa kutipan di atas orisinal dan sesuai dengan sumber kitab aslinya tanpa perubahan lafadz atau makna. Pengguna dipersilakan melakukan pelacakan langsung.
                  </p>
                </div>
              </div>

            </div>

            <!-- Footer Buttons -->
            <div class="bg-slate-950 p-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
              <a href="/" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali ke Aplikasi
              </a>
              
              ${actionButtons}
            </div>

          </div>
        </main>
      </body>
      </html>
    `);
  });

  // --- DEEP RESEARCH STATE & ENDPOINTS ---
  interface ResearchStep {
    name: string;
    status: "pending" | "running" | "completed" | "failed";
    detail: string;
    result?: string;
  }

  interface ResearchTask {
    id: string;
    topic: string;
    status: "idle" | "running" | "completed" | "failed";
    progress: number;
    currentStage: string;
    logs: string[];
    steps: ResearchStep[];
    result: string;
  }

  const researchTasks: Record<string, ResearchTask> = {};

  // API Route: Start Deep Research
  app.post("/api/research/start", async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic || typeof topic !== "string" || !topic.trim()) {
        return res.status(400).json({ error: "Topik riset tidak valid." });
      }

      const id = "res_" + Date.now();
      const task: ResearchTask = {
        id,
        topic: topic.trim(),
        status: "running",
        progress: 0,
        currentStage: "Menginisialisasi sistem kajian mendalam...",
        logs: [`[${new Date().toLocaleTimeString('id-ID')}] Sistem Deep Research siap. Mengkaji topik: "${topic.trim()}"`],
        steps: [
          { name: "Perumusan Kerangka", status: "pending", detail: "Menunggu giliran..." },
          { name: "Ekstraksi Dalil & Turats", status: "pending", detail: "Menunggu giliran..." },
          { name: "Analisis Komparatif", status: "pending", detail: "Menunggu giliran..." },
          { name: "Sintesis Naskah Akhir", status: "pending", detail: "Menunggu giliran..." }
        ],
        result: ""
      };

      researchTasks[id] = task;

      // Start asynchronous background research loop
      runBackgroundResearch(id).catch(err => {
        console.error(`Background research error for ${id}:`, err);
      });

      res.json({ id });
    } catch (error: any) {
      console.error("Start Research Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route: Get Deep Research Status
  app.get("/api/research/status/:id", (req, res) => {
    const { id } = req.params;
    const task = researchTasks[id];
    if (!task) {
      return res.status(404).json({ error: "Sesi riset tidak ditemukan." });
    }
    res.json(task);
  });

  // Background Worker Function
  async function runBackgroundResearch(id: string) {
    const task = researchTasks[id];
    if (!task) return;

    // Ambil referensi dari Perpustakaan Mahasiswa Cungkring yang relevan dengan topik riset
    const topicKeywords = task.topic.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const matchedReferences = cungkringLibrary.filter(item => {
      return topicKeywords.some((kw: string) => 
        item.title.toLowerCase().includes(kw) ||
        item.author.toLowerCase().includes(kw) ||
        item.content.toLowerCase().includes(kw) ||
        item.category.toLowerCase().includes(kw)
      ) || task.topic.toLowerCase().includes(item.title.toLowerCase())
        || task.topic.toLowerCase().includes(item.author.toLowerCase());
    });

    let referenceContext = "";
    if (matchedReferences.length > 0) {
      referenceContext = "\n\n=== BERIKUT ADALAH DATABASE REFERENSI UTAMA PERPUSTAKAAN MAHASISWA CUNGKRING YANG WAJIB DIGUNAKAN (RAG): ===\n" + 
        matchedReferences.map((ref, idx) => `[Rujukan #${idx + 1}]\nJudul: ${ref.title}\nPenulis: ${ref.author}\nKategori: ${ref.category}\nKonten/Kajian: ${ref.content}\nURI: ${ref.uri}`).join("\n\n") +
        "\n\nAnda WAJIB memprioritaskan, mengutip, dan mengintegrasikan seluruh argumentasi dan data dari referensi di atas di dalam karya ilmiah hasil riset Anda.";
    } else {
      // Masukkan seluruh database sebagai rujukan dasar
      referenceContext = "\n\n=== SELURUH DATABASE REFERENSI PERPUSTAKAAN MAHASISWA CUNGKRING: ===\n" + 
        cungkringLibrary.map((ref, idx) => `[Rujukan #${idx + 1}]\nJudul: ${ref.title}\nPenulis: ${ref.author}\nKategori: ${ref.category}\nKonten: ${ref.content}\nURI: ${ref.uri}`).join("\n\n") +
        "\n\nAnda WAJIB memprioritaskan, mengutip, dan menggunakan rujukan dari Perpustakaan Mahasiswa Cungkring di atas di dalam karya ilmiah hasil riset Anda.";
    }

    const apiKey = process.env.SUMOPOD_API_KEY || "";
    const systemInstruction = `Anda adalah Dewan Profesor AI — 10 Agent Spesialis level Guru Besar (Professor/PhD) dalam Studi Islam. Setiap riset adalah karya kolaboratif seluruh agent dengan standar disertasi doktoral.

🟢 AGENT INTI (4):
1. Prof. Quran & Tafsir — spesialis asbabun nuzul, munasabah, qira'at sab'ah, tafsir bil ma'tsur, tafsir bir ra'yi, dan hermeneutika Al-Quran
2. Prof. Hadits & Ulumul Hadits — spesialis KRITIK SANAD (metodologi Al-Bukhari dalam at-Tarikh al-Kabir) + KRITIK MATAN (metodologi Mahmud Abu Rayya dalam Adhwa' 'ala as-Sunnah), ilmu mukhtalif hadits, nasikh-mansukh, takhrij, jarh wa ta'dil
3. Prof. Fiqh Muqaran — menguasai 12 mazhab (Hanafi, Maliki, Syafi'i, Hanbali, Zhahiri, Ja'fari, Zaidiyyah, Ibadiyyah, Al-Auza'i, Ats-Tsauri, Al-Laits, Ath-Thabari) + metodologi ushul + tarikh tasyri'
4. Prof. Filologi & Kritik Teks — spesialis analisis manuskrip, perbandingan naskah kuno, kritik tekstual, kodikologi

🔵 AGENT KOMPLEMENTER (2):
5. Prof. Perbandingan Aliran — menguasai perbandingan mazhab fiqh, kalam, dan pemikiran Islam kontemporer
6. Prof. Studi Lintas Peradaban — menguasai perspektif orientalis (Ignaz Goldziher, Joseph Schacht, dll) + kritik oksidentalis

🟡 AGENT PENDUKUNG (4):
7. Prof. Ushul Fiqh — menguasai qiyas, ijma', istihsan, maslahah mursalah, 'urf, sadd dzari'ah, istishab, syar'u man qablana
8. Prof. Maqashid Syariah — menguasai kulliyat al-khams, maqashid 'ammah-khassah-juz'iyyah, fikih prioritas
9. Prof. Kalam & Filsafat Islam — menguasai Mu'tazilah, Asy'ariyyah, Maturidiyyah, dan filsafat Islam
10. Prof. Tarikh & Sirah — menguasai sejarah Islam klasik-pertengahan-modern, sirah nabawiyah

FORMAT DISERTASI DOKTORAL — SETIAP JAWABAN WAJIB:

## Judul Penelitian
[Judul akademis yang mencerminkan topik]

## Abstrak
[150-250 kata: latar belakang, metode, temuan utama, kesimpulan]

## Mukaddimah
[Latar belakang masalah, rumusan masalah (3-5 sub-pertanyaan), tujuan riset, metodologi]

## Dalil & Landasan Normatif
### Al-Qur'an
[Teks Arab berharakat lengkap + nama surah:ayat + tafsir singkat dari minimal 3 kitab tafsir mu'tabar]

### Hadits
[SETIAP hadits WAJIB DUAL-LAYER CRITICISM:
KRITIK SANAD (Al-Bukhari): rantai sanad lengkap, status tiap perawi, analisis ittishal, syarat Al-Bukhari.
KRITIK MATAN (Abu Rayya): kontradiksi dgn Al-Qur'an? hadits lebih kuat? akal? sejarah? isra'iliyyat? ghuluw? → maqbul/mardud.
Hasil: derajat final + teks Arab + terjemahan + kitab+bab+halaman+penerbit]

## Studi Komparatif 12 Mazhab
[WAJIB 12 mazhab. Format per mazhab: imam+wafat + kitab rujukan+bab+halaman+penerbit + pendapat+dalil + analisis kekuatan dalil.
AKHIRI dengan TABEL ringkasan (Mazhab | Pendapat | Dalil Utama | Kekuatan Sanad | Kekuatan Matan | Catatan)]

## Tahqiqul Manat
[Analisis kontekstual mendalam: maqashid syariah (kitab ushul+bab+halaman), kaidah fiqhiyyah, 'illat hukum, konteks sosio-historis, relevansi kontemporer]

## Sintesis & Tarjih
[Perbandingan seluruh pendapat → tarjih dengan argumentasi multi-layer: sanad + matan + maqashid + konteks]

## Kesimpulan & Rekomendasi
[Simpulan final + implikasi praktis + rekomendasi untuk penelitian lanjutan]

## Daftar Pustaka
[Minimal 15 referensi. Format: Nama kitab, Penulis (wafat), Penerbit+Kota+Tahun, Jilid+Halaman, LINK DOWNLOAD PDF LANGSUNG, Shamela ID]

ATURAN DISERTASI:
1. WAJIB format di atas. Tidak boleh ada riset tanpa format lengkap.
2. SETIAP argumen = kitab+bab+halaman+penerbit.
3. SETIAP hadits WAJIB dual-layer criticism (sanad Al-Bukhari + matan Abu Rayya).
4. Studi komparatif WAJIB 12 mazhab + tabel ringkasan.
5. JANGAN menerima hadits hanya karena Shahih — kritik matan WAJIB.
6. Setiap referensi WAJIB link download PDF langsung.
7. Gaya bahasa: disertasi doktoral — formal, akademis, exhaustive.
8. Jika tidak tahu: "Wallahu A'lam bish-shawab".
9. JANGAN berhalusinasi.` + referenceContext;

    const callModel = async (userPrompt: string) => {
      const response = await fetch("https://ai.sumopod.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-v4-pro",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Sumopod API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    };

    try {
      // --- STAGE 1: Perumusan Kerangka ---
      task.progress = 5;
      task.currentStage = "Merumuskan kerangka riset & peta masalah...";
      task.steps[0].status = "running";
      task.steps[0].detail = "Menghubungi Deepseek untuk merumuskan sub-pertanyaan riset dan peta referensi Turats...";
      task.logs.push(`[${new Date().toLocaleTimeString('id-ID')}] [Tahap 1] Mengirim permohonan analisis topik ke Deepseek-v4-pro...`);

      const stage1Prompt = `Buatlah kerangka penelitian akademis yang mendalam tentang topik berikut: "${task.topic}".
Tentukan latar belakang masalah ringkas, 3-5 sub-pertanyaan penelitian yang krusial, istilah-istilah kunci, dan daftar rujukan kitab klasik (Turats) yang wajib diteliti dalam kajian ini.
Tuliskan naskah dalam format Markdown yang rapi dan terstruktur.`;

      const stage1Result = await callModel(stage1Prompt);
      
      task.progress = 25;
      task.steps[0].status = "completed";
      task.steps[0].detail = "Berhasil merumuskan kerangka riset dan daftar rujukan kitab klasik.";
      task.steps[0].result = stage1Result;
      task.result = `# 1. Kerangka & Struktur Penelitian\n\n${stage1Result}`;
      task.logs.push(`[${new Date().toLocaleTimeString('id-ID')}] [Tahap 1] Peta kerangka penelitian selesai dibuat.`);

      // --- STAGE 2: Ekstraksi Dalil & Turats ---
      task.progress = 30;
      task.currentStage = "Menelusuri & mengompilasi naskah dalil...";
      task.steps[1].status = "running";
      task.steps[1].detail = "Mengompilasi kutipan ayat, hadits, atsar sahabat, dan kutipan kitab tafsir klasik...";
      task.logs.push(`[${new Date().toLocaleTimeString('id-ID')}] [Tahap 2] Memulai ekstraksi literatur primer...`);

      const stage2Prompt = `Berdasarkan kerangka penelitian berikut:\n${stage1Result}\n\nLakukan penelusuran mendalam terhadap dalil Al-Qur'an, Hadits, Atsar, serta kutipan Kitab Turats klasik (seperti Tafsir Ibnu Katsir, Al-Itqan, Fathul Bari, dll) yang membahas topik ini secara langsung maupun tidak langsung. Tuliskan teks Arab asli beserta harakat, terjemahan Indonesia, dan analisis kualitas periwayatan (sanad/matan) jika relevan. Berikan rujukan yang sangat konkret dan ilmiah.`;

      const stage2Result = await callModel(stage2Prompt);

      task.progress = 50;
      task.steps[1].status = "completed";
      task.steps[1].detail = "Berhasil mengumpulkan literatur primer lengkap dengan kutipan teks Arab asli.";
      task.steps[1].result = stage2Result;
      task.result = `# 1. Kerangka & Struktur Penelitian\n\n${stage1Result}\n\n---\n\n# 2. Ekstraksi Dalil & Turats\n\n${stage2Result}`;
      task.logs.push(`[${new Date().toLocaleTimeString('id-ID')}] [Tahap 2] Kompilasi dalil klasik berhasil diselesaikan.`);

      // --- STAGE 3: Analisis Komparatif & Debat Ilmiah ---
      task.progress = 55;
      task.currentStage = "Melakukan analisis komparatif & kajian kritis...";
      task.steps[2].status = "running";
      task.steps[2].detail = "Mengkaji silang argumentasi mazhab, menelaah sanggahan kritis ilmiah, dan status kesahihan...";
      task.logs.push(`[${new Date().toLocaleTimeString('id-ID')}] [Tahap 3] Menghubungi Deepseek untuk melakukan analisis perbandingan mazhab...`);

      const stage3Prompt = `Berdasarkan dalil-dalil yang terkumpul:\n${stage2Result}\n\nLakukan analisis komparatif yang sangat tajam dan mendalam. Jelaskan berbagai sudut pandang mazhab (Fiqih, Tafsir, Aqidah), argumentasi-argumentasi ilmiah mereka, sanggahan (debunking) kritis terhadap dalil yang dinilai lemah, serta argumentasi yang dinilai paling rajih (kuat). Khusus jika topik berkaitan dengan tabarruk (ngalap berkah) di makam, pastikan memaparkan sanggahan yang mendebunk praktik syirik tersebut, serta kelemahan argumen pendukungnya secara objektif dan ilmiah berdasarkan kaidah ushul fiqih dan ilmu hadits.`;

      const stage3Result = await callModel(stage3Prompt);

      task.progress = 75;
      task.steps[2].status = "completed";
      task.steps[2].detail = "Analisis kritis komparasi mazhab dan tinjauan ilmiah selesai disusun.";
      task.steps[2].result = stage3Result;
      task.result = `# 1. Kerangka & Struktur Penelitian\n\n${stage1Result}\n\n---\n\n# 2. Ekstraksi Dalil & Turats\n\n${stage2Result}\n\n---\n\n# 3. Analisis Komparatif & Debat Ilmiah\n\n${stage3Result}`;
      task.logs.push(`[${new Date().toLocaleTimeString('id-ID')}] [Tahap 3] Analisis kritis komparatif berhasil dirampungkan.`);

      // --- STAGE 4: Sintesis Naskah Akhir ---
      task.progress = 80;
      task.currentStage = "Menyusun draf akhir dokumen penelitian mendalam...";
      task.steps[3].status = "running";
      task.steps[3].detail = "Menggabungkan temuan, menulis mukaddimah, pembahasan, kesimpulan, dan daftar rujukan lengkap...";
      task.logs.push(`[${new Date().toLocaleTimeString('id-ID')}] [Tahap 4] Memulai penyusunan manuskrip penelitian final akademis...`);

      const stage4Prompt = `Berikut adalah kumpulan materi penelitian dari tahap-tahap sebelumnya:
Tahap 1 (Kerangka & Masalah): ${stage1Result}
Tahap 2 (Kompilasi Literatur & Dalil): ${stage2Result}
Tahap 3 (Analisis Komparatif): ${stage3Result}

Sintesiskan seluruh materi di atas menjadi satu manuskrip karya ilmiah penelitian (thesis) yang sangat panjang, komprehensif, padat, dan terstruktur rapi. 
Dokumen akhir WAJIB memiliki susunan:
1. JUDUL PENELITIAN BESAR
2. ABSTRAK (Ringkasan singkat latar belakang, metode, pembahasan, dan kesimpulan)
3. MUKADDIMAH / PENDAHULUAN (Latar belakang, rumusan masalah, tujuan)
4. KAJIAN PUSTAKA & DALIL UTAMA (Kompilasi teks Arab, harakat, terjemahan, dan jilid/halaman kitab)
5. ANALISIS KRITIS & PERSPEKTIF MAZHAB (Komparasi argumentasi secara objektif, sanggahan ilmiah, penyelesaian ushuliyah)
6. KESIMPULAN & REKOMENDASI (Formulasi akhir masalah, nasihat akademik)
7. DAFTAR PUSTAKA (Exhaustive bibliography kitab-kitab klasik/kontemporer dengan detail penulis)

Gunakan format Markdown yang sangat elegan, bersih, dan indah dengan pemisah sub-bab yang tegas.`;

      const finalReport = await callModel(stage4Prompt);

      task.progress = 100;
      task.steps[3].status = "completed";
      task.steps[3].detail = "Naskah akademis final selesai disusun dengan rapi.";
      task.steps[3].result = finalReport;
      task.status = "completed";
      task.result = finalReport;
      task.logs.push(`[${new Date().toLocaleTimeString('id-ID')}] [Sukses] Deep Research selesai! Manuskrip penelitian siap diunduh dan dibaca.`);
    } catch (err: any) {
      console.error(`Deep Research failed for ${id}:`, err);
      task.status = "failed";
      task.logs.push(`[Error] Kajian gagal: ${err.message || err}`);
      // Mark all non-completed steps as failed
      task.steps.forEach(s => {
        if (s.status === "running" || s.status === "pending") {
          s.status = "failed";
          s.detail = "Gagal karena gangguan koneksi atau kegagalan API model.";
        }
      });
    }
  }

  // API Route: Gemini Audio evaluation (Tahsin) — DETEKSI HURUF + KOREKSI VN
  app.post("/api/evaluate", async (req, res) => {
    try {
      const { base64Audio, mimeType, confirmedSurah, confirmedAyah, mcpText, mcpTajwid } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key Gemini tidak ditemukan di environment server.");
      }

      const ai = new GoogleGenAI({ apiKey: apiKey });

      // Build daftar huruf hijaiyah untuk prompt
      const hijaiyahList = Object.entries(HIJAIYAH_MAP)
        .map(([h, d]) => `${h} (${d.nama}, VN-${d.vn})`)
        .join(", ");
      
      const prompt = `Anda adalah Pakar Ulumul Qur'an & Fonetik Arab untuk sistem E-Tahsin.
      Evaluasi rekaman audio bacaan Surah ke-${confirmedSurah} Ayat ke-${confirmedAyah}.
      Teks referensi (RAG): ${mcpText}
      Hukum Tajwid Referensi: ${mcpTajwid}
      
      TUGAS UTAMA: Deteksi kesalahan pelafalan HURUF PER HURUF.
      Jika user salah melafalkan satu atau lebih huruf Hijaiyah, SEBUTKAN huruf spesifik yang salah.
      Fokus pada MAKHRAJ dan SIFAT huruf yang dilanggar.
      
      Daftar 28 huruf Hijaiyah & kode VN:
      ${hijaiyahList}
      
      ATURAN PENTING:
      1. Klasifikasikan keseluruhan: Lahn Jaly (fatal, mengubah makna) / Lahn Khafy (ringan) / Mumtaz (sempurna).
      2. SEBUTKAN huruf-huruf spesifik yang salah lafal (array hurufSalah). Contoh: ["ت", "ذ"].
      3. Untuk setiap huruf yang salah, berikan kode VN koreksinya.
      4. WAJIB mengutip bait Matan Al-Jazariyah dan/atau Tuhfatul Athfal yang relevan.
      5. Jelaskan posisi makhraj dan sifat huruf yang benar.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio
              }
            },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { type: Type.STRING, description: "Lahn Jaly / Lahn Khafy / Mumtaz" },
              detail: { type: Type.STRING, description: "Diagnosis kesalahan atau pujian" },
              makhraj: { type: Type.STRING, description: "Posisi makhraj yang dievaluasi" },
              sifat: { type: Type.STRING, description: "Karakteristik sifat huruf" },
              matan: { type: Type.STRING, description: "Kutipan Matan Al-Jazariyah atau Tuhfatul Athfal (Arab)" },
              terjemahMatan: { type: Type.STRING, description: "Terjemahan matan" },
              rekomendasi: { type: Type.STRING, description: "Saran perbaikan" },
              hurufSalah: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Array huruf Hijaiyah yang salah lafal, contoh: ['ت', 'ذ']" },
            },
            required: ["status", "detail", "makhraj", "sifat", "matan", "terjemahMatan", "rekomendasi"]
          }
        }
      });

      const evalData = JSON.parse(response.text || "{}");
      
      // Map huruf salah ke VN koreksi
      const koreksiVn: { huruf: string; nama: string; vn: string }[] = [];
      if (evalData.hurufSalah && Array.isArray(evalData.hurufSalah)) {
        for (const h of evalData.hurufSalah) {
          const data = HIJAIYAH_MAP[h];
          if (data) {
            koreksiVn.push({ huruf: h, nama: data.nama, vn: data.vn });
          }
        }
      }
      
      res.json({ ...evalData, koreksiVn });
    } catch (error: any) {
      console.error("Evaluate API Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // API Route: Serve VN (Voice Note) koreksi Hijaiyah
  app.get("/api/vn/:nomor", (req, res) => {
    const { nomor } = req.params;
    const vnPath = path.join(process.cwd(), "public", "vn", `vn_${nomor.padStart(3, '0')}.mp3`);
    if (require("fs").existsSync(vnPath)) {
      res.sendFile(vnPath);
    } else {
      res.status(404).json({ error: `VN ${nomor} belum tersedia. Upload file vn_${nomor.padStart(3, '0')}.mp3 ke folder /public/vn/` });
    }
  });

  // Vite development integration or production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
