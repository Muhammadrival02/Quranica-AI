/**
 * Quranica AI - Official API Client (TypeScript / JavaScript)
 * 
 * Client ini memudahkan integrasi dan cross-check data antara Quranica AI
 * dengan aplikasi eksternal (seperti Perpustakaan Mahasiswa Cungkring).
 */

export interface McpServer {
  id: string;
  name: string;
  url: string;
  type: "local-virtual" | "sse" | "http";
  status: "connected" | "disconnected";
  description: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface ResearchStep {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  detail: string;
  result?: string;
}

export interface ResearchTask {
  id: string;
  topic: string;
  status: "idle" | "running" | "completed" | "failed";
  progress: number;
  currentStage: string;
  logs: string[];
  steps: ResearchStep[];
  result: string;
}

export class QuranicaApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    // Jika berjalan di browser, default ke origin yang sama
    this.baseUrl = baseUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  }

  /**
   * --- 1. MODEL CONTEXT PROTOCOL (MCP) SERVICES ---
   */

  /**
   * Mengambil daftar server MCP yang terdaftar di sistem.
   */
  async getMcpServers(): Promise<McpServer[]> {
    const res = await fetch(`${this.baseUrl}/api/mcp/servers`);
    if (!res.ok) throw new Error("Gagal mengambil daftar server MCP.");
    return res.json();
  }

  /**
   * Mendaftarkan server MCP baru (misalnya Perpustakaan Mahasiswa Cungkring).
   */
  async registerMcpServer(name: string, url: string, description?: string): Promise<McpServer> {
    const res = await fetch(`${this.baseUrl}/api/mcp/servers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url, description })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal mendaftarkan server MCP.");
    }
    return res.json();
  }

  /**
   * Menghapus koneksi server MCP berdasarkan ID.
   */
  async deleteMcpServer(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${this.baseUrl}/api/mcp/servers/${id}`, {
      method: "DELETE"
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Gagal menghapus server MCP.");
    }
    return res.json();
  }

  /**
   * Melakukan handshake inisialisasi / koneksi ke server MCP.
   */
  async connectMcpServer(url: string, type: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/mcp/connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, type })
    });
    if (!res.ok) throw new Error("Handshake ke node MCP gagal.");
    return res.json();
  }

  /**
   * Mengeksekusi perintah/tool yang disediakan oleh server MCP tertentu.
   */
  async queryMcpTool(url: string, toolName: string, args: any, type: string): Promise<any> {
    const res = await fetch(`${this.baseUrl}/api/mcp/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, toolName, arguments: args, type })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Eksekusi tool MCP gagal.");
    }
    return res.json();
  }

  /**
   * --- 2. DEEP RESEARCH (KAJIAN MENDALAM) SERVICES ---
   */

  /**
   * Memulai riset atau kajian mendalam akademis baru berdasarkan topik.
   */
  async startDeepResearch(topic: string, userEmail?: string, userTier?: string): Promise<{ id: string }> {
    const res = await fetch(`${this.baseUrl}/api/research/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, userEmail, userTier })
    });
    if (!res.ok) {
      const ct = res.headers.get("content-type") || "";
      const errText = ct.includes("json") ? (await res.json()).error : await res.text().then(t => t.slice(0, 200));
      throw new Error(errText || "Gagal memulai Deep Research.");
    }
    return res.json();
  }

  /**
   * Memonitor status dan progres pengerjaan Deep Research secara real-time.
   */
  async getResearchStatus(id: string): Promise<ResearchTask> {
    const res = await fetch(`${this.baseUrl}/api/research/status/${id}`);
    if (!res.ok) throw new Error("Sesi riset tidak ditemukan.");
    return res.json();
  }

  /**
   * --- 3. CHAT & TANYA JAWAB (DEEPSEEK PRO) ---
   */

  /**
   * Mengirim pesan ke asisten AI (Deepseek-v4-pro) untuk kajian tafsir & hadits.
   */
  async sendChatMessage(messages: { role: string; content: string }[], mode: 'tafsir' | 'hadits' | 'maqashid' | 'genz' = 'tafsir'): Promise<{ reply: string }> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, mode })
    });
    if (!res.ok) {
      const ct = res.headers.get("content-type") || "";
      const errText = ct.includes("json") ? (await res.json()).error : await res.text().then(t => t.slice(0, 200));
      throw new Error(errText || "Gagal mengirim pesan chat.");
    }
    return res.json();
  }
}

export const apiClient = new QuranicaApiClient();
