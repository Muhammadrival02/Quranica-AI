import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Activity, BookOpen, Settings, Terminal as TerminalIcon, ShieldCheck, BookText, MessageSquare, Send, Search, FileDown, Database, Share2, Globe, RefreshCw, CheckCircle, AlertCircle, Trash2, Plus, HardDrive, Sparkles, ChevronRight, Cloud, UploadCloud, LogOut, FolderOpen, Link, Wand2, Users, UserPlus, Crown, Lock, Tag, QrCode, CreditCard, Clock, Smartphone, Monitor, User, Award, Printer, Pencil, Check } from 'lucide-react';
import { QURAN_SURAHS } from './surahs';
import { fetchQuranMcpData } from './services/quranMcpService';
import { apiClient } from './services/apiClient';
import { initAuth, googleSignIn, logout, getAccessToken } from './services/firebaseAuth';
import Markdown from 'react-markdown';
import HijaiyahPanel from './components/HijaiyahPanel';
import MakharijulHuruf from './components/MakharijulHuruf';

// --- KONFIGURASI ENVIRONMENT VARIABLES ---
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN || "hf_token_placeholder";
const QURAN_AUTH_BASIC = import.meta.env.VITE_QURAN_AUTH_BASIC || "cml2YWwgOnJ6ZTIwMDI="; 
const QURAN_TOKEN_URL = "https://oauth2.quran.foundation/oauth2/token";

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [surahs, setSurahs] = useState<any[]>([]);
  const [selectedSurah, setSelectedSurah] = useState("1");
  const [selectedAyah, setSelectedAyah] = useState("1");
  const [confirmedSurah, setConfirmedSurah] = useState("1");
  const [confirmedAyah, setConfirmedAyah] = useState("1");
  const [logs, setLogs] = useState<string[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [mcpData, setMcpData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingMcp, setIsFetchingMcp] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  
  // Smartphone Preview Mode — deteksi otomatis dari lebar layar
  const [isPhonePreview, setIsPhonePreview] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : true
  );

  useEffect(() => {
    const checkWidth = () => setIsPhonePreview(window.innerWidth < 768);
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  // Dark/Light Theme
  const [isDark, setIsDark] = useState(() => {
    try { return localStorage.getItem('quranica_theme') !== 'light'; } catch { return true; }
  });

  useEffect(() => {
    localStorage.setItem('quranica_theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  // Q&A, Research, & MCP Client State
  const [activeTab, setActiveTab] = useState<'tahsin' | 'qa' | 'research' | 'mcp' | 'admin' | 'register' | 'hijaiyah' | 'profile'>('tahsin');
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [qaMode, setQaMode] = useState<'tafsir' | 'master' | 'maqashid' | 'genz'>('tafsir');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Bottom bar constants (klik saja, tanpa swipe)
  const phoneTabs = [
    { id: 'tahsin', icon: Mic, label: 'Tahsin' },
    { id: 'qa', icon: MessageSquare, label: 'Tafsir' },
    { id: 'hijaiyah', icon: BookOpen, label: 'Huruf' },
    { id: 'research', icon: BookText, label: 'Riset' },
    { id: 'mcp', icon: Database, label: 'Pustaka' },
    { id: 'register', icon: Crown, label: 'Pro' },
    { id: 'profile', icon: User, label: 'Profil' },
  ] as const;

  // Helper: tampilkan nama tier yang user-friendly
  const getTierDisplay = (tier: string, cycle?: string | null) => {
    if (tier === "Berbayar") return cycle === "Tahunan" ? "Platinum" : "Premium";
    return "Reguler";
  };
  const getTierColor = (tier: string, cycle?: string | null) => {
    if (tier === "Berbayar") return cycle === "Tahunan" ? "from-purple-500 to-indigo-500" : "from-amber-500 to-amber-400";
    return "from-slate-600 to-slate-500";
  };

  // Riwayat Chat
  interface ChatHistory { id: string; title: string; messages: {role:string;content:string}[]; createdAt: string; }
  const [chatHistories, setChatHistories] = useState<ChatHistory[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getHistoryKey = () => userProfile?.uid ? `quranica_chats_${userProfile.uid}` : null;

  // Load chat history dari localStorage
  const loadChatHistories = () => {
    const key = getHistoryKey();
    if (!key) return;
    try {
      const data = localStorage.getItem(key);
      setChatHistories(data ? JSON.parse(data) : []);
    } catch { setChatHistories([]); }
  };

  // Save chat histories ke localStorage
  const saveChatHistories = (histories: ChatHistory[]) => {
    const key = getHistoryKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(histories));
    setChatHistories(histories);
  };

  // Simpan chat saat ini ke riwayat
  const saveCurrentChat = () => {
    if (chatMessages.length === 0) return;
    const key = getHistoryKey();
    if (!key) return;
    const firstUserMsg = chatMessages.find(m => m.role === 'user')?.content || "Percakapan";
    const title = firstUserMsg.slice(0, 50) + (firstUserMsg.length > 50 ? "..." : "");
    const now = new Date().toISOString();
    let histories = chatHistories;

    if (activeHistoryId) {
      // Update history yang sedang aktif
      histories = histories.map(h => h.id === activeHistoryId ? { ...h, title, messages: [...chatMessages], createdAt: now } : h);
    } else {
      // Buat history baru
      const newId = `ch_${Date.now()}`;
      histories = [{ id: newId, title, messages: [...chatMessages], createdAt: now }, ...histories].slice(0, 50);
      setActiveHistoryId(newId);
    }
    saveChatHistories(histories);
  };

  // Hapus history
  const deleteHistory = (id: string) => {
    const filtered = chatHistories.filter(h => h.id !== id);
    saveChatHistories(filtered);
    if (activeHistoryId === id) { setActiveHistoryId(null); setChatMessages([]); }
    setConfirmDeleteId(null);
  };

  // Muat history
  const loadHistory = (history: ChatHistory) => {
    setChatMessages(history.messages);
    setActiveHistoryId(history.id);
    setShowHistoryPanel(false);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Chat baru
  const newChat = () => {
    if (chatMessages.length > 0 && userProfile) {
      saveCurrentChat();
    }
    setChatMessages([]);
    setActiveHistoryId(null);
    setShowHistoryPanel(false);
  };

  // MCP Client State
  const [mcpServers, setMcpServers] = useState<any[]>([]);
  const [mcpServerNameInput, setMcpServerNameInput] = useState("");
  const [mcpServerUrlInput, setMcpServerUrlInput] = useState("");
  const [mcpServerDescInput, setMcpServerDescInput] = useState("");
  const [mcpSelectedServerId, setMcpSelectedServerId] = useState("cungkring_mcp");
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [mcpSelectedTool, setMcpSelectedTool] = useState("search_library");
  
  // MCP Tool Inputs
  const [mcpParamKeyword, setMcpParamKeyword] = useState("");
  const [mcpParamQuote, setMcpParamQuote] = useState("");
  
  const [mcpQueryResult, setMcpQueryResult] = useState<any>(null);
  const [mcpIsLoading, setMcpIsLoading] = useState(false);
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [mcpActiveHandshake, setMcpActiveHandshake] = useState<any>(null);
  const [apiSnippetLang, setApiSnippetLang] = useState<'ts' | 'python' | 'curl'>('ts');

  // Chat Integration Cross-check state
  const [mcpCrossCheckResult, setMcpCrossCheckResult] = useState<any>(null);
  const [mcpIsCrossChecking, setMcpIsCrossChecking] = useState(false);

  // Deep Research State
  const [researchTopic, setResearchTopic] = useState("");
  const [isResearchRunning, setIsResearchRunning] = useState(false);
  const [researchTaskId, setResearchTaskId] = useState<string | null>(null);
  const [researchProgress, setResearchProgress] = useState(0);
  const [researchCurrentStage, setResearchCurrentStage] = useState("");
  const [researchLogs, setResearchLogs] = useState<string[]>([]);
  const [researchSteps, setResearchSteps] = useState<any[]>([]);
  const [researchResult, setResearchResult] = useState("");
  const [researchError, setResearchError] = useState<string | null>(null);

  // Riwayat Deep Research
  interface ResearchHistory { id: string; topic: string; result: string; createdAt: string; }
  const [researchHistories, setResearchHistories] = useState<ResearchHistory[]>([]);
  const [showResearchHistory, setShowResearchHistory] = useState(false);

  const getResearchHistoryKey = () => userProfile?.uid ? `quranica_research_${userProfile.uid}` : null;

  const loadResearchHistories = () => {
    const key = getResearchHistoryKey();
    if (!key) return;
    try { const d = localStorage.getItem(key); setResearchHistories(d ? JSON.parse(d) : []); } catch { setResearchHistories([]); }
  };

  const saveResearchToHistory = () => {
    if (!researchResult || !researchTopic) return;
    const key = getResearchHistoryKey();
    if (!key) return;
    const h: ResearchHistory = { id: `rh_${Date.now()}`, topic: researchTopic, result: researchResult, createdAt: new Date().toISOString() };
    const updated = [h, ...researchHistories].slice(0, 30);
    localStorage.setItem(key, JSON.stringify(updated));
    setResearchHistories(updated);
  };

  const loadResearchFromHistory = (h: ResearchHistory) => {
    setResearchTopic(h.topic);
    setResearchResult(h.result);
    setResearchProgress(100);
    setResearchCurrentStage("Loaded from history");
    setShowResearchHistory(false);
  };

  const deleteResearchHistory = (id: string) => {
    const filtered = researchHistories.filter(h => h.id !== id);
    const key = getResearchHistoryKey();
    if (key) localStorage.setItem(key, JSON.stringify(filtered));
    setResearchHistories(filtered);
  };

  // Jaringan Perpustakaan & Sumber Rujukan State
  const [primaryLibraries, setPrimaryLibraries] = useState<any[]>([]);
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
  const [selectedLibCat, setSelectedLibCat] = useState("Semua");
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // AI Library Search State
  const [libraryMode, setLibraryMode] = useState<'browse' | 'ai-search' | 'drive-sync'>('browse');
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchResult, setAiSearchResult] = useState("");
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiMatchedCandidates, setAiMatchedCandidates] = useState<any[]>([]);

  // Google Drive Reference Sync State
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [syncFolderId, setSyncFolderId] = useState("1UNrVkFPq5LUfKr9cBvhf630YkDKMQZNn");
  const [syncFilesCount, setSyncFilesCount] = useState<number | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>("Siap Sinkronisasi");
  const [syncError, setSyncError] = useState<string | null>(null);

  // Saved Google Drive Folder IDs
  const [savedFolderIds, setSavedFolderIds] = useState<{ id: string; name: string }[]>(() => {
    const defaultFolders = [
      { id: "1UNrVkFPq5LUfKr9cBvhf630YkDKMQZNn", name: "Folder Utama Quranica" }
    ];
    try {
      const local = localStorage.getItem("quranica_gdrive_folders");
      return local ? JSON.parse(local) : defaultFolders;
    } catch (e) {
      return defaultFolders;
    }
  });
  const [newFolderNameInput, setNewFolderNameInput] = useState("");
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  // Google Drive Link URL Parser States
  const [gdriveLinkInput, setGdriveLinkInput] = useState("");
  const [isShowingLinkParser, setIsShowingLinkParser] = useState(false);
  const [parserFeedback, setParserFeedback] = useState<string | null>(null);

  // User Profile & Authentication State
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
  }
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginMode, setLoginMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPekerjaan, setLoginPekerjaan] = useState("");
  const [loginPhone, setLoginPhone] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginTierSelection, setLoginTierSelection] = useState<"Reguler" | "Berbayar_Bulanan" | "Berbayar_Tahunan">("Reguler");
  const [adminUsersList, setAdminUsersList] = useState<UserProfile[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [adminPanelFeedback, setAdminPanelFeedback] = useState<string | null>(null);
  const [adminPanelLoading, setAdminPanelLoading] = useState(false);

  // Edit nama di profil
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const handleSaveName = async () => {
    if (!userProfile || !editNameValue.trim()) return;
    try {
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userProfile.uid,
          email: userProfile.email,
          displayName: editNameValue.trim(),
          tier: userProfile.tier,
          billingCycle: userProfile.billingCycle,
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setUserProfile(updated);
        saveUserWithExpiry(updated);
        setIsEditingName(false);
        addLog(`[Profile] Nama berhasil diubah menjadi "${editNameValue.trim()}"`);
      }
    } catch (e: any) {
      addLog(`[Error] Gagal mengubah nama: ${e.message}`);
    }
  };

  // States for Registrasi & Berlangganan Menu Tab
  const [regSelectedPlan, setRegSelectedPlan] = useState<"Bulanan" | "Tahunan">("Bulanan");
  const [regPromoCode, setRegPromoCode] = useState("");
  const [regAppliedDiscount, setRegAppliedDiscount] = useState(0); // 10 means 10%
  const [regPromoFeedback, setRegPromoFeedback] = useState<string | null>(null);
  const [regPaymentMethod, setRegPaymentMethod] = useState<"QRIS" | "BCA" | "DANA">("QRIS");
  const [regPaymentStep, setRegPaymentStep] = useState<"select" | "processing" | "upload-proof" | "verifying" | "success">("select");
  const [regPaymentData, setRegPaymentData] = useState<any>(null); // pending payment result
  const [regProofImage, setRegProofImage] = useState<string | null>(null); // base64 bukti transfer
  const [regAiResult, setRegAiResult] = useState<any>(null); // hasil analisis AI
  const [regFileRef, setRegFileRef] = useState<HTMLInputElement | null>(null);
  const [regManualName, setRegManualName] = useState("");
  const [regManualEmail, setRegManualEmail] = useState("");
  const [regManualPekerjaan, setRegManualPekerjaan] = useState("");
  const [regManualPhone, setRegManualPhone] = useState("");
  const [regManualPassword, setRegManualPassword] = useState("");
  const [regErrorFeedback, setRegErrorFeedback] = useState<string | null>(null);

  // Auto-fill registration states if logged in
  useEffect(() => {
    if (userProfile) {
      if (!regManualName) setRegManualName(userProfile.displayName || "");
      if (!regManualEmail) setRegManualEmail(userProfile.email || "");
    }
  }, [userProfile]);

  const syncUserProfileWithBackend = async (
    user: any, 
    preferredTier?: "Reguler" | "Berbayar",
    preferredCycle?: "Bulanan" | "Tahunan" | null
  ) => {
    if (!user) {
      setUserProfile(null);
      return;
    }
    try {
      const storedTier = localStorage.getItem(`quranica_tier_${user.uid}`) as "Reguler" | "Berbayar" | null;
      const finalTier = preferredTier || user.tier || storedTier || "Reguler";

      const storedCycle = localStorage.getItem(`quranica_cycle_${user.uid}`) as "Bulanan" | "Tahunan" | null;
      const finalCycle = preferredCycle !== undefined
        ? preferredCycle
        : (finalTier === "Berbayar" ? (user.billingCycle || storedCycle || "Bulanan") : null);

      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split("@")[0],
          tier: finalTier,
          billingCycle: finalCycle,
          pekerjaan: user.pekerjaan || "",
          phone: user.phone || "",
          password: user.password || ""
        })
      });
      if (res.ok) {
        const profile: UserProfile = await res.json();
        setUserProfile(profile);
        saveUserWithExpiry(profile);
        localStorage.setItem(`quranica_tier_${user.uid}`, profile.tier);
        if (profile.billingCycle) {
          localStorage.setItem(`quranica_cycle_${user.uid}`, profile.billingCycle);
        }
        addLog(`[Profile] Sinkronisasi Berhasil. Peran: ${profile.role}, Jenis Akun: ${profile.tier} ${profile.billingCycle ? `(${profile.billingCycle})` : ''}`);
      } else {
        console.error("Failed to sync user profile with backend");
      }
    } catch (e) {
      console.error("Error syncing profile with backend:", e);
    }
  };

  const fetchUsersForAdmin = async () => {
    if (!userProfile || userProfile.role !== "Admin") return;
    setAdminPanelLoading(true);
    setAdminPanelFeedback(null);
    try {
      const res = await fetch(`/api/users?adminUid=${userProfile.uid}`);
      if (res.ok) {
        const data = await res.json();
        setAdminUsersList(data.users || []);
      } else {
        const data = await res.json();
        setAdminPanelFeedback(`Gagal mengambil daftar user: ${data.error}`);
      }
    } catch (e: any) {
      setAdminPanelFeedback(`Error: ${e.message}`);
    } finally {
      setAdminPanelLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !userProfile) return;
    setAdminPanelLoading(true);
    setAdminPanelFeedback(null);
    try {
      const res = await fetch("/api/users/add-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newAdminEmail.trim(),
          adminUid: userProfile.uid
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminPanelFeedback(`Sukses: ${data.message}`);
        setNewAdminEmail("");
        await fetchUsersForAdmin();
      } else {
        setAdminPanelFeedback(`Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setAdminPanelFeedback(`Error: ${err.message}`);
    } finally {
      setAdminPanelLoading(false);
    }
  };

  const handleDeleteUser = async (targetUid: string) => {
    if (!userProfile) return;
    if (targetUid === userProfile.uid) {
      alert("Anda tidak bisa menghapus akun Anda sendiri.");
      return;
    }
    if (!confirm("Apakah Anda yakin ingin menghapus user ini dari sistem?")) {
      return;
    }
    setAdminPanelLoading(true);
    setAdminPanelFeedback(null);
    try {
      const res = await fetch(`/api/users/${targetUid}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminUid: userProfile.uid
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminPanelFeedback("User berhasil dihapus.");
        await fetchUsersForAdmin();
      } else {
        setAdminPanelFeedback(`Gagal menghapus: ${data.error}`);
      }
    } catch (err: any) {
      setAdminPanelFeedback(`Error: ${err.message}`);
    } finally {
      setAdminPanelLoading(false);
    }
  };

  const handleToggleUserTier = async (targetUid: string, currentTier: "Reguler" | "Berbayar") => {
    if (!userProfile) return;
    const newTier = currentTier === "Reguler" ? "Berbayar" : "Reguler";
    let chosenCycle: "Bulanan" | "Tahunan" | null = null;
    
    if (newTier === "Berbayar") {
      const isTahunan = confirm("Pilih 'OK' untuk menetapkan Paket Platinum (1 Tahun), atau 'Cancel' untuk menetapkan Paket Premium (1 Bulan).");
      chosenCycle = isTahunan ? "Tahunan" : "Bulanan";
    }

    setAdminPanelLoading(true);
    try {
      const res = await fetch("/api/users/update-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: targetUid,
          tier: newTier,
          billingCycle: chosenCycle,
          adminUid: userProfile.uid
        })
      });
      if (res.ok) {
        await fetchUsersForAdmin();
      } else {
        const data = await res.json();
        setAdminPanelFeedback(`Gagal update tier: ${data.error}`);
      }
    } catch (err: any) {
      setAdminPanelFeedback(`Error: ${err.message}`);
    } finally {
      setAdminPanelLoading(false);
    }
  };

  const handleToggleUserRole = async (targetUid: string, currentRole: "Admin" | "User") => {
    if (!userProfile) return;
    if (targetUid === userProfile.uid) {
      alert("Anda tidak bisa mengubah peran Anda sendiri.");
      return;
    }
    const newRole = currentRole === "Admin" ? "User" : "Admin";
    if (!confirm(`Apakah Anda yakin ingin mengubah peran pengguna ini menjadi ${newRole}?`)) {
      return;
    }
    setAdminPanelLoading(true);
    try {
      const res = await fetch("/api/users/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: targetUid,
          role: newRole,
          adminUid: userProfile.uid
        })
      });
      if (res.ok) {
        await fetchUsersForAdmin();
        addLog(`[Profile] Berhasil memperbarui peran pengguna menjadi ${newRole}`);
      } else {
        const data = await res.json();
        setAdminPanelFeedback(`Gagal update peran: ${data.error}`);
      }
    } catch (err: any) {
      setAdminPanelFeedback(`Error: ${err.message}`);
    } finally {
      setAdminPanelLoading(false);
    }
  };

  const handleSelfTierUpgrade = async (newTier: "Reguler" | "Berbayar", billingCycle?: "Bulanan" | "Tahunan") => {
    if (!userProfile) return;
    try {
      const finalCycle = newTier === "Berbayar" ? (billingCycle || "Bulanan") : null;
      const res = await fetch("/api/users/update-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: userProfile.uid,
          tier: newTier,
          billingCycle: finalCycle
        })
      });
      if (res.ok) {
        setUserProfile(prev => prev ? { ...prev, tier: newTier, billingCycle: finalCycle } : null);
        localStorage.setItem(`quranica_tier_${userProfile.uid}`, newTier);
        if (finalCycle) {
          localStorage.setItem(`quranica_cycle_${userProfile.uid}`, finalCycle);
        }
        // Save back to stored custom user if persistent
        const storedUserStr = localStorage.getItem("quranica_current_user");
        if (storedUserStr) {
          const storedUser = JSON.parse(storedUserStr);
          storedUser.tier = newTier;
          storedUser.billingCycle = finalCycle;
          saveUserWithExpiry(storedUser);
        }
        addLog(`[Profile] Berhasil beralih ke Akun ${newTier === "Berbayar" ? `Berbayar (${finalCycle})` : "Reguler"}`);
      }
    } catch (err: any) {
      console.error("Error updating self tier:", err);
    }
  };

  // Synchronize savedFolderIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("quranica_gdrive_folders", JSON.stringify(savedFolderIds));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [savedFolderIds]);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const previousInputRef = useRef<string>("");

  const getDirectExternalLink = (href: string): string => {
    if (!href) return "";
    const cleanHref = href.trim();
    if (cleanHref.startsWith('/ref/')) {
      const id = cleanHref.replace('/ref/', '').trim().toLowerCase();
      
      // Explicit static mappings
      if (id === 'fathul-bari' || id === 'cungkring_01') return 'https://shamela.ws/book/1681';
      if (id === 'tafsir-ibnu-katsir' || id === 'cungkring_02') return 'https://shamela.ws/book/23567';
      if (id === 'al-itqan' || id === 'cungkring_03') return 'https://shamela.ws/book/11444';
      if (id === 'debunk-tabarruk' || id === 'cungkring_04') return 'https://waqfeya.net';
      if (id === 'ngalap-berkah-kuburan' || id === 'cungkring_05') return 'https://waqfeya.net';
      if (id === 'ref_shamela_web') return 'https://shamela.ws';
      if (id === 'ref_bahith_hadithi') return 'https://sunnah.one';
      if (id === 'ref_download_waqfeya') return 'https://waqfeya.net';
      if (id === 'ref_tele_ktbktb') return 'https://t.me/ktbktb';
      
      // Dynamic matching from primaryLibraries state if available
      if (primaryLibraries && primaryLibraries.length > 0) {
        const found = primaryLibraries.find(lib => 
          lib.id.toLowerCase() === id || 
          lib.uri?.toLowerCase().endsWith(`/${id}`)
        );
        if (found && found.externalLink) {
          return found.externalLink;
        }
      }
      
      // Category or name based fallbacks
      if (id.includes('shamela')) return 'https://shamela.ws';
      if (id.includes('hadits') || id.includes('sunnah') || id.includes('bukhari') || id.includes('bari')) return 'https://sunnah.one';
      if (id.includes('waqfeya')) return 'https://waqfeya.net';
      if (id.includes('tele') || id.includes('telegram')) return 'https://t.me/ktbktb';
      
      return 'https://shamela.ws';
    }
    return cleanHref;
  };

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // Helper: simpan user dengan expiry 30 hari
  const saveUserWithExpiry = (user: UserProfile) => {
    localStorage.setItem("quranica_current_user", JSON.stringify(user));
    localStorage.setItem("quranica_login_expiry", String(Date.now() + 30 * 24 * 60 * 60 * 1000));
  };
  const clearUserLogin = () => {
    localStorage.removeItem("quranica_current_user");
    localStorage.removeItem("quranica_login_expiry");
  };

  // 1. Inisialisasi: Auto-login (30 hari), Autentikasi Quran Foundation, Load Data, & MCP Servers
  useEffect(() => {
    // Auto-login: cek expiry 30 hari
    const storedUser = localStorage.getItem("quranica_current_user");
    const expiry = localStorage.getItem("quranica_login_expiry");
    if (storedUser && expiry && Number(expiry) > Date.now()) {
      try {
        setUserProfile(JSON.parse(storedUser));
        addLog("[Auth] Login otomatis — sesi masih aktif (30 hari).");
      } catch {}
    }

    const initApp = async () => {
      addLog("[Auth] Memulai handshake OAuth2 ke Quran Foundation...");
      try {
        // Simulasi fetch Token & Surah untuk keamanan client-side
        setTimeout(() => {
          addLog("[Auth] Access Token didapatkan. Mengambil metadata mushaf...");
          setSurahs(QURAN_SURAHS);
          addLog("[System] Data 114 Surah berhasil dimuat. Siap digunakan.");
        }, 1000);
      } catch (err) {
        addLog("[Error] Gagal menghubungi server otorisasi.");
      }
    };
    initApp();
    fetchMcpServers();
    fetchPrimaryLibraries();
  }, []);

  // Google Drive & Firebase Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
        addLog(`[Auth] Terkoneksi ke Google Drive: ${user.email}`);
        syncUserProfileWithBackend(user);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
        // Jangan hapus userProfile jika masih login via email (localStorage)
        if (!localStorage.getItem("quranica_current_user")) {
          setUserProfile(null);
        }
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // --- GOOGLE DRIVE SYNC HELPER FUNCTIONS ---
  const handleExtractFolderId = () => {
    setParserFeedback(null);
    const trimmed = gdriveLinkInput.trim();
    if (!trimmed) {
      setParserFeedback("Tautan tidak boleh kosong.");
      return;
    }

    // Try to match folder ID from Google Drive folder Link
    // Matches folders/<ID> or id=<ID>
    const folderRegex = /(?:folders\/|id=)([a-zA-Z0-9-_]{25,50})/i;
    // Matches file/d/<ID>
    const fileRegex = /\/file\/d\/([a-zA-Z0-9-_]{25,50})/i;

    const folderMatch = trimmed.match(folderRegex);
    if (folderMatch && folderMatch[1]) {
      const extractedId = folderMatch[1];
      setSyncFolderId(extractedId);
      setParserFeedback(`Berhasil mengekstrak ID Folder: ${extractedId}`);
      addLog(`[System] Berhasil mengurai ID Folder dari link: ${extractedId}`);
      setGdriveLinkInput("");
      return;
    }

    const fileMatch = trimmed.match(fileRegex);
    if (fileMatch && fileMatch[1]) {
      const extractedId = fileMatch[1];
      setSyncFolderId(extractedId);
      setParserFeedback(`Berhasil mengekstrak ID File: ${extractedId} (Catatan: Sinkronisasi folder memerlukan ID Folder, bukan ID File)`);
      addLog(`[System] Terdeteksi ID File dari link: ${extractedId}`);
      setGdriveLinkInput("");
      return;
    }

    // Check if it looks like a direct ID already
    if (/^[a-zA-Z0-9-_]{25,50}$/.test(trimmed)) {
      setSyncFolderId(trimmed);
      setParserFeedback(`Menggunakan teks langsung sebagai ID: ${trimmed}`);
      setGdriveLinkInput("");
      return;
    }

    setParserFeedback("Format tautan tidak dikenali. Pastikan Anda memasukkan URL folder Google Drive yang valid.");
  };

  const handleDriveSync = async () => {
    if (!userProfile || userProfile.tier !== "Berbayar") {
      setSyncError("Fitur sinkronisasi Google Drive hanya tersedia untuk pengguna Premium. Silakan upgrade di menu langganan.");
      return;
    }
    if (!googleToken) {
      setSyncStatus("Mengautentikasi...");
      try {
        const authResult = await googleSignIn();
        if (authResult) {
          setGoogleUser(authResult.user);
          setGoogleToken(authResult.accessToken);
          addLog(`[Auth] Berhasil login Google: ${authResult.user.email}`);
          await syncUserProfileWithBackend(authResult.user);
          await fetchAndSyncDriveFiles(authResult.accessToken);
        } else {
          setSyncStatus("Gagal Autentikasi");
          setSyncError("Gagal mendapatkan akses token dari Google.");
        }
      } catch (err: any) {
        console.error("Authentication error:", err);
        setSyncStatus("Gagal Autentikasi");
        setSyncError(`Error: ${err.message || err}`);
      }
      return;
    }

    await fetchAndSyncDriveFiles(googleToken);
  };

  const fetchAndSyncDriveFiles = async (token: string) => {
    setIsSyncingDrive(true);
    setSyncError(null);
    setSyncStatus("Menghubungi Google Drive API...");
    addLog("[Google Drive] Memulai sinkronisasi pustaka rujukan utama...");

    try {
      const folderIdClean = syncFolderId.trim();
      if (!folderIdClean) {
        throw new Error("Folder ID Google Drive tidak boleh kosong.");
      }

      // 1. List files in the folder
      // Google Drive API query: in parents folder and not trashed
      const query = encodeURIComponent(`'${folderIdClean}' in parents and trashed = false`);
      const listUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,description,webViewLink)&pageSize=100`;

      const response = await fetch(listUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gagal membaca file dari folder (${response.status}): ${errText}`);
      }

      const listData = await response.json();
      const filesList = listData.files || [];

      if (filesList.length === 0) {
        setSyncStatus("Sinkronisasi Selesai (Folder Kosong)");
        setSyncFilesCount(0);
        addLog("[Google Drive] Selesai. Tidak ada file rujukan ditemukan di folder tersebut.");
        setIsSyncingDrive(false);
        return;
      }

      setSyncStatus(`Menemukan ${filesList.length} file. Mulai mengekstrak isi dokumen rujukan...`);
      addLog(`[Google Drive] Menemukan ${filesList.length} file di folder.`);

      const syncedFiles: any[] = [];
      for (let i = 0; i < filesList.length; i++) {
        const file = filesList[i];
        setSyncStatus(`Mengunduh (${i + 1}/${filesList.length}): ${file.name}...`);
        addLog(`[Google Drive] Mengunduh: ${file.name}`);

        let content = "";
        try {
          if (file.mimeType === "application/vnd.google-apps.document") {
            // Google Doc: Export as plain text
            const exportUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=text/plain`;
            const expRes = await fetch(exportUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (expRes.ok) {
              content = await expRes.text();
            } else {
              content = `[Google Doc: ${file.name}] Gagal mengekstrak teks. Gunakan link di bawah untuk membaca langsung di browser.\n\nTautan Resmi: ${file.webViewLink}`;
            }
          } else if (file.mimeType.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
            // Text or Markdown file: Alt=media download
            const mediaUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
            const medRes = await fetch(mediaUrl, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (medRes.ok) {
              content = await medRes.text();
            } else {
              content = `[File: ${file.name}] Gagal mengunduh isi dokumen.`;
            }
          } else {
            // Other formats (PDFs, presentations, etc.): Use descriptions/metadata
            content = `[File Rujukan: ${file.name}]\nFormat: ${file.mimeType}\nDeskripsi: ${file.description || "Tidak ada rincian tambahan dari Google Drive."}\n\nTautan Resmi: ${file.webViewLink}`;
          }
        } catch (fileErr: any) {
          console.error(`Error loading file content for ${file.name}:`, fileErr);
          content = `[File Rujukan: ${file.name}] Gagal mengekstrak konten secara otomatis.\n\nTautan Resmi: ${file.webViewLink}`;
        }

        syncedFiles.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          webViewLink: file.webViewLink,
          content: content
        });
      }

      setSyncStatus("Mengintegrasikan berkas dengan asisten Quranica AI...");
      addLog("[Google Drive] Mengirimkan data rujukan ke database pusat...");

      // Send to server
      const syncRes = await fetch("/api/library/sync-drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ files: syncedFiles })
      });

      if (!syncRes.ok) {
        throw new Error(`Gagal mendaftarkan referensi di server: ${await syncRes.text()}`);
      }

      const syncResult = await syncRes.json();
      setSyncStatus(`Sinkronisasi Berhasil! ${syncResult.count} dokumen rujukan aktif sebagai referensi utama.`);
      setSyncFilesCount(syncResult.count);
      addLog(`[System] Google Drive sukses sinkron! ${syncResult.count} kitab/dokumen kini menjadi referensi utama.`);
      
      // Reload library to update UI
      fetchPrimaryLibraries();
    } catch (err: any) {
      console.error("Drive sync error:", err);
      setSyncStatus("Sinkronisasi Gagal");
      setSyncError(err.message || "Terjadi kesalahan yang tidak terduga.");
      addLog(`[Error] Google Drive Sync gagal: ${err.message}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleDriveLogout = async () => {
    try {
      await logout();
      setGoogleUser(null);
      setGoogleToken(null);
      setSyncFilesCount(null);
      setSyncStatus("Siap Sinkronisasi");
      addLog("[Auth] Keluar dari Google Drive.");
    } catch (err: any) {
      console.error("Logout error:", err);
    }
  };

  // --- MCP CLIENT HELPER FUNCTIONS ---
  const fetchPrimaryLibraries = async () => {
    try {
      const res = await fetch("/api/library");
      if (res.ok) {
        const data = await res.json();
        setPrimaryLibraries(data.library || []);
      }
    } catch (err) {
      console.error("Error fetching primary libraries:", err);
    }
  };

  const fetchMcpServers = async () => {
    try {
      const servers = await apiClient.getMcpServers();
      setMcpServers(servers);
      
      // Auto-connect to Cungkring MCP if available
      const cungkring = servers.find((s: any) => s.id === "cungkring_mcp");
      if (cungkring) {
        handleConnectMcpServer(cungkring);
      }
    } catch (err: any) {
      console.error("Error fetching MCP servers:", err);
      setMcpError(err.message || "Gagal memuat server MCP.");
    }
  };

  const handleConnectMcpServer = async (server: any) => {
    setMcpIsLoading(true);
    setMcpError(null);
    try {
      const data = await apiClient.connectMcpServer(server.url, server.type);
      setMcpActiveHandshake(data);
      if (data.tools) {
        setMcpTools(data.tools);
        // Default to first tool if available
        if (data.tools.length > 0) {
          setMcpSelectedTool(data.tools[0].name);
        }
      }
    } catch (err: any) {
      console.error("MCP Handshake error:", err);
      setMcpError(err.message || "Gagal melakukan handshake ke server MCP.");
    } finally {
      setMcpIsLoading(false);
    }
  };

  const handleQueryMcpTool = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setMcpIsLoading(true);
    setMcpError(null);
    setMcpQueryResult(null);

    const targetServer = mcpServers.find(s => s.id === mcpSelectedServerId);
    if (!targetServer) {
      setMcpError("Server tidak ditemukan.");
      setMcpIsLoading(false);
      return;
    }

    const toolArgs: any = {};
    if (mcpSelectedTool === "search_library") {
      toolArgs.keyword = mcpParamKeyword;
    } else if (mcpSelectedTool === "verify_reference") {
      toolArgs.quote = mcpParamQuote;
    }

    try {
      const data = await apiClient.queryMcpTool(
        targetServer.url,
        mcpSelectedTool,
        toolArgs,
        targetServer.type
      );

      if (data.content && data.content[0]) {
        try {
          const parsed = JSON.parse(data.content[0].text);
          setMcpQueryResult(parsed);
        } catch {
          setMcpQueryResult({ text: data.content[0].text });
        }
      } else {
        setMcpQueryResult(data);
      }
    } catch (err: any) {
      console.error("MCP Query Tool error:", err);
      setMcpError(err.message || "Gagal mengeksekusi perintah MCP.");
    } finally {
      setMcpIsLoading(false);
    }
  };

  const handleAddCustomMcpServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mcpServerNameInput.trim() || !mcpServerUrlInput.trim()) return;

    setMcpIsLoading(true);
    setMcpError(null);
    try {
      await apiClient.registerMcpServer(
        mcpServerNameInput.trim(),
        mcpServerUrlInput.trim(),
        mcpServerDescInput.trim()
      );

      setMcpServerNameInput("");
      setMcpServerUrlInput("");
      setMcpServerDescInput("");
      
      await fetchMcpServers();
    } catch (err: any) {
      console.error("Add MCP server error:", err);
      setMcpError(err.message || "Gagal menambahkan server MCP.");
    } finally {
      setMcpIsLoading(false);
    }
  };

  const handleDeleteMcpServer = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus koneksi server MCP ini?")) return;
    setMcpIsLoading(true);
    setMcpError(null);
    try {
      await apiClient.deleteMcpServer(id);
      if (mcpSelectedServerId === id) {
        setMcpSelectedServerId("cungkring_mcp");
      }
      await fetchMcpServers();
    } catch (err: any) {
      console.error("Delete MCP server error:", err);
      setMcpError(err.message || "Gagal menghapus server MCP.");
    } finally {
      setMcpIsLoading(false);
    }
  };

  const handleCrossCheckMcp = async (textToVerify: string) => {
    setMcpIsCrossChecking(true);
    setMcpCrossCheckResult(null);

    // Auto-extract primary terms (e.g. Tabarruk, Malik ad-Dar, Fathul Bari, Kubur, dll)
    let keyword = "tabarruk";
    if (textToVerify.toLowerCase().includes("malik ad-dar")) {
      keyword = "malik ad-dar";
    } else if (textToVerify.toLowerCase().includes("fathul bari")) {
      keyword = "fathul bari";
    } else if (textToVerify.toLowerCase().includes("ibnu katsir")) {
      keyword = "ibnu katsir";
    } else if (textToVerify.toLowerCase().includes("al-itqan")) {
      keyword = "al-itqan";
    }

    try {
      const data = await apiClient.queryMcpTool(
        "http://localhost:3000/api/mcp/perpustakaan-cungkring",
        "verify_reference",
        { quote: keyword },
        "local-virtual"
      );

      if (data.content && data.content[0]) {
        const parsed = JSON.parse(data.content[0].text);
        setMcpCrossCheckResult(parsed);
      }
    } catch (err) {
      console.error("Cross-check error:", err);
    } finally {
      setMcpIsCrossChecking(false);
    }
  };

  // Download AI response as PDF via browser print
  const downloadChatAsPDF = (content: string, index: number) => {
    // Convert markdown to basic HTML
    let html = content
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^\- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    html = '<p>' + html + '</p>';

    const title = content.slice(0, 60).replace(/\n/g, ' ').replace(/[#*]/g, '') + '...';
    const now = new Date().toLocaleString('id-ID');

    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
      alert('Mohon izinkan pop-up untuk mendownload PDF.');
      return;
    }

    printWin.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>Quranica AI - Hasil Tanya Jawab</title>
        <style>
          @page { margin: 2cm; size: A4; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            font-size: 12pt; line-height: 1.8; color: #1a1a2e; 
            padding: 2rem; max-width: 800px; margin: 0 auto;
          }
          .header { 
            text-align: center; border-bottom: 3px double #0d9488; 
            padding-bottom: 1.5rem; margin-bottom: 2rem; 
          }
          .header h1 { font-size: 18pt; color: #0d9488; margin-bottom: 0.3rem; }
          .header .meta { font-size: 9pt; color: #64748b; }
          h1 { font-size: 16pt; color: #0f172a; margin: 1.5rem 0 0.8rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3rem; }
          h2 { font-size: 14pt; color: #1e293b; margin: 1.2rem 0 0.6rem; }
          h3 { font-size: 12pt; color: #0d9488; margin: 1rem 0 0.5rem; }
          p { margin: 0.5rem 0; }
          ul, ol { margin: 0.5rem 0; padding-left: 2rem; }
          li { margin: 0.2rem 0; }
          strong { color: #0d9488; }
          code { background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 10pt; font-family: 'Courier New', monospace; }
          .footer { 
            margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; 
            text-align: center; font-size: 9pt; color: #94a3b8; 
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header no-print">
          <button onclick="window.print()" style="
            padding: 10px 24px; font-size: 14px; background: #0d9488; color: white; 
            border: none; border-radius: 8px; cursor: pointer; font-weight: bold;
            margin-bottom: 1rem;
          ">🖨️ Cetak / Save as PDF</button>
          <p style="font-size:10pt;color:#64748b;">Klik tombol di atas, lalu pilih <strong>"Save as PDF"</strong> sebagai printer tujuan.</p>
        </div>

        <div class="header">
          <h1>📘 Quranica AI</h1>
          <p style="font-size:11pt;font-weight:600;">Hasil Tanya Jawab Ilmiah</p>
          <p class="meta">Dicetak: ${now} | Sumber: Quranica AI + Perpustakaan Mahasiswa Cungkring</p>
        </div>

        <div style="text-align:left;direction:ltr;">
          ${html}
        </div>

        <div class="footer">
          <p><strong>Quranica AI</strong> — Platform E-Tahsin & Tafsir Al-Quran Berbasis AI</p>
          <p>Diberdayakan oleh Perpustakaan Mahasiswa Cungkring & Jaringan Referensi Islam Global</p>
          <p>github.com/Muhammadrival02/Quranica-AI</p>
        </div>
      </body>
      </html>
    `);
    printWin.document.close();

    // Auto-trigger print after a short delay
    setTimeout(() => {
      printWin.print();
    }, 600);
  };

  const handleMcpLinkClick = (href: string) => {
    try {
      const slug = href.replace("mcp://cungkring/", "");
      const keyword = slug.replace(/-/g, " ");

      setActiveTab('mcp');
      setLibrarySearchQuery(keyword);
      setSelectedLibCat("Semua");
    } catch (e) {
      console.error("Error handling MCP link click:", e);
    }
  };

  const handleLibraryAiSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiSearchQuery.trim()) return;

    setAiSearchLoading(true);
    setAiSearchError(null);
    setAiSearchResult("");
    setAiMatchedCandidates([]);

    try {
      const response = await fetch("/api/library/ai-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: aiSearchQuery }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Server returned error status ${response.status}`);
      }

      setAiSearchResult(data.result);
      setAiMatchedCandidates(data.matchedCandidates || []);
    } catch (err: any) {
      console.error("AI Library Search Error:", err);
      setAiSearchError(err.message || "Gagal melakukan pencarian dengan AI.");
    } finally {
      setAiSearchLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // Auto-save chat ke riwayat setiap kali ada pesan baru (debounce)
  useEffect(() => {
    if (chatMessages.length === 0 || !userProfile) return;
    const timer = setTimeout(() => saveCurrentChat(), 2000);
    return () => clearTimeout(timer);
  }, [chatMessages]);

  // Load riwayat chat & research saat login
  useEffect(() => {
    loadChatHistories();
    loadResearchHistories();
  }, [userProfile?.uid]);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        
        const prefix = previousInputRef.current ? previousInputRef.current + " " : "";
        setChatInput(prefix + transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          alert("Akses mikrofon ditolak. Silakan izinkan akses mikrofon di pengaturan browser Anda.");
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Maaf, browser Anda tidak mendukung fitur Voice Recognition. Silakan gunakan Google Chrome, Edge, atau Safari versi terbaru.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      previousInputRef.current = chatInput.trim();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech recognition start error", e);
        setIsListening(false);
      }
    }
  };

  // Poll Deep Research status
  useEffect(() => {
    if (!researchTaskId || !isResearchRunning) return;

    const intervalId = setInterval(async () => {
      try {
        const data = await apiClient.getResearchStatus(researchTaskId);
        setResearchProgress(data.progress);
        setResearchCurrentStage(data.currentStage);
        setResearchLogs(data.logs);
        setResearchSteps(data.steps);
        setResearchResult(data.result);
        
        if (data.status === "completed") {
          setIsResearchRunning(false);
          clearInterval(intervalId);
          // Auto-save ke riwayat
          setTimeout(() => saveResearchToHistory(), 500);
        } else if (data.status === "failed") {
          setIsResearchRunning(false);
          setResearchError("Deep Research failed — model unavailable or timeout. Please try again.");
          clearInterval(intervalId);
        }
      } catch (err: any) {
        console.error("Error polling research:", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [researchTaskId, isResearchRunning]);

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchTopic.trim() || isResearchRunning) return;
    if (!userProfile || userProfile.tier !== "Berbayar") {
      setResearchError("Fitur Deep Research hanya tersedia untuk pengguna Premium. Silakan upgrade di menu langganan.");
      return;
    }

    setIsResearchRunning(true);
    setResearchProgress(5);
    setResearchCurrentStage("Menghubungi server untuk inisialisasi...");
    setResearchLogs(["Menginisialisasi agen riset..."]);
    setResearchSteps([
      { name: "Analisis Topik", status: "pending", detail: "Menunggu..." },
      { name: "Pencarian Referensi", status: "pending", detail: "Menunggu..." },
      { name: "Penyusunan Prompt", status: "pending", detail: "Menunggu..." },
      { name: "Koneksi ke Sumopod AI", status: "pending", detail: "Menunggu..." },
      { name: "Generasi Konten", status: "pending", detail: "Menunggu..." }
    ]);
    setResearchResult("");
    setResearchError(null);

    try {
      const data = await apiClient.startDeepResearch(researchTopic, userProfile?.email, userProfile?.tier);
      setResearchTaskId(data.id);
    } catch (err: any) {
      console.error("Start research error:", err);
      setResearchError(err.message || "Gagal memulai deep research.");
      setIsResearchRunning(false);
    }
  };

  const downloadResearchResult = () => {
    if (!researchResult) return;
    const blob = new Blob([researchResult], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Kajian_Mendalam_${researchTopic.trim().replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmSelection = async () => {
    setConfirmedSurah(selectedSurah);
    setConfirmedAyah(selectedAyah);
    const surahName = surahs.find(s => s.number.toString() === selectedSurah)?.englishName || "";
    addLog(`[System] Target diatur ke Surah ${surahName} (${selectedSurah}), Ayat ${selectedAyah}.`);
    
    setIsFetchingMcp(true);
    setMcpData(null);
    setEvaluation(null);
    try {
      addLog("[MCP] Menghubungi https://mcp.quran.ai/ untuk data RAG...");
      const mcpResult = await fetchQuranMcpData(selectedSurah, selectedAyah);
      setMcpData(mcpResult);
      addLog("[MCP] Data RAG berhasil ditarik.");
    } catch (err: any) {
      addLog(`[Error] Gagal menarik data RAG: ${err.message}`);
    } finally {
      setIsFetchingMcp(false);
    }
  };

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`].slice(-8));
  };

  // 2. Audio Capture (Tier 0: Noise Gate & Format Lintas Perangkat)
  const startRecording = async () => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser Anda tidak mendukung fitur rekaman suara di halaman ini.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true } });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      mediaRecorder.current = new MediaRecorder(stream, { mimeType });
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
      mediaRecorder.current.onstop = processTabayyunPipeline;
      
      mediaRecorder.current.start();
      setIsRecording(true);
      setEvaluation(null);
      addLog(`[Tier 0] Mikrofon aktif. Merekam Surah ${confirmedSurah}:${confirmedAyah}...`);
    } catch (err: any) {
      console.error("Microphone error:", err);
      setMicError(`Browser Anda memblokir popup izin mikrofon secara otomatis. Anda harus mengizinkannya secara manual melalui pengaturan browser (ikon gembok di sebelah alamat web).`);
      addLog(`[Error] Akses mikrofon gagal: ${err.message || 'Ditolak oleh browser'}.`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    setIsRecording(false);
    setIsProcessing(true);
  };

  // 3. Multi-Tier Tabayyun Pipeline
  const processTabayyunPipeline = async () => {
    // Stop all audio tracks to release microphone after recording stops
    if (mediaRecorder.current && mediaRecorder.current.stream) {
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }

    if (!mcpData) {
      addLog("[Error] Data RAG belum tersedia. Silakan tekan OK terlebih dahulu.");
      setIsProcessing(false);
      return;
    }

    if (audioChunks.current.length === 0) {
      addLog("[Error] Rekaman audio kosong. Silakan coba lagi.");
      setIsProcessing(false);
      return;
    }

    const mimeType = mediaRecorder.current?.mimeType || 'audio/webm';
    const audioBlob = new Blob(audioChunks.current, { type: mimeType });
    
    setIsProcessing(true);
    addLog("[Tier 1] Mengirim audio ke pipeline...");
    
    try {
      // 2. Convert Audio to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          if (!base64Audio) {
            throw new Error("Gagal memproses rekaman audio (kosong).");
          }
          const cleanMimeType = mimeType.split(';')[0]; // e.g. audio/webm

          // 3. LLM Evaluation via Server-side Gemini Proxy
          addLog(`[Tier 3] Menganalisis akustik via server-side Gemini (${cleanMimeType})...`);
          
          const response = await fetch("/api/evaluate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              base64Audio,
              mimeType: cleanMimeType,
              confirmedSurah,
              confirmedAyah,
              mcpText: mcpData.verifiedText,
              mcpTajwid: mcpData.tajwidRules
            })
          });

          if (!response.ok) {
            const ct = response.headers.get("content-type") || "";
            const errorText = ct.includes("json") ? (await response.json()).error : await response.text().then(t => t.slice(0, 200));
            throw new Error(errorText || `Server error (${response.status})`);
          }

          const evalData = await response.json();
          setEvaluation(evalData);
          addLog("[Tier 4] Evaluasi selesai. Pipeline Tabayyun ditutup.");

          // Track Al-Baqarah progress — if Mumtaz (no errors) and Surah 2
          if (evalData.status === 'Mumtaz' && confirmedSurah === '2' && userProfile) {
            const key = `quranica_baqarah_${userProfile.uid}`;
            try {
              const done: number[] = JSON.parse(localStorage.getItem(key) || '[]');
              const ayahNum = parseInt(confirmedAyah);
              if (!done.includes(ayahNum)) {
                done.push(ayahNum);
                localStorage.setItem(key, JSON.stringify(done));
                addLog(`[🏆] Ayat ${ayahNum} Al-Baqarah selesai tanpa kesalahan! (${done.length}/286)`);
                if (done.length >= 286) {
                  addLog(`[🎉] KHATAM AL-BAQARAH! Semua 286 ayat selesai tanpa kesalahan.`);
                }
              }
            } catch {}
          }
          
          // Automatically speak the result
          setTimeout(() => {
            if (!('speechSynthesis' in window)) return;
            window.speechSynthesis.cancel();
            const msg = new SpeechSynthesisUtterance();
            msg.text = `Hasil evaluasi: ${evalData.status || 'selesai'}. ${evalData.detail || evalData.summary || ''}`;
            msg.lang = 'id-ID';
            msg.rate = 0.9;
            window.speechSynthesis.speak(msg);
            addLog("[Tier 4] Mensintesis suara evaluasi secara otomatis...");
          }, 500);
          
        } catch (err: any) {
          console.error("Evaluation Error:", err);
          addLog(`[Error] Evaluasi gagal: ${err.message || 'Terjadi kesalahan pada server AI'}`);
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        addLog("[Error] Gagal membaca file audio.");
        setIsProcessing(false);
      };
    } catch (err: any) {
      console.error("Pipeline Error:", err);
      addLog(`[Error] Pipeline gagal: ${err.message}`);
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    const updatedMessages = [...chatMessages, { role: 'user', content: userMsg }];
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const data = await apiClient.sendChatMessage(updatedMessages, qaMode);
      setChatMessages(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (error: any) {
      setChatMessages(prev => [...prev, { role: 'model', content: `[Error]: ${error.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // 4. Gratis TTS (Web Speech API Lokal)
  const speakResult = () => {
    if (!evaluation) return;
    window.speechSynthesis.cancel(); // Clear any stuck speech
    const msg = new SpeechSynthesisUtterance();
    msg.text = `Hasil evaluasi Tabayyun. Terdeteksi ${evaluation.status}. ${evaluation.detail}. Posisi makhraj seharusnya di ${evaluation.makhraj}. Perhatikan sifat huruf yaitu ${evaluation.sifat}. Sebagaimana disebutkan dalam Matan Al Jazariyah: ${evaluation.terjemahMatan}.`;
    msg.lang = 'id-ID';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
    addLog("[Tier 4] Mensintesis suara evaluasi secara lokal...");
  };

  // Filter Reference Network
  const filteredLibraries = primaryLibraries.filter((lib) => {
    const matchesSearch = 
      lib.title?.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
      lib.content?.toLowerCase().includes(librarySearchQuery.toLowerCase()) ||
      lib.category?.toLowerCase().includes(librarySearchQuery.toLowerCase());
    
    if (selectedLibCat === "Semua") return matchesSearch;
    
    const cat = lib.category || "";
    if (selectedLibCat === "Situs & Program" && (cat === "Program & Situs Ilmiah" || cat === "Situs & Program")) return matchesSearch;
    if (selectedLibCat === "Akademik" && (cat === "Perpustakaan Akademik" || cat === "Akademik" || cat === "Hadits & Syarah" || cat === "Tafsir" || cat === "Ulumul Qur'an" || cat === "Kajian Aqidah")) return matchesSearch;
    if (selectedLibCat === "Unduh PDF" && (cat === "Situs Unduh PDF" || cat === "Unduh PDF")) return matchesSearch;
    if (selectedLibCat === "Telegram" && cat.includes("Telegram")) return matchesSearch;
    if (selectedLibCat === "Portal & Jurnal" && cat.startsWith("DIR_")) return matchesSearch;
    return false;
  });

  return (
    <div 
      className={`min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 ${
      isPhonePreview 
        ? 'max-w-[420px] mx-auto my-4 rounded-[44px] border-[6px] border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.5),0_0_0_2px_rgba(16,185,129,0.15)] overflow-hidden relative p-2.5 pt-9 pb-8'
        : 'p-4 md:p-8'
    }`}
    >
      {/* Phone Notch & Status Bar */}
      {isPhonePreview && (
        <>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-b-[18px] z-50" />
          <div className="absolute top-1.5 left-6 text-[10px] text-slate-500 z-50 font-medium">9:41</div>
          <div className="absolute top-1.5 right-7 flex items-center gap-0.5 text-[10px] text-slate-500 z-50">
            <span className="tracking-tighter">▮▮▮▮</span>
            <span className="text-[8px]">WiFi</span>
            <span>🔋</span>
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-[5px] bg-slate-600 rounded-full z-50" />
        </>
      )}
      {/* Modal Popup Error Mikrofon */}
      {micError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl shadow-rose-900/20 animate-in zoom-in-95">
            <div className="flex items-center gap-4 mb-4 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-full">
                <Mic size={32} />
              </div>
              <h2 className="text-xl font-bold">Akses Mikrofon Diblokir</h2>
            </div>
            
            <p className="text-slate-300 mb-6 leading-relaxed">
              Browser Anda (Chrome/Safari) secara otomatis memblokir <i>popup</i> izin mikrofon, atau Anda sedang membuka aplikasi ini di dalam layar kecil (iframe).
            </p>
            
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mb-6">
              <h3 className="font-semibold text-emerald-400 mb-2">Cara Memperbaikinya:</h3>
              <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
                <li><strong className="text-slate-200">Wajib:</strong> Buka aplikasi ini di <b>Tab Baru</b>.</li>
                <li>Klik ikon <b>Gembok 🔒</b> di sebelah kiri alamat web (URL) di bagian atas browser Anda.</li>
                <li>Cari pengaturan <b>Microphone (Mikrofon)</b>.</li>
                <li>Ubah dari "Block" menjadi <b>"Allow" (Izinkan)</b>.</li>
                <li><b>Refresh (Muat Ulang)</b> halaman ini.</li>
              </ol>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                Buka Aplikasi di Tab Baru Sekarang
              </button>
              <button 
                onClick={() => setMicError(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Saya Mengerti, Tutup Pesan Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header — Tarteel Style */}
      <header className={`flex items-center justify-between mb-6 ${isPhonePreview ? 'px-1' : 'max-w-6xl mx-auto border-b border-emerald-900/50 pb-4'}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <BookOpen size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Quranica</h1>
            {!isPhonePreview && (
              <p className="text-[10px] text-emerald-500/60 font-mono flex items-center gap-1">
                <ShieldCheck size={10} /> AI-Powered Tahsin
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-amber-100 text-slate-700 hover:bg-amber-200'
            }`}
            title={isDark ? "Mode Terang" : "Mode Gelap"}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          {userProfile ? (
            <div className="flex items-center gap-2">
              {/* Streak / Badge */}
              {userProfile.tier === "Berbayar" && (
                <div className={`flex items-center gap-1 bg-gradient-to-r ${userProfile.billingCycle === "Tahunan" ? 'from-purple-500/10 to-indigo-500/10 border-purple-500/20' : 'from-amber-500/10 to-amber-500/10 border-amber-500/20'} border rounded-full px-2.5 py-1`}>
                  <Crown size={11} className={userProfile.billingCycle === "Tahunan" ? "text-purple-400 fill-purple-400" : "text-amber-400 fill-amber-400"} />
                  <span className={`text-[9px] font-bold ${userProfile.billingCycle === "Tahunan" ? 'text-purple-400' : 'text-amber-400'}`}>
                    {userProfile.billingCycle === "Tahunan" ? "PLATINUM" : "PREMIUM"}
                  </span>
                </div>
              )}
              {userProfile.role === "Admin" && (
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ADMIN</span>
              )}
              {/* Avatar */}
              <button
                onClick={async () => {
                  await logout();
                  setGoogleUser(null);
                  setGoogleToken(null);
                  setUserProfile(null);
                  clearUserLogin();
                  setActiveTab('tahsin');
                }}
                className="w-8 h-8 bg-gradient-to-br from-emerald-700 to-teal-800 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-emerald-500/30 hover:border-red-500/50 transition-all"
                title="Logout"
              >
                {userProfile.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-full transition-all active:scale-95"
            >
              Masuk
            </button>
          )}
        </div>
      </header>

      <main className={`mx-auto relative ${isPhonePreview ? '' : 'max-w-6xl'}`} style={{ isolation: 'isolate' }}>
        
        {/* Navigation Tabs — hidden in phone mode (use bottom bar) */}
        {!isPhonePreview && (
        <div className="flex gap-6 mb-8 border-b border-emerald-900/50 px-2">
          <button 
            onClick={() => setActiveTab('tahsin')} 
            className={`flex items-center gap-2 pb-3 px-2 font-bold transition-all ${activeTab === 'tahsin' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Mic size={18} /> E-Tahsin
          </button>
          <button 
            onClick={() => setActiveTab('qa')} 
            className={`flex items-center gap-2 pb-3 px-2 font-bold transition-all ${activeTab === 'qa' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <MessageSquare size={18} /> Tanya Jawab Tafsir
          </button>
          <button 
            onClick={() => setActiveTab('hijaiyah')} 
            className={`flex items-center gap-2 pb-3 px-2 font-bold transition-all ${activeTab === 'hijaiyah' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <span className="text-lg">ا</span> Huruf Hijaiyah
          </button>
          <button 
            onClick={() => setActiveTab('research')} 
            className={`flex items-center gap-2 pb-3 px-2 font-bold transition-all ${activeTab === 'research' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BookText size={18} /> Deep Research
            {userProfile && userProfile.tier !== "Berbayar" && (
              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">PREMIUM</span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab('mcp')} 
            className={`flex items-center gap-2 pb-3 px-2 font-bold transition-all ${activeTab === 'mcp' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <BookOpen size={18} /> Digital Library & References
          </button>
          <button 
            onClick={() => setActiveTab('register')} 
            className={`flex items-center gap-2 pb-3 px-2 font-bold transition-all ${activeTab === 'register' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-500 hover:text-amber-400/80 hover:text-slate-300'}`}
          >
            <Crown size={16} className="text-amber-400 fill-amber-400/10" /> Registrasi & Berlangganan ⭐
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex items-center gap-2 pb-3 px-2 font-bold transition-all ${activeTab === 'profile' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <User size={18} /> Profil
          </button>
          {userProfile && userProfile.role === "Admin" && (
            <button 
              onClick={() => {
                setActiveTab('admin');
                fetchUsersForAdmin();
              }} 
              className={`flex items-center gap-2 pb-3 px-2 font-bold transition-all ${activeTab === 'admin' ? 'text-amber-400 border-b-2 border-amber-400 font-mono' : 'text-slate-500 hover:text-slate-300 font-mono'}`}
            >
              <Users size={18} className="text-amber-400" /> PANEL ADMIN 🛡️
            </button>
          )}
        </div>
        )}

        {activeTab === 'tahsin' ? (
          <div key="tahsin" className={`${isPhonePreview ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}`}>
        
            {/* Kolom Utama: Kontrol & Evaluasi */}
            <div className={`${isPhonePreview ? '' : 'lg:col-span-2'} space-y-4`}>
          {/* Panel Rekaman — Tarteel Style */}
          <div className="bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-400 opacity-50"></div>
            
            {/* Surah/Ayah Selector — compact in phone */}
            <div className={`flex gap-2 mb-5 ${isPhonePreview ? 'flex-wrap' : ''}`}>
              <select 
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex-1 min-w-0 focus:ring-2 ring-emerald-500/50 outline-none text-slate-200 text-sm transition-all"
                value={selectedSurah}
                onChange={(e) => {
                  setSelectedSurah(e.target.value);
                  setSelectedAyah("1");
                }}
              >
                {surahs.map(s => <option key={s.number} value={s.number}>{s.number}. {s.englishName} ({s.arab})</option>)}
              </select>
              <input 
                type="number" 
                className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 w-16 text-center focus:ring-2 ring-emerald-500/50 outline-none text-slate-200 text-sm" 
                value={selectedAyah}
                onChange={(e) => {
                  const maxAyah = surahs.find(s => s.number.toString() === selectedSurah)?.numberOfAyahs || 1;
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val >= 1 && val <= maxAyah) {
                    setSelectedAyah(e.target.value);
                  } else if (e.target.value === "") {
                    setSelectedAyah("");
                  }
                }}
                onBlur={() => { if (selectedAyah === "") setSelectedAyah("1"); }}
                min="1"
                max={surahs.find(s => s.number.toString() === selectedSurah)?.numberOfAyahs || 1}
              />
              <button 
                onClick={handleConfirmSelection}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95"
              >
                RAG
              </button>
            </div>

            {/* Verse Card — Tarteel style: large Arabic, clean background */}
            <div className="text-center py-8 md:py-10 bg-slate-950/60 rounded-2xl mb-6 border border-slate-800/60 relative">
               {/* Streak/badge indicator */}
               {userProfile && (
                 <div className="absolute top-3 right-3 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
                   <Activity size={10} className="text-emerald-400" />
                   <span className="text-[9px] font-bold text-emerald-400">LIVE</span>
                 </div>
               )}
               <p className="text-emerald-400/70 font-medium mb-5 text-[11px] tracking-wider uppercase">
                 {surahs.length > 0 ? `Surah ${surahs.find(s => s.number.toString() === confirmedSurah)?.englishName} · Ayat ${confirmedAyah}` : "Memuat..."}
               </p>
               
               {isFetchingMcp ? (
                 <div className="py-8 animate-pulse space-y-4">
                   <div className="h-12 bg-slate-800 rounded w-3/4 mx-auto"></div>
                   <div className="h-5 bg-slate-800 rounded w-1/2 mx-auto"></div>
                 </div>
               ) : (
                 <div className="px-3">
                   <p className="text-3xl md:text-4xl font-serif mb-5 text-white leading-[2.2] tracking-wide" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif", direction: 'rtl' }}>
                     {mcpData?.verifiedText || "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ"}
                   </p>
                   <p className="text-base md:text-lg text-emerald-300/80 italic font-medium">
                     {mcpData?.transliteration || "Bismillaahir-Rahmaanir-Rahiim"}
                   </p>
                 </div>
               )}

               <p className="text-slate-500 text-xs mt-6 italic">
                 {isRecording ? "Merekam..." : isProcessing ? "Memproses..." : "Sentuh mikrofon untuk mulai membaca"}
               </p>
            </div>

            {/* Recording Button — large circle, Tarteel style */}
            <div className="flex justify-center -mt-2">
              {!isRecording ? (
                <button 
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.25)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 group"
                >
                  <Mic size={30} className="text-white group-hover:scale-110 transition-transform" />
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="w-20 h-20 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(225,29,72,0.35)] animate-pulse transition-all active:scale-95"
                >
                  <Square size={26} className="text-white" />
                </button>
              )}
            </div>
            
            {/* Recording timer / status */}
            {isRecording && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-full px-3 py-1.5">
                  <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                  <span className="text-rose-400 text-xs font-bold">MEREKAM</span>
                </div>
              </div>
            )}
            {isProcessing && (
              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5">
                  <RefreshCw size={11} className="text-amber-400 animate-spin" />
                  <span className="text-amber-400 text-xs font-bold">Memproses Tahsin...</span>
                </div>
              </div>
            )}
          </div>

          {/* Makharijul Huruf Interaktif */}
          <MakharijulHuruf />

          {/* Panel Hasil Evaluasi */}
          {evaluation && (
            <div className="bg-gradient-to-b from-emerald-950/40 to-slate-900 p-6 md:p-8 rounded-2xl border border-emerald-500/30 animate-in fade-in slide-in-from-bottom-4 shadow-xl shadow-emerald-900/10">
              <div className="flex items-center justify-between mb-6 border-b border-emerald-900/40 pb-4">
                <h3 className="text-emerald-400 font-bold text-lg flex items-center gap-2">
                  <Activity size={20} /> Hasil Koreksi Tahsin
                </h3>
                {/* TTS Button */}
                <button
                  onClick={() => {
                    if (!('speechSynthesis' in window)) return;
                    window.speechSynthesis.cancel();
                    const text = `Hasil koreksi tahsin. Status: ${evaluation.status || 'tidak tersedia'}. ${evaluation.detail || ''}. ` +
                      (evaluation.koreksiVn?.length ? `Huruf yang perlu dikoreksi: ${evaluation.koreksiVn.map((k:any) => k.nama).join(', ')}. ` : '') +
                      `Makhraj: ${evaluation.makhraj || ''}. Sifat: ${evaluation.sifat || ''}.`;
                    const utter = new SpeechSynthesisUtterance(text);
                    utter.lang = 'id-ID'; utter.rate = 0.9;
                    window.speechSynthesis.speak(utter);
                  }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95"
                >
                  🔊 Baca Hasil
                </button>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm ${
                  evaluation.status === 'Mumtaz' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  evaluation.status === 'Lahn Khafy' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {evaluation.status === 'Mumtaz' ? '✅' : evaluation.status === 'Lahn Khafy' ? '⚠️' : '❌'}
                  {evaluation.status || 'Tidak Terklasifikasi'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div className="space-y-4">
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Diagnosis Kesalahan</span>
                    <p className="text-slate-200 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-800">{evaluation.detail || 'Tidak ada diagnosis'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Posisi Makhraj yang Benar</span>
                    <p className="text-emerald-200 font-medium bg-slate-900/50 p-3 rounded-lg border border-slate-800">{evaluation.makhraj || '-'}</p>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-500 block text-xs uppercase tracking-wider mb-1">Sifat Huruf</span>
                    <p className="text-slate-300">{evaluation.sifat || '-'}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-emerald-600 block text-xs uppercase tracking-wider mb-2 font-bold">Rujukan Matan Al-Jazariyah</span>
                    <p className="font-serif text-2xl text-emerald-100 text-right leading-relaxed mb-2" style={{ fontFamily: "'Amiri', serif" }}>{evaluation.matan || '-'}</p>
                    <p className="text-slate-400 italic text-xs">"{evaluation.terjemahMatan || ''}"</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4">
                {/* KOREKSI VN — E-Tahsin Hijaiyah */}
                {evaluation.koreksiVn && evaluation.koreksiVn.length > 0 && (
                  <>
                  <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl">
                    <h4 className="text-amber-400 font-bold text-sm flex items-center gap-2 mb-3">
                      <Play size={16} /> Huruf Perlu Koreksi — Dengarkan Pelafalan Benar
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.koreksiVn.map((kv: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => {
                            const audio = new Audio(`/vn/vn_${kv.vn}.mp3`);
                            audio.play();
                          }}
                          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95"
                        >
                          <Play size={14} fill="currentColor" />
                          VN-{kv.vn}: {kv.huruf} ({kv.nama})
                        </button>
                      ))}
                    </div>
                    <p className="text-amber-300/70 text-xs mt-2">
                      Tekan tombol untuk mendengar pelafalan huruf yang benar
                    </p>
                  </div>

                  {/* GRID 28 HURUF HIJAIYAH — Highlight huruf salah */}
                  <div className="bg-slate-900/80 border border-slate-700 p-4 rounded-xl">
                    <h4 className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-3">Referensi 28 Huruf Hijaiyah</h4>
                    <div className="grid grid-cols-7 gap-1.5">
                      {(() => {
                        const HIJAIYAH_GRID = [
                          {h:"ا",n:"Alif",v:"001"},{h:"ب",n:"Ba",v:"002"},{h:"ت",n:"Ta",v:"003"},{h:"ث",n:"Tsa",v:"004"},{h:"ج",n:"Jim",v:"005"},{h:"ح",n:"Ha",v:"006"},{h:"خ",n:"Kha",v:"007"},
                          {h:"د",n:"Dal",v:"008"},{h:"ذ",n:"Dzal",v:"009"},{h:"ر",n:"Ra",v:"010"},{h:"ز",n:"Za",v:"011"},{h:"س",n:"Sin",v:"012"},{h:"ش",n:"Syin",v:"013"},{h:"ص",n:"Shad",v:"014"},
                          {h:"ض",n:"Dhad",v:"015"},{h:"ط",n:"Tha",v:"016"},{h:"ظ",n:"Zha",v:"017"},{h:"ع",n:"Ain",v:"018"},{h:"غ",n:"Ghain",v:"019"},{h:"ف",n:"Fa",v:"020"},{h:"ق",n:"Qaf",v:"021"},
                          {h:"ك",n:"Kaf",v:"022"},{h:"ل",n:"Lam",v:"023"},{h:"م",n:"Mim",v:"024"},{h:"ن",n:"Nun",v:"025"},{h:"و",n:"Waw",v:"026"},{h:"ه",n:"Ha",v:"027"},{h:"ي",n:"Ya",v:"028"}
                        ];
                        const salahSet = new Set(evaluation.koreksiVn.map((k:any) => k.huruf));
                        return HIJAIYAH_GRID.map((item) => {
                          const isSalah = salahSet.has(item.h);
                          return (
                            <button
                              key={item.v}
                              onClick={() => {
                                const a = new Audio(`/vn/vn_${item.v}.mp3`);
                                a.play();
                                addLog(`[Ref] Memutar ${item.h} (${item.n})`);
                              }}
                              title={`${item.n}${isSalah ? ' — PERLU KOREKSI' : ''}`}
                              className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-xs transition-all ${
                                isSalah
                                  ? 'bg-rose-600/30 border border-rose-500/60 scale-110 shadow-lg shadow-rose-500/20'
                                  : 'bg-slate-800 border border-slate-700 hover:border-emerald-500/30 hover:bg-slate-700'
                              }`}
                            >
                              <span className="text-lg font-arabic" style={{fontFamily:"Traditional Arabic,serif"}}>{item.h}</span>
                              {isSalah && <span className="text-[8px] text-rose-300 mt-0.5">⚠️</span>}
                            </button>
                          );
                        });
                      })()}
                    </div>
                    <p className="text-[10px] text-slate-600 mt-2 text-center">
                      Huruf merah = perlu koreksi. Klik untuk dengar pelafalan benar.
                    </p>
                  </div>
                  </>
                )}
                <div className="flex justify-end">
                <button 
                  onClick={speakResult}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/25 active:scale-95"
                >
                  <Play size={18} fill="currentColor" /> Dengarkan Edukasi Tajwid
                </button>
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan: Logs & MCP Grounding */}
        <div className="space-y-6">
          
          {/* MCP Grounding Panel */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <BookText size={100} />
            </div>
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ShieldCheck size={16} /> Verified by quran.ai
            </h4>
            
            {mcpData ? (
              <div className="space-y-4 text-sm relative z-10 animate-in fade-in">
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Teks Referensi Sahih</span>
                  <p className="font-serif text-2xl text-slate-200 text-right" style={{ fontFamily: "'Amiri', serif", direction: 'rtl' }}>{mcpData.verifiedText}</p>
                  <p className="text-emerald-400/80 text-sm text-right italic mt-2">{mcpData.transliteration}</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <span className="text-indigo-500 text-xs block mb-1 font-semibold">Analisis Morfologi (Akar Kata)</span>
                  <p className="text-slate-300">{mcpData.morphology}</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <span className="text-indigo-500 text-xs block mb-1 font-semibold">Konteks Makna (Tafsir Ringkas)</span>
                  <p className="text-slate-300 italic">"{mcpData.tafsir}"</p>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <span className="text-emerald-500 text-xs block mb-1 font-semibold">Hukum Tajwid (Tuhfatul Athfal / Al-Jazariyah)</span>
                  <p className="text-slate-300">{mcpData.tajwidRules}</p>
                </div>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-600 text-xs text-center border border-dashed border-slate-700 rounded-xl">
                Menunggu input audio untuk <br/> menarik data tafsir & morfologi...
              </div>
            )}
          </div>

          {/* Terminal Logs */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 h-80 flex flex-col shadow-inner">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <TerminalIcon size={14} /> System Logs (Tabayyun)
            </h4>
            <div className="flex-1 font-mono text-[11px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="text-emerald-400/80 border-b border-slate-800/50 pb-1">
                  <span className="text-slate-600 mr-2">{">"}</span>{log}
                </div>
              ))}
              {isProcessing && <div className="text-yellow-500/80 animate-pulse mt-2">{">"} Menunggu komputasi selesai...</div>}
            </div>
          </div>
          
        </div>
          </div>
        ) : activeTab === 'qa' ? (
          <div key="qa" className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl h-[700px] flex flex-col overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-teal-400 opacity-50"></div>
            
            {/* Chat Header — Riwayat + Mode Toggle */}
            {userProfile && (
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/50 z-10">
                <div className="flex items-center gap-2">
                  <button onClick={newChat} className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all flex items-center gap-1">
                    <Plus size={12} /> Chat Baru
                  </button>
                  <button
                    onClick={() => { setShowHistoryPanel(!showHistoryPanel); loadChatHistories(); }}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                      showHistoryPanel ? 'bg-amber-600/20 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                    }`}
                  >
                    <BookOpen size={12} /> Riwayat {chatHistories.length > 0 && `(${chatHistories.length})`}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mode Toggle: Tafsir vs Hadits vs Maqashid */}
                  <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                    <button
                      onClick={() => setQaMode('tafsir')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${
                        qaMode === 'tafsir' 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      📖 Tafsir
                    </button>
                    <button
                      onClick={() => setQaMode('master')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${
                        qaMode === 'master' 
                          ? 'bg-amber-500 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      🎓 Master
                    </button>
                    <button
                      onClick={() => setQaMode('maqashid')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${
                        qaMode === 'maqashid' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      🌍 Maqashid
                    </button>
                    <button
                      onClick={() => setQaMode('genz')}
                      className={`text-[9px] font-bold px-2 py-1 rounded-md transition-all ${
                        qaMode === 'genz' 
                          ? 'bg-pink-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      💅 Gen Z
                    </button>
                  </div>
                  {activeHistoryId && (
                    <span className="text-[9px] text-slate-500 font-mono truncate max-w-[120px]">
                      💾 Tersimpan
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* History Panel */}
            {showHistoryPanel && userProfile && (
              <div className="border-b border-slate-800 bg-slate-950/80 max-h-[200px] overflow-y-auto custom-scrollbar">
                {chatHistories.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">Belum ada riwayat chat. Mulai percakapan baru!</div>
                ) : (
                  chatHistories.map(h => (
                    <div key={h.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800/50 hover:bg-slate-900/50 transition-all group">
                      <button onClick={() => loadHistory(h)} className="flex-1 text-left flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-slate-300 truncate">{h.title}</span>
                        <span className="text-[9px] text-slate-500 font-mono">{new Date(h.createdAt).toLocaleString('id-ID')} · {h.messages.length} pesan</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(confirmDeleteId === h.id ? null : h.id); }}
                        className="text-slate-600 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                      {confirmDeleteId === h.id && (
                        <div className="absolute right-12 bg-slate-800 border border-red-500/30 rounded-lg p-2 text-[10px] flex gap-2 z-20 shadow-xl">
                          <span className="text-red-400">Hapus?</span>
                          <button onClick={() => deleteHistory(h.id)} className="text-red-400 font-bold hover:text-red-300">Ya</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-slate-400">Batal</button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <BookOpen size={64} className="text-emerald-900/50" />
                  <p className="text-center max-w-md leading-relaxed">
                    Tanyakan apa saja seputar tafsir, asbabun nuzul, ilmu tajwid, atau makna ayat Al-Qur'an.
                  </p>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                  <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-700 text-emerald-50 rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'}`}>
                    <div className="text-sm md:text-base leading-relaxed [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>h3]:font-bold [&>h3]:text-lg [&>h3]:mb-2 [&>strong]:text-emerald-300">
                      <Markdown
                        components={{
                          a: ({ href, children }) => {
                            if (href?.startsWith('mcp://')) {
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleMcpLinkClick(href)}
                                  className="text-emerald-400 hover:text-emerald-300 underline font-semibold transition-all inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono text-[11px] align-middle my-0.5"
                                  title="Lacak rujukan asli di Perpustakaan Cungkring"
                                >
                                  <Database size={11} className="animate-pulse text-emerald-400" />
                                  {children}
                                </button>
                              );
                            }
                            const directHref = getDirectExternalLink(href || "");
                            return (
                              <a
                                href={directHref}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 underline font-bold transition-all inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-sans text-xs align-middle my-0.5 shadow-sm"
                                title="Kunjungi Situs Rujukan Resmi"
                              >
                                <Globe size={11} className="text-emerald-400 animate-pulse" />
                                {children}
                              </a>
                            );
                          }
                        }}
                      >
                        {msg.content}
                      </Markdown>
                    </div>

                    {msg.role !== 'user' && (
                      <div className="mt-4 pt-3 border-t border-slate-700/50 flex flex-col gap-3">
                        <div className="flex flex-wrap gap-2">
                          <button 
                            type="button"
                            onClick={() => handleCrossCheckMcp(msg.content)}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-all active:scale-95"
                          >
                            <Database size={12} className="animate-pulse" /> Verifikasi Sumber (Cross-Check via MCP Cungkring)
                          </button>
                          <button 
                            type="button"
                            onClick={() => downloadChatAsPDF(msg.content, i)}
                            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 transition-all active:scale-95"
                          >
                            <FileDown size={12} /> Download PDF
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.role !== 'user' && mcpCrossCheckResult && (
                    <div className="w-[85%] md:w-[75%] self-start bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-emerald-400" />
                          <span className="font-bold text-slate-300 font-sans">Hasil Verifikasi Model Context Protocol</span>
                        </div>
                        <button 
                          onClick={() => setMcpCrossCheckResult(null)}
                          className="text-slate-500 hover:text-slate-300 font-bold"
                        >
                          Tutup
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          {mcpCrossCheckResult.verified ? (
                            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">TERVERIFIKASI DIGITAL</span>
                          ) : (
                            <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold">SUMBER MERAGUKAN</span>
                          )}
                          <span className="text-[10px] text-slate-500 font-mono">Node: cungkring_mcp</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{mcpCrossCheckResult.message}</p>
                        
                        {mcpCrossCheckResult.matchedSource && (
                          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                            <div className="flex justify-between">
                              <span className="text-[11px] font-bold text-emerald-400">{mcpCrossCheckResult.matchedSource.title}</span>
                              <span className="text-[9px] text-slate-500 font-mono">{mcpCrossCheckResult.matchedSource.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 italic">"{mcpCrossCheckResult.matchedSource.exactContent}"</p>
                            <p className="text-[9px] text-slate-600 font-mono">URI: {mcpCrossCheckResult.matchedSource.uri}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {msg.role !== 'user' && mcpIsCrossChecking && (
                    <div className="self-start ml-2 text-xs text-slate-500 flex items-center gap-1.5 py-1">
                      <RefreshCw className="animate-spin text-emerald-500" size={12} /> Menghubungi Perpustakaan Cungkring via MCP...
                    </div>
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 p-4 rounded-2xl rounded-bl-none border border-slate-700 flex gap-2 items-center">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex gap-3">
              <button 
                type="button" 
                onClick={toggleListening} 
                className={`p-3 rounded-xl transition-all flex items-center justify-center ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-emerald-400'}`}
                title="Voice Recognition (Dikte)"
              >
                <Mic size={20} />
              </button>
              <input 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                placeholder={isListening ? "Mendengarkan suara Anda..." : "Tanyakan seputar Al-Qur'an atau Tafsir..."} 
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 ring-emerald-500/50 outline-none transition-all" 
              />
              <button 
                type="submit" 
                disabled={isChatLoading || !chatInput.trim()} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-emerald-500/25 active:scale-95"
              >
                <Send size={18} /> Kirim
              </button>
            </form>
          </div>
        ) : activeTab === 'research' ? (
          (userProfile && userProfile.tier !== "Berbayar") ? (
            <div className="space-y-6 text-slate-200">
              <div className="bg-slate-900 p-10 rounded-2xl border border-amber-500/20 shadow-2xl text-center space-y-5">
                <div className="text-6xl">🔒</div>
                <h2 className="text-xl font-bold text-amber-400">Fitur Eksklusif Premium</h2>
                <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                  Deep Research hanya tersedia untuk pengguna Premium. Upgrade sekarang untuk akses riset mendalam tanpa batas, analisis komparasi mazhab, dan kajian literatur Turats klasik.
                </p>
                <button
                  onClick={() => setActiveTab('register')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg mt-4"
                >
                  <Crown size={18} /> Upgrade ke Premium Sekarang
                </button>
              </div>
            </div>
          ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Form Mulai Riset */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 to-indigo-500 opacity-50"></div>
              
              <h2 className="text-xl font-bold text-slate-100 mb-2 flex items-center gap-2">
                <Search className="text-emerald-400" size={20} /> Start Deep Research
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Masukkan topik keilmuan Al-Qur'an, Fiqih, Aqidah, atau Tafsir. Sistem akan meluncurkan agen riset multi-tahap secara otonom untuk menggali dalil, literatur Turats klasik, dan analisis komparasi mazhab secara sangat mendalam.
              </p>

              <form onSubmit={handleStartResearch} className="flex flex-col md:flex-row gap-3">
                <input 
                  value={researchTopic}
                  onChange={e => setResearchTopic(e.target.value)}
                  disabled={isResearchRunning}
                  placeholder="Contoh: Kajian Hukum Tabarruk di Makam Wali Songo atau Perbandingan Tafsir Muqatta'ah..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-slate-200 focus:ring-2 ring-emerald-500/50 outline-none transition-all disabled:opacity-60"
                />
                <button 
                  type="submit"
                  disabled={isResearchRunning || !researchTopic.trim()}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                >
                  {isResearchRunning ? (
                    <>
                      <Activity className="animate-spin" size={18} /> Sedang Mengkaji...
                    </>
                  ) : (
                    <>
                      <BookText size={18} /> Start Research
                    </>
                  )}
                </button>
              </form>

              {researchError && (
                <div className="mt-4 bg-red-950/40 border border-red-900/50 rounded-xl p-4 text-red-400 text-sm flex items-start gap-2">
                  <span className="font-bold">Gagal:</span> {researchError}
                </div>
              )}
            </div>

            {/* Riwayat Deep Research */}
            {userProfile && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <button
                  onClick={() => { setShowResearchHistory(!showResearchHistory); if (!showResearchHistory) loadResearchHistories(); }}
                  className="w-full flex items-center justify-between px-6 py-3 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all"
                >
                  <span className="flex items-center gap-2"><Clock size={14} className="text-amber-400" /> Research History {researchHistories.length > 0 && `(${researchHistories.length})`}</span>
                  <span className="text-[10px]">{showResearchHistory ? '▲' : '▼'}</span>
                </button>
                {showResearchHistory && (
                  <div className="border-t border-slate-800 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {researchHistories.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">No research history yet. Your completed research will appear here.</div>
                    ) : (
                      researchHistories.map(h => (
                        <div key={h.id} className="flex items-center justify-between px-6 py-3 border-b border-slate-800/50 hover:bg-slate-950/50 transition-all group">
                          <button onClick={() => loadResearchFromHistory(h)} className="flex-1 text-left min-w-0">
                            <span className="text-xs font-bold text-slate-300 truncate block">{h.topic}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{new Date(h.createdAt).toLocaleString('id-ID')} — {h.result.length} chars</span>
                          </button>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button onClick={() => { navigator.clipboard.writeText(h.result); }} className="text-slate-600 hover:text-emerald-400 p-1" title="Copy"><CheckCircle size={12} /></button>
                            <button onClick={() => deleteResearchHistory(h.id)} className="text-slate-600 hover:text-red-400 p-1" title="Delete"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Perkembangan Penelitian */}
            {(isResearchRunning || researchTaskId) && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Kolom Kiri: Indikator Progres & Tahapan */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Status & Progress Bar */}
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Perkembangan Kajian</span>
                      <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">{researchProgress}%</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-950 h-3.5 rounded-full overflow-hidden border border-slate-800 p-0.5">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out relative"
                        style={{ width: `${researchProgress}%` }}
                      >
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1 font-semibold">Aktivitas Agen Saat Ini:</span>
                      <p className="text-slate-200 text-sm font-medium flex items-center gap-2">
                        {isResearchRunning && <Activity className="animate-pulse text-emerald-400" size={16} />}
                        {researchCurrentStage}
                      </p>
                    </div>
                  </div>

                  {/* Parameter Perkembangan / Tahapan Detail */}
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                      <ShieldCheck size={16} className="text-indigo-400" /> Parameter & Struktur Evaluasi Multi-Tahap
                    </h3>

                    <div className="space-y-4">
                      {researchSteps.map((step, idx) => {
                        let statusColor = "text-slate-500 border-slate-800 bg-slate-950";
                        let badgeColor = "bg-slate-950 text-slate-500 border-slate-800";
                        let badgeLabel = "Menunggu";

                        if (step.status === "running") {
                          statusColor = "text-yellow-400 border-yellow-500/30 bg-yellow-500/5 shadow-lg shadow-yellow-500/5";
                          badgeColor = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 animate-pulse";
                          badgeLabel = "Sedang Memproses";
                        } else if (step.status === "completed") {
                          statusColor = "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
                          badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                          badgeLabel = "Selesai";
                        } else if (step.status === "failed") {
                          statusColor = "text-red-400 border-red-500/30 bg-red-500/5";
                          badgeColor = "bg-red-500/10 text-red-400 border-red-500/20";
                          badgeLabel = "Terhenti";
                        }

                        return (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border transition-all ${statusColor} flex flex-col md:flex-row md:items-center justify-between gap-3`}
                          >
                            <div className="space-y-1">
                              <h4 className="font-bold text-sm flex items-center gap-2">
                                <span className="font-mono text-xs opacity-50">T{idx + 1}.</span>
                                {step.name}
                              </h4>
                              <p className="text-xs text-slate-400 font-medium">{step.detail}</p>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border self-start md:self-center ${badgeColor}`}>
                              {badgeLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Kolom Kanan: Log Konsol Kemajuan Riset */}
                <div className="space-y-6">
                  
                  {/* Terminal Kemajuan */}
                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 h-[380px] flex flex-col shadow-inner">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <TerminalIcon size={14} className="text-slate-400" /> Console Log Kemajuan Agen
                    </h4>
                    <div className="flex-1 font-mono text-[11px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                      {researchLogs.map((log, i) => (
                        <div key={i} className="text-emerald-400/80 border-b border-slate-900 pb-1.5 leading-relaxed">
                          <span className="text-indigo-500 mr-1.5">{"$"}</span>{log}
                        </div>
                      ))}
                      {isResearchRunning && (
                        <div className="text-yellow-500/80 animate-pulse mt-2 flex items-center gap-1">
                          <span className="text-yellow-500 mr-1.5">{">"}</span> 
                          <span>Agen sedang mendalami rujukan...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informational Panel */}
                  <div className="bg-slate-900 p-5 rounded-2xl border border-indigo-500/10">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
                      Sistem Agen Deepseek-v4-pro
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Deep Research ini ditenagai sepenuhnya oleh model <strong>Deepseek-v4-pro</strong> yang berjalan secara multi-tahap pada backend. Proses ini melakukan kajian komprehensif, menstrukturkan teks, mengekstraksi literatur, menyusun argumentasi mazhab, dan menyunting laporan utuh tanpa batasan token satu kali prompt.
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* Manuskrip Penelitian Akhir */}
            {researchResult && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6 animate-in slide-in-from-bottom duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      {isResearchRunning ? (
                        <>
                          <Activity size={12} className="animate-pulse" /> Sedang Ditulis Secara Real-Time ({researchProgress}%)
                        </>
                      ) : (
                        "Karya Ilmiah / Manuskrip Akademis"
                      )}
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-100 mt-1">
                      Research Results {isResearchRunning ? "(Live Draft)" : ""}
                    </h2>
                  </div>
                  <button
                    onClick={downloadResearchResult}
                    disabled={isResearchRunning}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                  >
                    <FileDown size={16} /> Download Research (.md)
                  </button>
                </div>

                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed overflow-y-auto max-h-[800px] pr-4 custom-scrollbar">
                  <div className="markdown-body font-sans space-y-4">
                    <Markdown
                      components={{
                        a: ({ href, children }) => {
                          if (href?.startsWith('mcp://')) {
                            return (
                              <button
                                type="button"
                                onClick={() => handleMcpLinkClick(href)}
                                className="text-emerald-400 hover:text-emerald-300 underline font-semibold transition-all inline-flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono text-[11px] align-middle my-0.5"
                                title="Lacak rujukan asli di Perpustakaan Cungkring"
                              >
                                <Database size={11} className="animate-pulse text-emerald-400" />
                                {children}
                              </button>
                            );
                          }
                          const directHref = getDirectExternalLink(href || "");
                          return (
                            <a
                              href={directHref}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 underline font-bold transition-all inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20 font-sans text-xs align-middle my-0.5 shadow-sm"
                              title="Kunjungi Situs Rujukan Resmi"
                            >
                              <Globe size={11} className="text-emerald-400 animate-pulse" />
                              {children}
                            </a>
                          );
                        }
                      }}
                    >
                      {researchResult}
                    </Markdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        )) : activeTab === 'admin' ? (
          <div key="admin" className="space-y-6 text-slate-200 relative z-10" style={{ isolation: 'isolate' }}>
            {/* Panel Admin Utama */}
            <div className="bg-slate-950 p-6 md:p-8 rounded-2xl border border-amber-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-yellow-400 opacity-70"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Crown size={12} className="text-amber-400 fill-amber-400/20" /> SISTEM MANAJEMEN ADMINISTRASI QURANICA
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2 font-sans">
                    🛡️ Pusat Kendali Keamanan & Pengguna
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-3xl">
                    Sebagai Administrator Utama, Anda memiliki wewenang penuh untuk memantau pendaftaran pengguna baru, mengelola hak akses perantara (peran Admin), memperbarui atau merubah tingkat berlangganan (Reguler / Berbayar), serta menghapus akun pengguna dari database.
                  </p>
                </div>
                <button
                  onClick={fetchUsersForAdmin}
                  disabled={adminPanelLoading}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 transition-all flex items-center gap-1.5 self-start md:self-auto"
                >
                  <RefreshCw size={12} className={adminPanelLoading ? "animate-spin text-amber-400" : ""} /> Perbarui Data
                </button>
              </div>

              {adminPanelFeedback && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-3 rounded-xl text-xs flex items-start gap-2 mb-6">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <p className="font-semibold">{adminPanelFeedback}</p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Tambah Admin Baru */}
                <div className="lg:col-span-1 bg-slate-950 p-6 rounded-xl border border-slate-800/80 space-y-4">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <UserPlus size={14} className="text-amber-400" /> Daftarkan Admin Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Masukkan alamat email pengguna untuk mempromosikannya sebagai Administrator. Admin baru akan memiliki akses penuh ke panel kontrol ini setelah mereka masuk dengan Google Drive.
                  </p>
                  
                  <form onSubmit={handleAddAdmin} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
                        Email Calon Admin
                      </label>
                      <input
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="contoh: rivalgamingchannel@gmail.com"
                        className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-all focus:ring-1 focus:ring-amber-500/30"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={adminPanelLoading || !newAdminEmail.trim()}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-all shadow flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <Crown size={12} /> Tambahkan Sebagai Admin
                    </button>
                  </form>
                </div>

                {/* Tabel Daftar Pengguna */}
                <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden">
                  <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <Users size={14} className="text-amber-400" /> Direktori Pengguna Terdaftar ({adminUsersList.length})
                    </h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/30 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                          <th className="p-4 font-bold">Detail Pengguna</th>
                          <th className="p-4 font-bold">Hak Akses (Peran)</th>
                          <th className="p-4 font-bold">Jenis Akun</th>
                          <th className="p-4 font-bold text-right">Tindakan Kendali</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {adminUsersList.map((user) => (
                          <tr key={user.uid} className="hover:bg-slate-900/20 transition-all">
                            <td className="p-4">
                              <div className="font-bold text-slate-200">{user.displayName}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</div>
                              <div className="text-[9px] text-slate-600 font-mono mt-1">UID: {user.uid}</div>
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleToggleUserRole(user.uid, user.role)}
                                disabled={user.uid === userProfile?.uid}
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border transition-all ${
                                  user.role === "Admin"
                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'text-slate-400 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                                } disabled:opacity-75 disabled:cursor-not-allowed`}
                                title={user.uid === userProfile?.uid ? "Anda tidak bisa mengubah peran sendiri" : "Klik untuk mengubah Peran (Admin/User)"}
                              >
                                {user.role === "Admin" ? (
                                  <>
                                    <Crown size={9} /> ADMIN
                                  </>
                                ) : (
                                  <>
                                    <Users size={9} /> USER
                                  </>
                                )}
                              </button>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-col items-start gap-1">
                                <button
                                  onClick={() => handleToggleUserTier(user.uid, user.tier)}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all flex items-center gap-1 ${
                                    user.tier === "Berbayar"
                                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20'
                                      : 'text-slate-400 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                                  }`}
                                  title="Klik untuk beralih Jenis Akun"
                                >
                                  {user.tier === "Berbayar" ? "⭐ BERBAYAR" : "🍃 REGULER"}
                                </button>
                                {user.tier === "Berbayar" && user.billingCycle && (
                                  <span className="text-[9px] text-amber-500/80 font-mono font-bold bg-amber-500/5 px-1 py-0.2 rounded border border-amber-500/10">
                                    Siklus: {user.billingCycle}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              {user.uid === userProfile?.uid ? (
                                <span className="text-[9px] text-slate-500 italic font-mono pr-2">Akun Anda</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteUser(user.uid)}
                                  className="p-2 bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 rounded-lg transition-all"
                                  title="Kurangi / Hapus Pengguna dari Sistem"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {adminUsersList.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500 font-mono text-xs">
                              Memuat data pengguna... Klik "Perbarui Data" jika tidak muncul.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'register' ? (
          <div key="register" className="space-y-6 animate-in fade-in duration-300 text-slate-200">
            {/* Banner Utama */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-amber-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-emerald-400 opacity-80"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Crown size={12} className="text-amber-400 fill-amber-400/20 animate-bounce" /> PORTAL REGISTRASI & KEANGGOTAAN PREMIUM
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2 font-sans">
                    Quranica AI Premium ⭐
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-3xl">
                    Daftar sekarang dan nikmati akses penuh tanpa batas ke asisten kecerdasan buatan, Deep Research (Riset Kajian Mendalam), integrasi rujukan primernya, serta sinkronisasi awan Google Drive yang aman dan lancar.
                  </p>
                </div>
                {userProfile ? (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-1.5 min-w-[180px] text-center self-start md:self-auto shadow-inner">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Status Keanggotaan</div>
                    {userProfile.tier === "Berbayar" ? (
                      <>
                        <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5 shadow">
                          <Crown size={12} className="fill-amber-400" /> PREMIUM ({userProfile.billingCycle})
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">Sistem Aktif & Siap Digunakan</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                          AKUN REGULER (GRATIS)
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono mt-1">Upgrade di bawah untuk semua fitur</span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-1.5 min-w-[180px] text-center self-start md:self-auto shadow-inner">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Sesi Belum Masuk</div>
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/10">
                      TIDAK TERAUTENTIKASI
                    </span>
                    <span className="text-[9px] text-slate-500 leading-normal">Silakan isi form pendaftaran di bawah</span>
                  </div>
                )}
              </div>
            </div>

            {/* Grid Opsi Langganan (Comparison) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Paket Reguler */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:border-slate-700 shadow-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded tracking-wider">
                        REGULER
                      </span>
                      <h3 className="text-lg font-bold text-slate-200 mt-2">Gratis Selamanya</h3>
                    </div>
                    <span className="text-2xl font-bold text-slate-300 font-mono">Rp 0</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sangat cocok bagi Anda yang ingin mencoba sistem Quranica AI secara mendasar untuk keperluan harian ringan.
                  </p>
                  
                  <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Evaluasi E-Tahsin Dasar
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> Konsultasi Tafsir Standard
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> View Cungkring Library Catalog
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 line-through">
                      <span>✗</span> Kajian Deep Research Tanpa Batas
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 line-through">
                      <span>✗</span> Sinkronisasi Google Drive Lintas Sesi
                    </div>
                  </div>
                </div>
                
                <div className="pt-6">
                  {userProfile && userProfile.tier === "Reguler" ? (
                    <button className="w-full py-2 bg-slate-800 text-slate-300 border border-slate-700 font-bold rounded-xl text-xs cursor-default" disabled>
                      ✓ Paket Aktif Saat Ini
                    </button>
                  ) : userProfile ? (
                    <button 
                      onClick={() => handleSelfTierUpgrade("Reguler")}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all"
                    >
                      Kembali ke Reguler
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setLoginTierSelection("Reguler");
                        setShowLoginModal(true);
                      }}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition-all"
                    >
                      Daftar Akun Gratis
                    </button>
                  )}
                </div>
              </div>

              {/* Paket Premium (1 Bulan) */}
              <div className="bg-slate-900 rounded-2xl border border-amber-500/20 p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:border-amber-500/30 shadow-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-extrabold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded tracking-wider">
                        PREMIUM
                      </span>
                      <h3 className="text-lg font-bold text-amber-400 mt-2">1 Bulan</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-amber-400 font-mono">Rp 30.000</span>
                      <span className="text-[10px] text-slate-400 block">/ bulan</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pilihan fleksibel terbaik untuk riset akademis, pengerjaan tesis, atau penelaahan mendalam bulanan.
                  </p>
                  
                  <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">✓</span> Evaluasi E-Tahsin Tanpa Batas Kuota
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">✓</span> Kajian Mendalam (Deep Research) Premium
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">✓</span> Integrasi & Simpan ke Google Drive Aman
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">✓</span> RAG AI Rujukan Berkecepatan Tinggi
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 line-through">
                      <span>✗</span> Lencana Profil Emas Eksklusif
                    </div>
                  </div>
                </div>
                
                <div className="pt-6">
                  {userProfile && userProfile.tier === "Berbayar" && userProfile.billingCycle === "Bulanan" ? (
                    <button className="w-full py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold rounded-xl text-xs cursor-default" disabled>
                      ✓ Paket Aktif Saat Ini
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setRegSelectedPlan("Bulanan");
                        setRegPaymentStep("select");
                        if (!userProfile) {
                          setLoginTierSelection("Berbayar_Bulanan");
                          setShowLoginModal(true);
                        } else {
                          document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`w-full py-2 font-bold rounded-xl text-xs transition-all ${
                        regSelectedPlan === "Bulanan" && userProfile
                          ? "bg-amber-600 hover:bg-amber-500 text-white shadow-md"
                          : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      }`}
                    >
                      {userProfile ? "Pilih Paket Bulanan" : "Daftar & Berlangganan"}
                    </button>
                  )}
                </div>
              </div>

              {/* Paket Platinum (1 Tahun) */}
              <div className="bg-slate-900 rounded-2xl border border-purple-500/30 p-6 flex flex-col justify-between relative overflow-hidden transition-all hover:border-purple-500/40 shadow-2xl">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-500 text-[9px] font-extrabold text-white px-3 py-1 rounded-bl font-sans tracking-wide uppercase shadow">
                  Hemat 16% ⭐ Best Value
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-start pt-2">
                    <div>
                      <span className="text-[9px] font-extrabold text-purple-400 uppercase bg-purple-500/10 px-2 py-0.5 rounded tracking-wider">
                        PLATINUM
                      </span>
                      <h3 className="text-lg font-bold text-purple-400 mt-2">1 Tahun</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-purple-400 font-mono">Rp 300.000</span>
                      <span className="text-[10px] text-slate-400 block">/ tahun</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Keanggotaan komprehensif bagi akademisi, ustadz, peneliti, dan pecinta Al-Qur'an sepanjang tahun.
                  </p>
                  
                  <div className="border-t border-slate-800/80 pt-4 space-y-2.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">✓</span> Semua Fitur Premium
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">✓</span> Biaya Jauh Lebih Murah (Setara 25K/bln)
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">✓</span> Lencana Profil Platinum Eksklusif
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">✓</span> Prioritas Akses Server Pembelajaran Utama
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-purple-400 font-bold">✓</span> Pendampingan Setup API Lintas Platform
                    </div>
                  </div>
                </div>
                
                <div className="pt-6">
                  {userProfile && userProfile.tier === "Berbayar" && userProfile.billingCycle === "Tahunan" ? (
                    <button className="w-full py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold rounded-xl text-xs cursor-default" disabled>
                      ✓ Paket Aktif Saat Ini
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setRegSelectedPlan("Tahunan");
                        setRegPaymentStep("select");
                        if (!userProfile) {
                          setLoginTierSelection("Berbayar_Tahunan");
                          setShowLoginModal(true);
                        } else {
                          document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`w-full py-2 font-bold rounded-xl text-xs transition-all ${
                        regSelectedPlan === "Tahunan" && userProfile
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg"
                          : "bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
                      }`}
                    >
                      {userProfile ? "Pilih Paket Tahunan" : "Daftar & Berlangganan"}
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* ═══════════ TABEL PERBANDINGAN FITUR ═══════════ */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center gap-3">
                <span className="text-sm font-bold text-slate-200">📋 Perbandingan Fitur Reguler vs Premium vs Platinum</span>
                <span className="text-[10px] text-slate-500">Pilih paket yang sesuai dengan kebutuhan Anda</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <th className="text-left p-3 font-bold text-slate-300 uppercase tracking-wider w-[30%]">Fitur</th>
                      <th className="text-center p-3 font-bold text-slate-400 uppercase tracking-wider bg-slate-800/20 w-[18%]">
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-400">REGULER</span>
                        <div className="text-[9px] font-normal text-slate-500 mt-0.5">Gratis</div>
                      </th>
                      <th className="text-center p-3 font-bold text-amber-400 uppercase tracking-wider w-[18%]">
                        <span className="px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 text-amber-400">PREMIUM</span>
                        <div className="text-[9px] font-normal text-amber-500/70 mt-0.5">1 Bulan</div>
                      </th>
                      <th className="text-center p-3 font-bold text-purple-400 uppercase tracking-wider w-[18%]">
                        <span className="px-2 py-0.5 bg-purple-500/10 rounded border border-purple-500/20 text-purple-400">PLATINUM</span>
                        <div className="text-[9px] font-normal text-purple-500/70 mt-0.5">1 Tahun</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {[
                      { fitur: "Evaluasi E-Tahsin", reguler: "✅ 5x/hari", premium: "✅ Tanpa Batas", platinum: "✅ Tanpa Batas" },
                      { fitur: "Huruf Hijaiyah & Makhraj", reguler: "✅ Penuh", premium: "✅ Penuh", platinum: "✅ Penuh" },
                      { fitur: "Tanya Jawab Tafsir", reguler: "✅ Standard", premium: "✅ RAG AI", platinum: "✅ RAG AI" },
                      { fitur: "Digital Library", reguler: "✅ View", premium: "✅ Full", platinum: "✅ Full" },
                      { fitur: "Deep Research", reguler: "🔒", premium: "✅ Tanpa Batas", platinum: "✅ Tanpa Batas" },
                      { fitur: "Google Drive Sync", reguler: "🔒", premium: "✅ Aktif", platinum: "✅ Aktif" },
                      { fitur: "RAG AI Cepat", reguler: "🔒", premium: "✅ Aktif", platinum: "✅ Aktif" },
                      { fitur: "Lencana Eksklusif", reguler: "🔒", premium: "🔒", platinum: "✅ Platinum" },
                      { fitur: "Prioritas Server", reguler: "🔒", premium: "🔒", platinum: "✅ Utama" },
                      { fitur: "Support Setup API", reguler: "🔒", premium: "🔒", platinum: "✅ Prioritas" },
                    ].map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-slate-950/20'}>
                        <td className="p-2.5 font-medium text-slate-200">{row.fitur}</td>
                        <td className="p-2.5 text-center bg-slate-800/10 text-[10px]">{row.reguler}</td>
                        <td className="p-2.5 text-center text-[10px]">{row.premium}</td>
                        <td className="p-2.5 text-center font-medium text-[10px]">{row.platinum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                <span>🔒 = Fitur eksklusif Premium &bull; ✅ = Tersedia di paket</span>
                <span className="text-emerald-400 font-mono">Update: {new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            {/* Panel Checkout Registrasi & Pembayaran Interaktif */}
            {(regPaymentStep === "select" || regPaymentStep === "processing") && regPaymentStep !== "upload-proof" && regPaymentStep !== "verifying" && regPaymentStep !== "success" ? (
              <div id="payment-form" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-emerald-400 opacity-60"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" /> Formulir Registrasi & Transaksi Premium
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tinjau pilihan paket berlangganan Anda, masukkan kode promo jika ada, dan pilih metode transaksi aman.
                    </p>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
                    <div className="text-[9px] font-mono text-slate-500 uppercase">Paket Terpilih</div>
                    <div className="text-xs font-extrabold text-amber-400">
                      {regSelectedPlan === "Tahunan" ? "PLATINUM (1 Tahun)" : "PREMIUM (1 Bulan)"}
                    </div>
                  </div>
                </div>

                {/* Form Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bagian 1: Identitas Keanggotaan */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Detail Pelanggan</h4>
                    
                    {userProfile && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 font-sans text-xs">
                          {userProfile.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-200">Sesi Terdeteksi: {userProfile.displayName}</div>
                          <div className="text-[9px] text-slate-400 font-mono">{userProfile.email}</div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">Nama Lengkap</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Muhammad Rival" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-1 ring-amber-500/50"
                          value={regManualName}
                          onChange={(e) => setRegManualName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">Pekerjaan</label>
                        <input 
                          type="text" 
                          placeholder="Contoh: Dosen, Mahasiswa, Peneliti, Umum" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-1 ring-amber-500/50"
                          value={regManualPekerjaan}
                          onChange={(e) => setRegManualPekerjaan(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">Nomor HP</label>
                        <input 
                          type="tel" 
                          placeholder="Contoh: 081234567890" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-1 ring-amber-500/50"
                          value={regManualPhone}
                          onChange={(e) => setRegManualPhone(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400">Alamat Email</label>
                        <input 
                          type="email" 
                          placeholder="Contoh: rival@gmail.com" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-1 ring-amber-500/50"
                          value={regManualEmail}
                          onChange={(e) => setRegManualEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-400 flex justify-between">
                          <span>Kata Sandi (Password)</span>
                          <span className="text-[10px] text-amber-400 font-mono">*Wajib</span>
                        </label>
                        <input 
                          type="password" 
                          placeholder="Masukkan password aman Anda" 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-1 ring-amber-500/50"
                          value={regManualPassword}
                          onChange={(e) => setRegManualPassword(e.target.value)}
                        />
                        
                        {/* Password Requirements Checklist */}
                        <div className="mt-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80 space-y-1 text-[10px]">
                          <div className="text-slate-400 font-bold mb-1 uppercase tracking-wider font-mono">Persyaratan Password:</div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className={regManualPassword.length >= 8 ? "text-emerald-400 font-bold" : "text-slate-600"}>
                                {regManualPassword.length >= 8 ? "✓" : "○"}
                              </span>
                              <span className={regManualPassword.length >= 8 ? "text-slate-300" : "text-slate-500"}>Min. 8 Karakter</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={/\d/.test(regManualPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>
                                {/\d/.test(regManualPassword) ? "✓" : "○"}
                              </span>
                              <span className={/\d/.test(regManualPassword) ? "text-slate-300" : "text-slate-500"}>Ada Angka (0-9)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={/[A-Z]/.test(regManualPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>
                                {/[A-Z]/.test(regManualPassword) ? "✓" : "○"}
                              </span>
                              <span className={/[A-Z]/.test(regManualPassword) ? "text-slate-300" : "text-slate-500"}>Ada Huruf Besar (A-Z)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={/[a-z]/.test(regManualPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>
                                {/[a-z]/.test(regManualPassword) ? "✓" : "○"}
                              </span>
                              <span className={/[a-z]/.test(regManualPassword) ? "text-slate-300" : "text-slate-500"}>Ada Huruf Kecil (a-z)</span>
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2">
                              <span className={/[^A-Za-z0-9]/.test(regManualPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>
                                {/[^A-Za-z0-9]/.test(regManualPassword) ? "✓" : "○"}
                              </span>
                              <span className={/[^A-Za-z0-9]/.test(regManualPassword) ? "text-slate-300" : "text-slate-500"}>Ada Simbol (contoh: @, #, $, %, dll)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        {userProfile 
                          ? "*Informasi pendaftaran ini akan disinkronkan ke database akun premium Anda secara instan."
                          : "*Setelah pendaftaran, Anda disarankan untuk masuk menggunakan akun Google Anda untuk kemudahan sinkronisasi data lintas perangkat."
                        }
                      </p>
                    </div>

                    {/* Kupon Promo Code */}
                    <div className="space-y-2 pt-2">
                      <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <Tag size={12} className="text-amber-400" /> Punya Kode Promo? (Coba: <span className="text-emerald-400 font-mono">RAMADHAN</span>)
                      </label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Masukkan Kode Voucher" 
                          className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none flex-1 focus:ring-1 ring-amber-500/50 uppercase tracking-widest"
                          value={regPromoCode}
                          onChange={(e) => setRegPromoCode(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const code = regPromoCode.trim().toUpperCase();
                            if (code === "RAMADHAN") {
                              setRegAppliedDiscount(10);
                              setRegPromoFeedback("✓ Berhasil menerapkan diskon Ramadan 10%!");
                            } else if (code === "MUDIK") {
                              setRegAppliedDiscount(15);
                              setRegPromoFeedback("✓ Mudik Berkah! Diskon 15% berhasil terpasang.");
                            } else if (code) {
                              setRegAppliedDiscount(0);
                              setRegPromoFeedback("✗ Kode promo tidak valid atau sudah kedaluwarsa.");
                            }
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-700"
                        >
                          Terapkan
                        </button>
                      </div>
                      {regPromoFeedback && (
                        <div className={`text-[10px] font-bold ${regAppliedDiscount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {regPromoFeedback}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Bagian 2: Metode Pembayaran Aman */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Metode Pembayaran</h4>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Opsi QRIS */}
                      <div 
                        onClick={() => setRegPaymentMethod("QRIS")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                          regPaymentMethod === "QRIS"
                            ? "bg-slate-950 border-amber-500 text-slate-100"
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-750"
                        }`}
                      >
                        <QrCode size={16} className="text-amber-500" />
                        <div className="text-left">
                          <div className="text-xs font-bold font-sans">QRIS</div>
                          <div className="text-[9px] text-slate-500">Scan QR Instan</div>
                        </div>
                      </div>

                      {/* Opsi BCA Transfer */}
                      <div 
                        onClick={() => setRegPaymentMethod("BCA")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                          regPaymentMethod === "BCA"
                            ? "bg-slate-950 border-amber-500 text-slate-100"
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-750"
                        }`}
                      >
                        <CreditCard size={16} className="text-blue-400" />
                        <div className="text-left">
                          <div className="text-xs font-bold font-sans">BCA Transfer</div>
                          <div className="text-[9px] text-slate-500">Transfer Bank</div>
                        </div>
                      </div>

                      {/* Opsi DANA Transfer */}
                      <div 
                        onClick={() => setRegPaymentMethod("DANA")}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-2 ${
                          regPaymentMethod === "DANA"
                            ? "bg-slate-950 border-amber-500 text-slate-100"
                            : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-750"
                        }`}
                      >
                        <Globe size={16} className="text-teal-400" />
                        <div className="text-left">
                          <div className="text-xs font-bold font-sans">DANA</div>
                          <div className="text-[9px] text-slate-500">E-Wallet Transfer</div>
                        </div>
                      </div>
                    </div>

                    {/* Rincian Harga Akhir */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs space-y-2 font-sans text-slate-300">
                      <div className="flex justify-between">
                        <span>Harga Langganan ({regSelectedPlan})</span>
                        <span className="font-mono">{regSelectedPlan === "Tahunan" ? "Rp 300.000" : "Rp 30.000"}</span>
                      </div>
                      
                      {regAppliedDiscount > 0 && (
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Diskon Promo ({regAppliedDiscount}%)</span>
                          <span className="font-mono">-{regSelectedPlan === "Tahunan" ? `Rp ${(300000 * regAppliedDiscount / 100).toLocaleString("id-ID")}` : `Rp ${(30000 * regAppliedDiscount / 100).toLocaleString("id-ID")}`}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-500">
                        <span>Pajak (PPN 11% - Terintegrasi)</span>
                        <span className="font-mono">Rp 0 (Ditanggung)</span>
                      </div>

                      <div className="border-t border-slate-800/80 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-200">
                        <span>Total Pembayaran</span>
                        <span className="text-lg text-amber-400 font-mono">
                          Rp {
                            regSelectedPlan === "Tahunan" 
                              ? (300000 - (300000 * regAppliedDiscount / 100)).toLocaleString("id-ID")
                              : (30000 - (30000 * regAppliedDiscount / 100)).toLocaleString("id-ID")
                          }
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* QRIS Payment Display */}
                {regPaymentMethod === "QRIS" && regPaymentStep === "select" && regSelectedPlan !== "Reguler" && (
                  <div className="bg-slate-950 border border-amber-500/20 rounded-xl p-6 space-y-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <QrCode size={20} className="text-amber-400" />
                      <span className="text-sm font-bold text-amber-400">Scan QRIS untuk Pembayaran</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl inline-block mx-auto shadow-lg">
                      <img src="/qris-payment.jpg" alt="QRIS Payment" className="w-48 h-48 object-contain" />
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-sm mx-auto">
                      Buka aplikasi e-wallet atau mobile banking Anda (GoPay, OVO, DANA, BCA, Mandiri, dll), pindai kode QR di atas, dan selesaikan pembayaran.
                    </p>
                    <p className="text-[11px] font-bold text-slate-300">
                      Total: <span className="text-amber-400 font-mono text-base">
                        Rp {regSelectedPlan === "Tahunan" 
                          ? (300000 - (300000 * regAppliedDiscount / 100)).toLocaleString("id-ID")
                          : (30000 - (30000 * regAppliedDiscount / 100)).toLocaleString("id-ID")}
                      </span>
                    </p>
                  </div>
                )}

                {/* Transfer Bank/E-Wallet Display */}
                {(regPaymentMethod === "BCA" || regPaymentMethod === "DANA") && regPaymentStep === "select" && regSelectedPlan !== "Reguler" && (
                  <div className="bg-slate-950 border border-blue-500/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <CreditCard size={18} className={regPaymentMethod === "BCA" ? "text-blue-400" : "text-teal-400"} />
                      <span className="text-sm font-bold text-slate-200">
                        Transfer ke {regPaymentMethod === "BCA" ? "BCA" : "DANA"}
                      </span>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                      {regPaymentMethod === "BCA" ? (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Bank</span>
                            <span className="text-sm font-bold text-blue-400">BCA</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">No. Rekening</span>
                            <span className="text-base font-mono font-bold text-slate-100 tracking-wider">7753050282</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Pemilik</span>
                            <span className="text-sm font-bold text-slate-200">Rinal Zamzam Elhasbi</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">E-Wallet</span>
                            <span className="text-sm font-bold text-teal-400">DANA</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">No. HP</span>
                            <span className="text-base font-mono font-bold text-slate-100 tracking-wider">085159552762</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">Pemilik</span>
                            <span className="text-sm font-bold text-slate-200">Rinal Zamzam Elhasbi</span>
                          </div>
                        </>
                      )}
                      <div className="border-t border-slate-700 pt-2">
                        <p className="text-[11px] font-bold text-slate-300">
                          Total Transfer: <span className="text-amber-400 font-mono text-base">
                            Rp {regSelectedPlan === "Tahunan" 
                              ? (300000 - (300000 * regAppliedDiscount / 100)).toLocaleString("id-ID")
                              : (30000 - (30000 * regAppliedDiscount / 100)).toLocaleString("id-ID")}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Setelah transfer, klik tombol di bawah. Tim kami akan verifikasi dan mengaktifkan akun Premium Anda.
                    </p>
                  </div>
                )}
                {regErrorFeedback && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs text-center">
                    {regErrorFeedback}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80 flex flex-col items-center">
                  {regPaymentStep === "processing" ? (
                    <button disabled className="w-full max-w-md py-3.5 bg-slate-800 text-slate-400 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 cursor-not-allowed">
                      <RefreshCw size={14} className="animate-spin text-amber-400" /> Memproses Transaksi Aman & Menyinkronkan Profil...
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        setRegErrorFeedback(null);
                        
                        // Validasi input
                        if (!regManualName.trim()) {
                          setRegErrorFeedback("Silakan isi nama lengkap Anda.");
                          return;
                        }
                        if (!regManualPekerjaan.trim()) {
                          setRegErrorFeedback("Silakan isi pekerjaan Anda.");
                          return;
                        }
                        if (!regManualPhone.trim()) {
                          setRegErrorFeedback("Silakan isi nomor HP/WhatsApp Anda.");
                          return;
                        }
                        if (!regManualEmail.trim()) {
                          setRegErrorFeedback("Silakan isi alamat email Anda.");
                          return;
                        }
                        if (!regManualEmail.includes("@")) {
                          setRegErrorFeedback("Alamat email tidak valid.");
                          return;
                        }
                        
                        // Validasi Password Keamanan Tinggi
                        if (!regManualPassword) {
                          setRegErrorFeedback("Silakan isi kata sandi (password) Anda.");
                          return;
                        }
                        if (regManualPassword.length < 8) {
                          setRegErrorFeedback("Kata sandi harus minimal terdiri dari 8 karakter.");
                          return;
                        }
                        if (!/\d/.test(regManualPassword)) {
                          setRegErrorFeedback("Kata sandi wajib mengandung setidaknya satu angka (0-9).");
                          return;
                        }
                        if (!/[A-Z]/.test(regManualPassword)) {
                          setRegErrorFeedback("Kata sandi wajib mengandung setidaknya satu huruf besar (A-Z).");
                          return;
                        }
                        if (!/[a-z]/.test(regManualPassword)) {
                          setRegErrorFeedback("Kata sandi wajib mengandung setidaknya satu huruf kecil (a-z).");
                          return;
                        }
                        if (!/[^A-Za-z0-9]/.test(regManualPassword)) {
                          setRegErrorFeedback("Kata sandi wajib mengandung setidaknya satu simbol.");
                          return;
                        }

                        setRegPaymentStep("processing");

                        // Hitung total
                        const totalAmount = regSelectedPlan === "Tahunan" 
                          ? (300000 - (300000 * regAppliedDiscount / 100))
                          : (30000 - (30000 * regAppliedDiscount / 100));

                        // Buat pending payment di backend
                        try {
                          const payRes = await fetch("/api/payment/create", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              email: regManualEmail.trim().toLowerCase(),
                              displayName: regManualName.trim(),
                              amount: totalAmount,
                              method: regPaymentMethod,
                              billingCycle: regSelectedPlan
                            })
                          });
                          const payData = await payRes.json();
                          if (payData.ok) {
                            setRegPaymentData(payData.payment);
                            setRegPaymentStep("upload-proof");
                            setRegProofImage(null);
                            setRegAiResult(null);
                          } else {
                            throw new Error(payData.error || "Gagal membuat pembayaran");
                          }
                        } catch (err: any) {
                          setRegErrorFeedback(`Gagal: ${err.message}`);
                          setRegPaymentStep("select");
                        }
                      }}
                      className="w-full max-w-md py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck size={16} /> Konfirmasi Registrasi & Selesaikan Transaksi
                    </button>
                  )}
                  <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed max-w-md">
                    *Setelah menekan tombol, Anda akan diminta mengunggah bukti transfer. AI kami akan memverifikasi pembayaran. Akun Premium hanya aktif setelah verifikasi berhasil.
                  </p>
                </div>

              </div>
            ) : (regPaymentStep === "upload-proof" || regPaymentStep === "verifying") ? (
              /* UPLOAD BUKTI TRANSFER + AI VERIFICATION */
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-emerald-400 opacity-60"></div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <UploadCloud size={14} className="text-amber-400" /> Upload Bukti Transfer
                    </h3>
                    <p className="text-xs text-slate-500">
                      ID: <code className="bg-slate-950 px-2 py-0.5 rounded text-amber-400">{regPaymentData?.id}</code>
                    </p>
                  </div>
                  <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-right">
                    <div className="text-[9px] font-mono text-slate-500 uppercase">Total</div>
                    <div className="text-xs font-extrabold text-amber-400">
                      Rp {regPaymentData?.amount?.toLocaleString("id-ID") || "—"}
                    </div>
                  </div>
                </div>

                {/* Detail pembayaran */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Metode</span><span className="font-bold text-slate-300">{regPaymentMethod}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Paket</span><span className="font-bold text-amber-400">PREMIUM {regPaymentData?.billingCycle?.toUpperCase()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Jumlah</span><span className="font-bold text-slate-200">Rp {regPaymentData?.amount?.toLocaleString("id-ID")}</span></div>
                  {regPaymentMethod === "BCA" && (
                    <div className="flex justify-between"><span className="text-slate-500">Tujuan</span><span className="font-mono text-emerald-400">BCA 7753050282 a.n. RINAL ZAMZAM ELHASBI</span></div>
                  )}
                  {regPaymentMethod === "DANA" && (
                    <div className="flex justify-between"><span className="text-slate-500">Tujuan</span><span className="font-mono text-emerald-400">DANA 085159552762 a.n. RINAL ZAMZAM ELHASBI</span></div>
                  )}
                  {regPaymentMethod === "QRIS" && (
                    <div className="flex justify-between"><span className="text-slate-500">Tujuan</span><span className="font-mono text-emerald-400">QRIS — Quranica AI</span></div>
                  )}
                  <div className="border-t border-slate-800 pt-2 mt-2">
                    <p className="text-amber-400 text-[10px]">
                      📸 Upload screenshot bukti transfer Anda. AI kami akan memverifikasi otomatis.
                    </p>
                  </div>
                </div>

                {/* Upload Area */}
                {regPaymentStep === "upload-proof" && (
                  <div className="space-y-4">
                    <label className="block w-full cursor-pointer">
                      <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-2xl p-8 text-center transition-all group">
                        {regProofImage ? (
                          <div className="space-y-3">
                            <img src={`data:image/jpeg;base64,${regProofImage}`} alt="Bukti Transfer" className="max-h-64 mx-auto rounded-xl border border-slate-700 shadow-lg" />
                            <p className="text-xs text-emerald-400 font-bold">✅ Gambar berhasil diunggah</p>
                            <button onClick={(e) => { e.preventDefault(); setRegProofImage(null); setRegAiResult(null); }} className="text-[10px] text-slate-500 hover:text-red-400 underline">Ganti gambar</button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <UploadCloud size={40} className="mx-auto text-slate-600 group-hover:text-amber-400 transition-colors" />
                            <p className="text-xs text-slate-400 font-bold">Klik untuk upload screenshot bukti transfer</p>
                            <p className="text-[10px] text-slate-600">PNG, JPG, atau WEBP (maks 5MB)</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) {
                              setRegErrorFeedback("Ukuran file maksimal 5MB.");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = () => {
                              const base64 = (reader.result as string).split(",")[1];
                              setRegProofImage(base64);
                              setRegAiResult(null);
                              setRegErrorFeedback(null);
                            };
                            reader.readAsDataURL(file);
                          }}
                        />
                      </div>
                    </label>

                    {regProofImage && (
                      <button
                        onClick={async () => {
                          if (!regProofImage || !regPaymentData) return;
                          setRegPaymentStep("verifying");
                          setRegErrorFeedback(null);
                          try {
                            const res = await fetch("/api/payment/verify-proof", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                paymentId: regPaymentData.id,
                                imageBase64: regProofImage,
                                userEmail: regManualEmail || userProfile?.email
                              })
                            });
                            const data = await res.json();
                            setRegAiResult(data);
                            if (data.confirmed) {
                              // Set user profile dari data yang dikembalikan backend
                              if (userProfile) {
                                await syncUserProfileWithBackend(userProfile, "Berbayar", regPaymentData.billingCycle);
                              } else if (data.user) {
                                // Manual user — set profile dari respons backend
                                const manualProfile = {
                                  ...data.user,
                                  role: data.user.role || "User",
                                  pekerjaan: regManualPekerjaan || "",
                                  phone: regManualPhone || "",
                                  password: regManualPassword || ""
                                };
                                setUserProfile(manualProfile);
                                saveUserWithExpiry(manualProfile);
                                localStorage.setItem(`quranica_tier_${data.user.uid}`, "Berbayar");
                                if (data.user.billingCycle) {
                                  localStorage.setItem(`quranica_cycle_${data.user.uid}`, data.user.billingCycle);
                                }
                              }
                              setRegPaymentStep("success");
                            } else {
                              setRegPaymentStep("upload-proof");
                              setRegErrorFeedback(data.analysis?.summary || data.message || "Verifikasi gagal");
                            }
                          } catch (err: any) {
                            setRegPaymentStep("upload-proof");
                            setRegErrorFeedback(`Gagal: ${err.message}`);
                          }
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Wand2 size={16} /> Verifikasi dengan AI
                      </button>
                    )}
                    
                    <button
                      onClick={() => { setRegPaymentStep("select"); setRegPaymentData(null); setRegProofImage(null); setRegAiResult(null); }}
                      className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold transition-all"
                    >
                      ← Kembali
                    </button>
                  </div>
                )}

                {/* Verifying spinner */}
                {regPaymentStep === "verifying" && (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <Wand2 size={48} className="text-amber-400 animate-pulse" />
                    <p className="text-sm font-bold text-slate-300">AI sedang menganalisis bukti transfer...</p>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "-0.3s" }}></span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: "-0.15s" }}></span>
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
                    </div>
                    <p className="text-[10px] text-slate-500">Memeriksa nominal, rekening tujuan, dan keaslian bukti</p>
                  </div>
                )}

                {/* AI Result (not confirmed) */}
                {regAiResult && !regAiResult.confirmed && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-red-400 font-bold">
                      <AlertCircle size={14} /> Verifikasi Gagal
                    </div>
                    <p className="text-slate-400">{regAiResult.analysis?.summary || regAiResult.message}</p>
                    {regAiResult.analysis?.red_flags?.length > 0 && (
                      <div className="mt-1 space-y-1">
                        <span className="text-red-400 font-bold">Masalah terdeteksi:</span>
                        <ul className="list-disc list-inside text-slate-500 space-y-0.5">
                          {regAiResult.analysis.red_flags.map((f: string, i: number) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                    {regAiResult.analysis && (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
                        <div><span className="text-slate-600">Nominal cocok:</span> <span className={regAiResult.analysis.amount_match ? "text-emerald-400" : "text-red-400"}>{regAiResult.analysis.amount_match ? "✅" : "❌"}</span></div>
                        <div><span className="text-slate-600">Rekening cocok:</span> <span className={regAiResult.analysis.account_match ? "text-emerald-400" : "text-red-400"}>{regAiResult.analysis.account_match ? "✅" : "❌"}</span></div>
                        <div><span className="text-slate-600">Confidence:</span> <span className="font-mono text-amber-400">{regAiResult.analysis.confidence}%</span></div>
                        <div><span className="text-slate-600">Terdeteksi:</span> <span className="font-mono text-slate-400">{regAiResult.analysis.detected_amount || "—"}</span></div>
                      </div>
                    )}
                    <button
                      onClick={() => { setRegAiResult(null); setRegProofImage(null); }}
                      className="w-full py-2 mt-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition-all"
                    >
                      Coba Upload Ulang
                    </button>
                  </div>
                )}

                {regErrorFeedback && !regAiResult && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400 flex items-start gap-2">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" /> {regErrorFeedback}
                  </div>
                )}
              </div>
            ) : (
              /* Success Animated screen */
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 md:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400 shadow animate-bounce">
                  <Crown size={32} className="fill-emerald-400/10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-100">✅ Pembayaran Terverifikasi — Akun Premium Aktif</h3>
                  <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
                    Bukti transfer Anda telah diverifikasi oleh AI. Pembayaran melalui <span className="font-extrabold text-amber-400">{regPaymentMethod}</span> telah dikonfirmasi.
                  </p>
                  {regAiResult?.analysis && (
                    <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                      <CheckCircle size={12} className="text-emerald-400" />
                      <span className="text-[10px] font-mono text-emerald-400">AI Confidence: {regAiResult.analysis.confidence}%</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-950 max-w-md mx-auto p-5 rounded-2xl border border-slate-800 text-xs text-left space-y-3 font-sans text-slate-300 shadow-inner">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Transaksi</span>
                    <span className="font-mono text-amber-400">{regPaymentData?.id || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pelanggan</span>
                    <span className="font-semibold text-slate-200">{regManualName || userProfile?.displayName || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Email</span>
                    <span className="font-mono text-slate-400">{regManualEmail || userProfile?.email || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paket</span>
                    <span className="font-extrabold text-amber-400 uppercase tracking-wider">
                      ⭐ PREMIUM {regPaymentData?.billingCycle || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumlah</span>
                    <span className="font-semibold text-slate-300">Rp {regPaymentData?.amount?.toLocaleString("id-ID") || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode</span>
                    <span className="font-semibold text-slate-300">{regPaymentMethod}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-slate-200 font-extrabold">
                    <span>Status</span>
                    <span className="text-emerald-400 uppercase tracking-widest font-mono text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">TERVERIFIKASI</span>
                  </div>
                </div>

                  <div className="pt-2 flex flex-col md:flex-row justify-center gap-3">
                  <button
                  onClick={() => {
                    setActiveTab("tahsin");
                  }}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md"
                  >
                    Mulai Belajar E-Tahsin 🎙️
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("research");
                    }}
                    className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-855 rounded-xl text-xs font-bold transition-all"
                  >
                    Gunakan Kajian Deep Research 📖
                  </button>
                  <button
                    onClick={() => {
                      setRegPaymentStep("select");
                    }}
                    className="px-4 py-2.5 text-slate-500 hover:text-slate-300 text-xs font-bold transition-all"
                  >
                    Daftar Ulang / Ganti Paket
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Deskripsi Reference Network */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-50"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Globe size={11} className="animate-pulse" /> REFERENCE NETWORK & DIGITAL LIBRARY
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2 font-sans">
                    <BookOpen className="text-emerald-400" size={24} /> Reference Network & Digital Library
                  </h2>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-3xl">
                    Akses instan ke 160+ portal ilmiah resmi, repositori PTKIN, jurnal terindeks Scopus, dan perpustakaan digital terkemuka. Terintegrasi dengan AI Quranica sebagai basis data rujukan primer.
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 self-start md:self-auto shadow-inner">
                  <div className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {filteredLibraries.length} / {primaryLibraries.length} ACTIVE REFERENCES
                  </span>
                </div>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800/80 w-full max-w-xl shadow-inner">
              <button
                type="button"
                onClick={() => setLibraryMode('browse')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  libraryMode === 'browse'
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen size={14} />
                Telusuri Katalog ({primaryLibraries.length})
              </button>
              <button
                type="button"
                onClick={() => setLibraryMode('ai-search')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  libraryMode === 'ai-search'
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles size={14} className={libraryMode === 'ai-search' ? "" : "text-emerald-400"} />
                Pencarian AI Kontekstual
              </button>
              <button
                type="button"
                onClick={() => setLibraryMode('drive-sync')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  libraryMode === 'drive-sync'
                    ? 'bg-emerald-600 text-white shadow-md border border-emerald-500/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cloud size={14} className={libraryMode === 'drive-sync' ? "" : "text-emerald-400"} />
                Sinkronisasi Google Drive
              </button>
            </div>

            {libraryMode === 'browse' ? (
              <>
                {/* Search Bar & Kategori Filter */}
                <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    
                    {/* Kolom Pencarian */}
                    <div className="relative w-full md:max-w-md">
                      <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                      <input 
                        type="text"
                        placeholder="Cari rujukan, nama kitab, penulis, atau kata kunci..."
                        value={librarySearchQuery}
                        onChange={(e) => setLibrarySearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl pl-11 pr-10 py-3 text-sm text-slate-200 outline-none transition-all shadow-inner focus:ring-2 ring-emerald-500/10"
                      />
                      {librarySearchQuery && (
                        <button 
                          onClick={() => setLibrarySearchQuery("")}
                          className="absolute right-3.5 top-3.5 text-xs text-slate-500 hover:text-slate-300 font-bold font-sans"
                        >
                          Batal
                        </button>
                      )}
                    </div>

                    {/* Filter Kategori */}
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      {['Semua', 'Situs & Program', 'Akademik', 'Unduh PDF', 'Telegram', 'Portal & Jurnal'].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedLibCat(cat)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            selectedLibCat === cat 
                              ? 'bg-emerald-600 text-white shadow-md border-emerald-500' 
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Grid List Rujukan */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLibraries.map((lib: any) => {
                    const isCopied = copiedLinkId === lib.id;
                    return (
                      <div 
                        key={lib.id}
                        className="bg-slate-900 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:shadow-emerald-950/5 flex flex-col justify-between group"
                      >
                        <div className="space-y-3.5">
                          {/* Header Card */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="p-2 bg-slate-950 rounded-xl border border-slate-800/60 text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all">
                              <BookOpen size={18} />
                            </div>
                            <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 uppercase">
                              {lib.category || 'Pustaka'}
                            </span>
                          </div>

                          {/* Detail Kitab / Rujukan */}
                          <div>
                            <h3 className="font-bold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors leading-snug">
                              {lib.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5 font-sans">
                              Karya / Penerbit: <span className="text-slate-300 font-semibold">{lib.author}</span>
                            </p>
                          </div>

                          {/* Deskripsi */}
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                            {lib.content}
                          </p>

                          {/* Info Lokasi Rujukan */}
                          {lib.locationDetail && (
                            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-900/60 text-[10px] text-slate-500 flex items-center gap-1.5 leading-snug">
                              <Globe size={11} className="text-emerald-500 shrink-0" /> Download Research (.md)
                              <span className="truncate">{lib.locationDetail}</span>
                            </div>
                          )}
                        </div>

                        {/* Action Panel */}
                        <div className="mt-5 pt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              const link = getDirectExternalLink("/ref/" + lib.id);
                              navigator.clipboard.writeText(link);
                              setCopiedLinkId(lib.id);
                              setTimeout(() => setCopiedLinkId(null), 1500);
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                              isCopied 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {isCopied ? "Tersalin!" : "Salin Link"}
                          </button>

                          <a 
                            href={getDirectExternalLink("/ref/" + lib.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3.5 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500 transition-all flex items-center gap-1"
                          >
                            Kunjungi Portal &rarr;
                          </a>
                        </div>

                      </div>
                    );
                  })}

                  {filteredLibraries.length === 0 && (
                    <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl py-12 px-4 text-center space-y-3">
                      <div className="p-3 bg-slate-950 inline-block rounded-full border border-slate-800 text-slate-500">
                        <Search size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-300 font-sans">Tidak ada rujukan yang cocok</h4>
                        <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci lain seperti "shamela", "hadits", atau "tafsir".</p>
                      </div>
                      <button 
                        onClick={() => {
                          setLibrarySearchQuery("");
                          setSelectedLibCat("Semua");
                        }}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline font-sans"
                      >
                        Reset Filter & Pencarian
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : libraryMode === 'ai-search' ? (
              /* AI SEARCH CONTEXT SCREEN */
              <div className="space-y-6">
                {/* AI Search Panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <Sparkles size={24} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-100 font-sans text-lg">Pencarian Referensi Berbasis AI</h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                        Ketikkan topik, teks, atau pertanyaan kajian Anda (misal: "Hadits ziarah kubur" atau "Syarah hadits Bukhari oleh Ibnu Hajar"). AI akan menyaring database 491+ rujukan klasik secara kontekstual, merangkumnya, dan menyertakan link rujukan resmi.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleLibraryAiSearch} className="space-y-3.5">
                    <div className="relative">
                      <textarea
                        value={aiSearchQuery}
                        onChange={(e) => setAiSearchQuery(e.target.value)}
                        placeholder="Masukkan konteks pencarian Anda di sini... (Contoh: Berikan saya rekomendasi kitab yang membicarakan asbabun nuzul dan link untuk mengaksesnya secara online)"
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3.5 text-sm text-slate-200 outline-none transition-all shadow-inner focus:ring-2 ring-emerald-500/10 resize-none font-sans"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                        <Database size={11} className="text-emerald-500 animate-pulse" />
                        Terhubung ke Database Pustaka Mahasiswa Cungkring
                      </div>
                      <button
                        type="submit"
                        disabled={aiSearchLoading || !aiSearchQuery.trim()}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                          aiSearchLoading || !aiSearchQuery.trim()
                            ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/20'
                        }`}
                      >
                        {aiSearchLoading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            Mencari Pustaka...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Cari Referensi AI &rarr;
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* AI Search Result Panel */}
                {(aiSearchResult || aiSearchLoading || aiSearchError) && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: AI Answer */}
                    <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                        <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Activity size={15} className="text-emerald-400" /> Rekomendasi Rujukan AI
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800/80 px-2.5 py-1 rounded-full">
                          SUMBER KHUSUS
                        </span>
                      </div>

                      {aiSearchError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex items-start gap-2.5">
                          <AlertCircle size={16} className="shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Gagal memproses kueri</p>
                            <p className="mt-0.5 text-slate-400">{aiSearchError}</p>
                          </div>
                        </div>
                      )}

                      {aiSearchLoading && (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
                            <Sparkles size={16} className="absolute inset-0 m-auto text-emerald-400 animate-pulse" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-slate-300 font-sans">Menganalisis Kueri & Database Rujukan...</h5>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
                              Sistem sedang melakukan filtering, penentuan orisinalitas sanad, dan merekomendasikan rujukan yang valid dari database utama.
                            </p>
                          </div>
                        </div>
                      )}

                      {aiSearchResult && (
                        <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                          <div className="markdown-body font-sans space-y-4 text-sm leading-relaxed">
                            <Markdown
                              components={{
                                a: ({ href, children }) => {
                                  const directHref = getDirectExternalLink(href || "");
                                  return (
                                    <a
                                      href={directHref}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-emerald-400 hover:text-emerald-300 underline font-bold transition-all inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 font-sans text-xs align-middle my-0.5 shadow-sm"
                                      title="Kunjungi Situs Rujukan Resmi"
                                    >
                                      <Globe size={11} className="text-emerald-400 animate-pulse" />
                                      {children}
                                    </a>
                                  );
                                }
                              }}
                            >
                              {aiSearchResult}
                            </Markdown>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Identified references list */}
                    <div className="space-y-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <BookText size={14} className="text-emerald-400" /> Sumber Terdeteksi ({aiMatchedCandidates.length})
                        </h4>
                        
                        <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {aiMatchedCandidates.map((lib: any) => {
                            const isCopied = copiedLinkId === lib.id;
                            const link = getDirectExternalLink("/ref/" + lib.id);
                            return (
                              <div key={lib.id} className="bg-slate-950/80 border border-slate-800/60 rounded-xl p-3.5 space-y-2.5 hover:border-slate-700 transition-all">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-[9px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase truncate max-w-[120px]">
                                    {lib.category || 'Pustaka'}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500 truncate max-w-[100px]">{lib.id}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <h5 className="font-bold text-xs text-slate-200 line-clamp-1">{lib.title}</h5>
                                  <p className="text-[10px] text-slate-400">Penerbit/Karya: <span className="text-slate-300 font-semibold">{lib.author}</span></p>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{lib.content}</p>
                                
                                <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(link);
                                      setCopiedLinkId(lib.id);
                                      setTimeout(() => setCopiedLinkId(null), 1500);
                                    }}
                                    className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                                      isCopied 
                                        ? 'bg-emerald-500/10 text-emerald-400' 
                                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                                    }`}
                                  >
                                    {isCopied ? "Tersalin!" : "Salin Link"}
                                  </button>
                                  
                                  <a 
                                    href={link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2 py-1 rounded border border-emerald-500/10 transition-all flex items-center gap-0.5"
                                  >
                                    Buka &rarr;
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                          
                          {aiMatchedCandidates.length === 0 && !aiSearchLoading && (
                            <div className="text-center py-6 text-slate-500 text-xs">
                              Tidak ada rujukan kandidat yang ditampilkan. Masukkan kueri dan cari rujukan di samping.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* GOOGLE DRIVE SYNC SCREEN */
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                      <Cloud size={24} className="animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-100 font-sans text-lg flex items-center gap-2">
                        Sinkronisasi Rujukan Google Drive
                        {userProfile && userProfile.tier !== "Berbayar" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Crown size={10} /> PREMIUM
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                        Hubungkan Google Drive Anda untuk memuat file rujukan, kitab digital, atau naskah kajian secara otonom. Berkas-berkas di dalam folder yang ditentukan akan diunduh, diekstrak, dan diintegrasikan sebagai <strong className="text-emerald-400 font-bold">referensi utama</strong> berprioritas tinggi dalam pencarian dan chatbot Quranica AI.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/60 space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                          Google Drive Folder ID
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsShowingLinkParser(prev => !prev);
                              setParserFeedback(null);
                            }}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                              isShowingLinkParser
                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                                : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <Link size={11} />
                            Ubah Link &rarr; ID
                          </button>
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Aktif: {syncFolderId.substring(0, 8)}...
                          </span>
                        </div>
                      </div>

                      {/* Link Parser Helper Component */}
                      {isShowingLinkParser && (
                        <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                              <Wand2 size={12} className="text-emerald-400" /> Ekstrak ID dari Link Google Drive
                            </h4>
                            <button
                              type="button"
                              onClick={() => setIsShowingLinkParser(false)}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-300 font-mono"
                            >
                              Tutup
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={gdriveLinkInput}
                              onChange={(e) => setGdriveLinkInput(e.target.value)}
                              placeholder="Tempel link/tautan folder Google Drive di sini..."
                              className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-all focus:ring-1 focus:ring-emerald-500/30"
                            />
                            <button
                              type="button"
                              onClick={handleExtractFolderId}
                              className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-1.5 active:scale-95 shrink-0"
                            >
                              <Wand2 size={12} /> Ekstrak ID
                            </button>
                          </div>
                          {parserFeedback && (
                            <p className={`text-[10px] font-medium leading-relaxed ${
                              parserFeedback.startsWith("Berhasil") ? "text-emerald-400" : "text-yellow-500"
                            }`}>
                              {parserFeedback}
                            </p>
                          )}
                          <p className="text-[9px] text-slate-500 leading-relaxed">
                            Tempelkan tautan URL lengkap dari folder Google Drive Anda (misal: <code>https://drive.google.com/drive/folders/...</code>), asisten akan menyaring dan mengisi ID folder secara instan.
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <FolderOpen className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                          <input
                            type="text"
                            value={syncFolderId}
                            onChange={(e) => setSyncFolderId(e.target.value)}
                            disabled={isSyncingDrive}
                            placeholder="Masukkan ID Folder Google Drive..."
                            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-200 outline-none transition-all shadow-inner focus:ring-2 ring-emerald-500/10"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingFolder(prev => !prev);
                            setNewFolderNameInput("");
                          }}
                          disabled={isSyncingDrive}
                          className={`px-4 rounded-xl transition-all flex items-center justify-center shrink-0 active:scale-95 border ${
                            isAddingFolder
                              ? 'bg-emerald-600 border-emerald-500 text-white'
                              : 'bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border-emerald-500/20 hover:border-emerald-500/40'
                          }`}
                          title="Simpan / Tambah ke Pustaka Folder Tersimpan"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Folder default merujuk ke folder referensi utama Quranica. Masukkan ID folder lain dan klik tombol plus (+) untuk menyimpannya ke daftar pustaka tersimpan Anda.
                      </p>
                    </div>

                    {/* Simpan Folder ID Baru Panel */}
                    {isAddingFolder && (
                      <div className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-lg">
                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Plus size={12} className="text-emerald-400" /> Simpan Folder ID ke Pustaka
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase font-mono block">Label / Nama Folder</label>
                            <input
                              type="text"
                              value={newFolderNameInput}
                              onChange={(e) => setNewFolderNameInput(e.target.value)}
                              placeholder="Contoh: Riset Tafsir, Kitab Hadis..."
                              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] text-slate-400 font-bold uppercase font-mono block">ID Folder</label>
                            <input
                              type="text"
                              value={syncFolderId}
                              onChange={(e) => setSyncFolderId(e.target.value)}
                              disabled={isSyncingDrive}
                              placeholder="Masukkan ID Folder..."
                              className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-all focus:ring-1 focus:ring-emerald-500/30"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingFolder(false);
                              setNewFolderNameInput("");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const folderIdClean = syncFolderId.trim();
                              if (!folderIdClean) return;
                              const nameClean = newFolderNameInput.trim() || `Folder-${folderIdClean.substring(0, 6)}`;
                              
                              if (savedFolderIds.some(f => f.id === folderIdClean)) {
                                setSavedFolderIds(prev => prev.map(f => f.id === folderIdClean ? { ...f, name: nameClean } : f));
                              } else {
                                setSavedFolderIds(prev => [...prev, { id: folderIdClean, name: nameClean }]);
                              }
                              setIsAddingFolder(false);
                              setNewFolderNameInput("");
                              addLog(`[System] Folder "${nameClean}" berhasil disimpan ke daftar.`);
                            }}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md"
                          >
                            Simpan ke Daftar
                          </button>
                        </div>
                      </div>
                    )}

                    {/* List of Saved Folder IDs */}
                    {savedFolderIds.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                          Pustaka Folder Tersimpan ({savedFolderIds.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {savedFolderIds.map((folder) => (
                            <div
                              key={folder.id}
                              onClick={() => {
                                if (!isSyncingDrive) {
                                  setSyncFolderId(folder.id);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                syncFolderId === folder.id
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold ring-1 ring-emerald-500/20'
                                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-850 hover:border-slate-800 cursor-pointer'
                              }`}
                            >
                              <span className="truncate max-w-[160px]">{folder.name}</span>
                              <span className="text-[9px] font-mono opacity-50 shrink-0">({folder.id.substring(0, 4)}...)</span>
                              
                              {folder.id !== "1UNrVkFPq5LUfKr9cBvhf630YkDKMQZNn" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSyncingDrive) return;
                                    setSavedFolderIds(prev => prev.filter(f => f.id !== folder.id));
                                    if (syncFolderId === folder.id) {
                                      setSyncFolderId("1UNrVkFPq5LUfKr9cBvhf630YkDKMQZNn");
                                    }
                                    addLog(`[System] Folder "${folder.name}" dihapus dari daftar tersimpan.`);
                                  }}
                                  className="text-slate-500 hover:text-red-400 p-0.5 rounded transition-colors ml-1 shrink-0"
                                  title="Hapus dari daftar"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono block">Status Koneksi</span>
                        {googleUser ? (
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs font-bold text-slate-200">{googleUser.email}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-slate-700"></span>
                            <span className="text-xs font-bold">Belum Terhubung</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {googleUser && (
                          <button
                            type="button"
                            onClick={handleDriveLogout}
                            disabled={isSyncingDrive}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-1.5"
                          >
                            <LogOut size={14} /> Keluar Akun
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleDriveSync}
                          disabled={isSyncingDrive || !syncFolderId.trim()}
                          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                            isSyncingDrive
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20 active:scale-95'
                          }`}
                        >
                          {isSyncingDrive ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Sedang Sinkron...
                            </>
                          ) : googleUser ? (
                            <>
                              <RefreshCw size={14} />
                              Mulai Sinkronisasi Rujukan
                            </>
                          ) : (
                            <>
                              <UploadCloud size={14} />
                              Hubungkan & Sinkronkan
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress & Log Panel */}
                    {(isSyncingDrive || syncFilesCount !== null || syncError) && (
                      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Activity size={12} className="text-emerald-500" /> Hasil & Log Sinkronisasi
                        </h4>
                        
                        <div className="text-xs space-y-1.5">
                          <p className="text-slate-300 font-semibold flex items-center gap-1.5">
                            {isSyncingDrive ? (
                              <RefreshCw size={12} className="animate-spin text-emerald-400" />
                            ) : syncError ? (
                              <AlertCircle size={12} className="text-red-400" />
                            ) : (
                              <CheckCircle size={12} className="text-emerald-400 animate-pulse" />
                            )}
                            {syncStatus}
                          </p>
                          
                          {syncFilesCount !== null && !syncError && (
                            <p className="text-emerald-400/90 font-mono text-[11px] bg-emerald-500/5 border border-emerald-500/10 px-3 py-2 rounded-lg">
                              Sukses! {syncFilesCount} dokumen telah berhasil dimuat sebagai naskah rujukan akademik berprioritas tinggi. Saat mengajukan pertanyaan di tab Tanya Jawab atau Riset, AI akan memprioritaskan dokumen dari Drive Anda ini.
                            </p>
                          )}

                          {syncError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2.5 rounded-lg text-xs flex items-start gap-2">
                              <AlertCircle size={14} className="mt-0.5 shrink-0" />
                              <div className="space-y-1">
                                <p className="font-bold">Gagal Sinkronisasi</p>
                                <p className="text-[11px] leading-relaxed opacity-90">{syncError}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* List Synced Files */}
                {primaryLibraries.filter(lib => lib.id.startsWith("gdrive_")).length > 0 && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <FolderOpen size={14} className="text-emerald-400" /> Dokumen Drive Aktif ({primaryLibraries.filter(lib => lib.id.startsWith("gdrive_")).length})
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase animate-pulse">
                        Referensi Utama
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {primaryLibraries.filter(lib => lib.id.startsWith("gdrive_")).map((lib: any) => {
                        const isCopied = copiedLinkId === lib.id;
                        return (
                          <div
                            key={lib.id}
                            className="bg-slate-900 border border-emerald-500/20 hover:border-emerald-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 flex flex-col justify-between group"
                          >
                            <div className="space-y-3.5">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/25 uppercase truncate">
                                  {lib.category}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 truncate shrink-0">Drive ID</span>
                              </div>

                              <div className="space-y-1">
                                <h3 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors font-sans text-sm line-clamp-2 leading-snug">
                                  {lib.title}
                                </h3>
                                <p className="text-[11px] text-slate-500 font-sans font-medium">
                                  Penyedia: <span className="text-slate-400">{lib.author}</span>
                                </p>
                              </div>

                              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                                {lib.content}
                              </p>
                            </div>

                            <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(lib.externalLink);
                                  setCopiedLinkId(lib.id);
                                  setTimeout(() => setCopiedLinkId(null), 1500);
                                }}
                                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                                  isCopied
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {isCopied ? "Tersalin!" : "Salin Link"}
                              </button>

                              <a
                                href={lib.externalLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3.5 py-1.5 rounded-lg border border-emerald-500/20 hover:border-emerald-500 transition-all flex items-center gap-1"
                              >
                                Buka di Drive &rarr;
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Edukasi Penjelasan Alur Verifikasi */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400 animate-pulse" /> Mekanisme Validasi Sanad & RAG Rujukan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-400 leading-relaxed">
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                    <span className="bg-emerald-500/10 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold">1</span>
                    Retrieval Semantik (RAG)
                  </h4>
                  <p>
                    Saat Anda mengajukan pertanyaan di tab "Tanya Jawab Tafsir" atau memulai "Kajian Mendalam", sistem secara otomatis memindai teks kueri Anda untuk mengidentifikasi kutipan kitab atau isu aqidah tertentu.
                  </p>
                </div>
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                    <span className="bg-emerald-500/10 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold">2</span>
                    Verifikasi Lintas Referensi
                  </h4>
                  <p>
                    Kecerdasan buatan mencocokkan kutipan secara real-time dengan database Jaringan Rujukan Primer, membandingkannya dengan penjelasan asli karya Ibnu Hajar, Ibnu Katsir, maupun manuskrip perpustakaan akademik lainnya.
                  </p>
                </div>
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-900">
                  <h4 className="font-bold text-slate-200 flex items-center gap-1.5 font-sans">
                    <span className="bg-emerald-500/10 text-emerald-400 w-5 h-5 rounded-full flex items-center justify-center font-mono text-xs font-bold">3</span>
                    Kritik Ilmiah Transparan
                  </h4>
                  <p>
                    Hasil analisis dipresentasikan dengan menyisipkan tautan rujukan resmi berkode <code className="text-emerald-400 font-mono">/ref/</code> sehingga Anda dapat memverifikasi orisinalitas teks langsung ke sumber aslinya.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Modal Login & Registrasi Berlangganan */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-slate-900 border border-emerald-500/20 max-w-md w-full rounded-2xl shadow-2xl p-6 md:p-8 space-y-5 relative my-8 animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="text-amber-400 fill-amber-400/20" size={24} />
                <h3 className="text-lg font-bold text-slate-100 font-sans">
                  {loginMode === "login" ? "Masuk ke Akun" : "Daftar Akun Baru"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setLoginError(null);
                }}
                className="text-slate-500 hover:text-slate-300 font-bold font-mono text-sm p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Toggle Login/Register */}
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("login");
                  setLoginError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  loginMode === "login"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Masuk (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("register");
                  setLoginError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition-all ${
                  loginMode === "register"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Daftar (Register)
              </button>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3.5 py-2.5 rounded-xl text-xs text-center">
                {loginError}
              </div>
            )}

            {loginMode === "login" ? (
              /* --- LOGIN FORM --- */
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoginError(null);
                  if (!loginEmail.trim() || !loginPassword) {
                    setLoginError("Silakan isi alamat email dan kata sandi Anda.");
                    return;
                  }
                  
                  setLoginLoading(true);
                  try {
                    const res = await fetch("/api/users/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: loginEmail.trim().toLowerCase(),
                        password: loginPassword
                      })
                    });
                    
                    const data = await res.json();
                    if (res.ok) {
                      setUserProfile(data);
                      saveUserWithExpiry(data);
                      addLog(`[Auth] Berhasil login sebagai: ${data.displayName} (${data.role})`);
                      setShowLoginModal(false);
                      setLoginEmail("");
                      setLoginPassword("");
                    } else {
                      setLoginError(data.error || "Gagal masuk. Periksa email atau password Anda.");
                    }
                  } catch (err: any) {
                    setLoginError(`Koneksi error: ${err.message || err}`);
                  } finally {
                    setLoginLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Alamat Email</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-1 ring-emerald-500/50"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Kata Sandi (Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan kata sandi"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:ring-1 ring-emerald-500/50"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {loginLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} Masuk Sekarang
                </button>
              </form>
            ) : (
              /* --- REGISTER FORM --- */
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoginError(null);
                  
                  if (!loginName.trim()) {
                    setLoginError("Silakan isi nama lengkap Anda.");
                    return;
                  }
                  if (!loginPekerjaan.trim()) {
                    setLoginError("Silakan isi pekerjaan Anda.");
                    return;
                  }
                  if (!loginPhone.trim()) {
                    setLoginError("Silakan isi nomor HP/WhatsApp Anda.");
                    return;
                  }
                  if (!loginEmail.trim() || !loginEmail.includes("@")) {
                    setLoginError("Alamat email tidak valid.");
                    return;
                  }
                  
                  // Password requirements validation
                  if (!loginPassword) {
                    setLoginError("Silakan isi kata sandi Anda.");
                    return;
                  }
                  if (loginPassword.length < 8) {
                    setLoginError("Kata sandi harus minimal terdiri dari 8 karakter.");
                    return;
                  }
                  if (!/\d/.test(loginPassword)) {
                    setLoginError("Kata sandi wajib mengandung setidaknya satu angka (0-9).");
                    return;
                  }
                  if (!/[A-Z]/.test(loginPassword)) {
                    setLoginError("Kata sandi wajib mengandung setidaknya satu huruf besar (A-Z).");
                    return;
                  }
                  if (!/[a-z]/.test(loginPassword)) {
                    setLoginError("Kata sandi wajib mengandung setidaknya satu huruf kecil (a-z).");
                    return;
                  }
                  if (!/[^A-Za-z0-9]/.test(loginPassword)) {
                    setLoginError("Kata sandi wajib mengandung setidaknya satu simbol.");
                    return;
                  }

                  setLoginLoading(true);
                  try {
                    const mockUid = "user_reg_" + Math.random().toString(36).substring(2, 10);
                    const mappedTier = loginTierSelection === "Reguler" ? "Reguler" : "Berbayar";
                    const mappedCycle = loginTierSelection === "Reguler"
                      ? null
                      : (loginTierSelection === "Berbayar_Tahunan" ? "Tahunan" : "Bulanan");

                    const res = await fetch("/api/users/profile", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        uid: mockUid,
                        email: loginEmail.trim().toLowerCase(),
                        displayName: loginName.trim(),
                        tier: mappedTier,
                        billingCycle: mappedCycle,
                        pekerjaan: loginPekerjaan.trim(),
                        phone: loginPhone.trim(),
                        password: loginPassword
                      })
                    });

                    const data = await res.json();
                    if (res.ok) {
                      setUserProfile(data);
                      saveUserWithExpiry(data);
                      addLog(`[Auth] Registrasi berhasil: ${data.displayName} (${data.tier})`);
                      setShowLoginModal(false);
                      
                      // Clear form inputs
                      setLoginName("");
                      setLoginPekerjaan("");
                      setLoginPhone("");
                      setLoginEmail("");
                      setLoginPassword("");
                    } else {
                      setLoginError(data.error || "Gagal melakukan registrasi.");
                    }
                  } catch (err: any) {
                    setLoginError(`Koneksi error: ${err.message || err}`);
                  } finally {
                    setLoginLoading(false);
                  }
                }}
                className="space-y-3 max-h-[350px] overflow-y-auto pr-1"
              >
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Masukkan nama lengkap"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:ring-1 ring-emerald-500/50"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Pekerjaan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Dosen, Mahasiswa, Wiraswasta"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:ring-1 ring-emerald-500/50"
                    value={loginPekerjaan}
                    onChange={(e) => setLoginPekerjaan(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Nomor HP/WhatsApp</label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 08123456789"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:ring-1 ring-emerald-500/50"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Alamat Email</label>
                  <input
                    type="email"
                    required
                    placeholder="nama@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:ring-1 ring-emerald-500/50"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Kata Sandi (Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 8 karakter"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:ring-1 ring-emerald-500/50"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                  
                  {/* Password Checklist UI */}
                  <div className="mt-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-850 space-y-1 text-[9px]">
                    <div className="grid grid-cols-2 gap-1">
                      <div className="flex items-center gap-1">
                        <span className={loginPassword.length >= 8 ? "text-emerald-400 font-bold" : "text-slate-600"}>
                          {loginPassword.length >= 8 ? "✓" : "○"}
                        </span>
                        <span className={loginPassword.length >= 8 ? "text-slate-300" : "text-slate-500"}>Min. 8 Karakter</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={/\d/.test(loginPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>
                          {/\d/.test(loginPassword) ? "✓" : "○"}
                        </span>
                        <span className={/\d/.test(loginPassword) ? "text-slate-300" : "text-slate-500"}>Ada Angka (0-9)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={/[A-Z]/.test(loginPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>
                          {/[A-Z]/.test(loginPassword) ? "✓" : "○"}
                        </span>
                        <span className={/[A-Z]/.test(loginPassword) ? "text-slate-300" : "text-slate-500"}>Ada Huruf Besar (A-Z)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={/[a-z]/.test(loginPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>
                          {/[a-z]/.test(loginPassword) ? "✓" : "○"}
                        </span>
                        <span className={/[a-z]/.test(loginPassword) ? "text-slate-300" : "text-slate-500"}>Ada Huruf Kecil (a-z)</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <span className={/[^A-Za-z0-9]/.test(loginPassword) ? "text-emerald-400 font-bold" : "text-slate-600"}>
                          {/[^A-Za-z0-9]/.test(loginPassword) ? "✓" : "○"}
                        </span>
                        <span className={/[^A-Za-z0-9]/.test(loginPassword) ? "text-slate-300" : "text-slate-500"}>Ada Simbol (contoh: @, #, $, dll)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-400">Pilih Paket Keanggotaan</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginTierSelection("Reguler")}
                      className={`p-2 rounded-lg border text-[10px] font-bold text-center transition-all ${
                        loginTierSelection === "Reguler"
                          ? "bg-slate-950 border-slate-500 text-slate-300"
                          : "bg-slate-950/40 border-slate-800 text-slate-500"
                      }`}
                    >
                      Reguler (Gratis)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginTierSelection("Berbayar_Bulanan")}
                      className={`p-2 rounded-lg border text-[10px] font-bold text-center transition-all ${
                        loginTierSelection === "Berbayar_Bulanan"
                          ? "bg-slate-950 border-amber-500 text-amber-400"
                          : "bg-slate-950/40 border-slate-800 text-slate-500"
                      }`}
                    >
                      Premium (1 Bulan)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginTierSelection("Berbayar_Tahunan")}
                      className={`p-2 rounded-lg border text-[10px] font-bold text-center transition-all ${
                        loginTierSelection === "Berbayar_Tahunan"
                          ? "bg-slate-950 border-purple-500 text-purple-400"
                          : "bg-slate-950/40 border-slate-800 text-slate-500"
                      }`}
                    >
                      Platinum (1 Tahun)
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-3 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {loginLoading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />} Daftar Akun Baru
                </button>
              </form>
            )}

            <p className="text-[10px] text-slate-500 text-center leading-normal">
              Quranica AI memproses seluruh kredensial dengan protokol keamanan end-to-end terenkripsi tanpa menggunakan integrasi pendaftaran pihak ketiga Google.
            </p>
          </div>
        </div>
      )}
      {activeTab === 'hijaiyah' && <HijaiyahPanel />}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Progress Khatam Al-Baqarah */}
          {userProfile && (() => {
            const baqarahKey = `quranica_baqarah_${userProfile.uid}`;
            const baqarahDone: number[] = (() => { try { return JSON.parse(localStorage.getItem(baqarahKey) || '[]'); } catch { return []; } })();
            const baqarahTotal = 286;
            const baqarahPct = Math.round((baqarahDone.length / baqarahTotal) * 100);
            const isKhatam = baqarahDone.length >= baqarahTotal;
            return (
              <div className={`bg-slate-900 border rounded-2xl p-6 shadow-xl ${isKhatam ? 'border-amber-500/40' : 'border-slate-800'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${isKhatam ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}>
                    {isKhatam ? <Crown size={22} className="text-amber-400" /> : <BookOpen size={22} className="text-emerald-400" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">
                      {isKhatam ? '🎉 Khatam Al-Baqarah!' : 'Progress Khatam Al-Baqarah'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {isKhatam ? 'Semua 286 ayat selesai tanpa kesalahan!' : `Bacaan sempurna (Mumtaz) per ayat — ${baqarahDone.length}/${baqarahTotal} ayat`}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                    <span>{baqarahPct}% selesai</span>
                    <span>{baqarahDone.length} / {baqarahTotal} ayat</span>
                  </div>
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${isKhatam ? 'bg-gradient-to-r from-amber-400 to-yellow-300' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`}
                      style={{ width: `${baqarahPct}%` }}
                    />
                  </div>
                </div>

                {/* Mini grid — ayat selesai */}
                {baqarahDone.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-3 max-h-[80px] overflow-y-auto">
                    {baqarahDone.sort((a,b)=>a-b).map(n => (
                      <span key={n} className="w-5 h-5 flex items-center justify-center text-[8px] font-bold bg-emerald-500/20 text-emerald-400 rounded">✓</span>
                    ))}
                  </div>
                )}

                {/* Khatam Certificate */}
                {isKhatam && (
                  <button
                    onClick={() => {
                      const certHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Khatam Al-Baqarah - ${userProfile.displayName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh}
  .cert{width:800px;padding:50px 45px;border:8px double #b45309;border-radius:20px;text-align:center;background:linear-gradient(135deg,#fffbeb 0%,#fef3c7 50%,#fffbeb 100%);position:relative}
  .cert::before{content:'';position:absolute;inset:12px;border:2px solid #fcd34d;border-radius:12px;pointer-events:none}
  .logo{font-size:26px;font-weight:700;color:#b45309;margin-bottom:8px}
  .subtitle{font-size:11px;color:#92400e;text-transform:uppercase;letter-spacing:4px;margin-bottom:20px}
  .icon{font-size:50px;margin-bottom:10px}
  .title{font-size:28px;font-family:'Amiri',serif;color:#78350f;margin-bottom:5px;font-weight:700}
  .title-en{font-size:12px;color:#a16207;text-transform:uppercase;letter-spacing:2px;margin-bottom:25px}
  .to{font-size:14px;color:#92400e;margin-bottom:5px}
  .name{font-size:34px;font-weight:700;color:#451a03;font-family:'Amiri',serif;margin-bottom:5px}
  .email{font-size:12px;color:#a16207;margin-bottom:20px}
  .achievement{font-size:14px;color:#b45309;font-weight:600;margin-bottom:20px;padding:10px 20px;border:1px dashed #d97706;display:inline-block;border-radius:8px}
  .info{display:flex;justify-content:center;gap:40px;font-size:11px;color:#92400e;margin-bottom:20px}
  .info b{color:#b45309}
  .desc{font-size:12px;color:#92400e;font-style:italic;line-height:1.7;max-width:500px;margin:0 auto 25px}
  .footer{font-size:10px;color:#a16207}
  .stamp{font-size:70px;opacity:0.08;position:absolute;bottom:20px;right:50px}
  @media print{body{background:#fff}.cert{box-shadow:none;border-color:#b45309}}
</style></head><body>
<div class="cert">
  <div class="stamp">🏆</div>
  <div class="icon">🌟</div>
  <div class="logo">🏛️ Quranica AI</div>
  <div class="subtitle">E-Tahsin Certification Authority</div>
  <div class="title">شهادة ختم سورة البقرة</div>
  <div class="title-en">Certificate of Surah Al-Baqarah Completion</div>
  <p class="to">Dengan ini dinyatakan bahwa:</p>
  <p class="name">${userProfile.displayName}</p>
  <p class="email">${userProfile.email}</p>
  <div class="achievement">🏆 Telah Menyelesaikan 286 Ayat Surah Al-Baqarah Tanpa Kesalahan</div>
  <div class="info">
    <span>Tingkat: <b>${getTierDisplay(userProfile.tier, userProfile.billingCycle)}</b></span>
    <span>Tanggal: <b>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></span>
  </div>
  <p class="desc">Prestasi ini menunjukkan dedikasi dan ketekunan dalam menyempurnakan bacaan Al-Quran. Semoga menjadi amal jariyah dan keberkahan di dunia dan akhirat.</p>
  <p class="footer">© ${new Date().getFullYear()} Quranica AI — Platform Evaluasi Tahsin Berbasis AI</p>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
                      const w = window.open('', '_blank', 'width=900,height=700');
                      if (w) { w.document.write(certHTML); w.document.close(); }
                    }}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-amber-900 font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Printer size={16} /> Cetak Sertifikat Khatam Al-Baqarah 🏆
                  </button>
                )}
              </div>
            );
          })()}

          {/* Sertifikat Tahsin Umum */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <Award size={22} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-200">Sertifikat Tahsin</h3>
                <p className="text-xs text-slate-500">Bukti pencapaian evaluasi tilawah Anda</p>
              </div>
            </div>

            {userProfile ? (
              <>
                <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-teal-950/40 border-2 border-emerald-500/20 rounded-xl p-6 mb-4 text-center">
                  <div className="text-amber-400 text-4xl mb-3">📜</div>
                  <h4 className="text-lg font-serif font-bold text-emerald-300 mb-1">Syahadah Tahsin Al-Quran</h4>
                  <p className="text-[10px] text-emerald-500/60 uppercase tracking-widest mb-4">Certificate of Quranic Recitation Excellence</p>
                  <div className="border-t border-emerald-500/10 pt-4 space-y-2 text-sm">
                    <p className="text-slate-300">Diberikan kepada:</p>
                    <p className="text-xl font-bold text-white font-serif">{userProfile.displayName}</p>
                    <p className="text-xs text-slate-400">{userProfile.email}</p>
                    <div className="flex justify-center gap-6 mt-3 text-[10px] text-slate-500">
                      <span>Tier: <b className="text-emerald-400">{getTierDisplay(userProfile.tier, userProfile.billingCycle)}</b></span>
                      <span>Terbit: <b className="text-slate-400">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></span>
                    </div>
                  </div>
                  <div className="border-t border-emerald-500/10 mt-4 pt-3">
                    <p className="text-[11px] text-slate-400 italic leading-relaxed">
                      "Sertifikat ini menandakan bahwa pemilik telah menyelesaikan evaluasi tahsin dan berkomitmen 
                      untuk terus memperbaiki bacaan Al-Quran sesuai kaidah tajwid yang benar."
                    </p>
                  </div>
                </div>
                <button onClick={() => {
                  const certHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Sertifikat Tahsin - ${userProfile.displayName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;background:#fff;display:flex;justify-content:center;align-items:center;min-height:100vh}
  .cert{width:800px;padding:60px 50px;border:8px double #059669;border-radius:20px;text-align:center;background:linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 50%,#ecfdf5 100%);position:relative}
  .cert::before{content:'';position:absolute;inset:12px;border:2px solid #a7f3d0;border-radius:12px;pointer-events:none}
  .logo{font-size:28px;font-weight:700;color:#059669;margin-bottom:10px}
  .subtitle{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:4px;margin-bottom:30px}
  .title{font-size:26px;font-family:'Amiri',serif;color:#047857;margin-bottom:8px;font-weight:700}
  .title-en{font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;margin-bottom:30px}
  .to{font-size:14px;color:#6b7280;margin-bottom:5px}
  .name{font-size:32px;font-weight:700;color:#064e3b;font-family:'Amiri',serif;margin-bottom:5px}
  .email{font-size:12px;color:#9ca3af;margin-bottom:25px}
  .info{display:flex;justify-content:center;gap:40px;font-size:11px;color:#6b7280;margin-bottom:25px}
  .info b{color:#059669}
  .desc{font-size:12px;color:#6b7280;font-style:italic;line-height:1.7;max-width:500px;margin:0 auto 30px}
  .footer{font-size:10px;color:#9ca3af}
  .stamp{font-size:60px;opacity:0.1;position:absolute;bottom:30px;right:60px}
  @media print{body{background:#fff}.cert{box-shadow:none;border-color:#059669}}
</style></head><body>
<div class="cert"><div class="stamp">📜</div><div class="logo">🏛️ Quranica AI</div><div class="subtitle">E-Tahsin Certification Authority</div><div class="title">شهادة تحسين القرآن</div><div class="title-en">Certificate of Quranic Recitation Excellence</div>
<p class="to">Diberikan kepada:</p><p class="name">${userProfile.displayName}</p><p class="email">${userProfile.email}</p>
<div class="info"><span>Tingkat: <b>${getTierDisplay(userProfile.tier, userProfile.billingCycle)}</b></span><span>Tanggal: <b>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</b></span></div>
<p class="desc">Sertifikat ini menandakan bahwa pemilik telah menyelesaikan evaluasi tahsin dan berkomitmen untuk terus memperbaiki bacaan Al-Quran sesuai kaidah tajwid yang benar.</p>
<p class="footer">© ${new Date().getFullYear()} Quranica AI — Platform Evaluasi Tahsin Berbasis AI</p></div>
<script>window.onload=()=>window.print()</script></body></html>`;
                  const w = window.open('', '_blank', 'width=900,height=700');
                  if (w) { w.document.write(certHTML); w.document.close(); }
                }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                >
                  <Printer size={16} /> Cetak Sertifikat
                </button>
              </>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <User size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Silakan <button onClick={() => setShowLoginModal(true)} className="text-emerald-400 underline">masuk</button> terlebih dahulu untuk mencetak sertifikat.</p>
              </div>
            )}
          </div>

          {/* Informasi Akun */}
          {userProfile && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                <User size={18} className="text-emerald-400" /> Informasi Akun
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-slate-400">Nama</span>
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs w-32 outline-none focus:border-emerald-500"
                        autoFocus
                      />
                      <button onClick={handleSaveName} className="p-1 text-emerald-400 hover:text-emerald-300">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setIsEditingName(false)} className="p-1 text-slate-500 hover:text-slate-300">
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-200 font-medium">{userProfile.displayName}</span>
                      <button
                        onClick={() => { setEditNameValue(userProfile.displayName); setIsEditingName(true); }}
                        className="p-0.5 text-slate-600 hover:text-emerald-400 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-slate-400">Email</span>
                  <span className="text-slate-200 font-medium text-xs">{userProfile.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-slate-400">Tier</span>
                  <span className={`font-bold ${userProfile.tier === 'Berbayar' ? (userProfile.billingCycle === 'Tahunan' ? 'text-purple-400' : 'text-amber-400') : 'text-slate-400'}`}>
                    {getTierDisplay(userProfile.tier, userProfile.billingCycle)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-800/50">
                  <span className="text-slate-400">Role</span>
                  <span className="text-slate-200 font-medium">{userProfile.role}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Bergabung</span>
                  <span className="text-slate-200 font-medium text-xs">{new Date(userProfile.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Bottom Navigation Bar — klik saja, tanpa geser (Phone Only) */}
      {isPhonePreview && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-[90] safe-area-inset-bottom">
          <div className="flex items-center justify-around py-2 px-1">
            {phoneTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex flex-col items-center gap-0.5 min-w-[48px] py-0.5 transition-all duration-200 active:scale-90 ${
                    isActive 
                      ? 'text-emerald-400' 
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-emerald-500/10' : ''}`}>
                    <Icon size={20} />
                  </div>
                  <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="h-5" />
        </div>
      )}

      {/* Bottom padding for phone mode so content isn't hidden behind nav */}
      <div className="h-20" />
    </div>
  );
}

export default App;
